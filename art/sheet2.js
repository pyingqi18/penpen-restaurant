const { catSVG, CATS } = require('./cats.js');
const fs = require('fs');
const cells = [];
for (const k of ['laoda', 'laoer', 'mimi', 'aju', 'penpen']) cells.push([catSVG(k), CATS[k].name + ' · ' + CATS[k].role]);
cells.push([catSVG('laoer', 'back'), '老二 · 背面']);
const vars = [
  [{ fur: 'black', pattern: 'cow', eye: 'green', build: 'fat', brows: false, outfit: 'bowtie' }, '奶牛 + 领结'],
  [{ fur: 'orange', pattern: 'calico', eye: 'amber', build: 'chonk', outfit: 'dance' }, '三花 + 广场舞'],
  [{ fur: 'grey', pattern: 'tabby', eye: 'blue', build: 'normal', outfit: 'scarf', brows: true }, '灰虎斑 + 围巾'],
  [{ fur: 'black', pattern: 'solid', eye: 'copper', build: 'fat', pupil: 'big', outfit: 'apron' }, '黑猫 + 围裙'],
  [{ fur: 'orange', pattern: 'calico', eye: 'amber', build: 'chonk', outfit: 'dance' }, '三花 · 背面', 'back'],
  [{ fur: 'black', pattern: 'cow', eye: 'green', build: 'fat', outfit: 'apron' }, '奶牛 · 背面', 'back'],
];
for (const [o, n, v] of vars) cells.push([catSVG(o, v || 'front'), n]);
fs.writeFileSync('sheet2.html', `<!doctype html><meta charset=utf-8><style>body{margin:0;background:#f3ead9;font-family:"Noto Sans CJK SC";padding:12px;display:grid;grid-template-columns:repeat(6,200px);gap:8px}div{text-align:center;background:#f8f2e6;border-radius:14px;font-size:14px;color:#4d3b2f}</style>${cells.map(([s, n]) => `<div>${s}<br>${n}</div>`).join('')}`);
