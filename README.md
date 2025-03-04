# Arknights Viewer Backend

Firebase バックエンドサービスを提供するリポジトリです。キャラクターデータの保存、共有URLの生成、データ取得APIを提供します。

## 機能

- 外部APIからのキャラクターデータ受信
- データの処理・整形
- Firestoreへのデータ保存
- 共有用の短いIDの生成
- ID経由でのデータ取得

## 技術スタック

- Firebase Cloud Functions
- Firestore データベース
- Node.js

## API仕様

### データ保存API

**エンドポイント:** POST https://asia-northeast1-arknights-sharing-view.cloudfunctions.net/saveCharacterDataHttp

**リクエスト形式:**
```json
{
  "Code": "LM04",
  "Rarity": 6,
  "Potential": "3",
  "Trust": null,
  "Paradox": false,
  "CurrentLevel": {
    "Rarity": 6,
    "Elite": 2,
    "Level": 51,
    "Skill": 7,
    "Skill1": 3,
    "Skill2": 0,
    "Skill3": 0,
    "ModuleX": 0,
    "ModuleY": 0,
    "ModuleD": 0,
    "ModuleA": 0
  }
}
```

**レスポンス形式:**
```json
{
  "id": "abc123"
}
```

### データ取得API

※現在こちらは利用できません。
**エンドポイント:** GET https://asia-northeast1-arknights-sharing-view.cloudfunctions.net/getCharacterDataHttp?id={dataId}

**レスポンス形式:**
```json
{
  "characters": [
    {
      "code": "LM04",
      "potential": 3,
      "elite": 2,
      "level": 51,
      "skill": 7,
      "skill1": 3,
      "skill2": 0,
      "skill3": 0,
      "moduleX": 0,
      "moduleY": 0,
      "moduleD": 0,
      "moduleA": 0
    }
  ],
  "createdAt": "Timestamp",
  "expiresAt": "Timestamp"
}
```

## ライセンス

MIT
