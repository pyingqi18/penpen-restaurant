// 盆盆餐厅 · 小图标（口味 / 状态）和鱼（水墨淡彩，和其他图同一套画法）

// ---------- 小图标 viewBox 40×40 ----------
function iconSVG(key) {
  const id = 'ic' + (++_sid);
  const g = [];
  const W_ = (d, c, op) => wash(id, d, c, op);
  switch (key) {
    case '辣': g.push(`<path d="M 12 10 q -4 14 6 24 q 10 6 14 -2 q -12 -2 -14 -20 Z" fill="#cf3b2c" filter="url(#${id}wash)"/>` + W_(ellD(13, 9, 6, 3), '#6f9a4e') + line([P(13, 6), P(16, 2)], 1.6, 0.8) + line(quadPts(P(12, 11), P(10, 26), P(24, 33)), 1.2, 0.6)); break;
    case '麻': g.push(`<g filter="url(#${id}wash)">${[[14, 22], [21, 18], [26, 25], [18, 29], [24, 32], [12, 30]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="4.2" fill="#a8432f"/>`).join('')}<ellipse cx="26" cy="11" rx="9" ry="4.5" fill="#6f9a4e" transform="rotate(-30 26 11)"/></g>` + line([P(20, 18), P(24, 12)], 1.2, 0.7)); break;
    case '甜': g.push(W_(ellD(20, 20, 9, 7), '#f2a7b8') + W_(`M 11 20 l -8 -6 v 12 Z`, '#f6c6d0') + W_(`M 29 20 l 8 -6 v 12 Z`, '#f6c6d0') + `<path d="M 15 16 l 10 8 M 17 24 l 8 -6" stroke="#fff" stroke-width="1.6" opacity="0.7"/>` + line(sample([segQ(P(11, 20), P(20, 30), P(29, 20))], 8), 1.4, 0.7)); break;
    case '肉': g.push(W_(`M 8 22 q 0 -14 14 -12 q 12 2 8 14 q -4 10 -14 8 q -8 -2 -8 -10 Z`, '#b9603f') + `<ellipse cx="14" cy="18" rx="4" ry="2.5" fill="#fff" opacity="0.3"/>` + W_(rectD(26, 26, 10, 4, 2), '#f3efe6') + W_(ellD(36, 25, 3, 3), '#f3efe6') + W_(ellD(36, 31, 3, 3), '#f3efe6') + line(sample([segQ(P(8, 22), P(10, 34), P(22, 32))], 8), 1.6, 0.75)); break;
    case '面': g.push(W_(`M 6 20 Q 8 34 20 34 Q 32 34 34 20 Z`, '#f3eee6') + W_(ellD(20, 20, 14, 4), '#e9cf8f') + `<path d="M 9 20 q 3 -3 6 0 q 3 3 6 0 q 3 -3 6 0 q 2 2 4 0" stroke="#d9b76a" stroke-width="2" fill="none"/>` + line([P(16, 18), P(30, 2)], 1.6, 0.8) + line([P(20, 18), P(34, 4)], 1.6, 0.8) + line(sample([segQ(P(6, 20), P(8, 36), P(20, 35)), segQ(P(20, 35), P(32, 36), P(34, 20))], 8), 1.8, 0.8)); break;
    case '米饭': g.push(W_(`M 6 22 Q 8 36 20 36 Q 32 36 34 22 Z`, '#8aa3b8') + W_(`M 8 22 q 2 -14 12 -14 q 10 0 12 14 Z`, '#fbfaf5') + `<g fill="#e6e2d6">${[[14, 16], [20, 12], [25, 17], [17, 20]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="1.6" ry="1"/>`).join('')}</g>` + line(sample([segQ(P(6, 22), P(8, 38), P(20, 37)), segQ(P(20, 37), P(32, 38), P(34, 22))], 8), 1.8, 0.8)); break;
    case '海鲜': g.push(W_(`M 6 20 q 10 -12 22 -2 l 8 -6 v 16 l -8 -6 q -12 10 -22 -2 Z`, '#6f9fbf') + `<circle cx="11" cy="18" r="1.6" fill="${INK}"/>` + `<path d="M 15 15 q 3 5 0 10" stroke="#fff" stroke-width="1.4" fill="none" opacity="0.6"/>` + line(sample([segQ(P(6, 20), P(16, 6), P(28, 18))], 8), 1.4, 0.7)); break;
    case '清淡': g.push(W_(`M 8 32 Q 6 10 32 6 Q 34 30 8 32 Z`, '#8fbf72') + line(quadPts(P(8, 32), P(18, 18), P(30, 8)), 1.4, 0.7) + line([P(16, 24), P(14, 16)], 0.8, 0.5) + line([P(22, 17), P(28, 20)], 0.8, 0.5)); break;
    case '蛋': g.push(W_(`M 6 22 q -2 -12 12 -14 q 14 -2 16 10 q 2 12 -12 14 q -14 2 -16 -10 Z`, '#fbfaf5') + W_(ellD(20, 20, 6.5, 6), '#f2b134') + `<circle cx="18" cy="18" r="1.8" fill="#fff" opacity="0.7"/>` + line(sample([segQ(P(6, 22), P(8, 34), P(22, 32))], 8), 1.4, 0.7)); break;
    case '花生': g.push(`<path d="M 20 5 q 9 0 8 9 q -3 6 0 9 q 3 11 -8 12 q -11 -1 -8 -12 q 3 -3 0 -9 q -1 -9 8 -9 Z" fill="#d6a56a" filter="url(#${id}wash)"/>` + `<g fill="#b8844a" opacity="0.6">${[[17, 10], [23, 12], [18, 27], [23, 30], [20, 18]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.1"/>`).join('')}</g>` + line(sample([segQ(P(13, 9), P(11, 24), P(18, 34))], 8), 1.4, 0.7)); break;
    case '香菜': g.push(line([P(20, 38), P(20, 14)], 1.4, 0.7) + line([P(20, 24), P(10, 14)], 1, 0.6) + line([P(20, 22), P(30, 12)], 1, 0.6) + `<g filter="url(#${id}wash)">${[[20, 10], [10, 11], [30, 9], [14, 18], [27, 17], [20, 4]].map(([x, y]) => `<path d="M ${x - 5} ${y} q 0 -6 5 -6 q 5 0 5 6 q -5 4 -10 0 Z" fill="#5f9a4a"/>`).join('')}</g>`); break;
    case 'order': g.push(W_(rectD(8, 6, 22, 28, 2), '#fbf6ec') + W_(rectD(8, 6, 22, 5, 1), '#c9533f') + [14, 19, 24, 29].map((y) => line([P(12, y), P(26, y)], 0.9, 0.5)).join('') + box(8, 6, 22, 28, 1.4, 0.8) + W_(`M 28 30 l 8 -18 l 3 1.5 l -8 18 l -4 2 Z`, '#e3a43a') + line([P(28, 30), P(36, 12)], 1, 0.7)); break;
    case 'bill': g.push(W_(ellD(20, 21, 14, 14), '#e8b443') + W_(ellD(20, 21, 10, 10), '#f2c95e') + `<path d="M 15 14 l 5 6 l 5 -6 M 20 20 v 10 M 15 22 h 10 M 15 26 h 10" stroke="#8a5a10" stroke-width="2" fill="none" stroke-linecap="round"/>` + line(sample([segQ(P(6, 22), P(8, 36), P(22, 35))], 8), 1.6, 0.7)); break;
    case 'water': g.push(W_(`M 10 8 L 12 34 Q 20 37 28 34 L 30 8 Z`, '#e1eef3', 0.9) + W_(`M 11 18 L 12.5 33 Q 20 36 27.5 33 L 29 18 Z`, '#8fc0d8', 0.9) + line([P(10, 8), P(12, 34)], 1.4, 0.75) + line([P(30, 8), P(28, 34)], 1.8, 0.8) + `<path d="M 15 22 v 8" stroke="#fff" stroke-width="1.6" opacity="0.7"/>`); break;
    case 'eat': g.push(W_(`M 6 22 Q 8 36 20 36 Q 32 36 34 22 Z`, '#f3eee6') + W_(ellD(20, 22, 14, 4), '#d9a06a') + `<path d="M 14 16 q -3 -4 0 -8 M 20 15 q -3 -4 0 -8 M 26 16 q -3 -4 0 -8" stroke="#b9b2a8" stroke-width="1.6" fill="none"/>` + line(sample([segQ(P(6, 22), P(8, 38), P(20, 37)), segQ(P(20, 37), P(32, 38), P(34, 22))], 8), 1.8, 0.8)); break;
    case 'wait': g.push(W_(`M 11 6 h 18 l -7 14 l 7 14 h -18 l 7 -14 Z`, '#f3eee6') + W_(`M 14 30 h 12 l -6 -8 Z`, '#e3b36a') + line([P(10, 6), P(30, 6)], 2, 0.85) + line([P(10, 34), P(30, 34)], 2, 0.85) + line([P(11, 6), P(18, 20), P(11, 34)], 1.2, 0.7) + line([P(29, 6), P(22, 20), P(29, 34)], 1.6, 0.75)); break;
    case 'heart': g.push(`<path d="M 20 34 C 4 24 4 10 12 8 C 16 7 19 10 20 13 C 21 10 24 7 28 8 C 36 10 36 24 20 34 Z" fill="#ef6f7a" filter="url(#${id}wash)"/><ellipse cx="13" cy="15" rx="3" ry="2" fill="#fff" opacity="0.6"/>`); break;
    case 'cross': g.push(W_(ellD(20, 20, 14, 14), '#e0645a') + `<path d="M 14 14 l 12 12 M 26 14 l -12 12" stroke="#fff" stroke-width="3.4" stroke-linecap="round"/>`); break;
    case 'meh': g.push(W_(ellD(20, 20, 14, 14), '#e3b36a') + `<path d="M 13 26 q 7 -5 14 0" stroke="${INK}" stroke-width="2" fill="none"/><circle cx="15" cy="16" r="1.8" fill="${INK}"/><circle cx="25" cy="16" r="1.8" fill="${INK}"/>`); break;
    case 'ask': g.push(W_(ellD(20, 20, 14, 14), '#d9cfc6') + `<text x="20" y="27" text-anchor="middle" font-size="20" font-weight="700" fill="#fff">?</text>`); break;
    default: g.push(W_(ellD(20, 20, 12, 12), '#d9cfc6'));
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" width="80" height="80"><defs>${sceneDefs(id, 40, 40)}</defs><g filter="url(#${id}ink)">${g.join('')}</g></svg>`;
}

// ---------- 鱼 viewBox 80×50 ----------
const FISH = [
  { id: 'xia', n: '河虾', se: ['spring', 'summer', 'autumn', 'winter'], w: 5, ing: 'shrimp', size: [4, 9], blurb: '池塘边石头缝里最多。' },
  { id: 'jiyu', n: '鲫鱼', se: ['spring', 'summer', 'autumn'], w: 4, ing: 'fish', size: [12, 24], blurb: '肉嫩刺多，熊猫奶奶爱喝鲫鱼汤。' },
  { id: 'niqiu', n: '泥鳅', se: ['spring', 'summer'], w: 3, ing: 'fish', size: [10, 18], blurb: '滑溜溜的，老二抓了三次才抓住。' },
  { id: 'caoyu', n: '草鱼', se: ['summer', 'autumn'], w: 3, ing: 'fish', size: [30, 60], blurb: '水煮鱼最常用的鱼。' },
  { id: 'luyu', n: '鲈鱼', se: ['autumn', 'winter'], w: 3, ing: 'fish', size: [25, 45], blurb: '秋天最肥，清蒸最鲜。' },
  { id: 'xie', n: '螃蟹', se: ['autumn'], w: 2, ing: null, coins: 15, size: [8, 14], blurb: '横着走。秋天才有，卖给早市阿姨换零花钱。' },
  { id: 'guiyu', n: '鳜鱼', se: ['winter'], w: 2, ing: 'fish', size: [25, 40], blurb: '冬天凿冰钓到的，身上有花斑。' },
  { id: 'jinli', n: '锦鲤', se: ['spring', 'summer', 'autumn', 'winter'], w: 0.5, ing: null, coins: 0, luck: true, size: [40, 70], blurb: '很少见。放生了，据说今天客人心情会特别好。' },
];
function fishSVG(kind) {
  const id = 'fs' + (++_sid);
  const g = [];
  const body = (col, belly, len = 1, h = 1) => `<path d="M ${12} 25 Q ${30} ${25 - 16 * h} ${54 * len + 6} 25 Q ${30} ${25 + 16 * h} 12 25 Z" fill="${col}" filter="url(#${id}wash)"/><path d="M 16 27 Q 32 ${27 + 10 * h} ${50 * len} 27 Z" fill="${belly}" opacity="0.7" filter="url(#${id}wash)"/>`;
  const tail = (col, x = 60) => `<path d="M ${x} 25 l 14 -11 q -4 11 0 22 Z" fill="${col}" filter="url(#${id}wash)"/>`;
  const eye = (x = 19) => `<circle cx="${x}" cy="22" r="2.4" fill="#fbf6ec"/><circle cx="${x}" cy="22" r="1.4" fill="${INK}"/>`;
  const outline = (len = 1, h = 1) => line(sample([segQ(P(12, 25), P(30, 25 - 16 * h), P(54 * len + 6, 25))], 12), 1.8, 0.8) + line(sample([segQ(P(54 * len + 6, 25), P(30, 25 + 16 * h), P(12, 25))], 12), 1.4, 0.65);
  if (kind === 'jiyu') g.push(tail('#8a9a90') + body('#a9b5a8', '#e6e8de') + eye() + outline() + `<path d="M 30 12 q 8 -4 14 2" stroke="#7d8c82" stroke-width="3" fill="none"/>`);
  else if (kind === 'caoyu') g.push(tail('#7d8a5c', 66) + body('#9aa874', '#e9e3c6', 1.1, 0.8) + eye() + outline(1.1, 0.8));
  else if (kind === 'luyu') g.push(tail('#6f8a6a') + body('#9fb29a', '#eef0e6') + eye() + outline() + `<g opacity="0.5">${[28, 36, 44].map((x) => `<path d="M ${x} 14 l -2 12" stroke="#3f5a48" stroke-width="3"/>`).join('')}</g>` + `<path d="M 26 12 l 4 -6 l 4 6 l 4 -6 l 4 6" stroke="#5f7a5a" stroke-width="1.6" fill="none"/>`);
  else if (kind === 'niqiu') g.push(`<path d="M 8 26 C 20 18 40 32 64 24 C 70 22 72 26 74 28 C 60 32 40 34 8 28 Z" fill="#8a6f4f" filter="url(#${id}wash)"/>` + `<circle cx="13" cy="24" r="1.4" fill="${INK}"/>` + line([P(8, 26), P(2, 22)], 0.8, 0.6) + line([P(8, 27), P(2, 30)], 0.8, 0.6) + line(sample([segC(P(8, 26), P(20, 18), P(40, 32), P(64, 24))], 14), 1.4, 0.7));
  else if (kind === 'guiyu') g.push(tail('#9a7a4a') + body('#c4a46a', '#efe2c0') + eye() + outline() + `<g fill="#5a4a30" opacity="0.6">${[[28, 20], [36, 26], [44, 19], [32, 30], [48, 27]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.4"/>`).join('')}</g>` + `<path d="M 26 12 l 3 -6 l 3 6 l 3 -6 l 3 6 l 3 -6 l 3 6" stroke="#7a5a30" stroke-width="1.6" fill="none"/>`);
  else if (kind === 'jinli') g.push(tail('#f3efe6') + body('#fbfaf5', '#fbfaf5') + `<g filter="url(#${id}wash)"><ellipse cx="30" cy="20" rx="8" ry="5" fill="#e8772e"/><ellipse cx="46" cy="27" rx="6" ry="4" fill="#e8772e"/><ellipse cx="22" cy="27" rx="4" ry="3" fill="#d9453a"/></g>` + eye() + outline() + line([P(12, 26), P(6, 30)], 0.8, 0.6));
  else if (kind === 'xie') g.push(`<g filter="url(#${id}wash)"><ellipse cx="40" cy="28" rx="18" ry="12" fill="#d9603a"/>${[-1, 1].map((s) => [0, 1, 2].map((i) => `<path d="M ${40 + s * 14} ${30 + i * 4} l ${s * 12} ${4 + i * 3}" stroke="#c4502f" stroke-width="3" stroke-linecap="round"/>`).join('')).join('')}<circle cx="18" cy="16" r="7" fill="#d9603a"/><circle cx="62" cy="16" r="7" fill="#d9603a"/></g>` + `<path d="M 18 12 l 4 4 M 62 12 l -4 4" stroke="#fbf6ec" stroke-width="2"/><circle cx="35" cy="20" r="2" fill="${INK}"/><circle cx="45" cy="20" r="2" fill="${INK}"/>` + line(sample([segQ(P(22, 28), P(40, 44), P(58, 28))], 10), 1.6, 0.75));
  else return ingSVG('shrimp');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 50" width="160" height="100"><defs>${sceneDefs(id, 80, 50)}</defs><g filter="url(#${id}ink)">${g.join('')}</g></svg>`;
}
if (typeof module !== 'undefined') module.exports = { iconSVG, fishSVG, FISH };
