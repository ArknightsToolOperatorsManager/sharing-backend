/**
 * ユニークID生成のためのユーティリティ関数
 */

const crypto = require('crypto');
const admin = require('firebase-admin');
const db = admin.firestore();

/**
 * 指定された長さのユニークなIDを生成する
 * Firestoreでの重複チェック付き
 * 
 * @param {number} length ID文字列の長さ (デフォルト: 6)
 * @returns {Promise<string>} 生成されたユニークID
 */
exports.generateUniqueId = async (length = 6) => {
  let uniqueId;
  let isUnique = false;
  let attempts = 0;
  const maxAttempts = 10; // 最大試行回数
  
  // 使用文字: 英数字（大文字小文字）から紛らわしい文字を除外
  const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  
  // ユニークなIDが生成されるまで繰り返す
  while (!isUnique && attempts < maxAttempts) {
    attempts++;
    
    // ランダムバイトを生成して文字に変換
    const randomBytes = crypto.randomBytes(length);
    let result = '';
    
    for (let i = 0; i < length; i++) {
      // バイト値を文字列の長さで割った余りをインデックスとして使用
      const randomIndex = randomBytes[i] % characters.length;
      result += characters.charAt(randomIndex);
    }
    
    uniqueId = result;
    
    // Firestoreで重複チェック
    const docRef = db.collection('characterData').doc(uniqueId);
    const doc = await docRef.get();
    
    // ドキュメントが存在しなければユニーク
    if (!doc.exists) {
      isUnique = true;
    }
  }
  
  // 最大試行回数に達した場合
  if (!isUnique) {
    // タイムスタンプと乱数を混ぜてユニークさを高める
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 5);
    uniqueId = timestamp.substring(timestamp.length - 3) + random;
  }
  
  return uniqueId;
};

/**
 * 指定された長さのランダムな文字列を生成する (重複チェックなし)
 * 
 * @param {number} length 文字列の長さ
 * @returns {string} 生成されたランダム文字列
 */
exports.generateRandomString = (length = 6) => {
  // 使用文字: 英数字（大文字小文字）から紛らわしい文字を除外
  const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  
  // ランダムバイトを生成して文字に変換
  const randomBytes = crypto.randomBytes(length);
  let result = '';
  
  for (let i = 0; i < length; i++) {
    // バイト値を文字列の長さで割った余りをインデックスとして使用
    const randomIndex = randomBytes[i] % characters.length;
    result += characters.charAt(randomIndex);
  }
  
  return result;
};