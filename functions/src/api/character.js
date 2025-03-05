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
    if (!data) {
      throw new functions.https.HttpsError('invalid-argument', 'データが提供されていません');
    }
    
    // IDが提供されているか確認（更新ケース）
    const existingId = data.id;
    // データ部分の取得
    const characterData = data.data || data;
    
    // データを処理して必要な情報だけを抽出
    const processedData = processOperatorData(characterData);
    
    // データが空の場合はエラー
    if (processedData.length === 0) {
      throw new functions.https.HttpsError('invalid-argument', '有効なキャラクターデータがありません');
    }
    
    let docId;
    const now = admin.firestore.FieldValue.serverTimestamp();
    const fiveYearsLater = admin.firestore.Timestamp.fromDate(
      new Date(Date.now() + 1000 * 60 * 60 * 24 * 365 * 5) // 5年後
    );
    
    if (existingId) {
      // 既存IDが提供された場合は、そのドキュメントが存在するか確認
      const docRef = db.collection('characterData').doc(existingId);
      const doc = await docRef.get();
      
      if (doc.exists) {
        // ドキュメントが存在する場合は更新
        await docRef.update({
          characters: processedData,
          updatedAt: now,
          expiresAt: fiveYearsLater
        });
        docId = existingId;
      } else {
        // 指定されたIDが存在しない場合は新規作成
        docId = await generateUniqueId();
        await db.collection('characterData').doc(docId).set({
          characters: processedData,
          createdAt: now,
          updatedAt: now,
          expiresAt: fiveYearsLater
        });
      }
    } else {
      // IDが提供されていない場合は新規作成
      docId = await generateUniqueId();
      await db.collection('characterData').doc(docId).set({
        characters: processedData,
        createdAt: now,
        updatedAt: now,
        expiresAt: fiveYearsLater
      });
    }
    
    // 生成または使用されたIDを返す
    return { id: docId };
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
    
    // IDが提供されているか確認（更新ケース）
    const existingId = req.body.id;
    // データ部分の取得（idがプロパティとして含まれる場合とそうでない場合に対応）
    const characterData = req.body.data || req.body;
    
    // データを処理して必要な情報だけを抽出
    const processedData = processOperatorData(characterData);
    
    // データが空の場合はエラー
    if (processedData.length === 0) {
      return res.status(400).send({ error: '有効なキャラクターデータがありません' });
    }
    
    let docId;
    const now = admin.firestore.FieldValue.serverTimestamp();
    const fiveYearsLater = admin.firestore.Timestamp.fromDate(
      new Date(Date.now() + 1000 * 60 * 60 * 24 * 365 * 5) // 5年後
    );
    
    if (existingId) {
      // 既存IDが提供された場合は、そのドキュメントが存在するか確認
      const docRef = db.collection('characterData').doc(existingId);
      const doc = await docRef.get();
      
      if (doc.exists) {
        // ドキュメントが存在する場合は更新
        await docRef.update({
          characters: processedData,
          updatedAt: now,
          expiresAt: fiveYearsLater
        });
        docId = existingId;
        console.log(`ID ${existingId} のデータを更新しました`);
      } else {
        // 指定されたIDが存在しない場合は新規作成
        docId = await generateUniqueId();
        await db.collection('characterData').doc(docId).set({
          characters: processedData,
          createdAt: now,
          updatedAt: now,
          expiresAt: fiveYearsLater
        });
        console.log(`ID ${existingId} は存在しないため、新規ID ${docId} を作成しました`);
      }
    } else {
      // IDが提供されていない場合は新規作成
      docId = await generateUniqueId();
      await db.collection('characterData').doc(docId).set({
        characters: processedData,
        createdAt: now,
        updatedAt: now,
        expiresAt: fiveYearsLater
      });
      console.log(`新規ID ${docId} でデータを作成しました`);
    }
    
    // 生成または使用されたIDを返す
    return res.status(200).json({ id: docId });
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
 * 最終更新から5年経過したデータを削除
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