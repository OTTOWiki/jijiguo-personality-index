/* =========================================================
   吉吉国人格图鉴 · scoring.js
   计分模型：
   - 每题 4 个选项，选项对不同人物有 1-3 的权重
   - 每个人物的原始分 / 该版本中该人物可获得的最高分 = 匹配比例
   - 匹配比例做 0.7 次幂曲线，再映射到 30-99 的展示匹配度
   - 8 维人格雷达由所选选项加权投影到人物的 8 维画像得到
   ========================================================= */
(function (global) {
  'use strict';
  var OTTOQUIZ = global.OTTOQUIZ = global.OTTOQUIZ || {};
  var util = OTTOQUIZ.util;

  function getQuestions() { return OTTOQUIZ.QUESTIONS || []; }
  function getQuestion(id) {
    var qs = getQuestions();
    for (var i = 0; i < qs.length; i++) if (qs[i].id === id) return qs[i];
    return null;
  }
  function getVersion(id) { return (OTTOQUIZ.VERSIONS || {})[id]; }

  /** 根据版本定义与种子，生成题目顺序 */
  function buildOrder(versionId, seed) {
    var version = getVersion(versionId);
    if (!version) return [];
    var rnd = util.mulberry32((seed >>> 0) ^ util.hashString(versionId));
    var byCat = {};
    getQuestions().forEach(function (q) {
      (byCat[q.cat] = byCat[q.cat] || []).push(q);
    });
    var cats = version.cats.slice();
    var order = [];
    var maxN = 0;
    cats.forEach(function (c) { maxN = Math.max(maxN, version.counts[c] || 0); });
    for (var r = 0; r < maxN; r++) {
      var roundCats = util.shuffle(cats, rnd);
      roundCats.forEach(function (cat) {
        var need = version.counts[cat] || 0;
        if (r >= need) return;
        var list = byCat[cat] || [];
        if (list[r]) order.push(list[r].id);
      });
    }
    return order;
  }

  /** 计算某个版本中，每个人物在每道题上的最高可得权重 */
  function computeCeilings(orderIds) {
    var personas = OTTOQUIZ.PERSONAS;
    var ceilings = {};
    personas.forEach(function (p) { ceilings[p.id] = 0; });
    orderIds.forEach(function (qid) {
      var q = getQuestion(qid);
      if (!q) return;
      personas.forEach(function (p) {
        var best = 0;
        q.options.forEach(function (opt) {
          var w = (opt.w && opt.w[p.id]) || 0;
          if (w > best) best = w;
        });
        ceilings[p.id] += best;
      });
    });
    return ceilings;
  }

  /** 核心：根据答案计算结果 */
  function score(versionId, answers, orderIds, opts) {
    var personas = OTTOQUIZ.PERSONAS;
    var order = orderIds || (getVersion(versionId) ? buildOrder(versionId, 7) : Object.keys(answers || {}));
    var ceilings = computeCeilings(order);
    var raw = {};
    var picked = {};
    var primaryCount = {};
    personas.forEach(function (p) { raw[p.id] = 0; picked[p.id] = 0; primaryCount[p.id] = 0; });
    var traitSum = {};
    OTTOQUIZ.AXES.forEach(function (a) { traitSum[a.id] = 0; });
    var weightSum = 0;
    var answered = 0;
    var noteLog = [];

    order.forEach(function (qid) {
      var q = getQuestion(qid);
      if (!q) return;
      var idx = answers ? answers[qid] : undefined;
      if (idx == null || !q.options[idx]) return;
      answered++;
      var opt = q.options[idx];
      var w = opt.w || {};
      Object.keys(w).forEach(function (pid) {
        var val = w[pid] || 0;
        if (val <= 0) return;
        raw[pid] = (raw[pid] || 0) + val;
        picked[pid] = (picked[pid] || 0) + 1;
        if (val >= 3) primaryCount[pid] = (primaryCount[pid] || 0) + 1;
        var persona = OTTOQUIZ.PERSONA_BY_ID[pid];
        if (persona) {
          OTTOQUIZ.AXES.forEach(function (a) {
            traitSum[a.id] += val * (persona.profile[a.id] || 0);
          });
          weightSum += val;
        }
      });
      noteLog.push({ qid: qid, title: q.q, note: opt.note || q.note || '' });
    });

    var ranking = personas.map(function (p) {
      var ceil = ceilings[p.id] || 0;
      var ratio = ceil > 0 ? raw[p.id] / ceil : 0;
      var pct = Math.round(30 + 70 * Math.pow(util.clamp(ratio, 0, 1), 0.7));
      pct = util.clamp(pct, 1, 99);
      return {
        id: p.id,
        name: p.name,
        short: p.short,
        color: p.color,
        raw: raw[p.id],
        ceiling: ceil,
        ratio: ratio,
        pct: pct,
        picked: picked[p.id],
        primaryCount: primaryCount[p.id]
      };
    });

    var traits = {};
    OTTOQUIZ.AXES.forEach(function (a) {
      traits[a.id] = weightSum > 0 ? Math.round(util.clamp(traitSum[a.id] / weightSum, 0, 100)) : 50;
    });

    /* 排序：匹配比例 > 原始分 > 8 维距离（小优） > 稳定哈希 */
    var answersKey = order.map(function (qid) { return qid + ':' + (answers && answers[qid]); }).join('|');
    ranking.forEach(function (r) {
      var persona = OTTOQUIZ.PERSONA_BY_ID[r.id];
      var dist = 0;
      OTTOQUIZ.AXES.forEach(function (a) {
        dist += Math.abs(traits[a.id] - (persona.profile[a.id] || 50));
      });
      r.traitDist = dist / OTTOQUIZ.AXES.length;
      r.tie = util.hashString(answersKey + '#' + r.id) / 4294967295;
    });
    ranking.sort(function (a, b) {
      if (Math.abs(b.ratio - a.ratio) > 0.0001) return b.ratio - a.ratio;
      if (b.raw !== a.raw) return b.raw - a.raw;
      if (Math.abs(a.traitDist - b.traitDist) > 0.01) return a.traitDist - b.traitDist;
      return a.tie - b.tie;
    });
    ranking.forEach(function (r, i) { r.rank = i + 1; });

    var top = ranking[0];
    var second = ranking[1];
    var third = ranking[2];
    var lowest = ranking[ranking.length - 1];
    var combo = null;
    (OTTOQUIZ.COMBOS || []).forEach(function (c) {
      if (!combo && ((c.pair[0] === top.id && c.pair[1] === second.id) || (c.pair[1] === top.id && c.pair[0] === second.id))) combo = c;
    });

    /* 匹配等级文案 */
    var tier = top.pct >= 85 ? '灵魂共振' : top.pct >= 72 ? '高度同频' : top.pct >= 58 ? '气质相近' : top.pct >= 42 ? '若即若离' : '反向人格';
    var locale = (opts && opts.locale) || {};

    return {
      versionId: versionId,
      answered: answered,
      total: order.length,
      ranking: ranking,
      top: top,
      second: second,
      third: third,
      lowest: lowest,
      traits: traits,
      combo: combo,
      tier: tier,
      noteLog: noteLog,
      generatedAt: Date.now(),
      personality: OTTOQUIZ.PERSONA_BY_ID[top.id]
    };
  }


  /** 两人相性：基于 8 维画像的 L1 距离，给分享对比用 */
  function compat(aId, bId) {
    var a = OTTOQUIZ.PERSONA_BY_ID[aId];
    var b = OTTOQUIZ.PERSONA_BY_ID[bId];
    if (!a || !b || aId === bId) return null;
    var dist = 0;
    OTTOQUIZ.AXES.forEach(function (ax) {
      dist += Math.abs((a.profile[ax.id] || 50) - (b.profile[ax.id] || 50));
    });
    var avg = dist / OTTOQUIZ.AXES.length;
    var ka = (a.keywords && a.keywords[0]) || a.short;
    var kb = (b.keywords && b.keywords[0]) || b.short;
    var label, text;
    if (avg <= 15) {
      label = '同频双生';
      text = '你们像同一段音频的两次采样：一个在' + ka + '，另一个也在' + ka + '。区别只在于谁先破防、谁先笑出声。';
    } else if (avg <= 29) {
      label = '互补搭档';
      text = '一个负责' + ka + '，一个负责' + kb + '；搭在一起，刚好是一支能上分的队伍，也是一台偶尔会过载的机器。';
    } else if (avg <= 42) {
      label = '反差拍档';
      text = '你们的八维几乎处处不同：' + ka + ' 遇上 ' + kb + '，同框就是节目效果。别急着互相审判，先一起把活整完。';
    } else {
      label = '跨服聊天';
      text = '你们活在两个频道里，联机需要翻译器。也正因如此，对方的直播间对你来说像一档全新的节目。';
    }
    var combo = null;
    (OTTOQUIZ.COMBOS || []).forEach(function (c) {
      if (!combo && ((c.pair[0] === aId && c.pair[1] === bId) || (c.pair[1] === aId && c.pair[0] === bId))) combo = c;
    });
    return { aId: aId, bId: bId, label: label, text: text, distance: dist, combo: combo ? combo.name : null };
  }

  /** 供分享链接使用：只根据人物 id 生成简化结果 */
  function sharedResult(personaId) {
    var p = OTTOQUIZ.PERSONA_BY_ID[personaId];
    if (!p) return null;
    return { shared: true, personality: p, top: { id: p.id, name: p.name, color: p.color, pct: null } };
  }

  function validateVersion(versionId) {
    var version = getVersion(versionId);
    if (!version) return { ok: false, error: '未知版本' };
    var order = buildOrder(versionId, 7);
    var counts = {};
    order.forEach(function (qid) {
      var q = getQuestion(qid);
      if (!q) return;
      counts[q.cat] = (counts[q.cat] || 0) + 1;
    });
    var missing = [];
    version.cats.forEach(function (c) {
      if ((counts[c] || 0) !== version.counts[c]) missing.push(c + ':' + (counts[c] || 0) + '/' + version.counts[c]);
    });
    return { ok: missing.length === 0 && order.length === version.total, total: order.length, counts: counts, missing: missing };
  }

  OTTOQUIZ.scoring = {
    buildOrder: buildOrder,
    computeCeilings: computeCeilings,
    score: score,
    sharedResult: sharedResult,
    compat: compat,
    getQuestion: getQuestion,
    validateVersion: validateVersion
  };
})(window);
