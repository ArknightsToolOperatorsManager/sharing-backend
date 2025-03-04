/**
 * キャラクターデータを処理するユーティリティ関数
 */

/**
 * 入力データから必要な情報だけを抽出し、整形する
 * @param {Object|Array} data 入力データ（単一オブジェクトまたは配列）
 * @returns {Array} 処理済みのデータ配列
 */
exports.processOperatorData = (data) => {
    // 配列でない場合は配列に変換
    if (!Array.isArray(data)) {
      data = [data];
    }
    
    // 必要なデータだけを抽出
    return data.map(item => {
      // nullチェック
      if (!item) return null;
      
      try {
        // コードの取得（大文字小文字を区別しない）
        const code = item.Code || item.code || '';
        if (!code) return null; // コードがない場合はスキップ
        
        // 潜在の取得と数値変換
        let potential = item.Potential || item.potential || '1';
        potential = parseInt(potential) || 1;
        
        // 現在のレベル情報を取得
        const currentLevel = item.CurrentLevel || item.currentLevel || {};
        
        // 必要なデータを抽出して返す
        return {
          code: code,
          potential: potential,
          elite: parseInt(currentLevel.Elite || currentLevel.elite) || 0,
          level: parseInt(currentLevel.Level || currentLevel.level) || 1,
          skill: parseInt(currentLevel.Skill || currentLevel.skill) || 7,
          skill1: parseInt(currentLevel.Skill1 || currentLevel.skill1) || 0,
          skill2: parseInt(currentLevel.Skill2 || currentLevel.skill2) || 0,
          skill3: parseInt(currentLevel.Skill3 || currentLevel.skill3) || 0,
          moduleX: parseInt(currentLevel.ModuleX || currentLevel.moduleX) || 0,
          moduleY: parseInt(currentLevel.ModuleY || currentLevel.moduleY) || 0,
          moduleD: parseInt(currentLevel.ModuleD || currentLevel.moduleD) || 0,
          moduleA: parseInt(currentLevel.ModuleA || currentLevel.moduleA) || 0
        };
      } catch (error) {
        console.error('データ処理エラー:', error, 'データ:', item);
        return null;
      }
    }).filter(item => item !== null); // nullの項目を除外
  };
  
  /**
   * バリデーション関数 - 入力データの形式を検証
   * @param {Object} data 検証するデータ
   * @returns {boolean} データが有効かどうか
   */
  exports.validateInputData = (data) => {
    // データが存在するか
    if (!data) return false;
    
    // 配列の場合は各要素を検証
    if (Array.isArray(data)) {
      // 空配列はNG
      if (data.length === 0) return false;
      // 少なくとも1つの有効要素があればOK
      return data.some(item => validateSingleItem(item));
    }
    
    // オブジェクトの場合は直接検証
    return validateSingleItem(data);
  };
  
  /**
   * 単一アイテムの検証
   * @param {Object} item 検証する単一アイテム
   * @returns {boolean} アイテムが有効かどうか
   */
  function validateSingleItem(item) {
    // 基本的な形式チェック
    if (!item) return false;
    if (!item.Code && !item.code) return false;
    
    // CurrentLevelが存在するか
    const currentLevel = item.CurrentLevel || item.currentLevel;
    if (!currentLevel) return false;
    
    return true;
  }