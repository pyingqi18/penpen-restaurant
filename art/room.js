// 盆盆餐厅 · 店内重画（第 2 版）：分背景 / 地面 / 前景三层，参考猫咪和汤的「道具成簇 + 前景取景框」和夜雀食堂的木札菜单
// 依赖 cats.js（brush 等）和 scene.js（wash / line / box / propPlant 等）

function rnd(seed) { let s = seed; return () => ((s = (s * 9301 + 49297) % 233280) / 233280); }
function pot(id, x, y, k, body, glaze, shape = 0) { // 各式陶罐
  const w = 16 * k, h = 26 * k;
  const d = shape === 0 ? `M ${x - w * 0.6} ${y - h} q ${-w * 0.9} ${h * 0.4} ${-w * 0.2} ${h} h ${w * 1.6} q ${w * 0.7} ${-h * 0.6} ${-w * 0.2} ${-h} Z`
    : shape === 1 ? `M ${x - w * 0.35} ${y - h * 1.2} h ${w * 0.7} q ${w * 0.2} ${h * 0.3} ${w * 0.6} ${h * 0.5} q ${w * 0.4} ${h * 0.5} ${-w * 0.1} ${h * 0.7} h ${-w * 1.6} q ${-w * 0.5} ${-h * 0.2} ${-w * 0.1} ${-h * 0.7} q ${w * 0.4} ${-h * 0.2} ${w * 0.6} ${-h * 0.5} Z`
      : `M ${x - w} ${y - h * 0.7} h ${w * 2} v ${h * 0.7} h ${-w * 2} Z`;
  return wash(id, d, body) + (glaze ? wash(id, `M ${x - w} ${y - h * (shape === 2 ? 0.7 : 0.62)} h ${w * 2} v ${h * 0.14} h ${-w * 2} Z`, glaze, 0.7) : '')
    + `<ellipse cx="${x - w * 0.3}" cy="${y - h * 0.6}" rx="${w * 0.18}" ry="${h * 0.22}" fill="#fff" opacity="0.25"/>`
    + line([P(x + w * 0.7, y - h * 0.9), P(x + w * 0.95, y - h * 0.4), P(x + w * 0.75, y)], 1.8 * k, 0.75) + line([P(x - w * 0.8, y), P(x, y + 1), P(x + w * 0.8, y)], 1.6 * k, 0.7);
}
function chiliString(id, x, y0, n) { // 一串晒干的辣椒
  let o = line([P(x, y0), P(x + 2, y0 + n * 11)], 1, 0.6);
  for (let i = 0; i < n; i++) { const yy = y0 + 8 + i * 11, s = i % 2 ? 1 : -1; o += `<path d="M ${x} ${yy} q ${s * 10} 2 ${s * 13} 9 q ${-s * 8} -2 ${-s * 13} -9 Z" fill="${i % 3 ? '#c4392d' : '#a92f25'}" filter="url(#${id}wash)"/>`; }
  return o;
}
function garlic(id, x, y0, n) {
  let o = line([P(x, y0), P(x - 1, y0 + n * 12)], 1.2, 0.6);
  for (let i = 0; i < n; i++) o += wash(id, ellD(x + (i % 2 ? 5 : -5), y0 + 10 + i * 12, 8, 7), '#f1e9da') + line(quadPts(P(x + (i % 2 ? 5 : -5) - 6, y0 + 12 + i * 12), P(x + (i % 2 ? 5 : -5), y0 + 19 + i * 12), P(x + (i % 2 ? 5 : -5) + 6, y0 + 12 + i * 12)), 1, 0.5);
  return o;
}
function basket(id, x, y, w, fill, fruit) {
  return wash(id, `M ${x - w} ${y - 14} h ${2 * w} l ${-w * 0.15} 18 h ${-w * 1.7} Z`, '#c49a62')
    + `<g filter="url(#${id}wash)">${Array.from({ length: Math.round(w / 6) }, (_, i) => `<circle cx="${x - w + 6 + i * 12 * (w / (w + 4))}" cy="${y - 16 - (i % 2) * 4}" r="6.5" fill="${fruit[i % fruit.length]}"/>`).join('')}</g>`
    + line([P(x - w, y - 14), P(x, y - 13), P(x + w, y - 14)], 1.6, 0.75) + line([P(x - w * 0.85, y + 4), P(x + w * 0.85, y + 4)], 1.8, 0.75) + line([P(x - w, y - 8), P(x + w, y - 8)], 0.8, 0.35);
}
function bambooView(id, cx, cy, r, se = 'spring') { // 月洞窗外的竹子，跟着季节变
  const sky = { spring: '#f1e6e6', summer: '#dfe9cf', autumn: '#f1e3c8', winter: '#eef2f3' }[se], low = { spring: '#e9d0d6', summer: '#c7d9b0', autumn: '#e6c58e', winter: '#fbfbf8' }[se];
  let o = `<ellipse cx="${cx}" cy="${cy}" rx="${r}" ry="${r}" fill="${se === 'winter' ? '#6d8aa2' : sky}"/>`;
  if (se === 'winter') o += `<path d="M ${cx - r} ${cy - 20} C ${cx - 20} ${cy - 60} ${cx + 10} ${cy - 10} ${cx + r} ${cy - 40}" stroke="#86e6a8" stroke-width="10" fill="none" opacity="0.6"/>`;
  o += `<path d="M ${cx - r} ${cy + 4} L ${cx - 30} ${cy - 26} L ${cx - 12} ${cy - 10} L ${cx + 10} ${cy - 34} L ${cx + 34} ${cy - 4} L ${cx + r} ${cy - 14} L ${cx + r} ${cy + 20} L ${cx - r} ${cy + 20} Z" fill="#a7b3c6"/><path d="M ${cx - 38} ${cy - 18} L ${cx - 30} ${cy - 26} L ${cx - 22} ${cy - 18} Z M ${cx + 2} ${cy - 26} L ${cx + 10} ${cy - 34} L ${cx + 18} ${cy - 26} Z" fill="#fbfbf8"/>`;
  o += `<ellipse cx="${cx + 10}" cy="${cy + 26}" rx="${r * 0.95}" ry="${r * 0.45}" fill="${low}" opacity="0.95"/>`;
  for (const [dx, wd, col] of [[-30, 5, '#8aa874'], [-8, 6, '#7a9a66'], [18, 4, '#9bb886'], [36, 5, '#86a470']]) {
    o += `<rect x="${cx + dx}" y="${cy - r}" width="${wd}" height="${2 * r}" fill="${col}"/>`;
    for (let k = 0; k < 4; k++) o += `<rect x="${cx + dx - 1}" y="${cy - r + 14 + k * 24}" width="${wd + 2}" height="2" fill="#5f7d50" opacity="0.6"/>`;
    o += `<ellipse cx="${cx + dx + 12}" cy="${cy - 20 + dx * 0.4}" rx="13" ry="3.5" fill="${se === 'autumn' ? '#c98a3a' : '#7a9a66'}" transform="rotate(-25 ${cx + dx + 12} ${cy - 20 + dx * 0.4})"/>`;
  }
  if (se === 'spring') o += [[-40, -30], [-24, -40], [-50, -14], [20, -44], [40, -30]].map(([a, b], i) => `<circle cx="${cx + a}" cy="${cy + b}" r="${9 - (i % 3)}" fill="${i % 2 ? '#f2c6d0' : '#f6d6de'}"/>`).join('') + `<path d="M ${cx - 60} ${cy - 50} q 40 10 70 4" stroke="#6e4c36" stroke-width="3" fill="none"/>`;
  if (se === 'autumn') o += [[-40, -30], [24, -40], [40, -10], [-10, -46]].map(([a, b], i) => `<path d="M ${cx + a} ${cy + b} l 6 -8 l 2 8 l 8 -2 l -6 8 Z" fill="${['#c4602f', '#d98c3a', '#e0b040'][i % 3]}"/>`).join('');
  if (se === 'winter') o += [[-30, -40], [-8, -20], [18, -36], [36, -10]].map(([a, b]) => `<ellipse cx="${cx + a + 6}" cy="${cy + b}" rx="10" ry="3" fill="#fbfbf8"/>`).join('');
  return `<g filter="url(#${id}wash)" clip-path="url(#${id}moon)">${o}</g>`;
}

function roomSVG2(season = 'spring') {
  const id = 'R' + (++_sid);
  const defs = `${sceneDefs(id)}<clipPath id="${id}moon"><circle cx="80" cy="104" r="52"/></clipPath>
    <radialGradient id="${id}glow"><stop offset="0" stop-color="#ffd89a" stop-opacity="0.55"/><stop offset="1" stop-color="#ffd89a" stop-opacity="0"/></radialGradient>
    <radialGradient id="${id}cool"><stop offset="0" stop-color="#f4f8ec" stop-opacity="0.5"/><stop offset="1" stop-color="#f4f8ec" stop-opacity="0"/></radialGradient>
    <linearGradient id="${id}wallshade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a2a1e" stop-opacity="0.28"/><stop offset="1" stop-color="#3a2a1e" stop-opacity="0"/></linearGradient>
    <linearGradient id="${id}floorshade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff3d6" stop-opacity="0.25"/><stop offset="0.6" stop-color="#3a2a1e" stop-opacity="0"/><stop offset="1" stop-color="#3a2a1e" stop-opacity="0.16"/></linearGradient>
    <radialGradient id="${id}fire"><stop offset="0" stop-color="#ffb347" stop-opacity="0.9"/><stop offset="1" stop-color="#e8622c" stop-opacity="0"/></radialGradient>`;
  const g = [];
  const R = rnd(7);
  // ===== 背景：墙 =====
  g.push(`<rect x="0" y="0" width="1280" height="200" fill="#efe2c8"/>`);
  g.push(wash(id, rectD(-10, 20, 1300, 180), '#f0e3c9'));
  g.push(`<g opacity="0.35" filter="url(#${id}soft)">${[[300, 90, 150], [1000, 80, 130]].map(([x, y, r]) => `<ellipse cx="${x}" cy="${y}" rx="${r}" ry="${r * 0.5}" fill="#e2cfa9"/>`).join('')}</g>`);
  // 天花梁 + 椽子头
  g.push(wash(id, rectD(-10, -4, 1300, 26), '#6e4c36'));
  for (let x = 14; x < 1280; x += 58) g.push(wash(id, rectD(x, 4, 14, 12, 2), '#8f6a4c'));
  g.push(line([P(-10, 22), P(640, 21), P(1290, 23)], 3, 0.85));
  // 柱子
  for (const x of [150, 482, 816, 1044]) g.push(wash(id, rectD(x - 9, 18, 18, 182), '#7b5539') + line([P(x - 9, 22), P(x - 9, 198)], 1.4, 0.6) + line([P(x + 9, 22), P(x + 10, 198)], 2.4, 0.8) + wash(id, rectD(x - 13, 188, 26, 12, 3), '#a39a8c'));
  // --- A：月洞窗 + 竹影 ---
  g.push(bambooView(id, 80, 104, 52, season));
  g.push(`<circle cx="80" cy="104" r="56" fill="none" stroke="#8a6142" stroke-width="9" filter="url(#${id}wash)"/>`);
  g.push(line(sample([segC(P(24, 104), P(24, 30), P(136, 30), P(136, 104))], 24), 2, 0.65) + line(sample([segC(P(136, 104), P(136, 178), P(24, 178), P(24, 104))], 24), 3, 0.85));
  g.push(wash(id, rectD(30, 166, 100, 10, 3), '#8a6142') + propPlant(id, 108, 166, 0.55));
  g.push(wash(id, rectD(40, 150, 26, 16, 3), '#e9e1d2') + line([P(44, 150), P(50, 128), P(56, 120)], 1.2, 0.7) + `<g filter="url(#${id}wash)"><ellipse cx="56" cy="120" rx="5" ry="3" fill="#e9b7c6"/><ellipse cx="50" cy="130" rx="4" ry="2.5" fill="#f2d3dc"/></g>`);
  // --- B：招牌 + 陶罐架 + 干辣椒 / 蒜辫 ---
  g.push(line([P(196, 22), P(204, 58)], 1.4, 0.7) + line([P(344, 22), P(336, 58)], 1.4, 0.7));
  g.push(wash(id, rectD(186, 58, 168, 40, 8), '#3f3129') + wash(id, rectD(192, 63, 156, 30, 5), '#5a4636') + box(186, 58, 168, 40, 2.6, 0.9));
  g.push(wash(id, rectD(164, 130, 308, 9, 2), '#8f6444') + line([P(164, 139), P(320, 140), P(472, 139)], 2.2, 0.8));
  g.push(line([P(180, 139), P(186, 152)], 2, 0.7) + line([P(456, 139), P(450, 152)], 2, 0.7));
  g.push(pot(id, 186, 130, 0.9, '#9a6a4a', '#5e3f2e', 0) + pot(id, 224, 130, 1.1, '#c9b79a', '#7d9c96', 1) + pot(id, 262, 130, 0.8, '#6e5444', null, 2) + basket(id, 306, 130, 26, '#c49a62', ['#c4392d', '#d9453a', '#b9342a']) + pot(id, 352, 130, 1, '#e2d6c0', '#a9c3c0', 0) + pot(id, 388, 130, 0.75, '#8a5a3c', '#c48a4a', 1));
  g.push(`<g filter="url(#${id}wash)">${[0, 1, 2, 3].map((i) => `<ellipse cx="432" cy="${128 - i * 6}" rx="22" ry="5" fill="${i % 2 ? '#f3efe6' : '#e7dfd0'}"/>`).join('')}</g>` + line(quadPts(P(410, 128), P(432, 136), P(454, 128)), 1.6, 0.75));
  g.push(chiliString(id, 470, 24, 8) + garlic(id, 162, 24, 5));
  g.push(wash(id, rectD(164, 150, 308, 46, 4), '#b58a60') + box(164, 150, 308, 46, 2.2, 0.8));
  for (let i = 0; i < 4; i++) { const x0 = 172 + i * 76; g.push(wash(id, rectD(x0, 156, 68, 34, 3), '#d4b183')); for (let k = 1; k < 4; k++) g.push(line([P(x0 + k * 17, 158), P(x0 + k * 17, 188)], 0.8, 0.35)); g.push(line([P(x0 + 2, 173), P(x0 + 66, 173)], 0.8, 0.35)); }
  // --- C：开放厨房 ---
  g.push(wash(id, rectD(492, 22, 318, 104), '#e6e1d4'));
  for (let y = 26, r = 0; y < 100; y += 13, r++) for (let x = 492 + (r % 2 ? 11 : 0); x < 810; x += 22) g.push(`<rect x="${x + 1}" y="${y + 1}" width="20" height="11" rx="2" fill="${['#d9e3df', '#e7e8de', '#cfdcd7', '#e2e4da'][Math.floor(R() * 4)]}"/>`);
  g.push(`<rect x="492" y="22" width="318" height="104" fill="url(#${id}wallshade)" opacity="0.4"/>`);
  g.push(line([P(500, 52), P(800, 52)], 2.2, 0.75));
  for (const [x, sh] of [[506, 'ladle'], [520, 'spat'], [784, 'pan'], [798, 'ladle']]) g.push(line([P(x, 52), P(x, sh === 'pan' ? 66 : 76)], 1.6, 0.8) + (sh === 'ladle' ? wash(id, ellD(x, 80, 6, 5), '#8e8780') : sh === 'spat' ? wash(id, rectD(x - 6, 74, 12, 12, 2), '#8e8780') : wash(id, ellD(x, 74, 11, 9), '#4f4945')));
  // 灶台（砖）+ 四个灶口的火光
  g.push(wash(id, rectD(505, 96, 290, 28, 4), '#b8a492'));
  for (let x = 507; x < 795; x += 24) g.push(line([P(x, 98), P(x, 110)], 0.7, 0.25));
  g.push(line([P(507, 110), P(793, 110)], 0.7, 0.25));
  for (let i = 0; i < 4; i++) { const x = 548 + i * 70; g.push(`<ellipse cx="${x}" cy="${116}" rx="16" ry="7" fill="url(#${id}fire)"/>` + wash(id, `M ${x - 12} 124 q 0 -12 12 -12 q 12 0 12 12 Z`, '#3d302a')); g.push(`<ellipse cx="${x}" cy="121" rx="7" ry="3" fill="#ff9a3c" opacity="0.8" filter="url(#${id}soft)"/>`); }
  g.push(box(505, 96, 290, 28, 2.2, 0.8));
  // 抽油烟木罩 + 半截蓝布帘（框住厨房）
  g.push(wash(id, `M 486 22 h 330 l -12 16 h -306 Z`, '#6e4c36'));
  for (let i = 0; i < 6; i++) { const x0 = 498 + i * 51; g.push(wash(id, `M ${x0} 36 h 47 v 22 q -6 5 -12 0 q -6 5 -12 0 q -6 5 -11 0 q -6 5 -12 0 Z`, i % 2 ? '#4d6585' : '#55708f')); }
  g.push(`<g opacity="0.75">${[0, 1, 2, 3, 4, 5].map((i) => `<circle cx="${521 + i * 51}" cy="47" r="5" fill="none" stroke="#e9e1d2" stroke-width="1.6"/>`).join('')}</g>`);
  g.push(line([P(490, 37), P(650, 36), P(812, 37)], 2.4, 0.85));
  // 出菜口台面（厚木板）
  g.push(wash(id, rectD(488, 126, 324, 70, 6), '#9b6b46'));
  for (let x = 500; x < 810; x += 34) g.push(line([P(x, 146), P(x + 1, 170), P(x, 194)], 1, 0.3));
  g.push(wash(id, rectD(482, 118, 336, 24, 8), '#d9a877') + `<rect x="490" y="122" width="320" height="5" rx="2" fill="#f3d3a6" opacity="0.8"/>`);
  g.push(box(482, 118, 336, 78, 2.8, 0.85));
  // --- D：木札菜单（字由画布竖着写）---
  g.push(line([P(832, 44), P(936, 43), P(1036, 44)], 3, 0.85) + line([P(840, 22), P(842, 44)], 1.2, 0.6) + line([P(1028, 22), P(1026, 44)], 1.2, 0.6));
  for (let i = 0; i < 6; i++) { const x = 840 + i * 32; g.push(line([P(x + 13, 44), P(x + 13, 50)], 1, 0.6) + wash(id, `M ${x} 50 h 26 v 88 l -13 8 l -13 -8 Z`, i % 2 ? '#e3cba3' : '#ead6b2') + line([P(x, 50), P(x, 138), P(x + 13, 146)], 1.4, 0.75) + line([P(x + 26, 50), P(x + 26, 138), P(x + 13, 146)], 1.8, 0.8)); }
  g.push(wash(id, rectD(830, 150, 206, 46, 4), '#b58a60') + box(830, 150, 206, 46, 2.2, 0.8));
  g.push(wash(id, `M 860 150 q -12 -22 0 -36 h 30 q 12 14 0 36 Z`, '#3f5f6b') + `<ellipse cx="866" cy="130" rx="5" ry="9" fill="#fff" opacity="0.25"/>` + line(sample([segQ(P(890, 114), P(904, 132), P(890, 150))], 8), 2, 0.8));
  g.push(basket(id, 960, 150, 28, '', ['#6f9a4e', '#86a874', '#f1e9da']) + pot(id, 1012, 150, 0.8, '#c9b79a', '#7d9c96', 2));
  // --- E：小窗 + 竹筒水 + 洗碗池 ---
  const wsky = { spring: '#d6e6ee', summer: '#bcd8ec', autumn: '#ecdcc0', winter: '#6d8aa2' }[season], wgr = { spring: '#e9c6d0', summer: '#86a874', autumn: '#d98c3a', winter: '#eef2f3' }[season];
  g.push(wash(id, rectD(1062, 30, 136, 70, 4), wsky) + (season === 'winter' ? `<path d="M 1064 52 C 1100 34 1150 60 1196 40" stroke="#86e6a8" stroke-width="8" fill="none" opacity="0.6" filter="url(#${id}soft)"/>` : '') + `<g filter="url(#${id}wash)"><path d="M 1062 84 L 1090 56 L 1110 70 L 1140 46 L 1170 72 L 1198 60 L 1198 100 L 1062 100 Z" fill="#a7b3c6"/><path d="M 1132 54 L 1140 46 L 1148 54 Z M 1082 64 L 1090 56 L 1098 64 Z" fill="#fbfbf8"/><ellipse cx="1100" cy="92" rx="40" ry="14" fill="${wgr}"/><ellipse cx="1166" cy="90" rx="34" ry="16" fill="${wgr}"/></g>`);
  g.push(line([P(1130, 30), P(1130, 100)], 2.4, 0.8) + box(1062, 30, 136, 70, 3, 0.9));
  g.push(wash(id, `M 1058 26 q 22 30 12 76 h -12 Z`, '#e7d8c0') + wash(id, `M 1202 26 q -22 30 -12 76 h 12 Z`, '#e7d8c0'));
  g.push(wash(id, rectD(1058, 100, 144, 8, 2), '#8f6444') + propPlant(id, 1092, 100, 0.45) + propPlant(id, 1176, 100, 0.5));
  g.push(wash(id, rectD(1046, 118, 158, 78, 8), '#a39a8c'));
  g.push(wash(id, rectD(1060, 128, 128, 30, 12), '#d3dfe3') + `<g filter="url(#${id}wash)">${[0, 1, 2].map((i) => `<circle cx="${1090 + i * 22}" cy="${138 + (i % 2) * 6}" r="${5 + i}" fill="#fff" opacity="0.85"/>`).join('')}</g>`);
  for (let x = 1050; x < 1200; x += 30) g.push(line([P(x, 164), P(x + 26, 165)], 0.8, 0.3));
  g.push(box(1046, 118, 158, 78, 2.6, 0.85));
  g.push(wash(id, `M 1210 104 l -60 10 l 0 8 l 60 -10 Z`, '#8aa874') + line([P(1150, 114), P(1210, 104)], 1.6, 0.8) + line([P(1166, 112), P(1166, 118)], 0.8, 0.5) + `<path d="M 1152 120 q -3 6 -1 12" stroke="#9cc0cc" stroke-width="3" fill="none"/>`);
  g.push(line([P(1214, 70), P(1214, 196)], 3.4, 0.8));
  // 墙脚阴影
  g.push(`<rect x="0" y="196" width="1280" height="44" fill="url(#${id}wallshade)"/>`);

  // ===== 地面 =====
  const fl = [];
  g.push(`<rect x="0" y="198" width="1280" height="522" fill="#b9946a"/>`);
  for (let y = 200, row = 0; y < 720; y += 36, row++) {
    let x = -60 - Math.floor(R() * 240);
    while (x < 1280) { const w = 300 + Math.floor(R() * 260); fl.push(`<rect x="${x + 1}" y="${y + 1}" width="${w - 2}" height="34" rx="2" fill="${['#e2c89d', '#dcc092', '#e6cea6', '#d8bb8c', '#dfc498'][Math.floor(R() * 5)]}"/>`); for (let k = 0; k < 2; k++) fl.push(`<path d="M ${x + 20 + R() * 60} ${y + 10 + k * 14} q ${w * 0.3} ${R() * 6 - 3} ${w * 0.6} 0" stroke="#c9a77a" stroke-width="1.2" fill="none" opacity="0.5"/>`); if (R() < 0.2) fl.push(`<ellipse cx="${x + 40 + R() * (w - 80)}" cy="${y + 18}" rx="6" ry="3" fill="#b9946a" opacity="0.6"/>`); x += w; }
  }
  g.push(`<g filter="url(#${id}soft)" opacity="0">${''}</g><g>${fl.join('')}</g>`);
  g.push(`<rect x="0" y="198" width="1280" height="522" fill="url(#${id}floorshade)"/>`);
  // 光：厨房暖光、月洞窗冷光、几盏灯照在地上
  g.push(`<ellipse cx="650" cy="236" rx="280" ry="70" fill="url(#${id}glow)"/><ellipse cx="110" cy="250" rx="150" ry="60" fill="url(#${id}cool)"/>`);
  for (const [x, y] of [[470, 300], [800, 300], [470, 528], [800, 528]]) g.push(`<ellipse cx="${x}" cy="${y}" rx="210" ry="110" fill="url(#${id}glow)" opacity="0.55"/>`);
  // 门口石板地 + 等位区长条地毯
  const stones = [[20, 600, 70, 40], [96, 596, 64, 44], [166, 604, 56, 38], [10, 646, 60, 40], [76, 644, 80, 42], [162, 648, 60, 40], [24, 690, 70, 40], [100, 692, 66, 40], [172, 694, 58, 36]];
  g.push(`<g filter="url(#${id}wash)">${stones.map(([x, y, w, h], i) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10" fill="${['#c9c1b3', '#bdb5a7', '#d1c9bb'][i % 3]}"/>`).join('')}</g>`);
  g.push(stones.map(([x, y, w, h]) => line([P(x + 4, y + h), P(x + w / 2, y + h + 1), P(x + w - 4, y + h)], 1.4, 0.45)).join(''));
  g.push(wash(id, rectD(64, 262, 92, 330, 10), '#7d8fa6', 0.75) + `<rect x="72" y="270" width="76" height="314" rx="6" fill="none" stroke="#e9e1d2" stroke-width="2" stroke-dasharray="8 6" opacity="0.6"/>` + Array.from({ length: 10 }, (_, i) => `<path d="M 80 ${290 + i * 30} l 30 -8 l 30 8" stroke="#e9e1d2" stroke-width="2" fill="none" opacity="0.4"/>`).join('') + line([P(64, 264), P(64, 590)], 1.6, 0.5) + line([P(156, 264), P(157, 590)], 2, 0.55));
  // 等位小木牌
  g.push(line([P(110, 256), P(104, 220)], 2, 0.8) + line([P(110, 256), P(116, 220)], 2, 0.8) + wash(id, rectD(84, 206, 52, 30, 5), '#d9b77a') + box(84, 206, 52, 30, 1.8, 0.85));
  // 每张桌下面一张圆草席
  for (const [x, y, big] of [[470, 320, 0], [800, 320, 1], [470, 548, 1], [800, 548, 0]]) {
    const rx = big ? 176 : 152, ry = big ? 84 : 72;
    g.push(wash(id, ellD(x, y + 14, rx, ry), '#d7c28f', 0.9));
    for (const k of [0.82, 0.62, 0.42]) g.push(`<ellipse cx="${x}" cy="${y + 14}" rx="${rx * k}" ry="${ry * k}" fill="none" stroke="#b89c66" stroke-width="2" opacity="0.45"/>`);
    g.push(line(sample([segC(P(x - rx, y + 14), P(x - rx, y + 14 + ry * 1.33), P(x + rx, y + 14 + ry * 1.33), P(x + rx, y + 14))], 24), 1.8, 0.4));
  }
  // 门（左下角）：门框 + 蓝布帘
  g.push(wash(id, rectD(14, 596, 128, 130, 6), '#8a6142') + wash(id, rectD(24, 604, 108, 116, 2), '#efe2c8'));
  g.push(wash(id, `M 24 604 h 108 v 52 q -14 8 -27 0 q -13 8 -27 0 q -13 8 -27 0 q -13 8 -27 0 Z`, '#55708f'));
  g.push(line([P(78, 604), P(78, 656)], 1.2, 0.5) + box(14, 596, 128, 130, 3, 0.85));
  // 右边：收银台（算盘、铃铛）+ 猫窝 + 大盆栽
  g.push(`<ellipse cx="1200" cy="340" rx="90" ry="16" fill="${INK}" opacity="0.12" filter="url(#${id}soft)"/>`);
  g.push(wash(id, rectD(1132, 260, 140, 78, 6), '#8a5c3c') + wash(id, rectD(1124, 246, 156, 22, 6), '#c48e5c') + `<rect x="1130" y="249" width="146" height="4" rx="2" fill="#e6b886" opacity="0.8"/>`);
  for (let x = 1146; x < 1272; x += 30) g.push(line([P(x, 272), P(x + 1, 336)], 1, 0.35));
  g.push(box(1124, 246, 156, 92, 2.6, 0.85));
  g.push(wash(id, rectD(1146, 230, 64, 18, 3), '#6e4c36') + `<g>${[0, 1, 2, 3, 4, 5, 6].map((i) => `<line x1="${1152 + i * 9}" y1="232" x2="${1152 + i * 9}" y2="246" stroke="#3f3129" stroke-width="1"/><circle cx="${1152 + i * 9}" cy="${236 + (i % 3) * 2}" r="2.6" fill="#a8744b"/><circle cx="${1152 + i * 9}" cy="${243 - (i % 2) * 2}" r="2.6" fill="#a8744b"/>`).join('')}</g>`);
  g.push(wash(id, `M 1236 246 q 0 -14 10 -14 q 10 0 10 14 Z`, '#d9a441') + `<circle cx="1246" cy="230" r="2.4" fill="#6e4c36"/>`);
  g.push(propPlant(id, 1132, 470, 0.8));
  g.push(wash(id, ellD(1176, 676, 70, 28), '#c99a62') + wash(id, ellD(1176, 668, 54, 18), '#e9c0b1'));
  for (let i = 0; i < 6; i++) g.push(line([P(1110 + i * 26, 690), P(1116 + i * 26, 698)], 1, 0.35));
  g.push(line(sample([segC(P(1106, 676), P(1108, 708), P(1244, 708), P(1246, 676))], 18), 3, 0.85) + line(sample([segC(P(1106, 674), P(1110, 648), P(1242, 648), P(1246, 674))], 18), 1.8, 0.6));
  // —— 道具成簇、互相叠着 ——
  const sack = (x, y, k, col = '#e6d6b4') => wash(id, `M ${x - 22 * k} ${y} q -6 ${-30 * k} ${6 * k} ${-44 * k} q ${16 * k} ${-8 * k} ${32 * k} 0 q ${12 * k} ${14 * k} ${6 * k} ${44 * k} Z`, col) + line(quadPts(P(x - 12 * k, y - 40 * k), P(x, y - 34 * k), P(x + 12 * k, y - 40 * k)), 1.6, 0.7) + line(sample([segQ(P(x + 16 * k, y - 40 * k), P(x + 26 * k, y - 20 * k), P(x + 20 * k, y))], 8), 2, 0.8) + `<text x="${x}" y="${y - 14 * k}" font-size="${12 * k}" text-anchor="middle" fill="#8a6a50" opacity="0.8">米</text>`;
  const crate = (x, y, w, h, fruit) => wash(id, rectD(x, y - h, w, h, 3), '#b48a5c') + [1, 2].map((i) => line([P(x + 2, y - h + (h / 3) * i), P(x + w - 2, y - h + (h / 3) * i)], 0.9, 0.45)).join('') + box(x, y - h, w, h, 1.8, 0.85) + (fruit ? `<g filter="url(#${id}wash)">${Array.from({ length: Math.floor(w / 13) }, (_, i) => `<circle cx="${x + 8 + i * 13}" cy="${y - h - 4 + (i % 2) * 2}" r="7" fill="${fruit[i % fruit.length]}"/>`).join('')}</g>` : '');
  g.push(`<ellipse cx="250" cy="236" rx="110" ry="14" fill="${INK}" opacity="0.12" filter="url(#${id}soft)"/>`);
  g.push(crate(176, 238, 64, 40, ['#6f9a4e', '#86a874']) + sack(270, 240, 1) + sack(300, 244, 0.85, '#ddc9a2') + crate(216, 246, 50, 30, ['#cf3b2c', '#e0b040']));
  g.push(wash(id, `M 336 244 q -16 -26 -6 -50 h 52 q 10 24 -6 50 Z`, '#5f6f78') + wash(id, ellD(362, 194, 26, 7), '#4a5a62') + wash(id, ellD(362, 194, 20, 4.5), '#9cc0cc') + `<ellipse cx="350" cy="214" rx="5" ry="12" fill="#fff" opacity="0.2"/>` + line(sample([segQ(P(388, 196), P(396, 222), P(384, 244))], 8), 2.4, 0.85) + wash(id, `M 372 192 l 30 -14 l 3 4 l -28 14 Z`, '#8a6142'));
  g.push(`<ellipse cx="880" cy="232" rx="60" ry="10" fill="${INK}" opacity="0.1" filter="url(#${id}soft)"/>` + crate(846, 236, 56, 34, ['#f1e9da', '#e9cba4']) + crate(870, 214, 40, 24, null) + basket(id, 890, 186, 18, '', ['#c4392d', '#a92f25']));
  // 门边衣帽架：草帽 + 油纸伞
  g.push(line([P(196, 662), P(198, 548)], 3.4, 0.85) + line([P(180, 662), P(216, 662)], 3, 0.85) + line([P(186, 556), P(212, 552)], 2, 0.8) + wash(id, ellD(206, 556, 22, 6), '#e2c27a') + wash(id, `M 196 556 q 10 -16 20 0 Z`, '#d9b56a') + `<path d="M 186 562 q 4 40 -2 80" stroke="#b04a3c" stroke-width="7" fill="none" stroke-linecap="round" filter="url(#${id}wash)"/>`);
  // 右边高柜（在大盆栽后面）
  g.push(wash(id, rectD(1188, 352, 84, 120, 4), '#7b5539') + [0, 1, 2].map((i) => wash(id, rectD(1196, 362 + i * 36, 68, 28, 3), '#a57a52')).join('') + `<g filter="url(#${id}wash)">${[0, 1, 2].map((i) => `<ellipse cx="${1212 + i * 18}" cy="${372}" rx="8" ry="5" fill="${['#e9e1d2', '#9cc0cc', '#e9b7c6'][i]}"/>`).join('')}<rect x="1206" y="402" width="40" height="14" rx="3" fill="#c9533f"/><rect x="1210" y="392" width="34" height="10" rx="3" fill="#4d6585"/></g>` + box(1188, 352, 84, 120, 2.2, 0.85));
  g.push(propPlant(id, 1230, 500, 1.15, true));
  // 扫帚靠在柱子上、毛线球、猫抓板
  g.push(line([P(1056, 196), P(1080, 120)], 2.4, 0.85) + wash(id, `M 1048 200 l 14 -14 l 12 6 l -8 18 Z`, '#d9b56a'));
  g.push(wash(id, ellD(1092, 664, 12, 11), '#d98aa0') + `<path d="M 1084 660 q 8 -6 16 2 M 1086 668 q 8 -4 14 2" stroke="#b9607a" stroke-width="1.4" fill="none"/>` + `<path d="M 1104 666 q 20 8 30 -2" stroke="#d98aa0" stroke-width="1.6" fill="none"/>`);
  // 柱子上的吊兰、厨房罩边又挂一串辣椒
  g.push(line([P(816, 22), P(816, 60)], 1, 0.6) + wash(id, `M 806 60 h 20 l -3 14 h -14 Z`, '#b4744f') + `<g filter="url(#${id}wash)">${[[-14, 70], [12, 76], [-6, 88], [16, 94], [-16, 100]].map(([dx, dy]) => `<ellipse cx="${816 + dx}" cy="${dy}" rx="5" ry="10" fill="#7f9a6c" transform="rotate(${dx} ${816 + dx} ${dy})"/>`).join('')}</g>`);
  g.push(chiliString(id, 494, 40, 5));
  g.push(`<rect x="0" y="0" width="1280" height="720" filter="url(#${id}grain)"/>`);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720" width="1280" height="720"><defs>${defs}</defs><g filter="url(#${id}ink)">${g.join('')}</g></svg>`;
}

// 前景取景框：画在所有人物上面，只占边角
function roomFgSVG() {
  const id = 'F' + (++_sid);
  const g = [];
  const defs = `${sceneDefs(id)}<radialGradient id="${id}vig" cx="0.5" cy="0.5" r="0.75"><stop offset="0.65" stop-color="#2c1d12" stop-opacity="0"/><stop offset="1" stop-color="#2c1d12" stop-opacity="0.32"/></radialGradient>`;
  g.push(`<rect width="1280" height="720" fill="url(#${id}vig)"/>`);
  // 左右柱子
  g.push(wash(id, rectD(-6, 0, 22, 720), '#5a3f2e') + line([P(16, 0), P(17, 720)], 3, 0.8));
  g.push(wash(id, rectD(1264, 0, 22, 720), '#5a3f2e') + line([P(1264, 0), P(1263, 720)], 3, 0.8));
  // 左上、右上垂下来的绿萝
  const vine = (x0, dir, n, len) => { let o = ''; for (let k = 0; k < n; k++) { const x = x0 + dir * k * 18, L = len - k * 12; o += line(quadPts(P(x, 0), P(x + dir * 10, L * 0.5), P(x + dir * 4, L)), 1.4, 0.55); for (let j = 1; j < 6; j++) { const yy = (L / 6) * j, xx = x + dir * Math.sin(j) * 8; o += `<ellipse cx="${xx}" cy="${yy}" rx="9" ry="6" fill="${j % 2 ? '#6f8f5c' : '#86a874'}" transform="rotate(${dir * (j % 2 ? 30 : -30)} ${xx} ${yy})" filter="url(#${id}wash)"/>`; } } return o; };
  g.push(vine(30, 1, 4, 150) + vine(1250, -1, 3, 120));
  for (const [x, len] of [[420, 70], [1130, 58]]) {
    g.push(`<ellipse cx="${x}" cy="${len + 30}" rx="90" ry="60" fill="#ffd89a" opacity="0.18" filter="url(#${id}soft)"/>`);
    g.push(line([P(x, 0), P(x, len)], 1.2, 0.7) + wash(id, `M ${x - 26} ${len + 24} q 0 -26 26 -26 q 26 0 26 26 Z`, '#c9a06a') + `<ellipse cx="${x}" cy="${len + 26}" rx="18" ry="5" fill="#ffe2a8" opacity="0.9" filter="url(#${id}soft)"/>`);
    for (let k = -2; k <= 2; k++) g.push(line(quadPts(P(x + k * 9, len), P(x + k * 14, len + 12), P(x + k * 12, len + 24)), 0.8, 0.5));
    g.push(line(sample([segQ(P(x - 26, len + 24), P(x, len - 4), P(x + 26, len + 24))], 10), 1.6, 0.8));
  }
  // 左下前景：一盆高高的龟背竹（压暗，像离镜头很近），右下：竹篮 + 蔬菜
  g.push(`<g opacity="0.92">${[[250, 750, -30], [280, 740, 0], [310, 752, 30]].map(([x, y, r]) => `<ellipse cx="${x}" cy="${y - 54}" rx="30" ry="48" fill="#4f6b45" transform="rotate(${r} ${x} ${y})" filter="url(#${id}wash)"/>`).join('')}</g>`);
  g.push(`<g opacity="0.92">${[[1000, 744, -40], [1030, 734, 10], [1062, 748, 50]].map(([x, y, r]) => `<ellipse cx="${x}" cy="${y - 40}" rx="22" ry="40" fill="#5c7a50" transform="rotate(${r} ${x} ${y})" filter="url(#${id}wash)"/>`).join('')}</g>`);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720" width="1280" height="720"><defs>${defs}</defs><g filter="url(#${id}ink)">${g.join('')}</g></svg>`;
}

const ROOM_LABELS2 = [
  { t: '盆盆餐厅', x: 270, y: 79, size: 25, fill: '#f3e3c0', stroke: '#2a201a', lw: 4 },
  { t: '等位', x: 110, y: 222, size: 17, fill: '#5a3b28' },
];

// 桌子 viewBox 320×200，桌面中心 (160, 90)：木纹圆桌 + 桌旗 + 筷筒 / 醋瓶 / 小花瓶；凳子带坐垫
function tableSVG2(seats = 2) {
  const id = 'T' + (++_sid);
  const big = seats === 4, cx = 160, cy = 90, rx = big ? 96 : 76, ry = big ? 48 : 40;
  const g = [`<defs>${sceneDefs(id, 320, 200)}</defs>`];
  const cush = ['#a8b88c', '#d49a6a', '#c9b06a', '#9fb3c4'];
  const stool = (x, y, k) => `<ellipse cx="${x}" cy="${y + 26}" rx="26" ry="8" fill="${INK}" opacity="0.14" filter="url(#${id}soft)"/>`
    + wash(id, rectD(x - 18, y, 36, 24, 4), '#8a5c3c') + wash(id, ellD(x, y, 22, 9), '#b07a4e') + wash(id, ellD(x, y - 3, 17, 7), cush[k % 4])
    + line(sample([segQ(P(x - 22, y + 1), P(x, y + 12), P(x + 22, y + 1))], 8), 2, 0.8) + line([P(x - 18, y + 24), P(x + 18, y + 25)], 1.6, 0.6);
  const st = [[cx - rx - 24, cy + 6], [cx + rx + 24, cy + 6]].concat(big ? [[cx - 46, cy - 50], [cx + 46, cy - 50]] : []);
  st.filter((s) => s[1] < cy).forEach((s, i) => g.push(stool(s[0], s[1], i + 2)));
  g.push(`<ellipse cx="${cx}" cy="${cy + 44}" rx="${rx * 0.9}" ry="${ry * 0.45}" fill="${INK}" opacity="0.16" filter="url(#${id}soft)"/>`);
  g.push(wash(id, rectD(cx - 10, cy + 10, 20, 34, 4), '#6e4a32'));
  g.push(wash(id, ellD(cx, cy + 8, rx, ry), '#8f5f3f'));
  g.push(wash(id, ellD(cx, cy, rx, ry), '#c48e5c'));
  g.push(`<g opacity="0.35">${[0.78, 0.55, 0.32].map((k) => `<ellipse cx="${cx + 4}" cy="${cy}" rx="${rx * k}" ry="${ry * k}" fill="none" stroke="#8f5f3f" stroke-width="1.4"/>`).join('')}</g>`);
  g.push(`<ellipse cx="${cx - rx * 0.35}" cy="${cy - ry * 0.4}" rx="${rx * 0.4}" ry="${ry * 0.25}" fill="#fff" opacity="0.18" filter="url(#${id}soft)"/>`);
  // 桌旗
  g.push(wash(id, `M ${cx - rx * 0.7} ${cy - 10} L ${cx + rx * 0.7} ${cy - 16} L ${cx + rx * 0.74} ${cy + 2} L ${cx - rx * 0.66} ${cy + 8} Z`, '#55708f', 0.85));
  g.push(`<path d="M ${cx - rx * 0.66} ${cy - 4} L ${cx + rx * 0.7} ${cy - 10}" stroke="#e9e1d2" stroke-width="1.4" stroke-dasharray="5 4" opacity="0.7"/>`);
  // 桌边描线
  g.push(line(sample([segC(P(cx - rx, cy), P(cx - rx, cy + ry * 1.33), P(cx + rx, cy + ry * 1.33), P(cx + rx, cy))], 24), 2.8, 0.85, { bias: 0.6 }));
  g.push(line(sample([segC(P(cx - rx, cy + 1), P(cx - rx, cy + ry * 1.45 + 6), P(cx + rx, cy + ry * 1.45 + 6), P(cx + rx, cy + 9))], 24), 1.6, 0.55));
  g.push(line(sample([segC(P(cx + rx, cy), P(cx + rx, cy - ry * 1.33), P(cx - rx, cy - ry * 1.33), P(cx - rx, cy))], 24), 1.4, 0.45));
  // 桌上小摆件（放在桌子后半边，不挡菜）
  const ox = cx + rx * 0.45, oy = cy - ry * 0.45;
  g.push(wash(id, rectD(ox - 6, oy - 22, 12, 22, 3), '#c9a46a') + line([P(ox - 3, oy - 22), P(ox - 5, oy - 34)], 1.2, 0.7) + line([P(ox + 1, oy - 22), P(ox + 2, oy - 35)], 1.2, 0.7) + line([P(ox + 6, oy - 20), P(ox + 6, oy)], 1.4, 0.75));
  g.push(wash(id, `M ${ox + 12} ${oy - 4} q -4 -10 2 -14 v -5 h 4 v 5 q 6 4 2 14 Z`, '#3f3129') + wash(id, `M ${ox - 18} ${oy - 2} q -5 -9 1 -12 v -4 h 4 v 4 q 6 3 1 12 Z`, '#b9473a'));
  const vx = cx - rx * 0.45, vy = cy - ry * 0.4;
  g.push(wash(id, `M ${vx - 6} ${vy} q -4 -12 3 -16 v -4 h 6 v 4 q 7 4 3 16 Z`, '#e6e0d4') + line([P(vx, vy - 20), P(vx - 4, vy - 32)], 1, 0.6) + line([P(vx + 1, vy - 20), P(vx + 6, vy - 30)], 1, 0.6) + `<g filter="url(#${id}wash)"><circle cx="${vx - 4}" cy="${vy - 34}" r="4" fill="#efb6c0"/><circle cx="${vx + 7}" cy="${vy - 31}" r="3.4" fill="#f2d06e"/></g>`);
  st.filter((s) => s[1] >= cy).forEach((s, i) => g.push(stool(s[0], s[1], i)));
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 200" width="640" height="400">${g[0]}<g filter="url(#${id}ink)">${g.slice(1).join('')}</g></svg>`;
}
if (typeof module !== 'undefined') module.exports = { roomSVG2, roomFgSVG, tableSVG2, ROOM_LABELS2 };
