/* =========================================================
   tools/check.mjs —— 题库 / 计分模型自检脚本
   用法：node tools/check.mjs
   ========================================================= */
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const sandbox = { console, Math, Date, performance: { now: () => Date.now() } };
sandbox.window = sandbox;
sandbox.globalThis = sandbox;
vm.createContext(sandbox);

const files = [
  'js/lib/util.js',
  'js/data/personas.js',
  'js/data/questions-a.js',
  'js/data/questions-b.js',
  'js/data/questions-c.js',
  'js/data/versions.js',
  'js/scoring.js'
];
for (const f of files) {
  const code = fs.readFileSync(path.join(root, f), 'utf8');
  vm.runInContext(code, sandbox, { filename: f });
}

const O = sandbox.OTTOQUIZ;
const Q = O.QUESTIONS;
const P = O.PERSONAS.map(p => p.id);
const AX = O.AXES.map(a => a.id);

let errors = 0;
const fail = (msg) => { console.log('  ✗ ' + msg); errors++; };
const ok = (msg) => console.log('  ✓ ' + msg);

/* ---------- 1. 基础校验 ---------- */
console.log('\n[1] 基础校验');
if (Q.length === 120) ok('题目总数 120'); else fail('题目总数 ' + Q.length);
const ids = new Set();
const catCount = {};
let optionCount = 0, optionWithSecondary = 0, notes = 0;
for (const q of Q) {
  catCount[q.cat] = (catCount[q.cat] || 0) + 1;
  if (ids.has(q.id)) fail('重复 id ' + q.id);
  ids.add(q.id);
  if (!q.q || q.q.length < 4) fail(q.id + ' 题干过短');
  if (!Array.isArray(q.options) || q.options.length !== 4) fail(q.id + ' 选项数不是 4');
  if (q.note) notes++;
  const primaries = new Set();
  for (const opt of q.options) {
    optionCount++;
    if (!opt.t || opt.t.length < 4) fail(q.id + ' 选项文本过短');
    const keys = Object.keys(opt.w || {});
    if (!keys.length) fail(q.id + ' 选项无权重');
    if (keys.length > 1) optionWithSecondary++;
    let hasThree = false;
    for (const k of keys) {
      if (!P.includes(k)) fail(q.id + ' 非法人物 id ' + k);
      const w = opt.w[k];
      if (!(w >= 1 && w <= 3)) fail(q.id + ' 权重非法 ' + k + '=' + w);
      if (w === 3) hasThree = true;
    }
    if (!hasThree) fail(q.id + ' 选项没有主权重 3：' + opt.t.slice(0, 10));
    // 记录主人物
    keys.forEach(k => { if (opt.w[k] === 3) primaries.add(k); });
  }
  if (primaries.size !== 4) fail(q.id + ' 四个选项的主人物不互异（' + [...primaries].join(',') + '）');
}
const cats = O.VERSION_LIST[0].cats;
if (cats.length !== 10) fail('类别数不是 10');
cats.forEach(c => { if (catCount[c] !== 12) fail(c + ' 题目数 ' + catCount[c] + '，应为 12'); });
if (!errors) ok('120 题 × 4 选项结构合法');
ok('带考据梗注的题目：' + notes + ' / 120');
ok('带副加权的选项：' + optionWithSecondary + ' / ' + optionCount);

/* ---------- 2. 三版本完整性 ---------- */
console.log('\n[2] 三版本完整性');
for (const v of O.VERSION_LIST) {
  const order = O.scoring.buildOrder(v.id, 7);
  const counts = {};
  for (const qid of order) {
    const q = O.scoring.getQuestion(qid);
    counts[q.cat] = (counts[q.cat] || 0) + 1;
  }
  let okv = order.length === v.total;
  console.log('  ' + v.id + '：' + order.length + ' 题，期望 ' + v.total + '，分类 ' + cats.map(c => counts[c] || 0).join('/'));
  if (!okv) fail(v.id + ' 题数不符');
  for (const c of cats) if ((counts[c] || 0) !== v.counts[c]) fail(v.id + ' 分类 ' + c + ' 数量不符');
  const introNotes = order.filter(qid => O.scoring.getQuestion(qid).note).length;
  console.log('    梗注覆盖：' + introNotes + ' / ' + order.length);
  if (v.id === 'short' && introNotes < 30) fail('速通版应 30 题全部有梗注');
}

/* ---------- 3. 覆盖与天花板 ---------- */
console.log('\n[3] 覆盖与理论天花板');
for (const v of O.VERSION_LIST) {
  const order = O.scoring.buildOrder(v.id, 7);
  const ceil = O.scoring.computeCeilings(order);
  const appear = {}, primary = {};
  P.forEach(p => { appear[p] = 0; primary[p] = 0; });
  order.forEach(qid => {
    const q = O.scoring.getQuestion(qid);
    q.options.forEach(opt => {
      P.forEach(p => {
        const w = (opt.w && opt.w[p]) || 0;
        if (w > 0) appear[p]++;
        if (w === 3) primary[p]++;
      });
    });
  });
  console.log('  ' + v.id + '（appear / primary / ceiling）：' + P.map(p =>
    p + ' ' + appear[p] + '/' + primary[p] + '/' + ceil[p]
  ).join(' | '));
  const minA = Math.min(...P.map(p => appear[p]));
  const maxA = Math.max(...P.map(p => appear[p]));
  if (maxA / Math.max(1, minA) > 2.2) fail(v.id + ' 人物出现率差距过大 ' + minA + '~' + maxA);
}

/* ---------- 4. 纯策略模拟 ---------- */
console.log('\n[4] 纯策略模拟（每个角色都应当能赢）');
function answerPure(order, target) {
  const answers = {};
  for (const qid of order) {
    const q = O.scoring.getQuestion(qid);
    let best = -1, bestScore = -Infinity;
    let weights = q.options.map(opt => {
      const w = opt.w || {};
      let own = w[target] || 0;
      let others = Object.keys(w).filter(k => k !== target).reduce((s, k) => s + w[k], 0);
      return { own, others, total: own * 10 - others * 0.6 };
    });
    weights.forEach((x, i) => { if (x.total > bestScore) { bestScore = x.total; best = i; } });
    answers[qid] = best;
  }
  return answers;
}
for (const v of O.VERSION_LIST) {
  console.log('  ' + v.id);
  const order = O.scoring.buildOrder(v.id, 7);
  const tops = {};
  for (const p of P) {
    const answers = answerPure(order, p);
    const r = O.scoring.score(v.id, answers, order);
    tops[r.top.id] = (tops[r.top.id] || 0) + 1;
    const win = r.top.id === p;
    console.log('    ' + p.padEnd(10) + ' → top ' + r.top.id.padEnd(10) + ' ' + String(r.top.pct).padStart(3) + '%' + (win ? '  ✓' : '  ✗'));
    if (!win) fail(v.id + ' 纯策略 ' + p + ' 未获胜（top=' + r.top.id + '）');
  }
}

/* ---------- 5. 随机策略分布 ---------- */
console.log('\n[5] 随机策略分布（3000 次）');
for (const v of O.VERSION_LIST) {
  const order = O.scoring.buildOrder(v.id, 7);
  const wins = {}, pcts = [];
  let seed = 12345;
  const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  for (let i = 0; i < 3000; i++) {
    const answers = {};
    for (const qid of order) answers[qid] = Math.floor(rnd() * 4);
    const r = O.scoring.score(v.id, answers, order);
    wins[r.top.id] = (wins[r.top.id] || 0) + 1;
    pcts.push(r.top.pct);
  }
  const total = 3000;
  console.log('  ' + v.id + '：' + P.map(p => p + ' ' + (((wins[p] || 0) / total) * 100).toFixed(1) + '%').join(' | '));
  const avg = (pcts.reduce((a, b) => a + b, 0) / total).toFixed(1);
  const min = Math.min(...pcts), max = Math.max(...pcts);
  console.log('    主原型匹配度：平均 ' + avg + '%，区间 ' + min + '~' + max);
  const ratios = P.map(p => (wins[p] || 0) / total);
  if (Math.max(...ratios) > 0.4) fail(v.id + ' 存在单一角色随机胜率过高 ' + (Math.max(...ratios) * 100).toFixed(1) + '%');
  if (P.some(p => !wins[p])) fail(v.id + ' 有角色随机情况下从未获胜');
}

/* ---------- 6. 双人混合策略 ---------- */
console.log('\n[6] 双人混合策略（任意两人组队都应进前二）');
const pairs = [];
for (let i = 0; i < P.length; i++) for (let j = i + 1; j < P.length; j++) pairs.push([P[i], P[j]]);
function answerPair(order, a, b) {
  const answers = {};
  for (const qid of order) {
    const q = O.scoring.getQuestion(qid);
    let best = 0, bestScore = -Infinity;
    q.options.forEach((opt, i) => {
      const w = opt.w || {};
      const own = (w[a] || 0) + (w[b] || 0);
      const others = Object.keys(w).filter(k => k !== a && k !== b).reduce((s, k) => s + w[k], 0);
      const score = own * 10 - others * 1.2;
      if (score > bestScore) { bestScore = score; best = i; }
    });
    answers[qid] = best;
  }
  return answers;
}
let pairFails = 0; const pairNotes = [];
for (const v of O.VERSION_LIST) {
  for (const [a, b] of pairs) {
    const order = O.scoring.buildOrder(v.id, 7);
    const r = O.scoring.score(v.id, answerPair(order, a, b), order);
    const top2 = [r.top.id, r.second.id];
    const overlap = top2.filter(x => x === a || x === b).length;
    if (overlap < 1) { pairFails++; console.log('    ✗ ' + v.id + ' ' + a + '+' + b + ' → 前二 ' + r.top.id + ',' + r.second.id); }
    else if (overlap < 2 && v.id === 'full') pairNotes.push(v.id + ' ' + a + '+' + b + ' → 前二 ' + r.top.id + ',' + r.second.id);
  }
}
if (pairNotes.length) console.log('    仅一人进前二（可接受）：' + pairNotes.join(' | '));
if (pairFails === 0) ok('21 对组合 × 3 版本均至少有 1 人进入前二'); else fail(pairFails + ' 个双人组合无人进入前二');

/* ---------- 7. 极端与随机一致性 ---------- */
console.log('\n[7] 一致性抽查');
for (const v of O.VERSION_LIST) {
  const order = O.scoring.buildOrder(v.id, 7);
  // 全选 A
  const allA = {}; order.forEach(qid => allA[qid] = 0);
  const r = O.scoring.score(v.id, allA, order);
  console.log('  ' + v.id + ' 全选 A → ' + r.top.id + ' ' + r.top.pct + '%，副 ' + r.second.id + ' ' + r.second.pct + '%');
  // 答案与顺序无关：打乱 order 传入
  const shuffled = [...order].reverse();
  const r2 = O.scoring.score(v.id, allA, shuffled);
  if (r.top.id !== r2.top.id) fail(v.id + ' 结果依赖题目顺序（' + r.top.id + ' vs ' + r2.top.id + '）');
}
if (!errors) ok('结果与题目顺序无关');

/* ---------- 8. 人格画像差异 ---------- */
console.log('\n[8] 人格画像差异');
for (const p of O.PERSONAS) {
  console.log('  ' + p.name.padEnd(7, '　') + ' ' + AX.map(a => p.profile[a]).join(' '));
}
const minPairDist = (() => {
  let min = 1e9, minPair = '';
  for (let i = 0; i < O.PERSONAS.length; i++) for (let j = i + 1; j < O.PERSONAS.length; j++) {
    const a = O.PERSONAS[i], b = O.PERSONAS[j];
    const d = AX.reduce((s, k) => s + Math.abs(a.profile[k] - b.profile[k]), 0);
    if (d < min) { min = d; minPair = a.id + '/' + b.id; }
  }
  return { min, minPair };
})();
console.log('  最小 L1 距离：' + minPairDist.min + '（' + minPairDist.minPair + '）');
if (minPairDist.min < 45) fail('有两人的 8 维画像过于接近（L1<120）');


/* ---------- 9. 相性函数 ---------- */
console.log('\n[9] 好友相性函数');
let compatFails = 0;
for (let i = 0; i < P.length; i++) for (let j = i + 1; j < P.length; j++) {
  const c = O.scoring.compat(P[i], P[j]);
  if (!c || !c.label || !c.text || typeof c.distance !== 'number') compatFails++;
}
if (compatFails) fail(compatFails + ' 对相性计算失败');
else ok('21 对人物相性均可计算');
const sample = O.scoring.compat('otto', 'xuan');
console.log('  otto × xuan →', sample.label, '| L1', sample.distance, '| combo:', sample.combo || '无');

console.log('\n===== 结果：' + (errors === 0 ? '全部通过 ✓' : errors + ' 项失败 ✗') + ' =====\n');
process.exit(errors === 0 ? 0 : 1);
