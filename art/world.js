// 盆盆餐厅 · 炊具、食材、庄稼、白天大地图（同一套水墨淡彩；依赖 cats.js + scene.js 的工具）

// ---------- 炊具 viewBox 100×70 ----------
function cookwareSVG(kind) {
  const id = 'k' + (++_sid);
  const g = [`<defs>${sceneDefs(id, 100, 70)}</defs>`];
  g.push(`<ellipse cx="50" cy="64" rx="38" ry="5" fill="${INK}" opacity="0.15" filter="url(#${id}soft)"/>`);
  if (kind === 'wok') { // 炒锅：黑铁锅 + 长柄
    g.push(wash(id, `M 12 36 Q 16 62 50 62 Q 84 62 88 36 Z`, '#4a4440') + wash(id, ellD(50, 36, 38, 9), '#6d6560'));
    g.push(line(sample([segQ(P(12, 37), P(16, 64), P(50, 63)), segQ(P(50, 63), P(84, 64), P(88, 37))], 12), 2.6, 0.9, { bias: 0.6 }));
    g.push(line([P(88, 38), P(97, 34), P(100, 32)], 3.6, 0.9) + line([P(10, 38), P(4, 36)], 2.4, 0.8));
  } else if (kind === 'pot') { // 面锅：深汤锅 + 两耳
    g.push(wash(id, rectD(20, 22, 60, 40, 8), '#9aa3a8') + wash(id, ellD(50, 22, 30, 7), '#c9d0d3'));
    g.push(wash(id, ellD(50, 22, 24, 5), '#e8dcc0'));
    g.push(box(20, 22, 60, 40, 2.4, 0.85) + line([P(12, 30), P(20, 30)], 3, 0.85) + line([P(80, 30), P(88, 30)], 3, 0.85));
    g.push(line([P(60, 20), P(74, 2)], 2, 0.75) + line([P(64, 20), P(80, 4)], 2, 0.75));
  } else if (kind === 'steamer') { // 竹蒸笼三层
    for (let i = 0; i < 3; i++) { const y = 60 - i * 14; g.push(wash(id, rectD(18, y - 14, 64, 14, 5), i % 2 ? '#cfa86a' : '#d9b77a') + line([P(18, y), P(50, y + 1), P(82, y)], 1.8, 0.75) + line([P(18, y - 7), P(82, y - 7)], 0.9, 0.35)); }
    g.push(wash(id, ellD(50, 18, 32, 7), '#e2c58e') + line(sample([segQ(P(18, 18), P(50, 6), P(82, 18))], 10), 2, 0.75) + line([P(83, 60), P(84, 38), P(83, 18)], 2.6, 0.85));
  } else if (kind === 'clay') { // 砂锅：深褐圆锅 + 盖子
    g.push(wash(id, `M 18 34 Q 18 64 50 64 Q 82 64 82 34 Z`, '#6e4a36') + wash(id, ellD(50, 32, 32, 9), '#8a5c42'));
    g.push(wash(id, `M 24 32 Q 50 12 76 32 Z`, '#7b513c') + wash(id, ellD(50, 18, 7, 4), '#5a3b2b'));
    g.push(line(sample([segQ(P(18, 35), P(18, 66), P(50, 65)), segQ(P(50, 65), P(82, 66), P(82, 35))], 12), 2.6, 0.9, { bias: 0.6 }) + line(sample([segQ(P(24, 32), P(50, 12), P(76, 32))], 10), 1.8, 0.7));
    g.push(line([P(82, 40), P(94, 38), P(96, 44)], 2.4, 0.8) + line([P(18, 40), P(6, 38), P(4, 44)], 2, 0.75));
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 70" width="200" height="140">${g[0]}<g filter="url(#${id}ink)">${g.slice(1).join('')}</g></svg>`;
}

// ---------- 食材图标 viewBox 60×60 ----------
function ingSVG(key) {
  const id = 'i' + (++_sid);
  const g = [`<defs>${sceneDefs(id, 60, 60)}</defs>`];
  const W_ = (d, c) => wash(id, d, c);
  if (key === 'tofu') { g.push(W_(rectD(12, 22, 36, 26, 4), '#f6efdf') + W_(`M 12 22 l 8 -8 h 36 l -8 8 Z`, '#fbf7ec') + W_(`M 48 22 l 8 -8 v 26 l -8 8 Z`, '#e6dcc6')); g.push(box(12, 22, 36, 26, 2, 0.8) + line([P(48, 22), P(56, 14)], 1.6, 0.7) + line([P(12, 22), P(20, 14), P(56, 14)], 1.4, 0.6)); }
  else if (key === 'beef') { g.push(W_(`M 10 34 Q 12 16 32 16 Q 52 16 52 32 Q 50 48 30 48 Q 12 48 10 34 Z`, '#b9473a') + `<path d="M 18 30 q 10 -6 20 2 M 22 40 q 10 -4 18 0" stroke="#f3dcd4" stroke-width="3" fill="none" filter="url(#${id}wash)"/>`); g.push(line(sample([segQ(P(10, 34), P(12, 16), P(32, 16)), segQ(P(32, 16), P(52, 16), P(52, 32)), segQ(P(52, 32), P(50, 48), P(30, 48))], 8), 2, 0.8)); }
  else if (key === 'pork') { g.push(W_(rectD(10, 20, 40, 22, 6), '#b9473a') + W_(rectD(10, 20, 40, 7, 4), '#e9b48c')); g.push(box(10, 20, 40, 22, 2, 0.8) + line([P(30, 8), P(30, 20)], 1.6, 0.7) + line(quadPts(P(24, 10), P(30, 4), P(36, 10)), 1.6, 0.7)); }
  else if (key === 'chili') { for (const [dx, r] of [[-8, -20], [6, 14]]) g.push(`<path d="M ${30 + dx} 16 q -6 16 2 34 q 8 -16 2 -34 Z" fill="#c9392c" transform="rotate(${r} ${30 + dx} 30)" filter="url(#${id}wash)"/>`); g.push(W_(ellD(24, 14, 6, 3), '#6f9a4e') + W_(ellD(36, 14, 6, 3), '#6f9a4e') + line([P(22, 16), P(26, 46), P(30, 50)], 1.6, 0.6) + line([P(38, 16), P(36, 46), P(34, 50)], 1.8, 0.65)); }
  else if (key === 'peanut') { for (const [x, y, r] of [[22, 30, -30], [38, 32, 20]]) { g.push(`<path d="M ${x} ${y - 14} q 8 0 7 7 q -3 7 0 9 q 2 9 -7 10 q -9 -1 -7 -10 q 3 -2 0 -9 q -1 -7 7 -7 Z" fill="#d6a56a" transform="rotate(${r} ${x} ${y})" filter="url(#${id}wash)"/>`); g.push(line(sample([segQ(P(x - 6, y - 10), P(x - 8, y + 6), P(x, y + 12))], 8), 1.4, 0.6)); } }
  else if (key === 'shrimp') { g.push(`<path d="M 14 22 Q 30 8 46 20 Q 52 34 40 44 Q 30 48 22 42 L 30 36 Q 38 36 38 28 Q 32 20 20 30 Z" fill="#e98a6a" filter="url(#${id}wash)"/>`); g.push(line(sample([segQ(P(14, 22), P(30, 8), P(46, 20)), segQ(P(46, 20), P(52, 34), P(40, 44))], 8), 2, 0.8) + line([P(14, 22), P(4, 16), P(2, 10)], 1, 0.6) + line([P(16, 24), P(6, 22), P(2, 20)], 1, 0.6) + `<circle cx="18" cy="22" r="1.8" fill="${INK}"/>`); }
  else if (key === 'fish') { g.push(`<path d="M 6 30 Q 24 14 44 30 Q 24 46 6 30 Z" fill="#9fb29a" filter="url(#${id}wash)"/><path d="M 44 30 l 12 -10 q -3 10 0 20 Z" fill="#7d8c82" filter="url(#${id}wash)"/><circle cx="13" cy="28" r="2" fill="${INK}"/>` + line(sample([segQ(P(6, 30), P(24, 14), P(44, 30))], 10), 1.8, 0.8)); }
  else if (key === 'tealeaf') { for (const [cx, cy, r] of [[22, 34, -0.6], [38, 30, 0.5], [30, 44, 0.1]]) { g.push(`<ellipse cx="${cx}" cy="${cy}" rx="9" ry="16" transform="rotate(${r * 57} ${cx} ${cy})" fill="#7fae4e" stroke="#2c2420" stroke-width="1.8"/><path d="M${cx} ${cy - 13} L${cx} ${cy + 13}" transform="rotate(${r * 57} ${cx} ${cy})" stroke="#4f7d3a" stroke-width="1.4"/>`); } }
  else if (key === 'rice') { g.push(W_(`M 14 22 Q 12 50 30 52 Q 48 50 46 22 Q 30 16 14 22 Z`, '#efe6d2') + W_(ellD(30, 22, 16, 5), '#fbf8f0')); g.push(line(sample([segQ(P(14, 22), P(12, 50), P(30, 52)), segQ(P(30, 52), P(48, 50), P(46, 22))], 10), 2, 0.8) + line([P(20, 34), P(40, 34)], 1.4, 0.5) + `<circle cx="30" cy="42" r="4" fill="#d9a441" opacity="0.8"/>`); }
  else if (key === 'egg') { for (const [x, y] of [[24, 34], [38, 32]]) g.push(W_(`M ${x} ${y - 14} Q ${x + 10} ${y - 12} ${x + 10} ${y + 2} Q ${x + 9} ${y + 12} ${x} ${y + 12} Q ${x - 9} ${y + 12} ${x - 10} ${y + 2} Q ${x - 10} ${y - 12} ${x} ${y - 14} Z`, x < 30 ? '#f7efe0' : '#e9cba4') + line(sample([segQ(P(x + 10, y), P(x + 9, y + 12), P(x, y + 12)), segQ(P(x, y + 12), P(x - 9, y + 12), P(x - 10, y + 2))], 8), 1.8, 0.75)); }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 60" width="120" height="120">${g[0]}<g filter="url(#${id}ink)">${g.slice(1).join('')}</g></svg>`;
}

// ---------- 庄稼 viewBox 80×80（ripe=熟了；否则是小苗）----------
function cropSVG(kind, ripe) {
  const id = 'c' + (++_sid);
  const g = [`<defs>${sceneDefs(id, 80, 80)}</defs>`];
  const leaves = ripe ? [[-16, -30, -40], [16, -30, 40], [-8, -46, -15], [10, -48, 18], [0, -24, 0]] : [[-8, -14, -40], [8, -14, 40]];
  g.push(`<g filter="url(#${id}wash)">${leaves.map(([dx, dy, r]) => `<ellipse cx="${40 + dx}" cy="${74 + dy}" rx="${ripe ? 8 : 5}" ry="${ripe ? 15 : 9}" transform="rotate(${r} ${40 + dx} ${74 + dy})" fill="${ripe ? '#6f8f5c' : '#93b07c'}"/>`).join('')}</g>`);
  g.push(line([P(40, 76), P(40, ripe ? 30 : 58)], 1.6, 0.6));
  if (ripe && kind === 'chili') g.push(`<g filter="url(#${id}wash)">${[[28, 44, -20], [52, 42, 25], [40, 34, 5]].map(([x, y, r]) => `<path d="M ${x} ${y - 4} q -4 10 1 20 q 5 -10 1 -20 Z" fill="#cf3b2c" transform="rotate(${r} ${x} ${y})"/>`).join('')}</g>`);
  if (ripe && kind === 'peanut') g.push(`<g filter="url(#${id}wash)">${[[26, 46], [54, 46], [40, 38]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="5" fill="#f2d06e"/>`).join('')}</g>`);
  g.push(wash(id, ellD(40, 76, 18, 4), '#8b6a4a', 0.6));
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80" width="160" height="160">${g[0]}<g filter="url(#${id}ink)">${g.slice(1).join('')}</g></svg>`;
}

// ---------- 四季配色 ----------
const SEASONS = {
  spring: { n: '春', grass: '#d8e2b8', patch: '#e4ead0', trees: ['#f2c6d0', '#eeb7c4', '#86a874', '#f5d3da'], flowers: ['#f2c6d0', '#fbf6ec', '#f2d06e', '#e9a9b9'], pond: '#a6c8cf', bamboo: '#8aa874' },
  summer: { n: '夏', grass: '#cbdca8', patch: '#b9cf92', trees: ['#6f9a5c', '#7f9a6c', '#5f8a4e', '#86a874'], flowers: ['#f2d06e', '#efb6c0', '#fbf6ec', '#c9b3e0'], pond: '#8fbfc9', bamboo: '#6f9a5c' },
  autumn: { n: '秋', grass: '#dcd4a4', patch: '#e2c58e', trees: ['#d98c3a', '#c4602f', '#e0b040', '#b9763c'], flowers: ['#e0b040', '#c4602f', '#f3e3c0', '#d98c3a'], pond: '#9fb9b9', bamboo: '#a8a05c' },
  winter: { n: '冬', grass: '#eceee8', patch: '#dfe4e2', trees: ['#dfe6e6', '#cfd9d9', '#e8eded', '#b9c6c6'], flowers: ['#fbfbf8', '#e8eded', '#c9d6dc', '#fbfbf8'], pond: '#c9dde3', bamboo: '#8fa88f' },
};
const seasonOf = (day) => ['spring', 'summer', 'autumn', 'winter'][Math.floor((day - 1) / 7) % 4];

// 白墙黛瓦店面：白墙黛瓦、马头墙、蜂窝砖饰、蓝彩檐带、门罩、支摘窗外卖口
function huizhouShop(id, s, se) {
  const g = [], x0 = s.x, y0 = s.y, w = s.w, h = s.h, bot = y0 + h, dx = s.door.x;
  const TILE = '#4a4a4f', snow = se === 'winter';
  g.push(`<ellipse cx="${x0 + w / 2}" cy="${bot + 6}" rx="${w * 0.62}" ry="30" fill="${INK}" opacity="0.12" filter="url(#${id}soft)"/>`);
  // 马头墙（左右各三级台阶）
  const gable = (side) => {
    const o = []; const steps = [[0, 60, 150], [1, 20, 100], [2, -20, 56]];
    for (const [i, top, ww] of steps) {
      const gx = side < 0 ? x0 - 8 : x0 + w + 8 - ww;
      o.push(wash(id, rectD(gx, y0 + top, ww, 120 - top + 40), '#f2efe8'));
      o.push(wash(id, rectD(gx - 6, y0 + top - 10, ww + 12, 14, 3), TILE));
      const ex = side < 0 ? gx - 6 : gx + ww + 6;
      o.push(wash(id, `M ${ex} ${y0 + top - 10} l ${side * 14} -10 l ${-side * 2} 14 Z`, TILE));
      if (snow) o.push(wash(id, rectD(gx - 4, y0 + top - 16, ww + 8, 8, 4), '#fbfbf8'));
      o.push(line([P(gx - 6, y0 + top + 4), P(gx + ww + 6, y0 + top + 4)], 1.6, 0.7));
    }
    return o.join('');
  };
  g.push(gable(-1) + gable(1));
  // 主墙
  g.push(wash(id, rectD(x0, y0 + 60, w, h - 60), '#f4f1ea'));
  g.push(`<rect x="${x0}" y="${bot - 70}" width="${w}" height="46" fill="#d9d4c8" opacity="0.55" filter="url(#${id}soft)"/>`);
  for (let i = 0; i < 12; i++) g.push(wash(id, rectD(x0 + i * 40, bot - 24, 38, 24, 2), i % 2 ? '#a8a49c' : '#b6b1a8'));
  // 屋檐 + 瓦当 + 蓝彩檐带
  g.push(wash(id, `M ${x0 + 30} ${y0 + 84} L ${x0 + 70} ${y0 + 44} H ${x0 + w - 70} L ${x0 + w - 30} ${y0 + 84} Z`, TILE));
  for (let x = x0 + 80; x < x0 + w - 70; x += 18) g.push(line([P(x, y0 + 48), P(x - 8, y0 + 82)], 1, 0.4));
  for (let x = x0 + 40; x < x0 + w - 30; x += 18) g.push(`<circle cx="${x}" cy="${y0 + 86}" r="5" fill="#5a5a60" filter="url(#${id}wash)"/>`);
  if (snow) g.push(wash(id, `M ${x0 + 66} ${y0 + 44} H ${x0 + w - 66} q 6 6 0 10 H ${x0 + 66} q -6 -4 0 -10 Z`, '#fbfbf8'));
  g.push(wash(id, rectD(x0 + 40, y0 + 92, w - 80, 14), '#4d6585'));
  for (let x = x0 + 52; x < x0 + w - 50; x += 26) g.push(`<path d="M ${x} ${y0 + 99} q 5 -5 10 0 q 5 5 10 0" stroke="#e9e1d2" stroke-width="1.6" fill="none" opacity="0.8"/>`);
  g.push(line([P(x0 + 40, y0 + 106), P(x0 + w - 40, y0 + 106)], 1.8, 0.7));
  // 蜂窝砖饰（左右两块）
  for (const px of [x0 + 30, x0 + w - 170]) {
    g.push(wash(id, rectD(px, y0 + 118, 140, 70, 14), '#ece6da') + box(px, y0 + 118, 140, 70, 1.6, 0.6));
    let hx = '';
    for (let r = 0; r < 4; r++) for (let c = 0; c < 8; c++) { const cx = px + 14 + c * 16 + (r % 2) * 8, cy = y0 + 130 + r * 15; if (cx < px + 132) hx += `<path d="M ${cx - 6} ${cy} l 3 -5 h 6 l 3 5 l -3 5 h -6 Z" fill="#59616e"/>`; }
    g.push(`<g filter="url(#${id}wash)" opacity="0.85">${hx}</g>`);
  }
  // 门罩：小瓦檐 + 蓝彩额枋（店名另画）
  g.push(wash(id, `M ${dx - 110} ${bot - 196} l 14 -22 h 192 l 14 22 Z`, TILE));
  for (let x = dx - 100; x < dx + 104; x += 16) g.push(`<circle cx="${x}" cy="${bot - 194}" r="4.5" fill="#5a5a60" filter="url(#${id}wash)"/>`);
  if (snow) g.push(wash(id, `M ${dx - 96} ${bot - 220} h 192 q 6 5 0 8 h -192 q -6 -3 0 -8 Z`, '#fbfbf8'));
  g.push(wash(id, rectD(dx - 98, bot - 188, 196, 40, 4), '#d9cdb2') + wash(id, rectD(dx - 88, bot - 182, 176, 28, 3), '#4f3a2c') + box(dx - 98, bot - 188, 196, 40, 2, 0.8));
  g.push(wash(id, rectD(dx - 98, bot - 148, 196, 10), '#4d6585'));
  // 门
  g.push(wash(id, rectD(dx - 58, bot - 138, 116, 138, 3), '#5a3b28') + wash(id, rectD(dx - 50, bot - 132, 100, 132), '#2e2420'));
  g.push(wash(id, `M ${dx - 50} ${bot - 132} h 100 v 46 q -12 8 -25 0 q -12 8 -25 0 q -12 8 -25 0 q -12 8 -25 0 Z`, '#55708f'));
  g.push(box(dx - 58, bot - 138, 116, 138, 2.6, 0.9));
  // 右：支摘窗外卖口（木板撑开）
  const wx = x0 + w - 160, wy = bot - 150;
  g.push(wash(id, rectD(wx, wy, 120, 72, 2), '#3a2e28') + `<g filter="url(#${id}wash)"><ellipse cx="${wx + 36}" cy="${wy + 62}" rx="14" ry="5" fill="#f3efe6"/><ellipse cx="${wx + 80}" cy="${wy + 62}" rx="14" ry="5" fill="#f3efe6"/><rect x="${wx + 54}" y="${wy + 40}" width="10" height="22" rx="3" fill="#c9a46a"/></g>`);
  g.push(wash(id, `M ${wx - 6} ${wy} l 134 0 l 20 -40 l -134 0 Z`, '#c49a62') + line([P(wx - 6, wy), P(wx + 14, wy - 40), P(wx + 148, wy - 40)], 2, 0.8) + line([P(wx + 128, wy), P(wx + 148, wy - 40)], 2.4, 0.85) + line([P(wx + 118, wy + 2), P(wx + 136, wy - 36)], 1.6, 0.7));
  g.push(wash(id, rectD(wx - 10, wy + 72, 140, 10, 2), '#8a6142') + box(wx, wy, 120, 72, 2.4, 0.9));
  // 左：圆窗
  g.push(`<circle cx="${x0 + 100}" cy="${bot - 104}" r="40" fill="#3a2e28" filter="url(#${id}wash)"/><circle cx="${x0 + 100}" cy="${bot - 104}" r="40" fill="none" stroke="#8a6142" stroke-width="7" filter="url(#${id}wash)"/>`);
  for (const a of [0, 60, 120]) g.push(`<line x1="${x0 + 100 - 38 * Math.cos(a * Math.PI / 180)}" y1="${bot - 104 - 38 * Math.sin(a * Math.PI / 180)}" x2="${x0 + 100 + 38 * Math.cos(a * Math.PI / 180)}" y2="${bot - 104 + 38 * Math.sin(a * Math.PI / 180)}" stroke="#8a6142" stroke-width="3"/>`);
  // 墙边轮廓 + 两盏纸灯
  g.push(line([P(x0, y0 + 64), P(x0 - 1, bot)], 2.2, 0.75) + line([P(x0 + w, y0 + 64), P(x0 + w + 1, bot)], 2.8, 0.85) + line([P(x0, bot), P(x0 + w / 2, bot + 1), P(x0 + w, bot)], 2.6, 0.85));
  for (const lx of [dx - 140, dx + 140]) g.push(line([P(lx, bot - 214), P(lx, bot - 196)], 1.4, 0.7) + wash(id, ellD(lx, bot - 180, 14, 16), '#f1e6cf') + line(quadPts(P(lx - 14, bot - 188), P(lx, bot - 158), P(lx + 14, bot - 188)), 1.4, 0.6));
  g.push(propPlant(id, x0 - 24, bot + 4, 1.1) + propPlant(id, x0 + w + 24, bot + 4, 1.1));
  return g.join('');
}

// ---------- 白天大地图 2400×1350 ----------
const WORLD_W = 2400, WORLD_H = 1350;
const WMAP = {
  shop: { x: 760, y: 300, w: 480, h: 330, door: { x: 1000, y: 690 } },
  market: { x: 220, y: 330, w: 300, h: 170, spot: { x: 370, y: 560 } },
  farm: { x: 1440, y: 300, plots: [[1500, 380], [1700, 380], [1500, 540], [1700, 540]], pw: 170, ph: 110 },
  coop: { x: 2060, y: 330, w: 200, h: 160, spot: { x: 2160, y: 560 } },
  pond: { cx: 1760, cy: 1040, rx: 330, ry: 160, spot: { x: 1390, y: 1000 } },
  plaza: { cx: 560, cy: 1000, r: 150 },
};
function treeAt(id, x, y, k = 1, col = '#7f9a6c') {
  return `<ellipse cx="${x}" cy="${y + 6}" rx="${46 * k}" ry="${12 * k}" fill="${INK}" opacity="0.1" filter="url(#${id}soft)"/>`
    + wash(id, rectD(x - 7 * k, y - 50 * k, 14 * k, 56 * k, 4), '#8a6a4f') + line([P(x + 7 * k, y - 46 * k), P(x + 8 * k, y)], 2.4, 0.75)
    + `<g filter="url(#${id}wash)"><ellipse cx="${x}" cy="${y - 86 * k}" rx="${52 * k}" ry="${46 * k}" fill="${col}" opacity="0.92"/><ellipse cx="${x - 30 * k}" cy="${y - 60 * k}" rx="${34 * k}" ry="${28 * k}" fill="${col}" opacity="0.9"/><ellipse cx="${x + 32 * k}" cy="${y - 62 * k}" rx="${32 * k}" ry="${26 * k}" fill="${col}" opacity="0.85"/><ellipse cx="${x - 12 * k}" cy="${y - 100 * k}" rx="${24 * k}" ry="${18 * k}" fill="#fff" opacity="0.12"/></g>`
    + line(sample([segQ(P(x - 50 * k, y - 70 * k), P(x - 54 * k, y - 120 * k), P(x, y - 132 * k)), segQ(P(x, y - 132 * k), P(x + 54 * k, y - 120 * k), P(x + 56 * k, y - 66 * k))], 14), 1.6, 0.4);
}
function worldSVG(season = 'spring', sprites = false) { // sprites=true：房子等用 GPT 画的精灵，这里不画
  const SE = SEASONS[season];
  const id = 'w' + (++_sid);
  const g = [`<defs>${sceneDefs(id, WORLD_W, WORLD_H)}</defs>`];
  const M = WMAP;
  // 草地 + 斑块
  g.push(`<rect width="${WORLD_W}" height="${WORLD_H}" fill="${SE.grass}"/>`);
  g.push(`<g filter="url(#${id}soft)" opacity="0.55">${[[300, 200, 260], [1300, 180, 300], [2100, 900, 280], [900, 1200, 320], [200, 1250, 200], [2250, 1250, 240], [1200, 820, 200]].map(([x, y, r]) => `<ellipse cx="${x}" cy="${y}" rx="${r}" ry="${r * 0.5}" fill="${SE.patch}"/>`).join('')}</g>`);
  // 远景：天空、雪山、山脚森林（极光只在冬天）
  const SKY = { spring: ['#cfe3ee', '#eef2ea'], summer: ['#9fc8e6', '#e6f0e8'], autumn: ['#e9d8b8', '#f3ead6'], winter: ['#5d7f9a', '#d9e4ea'] }[season];
  g.push(`<defs><linearGradient id="${id}sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${SKY[0]}"/><stop offset="1" stop-color="${SKY[1]}"/></linearGradient></defs><rect width="${WORLD_W}" height="230" fill="url(#${id}sky)"/>`);
  if (season === 'winter') g.push(`<g filter="url(#${id}soft)" opacity="0.8"><path d="M 200 110 C 500 10 800 120 1100 40 S 1600 30 1900 90 S 2300 40 2400 70" stroke="#86e6a8" stroke-width="36" fill="none" opacity="0.55"/><path d="M 400 130 C 700 60 1000 140 1400 70 S 2000 80 2400 40" stroke="#c4f5cc" stroke-width="14" fill="none" opacity="0.6"/><path d="M 1500 50 C 1800 20 2100 60 2400 20" stroke="#e48ab8" stroke-width="18" fill="none" opacity="0.4"/></g>`);
  else g.push(`<g filter="url(#${id}soft)" opacity="0.85">${[[300, 60, 120], [900, 40, 160], [1500, 70, 130], [2100, 45, 150]].map(([x, y, r]) => `<ellipse cx="${x}" cy="${y}" rx="${r}" ry="${r * 0.22}" fill="#fff"/>`).join('')}</g>`);
  const farPk = [[0, 170], [140, 96], [260, 140], [420, 60], [560, 128], [700, 80], [860, 150], [1000, 70], [1160, 120], [1300, 46], [1460, 120], [1600, 74], [1760, 140], [1900, 62], [2060, 130], [2200, 84], [2400, 150]];
  g.push(wash(id, `M 0 230 ${farPk.map(([x, y]) => `L ${x} ${y}`).join(' ')} L 2400 230 Z`, season === 'winter' ? '#9aa9bc' : '#a7b3c6'));
  farPk.forEach(([x, y], i) => { if (i && i < farPk.length - 1 && y < 110) g.push(wash(id, `M ${x - 44} ${y + 40} L ${x} ${y} L ${x + 44} ${y + 40} q -11 -8 -22 2 q -11 -10 -22 -2 q -11 -8 -22 2 q -11 -10 -22 -2 Z`, '#fbfbf8')); });
  g.push(line(farPk.map(([x, y]) => P(x, y)), 1.4, 0.4));
  const nearHill = { spring: '#a9c290', summer: '#8fb07a', autumn: '#c49a5c', winter: '#dfe6e6' }[season];
  g.push(wash(id, `M 0 230 C 200 160 420 200 620 170 S 1000 150 1240 190 S 1700 150 1960 180 S 2300 160 2400 190 L 2400 260 L 0 260 Z`, nearHill));
  for (let i = 0; i < 70; i++) { const x = 10 + i * 35 + ((i * 17) % 20), y = 214 + (i % 4) * 8, h = 36 + (i % 5) * 9; g.push(`<path d="M ${x} ${y - h} l ${h * 0.3} ${h} h ${-h * 0.6} Z" fill="${season === 'winter' ? '#7d948a' : season === 'autumn' ? '#7a7a4a' : '#4f6b52'}" filter="url(#${id}wash)"/>` + (season === 'winter' ? `<path d="M ${x} ${y - h} l ${h * 0.12} ${h * 0.4} h ${-h * 0.24} Z" fill="#fbfbf8"/>` : '')); }
  g.push(`<rect x="0" y="236" width="${WORLD_W}" height="40" fill="${SE.grass}" filter="url(#${id}soft)"/>`);
  // 温泉（右上山脚）
  g.push(wash(id, ellD(2200, 262, 136, 44), '#b9b2a8') + wash(id, ellD(2200, 262, 112, 32), season === 'winter' ? '#8fc8d6' : '#6fbccc') + wash(id, ellD(2190, 258, 60, 14), '#a9e0e6'));
  g.push(`<g filter="url(#${id}wash)">${[[2080, 258, 20], [2100, 286, 16], [2320, 262, 22], [2300, 288, 14], [2210, 296, 18]].map(([x, y, r]) => `<ellipse cx="${x}" cy="${y}" rx="${r}" ry="${r * 0.7}" fill="#9a948a"/>`).join('')}</g>`);
  g.push(`<g filter="url(#${id}soft)" opacity="0.8"><ellipse cx="2160" cy="220" rx="40" ry="26" fill="#fff"/><ellipse cx="2230" cy="206" rx="46" ry="30" fill="#fff"/><ellipse cx="2280" cy="230" rx="30" ry="20" fill="#fff"/></g>`);
  // 小溪：从山上流到池塘，路过的地方有木桥
  g.push(`<path d="M 1930 230 C 1880 380 1990 520 1925 630 C 1880 720 1900 820 1880 900" stroke="${season === 'winter' ? '#cfe1e8' : '#a9cdd8'}" stroke-width="34" fill="none" stroke-linecap="round" filter="url(#${id}wash)"/>`);
  g.push(`<path d="M 1930 230 C 1880 380 1990 520 1925 630 C 1880 720 1900 820 1880 900" stroke="#fff" stroke-width="6" fill="none" stroke-dasharray="20 40" opacity="0.5"/>`);
  // 土路
  const path = (pts, w) => `<path d="${pts}" stroke="${season === 'winter' ? '#e2dcd0' : '#e6d3ab'}" stroke-width="${w}" fill="none" stroke-linecap="round" filter="url(#${id}wash)"/>`;
  g.push(path(`M 1000 690 C 1000 800 900 860 700 900 C 560 930 420 760 370 560`, 70));
  g.push(path(`M 1000 760 C 1200 780 1350 720 1500 680 C 1700 640 1900 640 2160 580`, 64));
  g.push(path(`M 1300 740 C 1340 860 1360 940 1390 1000`, 54));
  g.push(path(`M 0 900 C 200 900 400 920 560 1000`, 50));
  if (!sprites) {
  // （以下几样在 sprites 模式下由游戏画精灵）
  }
  // 木桥（溪上）
  g.push(wash(id, rectD(1880, 606, 92, 46, 4), '#b88a5c'));
  for (let i = 1; i < 5; i++) g.push(line([P(1880 + i * 18, 608), P(1880 + i * 18, 650)], 1, 0.5));
  g.push(line([P(1876, 606), P(1976, 606)], 3, 0.85) + line([P(1876, 652), P(1976, 652)], 3, 0.85) + line([P(1880, 600), P(1880, 612)], 3, 0.8) + line([P(1972, 600), P(1972, 612)], 3, 0.8));
  // 石板路：沿着主路铺几块
  const cub = (a, b, c, d, t) => a * (1 - t) ** 3 + 3 * b * t * (1 - t) ** 2 + 3 * c * t * t * (1 - t) + d * t ** 3;
  const stones = [];
  for (const [p0, p1, p2, p3] of [[[1000, 690], [1000, 800], [900, 860], [700, 900]], [[1000, 760], [1200, 780], [1350, 720], [1500, 680]], [[700, 900], [560, 930], [420, 760], [370, 560]]]) for (let t = 0.05; t < 1; t += 0.07) stones.push([cub(p0[0], p1[0], p2[0], p3[0], t), cub(p0[1], p1[1], p2[1], p3[1], t)]);
  g.push(`<g filter="url(#${id}wash)">${stones.map(([x, y], i) => `<ellipse cx="${x + (i % 2 ? 8 : -8)}" cy="${y}" rx="${16 + (i % 3) * 3}" ry="${9 + (i % 2) * 2}" fill="${season === 'winter' ? '#cfcbc2' : '#cbbfa6'}"/>`).join('')}</g>`);
  // 路牌
  if (!sprites) g.push(line([P(1300, 790), P(1300, 720)], 3.4, 0.85) + wash(id, `M 1300 728 h 74 l 12 10 l -12 10 h -74 Z`, '#c49a62') + wash(id, `M 1300 752 h -74 l -12 10 l 12 10 h 74 Z`, '#d9b77a') + box(1300, 728, 74, 20, 1.6, 0.8));
  // 稻草人（菜地中间）
  if (!sprites) g.push(line([P(1600, 470), P(1600, 410)], 3.4, 0.85) + line([P(1572, 432), P(1628, 432)], 3, 0.85) + wash(id, ellD(1600, 404, 13, 12), '#e9d6a6') + wash(id, `M 1584 398 q 16 -22 32 0 Z`, '#c49a62') + wash(id, rectD(1588, 418, 24, 26, 3), '#c9533f'));
  // 花丛（店门两侧、广场边）
  for (const [x, y] of [[700, 640], [1290, 760], [380, 1080], [740, 1060], [1180, 880]]) g.push(`<g filter="url(#${id}wash)">${[0, 1, 2, 3, 4].map((i) => `<ellipse cx="${x - 30 + i * 15}" cy="${y - (i % 2) * 6}" rx="12" ry="9" fill="${season === 'winter' ? '#e8eded' : '#86a874'}"/>`).join('')}${[0, 1, 2].map((i) => `<circle cx="${x - 22 + i * 20}" cy="${y - 10 - (i % 2) * 4}" r="5" fill="${SE.flowers[i]}"/>`).join('')}</g>`);
  // 广场两张长椅
  for (const [x, y] of [[420, 960], [700, 960]]) g.push(wash(id, rectD(x - 34, y, 68, 10, 2), '#a8744b') + line([P(x - 28, y + 10), P(x - 28, y + 22)], 2, 0.8) + line([P(x + 28, y + 10), P(x + 28, y + 22)], 2, 0.8) + line([P(x - 34, y), P(x + 34, y)], 1.6, 0.8));
  if (!sprites) {
  // 早市：布棚小摊
  const mk = M.market;
  g.push(wash(id, rectD(mk.x, mk.y + 70, mk.w, 90, 8), '#b07a4e') + box(mk.x, mk.y + 70, mk.w, 90, 2.6, 0.85));
  for (let i = 0; i < 6; i++) g.push(wash(id, `M ${mk.x - 20 + i * 57} ${mk.y + 6} h 57 l -4 52 q -24 16 -49 0 Z`, i % 2 ? '#f3ece0' : '#c9533f'));
  g.push(line([P(mk.x - 20, mk.y + 6), P(mk.x + mk.w / 2, mk.y + 2), P(mk.x + mk.w + 22, mk.y + 6)], 3, 0.85));
  g.push(line([P(mk.x + 4, mk.y + 50), P(mk.x + 4, mk.y + 160)], 3, 0.85) + line([P(mk.x + mk.w - 4, mk.y + 50), P(mk.x + mk.w - 4, mk.y + 160)], 3.4, 0.9));
  for (const [x, c] of [[mk.x + 50, '#cf3b2c'], [mk.x + 115, '#f6efdf'], [mk.x + 185, '#b9473a'], [mk.x + 250, '#f2d06e']]) g.push(wash(id, ellD(x, mk.y + 82, 28, 10), '#c49a62') + `<g filter="url(#${id}wash)">${[0, 1, 2, 3].map((i) => `<circle cx="${x - 14 + i * 9}" cy="${mk.y + 74 - (i % 2) * 4}" r="7" fill="${c}"/>`).join('')}</g>` + line(quadPts(P(x - 28, mk.y + 84), P(x, mk.y + 96), P(x + 28, mk.y + 84)), 1.8, 0.7));
  }
  // 店面外观（白墙黛瓦）
  const s = M.shop;
  if (!sprites) g.push(huizhouShop(id, s, season));
  if (!sprites) // 邮筒
    g.push(wash(id, rectD(1300, 590, 34, 60, 8), '#3f6b52') + wash(id, ellD(1317, 590, 17, 8), '#4f7d62') + line([P(1317, 650), P(1317, 690)], 3, 0.8) + box(1300, 590, 34, 60, 2, 0.85));
  // 菜地：篱笆 + 四块垄
  const f = M.farm;
  for (const [x, y] of f.plots) {
    g.push(wash(id, rectD(x - f.pw / 2, y - f.ph / 2, f.pw, f.ph, 10), '#9b7653'));
    for (let i = 1; i < 4; i++) g.push(line([P(x - f.pw / 2 + 10, y - f.ph / 2 + i * f.ph / 4), P(x + f.pw / 2 - 10, y - f.ph / 2 + i * f.ph / 4 + 1)], 1.6, 0.35));
    g.push(box(x - f.pw / 2, y - f.ph / 2, f.pw, f.ph, 2, 0.6));
  }
  const fx0 = 1390, fx1 = 1810, fy0 = 300, fy1 = 620;
  for (let x = fx0; x <= fx1; x += 42) g.push(line([P(x, fy0 - 6), P(x, fy0 + 26)], 2.2, 0.7) + line([P(x, fy1 - 6), P(x, fy1 + 26)], 2.2, 0.7));
  g.push(line([P(fx0, fy0 + 4), P(fx1, fy0 + 4)], 1.6, 0.6) + line([P(fx0, fy0 + 16), P(fx1, fy0 + 16)], 1.6, 0.6) + line([P(fx0, fy1 + 4), P(1560, fy1 + 4)], 1.6, 0.6) + line([P(1640, fy1 + 4), P(fx1, fy1 + 4)], 1.6, 0.6));
  if (!sprites) {
  // 鸡舍
  const c = M.coop;
  g.push(wash(id, rectD(c.x, c.y + 50, c.w, c.h - 50), '#c99a62') + wash(id, `M ${c.x - 24} ${c.y + 60} L ${c.x + c.w / 2} ${c.y} L ${c.x + c.w + 24} ${c.y + 60} Z`, '#d9bd7a'));
  for (let i = 0; i < 8; i++) g.push(line([P(c.x - 10 + i * 30, c.y + 58), P(c.x + c.w / 2 - 20 + i * 6, c.y + 10)], 1, 0.35));
  g.push(wash(id, rectD(c.x + c.w / 2 - 26, c.y + 90, 52, 70, 4), '#6b4a34') + box(c.x, c.y + 50, c.w, c.h - 50, 2.6, 0.85) + line([P(c.x - 26, c.y + 62), P(c.x + c.w / 2, c.y - 2), P(c.x + c.w + 26, c.y + 62)], 3, 0.85));
  g.push(`<g filter="url(#${id}wash)">${[[c.x + 20, c.y + 190], [c.x + 70, c.y + 200], [c.x + 160, c.y + 194]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="14" ry="11" fill="#fbf6ec"/><circle cx="${x + 10}" cy="${y - 8}" r="6" fill="#fbf6ec"/><path d="M ${x + 9} ${y - 15} l 3 -5 l 3 5 Z" fill="#d9453a"/><path d="M ${x + 16} ${y - 8} l 5 1 l -5 2 Z" fill="#e8a23a"/>`).join('')}</g>`);
  }
  // 池塘 + 荷叶 + 芦苇 + 木栈道
  const p = M.pond;
  g.push(wash(id, ellD(p.cx, p.cy, p.rx + 18, p.ry + 14), '#b9b29a', 0.8) + wash(id, ellD(p.cx, p.cy, p.rx, p.ry), SE.pond));
  g.push(`<ellipse cx="${p.cx - 60}" cy="${p.cy - 40}" rx="${p.rx * 0.6}" ry="${p.ry * 0.4}" fill="#fff" opacity="0.18" filter="url(#${id}soft)"/>`);
  g.push(line(sample([segC(P(p.cx - p.rx, p.cy), P(p.cx - p.rx, p.cy + p.ry * 1.3), P(p.cx + p.rx, p.cy + p.ry * 1.3), P(p.cx + p.rx, p.cy))], 30), 2.6, 0.6) + line(sample([segC(P(p.cx + p.rx, p.cy), P(p.cx + p.rx, p.cy - p.ry * 1.3), P(p.cx - p.rx, p.cy - p.ry * 1.3), P(p.cx - p.rx, p.cy))], 30), 1.6, 0.45));
  if (season !== 'winter') g.push(`<g filter="url(#${id}wash)">${[[1850, 980], [1930, 1060], [1700, 1120], [2000, 1000], [1620, 980]].map(([x, y], i) => `<ellipse cx="${x}" cy="${y}" rx="34" ry="14" fill="#6f9a5c"/>${i % 2 ? `<circle cx="${x + 10}" cy="${y - 10}" r="9" fill="#efb6c0"/>` : ''}`).join('')}</g>`);
  for (const x of [2040, 2064, 2080, 1470, 1452]) g.push(line([P(x, p.cy + 70), P(x + 4, p.cy - 10)], 1.6, 0.7) + wash(id, ellD(x + 4, p.cy - 18, 4, 12), '#8a6a4f'));
  g.push(wash(id, rectD(1400, 970, 140, 44, 4), '#b88a5c'));
  for (let i = 1; i < 5; i++) g.push(line([P(1400 + i * 28, 972), P(1400 + i * 28, 1012)], 1.2, 0.5));
  g.push(box(1400, 970, 140, 44, 2.2, 0.85) + line([P(1420, 1014), P(1420, 1040)], 3, 0.8) + line([P(1520, 1014), P(1520, 1040)], 3, 0.8));
  // 广场（帅老头的广场舞）
  const pl = M.plaza;
  g.push(wash(id, ellD(pl.cx, pl.cy, pl.r, pl.r * 0.55), '#e6dcc8') + line(sample([segC(P(pl.cx - pl.r, pl.cy), P(pl.cx - pl.r, pl.cy + pl.r * 0.75), P(pl.cx + pl.r, pl.cy + pl.r * 0.75), P(pl.cx + pl.r, pl.cy))], 24), 2.2, 0.55));
  for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2; g.push(line([P(pl.cx + Math.cos(a) * pl.r * 0.5, pl.cy + Math.sin(a) * pl.r * 0.28), P(pl.cx + Math.cos(a) * pl.r * 0.92, pl.cy + Math.sin(a) * pl.r * 0.5)], 1, 0.25)); }
  g.push(treeAt(id, pl.cx - pl.r - 40, pl.cy + 10, 0.8, SE.trees[1]));
  // 竹林、树、花
  for (let i = 0; i < 14; i++) { const x = 40 + i * 22, h = 150 + (i % 4) * 30; g.push(line([P(x, 300), P(x + 3, 300 - h)], 3.4, 0.7) + `<g filter="url(#${id}wash)">${[0, 1, 2].map((k) => `<ellipse cx="${x + 12}" cy="${300 - h + 20 + k * 40}" rx="14" ry="4" fill="${SE.bamboo}" transform="rotate(-25 ${x + 12} ${300 - h + 20 + k * 40})"/>`).join('')}</g>`); }
  const trees = [[640, 280, 1, '#7f9a6c'], [1330, 280, 1.1, '#86a874'], [1980, 760, 1.1, '#7a9c68'], [2300, 760, 1, '#86a874'], [180, 760, 1.2, '#86a874'], [1080, 1150, 1, '#7f9a6c'], [2300, 1180, 1.1, '#7a9c68'], [880, 1300, 0.9, '#86a874'], [1240, 1320, 1, '#7f9a6c'], [2320, 300, 0.9, '#7f9a6c'], [300, 1300, 1, '#7a9c68']];
  trees.forEach(([x, y, k], i) => g.push(treeAt(id, x, y, k, SE.trees[i % SE.trees.length])));
  g.push(`<g filter="url(#${id}wash)">${Array.from({ length: 70 }, (_, i) => { const x = (i * 337) % WORLD_W, y = 120 + ((i * 211) % (WORLD_H - 160)); return `<circle cx="${x}" cy="${y}" r="${4 + (i % 3)}" fill="${SE.flowers[i % 4]}" opacity="0.85"/>`; }).join('')}</g>`);
  if (season === 'winter') g.push(`<g filter="url(#${id}soft)" opacity="0.45">${Array.from({ length: 26 }, (_, i) => `<ellipse cx="${(i * 487) % WORLD_W}" cy="${160 + ((i * 263) % (WORLD_H - 200))}" rx="${60 + (i % 4) * 30}" ry="${20 + (i % 3) * 8}" fill="#fbfbf8"/>`).join('')}</g>`);
  g.push(`<rect width="${WORLD_W}" height="${WORLD_H}" filter="url(#${id}grain)"/>`);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${WORLD_W} ${WORLD_H}" width="${WORLD_W}" height="${WORLD_H}">${g[0]}<g filter="url(#${id}ink)">${g.slice(1).join('')}</g></svg>`;
}
const WORLD_LABELS = [
  { t: '盆盆餐厅', x: 1000, y: 462, size: 24, fill: '#f3e3c0', stroke: '#2a201a', lw: 4 },
  { t: '早市', x: 370, y: 312, size: 30, fill: '#fbf3e2', stroke: '#8a3a2c', lw: 6 },
  { t: '菜地', x: 1600, y: 272, size: 30, fill: '#fbf3e2', stroke: '#5a6b3c', lw: 6 },
  { t: '鸡舍', x: 2160, y: 312, size: 28, fill: '#fbf3e2', stroke: '#7a5a2c', lw: 6 },
  { t: '池塘', x: 1760, y: 880, size: 30, fill: '#fbf3e2', stroke: '#3f6680', lw: 6 },
  { t: '广场', x: 560, y: 1120, size: 26, fill: '#fbf3e2', stroke: '#6b5a48', lw: 5 },
  { t: '温泉', x: 2200, y: 318, size: 24, fill: '#fbf3e2', stroke: '#3f6680', lw: 5 },
  { t: '菜地 →', x: 1343, y: 739, size: 14, fill: '#4a3326' }, { t: '← 早市', x: 1258, y: 763, size: 14, fill: '#4a3326' },
];
// ---------- 呆猫寄回来的明信片（照着你拍的风景画）viewBox 300×200 ----------
const POSTCARDS = [ // 呆猫的旅行路线：先走山河各处，寄回当地风景和食谱；再到樱花之国，最后邀请盆盆去开分店
  { id: 'snowpeak', n: '雪山和牦牛', from: '雪山牧场', se: 'winter', recipes: ['dandan'], gift: { ing: 'beef', n: 3 }, msg: '雪山脚下的小馆子，一碗担担面辣得我直哈气。方子抄给老大了！' },
  { id: 'karst', selfie: 'left', n: '竹筏和山峰', from: '烟雨山水', se: 'summer', recipes: ['guihua'], gift: { ing: 'rice', n: 4 }, msg: '山像竹笋站在雾里。街上的桂花糕又软又香，做法寄回来啦。' },
  { id: 'river', n: '早茶楼', from: '骑楼茶镇', se: 'summer', recipes: ['xiajiao', 'chashao'], gift: { ing: 'shrimp', n: 4 }, msg: '早茶一坐就是一上午！虾饺和叉烧饭的方子都要来了。' },
  { id: 'huizhou', selfie: 'right', n: '马头墙老宅', from: '白墙黛瓦镇', se: 'spring', recipes: [], gift: { calcium: true }, msg: '白墙黛瓦，墙上有蜂窝一样的花纹。寄一瓶钙片，盆盆跑堂别累着。' },
  { id: 'autumn', n: '满山红叶', from: '红叶山', se: 'autumn', recipes: [], gift: { ing: 'peanut', n: 4 }, msg: '满山都是红叶，捡到好多山花生。下一站，我要坐船出海了！' },
  { id: 'sakura', selfie: 'left', n: '樱花大道', from: '樱花之国 · 古都', se: 'spring', recipes: [], gift: { ing: 'egg', n: 4 }, msg: '到樱花之国啦！整条路都是粉色的，这里的人也爱吃面。' },
  { id: 'hotspring', selfie: 'right', n: '山里的温泉', from: '樱花之国 · 温泉山谷', se: 'autumn', recipes: [], invite: 'japan', gift: { coins: 60 }, msg: '温泉旅馆的老板尝了我带的辣酱，问盆盆能不能来这儿开分店！' },
  { id: 'aurora', n: '极光', from: '樱花之国 · 雪国', se: 'winter', recipes: [], gift: { coins: 40 }, msg: '半夜天上有绿色的光在跳舞，像帅老头跳的广场舞！' },
];
function postcardSVG(key) {
  const id = 'pc' + (++_sid);
  const g = [];
  const sky = (c1, c2) => `<rect x="12" y="12" width="276" height="176" fill="${c1}"/><rect x="12" y="100" width="276" height="88" fill="${c2}" opacity="0.6" filter="url(#${id}soft)"/>`;
  const peaks = (pts, col, snow) => wash(id, `M 12 ${pts[0][1]} ${pts.map(([x, y]) => `L ${x} ${y}`).join(' ')} L 288 190 L 12 190 Z`, col) + (snow ? pts.filter((_, i) => i % 2).map(([x, y]) => wash(id, `M ${x - 18} ${y + 22} L ${x} ${y} L ${x + 18} ${y + 22} q -9 -5 -18 2 q -9 -7 -18 -2 Z`, '#fbfbf8')).join('') : '');
  const pine = (x, y, h, c = '#3f5a48') => wash(id, `M ${x} ${y - h} l ${h * 0.28} ${h} h ${-h * 0.56} Z`, c);
  if (key === 'snowpeak') {
    g.push(sky('#9cc3e0', '#dbe8f0') + `<ellipse cx="90" cy="40" rx="50" ry="10" fill="#fff" opacity="0.8" filter="url(#${id}soft)"/>`);
    g.push(peaks([[12, 120], [60, 70], [90, 96], [130, 44], [160, 80], [200, 52], [240, 92], [288, 76]], '#8a98b0', true));
    g.push(wash(id, `M 12 140 L 288 132 L 288 190 L 12 190 Z`, '#b7b58a'));
    for (let i = 0; i < 18; i++) g.push(pine(20 + i * 15, 146 + (i % 3) * 4, 18 + (i % 4) * 4));
  } else if (key === 'aurora') {
    g.push(`<rect x="12" y="12" width="276" height="176" fill="#1f3340"/>`);
    g.push(`<g filter="url(#${id}soft)"><path d="M 20 110 C 80 30 140 120 200 50 S 280 60 290 30" stroke="#7fe0a0" stroke-width="22" fill="none" opacity="0.7"/><path d="M 40 130 C 100 70 170 120 260 60" stroke="#b6f0c0" stroke-width="10" fill="none" opacity="0.6"/><path d="M 180 40 C 220 30 250 50 288 20" stroke="#e08ab0" stroke-width="12" fill="none" opacity="0.45"/></g>`);
    g.push(`<g fill="#fff">${Array.from({ length: 20 }, (_, i) => `<circle cx="${20 + (i * 53) % 260}" cy="${18 + (i * 37) % 70}" r="1.2"/>`).join('')}</g>`);
    g.push(wash(id, `M 12 160 L 288 156 L 288 190 L 12 190 Z`, '#e8eef2'));
    for (let i = 0; i < 20; i++) g.push(pine(16 + i * 14, 166 - (i % 3) * 3, 28 + (i % 5) * 6, '#16252b'));
  } else if (key === 'sakura') {
    g.push(sky('#bcd8ee', '#f3e6ea'));
    g.push(wash(id, `M 130 190 L 148 110 L 158 110 L 190 190 Z`, '#8e8a86') + `<path d="M 150 120 L 152 188" stroke="#fff" stroke-width="2" stroke-dasharray="8 8"/>`);
    for (const [x, y, r] of [[40, 70, 50], [90, 50, 44], [250, 70, 52], [210, 48, 40], [150, 40, 34], [20, 110, 34], [280, 110, 36]]) g.push(`<ellipse cx="${x}" cy="${y}" rx="${r}" ry="${r * 0.7}" fill="#f6d6de" filter="url(#${id}wash)"/><ellipse cx="${x - 8}" cy="${y - 8}" rx="${r * 0.6}" ry="${r * 0.4}" fill="#fbe8ec" filter="url(#${id}wash)"/>`);
    for (const x of [50, 96, 120, 196, 220, 262]) g.push(line([P(x, 190), P(x + (x < 150 ? 8 : -8), 120), P(x + (x < 150 ? 20 : -20), 80)], 3.4, 0.85));
    g.push(wash(id, `M 12 160 L 128 150 L 120 190 L 12 190 Z M 288 160 L 196 150 L 210 190 L 288 190 Z`, '#9bbf86'));
  } else if (key === 'autumn') {
    g.push(sky('#f3d79a', '#e6b06a'));
    for (const [x, y, r, c] of [[40, 60, 50, '#d98c3a'], [120, 40, 46, '#e0b040'], [200, 56, 52, '#c4602f'], [270, 40, 44, '#e0a040'], [80, 100, 40, '#c97a30'], [240, 100, 40, '#d9a03a']]) g.push(`<ellipse cx="${x}" cy="${y}" rx="${r}" ry="${r * 0.8}" fill="${c}" filter="url(#${id}wash)"/>`);
    for (const x of [60, 110, 180, 230, 270]) g.push(line([P(x, 190), P(x + 3, 100), P(x - 4, 60)], 3.2, 0.85));
    g.push(wash(id, `M 120 190 Q 150 140 160 120 Q 170 140 200 190 Z`, '#d9b98a') + wash(id, `M 12 170 L 288 168 L 288 190 L 12 190 Z`, '#c98a3a', 0.8));
    g.push(wash(id, rectD(212, 160, 34, 6, 2), '#7a5a3c') + line([P(214, 166), P(214, 176)], 1.6, 0.8) + line([P(244, 166), P(244, 176)], 1.6, 0.8));
  } else if (key === 'karst') {
    g.push(sky('#e9e6dc', '#cfd9c4'));
    const hills = [[[30, 150], [60, 50], [90, 150]], [[80, 160], [110, 70], [140, 160]], [[150, 150], [185, 40], [220, 150]], [[210, 160], [245, 80], [280, 160]], [[0, 170], [20, 100], [50, 170]]];
    hills.forEach((pts, i) => g.push(wash(id, `M ${pts[0][0]} ${pts[0][1]} Q ${pts[1][0] - 22} ${pts[1][1]} ${pts[1][0]} ${pts[1][1]} Q ${pts[1][0] + 22} ${pts[1][1]} ${pts[2][0]} ${pts[2][1]} Z`, ['#a9b89a', '#8fa585', '#9cb08e', '#7f9a76', '#6f8a66'][i], 0.9)));
    g.push(`<rect x="12" y="120" width="276" height="20" fill="#f3f1ea" opacity="0.7" filter="url(#${id}soft)"/>`);
    g.push(wash(id, `M 12 160 L 288 156 L 288 190 L 12 190 Z`, '#6f8f5c') + `<path d="M 20 186 C 80 170 120 180 160 168 S 240 160 288 162" stroke="#b9cfd6" stroke-width="7" fill="none" filter="url(#${id}wash)"/>`);
    g.push(line([P(60, 176), P(70, 172), P(80, 176)], 1.6, 0.8));
  } else if (key === 'hotspring') {
    g.push(sky('#d9dde0', '#cfc8b4'));
    for (let i = 0; i < 12; i++) g.push(pine(20 + i * 24, 96, 40 + (i % 3) * 10, '#3f5a48'));
    g.push(wash(id, ellD(150, 146, 120, 34), '#e9e2d0') + wash(id, ellD(150, 146, 100, 26), '#4fb3c4') + wash(id, ellD(150, 146, 60, 14), '#8fd6de'));
    g.push(`<g filter="url(#${id}soft)" opacity="0.85"><ellipse cx="120" cy="100" rx="40" ry="30" fill="#fff"/><ellipse cx="170" cy="80" rx="46" ry="34" fill="#fff"/><ellipse cx="210" cy="110" rx="30" ry="22" fill="#fff"/></g>`);
  } else if (key === 'river') {
    g.push(sky('#cfe3ee', '#dfe6e0'));
    g.push(wash(id, `M 120 12 L 180 12 L 220 190 L 80 190 Z`, '#5fa3a8'));
    for (const [x, y, c] of [[40, 80, '#e05a4a'], [60, 110, '#3fa0d0'], [36, 140, '#f2b134'], [70, 170, '#5ab06a'], [250, 90, '#e07a3a'], [236, 130, '#c060a0'], [264, 166, '#3fa0d0']]) g.push(wash(id, `M ${x - 22} ${y} q 22 -18 44 0 Z`, c) + line([P(x, y), P(x, y + 16)], 1.4, 0.8));
    for (const x of [20, 280]) g.push(wash(id, rectD(x - 10, 30, 20, 160), '#8a6a4f', 0.6));
  } else if (key === 'huizhou') {
    g.push(sky('#c7ccd4', '#e9e6dc'));
    g.push(wash(id, rectD(40, 70, 220, 120), '#f4f1ea'));
    g.push(wash(id, `M 30 74 L 60 40 H 240 L 270 74 Z`, '#4a4a4f') + wash(id, rectD(28, 30, 40, 10, 2), '#4a4a4f') + wash(id, rectD(232, 30, 40, 10, 2), '#4a4a4f'));
    let hx = ''; for (let r = 0; r < 4; r++) for (let c = 0; c < 10; c++) hx += `<path d="M ${70 + c * 16 + (r % 2) * 8 - 6} ${90 + r * 14} l 3 -5 h 6 l 3 5 l -3 5 h -6 Z" fill="#59616e"/>`;
    g.push(`<g filter="url(#${id}wash)">${hx}</g>`);
    g.push(wash(id, `M 96 150 l 10 -14 h 88 l 10 14 Z`, '#4a4a4f') + wash(id, rectD(110, 150, 80, 40), '#3a2e28') + wash(id, `M 104 150 l 92 0 l 10 -16 l -92 0 Z`, '#c49a62', 0.9));
  }
  // 再加一层细节：倒影、飘落物、小人小物、光
  const petals = (col, n, seed) => `<g>${Array.from({ length: n }, (_, i) => `<ellipse cx="${20 + ((i * 97 + seed) % 260)}" cy="${20 + ((i * 53 + seed) % 160)}" rx="3" ry="1.8" fill="${col}" transform="rotate(${(i * 37) % 180} ${20 + ((i * 97 + seed) % 260)} ${20 + ((i * 53 + seed) % 160)})" opacity="0.9"/>`).join('')}</g>`;
  if (key === 'snowpeak') { // 湖面倒影 + 前景草
    g.push(`<rect x="12" y="150" width="276" height="40" fill="#7f9fb8"/><g opacity="0.35" transform="translate(0 300) scale(1 -1)">${peaks([[12, 120], [60, 70], [90, 96], [130, 44], [160, 80], [200, 52], [240, 92], [288, 76]], '#8a98b0', true)}</g>`);
    g.push(`<g stroke="#fff" stroke-width="1.4" opacity="0.6">${[0, 1, 2, 3].map((i) => `<line x1="${40 + i * 60}" y1="${162 + i * 5}" x2="${80 + i * 60}" y2="${162 + i * 5}"/>`).join('')}</g>`);
    for (let i = 0; i < 9; i++) g.push(line(quadPts(P(14 + i * 8, 190), P(18 + i * 8, 178), P(12 + i * 9, 168 - (i % 3) * 6)), 1.4, 0.7));
  }
  if (key === 'aurora') { g.push(wash(id, rectD(210, 146, 34, 22, 2), '#6b4a34') + wash(id, `M 204 148 L 227 132 L 250 148 Z`, '#e8eef2') + `<rect x="222" y="154" width="9" height="8" fill="#ffd27a"/><ellipse cx="226" cy="170" rx="30" ry="6" fill="#ffd27a" opacity="0.3" filter="url(#${id}soft)"/>`); }
  if (key === 'sakura') g.push(petals('#f6c6d0', 26, 3) + `<g filter="url(#${id}wash)"><ellipse cx="150" cy="186" rx="40" ry="5" fill="#f6d6de" opacity="0.8"/></g>` + wash(id, ellD(160, 150, 4, 6), '#3f3129') + wash(id, ellD(160, 142, 3.5, 3.5), '#3f3129'));
  if (key === 'autumn') g.push(petals('#d98c3a', 22, 11) + petals('#c4602f', 14, 41) + `<path d="M 230 12 L 150 190 L 200 190 L 288 40 Z" fill="#fff6d8" opacity="0.18"/>`);
  if (key === 'karst') g.push(wash(id, `M 120 174 h 40 l -4 5 h -32 Z`, '#8a6a4f') + line([P(140, 174), P(140, 160)], 1, 0.8) + wash(id, ellD(140, 158, 4, 2), '#e2c27a') + `<g stroke="${INK}" stroke-width="1.2" fill="none" opacity="0.6"><path d="M 60 40 q 4 -4 8 0 q 4 -4 8 0"/><path d="M 84 30 q 3 -3 6 0 q 3 -3 6 0"/></g>`);
  if (key === 'hotspring') g.push(`<ellipse cx="150" cy="146" rx="108" ry="30" fill="none" stroke="#e8a04a" stroke-width="6" opacity="0.7" filter="url(#${id}wash)"/><ellipse cx="150" cy="146" rx="118" ry="33" fill="none" stroke="#c96a3a" stroke-width="3" opacity="0.5" filter="url(#${id}wash)"/>`);
  if (key === 'river') g.push(wash(id, `M 120 60 q 30 -22 60 0 v 6 h -8 q -22 -16 -44 0 h -8 Z`, '#c9b79a') + `<g opacity="0.35">${[[60, 110, '#e05a4a'], [250, 100, '#e07a3a']].map(([x, y, c]) => `<ellipse cx="${x < 150 ? 140 : 170}" cy="${y + 50}" rx="10" ry="3" fill="${c}"/>`).join('')}</g>` + `<g stroke="#fff" stroke-width="1.2" opacity="0.5">${[0, 1, 2].map((i) => `<line x1="${128 + i * 8}" y1="${120 + i * 22}" x2="${150 + i * 8}" y2="${120 + i * 22}"/>`).join('')}</g>`);
  if (key === 'huizhou') g.push(wash(id, `M 24 30 v -12 h 12 v -8 h 12 v 20 Z M 276 30 v -12 h -12 v -8 h -12 v 20 Z`, '#4a4a4f') + line(quadPts(P(250, 190), P(262, 150), P(286, 120)), 2.4, 0.85) + `<g filter="url(#${id}wash)">${[[262, 148], [272, 134], [280, 124], [256, 162]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="4.5" fill="#f2c6d0"/>`).join('')}</g>` + wash(id, ellD(214, 66, 8, 6), '#f3efe6') + `<path d="M 208 62 l 2 -6 l 3 5 M 216 61 l 3 -5 l 2 6" stroke="#f3efe6" stroke-width="2" fill="#f3efe6"/>`);
  const pcd = (typeof POSTCARDS !== 'undefined' && POSTCARDS.find((p) => p.id === key)) || {};
  if (pcd.selfie && typeof catSVG === 'function') { // 呆猫凑到镜头前的大脸，身子在画外
    const im = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(catSVG('aju', 'front', { w: 120, h: 132 }));
    const [sx, sy, rot] = pcd.selfie === 'right' ? [178, 94, 8] : [2, 90, -8];
    g.push(`<image href="${im}" x="${sx}" y="${sy}" width="124" height="136" transform="rotate(${rot} ${sx + 62} ${sy + 68})"/>`);
  }
  g.push(`<rect x="12" y="12" width="276" height="176" filter="url(#${id}grain)"/>`);
  // 明信片白边 + 邮票
  const frame = `<rect x="0" y="0" width="300" height="200" rx="6" fill="#fbf6ec"/>`;
  // 邮票跟着地方变：颜色、图案、面值都不一样
  const ST = {
    snowpeak: ['#3f6680', '雪山', '<path d="M 253 50 L 262 32 L 268 42 L 272 36 L 278 50 Z" fill="#fbf6ec"/><path d="M 259 38 L 262 32 L 265 38 Z" fill="#9cc3e0"/>'],
    karst: ['#4f7a5a', '山水', '<path d="M 253 50 Q 258 26 262 50 Q 266 32 270 50 Q 274 36 278 50 Z" fill="#cfe6c4"/>'],
    river: ['#b04a3c', '茶镇', '<ellipse cx="265" cy="43" rx="9" ry="7" fill="#fbf6ec"/><path d="M 273 41 l 5 -4 M 256 42 q -4 0 -3 4" stroke="#fbf6ec" stroke-width="2" fill="none"/><rect x="262" y="33" width="6" height="3" rx="1" fill="#fbf6ec"/>'],
    huizhou: ['#4a4a4f', '老宅', '<path d="M 253 50 V 38 h 4 v -4 h 4 v 4 h 8 v -4 h 4 v 4 h 4 V 50 Z" fill="#f4f1ea"/><rect x="263" y="43" width="4" height="7" fill="#4a4a4f"/>'],
    autumn: ['#c4602f', '红叶', '<path d="M 265 31 l 3 7 l 7 -2 l -4 6 l 6 4 l -8 1 l 1 6 l -5 -4 l -5 4 l 1 -6 l -8 -1 l 6 -4 l -4 -6 l 7 2 Z" fill="#f7d48a"/>'],
    sakura: ['#d07a90', '樱花', [0, 72, 144, 216, 288].map((a) => `<ellipse cx="265" cy="37" rx="3.4" ry="5" fill="#fbe6ec" transform="rotate(${a} 265 42)"/>`).join('') + '<circle cx="265" cy="42" r="2.2" fill="#e8b04a"/>'],
    hotspring: ['#3f86c4', '温泉', '<path d="M 258 48 h 14 M 260 44 q -2 -4 0 -8 q 2 -4 0 -8 M 265 44 q -2 -4 0 -8 q 2 -4 0 -8 M 270 44 q -2 -4 0 -8 q 2 -4 0 -8" stroke="#fbf6ec" stroke-width="2" fill="none" stroke-linecap="round"/>'],
    aurora: ['#2f5a6a', '雪国', '<g stroke="#e8f4f0" stroke-width="2" stroke-linecap="round"><path d="M 265 32 V 50 M 257 37 L 273 45 M 257 45 L 273 37"/></g>'],
  }[key] || ['#b04a3c', '远方', ''];
  const stamp = `<rect x="246" y="16" width="38" height="46" fill="#fbf6ec" stroke="${ST[0]}" stroke-width="2" stroke-dasharray="3 2"/><rect x="250" y="20" width="30" height="38" fill="${ST[0]}"/>${ST[2]}<text x="265" y="56" font-size="6.5" text-anchor="middle" fill="#fbf6ec" font-family="serif">${ST[1]}</text>`
    + `<g opacity="0.55" fill="none" stroke="#5a4a6a" stroke-width="1.4"><circle cx="236" cy="52" r="15"/><circle cx="236" cy="52" r="11"/><path d="M 252 46 q 10 -4 20 0 q 10 4 20 0 M 252 54 q 10 -4 20 0 q 10 4 20 0"/></g>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 200" width="600" height="400"><defs>${sceneDefs(id, 300, 200)}<clipPath id="${id}c"><rect x="12" y="12" width="276" height="176"/></clipPath></defs>${frame}<g clip-path="url(#${id}c)" filter="url(#${id}ink)">${g.join('')}</g>${stamp}<rect x="12" y="12" width="276" height="176" fill="none" stroke="${INK}" stroke-width="1.5" opacity="0.6"/></svg>`;
}
if (typeof module !== 'undefined') module.exports = { POSTCARDS, postcardSVG, SEASONS, seasonOf, cookwareSVG, ingSVG, cropSVG, worldSVG, WORLD_LABELS, WMAP, WORLD_W, WORLD_H };
