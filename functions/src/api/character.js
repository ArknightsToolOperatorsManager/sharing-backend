// キャラクターデータ関連のAPI実装

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const db = admin.firestore();

// ユーティリティ関数のインポート
const { processOperatorData } = require('../utils/dataProcessor');
const { generateUniqueId } = require('../utils/idGenerator');

/**
 * キャラクターデータを保存するCallable関数
 */
exports.saveCharacterData = functions.https.onCall(async (data, context) => {
  try {
    // 入力データのバリデーション
    if (!data || !data.data) {
      throw new functions.https.HttpsError('invalid-argument', 'データが提供されていません');
    }
    
    // データを処理して必要な情報だけを抽出
    const processedData = processOperatorData(data.data);
    
    // データが空の場合はエラー
    if (processedData.length === 0) {
      throw new functions.https.HttpsError('invalid-argument', '有効なキャラクターデータがありません');
    }
    
    // ユニークなIDを生成（6文字）
    const uniqueId = await generateUniqueId();
    
    // Firestoreにデータを保存
    await db.collection('characterData').doc(uniqueId).set({
      characters: processedData,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      expiresAt: admin.firestore.Timestamp.fromDate(
        new Date(Date.now() + 1000 * 60 * 60 * 24 * 365 * 2) // 2年後
      )
    });
    
    // 生成されたIDを返す
    return { id: uniqueId };
  } catch (error) {
    console.error('データ保存エラー:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

/**
 * キャラクターデータを取得するCallable関数
 */
exports.getCharacterData = functions.https.onCall(async (data, context) => {
  try {
    // IDのバリデーション
    if (!data || !data.id) {
      throw new functions.https.HttpsError('invalid-argument', 'IDが提供されていません');
    }
    
    // Firestoreからデータを取得
    const doc = await db.collection('characterData').doc(data.id).get();
    
    if (!doc.exists) {
      throw new functions.https.HttpsError('not-found', 'データが見つかりませんでした');
    }
    
    // データを返す
    return doc.data();
  } catch (error) {
    console.error('データ取得エラー:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

/**
 * HTTP経由でデータを保存するハンドラー
 */
exports.handleSaveRequest = async (req, res) => {
  // POSTリクエストのみ許可
  if (req.method !== 'POST') {
    return res.status(405).send({ error: 'Method Not Allowed' });
  }
  
  try {
    // データが提供されているか確認
    if (!req.body) {
      return res.status(400).send({ error: 'リクエストにデータがありません' });
    }
    
    // データを処理して必要な情報だけを抽出
    const processedData = processOperatorData(req.body);
    
    // データが空の場合はエラー
    if (processedData.length === 0) {
      return res.status(400).send({ error: '有効なキャラクターデータがありません' });
    }
    
    // ユニークなIDを生成（6文字）
    const uniqueId = await generateUniqueId();
    
    // Firestoreにデータを保存
    await db.collection('characterData').doc(uniqueId).set({
      characters: processedData,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      expiresAt: admin.firestore.Timestamp.fromDate(
        new Date(Date.now() + 1000 * 60 * 60 * 24 * 365 * 2) // 2年後
      )
    });
    
    // 生成されたIDを返す
    return res.status(200).json({ id: uniqueId });
  } catch (error) {
    console.error('データ保存エラー:', error);
    return res.status(500).send({ error: 'データの保存に失敗しました: ' + error.message });
  }
};

/**
 * HTTP経由でデータを取得するハンドラー
 */
exports.handleGetRequest = async (req, res) => {
  // GETリクエストのみ許可
  if (req.method !== 'GET') {
    return res.status(405).send({ error: 'Method Not Allowed' });
  }
  
  try {
    // URLクエリからIDを取得
    const id = req.query.id;
    if (!id) {
      return res.status(400).send({ error: 'IDパラメータが必要です' });
    }
    
    // Firestoreからデータを取得
    const doc = await db.collection('characterData').doc(id).get();
    
    if (!doc.exists) {
      return res.status(404).send({ error: 'データが見つかりませんでした' });
    }
    
    // データを返す
    return res.status(200).json(doc.data());
  } catch (error) {
    console.error('データ取得エラー:', error);
    return res.status(500).send({ error: 'データの取得に失敗しました: ' + error.message });
  }
};

/**
 * 期限切れのデータをクリーンアップする関数
 */
exports.cleanupExpiredData = async () => {
  try {
    const now = admin.firestore.Timestamp.now();
    const expiredRef = await db.collection('characterData')
      .where('expiresAt', '<', now)
      .get();
    
    if (expiredRef.empty) {
      console.log('期限切れのデータはありません');
      return null;
    }
    
    const batch = db.batch();
    expiredRef.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();
    console.log(`${expiredRef.docs.length}件の期限切れデータを削除しました`);
    return null;
  } catch (error) {
    console.error('クリーンアップエラー:', error);
    return null;
  }
};