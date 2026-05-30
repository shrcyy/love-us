/**
 * LeanCloud 云端数据同步模块
 * 使用 LeanCloud 国际版 (avoscloud.us) 实现文字数据的云端读写同步
 * 图片仍用 localStorage base64（LeanCloud 免费额度不适合存大文件）
 *
 * 前置依赖：需在 HTML 中先加载 LeanCloud SDK CDN
 *   <script src="https://cdn.jsdelivr.net/npm/leancloud-storage@4.15.2/dist/av-min.js"></script>
 *
 * 数据模型：LoveData 表
 *   - spaceHash: 空间标识（与 localStorage key 中的 hash 一致）
 *   - dataKey:   数据键名（如 'main' 表示主数据）
 *   - dataValue: JSON 字符串（实际数据）
 *   - updatedAt: 自动维护的更新时间
 */

(function () {
  'use strict';

  /* ================================================================
   * 配置
   * ================================================================ */
  var APP_ID = 'Xmgno5FGNk9DZQ5KGF2pzg5B-gzGzoHsz';
  var APP_KEY = 'Om8Czq0DWmhhnQx5xHrpQu2k';
  var SERVER_URL = 'https://xmgno5fgn.lc-cn-n1-shared.com';
  var CLASS_NAME = 'LoveData';

  var _initialized = false;
  var _lastSyncTime = null;  // 最近成功同步时间戳（毫秒）
  var _syncInProgress = false;

  /**
   * 初始化 LeanCloud SDK（幂等，多次调用安全）
   */
  function _init() {
    if (_initialized) return;
    if (typeof AV === 'undefined') {
      console.warn('[Cloud] LeanCloud SDK (AV) 未加载，请检查 CDN 脚本');
      return;
    }
    AV.init({ appId: APP_ID, appKey: APP_KEY, serverURL: SERVER_URL });
    _initialized = true;
    console.log('[Cloud] LeanCloud 初始化完成');
  }

  /* ================================================================
   * 公开 API
   * ================================================================ */

  /**
   * cloudSave(key, value) → Promise<boolean>
   * 将数据保存到 LeanCloud LoveData 表。
   * - 若已有同 spaceHash+dataKey 的记录则更新，否则新建。
   * - 返回 true 表示保存成功，false 表示失败。
   */
  function cloudSave(key, value) {
    return new Promise(function (resolve) {
      _init();
      if (!_initialized) { resolve(false); return; }

      var spaceHash = window.getSpaceHash ? window.getSpaceHash() : 'default';
      var dataValue = typeof value === 'string' ? value : JSON.stringify(value);

      // 先查询是否已有记录
      var query = new AV.Query(CLASS_NAME);
      query.equalTo('spaceHash', spaceHash);
      query.equalTo('dataKey', key);
      query.first().then(function (obj) {
        if (obj) {
          // 已有记录 → 更新
          obj.set('dataValue', dataValue);
          return obj.save();
        } else {
          // 无记录 → 新建
          var LoveData = AV.Object.extend(CLASS_NAME);
          var record = new LoveData();
          record.set('spaceHash', spaceHash);
          record.set('dataKey', key);
          record.set('dataValue', dataValue);
          return record.save();
        }
      }).then(function () {
        _lastSyncTime = Date.now();
        console.log('[Cloud] 保存成功: ' + key);
        resolve(true);
      }).catch(function (err) {
        console.error('[Cloud] 保存失败: ' + key, err);
        resolve(false);
      });
    });
  }

  /**
   * cloudLoad(key) → Promise<object|null>
   * 从 LeanCloud 读取指定 key 的数据。
   * - 返回解析后的 JSON 对象，不存在或失败则返回 null。
   */
  function cloudLoad(key) {
    return new Promise(function (resolve) {
      _init();
      if (!_initialized) { resolve(null); return; }

      var spaceHash = window.getSpaceHash ? window.getSpaceHash() : 'default';

      var query = new AV.Query(CLASS_NAME);
      query.equalTo('spaceHash', spaceHash);
      query.equalTo('dataKey', key);
      query.descending('updatedAt');
      query.first().then(function (obj) {
        if (!obj) {
          console.log('[Cloud] 未找到云端数据: ' + key);
          resolve(null);
          return;
        }
        var raw = obj.get('dataValue');
        try {
          var parsed = JSON.parse(raw);
          _lastSyncTime = Date.now();
          console.log('[Cloud] 加载成功: ' + key);
          resolve(parsed);
        } catch (e) {
          console.error('[Cloud] 数据解析失败: ' + key, e);
          resolve(null);
        }
      }).catch(function (err) {
        console.error('[Cloud] 加载失败: ' + key, err);
        resolve(null);
      });
    });
  }

  /**
   * cloudDelete(key) → Promise<boolean>
   * 从 LeanCloud 删除指定 key 的数据。
   */
  function cloudDelete(key) {
    return new Promise(function (resolve) {
      _init();
      if (!_initialized) { resolve(false); return; }

      var spaceHash = window.getSpaceHash ? window.getSpaceHash() : 'default';

      var query = new AV.Query(CLASS_NAME);
      query.equalTo('spaceHash', spaceHash);
      query.equalTo('dataKey', key);
      query.first().then(function (obj) {
        if (!obj) { resolve(true); return; }
        return obj.destroy();
      }).then(function () {
        console.log('[Cloud] 删除成功: ' + key);
        resolve(true);
      }).catch(function (err) {
        console.error('[Cloud] 删除失败: ' + key, err);
        resolve(false);
      });
    });
  }

  /**
   * cloudGetLastSyncTime() → number|null
   * 返回最近一次成功同步的时间戳（毫秒），从未同步过返回 null。
   */
  function cloudGetLastSyncTime() {
    return _lastSyncTime;
  }

  /**
   * cloudIsReady() → boolean
   * 返回云端模块是否已初始化（SDK 加载成功）。
   */
  function cloudIsReady() {
    _init();
    return _initialized;
  }

  /**
   * cloudSyncNow(key) → Promise<{ synced: boolean, message: string }>
   * 手动触发一次同步：将本地数据推送到云端。
   */
  function cloudSyncNow(key) {
    return new Promise(function (resolve) {
      _init();
      if (!_initialized) {
        resolve({ synced: false, message: 'LeanCloud SDK 未加载' });
        return;
      }
      if (_syncInProgress) {
        resolve({ synced: false, message: '同步进行中，请稍后再试' });
        return;
      }

      _syncInProgress = true;
      var localData = window.loadData ? window.loadData() : null;
      if (!localData) {
        _syncInProgress = false;
        resolve({ synced: false, message: '本地数据为空' });
        return;
      }

      cloudSave(key || 'main', localData).then(function (ok) {
        _syncInProgress = false;
        if (ok) {
          resolve({ synced: true, message: '同步成功', time: _lastSyncTime });
        } else {
          resolve({ synced: false, message: '同步失败，请检查网络后重试' });
        }
      });
    });
  }

  /* ================================================================
   * 挂载到全局
   * ================================================================ */
  window.cloudSave = cloudSave;
  window.cloudLoad = cloudLoad;
  window.cloudDelete = cloudDelete;
  window.cloudGetLastSyncTime = cloudGetLastSyncTime;
  window.cloudIsReady = cloudIsReady;
  window.cloudSyncNow = cloudSyncNow;

  // 页面加载时自动尝试初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', _init);
  } else {
    _init();
  }

})();