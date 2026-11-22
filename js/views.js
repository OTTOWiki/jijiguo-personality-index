/* =========================================================
   吉吉国人格图鉴 · views.js
   所有页面的 HTML 渲染（字符串模板，无框架）
   ========================================================= */
(function (global) {
  'use strict';
  var OTTOQUIZ = global.OTTOQUIZ = global.OTTOQUIZ || {};
  var U = OTTOQUIZ.util;

  function esc(s) { return U.escapeHtml(s); }
  function hexToRgba(hex, alpha) {
    var h = String(hex || '#ffc94a').replace('#', '');
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    var n = parseInt(h, 16);
    var r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    return 'rgba(' + r + ',' + g + ',' + b + ',' + alpha + ')';
  }
  function personaVars(p) {
    return '--pc:' + p.color + ';--pc2:' + p.color2 + ';--pc-soft:' + hexToRgba(p.color, 0.16) + ';';
  }
  function personaById(id) { return OTTOQUIZ.PERSONA_BY_ID[id]; }
  function sigil(p) { return p ? p.sigil : ''; }

  /* ---------- 通用组件 ---------- */
  function personMini(p) {
    return '' +
      '<button class="person-mini" type="button" data-action="codex-open" data-persona="' + p.id + '" style="' + personaVars(p) + '" aria-label="查看 ' + esc(p.name) + ' 的人物档案">' +
        '<span class="person-mini__sigil">' + sigil(p) + '</span>' +
        '<span class="person-mini__name">' + esc(p.name) + '</span>' +
        '<span class="person-mini__alias">' + esc(p.alias.split(' / ')[0]) + '</span>' +
      '</button>';
  }

  function versionCard(v, opts) {
    var cls = 'vcard' + (v.featured ? ' vcard--featured' : '');
    return '' +
      '<button class="' + cls + '" type="button" data-action="start" data-version="' + v.id + '">' +
        '<span class="vcard__top">' +
          '<span class="vcard__num">' + esc(v.countText) + '<small>题</small></span>' +
        '</span>' +
        '<span class="vcard__name">' + esc(v.name) + '</span>' +
        '<span class="vcard__desc">' + esc(v.desc) + '</span>' +
        '<span class="vcard__tags">' + v.tags.map(function (t) { return '<span class="chip">' + esc(t) + '</span>'; }).join('') + '</span>' +
        '<span class="vcard__go" aria-hidden="true">→</span>' +
      '</button>';
  }

  /* ---------- 首页 ---------- */
  function renderHome(state) {
    var personas = OTTOQUIZ.PERSONAS;
    var progress = state.progress;
    var resumeHtml = '';
    if (progress && progress.cursor > 0 && progress.cursor < progress.order.length) {
      var v = OTTOQUIZ.VERSIONS[progress.versionId];
      resumeHtml = '' +
        '<div class="resume">' +
          '<div class="resume__text">上次的「' + esc(v ? v.name : '测试') + '」还没做完：<strong>第 ' + (progress.cursor + 1) + ' / ' + progress.order.length + ' 题</strong>，进度已自动保存。</div>' +
          '<div class="resume__actions">' +
            '<button class="btn btn--sm" type="button" data-action="resume">继续答题</button>' +
            '<button class="btn btn--sm btn--ghost" type="button" data-action="discard">重开</button>' +
          '</div>' +
        '</div>';
    }
    var lastHtml = '';
    if (state.lastResult) {
      var lastTop = state.lastResult.top || state.lastResult;
      var lp = personaById(lastTop.id || state.lastResult.personaId);
      var lastPct = lastTop.pct != null ? lastTop.pct : state.lastResult.pct;
      var lastAt = state.lastResult.generatedAt || state.lastResult.at;
      if (lp) {
        lastHtml = '' +
          '<div class="resume" style="border-color:' + hexToRgba(lp.color, 0.35) + ';background:' + hexToRgba(lp.color, 0.06) + '">' +
            '<div class="resume__text">上次的测试结果是 <strong style="color:' + lp.color + '">' + esc(lp.name) + '</strong>（' + lastPct + '% 匹配）。' + (lastAt ? '<span class="muted"> · ' + U.formatDate(lastAt) + '</span>' : '') + '</div>' +
            '<div class="resume__actions"><button class="btn btn--sm btn--ghost" type="button" data-action="last-result">再看一次</button></div>' +
          '</div>';
      }
    }
    return '' +
      '<section class="hero">' +
        '<div class="hero__tape"><span class="dot" aria-hidden="true"></span> LIVE FROM 吉吉国 · 信号稳定 · 建议戴耳机</div>' +
        '<h1 class="hero__title">' +
          '<span class="line">吉吉国</span>' +
          '<span class="line line--accent"><span class="glitch" data-text="人格图鉴">人格图鉴</span></span>' +
        '</h1>' +
        '<p class="hero__sub">你是电棍 OTTO 亚文化圈里的哪一位？<br>我们把 <strong>7 位人物</strong>的性格、名场面、争议与近况拆成了 <strong>30 / 85 / 120</strong> 道不太正经、但很考据的题。答完，你会得到一张属于你的动物园人格卡。</p>' +
        '<div class="hero__meta">' +
          '<span class="chip chip--accent">7 位人物</span>' +
          '<span class="chip">3 种规格</span>' +
          '<span class="chip">考据截至 2026-11</span>' +
          '<span class="chip">纯属娱乐 · 请勿上升真人</span>' +
        '</div>' +
        '<div class="hero__scroll">向下滚动 · 开始鉴定</div>' +
        resumeHtml + lastHtml +
      '</section>' +

      '<section class="section" id="versions">' +
        '<div class="section__head">' +
          '<div><div class="kicker">SELECT YOUR SCAN</div><h2 class="h2">挑一个规格，开始扫描</h2></div>' +
          '<span class="small">三种规格共用一套计分模型</span>' +
        '</div>' +
        '<div class="versions">' + OTTOQUIZ.VERSION_LIST.map(function (v) { return versionCard(v); }).join('') + '</div>' +
      '</section>' +

      '<section class="section">' +
        '<div class="section__head">' +
          '<div><div class="kicker">THE ZOO</div><h2 class="h2">七位候选人</h2></div>' +
          '<button class="link-arrow" type="button" data-nav="codex">查看完整图鉴</button>' +
        '</div>' +
        '<div class="people">' + personas.map(personMini).join('') + '</div>' +
      '</section>' +

      '<section class="section">' +
        '<div class="section__head">' +
          '<div><div class="kicker">HOW IT WORKS</div><h2 class="h2">这玩意儿怎么算的</h2></div>' +
        '</div>' +
        '<div class="how">' +
          '<div class="how__item"><span class="how__idx">01</span><p><strong>凭直觉答。</strong>没有正确答案，只有你的第一反应。选项会同时给不同人物加权，也会被投影到 8 个人格维度上。</p></div>' +
          '<div class="how__item"><span class="how__idx">02</span><p><strong>匹配度不是概率。</strong>它表示你在该版本中，与某位人物的“可达成性格上限”的接近程度；越接近，说明你的选择越像他。</p></div>' +
          '<div class="how__item"><span class="how__idx">03</span><p><strong>结果有 7 种，还有组合结局。</strong>你会得到主原型、副原型、最低匹配，以及一张可保存的人格卡。全部数据只存在你的浏览器里。</p></div>' +
        '</div>' +
        '<div class="share-nudge"><span>觉得这测试有点东西？</span><button class="link-arrow" type="button" data-action="open-share">把站点甩给群友</button></div>' +
        '<div class="result-disclaimer" style="margin-top:14px"><b>认真说一下：</b>本站是非官方粉丝二创，人物言行与争议均来自公开资料与社区通说；涉及法律事件以公开报道为准。我们反对赌博、网暴、地域黑与对真实素人的骚扰——尤其不要把“棍母”梗带到现实中的那位环卫工人身上。</div>' +
      '</section>';
  }

  /* ---------- 答题页 ---------- */
  function renderQuiz(state, question) {
    var v = OTTOQUIZ.VERSIONS[state.versionId];
    var total = state.order.length;
    var cursor = state.cursor;
    var cat = (OTTOQUIZ.CATEGORY_META[question.cat] || { label: question.cat, en: '' });
    var qid = question.id;
    var selected = state.answers[qid];
    var rnd = U.mulberry32((state.seed >>> 0) ^ U.hashString(qid));
    var order = U.shuffle(question.options.map(function (o, i) { return i; }), rnd);
    var letters = ['A', 'B', 'C', 'D', 'E'];
    var optsHtml = order.map(function (origIdx, i) {
      var opt = question.options[origIdx];
      var isSel = selected === origIdx;
      return '' +
        '<button class="opt' + (isSel ? ' is-selected' : '') + '" type="button" data-action="choose" data-index="' + origIdx + '" aria-pressed="' + (isSel ? 'true' : 'false') + '">' +
          '<span class="opt__letter">' + letters[i] + '</span>' +
          '<span class="opt__text">' + esc(opt.t) + '</span>' +
        '</button>';
    }).join('');
    var pct = Math.round(((cursor) / total) * 100);
    return '' +
      '<div class="quiz">' +
        '<div class="quiz__bar">' +
          '<div class="quiz__bar-row">' +
            '<span class="quiz__count">第 <b>' + (cursor + 1) + '</b> / ' + total + ' 题</span>' +
            '<span class="quiz__version">' + esc(v.name) + ' · ' + esc(v.en) + '</span>' +
          '</div>' +
          '<div class="progress" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + pct + '" aria-label="答题进度"><div class="progress__fill" style="width:' + pct + '%"></div></div>' +
        '</div>' +
        '<article class="qcard" id="qcard">' +
          '<div class="qcard__top">' +
            '<span class="qcard__cat">' + esc(cat.label) + '</span>' +
            '<span class="qcard__index">' + esc(question.id) + ' · ' + esc(cat.en) + '</span>' +
          '</div>' +
          '<h2 class="qcard__text" id="question-text">' + esc(question.q) + '</h2>' +
          '<p class="qcard__hint">凭直觉选，选完自动进入下一题。' + (question.note ? ' 本题附赠一条考据。' : '') + '</p>' +
          '<div class="options" id="options">' + optsHtml + '</div>' +
          '<div class="quiz__foot">' +
            '<div class="quiz__foot-left">' +
              '<button class="btn btn--sm btn--ghost" type="button" data-action="back"' + (cursor === 0 ? ' disabled aria-disabled="true"' : '') + '>← 上一题</button>' +
              '<button class="btn btn--sm btn--ghost" type="button" data-action="exit-quiz">保存退出</button>' +
            '</div>' +
            '<div class="quiz__kbd"><span class="kbd">1</span>-<span class="kbd">4</span> 选择 · <span class="kbd">←</span> 返回 · <span class="kbd">Esc</span> 退出</div>' +
          '</div>' +
        '</article>' +
        '<div class="quiz__save">作答后自动保存进度 · 第 ' + (cursor + 1) + ' / ' + total + ' 题 · 预计还需 ' + Math.max(1, Math.round((total - cursor) * (v.minutes * 60 / total) / 60)) + ' 分钟</div>' +
      '</div>';
  }

  /* ---------- 雷达图 ---------- */
  function radarSvg(traits, persona) {
    var AX = OTTOQUIZ.AXES;
    var n = AX.length;
    var cx = 160, cy = 160, R = 108;
    function pt(i, r) {
      var ang = -Math.PI / 2 + (Math.PI * 2 * i) / n;
      return [cx + Math.cos(ang) * r, cy + Math.sin(ang) * r];
    }
    var rings = [0.25, 0.5, 0.75, 1].map(function (f) {
      var pts = [];
      for (var i = 0; i < n; i++) { var p = pt(i, R * f); pts.push(p[0].toFixed(1) + ',' + p[1].toFixed(1)); }
      return '<polygon class="radar__grid" points="' + pts.join(' ') + '"></polygon>';
    }).join('');
    var axesLines = '';
    for (var i = 0; i < n; i++) {
      var p = pt(i, R);
      axesLines += '<line class="radar__axis" x1="' + cx + '" y1="' + cy + '" x2="' + p[0].toFixed(1) + '" y2="' + p[1].toFixed(1) + '"></line>';
    }
    function poly(vals) {
      var pts = [];
      for (var i = 0; i < n; i++) {
        var p = pt(i, R * U.clamp(vals[AX[i].id] / 100, 0, 1));
        pts.push(p[0].toFixed(1) + ',' + p[1].toFixed(1));
      }
      return pts.join(' ');
    }
    var labels = '';
    for (var j = 0; j < n; j++) {
      var pos = pt(j, R + 22);
      var anchor = 'middle';
      if (pos[0] > cx + 8) anchor = 'start';
      else if (pos[0] < cx - 8) anchor = 'end';
      labels += '<text class="radar__label" x="' + pos[0].toFixed(1) + '" y="' + (pos[1] + 3).toFixed(1) + '" text-anchor="' + anchor + '">' + esc(AX[j].name) + '</text>';
    }
    return '' +
      '<svg class="radar" viewBox="0 0 320 330" role="img" aria-label="你与' + esc(persona.name) + '的八维人格对比">' +
        rings + axesLines +
        '<polygon class="radar__target" points="' + poly(persona.profile) + '"></polygon>' +
        '<polygon class="radar__user" points="' + poly(traits) + '"></polygon>' +
        labels +
      '</svg>' +
      '<div class="radar__legend"><span class="u"><i></i>你</span><span class="t"><i></i>' + esc(persona.name) + '</span></div>';
  }

  /* ---------- 结果页组件 ---------- */
  function rankingHtml(result) {
    return '<div class="rank">' + result.ranking.map(function (r, i) {
      var p = personaById(r.id);
      return '' +
        '<div class="rank__row' + (i === 0 ? ' rank__row--top' : '') + '" style="--rc:' + p.color + '">' +
          '<span class="rank__idx">' + (i + 1) + '</span>' +
          '<div class="rank__body">' +
            '<div class="rank__top"><span class="rank__name"><span class="dot"></span>' + esc(p.name) + '</span><span class="rank__pct">' + r.pct + '%</span></div>' +
            '<div class="rank__bar"><div class="rank__fill" data-w="' + r.pct + '" style="--d:' + (i * 0.06) + 's"></div></div>' +
          '</div>' +
          '<span class="chip" style="font-size:9px;padding:2px 7px">' + (i === 0 ? '主原型' : i === 1 ? '副原型' : i === result.ranking.length - 1 ? '最低' : '#' + (i + 1)) + '</span>' +
        '</div>';
    }).join('') + '</div>';
  }

  function traitsHtml(result) {
    var p = result.personality;
    return '<div class="traits">' + OTTOQUIZ.AXES.map(function (a) {
      var mine = result.traits[a.id];
      var target = p.profile[a.id];
      return '' +
        '<div class="trait__row">' +
          '<span class="trait__name">' + esc(a.name) + '</span>' +
          '<span class="trait__bar" title="你 ' + mine + ' / ' + esc(p.name) + ' ' + target + '"><span class="trait__fill" data-w="' + mine + '"></span></span>' +
          '<span class="trait__val">' + mine + '</span>' +
        '</div>';
    }).join('') + '</div>' +
    '<p class="small" style="margin-top:10px">实心条是你，参考人物「' + esc(p.name) + '」的八维是 ' + OTTOQUIZ.AXES.map(function (a) { return esc(a.name) + ' ' + p.profile[a.id]; }).join(' · ') + '。</p>';
  }

  function timelineHtml(items, kind) {
    var sorted = items.slice().sort(function (a, b) {
      function key(it) {
        var m = String(it.year || '').match(/(\d{4})/);
        if (m) return parseInt(m[1], 10);
        return 9999;
      }
      return key(a) - key(b);
    });
    return '<div class="timeline">' + sorted.map(function (it) {
      var cls = kind === 'good' ? 'timeline__item--good' : kind === 'bad' ? 'timeline__item--bad' : '';
      var badge = kind === 'good' ? '<span class="timeline__badge timeline__badge--good">高光</span>' : kind === 'bad' ? '<span class="timeline__badge timeline__badge--bad">争议</span>' : '';
      return '' +
        '<div class="timeline__item ' + cls + '">' +
          '<div class="timeline__year">' + esc(it.year) + '</div>' +
          '<div class="timeline__text">' + badge + esc(it.text) + '</div>' +
        '</div>';
    }).join('') + '</div>';
  }

  function quotesHtml(quotes) {
    return '<div class="quote-list">' + quotes.map(function (q) {
      return '' +
        '<div class="quote">' +
          '<div class="quote__text">「' + esc(q.text) + '」</div>' +
          '<div class="quote__from"><b>' + esc(q.from) + '</b>' + (q.note ? ' · ' + esc(q.note) : '') + '</div>' +
        '</div>';
    }).join('') + '</div>';
  }

  function relationsHtml(persona) {
    return '<div class="relations">' + persona.sections.relations.map(function (rel) {
      var p = personaById(rel.id);
      if (!p) return '';
      return '' +
        '<button class="rel" type="button" data-action="codex-open" data-persona="' + p.id + '" style="--rc:' + p.color + '">' +
          '<span class="rel__sigil">' + sigil(p) + '</span>' +
          '<span class="rel__body">' +
            '<span class="rel__name">' + esc(p.name) + '<span>' + esc(rel.tag) + '</span></span>' +
            '<span class="rel__desc">' + esc(rel.desc) + '</span>' +
          '</span>' +
          '<span class="rel__tag chip">查看</span>' +
        '</button>';
    }).join('') + '</div>';
  }

  function sourcesHtml(sources) {
    return '<div class="sources">' + sources.map(function (s, i) {
      return '<a href="' + esc(s.u) + '" target="_blank" rel="noopener noreferrer"><span class="src"><span>' + U.escapeHtml(String(i + 1).padStart(2, '0')) + '</span><span>' + esc(s.t) + '</span></span></a>';
    }).join('') + '</div>';
  }


  /* ---------- 分享与扩散组件 ---------- */
  function shareButtonsHtml(withCard) {
    var items = [
      { a: 'share-weibo', ico: '微', t: '微博' },
      { a: 'share-qq', ico: 'Q', t: 'QQ' },
      { a: 'share-bili', ico: 'B', t: 'B站动态' },
      { a: 'share-tieba', ico: '贴', t: '贴吧' },
      { a: 'share-copy', ico: '✎', t: '复制战报' },
      { a: 'share-url', ico: '⌁', t: '复制链接' }
    ];
    if (withCard) items.push({ a: 'share-card', ico: '▣', t: '保存人格卡' });
    return '<div class="share-grid">' + items.map(function (it) {
      return '<button class="share-btn" type="button" data-action="' + it.a + '">' +
        '<span class="share-btn__ico" aria-hidden="true">' + esc(it.ico) + '</span>' +
        '<span>' + esc(it.t) + '</span>' +
      '</button>';
    }).join('') + '</div>';
  }

  function sharePromoHtml(result) {
    return '' +
      '<section class="rcard rcard--wide share-promo" id="share-promo">' +
        '<div class="rcard__head"><span class="rcard__title"><span class="ico">↗</span>把结果甩给群友</span><span class="rcard__sub">SPREAD THE INDEX</span></div>' +
        '<p class="pd__p">一个人测是自嗨，一群人测是节目效果。把链接丢进群，看看谁和你撞人格、谁和你互补、谁和你跨服聊天。</p>' +
        shareButtonsHtml(true) +
        '<div class="share-qr">' +
          '<img src="assets/share-qr.png" alt="扫描二维码打开吉吉国人格图鉴" width="92" height="92" loading="lazy">' +
          '<div class="share-qr__text"><div class="share-qr__title">扫码 / 长按识别</div><div class="small">发帖时建议附上结果截图或人格卡；话题 #吉吉国人格图鉴 #电棍 #OTTO。请勿到无关社区刷屏，不打扰当事人。</div></div>' +
        '</div>' +
      '</section>';
  }

  function renderShareModal(result) {
    var title = result ? '把结果甩给群友' : '分享本站';
    var desc = result
      ? '复制战报、发微博/QQ、或者直接生成人格卡。B站动态与贴吧会先帮你复制好文案，打开后粘贴即可。'
      : '把《吉吉国人格图鉴》分享给群友：7 位人物、30/85/120 题，测完会得到人格卡和八维雷达。';
    return '' +
      '<div class="share-modal">' +
        '<h2 class="h3" id="modal-title">' + esc(title) + '</h2>' +
        '<p class="pd__p" style="margin-top:8px">' + esc(desc) + '</p>' +
        shareButtonsHtml(!!result) +
        '<div class="share-qr">' +
          '<img src="assets/share-qr.png" alt="扫描二维码打开吉吉国人格图鉴" width="92" height="92">' +
          '<div class="share-qr__text"><div class="share-qr__title">扫码 / 长按识别</div><div class="small">本站已开源在 OTTOWiki 组织下。玩梗请留在屏幕里，不打扰任何现实当事人。</div></div>' +
        '</div>' +
        '<p class="small" style="margin-top:10px">话题：#吉吉国人格图鉴 #电棍 #OTTO · 如果链接打不开，请直接搜索「吉吉国人格图鉴」。</p>' +
      '</div>';
  }

  /* ---------- 结果页 ---------- */
  function renderResult(state) {
    var result = state.result;
    if (!result) return renderEmpty('还没有结果', '先做一套题，再来看你的动物园人格。');
    var p = result.personality;
    var v = OTTOQUIZ.VERSIONS[result.versionId];
    var combo = result.combo;
    var secondP = personaById(result.second.id);
    var thirdP = personaById(result.third.id);
    var lowP = personaById(result.lowest.id);
    return '' +
      '<div class="result" style="' + personaVars(p) + '">' +
        '<div class="breadcrumb"><button type="button" data-nav="home">首页</button><span>/</span><span>结果</span><span>/</span><span style="color:' + p.color + '">' + esc(p.name) + '</span></div>' +
        '<section class="result-hero" id="result-hero">' +
          '<div class="result-hero__top">' +
            '<span class="result-hero__label">你的主原型 · MATCH RESULT</span>' +
            '<span class="chip">' + esc(v ? v.name : '') + ' · ' + result.answered + ' 题</span>' +
          '</div>' +
          '<div class="result-hero__main">' +
            '<div class="result-sigil-wrap">' +
              '<span class="result-sigil">' + sigil(p) + '</span>' +
              '<span class="result-sigil__ring" aria-hidden="true"></span>' +
            '</div>' +
            '<h1 class="result-hero__name">' + esc(p.name) + '</h1>' +
            '<div class="result-hero__alias">' + esc(p.alias) + '</div>' +
            '<p class="result-hero__tagline">' + esc(p.tagline) + '</p>' +
            '<div class="result-match">' +
              '<span class="result-match__num" id="match-num" data-target="' + result.top.pct + '">0<sup>%</sup></span>' +
              '<span class="result-match__label">性格匹配度<br>' + esc(result.tier) + '</span>' +
            '</div>' +
            '<div class="result-keywords">' + p.keywords.map(function (k) { return '<span class="chip chip--accent">' + esc(k) + '</span>'; }).join('') + '</div>' +
          '</div>' +
          '<div class="result-hero__actions">' +
            '<button class="btn btn--sm" type="button" data-action="restart" data-version="' + result.versionId + '">再测一次</button>' +
            '<button class="btn btn--sm btn--ghost" type="button" data-action="open-share">分享给群友</button>' +
            '<button class="btn btn--sm btn--ghost" type="button" data-action="share-copy">复制结果文案</button>' +
            '<button class="btn btn--sm btn--ghost" type="button" data-action="share-card">生成人格卡</button>' +
          '</div>' +
        '</section>' +

        (combo ? '<section class="rcard" style="margin-top:14px;border-color:' + hexToRgba(p.color, 0.4) + ';background:linear-gradient(120deg,' + hexToRgba(p.color, 0.1) + ',rgba(255,255,255,.02))">' +
          '<div class="rcard__head"><span class="rcard__title"><span class="ico">✦</span>组合结局解锁：' + esc(combo.name) + '</span><span class="rcard__sub">DUO ENDING</span></div>' +
          '<p class="pd__p">' + esc(combo.desc) + '</p>' +
          '<p class="small" style="margin-top:6px">你的主原型是「' + esc(p.name) + '」，副原型是「' + esc(secondP.name) + '」。</p>' +
        '</section>' : '') +

        (result.compare ? (function () {
          var friendP = personaById(result.compare.aId);
          if (!friendP) return '';
          return '<section class="rcard compare-card" style="margin-top:14px;border-color:' + hexToRgba(friendP.color, 0.42) + ';background:linear-gradient(120deg,' + hexToRgba(friendP.color, 0.09) + ',rgba(255,255,255,.02))">' +
            '<div class="rcard__head"><span class="rcard__title"><span class="ico">⇄</span>你和分享者的相性 · ' + esc(result.compare.label) + '</span><span class="rcard__sub">FRIEND MATCH</span></div>' +
            '<div class="compare-duo">' +
              '<div class="compare-person"><span class="compare-sigil" style="color:' + friendP.color + '">' + sigil(friendP) + '</span><span class="compare-name">' + esc(friendP.name) + '</span><span class="compare-role">分享者</span></div>' +
              '<span class="compare-vs">×</span>' +
              '<div class="compare-person"><span class="compare-sigil" style="color:' + p.color + '">' + sigil(p) + '</span><span class="compare-name">' + esc(p.name) + '</span><span class="compare-role">你</span></div>' +
            '</div>' +
            '<p class="pd__p">' + esc(result.compare.text) + '</p>' +
            (result.compare.combo ? '<p class="small" style="margin-top:6px">组合结局：<b>' + esc(result.compare.combo) + '</b></p>' : '') +
            '<div style="margin-top:12px"><button class="btn btn--sm btn--ghost" type="button" data-action="share-compare">复制我和 TA 的对比</button></div>' +
          '</section>';
        })() : '') +

        '<div class="result-grid">' +
          '<section class="rcard">' +
            '<div class="rcard__head"><span class="rcard__title"><span class="ico">◎</span>八维人格雷达</span><span class="rcard__sub">RADAR</span></div>' +
            '<div class="radar-wrap">' + radarSvg(result.traits, p) + '</div>' +
            traitsHtml(result) +
          '</section>' +
          '<section class="rcard">' +
            '<div class="rcard__head"><span class="rcard__title"><span class="ico">▤</span>七人匹配光谱</span><span class="rcard__sub">SPECTRUM</span></div>' +
            rankingHtml(result) +
            '<p class="small" style="margin-top:12px">主原型 <b style="color:' + p.color + '">' + esc(p.name) + ' ' + result.top.pct + '%</b> · 副原型 <b>' + esc(secondP.name) + ' ' + result.second.pct + '%</b> · 最低 <b>' + esc(lowP.name) + ' ' + result.lowest.pct + '%</b></p>' +
          '</section>' +

          '<section class="rcard rcard--wide">' +
            '<div class="rcard__head"><span class="rcard__title"><span class="ico">✎</span>你的人格切片</span><span class="rcard__sub">PROFILE</span></div>' +
            '<div class="copy-block">' +
              p.sections.slice.map(function (t) { return '<p>' + esc(t) + '</p>'; }).join('') +
              '<p class="small">你的副原型是「' + esc(secondP.name) + '」（' + result.second.pct + '%）——' + esc(secondP.tagline) + ' 第三名是「' + esc(thirdP.name) + '」（' + result.third.pct + '%），最低匹配是「' + esc(lowP.name) + '」（' + result.lowest.pct + '%）。</p>' +
            '</div>' +
          '</section>' +

          '<section class="rcard">' +
            '<div class="rcard__head"><span class="rcard__title"><span class="ico">✧</span>高光时刻</span><span class="rcard__sub">HIGHLIGHTS</span></div>' +
            timelineHtml(p.sections.good, 'good') +
          '</section>' +
          '<section class="rcard">' +
            '<div class="rcard__head"><span class="rcard__title"><span class="ico">⚠</span>争议与阴影</span><span class="rcard__sub">CONTROVERSY</span></div>' +
            timelineHtml(p.sections.bad, 'bad') +
            '<p class="small" style="margin-top:10px">以上内容来自公开报道与社区通说，以中性陈述为目的，不构成对任何人的攻击或定性。</p>' +
          '</section>' +

          '<section class="rcard rcard--wide">' +
            '<div class="rcard__head"><span class="rcard__title"><span class="ico">❝</span>代表语录与梗</span><span class="rcard__sub">QUOTES</span></div>' +
            quotesHtml(p.sections.quotes) +
          '</section>' +

          '<section class="rcard">' +
            '<div class="rcard__head"><span class="rcard__title"><span class="ico">☍</span>关系网</span><span class="rcard__sub">RELATIONS</span></div>' +
            relationsHtml(p) +
          '</section>' +

          '<section class="rcard">' +
            '<div class="rcard__head"><span class="rcard__title"><span class="ico">✉</span>给同类的建议</span><span class="rcard__sub">ADVICE</span></div>' +
            '<p class="pd__p">' + esc(p.sections.advice) + '</p>' +
          '</section>' +

          '<section class="rcard rcard--wide">' +
            '<div class="rcard__head"><span class="rcard__title"><span class="ico">⌕</span>考据与出处</span><span class="rcard__sub">SOURCES</span></div>' +
            sourcesHtml(p.sources) +
            '<p class="small" style="margin-top:10px">考据截至 2026 年 11 月。网络梗与社区通说无法逐一溯源，标注以代表性来源为主。</p>' +
          '</section>' +

          (result.noteLog && result.noteLog.filter(function (n) { return n.note; }).length ?
          '<section class="rcard rcard--wide note-log">' +
            '<details>' +
              '<summary><span class="ico" style="color:var(--gold)">⌁</span> 本次测试掉落的考据 · ' + result.noteLog.filter(function (n) { return n.note; }).length + ' 条</summary>' +
              '<div class="note-log__body">' + result.noteLog.filter(function (n) { return n.note; }).map(function (n) {
                return '<div class="note-log__item"><div class="note-log__q">' + esc(n.title) + '</div><div class="note-log__n">' + esc(n.note) + '</div></div>';
              }).join('') + '</div>' +
            '</details>' +
          '</section>' : '') +
        '</div>' +

        sharePromoHtml(result) +
        '<div class="result-disclaimer"><b>最后一句：</b>人格测试不是判决书，你不需要像任何人。所有人物都是复杂的人，标签只是入口。若你测出的是「棍母」，请记住她是一个虚构的网络形象——现实中那位环卫工人与电棍毫无关系，请勿打扰；电棍的母亲也只是一个普通人。把玩梗的快乐留在屏幕里。</div>' +
        '<div class="result-foot">' +
          '<button class="btn btn--sm btn--ghost" type="button" data-nav="codex">查看七人图鉴</button>' +
          '<button class="btn btn--sm btn--ghost" type="button" data-action="version-other">换个规格再测</button>' +
          '<button class="btn btn--sm btn--ghost" type="button" data-action="share-url">复制分享链接</button>' +
          '<button class="btn btn--sm btn--ghost" type="button" data-action="share-card">保存人格卡</button>' +
        '</div>' +
      '</div>';
  }

  /* ---------- 好友分享结果 ---------- */
  function renderShared(sharePersona) {
    var p = sharePersona;
    return '' +
      '<div class="result" style="' + personaVars(p) + '">' +
        '<section class="result-hero">' +
          '<div class="result-hero__top">' +
            '<span class="result-hero__label">好友开出的结果 · SHARED CARD</span>' +
            '<span class="chip">邀请你测一测</span>' +
          '</div>' +
          '<div class="result-hero__main">' +
            '<div class="result-sigil-wrap"><span class="result-sigil">' + sigil(p) + '</span><span class="result-sigil__ring" aria-hidden="true"></span></div>' +
            '<h1 class="result-hero__name">' + esc(p.name) + '</h1>' +
            '<div class="result-hero__alias">' + esc(p.alias) + '</div>' +
            '<p class="result-hero__tagline">' + esc(p.tagline) + '</p>' +
            '<div class="result-keywords">' + p.keywords.map(function (k) { return '<span class="chip chip--accent">' + esc(k) + '</span>'; }).join('') + '</div>' +
          '</div>' +
          '<div class="result-hero__actions">' +
            '<button class="btn" type="button" data-action="start" data-version="short">我也测 · 30 题</button>' +
            '<button class="btn btn--ghost" type="button" data-action="start" data-version="standard">标准版 · 85 题</button>' +
          '</div>' +
        '</section>' +
        '<section class="rcard" style="margin-top:14px">' +
          '<div class="rcard__head"><span class="rcard__title"><span class="ico">✎</span>关于「' + esc(p.name) + '」</span><span class="rcard__sub">INTRO</span></div>' +
          '<p class="pd__p">' + esc(p.intro) + '</p>' +
          '<div style="margin-top:12px">' + p.sections.slice.map(function (t) { return '<p class="pd__p" style="margin-top:8px">' + esc(t) + '</p>'; }).join('') + '</div>' +
        '</section>' +
        '<section class="rcard" style="margin-top:14px;border-style:dashed">' +
          '<div class="rcard__head"><span class="rcard__title"><span class="ico">⇄</span>测完点亮一张「相性卡」</span><span class="rcard__sub">FRIEND MATCH</span></div>' +
          '<p class="pd__p">你正在看的是别人开出的「' + esc(p.name) + '」。你也可以做一遍：完成测试后，结果页会额外显示你和 TA 的相性——同频、互补、反差，还是跨服聊天。</p>' +
          '<div style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap">' +
            '<button class="btn btn--sm" type="button" data-action="start" data-version="short">开始 30 题</button>' +
            '<button class="btn btn--sm btn--ghost" type="button" data-action="start" data-version="standard">开始 85 题</button>' +
            '<button class="btn btn--sm btn--ghost" type="button" data-action="open-share">分享本站</button>' +
          '</div>' +
        '</section>' +
        '<div class="result-foot"><button class="btn btn--sm btn--ghost" type="button" data-nav="home">回到首页</button><button class="btn btn--sm btn--ghost" type="button" data-nav="codex">查看全部图鉴</button></div>' +
      '</div>';
  }

  /* ---------- 图鉴页 ---------- */
  function renderCodex() {
    return '' +
      '<section class="codex-hero">' +
        '<div class="kicker">THE CAST · 7 PERSONAS</div>' +
        '<h1 class="h2" style="margin-top:8px;font-size:clamp(28px,7vw,40px)">吉吉国人物图鉴</h1>' +
        '<p class="lead" style="margin-top:10px;max-width:620px">七位候选人的完整档案：性格画像、关键时间线、高光与争议、代表语录、关系网与考据出处。点开任意一位，看看他为什么会被划进这个动物园。</p>' +
      '</section>' +
      '<div class="codex-grid">' + OTTOQUIZ.PERSONAS.map(function (p) {
        return '' +
          '<button class="codex-card" type="button" data-action="codex-open" data-persona="' + p.id + '" style="' + personaVars(p) + '">' +
            '<span class="codex-card__sigil">' + sigil(p) + '</span>' +
            '<span class="codex-card__body">' +
              '<span class="codex-card__name">' + esc(p.name) + '<span>' + esc(p.en) + '</span></span>' +
              '<span class="codex-card__alias">' + esc(p.alias) + '</span>' +
              '<span class="codex-card__tag">' + esc(p.tagline) + '</span>' +
              '<span class="codex-card__chips">' + p.keywords.slice(0, 3).map(function (k) { return '<span class="chip">' + esc(k) + '</span>'; }).join('') + '</span>' +
            '</span>' +
          '</button>';
      }).join('') + '</div>' +
      '<div class="result-disclaimer" style="margin-top:20px"><b>阅读提示：</b>本图鉴为粉丝向考据整理，人物评价与争议均不代表本站立场；涉及法律事件以公开报道为准。请勿据此对任何现实当事人实施骚扰或攻击。</div>';
  }

  function renderPersonaModal(p) {
    return '' +
      '<div style="' + personaVars(p) + '">' +
        '<div class="pd__hero">' +
          '<span class="pd__sigil">' + sigil(p) + '</span>' +
          '<div><div class="pd__name">' + esc(p.name) + '</div><div class="pd__alias">' + esc(p.alias) + '</div></div>' +
        '</div>' +
        '<p class="pd__tagline">' + esc(p.tagline) + '</p>' +
        '<div class="result-keywords" style="justify-content:flex-start;margin-top:12px">' + p.keywords.map(function (k) { return '<span class="chip chip--accent">' + esc(k) + '</span>'; }).join('') + '</div>' +
        '<div class="pd__section"><div class="pd__h">八维画像</div><div class="pd__axes">' + OTTOQUIZ.AXES.map(function (a) {
          return '<div class="pd__axis"><span class="pd__axis-label">' + esc(a.name) + '</span><span class="pd__axis-bar"><span class="pd__axis-fill" style="width:' + (p.profile[a.id] || 0) + '%"></span></span></div>';
        }).join('') + '</div></div>' +
        '<div class="pd__section"><div class="pd__h">简介</div><p class="pd__p">' + esc(p.intro) + '</p>' +
          p.sections.slice.map(function (t) { return '<p class="pd__p" style="margin-top:8px">' + esc(t) + '</p>'; }).join('') + '</div>' +
        '<div class="pd__section"><div class="pd__h">高光时刻</div>' + timelineHtml(p.sections.good, 'good') + '</div>' +
        '<div class="pd__section"><div class="pd__h">争议与阴影</div>' + timelineHtml(p.sections.bad, 'bad') + '</div>' +
        '<div class="pd__section"><div class="pd__h">代表语录</div>' + quotesHtml(p.sections.quotes) + '</div>' +
        '<div class="pd__section"><div class="pd__h">关系网</div>' + relationsHtml(p) + '</div>' +
        '<div class="pd__section"><div class="pd__h">考据出处</div>' + sourcesHtml(p.sources) + '</div>' +
        (p.id === 'gunmu' ? '<div class="result-disclaimer" style="margin-top:16px"><b>特别提醒：</b>「棍母」是吉吉国网络都市传说中的虚构形象，照片原型是一位与电棍毫无关系的环卫工人。本测试不消费、不指向任何真实素人，也请你在任何场合都不要去打扰那位老人。现实中电棍的母亲也只是一个普通人。</div>' : '') +
      '</div>';
  }

  /* ---------- 关于页 ---------- */
  function renderAbout() {
    var allSources = [];
    var seen = {};
    OTTOQUIZ.PERSONAS.forEach(function (p) {
      p.sources.forEach(function (s) {
        if (seen[s.u]) return;
        seen[s.u] = 1;
        allSources.push(s);
      });
    });
    var axesRows = OTTOQUIZ.AXES.map(function (a) {
      return '<div class="method__row"><span>' + esc(a.name) + '</span><span class="method__bar"><span class="method__fill" style="width:' + [52, 78, 46, 62, 70, 84, 58, 66][OTTOQUIZ.AXES.indexOf(a) % 8] + '%"></span></span></div>';
    }).join('');
    return '' +
      '<div class="about">' +
        '<div class="kicker">ABOUT THE INDEX</div>' +
        '<h1 class="h2" style="margin-top:8px;font-size:clamp(28px,7vw,40px)">考据说明与测试方法</h1>' +
        '<p class="lead" style="margin-top:10px">这是一个用 Vanilla JS 手写的趣味人格测试。它认真考据，但拒绝把人做成标本；它玩梗，但尽量不伤人。</p>' +

        '<section><h2><span class="idx">01</span>三种规格</h2>' +
          '<ul>' +
            '<li><strong>速通版 30 题</strong>：每个类别取 3 题，约 3 分钟，适合先摸个鱼。</li>' +
            '<li><strong>标准版 85 题</strong>：每类 8-9 题，约 8 分钟，推荐规格，雷达图更有参考价值。</li>' +
            '<li><strong>典藏版 120 题</strong>：全题库，约 12 分钟，能解锁最完整的结果与全部梗注。</li>' +
          '</ul>' +
          '<p class="small" style="margin-top:8px">三种规格共用一套计分模型；题目按类别轮转抽题，因此短版与长版会给出不同但方向一致的结果。</p>' +
        '</section>' +

        '<section><h2><span class="idx">02</span>怎么计分</h2>' +
          '<p>每道题有 4 个选项，每个选项对 1-3 位人物加权（1-3 分），同时对 8 个人格维度做投影。我们会：</p>' +
          '<ul>' +
            '<li>把每个人物的得分除以“该版本中他理论上能拿到的最高分”，得到匹配比例；</li>' +
            '<li>把比例做 0.7 次幂曲线，再映射到 30-99 的展示匹配度；</li>' +
            '<li>用你所有选择的加权投影，画出你的 8 维雷达，并与主原型对比；</li>' +
            '<li>取前两名的组合，判定是否解锁“组合结局”。</li>' +
          '</ul>' +
          '<div class="method" style="margin-top:14px">' + axesRows + '</div>' +
          '<p class="small" style="margin-top:8px">匹配度高只代表“你在这套题里的回答更像他”，不代表你现实中是这个人，更不代表任何价值判断。</p>' +
        '</section>' +

        '<section><h2><span class="idx">03</span>考据原则</h2>' +
          '<ul>' +
            '<li><strong>不只写性格标签。</strong>每个人物的档案都包含：第三方评价、正面言行与影响、负面言行与后果、近况、经典语录与关系网。</li>' +
            '<li><strong>区分事实与玩梗。</strong>判决、封禁、道歉、诉讼等以公开报道为准；社区梗标注“社区通说”，无法核实的标“待考”。</li>' +
            '<li><strong>不美化越界行为。</strong>赌博犯罪、网暴、地域黑、侵犯名誉权都在档案里被明确写出，不当作纯粹的“节目效果”。</li>' +
            '<li><strong>保护真实素人。</strong>“棍母”是虚构网络形象；照片原型是一位与电棍无关的环卫工人，请勿骚扰。现实中的电棍母亲也只是普通人。</li>' +
          '</ul>' +
          '<div class="note danger" style="margin-top:12px">本站反对赌博、网络暴力、地域歧视与任何形式的现实骚扰。测试结果仅供娱乐；若你感到被冒犯，那一定不是我们的本意——请把它当作一次关于“玩梗边界”的提醒。</div>' +
        '</section>' +

        '<section><h2><span class="idx">04</span>隐私与实现</h2>' +
          '<ul>' +
            '<li>纯前端、零依赖、无账号、无埋点、无网络请求；答题进度和结果只保存在你自己的浏览器 localStorage 里。</li>' +
            '<li>音效由 WebAudio 实时合成，无外部音频文件；人物纹章为原创抽象 SVG，不含任何真人肖像。</li>' +
            '<li>你可以随时清空浏览器数据来删除本地记录。</li>' +
          '</ul>' +
          '<p class="small" style="margin-top:8px">实现：HTML + CSS + 原生 JavaScript（无框架、无构建步骤）。由 DeepSeek Harness 会话生成，仅作亚文化研究与娱乐示例。</p>' +
          '<div style="display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:14px;padding:12px 14px;border:1px solid var(--line);border-radius:12px;background:rgba(255,255,255,.02)">' +
            '<span class="small" style="color:var(--ink-2)">答题时的考据梗注提示</span>' +
            '<button class="btn btn--sm btn--ghost" type="button" data-action="toggle-notes">' + (OTTOQUIZ.settings && OTTOQUIZ.settings.notes !== false ? '已开启 · 点击关闭' : '已关闭 · 点击开启') + '</button>' +
          '</div>' +
        '</section>' +

        '<section><h2><span class="idx">05</span>主要考据来源</h2>' +
          '<div class="sources">' + allSources.map(function (s, i) {
            return '<a href="' + esc(s.u) + '" target="_blank" rel="noopener noreferrer"><span class="src"><span>' + String(i + 1).padStart(2, '0') + '</span><span>' + esc(s.t) + '</span></span></a>';
          }).join('') + '</div>' +
          '<p class="small" style="margin-top:10px">另外参考：OTTOWiki（吉吉国的百科全书）、维基百科「吉吉国文化」、萌娘百科相关条目、游民星空、3DM、腾讯新闻 BB姬、光明网、懂球帝、今日头条、百度贴吧、知乎、NGA、B 站公开视频与动态等。考据截至 2026-11-21。</p>' +
        '</section>' +

        '<section><h2><span class="idx">06</span>免责声明</h2>' +
          '<div class="note">本站为非官方粉丝二创作品，与电棍本人、山泥若、炫神、DJGun、Karasu、沈阳美食家及相关平台均无隶属关系。所有内容仅代表对公开网络文化的整理与娱乐化表达，不构成对任何人物的事实定性、名誉评价或法律意见。涉及争议事件请以司法机关、当事方与权威媒体的公开信息为准。</div>' +
        '</section>' +
        '<section><h2><span class="idx">07</span>开源与扩散</h2>' +
          '<p>本站由 OTTOWiki 组织开源维护，代码与文案采用 MIT / CC BY-NC-SA 4.0 双许可（详见仓库 LICENSE）。如果你玩得开心，欢迎：</p>' +
          '<ul>' +
            '<li><a href="https://github.com/OTTOWiki/jijiguo-personality-index" target="_blank" rel="noopener noreferrer">给 GitHub 仓库点一个 Star</a>，或在 Issue 里提交人物资料勘误、题目建议。</li>' +
            '<li>把测试链接分享到相关的群、贴吧、B 站动态；发帖时附上结果截图或人格卡更容易被点开。</li>' +
            '<li>不要在无关社区刷屏、不要拿测试结果攻击具体的人；玩梗的边界，就是本站的底线。</li>' +
          '</ul>' +
          '<div class="share-grid" style="margin-top:14px">' +
            '<a class="share-btn" href="https://github.com/OTTOWiki/jijiguo-personality-index" target="_blank" rel="noopener noreferrer"><span class="share-btn__ico">★</span><span>Star / 收藏</span></a>' +
            '<a class="share-btn" href="https://github.com/OTTOWiki/jijiguo-personality-index/issues" target="_blank" rel="noopener noreferrer"><span class="share-btn__ico">!</span><span>提交勘误</span></a>' +
            '<button class="share-btn" type="button" data-action="open-share"><span class="share-btn__ico">↗</span><span>分享本站</span></button>' +
          '</div>' +
        '</section>' +
        '<div class="result-foot"><button class="btn btn--sm" type="button" data-nav="home">回到首页开始测试</button><button class="btn btn--sm btn--ghost" type="button" data-nav="codex">查看人物图鉴</button></div>' +
      '</div>';
  }

  function renderEmpty(title, desc) {
    return '<div class="empty"><div class="empty__big">♿</div><h2 class="h3">' + esc(title) + '</h2><p class="lead" style="margin-top:8px">' + esc(desc) + '</p><button class="btn" style="margin-top:18px" type="button" data-nav="home">回到首页</button></div>';
  }

  OTTOQUIZ.views = {
    renderHome: renderHome,
    renderQuiz: renderQuiz,
    renderResult: renderResult,
    renderShared: renderShared,
    renderCodex: renderCodex,
    renderAbout: renderAbout,
    renderPersonaModal: renderPersonaModal,
    renderShareModal: renderShareModal,
    renderEmpty: renderEmpty,
    radarSvg: radarSvg,
    hexToRgba: hexToRgba,
    personaVars: personaVars
  };
})(window);
