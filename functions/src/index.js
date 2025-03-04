// メインエントリーポイント

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const cors = require('cors')({ origin: true });

// Firebase初期化
admin.initializeApp();

// APIエンドポイント
const charactersApi = require('./api/character');

// Callable関数のエクスポート
exports.saveCharacterData = charactersApi.saveCharacterData;
exports.getCharacterData = charactersApi.getCharacterData;

// HTTPリクエスト対応関数のエクスポート
exports.saveCharacterDataHttp = functions.https.onRequest((req, res) => {
  return cors(req, res, async () => {
    try {
      return await charactersApi.handleSaveRequest(req, res);
    } catch (error) {
      console.error('API error:', error);
      return res.status(500).send({ error: 'Internal server error' });
    }
  });
});

exports.getCharacterDataHttp = functions.https.onRequest((req, res) => {
  return cors(req, res, async () => {
    try {
      return await charactersApi.handleGetRequest(req, res);
    } catch (error) {
      console.error('API error:', error);
      return res.status(500).send({ error: 'Internal server error' });
    }
  });
});

// データクリーンアップスケジュール (1日1回実行)
exports.cleanupExpiredData = functions.pubsub.schedule('0 0 * * *').onRun(async () => {
  return await charactersApi.cleanupExpiredData();
});