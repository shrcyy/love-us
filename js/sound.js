/**
 * 交互音效模块 - Web Audio API
 * 轻柔的音效用于按钮点击、提交成功、删除确认等交互
 * 不依赖任何外部音频文件，纯合成波形
 */
(function () {
  'use strict';

  var _enabled = true;  // 音效开关（从 localStorage 读取）
  var _ctx = null;

  function _getCtx() {
    if (!_ctx) {
      try {
        _ctx = new (window.AudioContext || window.webkitAudioContext)();
      } catch (e) {
        console.warn('[Sound] Web Audio API 不可用');
        _ctx = null;
      }
    }
    return _ctx;
  }

  /**
   * 播放一个简单的合成音
   * @param {number} freq     - 频率 (Hz)
   * @param {string} type     - 波形类型 ('sine'|'triangle'|'square')
   * @param {number} duration - 持续时间 (秒)
   * @param {number} volume   - 音量 (0~1)
   * @param {number} delay    - 第二个音的延迟 (秒)，0 表示不播放
   * @param {number} freq2    - 第二个音的频率
   */
  function _playTone(freq, type, duration, volume, delay, freq2) {
    if (!_enabled) return;
    var ctx = _getCtx();
    if (!ctx) return;

    // 恢复被浏览器暂停的 AudioContext
    if (ctx.state === 'suspended') { ctx.resume(); }

    var now = ctx.currentTime;

    // 主音
    var osc = ctx.createOscillator();
    var gain = ctx.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, now);
    gain.gain.setValueAtTime(volume || 0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + duration);

    // 第二个音
    if (delay && freq2) {
      var osc2 = ctx.createOscillator();
      var gain2 = ctx.createGain();
      osc2.type = type || 'sine';
      osc2.frequency.setValueAtTime(freq2, now + delay);
      gain2.gain.setValueAtTime(volume || 0.15, now + delay);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + delay + duration);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + delay);
      osc2.stop(now + delay + duration);
    }
  }

  /* ---- 公开 API ---- */

  /** 按钮点击音效：轻柔的叮咚声 */
  function playClick() {
    _playTone(880, 'sine', 0.1, 0.12, 0.06, 1100);
  }

  /** 提交/保存成功音效：升调表示完成 */
  function playSuccess() {
    _playTone(523, 'sine', 0.15, 0.15, 0.1, 659);
    setTimeout(function () { _playTone(784, 'sine', 0.2, 0.12, 0, 0); }, 180);
  }

  /** 删除确认音效：柔和低音提醒 */
  function playDelete() {
    _playTone(330, 'triangle', 0.25, 0.12, 0.15, 262);
  }

  /** 通知提示音 */
  function playNotification() {
    _playTone(660, 'sine', 0.12, 0.1, 0.08, 880);
    setTimeout(function () { _playTone(990, 'sine', 0.15, 0.08, 0, 0); }, 180);
  }

  /** 切换/开关音效 */
  function playToggle() {
    _playTone(440, 'sine', 0.08, 0.08, 0.06, 660);
  }

  /** 获取音效开关状态 */
  function isSoundEnabled() { return _enabled; }

  /** 设置音效开关并持久化 */
  function setSoundEnabled(val) {
    _enabled = !!val;
    try { localStorage.setItem('loveus_sound_enabled', _enabled ? '1' : '0'); } catch (e) {}
  }

  /** 初始化：从 localStorage 读取偏好 */
  function initSound() {
    try {
      var stored = localStorage.getItem('loveus_sound_enabled');
      if (stored === '0') _enabled = false;
    } catch (e) {}
    // 首次用户交互后解锁 AudioContext
    var resumeCtx = function () {
      var ctx = _getCtx();
      if (ctx && ctx.state === 'suspended') ctx.resume();
    };
    document.addEventListener('click', resumeCtx, { once: true });
    document.addEventListener('touchstart', resumeCtx, { once: true });
  }

  // 挂载到全局
  window.playClick = playClick;
  window.playSuccess = playSuccess;
  window.playDelete = playDelete;
  window.playNotification = playNotification;
  window.playToggle = playToggle;
  window.isSoundEnabled = isSoundEnabled;
  window.setSoundEnabled = setSoundEnabled;
  window.initSound = initSound;

})();