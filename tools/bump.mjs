/* 更新 index.html 中的资源缓存版本号 */
import fs from 'node:fs';
const p = new URL('../index.html', import.meta.url);
let s = fs.readFileSync(p, 'utf8');
const v = 'v' + Date.now().toString(36);
s = s.replace(/(\.(?:css|js)\?v=)[a-z0-9]+/g, '$1' + v);
fs.writeFileSync(p, s);
console.log('bumped to', v);
