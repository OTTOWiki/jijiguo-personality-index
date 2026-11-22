/* =========================================================
   吉吉国人格图鉴 · versions.js
   三种规格：30 / 85 / 120 题
   题库共 10 个类别 × 12 题 = 120 题；短版每类取 3 题，
   标准版按 8-9 题分配，典藏版全取。
   ========================================================= */
(function (global) {
  'use strict';
  var OTTOQUIZ = global.OTTOQUIZ = global.OTTOQUIZ || {};

  OTTOQUIZ.VERSION_LIST = [
    {
      id: 'short',
      name: '速通版',
      en: 'QUICK SCAN',
      countText: '30',
      minutes: 3,
      tagline: '三分钟，先看看你和动物园有没有缘分。',
      desc: '从每个类别里挑最锋利的 3 题，快速锁定你的主原型与副原型。适合第一次来、或者只想摸个鱼的人。',
      tags: ['30 题', '约 3 分钟', '全人物覆盖'],
      featured: false,
      cats: ['自我认知', '语言对线', '情绪破防', '游戏胜负', '创作抽象', '社交关系', '金钱现实', '底线选择', '网络冲浪', '世界观'],
      counts: { 自我认知: 3, 语言对线: 3, 情绪破防: 3, 游戏胜负: 3, 创作抽象: 3, 社交关系: 3, 金钱现实: 3, 底线选择: 3, 网络冲浪: 3, 世界观: 3 },
      total: 30
    },
    {
      id: 'standard',
      name: '标准版',
      en: 'STANDARD',
      countText: '85',
      minutes: 8,
      tagline: '八分钟，够看清一个人，也够看清你自己。',
      desc: '全类别的中段题目，覆盖 7 位人物的高光、争议与名场面。匹配更稳，雷达图更有参考价值，是我们最推荐的规格。',
      tags: ['85 题', '约 8 分钟', '推荐规格', '含考据梗注'],
      featured: true,
      cats: ['自我认知', '语言对线', '情绪破防', '游戏胜负', '创作抽象', '社交关系', '金钱现实', '底线选择', '网络冲浪', '世界观'],
      counts: { 自我认知: 9, 语言对线: 9, 情绪破防: 9, 游戏胜负: 8, 创作抽象: 8, 社交关系: 8, 金钱现实: 9, 底线选择: 8, 网络冲浪: 9, 世界观: 8 },
      total: 85
    },
    {
      id: 'full',
      name: '典藏版',
      en: 'ARCHIVE EDITION',
      countText: '120',
      minutes: 12,
      tagline: '十二分钟，把吉吉国从里到外翻一遍。',
      desc: '全题库 120 题，一个人的梗、言行、争议与近况全都在里面。做完之后，你不仅知道自己像谁，还能顺手背下半个吉吉国野史。',
      tags: ['120 题', '约 12 分钟', '全题库', '含全部梗注'],
      featured: false,
      cats: ['自我认知', '语言对线', '情绪破防', '游戏胜负', '创作抽象', '社交关系', '金钱现实', '底线选择', '网络冲浪', '世界观'],
      counts: { 自我认知: 12, 语言对线: 12, 情绪破防: 12, 游戏胜负: 12, 创作抽象: 12, 社交关系: 12, 金钱现实: 12, 底线选择: 12, 网络冲浪: 12, 世界观: 12 },
      total: 120
    }
  ];

  OTTOQUIZ.VERSIONS = OTTOQUIZ.VERSION_LIST.reduce(function (acc, v) { acc[v.id] = v; return acc; }, {});

  /* 类别展示名与短标签 */
  OTTOQUIZ.CATEGORY_META = {
    自我认知: { label: '自我认知', en: 'WHO AM I', icon: '◎' },
    语言对线: { label: '语言与对线', en: 'TRASH TALK', icon: '✎' },
    情绪破防: { label: '情绪与破防', en: 'TILT', icon: '☹' },
    游戏胜负: { label: '游戏与胜负', en: 'GAME', icon: '▷' },
    创作抽象: { label: '创作与抽象', en: 'CREATE', icon: '♬' },
    社交关系: { label: '社交与关系', en: 'SOCIAL', icon: '☍' },
    金钱现实: { label: '金钱与现实', en: 'MONEY', icon: '¥' },
    底线选择: { label: '底线与选择', en: 'ETHICS', icon: '§' },
    网络冲浪: { label: '网络冲浪', en: 'ONLINE', icon: '⌁' },
    世界观: { label: '世界观', en: 'WORLDVIEW', icon: '∞' }
  };
})(window);
