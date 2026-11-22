/* =========================================================
   吉吉国人格图鉴 · share.js
   分享文案、分享链接、1080×1440 人格卡（Canvas 手绘，无外部图片）
   ========================================================= */
(function (global) {
  'use strict';
  var OTTOQUIZ = global.OTTOQUIZ = global.OTTOQUIZ || {};
  var U = OTTOQUIZ.util;

  var FONT = '"PingFang SC","HarmonyOS Sans SC","Noto Sans SC","Source Han Sans SC","Microsoft YaHei",system-ui,sans-serif';
  var MONO = 'ui-monospace,"SFMono-Regular","JetBrains Mono",Menlo,Consolas,monospace';
  var SITE_URL = 'https://ottowiki.github.io/jijiguo-personality-index/';

  /* ---------- 站点地址 ---------- */
  function baseUrl() {
    var href = global.location.href.split('#')[0].split('?')[0];
    if (!href || !/^https?:/.test(href)) return SITE_URL;
    return href.replace(/index\.html$/, '');
  }
  function siteUrl() { return baseUrl(); }

  /* ---------- 文案 ---------- */
  function resultText(result) {
    var p = result.personality;
    var second = OTTOQUIZ.PERSONA_BY_ID[result.second.id];
    var low = OTTOQUIZ.PERSONA_BY_ID[result.lowest.id];
    var v = OTTOQUIZ.VERSIONS[result.versionId];
    var lines = [];
    lines.push('我在《吉吉国人格图鉴》里测出了「' + p.name + '」——' + result.top.pct + '% 匹配，' + result.tier + '。');
    lines.push('');
    lines.push(p.tagline);
    lines.push('');
    lines.push('关键词：' + p.keywords.join(' / '));
    lines.push('副原型：' + second.name + '（' + result.second.pct + '%）');
    lines.push('最低匹配：' + low.name + '（' + result.lowest.pct + '%）');
    if (result.combo) lines.push('组合结局：' + result.combo.name + ' —— ' + result.combo.desc);
    lines.push('');
    if (result.compare) {
      var friend = OTTOQUIZ.PERSONA_BY_ID[result.compare.aId];
      if (friend) lines.push('和分享者的相性：' + friend.name + ' × ' + p.name + ' —— ' + result.compare.label);
    }
    lines.push('规格：' + (v ? v.name + ' ' + v.countText + ' 题' : result.total + ' 题'));
    lines.push('测测你是吉吉国里的谁：' + resultUrl(p.id));
    lines.push('');
    lines.push('#吉吉国人格图鉴 #电棍 #OTTO');
    return lines.join('\n');
  }

  function resultUrl(personaId) {
    var base = baseUrl();
    return base + '#/share/' + personaId;
  }

  function siteText() {
    return [
      '《吉吉国人格图鉴》——你是电棍 OTTO 亚文化圈里的哪一位？',
      '7 位人物 · 30/85/120 题 · 纯 Vanilla JS · 无依赖',
      '考据向，但玩得挺开心。测完会得到八维雷达、七人匹配光谱和一张可以发群里的人格卡。',
      '',
      '测一测：' + siteUrl(),
      '',
      '#吉吉国人格图鉴 #电棍 #OTTO #抽象文化'
    ].join('\n');
  }

  function compareText(result) {
    if (!result || !result.compare) return '';
    var me = result.personality;
    var friend = OTTOQUIZ.PERSONA_BY_ID[result.compare.aId];
    if (!friend) return '';
    return [
      '我和 ' + friend.name + ' 的相性：' + result.compare.label + '。',
      result.compare.text,
      '',
      '我的结果：' + me.name + '（' + result.top.pct + '%）',
      'TA 的结果：' + friend.name,
      '你也来测：' + siteUrl()
    ].join('\n');
  }

  function weiboUrl(text, url) {
    return 'https://service.weibo.com/share/share.php?url=' + encodeURIComponent(url || siteUrl()) +
      '&title=' + encodeURIComponent(text || siteText());
  }
  function qqUrl(text, url) {
    return 'https://connect.qq.com/widget/shareqq/index.html?url=' + encodeURIComponent(url || siteUrl()) +
      '&title=' + encodeURIComponent('吉吉国人格图鉴') +
      '&summary=' + encodeURIComponent(text || siteText());
  }
  function biliUrl() { return 'https://t.bilibili.com/'; }
  function tiebaUrl() { return 'https://tieba.baidu.com/f?kw=otto'; }

  /* ---------- Canvas 工具 ---------- */
  function roundRect(ctx, x, y, w, h, r) {
    var radius = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + w, y, x + w, y + h, radius);
    ctx.arcTo(x + w, y + h, x, y + h, radius);
    ctx.arcTo(x, y + h, x, y, radius);
    ctx.arcTo(x, y, x + w, y, radius);
    ctx.closePath();
  }
  function wrapText(ctx, text, x, y, maxWidth, lineHeight, maxLines) {
    var chars = String(text).split('');
    var line = '';
    var lines = [];
    for (var i = 0; i < chars.length; i++) {
      var test = line + chars[i];
      if (ctx.measureText(test).width > maxWidth && line) {
        lines.push(line);
        line = chars[i];
        if (maxLines && lines.length >= maxLines - 1) {
          /* 最后一行兜底 */
          var rest = chars.slice(i).join('');
          var last = '';
          for (var j = 0; j < rest.length; j++) {
            if (ctx.measureText(last + rest[j] + '…').width > maxWidth) break;
            last += rest[j];
          }
          lines.push(last + '…');
          line = null;
          break;
        }
      } else {
        line = test;
      }
    }
    if (line) lines.push(line);
    for (var k = 0; k < lines.length; k++) {
      ctx.fillText(lines[k], x, y + k * lineHeight);
    }
    return y + lines.length * lineHeight;
  }
  function drawChip(ctx, text, x, y, opts) {
    var padX = 18, h = 44;
    ctx.font = '600 21px ' + FONT;
    var w = ctx.measureText(text).width + padX * 2;
    ctx.fillStyle = opts.fill || 'rgba(255,255,255,0.05)';
    roundRect(ctx, x, y - h + 12, w, h, 22);
    ctx.fill();
    ctx.strokeStyle = opts.stroke || 'rgba(255,255,255,0.16)';
    ctx.lineWidth = 1.2;
    roundRect(ctx, x, y - h + 12, w, h, 22);
    ctx.stroke();
    ctx.fillStyle = opts.color || 'rgba(238,241,247,0.9)';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x + padX, y - h + 12 + h / 2);
    return w;
  }
  function hexToRgba(hex, a) {
    var h = String(hex || '#ffc94a').replace('#', '');
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    var n = parseInt(h, 16);
    return 'rgba(' + ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')';
  }

  /* ---------- 人格卡 ---------- */
  function drawCard(result) {
    if (!result || !result.personality) throw new Error('no result');
    var p = result.personality;
    var canvas = document.getElementById('share-canvas');
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.id = 'share-canvas';
      canvas.width = 1080; canvas.height = 1440;
      document.body.appendChild(canvas);
    }
    var W = 1080, H = 1440;
    var ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, W, H);

    /* 背景 */
    var bg = ctx.createLinearGradient(0, 0, W * 0.4, H);
    bg.addColorStop(0, '#0b0d12');
    bg.addColorStop(0.55, '#0e1118');
    bg.addColorStop(1, '#090a0e');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    /* 颜色光晕 */
    var glow = ctx.createRadialGradient(W / 2, 430, 40, W / 2, 430, 620);
    glow.addColorStop(0, hexToRgba(p.color, 0.22));
    glow.addColorStop(0.5, hexToRgba(p.color, 0.07));
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, H);

    /* 网格点阵 */
    ctx.fillStyle = 'rgba(255,255,255,0.055)';
    for (var gx = 84; gx < W - 60; gx += 36) {
      for (var gy = 84; gy < H - 60; gy += 36) {
        ctx.beginPath();
        ctx.arc(gx, gy, 1.3, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    /* 边框 */
    ctx.strokeStyle = 'rgba(255,255,255,0.14)';
    ctx.lineWidth = 2;
    roundRect(ctx, 44, 44, W - 88, H - 88, 30);
    ctx.stroke();
    ctx.strokeStyle = hexToRgba(p.color, 0.4);
    ctx.lineWidth = 1;
    roundRect(ctx, 58, 58, W - 116, H - 116, 22);
    ctx.stroke();

    /* 顶部 */
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#eef1f7';
    ctx.font = '900 30px ' + FONT;
    ctx.fillText('吉吉国人格图鉴', 96, 130);
    ctx.fillStyle = 'rgba(255,255,255,0.42)';
    ctx.font = '400 15px ' + MONO;
    ctx.fillText('OTTO SUBCULTURE PERSONALITY INDEX', 96, 158);
    ctx.textAlign = 'right';
    ctx.fillStyle = hexToRgba(p.color, 0.9);
    ctx.font = '600 17px ' + MONO;
    ctx.fillText('MATCH CARD / ' + String(result.top.pct).padStart(2, '0'), W - 96, 132);
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.font = '400 14px ' + MONO;
    ctx.fillText('EXHIBIT · ZOO ARCHIVE', W - 96, 158);

    /* 分隔线 */
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.beginPath();
    ctx.moveTo(96, 186);
    ctx.lineTo(W - 96, 186);
    ctx.stroke();

    /* 纹章 */
    var cx = W / 2, cy = 340;
    ctx.save();
    ctx.strokeStyle = hexToRgba(p.color, 0.35);
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 8]);
    ctx.beginPath();
    ctx.arc(cx, cy, 145, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.strokeStyle = hexToRgba(p.color, 0.8);
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(cx, cy, 112, 0, Math.PI * 2);
    ctx.stroke();
    var innerGlow = ctx.createRadialGradient(cx, cy, 10, cx, cy, 118);
    innerGlow.addColorStop(0, hexToRgba(p.color, 0.28));
    innerGlow.addColorStop(1, hexToRgba(p.color, 0.04));
    ctx.fillStyle = innerGlow;
    ctx.beginPath();
    ctx.arc(cx, cy, 112, 0, Math.PI * 2);
    ctx.fill();
    var initial = (p.en || p.name).charAt(0);
    ctx.fillStyle = p.color;
    ctx.font = '900 104px ' + MONO;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(initial, cx, cy + 6);
    ctx.restore();

    /* 名字 */
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 92px ' + FONT;
    ctx.fillText(p.name, W / 2, 575);
    ctx.fillStyle = 'rgba(255,255,255,0.46)';
    ctx.font = '400 22px ' + MONO;
    ctx.fillText(p.alias.toUpperCase(), W / 2, 615);

    /* 匹配度 */
    ctx.fillStyle = p.color;
    ctx.font = '800 132px ' + MONO;
    ctx.textAlign = 'center';
    ctx.fillText(result.top.pct + '%', W / 2, 750);
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.font = '600 22px ' + FONT;
    ctx.fillText('性格匹配度 · ' + result.tier, W / 2, 786);

    /* 关键词 chips */
    ctx.font = '600 21px ' + FONT;
    var chipW = 0;
    var gap = 12;
    var kw = p.keywords.slice(0, 5);
    var widths = kw.map(function (k) { return ctx.measureText(k).width + 36; });
    widths.forEach(function (w) { chipW += w + gap; });
    chipW -= gap;
    var chipX = (W - chipW) / 2;
    kw.forEach(function (k, i) {
      drawChip(ctx, k, chipX, 846, { fill: hexToRgba(p.color, 0.12), stroke: hexToRgba(p.color, 0.45), color: p.color });
      chipX += widths[i] + gap;
    });

    /* tagline */
    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(230,235,244,0.92)';
    ctx.font = '500 28px ' + FONT;
    var tagY = 908;
    var afterTag = wrapText(ctx, p.tagline, 120, tagY, W - 240, 44, 2);

    /* 分栏信息 */
    var second = OTTOQUIZ.PERSONA_BY_ID[result.second.id];
    var third = OTTOQUIZ.PERSONA_BY_ID[result.third.id];
    var low = OTTOQUIZ.PERSONA_BY_ID[result.lowest.id];
    var rows = [
      ['副原型', second.name, result.second.pct, second.color],
      ['第三名', third.name, result.third.pct, third.color],
      ['最低匹配', low.name, result.lowest.pct, low.color]
    ];
    var infoY = 1032;
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.beginPath();
    ctx.moveTo(96, infoY - 30);
    ctx.lineTo(W - 96, infoY - 30);
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.42)';
    ctx.font = '600 16px ' + MONO;
    ctx.fillText('SPECTRUM / 光谱', 96, infoY - 8);
    rows.forEach(function (row, i) {
      var y = infoY + 38 + i * 50;
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.font = '500 22px ' + FONT;
      ctx.textAlign = 'left';
      ctx.fillText(row[0], 96, y);
      ctx.fillStyle = '#eef1f7';
      ctx.font = '700 24px ' + FONT;
      ctx.fillText(row[1], 220, y);
      /* 进度条 */
      var bx = 560, bw = 380, bh = 10;
      ctx.fillStyle = 'rgba(255,255,255,0.08)';
      roundRect(ctx, bx, y - 18, bw, bh, 5);
      ctx.fill();
      ctx.fillStyle = row[3];
      roundRect(ctx, bx, y - 18, Math.max(14, bw * row[2] / 100), bh, 5);
      ctx.fill();
      ctx.textAlign = 'right';
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      ctx.font = '600 22px ' + MONO;
      ctx.fillText(row[2] + '%', W - 96, y);
      ctx.textAlign = 'left';
    });

    /* 组合结局 / 语录 */
    var quote = p.sections.quotes && p.sections.quotes[0];
    var qY = 1248;
    ctx.strokeStyle = hexToRgba(p.color, 0.4);
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(96, qY - 34);
    ctx.lineTo(96, qY + 56);
    ctx.stroke();
    ctx.fillStyle = 'rgba(238,241,247,0.92)';
    ctx.font = '600 30px ' + FONT;
    var quoteText = quote ? '「' + quote.text + '」' : p.tagline;
    var afterQuote = wrapText(ctx, quoteText, 124, qY, W - 250, 42, 1);

    /* 底部 */
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.font = '400 16px ' + MONO;
    ctx.fillText('JIJIGUO PERSONALITY INDEX · 仅供娱乐 · 请勿上升真人', W / 2, 1330);
    ctx.fillStyle = hexToRgba(p.color, 0.8);
    ctx.font = '500 18px ' + MONO;
    var url = resultUrl(p.id).replace(/^https?:\/\//, '');
    ctx.fillText(url, W / 2, 1352);
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.font = '400 14px ' + FONT;
    ctx.fillText('非官方粉丝二创 · 考据自公开资料 · 不含真人肖像', W / 2, 1374);

    return canvas.toDataURL('image/png');
  }

  OTTOQUIZ.share = {
    SITE_URL: SITE_URL,
    baseUrl: baseUrl,
    siteUrl: siteUrl,
    resultText: resultText,
    siteText: siteText,
    compareText: compareText,
    resultUrl: resultUrl,
    weiboUrl: weiboUrl,
    qqUrl: qqUrl,
    biliUrl: biliUrl,
    tiebaUrl: tiebaUrl,
    drawCard: drawCard,
    lastCardDataUrl: null
  };
})(window);
