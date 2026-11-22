/* =========================================================
   吉吉国人格图鉴 · app.js
   状态机、路由、事件绑定、进度存档、结果动画
   ========================================================= */
(function (global) {
  'use strict';
  var OTTOQUIZ = global.OTTOQUIZ = global.OTTOQUIZ || {};
  var U = OTTOQUIZ.util;
  var V = OTTOQUIZ.views;

  /* ---------- 设置 ---------- */
  var settings = U.storeGet('settings', { sound: true, notes: true });
  OTTOQUIZ.settings = settings;

  /* ---------- 运行状态 ---------- */
  var state = {
    screen: 'home',
    versionId: null,
    order: [],
    answers: {},
    cursor: 0,
    seed: 0,
    startedAt: 0,
    advancing: false,
    sessionId: 0,
    result: null,
    progress: null,
    lastResult: null,
    sharedPersona: null
  };

  /* ---------- 启动 ---------- */
  function init() {
    loadFromStorage();
    bindEvents();
    updateSoundButton();
    if (!global.location.hash) {
      try { global.history.replaceState(null, '', '#/'); } catch (e) { /* noop */ }
    }
    route();
  }

  function loadFromStorage() {
    var pr = U.storeGet('progress', null);
    if (pr && pr.order && pr.answers && typeof pr.cursor === 'number' &&
        (pr.cursor > 0 || Object.keys(pr.answers).length > 0) &&
        pr.cursor < pr.order.length && OTTOQUIZ.VERSIONS[pr.versionId]) {
      /* 校验题目是否仍存在 */
      var valid = pr.order.every(function (qid) { return !!OTTOQUIZ.scoring.getQuestion(qid); });
      if (valid) state.progress = pr;
    }
    var lr = U.storeGet('lastResult', null);
    if (lr && lr.answers && lr.order && OTTOQUIZ.VERSIONS[lr.versionId]) {
      var res = OTTOQUIZ.scoring.score(lr.versionId, lr.answers, lr.order);
      res.generatedAt = lr.at || Date.now();
      state.lastResult = res;
    }
  }

  /* ---------- 路由 ---------- */
  function route() {
    var hash = global.location.hash || '#/';
    var parts = hash.replace(/^#\/?/, '').split('/').filter(Boolean);
    U.closeModal();
    if (parts[0] === 'quiz') {
      if (state.versionId && state.order.length) showQuiz();
      else { navigate('home', true); return; }
    } else if (parts[0] === 'result') {
      if (state.result) showResult();
      else { navigate('home', true); return; }
    } else if (parts[0] === 'share' && parts[1]) {
      var p = OTTOQUIZ.PERSONA_BY_ID[parts[1]];
      if (p) {
        state.sharedPersona = p;
        state.compareId = p.id;
        U.storeSet('compare', { id: p.id, at: Date.now() });
        showShared();
      }
      else navigate('home', true);
      return;
    } else if (parts[0] === 'codex') {
      showCodex();
    } else if (parts[0] === 'about') {
      showAbout();
    } else {
      showHome();
    }
    U.scrollTop();
  }

  function navigate(name, replace) {
    var hash = name === 'home' ? '#/' : '#/' + name;
    if (global.location.hash === hash) { route(); return; }
    try {
      if (replace) {
        global.history.replaceState(null, '', hash);
        route();
      } else {
        global.location.hash = hash;
      }
    } catch (e) {
      global.location.hash = hash;
    }
  }

  function updateTopnav(name) {
    U.$$('.topnav__btn').forEach(function (btn) {
      var nav = btn.getAttribute('data-nav');
      btn.classList.toggle('is-active', nav === name);
    });
  }

  /* ---------- 页面渲染 ---------- */
  var BASE_TITLE = '吉吉国人格图鉴 · 你是电棍 OTTO 圈的谁？30/85/120 题人格测试';
  function setTitle(suffix) {
    document.title = suffix ? suffix + ' · 吉吉国人格图鉴' : BASE_TITLE;
  }

  function setScreen(html, opts) {
    var screen = U.$('#screen');
    screen.innerHTML = html;
    var isQuiz = !!(opts && opts.quiz);
    screen.classList.toggle('screen--quiz', isQuiz);
    document.body.classList.toggle('is-quiz', isQuiz);
    if (!opts || !opts.keepFocus) {
      try { screen.focus({ preventScroll: true }); } catch (e) { /* noop */ }
    }
  }

  function showHome() {
    state.screen = 'home';
    state.result = null;
    state.progress = U.storeGet('progress', null);
    if (state.progress) {
      var valid = state.progress.order && state.progress.order.every(function (qid) { return !!OTTOQUIZ.scoring.getQuestion(qid); }) &&
        (state.progress.cursor > 0 || Object.keys(state.progress.answers || {}).length > 0);
      if (!valid) state.progress = null;
    }
    setScreen(V.renderHome(state));
    setTitle('');
    updateTopnav('home');
  }

  function showQuiz() {
    state.screen = 'quiz';
    var qid = state.order[state.cursor];
    var q = OTTOQUIZ.scoring.getQuestion(qid);
    if (!q) { finishQuiz(); return; }
    setScreen(V.renderQuiz(state, q), { quiz: true });
    setTitle('第 ' + (state.cursor + 1) + ' 题');
    updateTopnav('');
  }

  function showResult() {
    state.screen = 'result';
    setScreen(V.renderResult(state));
    setTitle('结果 · ' + (state.result && state.result.personality ? state.result.personality.name : ''));
    updateTopnav('');
    animateResult();
  }

  function showShared() {
    state.screen = 'share';
    setScreen(V.renderShared(state.sharedPersona));
    setTitle('好友结果 · ' + state.sharedPersona.name);
    updateTopnav('');
  }

  function showCodex() {
    state.screen = 'codex';
    setScreen(V.renderCodex());
    setTitle('人物图鉴');
    updateTopnav('codex');
  }

  function showAbout() {
    state.screen = 'about';
    setScreen(V.renderAbout());
    setTitle('考据说明');
    updateTopnav('about');
  }

  /* ---------- 结果动画 ---------- */
  function animateResult() {
    global.requestAnimationFrame(function () {
      U.$$('#screen .rank__fill').forEach(function (bar) {
        bar.style.width = (bar.getAttribute('data-w') || 0) + '%';
      });
      U.$$('#screen .trait__fill').forEach(function (bar) {
        bar.style.width = (bar.getAttribute('data-w') || 0) + '%';
      });
      var num = U.$('#match-num');
      if (num) {
        var target = parseInt(num.getAttribute('data-target'), 10) || 0;
        var start = performance.now();
        var dur = 1100;
        function step(t) {
          var k = Math.min(1, (t - start) / dur);
          var eased = 1 - Math.pow(1 - k, 3);
          num.innerHTML = Math.round(target * eased) + '<sup>%</sup>';
          if (k < 1) global.requestAnimationFrame(step);
        }
        global.requestAnimationFrame(step);
      }
    });
  }

  /* ---------- 答题流程 ---------- */
  function startQuiz(versionId) {
    var version = OTTOQUIZ.VERSIONS[versionId];
    if (!version) return;
    var seed = (Date.now() ^ Math.floor(Math.random() * 0xffffffff)) >>> 0;
    state.sessionId++;
    state.versionId = versionId;
    state.seed = seed;
    state.startedAt = Date.now();
    state.order = OTTOQUIZ.scoring.buildOrder(versionId, seed);
    state.answers = {};
    state.cursor = 0;
    state.advancing = false;
    state.result = null;
    U.storeDel('progress');
    U.closeModal();
    U.hideToast();
    U.sound('start');
    navigate('quiz');
  }

  function saveProgress() {
    var payload = {
      versionId: state.versionId,
      order: state.order,
      answers: state.answers,
      cursor: state.cursor,
      seed: state.seed,
      startedAt: state.startedAt,
      updatedAt: Date.now()
    };
    U.storeSet('progress', payload);
  }

  function chooseOption(origIdx) {
    if (state.advancing) return;
    var qid = state.order[state.cursor];
    var q = OTTOQUIZ.scoring.getQuestion(qid);
    if (!q || !q.options[origIdx]) return;
    state.advancing = true;
    var session = state.sessionId;
    state.answers[qid] = origIdx;
    saveProgress();
    U.sound('select');
    var selectedBtn = U.$('#options .opt[data-index="' + origIdx + '"]');
    if (selectedBtn) selectedBtn.classList.add('is-selected');
    U.$$('#options .opt').forEach(function (b) { b.classList.add('is-locked'); });
    var note = q.options[origIdx].note || q.note;
    if (settings.notes && note) U.toast(note, '梗注', 2400);
    global.setTimeout(function () {
      if (session !== state.sessionId) { state.advancing = false; return; }
      state.advancing = false;
      advance();
    }, 260);
  }

  function advance() {
    if (state.screen !== 'quiz' || state.advancing) return;
    state.cursor++;
    saveProgress();
    if (state.cursor >= state.order.length) { finishQuiz(); return; }
    showQuiz();
    U.scrollTop();
    U.sound('tick');
  }

  function goBack() {
    if (state.advancing || state.cursor <= 0) return;
    state.cursor--;
    saveProgress();
    U.sound('back');
    showQuiz();
    U.scrollTop();
  }

  function exitQuiz() {
    if (state.cursor === 0 && !Object.keys(state.answers).length) {
      U.storeDel('progress');
    } else {
      saveProgress();
    }
    state.advancing = false;
    state.sessionId++;
    navigate('home');
    U.toast(state.cursor === 0 ? '还没有作答，进度未保存。' : '进度已保存在本机，下次可从第 ' + (state.cursor + 1) + ' 题继续。', '存档', 2600);
  }

  function finishQuiz() {
    var result = OTTOQUIZ.scoring.score(state.versionId, state.answers, state.order);
    var cmp = U.storeGet('compare', null);
    if (cmp && cmp.id && cmp.id !== result.top.id && OTTOQUIZ.PERSONA_BY_ID[cmp.id]) {
      result.compare = OTTOQUIZ.scoring.compat(cmp.id, result.top.id);
      U.storeDel('compare');
    }
    state.result = result;
    var record = {
      versionId: state.versionId,
      order: state.order,
      answers: state.answers,
      at: Date.now()
    };
    U.storeSet('lastResult', record);
    var history = U.storeGet('history', []);
    history.unshift({ personaId: result.top.id, pct: result.top.pct, versionId: state.versionId, at: record.at });
    history = history.slice(0, 12);
    U.storeSet('history', history);
    U.storeDel('progress');
    state.progress = null;
    U.hideToast();
    U.sound('result');
    state.screen = 'result';
    navigate('result');
    if (result.compare) U.toast('已解锁你和分享者的相性卡 · ' + result.compare.label, '相性', 3200);
  }

  /* ---------- 弹窗 ---------- */
  function confirmStart(versionId) {
    var v = OTTOQUIZ.VERSIONS[versionId];
    U.openModal('' +
      '<h2 class="h3" id="modal-title">覆盖未完成的进度？</h2>' +
      '<p class="pd__p" style="margin-top:8px">你还有一份没做完的测试。开始新的「' + U.escapeHtml(v.name) + '」会覆盖它。</p>' +
      '<div style="display:flex;gap:8px;margin-top:18px;flex-wrap:wrap">' +
        '<button class="btn btn--sm" type="button" data-action="start-force" data-version="' + versionId + '">覆盖并开始</button>' +
        '<button class="btn btn--sm btn--ghost" type="button" data-modal-close>取消</button>' +
      '</div>');
  }

  function openPersona(id) {
    var p = OTTOQUIZ.PERSONA_BY_ID[id];
    if (!p) return;
    U.openModal(V.renderPersonaModal(p));
  }

  function openVersionChooser() {
    U.openModal('' +
      '<h2 class="h3" id="modal-title">换个规格再测</h2>' +
      '<p class="pd__p" style="margin-top:8px">换一种长度，看看结果会不会变。</p>' +
      '<div class="versions" style="margin-top:16px">' + OTTOQUIZ.VERSION_LIST.map(function (v) {
        return '<button class="vcard" type="button" data-action="start" data-version="' + v.id + '" style="padding-bottom:18px">' +
          '<span class="vcard__num">' + v.countText + '<small>题</small></span>' +
          '<span class="vcard__name" style="font-size:17px">' + U.escapeHtml(v.name) + '</span>' +
          '<span class="vcard__desc" style="min-height:0">' + U.escapeHtml(v.tagline) + '</span>' +
        '</button>';
      }).join('') + '</div>');
  }

  /* ---------- 分享 ---------- */
  function copyText(text) {
    if (global.navigator && global.navigator.clipboard && global.navigator.clipboard.writeText) {
      return global.navigator.clipboard.writeText(text).then(function () { return true; }).catch(function () { return fallbackCopy(text); });
    }
    return Promise.resolve(fallbackCopy(text));
  }
  function fallbackCopy(text) {
    try {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      var ok = document.execCommand('copy');
      document.body.removeChild(ta);
      return ok;
    } catch (e) { return false; }
  }

  function openShare() {
    U.openModal(V.renderShareModal(state.result || null));
  }

  function currentShareText() {
    return state.result ? OTTOQUIZ.share.resultText(state.result) : OTTOQUIZ.share.siteText();
  }
  function currentShareUrl() {
    return state.result ? OTTOQUIZ.share.resultUrl(state.result.top.id) : OTTOQUIZ.share.siteUrl();
  }

  function showManualCopy(text) {
    U.openModal('' +
      '<h2 class="h3" id="modal-title">手动复制</h2>' +
      '<p class="pd__p" style="margin-top:6px">浏览器没让我们自动复制。下面的文字已全选，长按 / Ctrl+C 即可复制。</p>' +
      '<textarea class="copy-box" id="manual-copy-box" readonly rows="9">' + U.escapeHtml(text) + '</textarea>' +
      '<div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap">' +
        '<button class="btn btn--sm" type="button" data-action="select-copy">重新全选</button>' +
        '<button class="btn btn--sm btn--ghost" type="button" data-modal-close>关闭</button>' +
      '</div>');
    global.setTimeout(function () {
      var ta = U.$('#manual-copy-box');
      if (ta) { try { ta.focus(); ta.select(); } catch (e) { /* noop */ } }
    }, 60);
  }

  function copyWithFallback(text, okMsg, failMsg) {
    copyText(text).then(function (ok) {
      if (ok) U.toast(okMsg, '分享', 2800);
      else {
        showManualCopy(text);
        U.toast(failMsg || '自动复制失败，已打开手动复制窗口。', '复制', 3200);
      }
    });
  }

  function handleShareCopy() {
    copyWithFallback(currentShareText(),
      state.result ? '结果文案已复制，去黏贴给你群里的吉吉国民吧。' : '本站文案已复制，去发个动态吧。');
  }

  function handleShareUrl() {
    copyWithFallback(currentShareUrl(),
      state.result ? '分享链接已复制：好友打开就能看到你的结果。' : '本站链接已复制。');
  }

  function openWith(text, url, tip) {
    try { global.open(url, '_blank', 'noopener'); } catch (e) { /* noop */ }
    copyWithFallback(text, tip, '外链已打开，但自动复制失败，已打开手动复制窗口。');
  }

  function shareWeibo() {
    var text = currentShareText();
    var url = currentShareUrl();
    try { global.open(OTTOQUIZ.share.weiboUrl(text, url), '_blank', 'noopener'); } catch (e) { /* noop */ }
    U.toast('已打开微博分享窗口，登录后直接发布即可。', '微博', 3000);
  }

  function shareQQ() {
    var text = currentShareText();
    var url = currentShareUrl();
    try { global.open(OTTOQUIZ.share.qqUrl(text, url), '_blank', 'noopener'); } catch (e) { /* noop */ }
    U.toast('已打开 QQ 分享窗口。', 'QQ', 2600);
  }

  function shareBili() {
    openWith(currentShareText(), OTTOQUIZ.share.biliUrl(), '文案已复制，去 B 站发条动态或投个币吧。');
  }

  function shareTieba() {
    openWith(currentShareText(), OTTOQUIZ.share.tiebaUrl(), '文案已复制，去贴吧发帖时粘贴即可。');
  }

  function handleShareCompare() {
    if (!state.result || !state.result.compare) return;
    copyWithFallback(OTTOQUIZ.share.compareText(state.result), '对比文案已复制，去发给分享者吧。');
  }

  function handleShareCard() {
    if (!state.result) return;
    U.toast('正在生成你的人格卡…', '卡片', 1500);
    try {
      var dataUrl = OTTOQUIZ.share.drawCard(state.result);
      var html = '' +
        '<h2 class="h3" id="modal-title">你的人格卡</h2>' +
        '<p class="pd__p" style="margin-top:6px">长按图片或点击下方按钮保存。发出去的时候，记得带上 #吉吉国人格图鉴。</p>' +
        '<div class="share-preview" style="margin-top:14px">' +
          '<img src="' + dataUrl + '" alt="人格卡：' + U.escapeHtml(state.result.personality.name) + '" width="1080" height="1440">' +
          '<div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center">' +
            '<a class="btn btn--sm" download="jijiguo-' + state.result.top.id + '.png" href="' + dataUrl + '">保存图片</a>' +
            '<button class="btn btn--sm btn--ghost" type="button" data-action="share-card-native">系统分享</button>' +
          '</div>' +
        '</div>';
      U.openModal(html);
      OTTOQUIZ.share.lastCardDataUrl = dataUrl;
      U.sound('tick');
    } catch (e) {
      U.toast('卡片生成失败了，换浏览器再试试。', '错误', 2400);
    }
  }

  function shareCardNative() {
    var dataUrl = OTTOQUIZ.share.lastCardDataUrl;
    if (!dataUrl) return;
    try {
      var arr = dataUrl.split(','), mime = arr[0].match(/:(.*?);/)[1];
      var bin = atob(arr[1]);
      var len = bin.length;
      var bytes = new Uint8Array(len);
      for (var i = 0; i < len; i++) bytes[i] = bin.charCodeAt(i);
      var file = new File([bytes], 'jijiguo-persona.png', { type: mime });
      if (global.navigator.canShare && global.navigator.canShare({ files: [file] })) {
        global.navigator.share({
          files: [file],
          title: '吉吉国人格图鉴',
          text: OTTOQUIZ.share.resultText(state.result)
        }).catch(function () { /* noop */ });
      } else {
        U.toast('当前浏览器不支持系统分享，请长按图片保存。', '提示', 2400);
      }
    } catch (e) {
      U.toast('当前浏览器不支持系统分享，请长按图片保存。', '提示', 2400);
    }
  }

  function restart(versionId) {
    var same = versionId || state.versionId;
    U.closeModal();
    U.openModal('' +
      '<h2 class="h3" id="modal-title">再测一次「' + U.escapeHtml(OTTOQUIZ.VERSIONS[same].name) + '」？</h2>' +
      '<p class="pd__p" style="margin-top:8px">会清空本次结果并重新抽题。上次的结果仍会留在浏览记录里。</p>' +
      '<div style="display:flex;gap:8px;margin-top:18px;flex-wrap:wrap">' +
        '<button class="btn btn--sm" type="button" data-action="start-force" data-version="' + same + '">开始</button>' +
        '<button class="btn btn--sm btn--ghost" type="button" data-modal-close>取消</button>' +
      '</div>');
  }

  /* ---------- 音效开关 ---------- */
  function updateSoundButton() {
    var btn = U.$('#btn-sound');
    if (!btn) return;
    btn.classList.toggle('is-on', !!settings.sound);
    btn.classList.toggle('is-off', !settings.sound);
    btn.setAttribute('aria-pressed', settings.sound ? 'true' : 'false');
    btn.setAttribute('aria-label', settings.sound ? '关闭音效' : '开启音效');
    btn.textContent = settings.sound ? '♪' : '♩';
  }
  function toggleSound() {
    settings.sound = !settings.sound;
    U.storeSet('settings', settings);
    updateSoundButton();
    if (settings.sound) U.sound('select');
  }

  /* ---------- 事件 ---------- */
  function bindEvents() {
    document.addEventListener('click', function (e) {
      var nav = e.target.closest('[data-nav]');
      if (nav) {
        e.preventDefault();
        var name = nav.getAttribute('data-nav');
        if (name === 'resume' || name === 'last-result' || name === 'discard') { /* handled below */ }
        navigate(name);
        return;
      }
      var close = e.target.closest('[data-modal-close]');
      if (close) { e.preventDefault(); U.closeModal(); return; }
      var actionEl = e.target.closest('[data-action]');
      if (!actionEl) return;
      var action = actionEl.getAttribute('data-action');
      e.preventDefault();
      switch (action) {
        case 'start':
          var versionId = actionEl.getAttribute('data-version');
          if (state.progress) confirmStart(versionId);
          else { U.closeModal(); startQuiz(versionId); }
          break;
        case 'start-force':
          startQuiz(actionEl.getAttribute('data-version'));
          break;
        case 'resume':
          resumeQuiz();
          break;
        case 'discard':
          discardProgress();
          break;
        case 'last-result':
          if (state.lastResult) { state.result = state.lastResult; navigate('result'); }
          break;
        case 'choose':
          chooseOption(parseInt(actionEl.getAttribute('data-index'), 10));
          break;
        case 'back':
          goBack();
          break;
        case 'exit-quiz':
          exitQuiz();
          break;
        case 'restart':
          restart(actionEl.getAttribute('data-version') || state.versionId);
          break;
        case 'version-other':
        case 'version-again':
          openVersionChooser();
          break;
        case 'codex-open':
          openPersona(actionEl.getAttribute('data-persona'));
          break;
        case 'open-share':
          openShare();
          break;
        case 'share-copy':
          handleShareCopy();
          break;
        case 'share-url':
          handleShareUrl();
          break;
        case 'share-weibo':
          shareWeibo();
          break;
        case 'share-qq':
          shareQQ();
          break;
        case 'share-bili':
          shareBili();
          break;
        case 'share-tieba':
          shareTieba();
          break;
        case 'share-compare':
          handleShareCompare();
          break;
        case 'select-copy':
          (function () {
            var ta = U.$('#manual-copy-box');
            if (!ta) return;
            try { ta.focus(); ta.select(); document.execCommand('copy'); U.toast('已全选并尝试复制。', '复制', 2000); }
            catch (e) { U.toast('已全选，请长按 / Ctrl+C 复制。', '复制', 2400); }
          })();
          break;
        case 'share-card':
          handleShareCard();
          break;
        case 'share-card-native':
          shareCardNative();
          break;
        case 'toggle-notes':
          settings.notes = !settings.notes;
          U.storeSet('settings', settings);
          actionEl.textContent = settings.notes ? '已开启 · 点击关闭' : '已关闭 · 点击开启';
          U.toast(settings.notes ? '考据梗注已开启。' : '考据梗注已关闭。', '设置', 1600);
          break;
        default:
          break;
      }
    });

    U.$('#btn-sound').addEventListener('click', toggleSound);

    document.addEventListener('keydown', function (e) {
      var modalOpen = !U.$('#modal').hidden;
      if (modalOpen) {
        if (e.key === 'Escape') { U.closeModal(); }
        return;
      }
      if (state.screen !== 'quiz' || !state.order.length) return;
      var tag = (e.target.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea') return;
      if (e.key === '1' || e.key === '2' || e.key === '3' || e.key === '4') {
        e.preventDefault();
        var idx = parseInt(e.key, 10) - 1;
        var q = OTTOQUIZ.scoring.getQuestion(state.order[state.cursor]);
        if (!q) return;
        var rnd = U.mulberry32((state.seed >>> 0) ^ U.hashString(q.id));
        var order = U.shuffle(q.options.map(function (o, i) { return i; }), rnd);
        if (order[idx] != null) chooseOption(order[idx]);
      } else if (e.key === 'a' || e.key === 'A' || e.key === 'b' || e.key === 'B' || e.key === 'c' || e.key === 'C' || e.key === 'd' || e.key === 'D') {
        e.preventDefault();
        var idx2 = 'abcd'.indexOf(e.key.toLowerCase());
        var q2 = OTTOQUIZ.scoring.getQuestion(state.order[state.cursor]);
        if (!q2) return;
        var rnd2 = U.mulberry32((state.seed >>> 0) ^ U.hashString(q2.id));
        var order2 = U.shuffle(q2.options.map(function (o, i) { return i; }), rnd2);
        if (order2[idx2] != null) chooseOption(order2[idx2]);
      } else if (e.key === 'Backspace' || e.key === 'ArrowLeft') {
        e.preventDefault();
        goBack();
      } else if (e.key === 'Escape') {
        exitQuiz();
      }
    });

    global.addEventListener('hashchange', route);
    global.addEventListener('beforeunload', function () {
      if (state.screen === 'quiz' && state.order.length) saveProgress();
    });
  }

  function resumeQuiz() {
    var pr = state.progress;
    if (!pr) { navigate('home'); return; }
    state.versionId = pr.versionId;
    state.order = pr.order;
    state.answers = pr.answers || {};
    state.cursor = Math.min(pr.cursor || 0, pr.order.length - 1);
    state.seed = pr.seed || 7;
    state.startedAt = pr.startedAt || Date.now();
    state.advancing = false;
    navigate('quiz');
  }

  function discardProgress() {
    state.sessionId++;
    state.advancing = false;
    U.storeDel('progress');
    state.progress = null;
    U.toast('未完成的进度已清除。', '存档', 1800);
    showHome();
  }

  /* ---------- 暴露 ---------- */
  OTTOQUIZ.app = {
    init: init,
    startQuiz: startQuiz,
    navigate: navigate,
    state: state,
    settings: settings
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(window);
