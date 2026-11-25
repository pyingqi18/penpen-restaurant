import { catSVG, CATS, STYLES } from './cats.js';
import fs from 'fs';
let rows = '';
for (const sk of Object.keys(STYLES)) {
  let cells = '';
  for (const ck of Object.keys(CATS)) cells += `<div class="c">${catSVG(ck, sk)}<div class="n">${CATS[ck].name} · ${CATS[ck].role}</div></div>`;
  cells += `<div class="c">${catSVG('laoda', sk, 'back')}<div class="n">老大 · 背面</div></div>`;
  rows += `<div class="row"><div class="t">${STYLES[sk].name}</div><div class="cells">${cells}</div></div>`;
}
fs.writeFileSync('sheet.html', `<!doctype html><meta charset=utf-8><style>body{margin:0;background:#fbf3e6;font-family:"Noto Sans CJK SC",sans-serif;color:#4d3b2f;padding:16px}.row{display:flex;align-items:center;margin:6px 0;background:#fffaf2;border-radius:16px;padding:8px}.t{width:120px;font-size:18px;font-weight:700}.cells{display:flex;gap:8px}.c{text-align:center}.n{font-size:14px}</style>${rows}`);
