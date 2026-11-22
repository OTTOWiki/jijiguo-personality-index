/* =========================================================
   吉吉国人格图鉴 · util.js
   全局命名空间 OTTOQUIZ 的底层工具：DOM、随机数、存储、音效、提示
   ========================================================= */
(function (global) {
  'use strict';

  var OTTOQUIZ = global.OTTOQUIZ = global.OTTOQUIZ || {};

  /* ---------- DOM ---------- */
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function el(tag, attrs, html) {
    var node = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        if (k === 'class') node.className = attrs[k];
        else if (k === 'text') node.textContent = attrs[k];
        else if (k === 'html') node.innerHTML = attrs[k];
        else if (k.indexOf('data-') === 0 || k === 'role' || k === 'aria-label' || k === 'aria-live' || k === 'tabindex' || k === 'type') node.setAttribute(k, attrs[k]);
        else node.setAttribute(k, attrs[k]);
      });
    }
    if (html != null) node.innerHTML = html;
    return node;
  }
  function escapeHtml(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function clamp(n, min, max) { return Math.min(max, Math.max(min, n)); }

  /* ---------- 随机数（可复现） ---------- */
  function mulberry32(seed) {
    var a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function hashString(str) {
    var h = 2166136261 >>> 0;
    for (var i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }
  function shuffle(arr, rnd) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(rnd() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }
  function pick(arr, rnd) { return arr[Math.floor(rnd() * arr.length)]; }

  /* ---------- 时间 ---------- */
  function formatDuration(ms) {
    var s = Math.max(0, Math.round(ms / 1000));
    var m = Math.floor(s / 60);
    var r = s % 60;
    if (m <= 0) return r + ' 秒';
    return m + ' 分 ' + (r < 10 ? '0' : '') + r + ' 秒';
  }
  function formatDate(ts) {
    var d = new Date(ts);
    function p(n) { return (n < 10 ? '0' : '') + n; }
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
  }

  /* ---------- 存储（带降级） ---------- */
  var STORE_PREFIX = 'ggq.v1.';
  function storageAvailable() {
    try {
      var k = '__ggq_test__';
      global.localStorage.setItem(k, '1');
      global.localStorage.removeItem(k);
      return true;
    } catch (e) { return false; }
  }
  var memStore = {};
  var hasLS = storageAvailable();
  function storeGet(key, fallback) {
    try {
      var raw = hasLS ? global.localStorage.getItem(STORE_PREFIX + key) : memStore[key];
      if (raw == null) return fallback;
      return JSON.parse(raw);
    } catch (e) { return fallback; }
  }
  function storeSet(key, value) {
    try {
      var raw = JSON.stringify(value);
      if (hasLS) global.localStorage.setItem(STORE_PREFIX + key, raw);
      else memStore[key] = raw;
      return true;
    } catch (e) { return false; }
  }
  function storeDel(key) {
    try {
      if (hasLS) global.localStorage.removeItem(STORE_PREFIX + key);
      else delete memStore[key];
    } catch (e) { /* noop */ }
  }

  /* ---------- 音效（WebAudio，无外部资源） ---------- */
  var audioCtx = null;
  function ensureAudio() {
    if (audioCtx) return audioCtx;
    var AC = global.AudioContext || global.webkitAudioContext;
    if (!AC) return null;
    try { audioCtx = new AC(); } catch (e) { audioCtx = null; }
    return audioCtx;
  }
  function blip(freq, dur, type, gainValue, when) {
    var ctx = ensureAudio();
    if (!ctx) return;
    var t0 = ctx.currentTime + (when || 0);
    var osc = ctx.createOscillator();
    var gain = ctx.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, t0);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(gainValue || 0.035, t0 + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + (dur || 0.08));
    osc.connect(gain).connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + (dur || 0.08) + 0.02);
  }
  function sound(kind) {
    if (!OTTOQUIZ.settings || !OTTOQUIZ.settings.sound) return;
    var ctx = ensureAudio();
    if (ctx && ctx.state === 'suspended' && ctx.resume) {
      // 用户手势后恢复上下文
      try { ctx.resume(); } catch (e) { /* noop */ }
    }
    if (kind === 'select') { blip(720, 0.06, 'triangle', 0.03); blip(1080, 0.05, 'sine', 0.018, 0.03); }
    else if (kind === 'back') { blip(420, 0.07, 'sine', 0.022); }
    else if (kind === 'start') { blip(520, 0.08, 'triangle', 0.03); blip(780, 0.09, 'triangle', 0.03, 0.08); blip(1040, 0.1, 'triangle', 0.025, 0.16); }
    else if (kind === 'result') {
      [523.25, 659.25, 783.99, 1046.5].forEach(function (f, i) { blip(f, 0.35, 'sine', 0.028, i * 0.09); });
    } else if (kind === 'tick') { blip(280, 0.04, 'square', 0.012); }
  }

  /* ---------- Toast ---------- */
  var toastTimer = null;
  function toast(text, tag, duration) {
    var box = $('#toast'), tagEl = $('#toast-tag'), textEl = $('#toast-text');
    if (!box || !textEl) return;
    tagEl.textContent = tag || '考据';
    textEl.textContent = text;
    box.hidden = false;
    box.style.animation = 'none';
    /* 触发重排以重启动画 */
    void box.offsetWidth;
    box.style.animation = '';
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { box.hidden = true; }, duration || 2600);
  }
  function hideToast() {
    var box = $('#toast');
    if (box) box.hidden = true;
    clearTimeout(toastTimer);
  }

  /* ---------- Modal ---------- */
  var lastFocus = null;
  function openModal(html, opts) {
    var modal = $('#modal'), body = $('#modal-body');
    if (!modal || !body) return;
    lastFocus = document.activeElement;
    body.innerHTML = html;
    modal.hidden = false;
    document.body.classList.add('modal-open');
    var closeBtn = $('.modal__close', modal);
    if (closeBtn) setTimeout(function () { closeBtn.focus(); }, 30);
    if (opts && opts.onOpen) opts.onOpen(body);
  }
  function closeModal() {
    var modal = $('#modal');
    if (!modal) return;
    modal.hidden = true;
    document.body.classList.remove('modal-open');
    $('#modal-body').innerHTML = '';
    if (lastFocus && lastFocus.focus) { try { lastFocus.focus(); } catch (e) { /* noop */ } }
  }

  /* ---------- 滚动 ---------- */
  function scrollTop() {
    try { global.scrollTo({ top: 0, behavior: 'auto' }); } catch (e) { global.scrollTo(0, 0); }
  }

  OTTOQUIZ.util = {
    $: $, $$: $$, el: el, escapeHtml: escapeHtml, clamp: clamp,
    mulberry32: mulberry32, hashString: hashString, shuffle: shuffle, pick: pick,
    formatDuration: formatDuration, formatDate: formatDate,
    storeGet: storeGet, storeSet: storeSet, storeDel: storeDel,
    sound: sound, toast: toast, hideToast: hideToast,
    openModal: openModal, closeModal: closeModal, scrollTop: scrollTop
  };
})(window);
