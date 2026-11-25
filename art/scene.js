// 盆盆餐厅 · 店面、桌子、菜品（与猫猫同一套水墨淡彩画法；依赖 cats.js 里的 brush / mix 等工具）
let _sid = 0;
const KAI = '"Kaiti SC","STKaiti","KaiTi","Noto Serif CJK SC","Songti SC",serif';
function sceneDefs(id, w = 1280, h = 720) {
  return `<filter id="${id}wash" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves="3" seed="5" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="5"/><feGaussianBlur stdDeviation="0.7"/></filter>
  <filter id="${id}soft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="4"/></filter>
  <filter id="${id}ink" x="-2%" y="-2%" width="104%" height="104%"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="1" seed="3" result="g"/><feDisplacementMap in="SourceGraphic" in2="g" scale="1.5"/><feGaussianBlur stdDeviation="0.3"/></filter>
  <filter id="${id}grain" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="2" seed="9"/><feColorMatrix values="0 0 0 0 0.25  0 0 0 0 0.18  0 0 0 0 0.1  0 0 0 0.13 0"/></filter>`;
}
const ink = (d, op = 0.85) => `<path d="${d}" fill="${INK}" opacity="${op}"/>`;
const line = (pts, wm, op = 0.85, o = {}) => ink(brush(pts, wm, o), op);
const lineQ = (a, c, b, wm, op, o) => line(quadPts(a, c, b, 16), wm, op, o);
const wash = (id, d, col, op = 1) => `<path d="${d}" fill="${col}" opacity="${op}" filter="url(#${id}wash)"/>`;
const rectD = (x, y, w, h, r = 0) => `M ${x + r} ${y} h ${w - 2 * r} q ${r} 0 ${r} ${r} v ${h - 2 * r} q 0 ${r} ${-r} ${r} h ${-(w - 2 * r)} q ${-r} 0 ${-r} ${-r} v ${-(h - 2 * r)} q 0 ${-r} ${r} ${-r} Z`;
const ellD = (cx, cy, rx, ry) => `M ${cx - rx} ${cy} a ${rx} ${ry} 0 1 0 ${2 * rx} 0 a ${rx} ${ry} 0 1 0 ${-2 * rx} 0 Z`;
const box = (x, y, w, h, wm = 2.4, op = 0.8) => line([P(x, y), P(x + w * 0.5, y - 1), P(x + w, y)], wm, op) + line([P(x + w, y + 2), P(x + w + 1, y + h * 0.5), P(x + w, y + h)], wm * 1.2, op) + line([P(x + w - 2, y + h), P(x + w * 0.5, y + h + 1), P(x, y + h)], wm * 1.2, op) + line([P(x, y + h - 2), P(x - 1, y + h * 0.5), P(x, y + 2)], wm * 0.8, op * 0.8);

// ---------- 小道具 ----------
function propJar(id, x, y, k = 1) { // 福字罐（红布封口），文字由画布另画
  return wash(id, `M ${x - 16 * k} ${y - 26 * k} q ${-8 * k} ${14 * k} 0 ${26 * k} h ${32 * k} q ${8 * k} ${-12 * k} 0 ${-26 * k} Z`, '#a86f4a')
    + wash(id, ellD(x, y - 28 * k, 19 * k, 7 * k), '#c4523f') + wash(id, `M ${x - 19 * k} ${y - 28 * k} l ${-4 * k} ${8 * k} l ${8 * k} ${-3 * k} Z M ${x + 19 * k} ${y - 28 * k} l ${4 * k} ${8 * k} l ${-8 * k} ${-3 * k} Z`, '#c4523f')
    + wash(id, rectD(x - 7 * k, y - 18 * k, 14 * k, 13 * k, 2), '#e9c96f')
    + line(sample([segQ(P(x - 17 * k, y - 24 * k), P(x - 26 * k, y - 12 * k), P(x - 15 * k, y))], 10), 2.2 * k, 0.8) + line(sample([segQ(P(x + 17 * k, y - 24 * k), P(x + 26 * k, y - 12 * k), P(x + 15 * k, y))], 10), 2.8 * k, 0.85)
    + line([P(x - 16 * k, y), P(x, y + 1), P(x + 16 * k, y)], 2 * k, 0.75);
}
function propSteamer(id, x, y, n = 2) { // 叠起来的竹蒸笼
  let o = '';
  for (let i = 0; i < n; i++) { const yy = y - i * 14; o += wash(id, rectD(x - 26, yy - 14, 52, 14, 5), i % 2 ? '#cfa86a' : '#d9b77a') + line([P(x - 26, yy), P(x, yy + 1), P(x + 26, yy)], 1.8, 0.7) + line([P(x - 26, yy - 7), P(x + 26, yy - 7)], 0.9, 0.35); }
  return o + wash(id, ellD(x, y - n * 14, 26, 6), '#e2c58e') + line(sample([segQ(P(x - 26, y - n * 14), P(x, y - n * 14 - 10), P(x + 26, y - n * 14))], 10), 1.8, 0.7) + line([P(x + 27, y), P(x + 28, y - n * 7), P(x + 27, y - n * 14)], 2.4, 0.8);
}
function propPlant(id, x, y, k = 1, big = false) { // 盆栽
  const leaves = big ? [[-26, -70, -30], [-6, -96, -8], [18, -84, 24], [30, -56, 40], [-34, -44, -50], [6, -60, 6]] : [[-12, -34, -24], [0, -46, 0], [12, -34, 24], [-4, -26, -10], [8, -24, 12]];
  let o = leaves.map(([dx, dy, r]) => `<ellipse cx="${x + dx * k}" cy="${y + dy * k}" rx="${(big ? 15 : 9) * k}" ry="${(big ? 26 : 16) * k}" transform="rotate(${r} ${x + dx * k} ${y + dy * k})" fill="${big ? '#6f8f5c' : '#7f9a6c'}" opacity="0.9" filter="url(#${id}wash)"/>`).join('');
  o += leaves.slice(0, 3).map(([dx, dy, r]) => line(quadPts(P(x, y - 14 * k), P(x + dx * 0.4 * k, y + dy * 0.5 * k), P(x + dx * k, y + dy * k)), 1.2, 0.45)).join('');
  const pw = (big ? 30 : 20) * k, ph = (big ? 34 : 24) * k;
  return o + wash(id, `M ${x - pw} ${y - ph} h ${2 * pw} l ${-pw * 0.18} ${ph} h ${-pw * 1.64} Z`, '#b4744f') + line([P(x - pw, y - ph), P(x, y - ph - 1), P(x + pw, y - ph)], 2, 0.8) + line([P(x + pw, y - ph), P(x + pw * 0.82, y)], 2.6, 0.85) + line([P(x - pw * 0.82, y), P(x - pw, y - ph)], 1.8, 0.7) + line([P(x - pw * 0.82, y), P(x + pw * 0.82, y + 1)], 2, 0.75);
}
function propLantern(id, lx, ly, top = 0) {
  return line([P(lx, top), P(lx, ly - 34)], 1.6, 0.7) + wash(id, ellD(lx, ly, 22, 30), '#cf5a45')
    + `<ellipse cx="${lx - 6}" cy="${ly - 8}" rx="8" ry="14" fill="#fff" opacity="0.2" filter="url(#${id}soft)"/>`
    + wash(id, rectD(lx - 10, ly - 34, 20, 6, 2), '#3d3330') + wash(id, rectD(lx - 10, ly + 28, 20, 6, 2), '#3d3330')
    + line(quadPts(P(lx - 20, ly - 14), P(lx - 26, ly), P(lx - 20, ly + 16)), 2.4, 0.75) + line(quadPts(P(lx + 20, ly - 16), P(lx + 27, ly), P(lx + 20, ly + 18)), 3, 0.85)
    + line(quadPts(P(lx, ly - 28), P(lx - 4, ly), P(lx, ly + 28)), 1, 0.3) + line([P(lx - 3, ly + 34), P(lx - 2, ly + 44), P(lx, ly + 54)], 1.4, 0.6);
}

// ---------- 整个店面背景 1280×720（文字由游戏画布用手写字体另画）----------
function roomSVG() {
  const id = 'r' + (++_sid);
  const g = [`<defs>${sceneDefs(id)}</defs>`];
  // 墙面 + 木柱
  g.push(`<rect x="0" y="0" width="1280" height="200" fill="#f1e5cf"/>`);
  g.push(`<rect x="0" y="30" width="1280" height="120" fill="#000" opacity="0.025"/>`);
  for (const x of [150, 476, 824, 1232]) g.push(wash(id, rectD(x, 30, 16, 120), '#8f6444') + line([P(x, 32), P(x, 150)], 1.8, 0.7) + line([P(x + 16, 32), P(x + 17, 150)], 2.4, 0.8));
  // 屋檐瓦片
  g.push(wash(id, rectD(-10, 20, 1300, 16), '#7d5a40'));
  let tiles = '';
  for (let x = -10; x < 1290; x += 36) tiles += `<path d="M ${x} 22 q 18 -26 36 0 Z" fill="${(x / 36) % 2 ? '#8e8a86' : '#9b9792'}"/>`;
  g.push(`<g filter="url(#${id}wash)"><rect x="-10" y="0" width="1300" height="14" fill="#86817c"/>${tiles}</g>`);
  for (let x = -10; x < 1290; x += 36) g.push(line(sample([segQ(P(x + 1, 22), P(x + 18, -2), P(x + 35, 22))], 8), 1.6, 0.55));
  g.push(line([P(-10, 36), P(640, 35), P(1290, 37)], 3, 0.8));
  // 墙裙
  g.push(wash(id, rectD(-10, 148, 1300, 52), '#d8b88d'));
  for (let x = 20; x < 1280; x += 60) g.push(line([P(x, 152), P(x + 1, 174), P(x, 196)], 1, 0.2));
  g.push(line([P(0, 150), P(640, 148), P(1280, 151)], 2.2, 0.6));
  // 地板
  g.push(wash(id, rectD(-10, 196, 1300, 540), '#e7d2ae'));
  for (let y = 240, k = 0; y < 720; y += 44, k++) {
    g.push(line([P(-10, y), P(400 + (k % 3) * 60, y + 1), P(820, y - 1), P(1290, y + 1)], 1.6, 0.2, { wMin: 0.2 }));
    for (let x = (k % 2 ? 150 : 330); x < 1280; x += 360) g.push(line([P(x, y - 44), P(x + 1, y - 22), P(x, y)], 1.2, 0.16));
  }
  g.push(line([P(0, 198), P(600, 196), P(1280, 199)], 3.4, 0.75));
  // 大地毯（桌子区域）
  g.push(wash(id, rectD(330, 238, 610, 400, 26), '#d9a58f', 0.55));
  g.push(`<rect x="352" y="258" width="566" height="360" rx="18" fill="none" stroke="#b9675a" stroke-width="5" stroke-dasharray="14 10" opacity="0.35" filter="url(#${id}wash)"/>`);
  g.push(line(sample([segC(P(332, 262), P(330, 400), P(332, 560), P(334, 634))], 14), 1.8, 0.4) + line(sample([segC(P(938, 244), P(941, 400), P(939, 560), P(936, 636))], 14), 2.2, 0.45));
  // 左：格子窗（窗外有绿树）
  g.push(wash(id, rectD(24, 58, 112, 84, 4), '#bcd3b0'));
  g.push(`<g filter="url(#${id}wash)"><ellipse cx="60" cy="118" rx="34" ry="22" fill="#86a874" opacity="0.8"/><ellipse cx="108" cy="104" rx="26" ry="20" fill="#9bb886" opacity="0.8"/></g>`);
  for (let i = 1; i < 4; i++) g.push(line([P(24 + i * 28, 60), P(24 + i * 28, 140)], 2, 0.75));
  for (let i = 1; i < 3; i++) g.push(line([P(26, 58 + i * 28), P(134, 58 + i * 28)], 2, 0.75));
  g.push(box(24, 58, 112, 84, 3, 0.9));
  // 招牌下面的小架子 + 福字罐
  g.push(wash(id, rectD(178, 134, 186, 8, 2), '#8f6444') + line([P(178, 142), P(270, 143), P(364, 142)], 2.2, 0.8));
  g.push(propJar(id, 208, 134, 0.8) + propJar(id, 252, 134, 0.95) + propJar(id, 300, 134, 0.8) + propPlant(id, 342, 134, 0.7));
  // 招牌木板（字另画）
  g.push(wash(id, rectD(168, 62, 204, 46, 10), '#8a5a3a'));
  g.push(wash(id, rectD(176, 68, 188, 34, 6), '#b07a4e'));
  g.push(box(168, 62, 204, 46, 2.6, 0.9));
  g.push(line([P(200, 36), P(204, 62)], 1.4, 0.7) + line([P(340, 36), P(336, 62)], 1.4, 0.7));
  // 灯笼
  g.push(propLantern(id, 440, 82) + propLantern(id, 868, 82));
  // 厨房：瓷砖墙 + 挂着的锅铲
  g.push(wash(id, rectD(494, 38, 314, 86), '#efe9dd'));
  for (let x = 494; x < 808; x += 26) g.push(line([P(x, 40), P(x, 120)], 0.8, 0.18));
  for (let y = 46; y < 124; y += 20) g.push(line([P(496, y), P(806, y)], 0.8, 0.18));
  g.push(line([P(500, 46), P(800, 46)], 2.4, 0.75));
  g.push(line([P(516, 46), P(518, 74)], 1.8, 0.8) + wash(id, ellD(518, 80, 8, 6), '#7a7470'));
  g.push(line([P(782, 46), P(782, 64)], 1.8, 0.8) + wash(id, ellD(782, 74, 13, 10), '#4f4945') + line([P(782, 84), P(790, 100)], 2.6, 0.8));
  // 后灶
  g.push(wash(id, rectD(505, 66, 290, 52, 6), '#b9b2a8'));
  for (let i = 0; i < 4; i++) g.push(`<ellipse cx="${548 + i * 70}" cy="110" rx="18" ry="4" fill="#e8823c" opacity="0.45" filter="url(#${id}soft)"/>`);
  g.push(box(505, 66, 290, 52, 2.4, 0.75));
  // 出菜口台面
  g.push(wash(id, rectD(494, 126, 312, 66, 8), '#b98557'));
  g.push(wash(id, rectD(488, 120, 324, 18, 6), '#d9a877'));
  for (const x of [560, 650, 740]) g.push(line([P(x, 142), P(x + 1, 165), P(x, 190)], 1.2, 0.25));
  g.push(box(488, 120, 324, 72, 2.8, 0.85));
  // 菜单木牌（字另画）
  g.push(wash(id, rectD(924, 44, 116, 98, 6), '#3f4a3f'));
  g.push(wash(id, rectD(930, 50, 104, 86, 4), '#4f5a4c'));
  g.push(box(924, 44, 116, 98, 2.6, 0.9) + line([P(950, 36), P(956, 44)], 1.4, 0.7) + line([P(1014, 36), P(1008, 44)], 1.4, 0.7));
  // 洗碗池 + 上方碗架
  g.push(wash(id, rectD(1056, 56, 152, 8, 2), '#8f6444') + line([P(1056, 64), P(1132, 65), P(1208, 64)], 2.2, 0.8));
  for (let i = 0; i < 3; i++) g.push(wash(id, `M ${1070 + i * 10} ${56 - i * 6} q 14 8 28 0 Z`, '#f3efe6') + line(quadPts(P(1070 + i * 10, 56 - i * 6), P(1084 + i * 10, 64 - i * 6), P(1098 + i * 10, 56 - i * 6)), 1.4, 0.7));
  g.push(propSteamer(id, 1170, 56, 1));
  g.push(wash(id, rectD(1046, 118, 158, 76, 8), '#a7b6be'));
  g.push(wash(id, rectD(1062, 128, 126, 26, 10), '#dfe8ec'));
  g.push(`<g filter="url(#${id}wash)">${[0, 1, 2].map((i) => `<circle cx="${1090 + i * 22}" cy="${134 + (i % 2) * 6}" r="${5 + i}" fill="#fff" opacity="0.85"/>`).join('')}</g>`);
  g.push(box(1046, 118, 158, 76, 2.6, 0.85));
  g.push(line([P(1160, 130), P(1172, 104), P(1188, 110)], 2.6, 0.8));
  // 右侧大盆栽
  g.push(propPlant(id, 1226, 470, 1.1, true));
  // 右下：咪咪的猫窝
  g.push(wash(id, ellD(1176, 676, 66, 26), '#c99a62'));
  g.push(wash(id, ellD(1176, 670, 52, 18), '#e9c0b1'));
  g.push(line(sample([segC(P(1110, 676), P(1112, 706), P(1240, 706), P(1242, 676))], 18), 3, 0.85) + line(sample([segC(P(1110, 674), P(1114, 650), P(1238, 650), P(1242, 674))], 18), 1.8, 0.6));
  // 门口（左下）：门框 + 蓝布帘 + 石阶
  g.push(wash(id, rectD(16, 600, 124, 120, 6), '#c9a57c'));
  g.push(wash(id, `M 26 606 h 104 v 46 q -14 8 -26 0 q -13 8 -26 0 q -13 8 -26 0 q -13 8 -26 0 Z`, '#55708f'));
  g.push(box(16, 600, 124, 130, 3, 0.85));
  g.push(wash(id, ellD(78, 712, 70, 12), '#b9b3a8') + line(quadPts(P(10, 712), P(78, 728), P(146, 712)), 2, 0.6));
  g.push(propPlant(id, 172, 704, 1));
  // 底部花箱（前景）
  for (const [x0, w0] of [[300, 250], [700, 250]]) {
    g.push(`<g filter="url(#${id}wash)">${Array.from({ length: 11 }, (_, i) => `<ellipse cx="${x0 + 14 + i * 22}" cy="${690 - (i % 3) * 5}" rx="13" ry="10" fill="${i % 2 ? '#86a874' : '#7a9c68'}"/>`).join('')}${Array.from({ length: 6 }, (_, i) => `<circle cx="${x0 + 26 + i * 40}" cy="${682 - (i % 2) * 6}" r="5" fill="${['#e8a5a0', '#f2d06e', '#f3eee4'][i % 3]}"/>`).join('')}</g>`);
    g.push(wash(id, rectD(x0, 694, w0, 30, 4), '#a8744b') + box(x0, 694, w0, 30, 2.4, 0.85));
  }
  // 纸纹
  g.push(`<rect x="0" y="0" width="1280" height="720" filter="url(#${id}grain)"/>`);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720" width="1280" height="720">${g[0]}<g filter="url(#${id}ink)">${g.slice(1).join('')}</g></svg>`;
}

// 店里的手写字：位置和内容（游戏画布用「站酷快乐体」画，带描边）
const ROOM_LABELS = [
  { t: '盆盆餐厅', x: 270, y: 86, size: 30, fill: '#fbf3e2', stroke: '#4a3326', lw: 6 },
  { t: '福', x: 208, y: 125, size: 11, fill: '#8a3a2c' }, { t: '福', x: 252, y: 124, size: 13, fill: '#8a3a2c' }, { t: '福', x: 300, y: 125, size: 11, fill: '#8a3a2c' },
  { t: '出菜口', x: 650, y: 176, size: 20, fill: '#fbf3e2', stroke: '#5a3b28', lw: 4 },
  { t: '洗碗池', x: 1125, y: 180, size: 20, fill: '#fbf3e2', stroke: '#4a5560', lw: 4 },
  { t: '今日菜单', x: 982, y: 68, size: 17, fill: '#f3eedd' },
  { t: '盆', x: 78, y: 630, size: 26, fill: '#f3ead9' },
];

// ---------- 桌子 viewBox 320×200，桌面中心在 (160, 90)；2 人桌左右两个凳子，4 人桌再加后面两个 ----------
function tableSVG(seats = 2) {
  const id = 't' + (++_sid);
  const big = seats >= 4, rx = big ? 96 : 76, ry = big ? 48 : 40, cx = 160, cy = 90;
  const g = [`<defs>${sceneDefs(id, 320, 200)}</defs>`];
  const stool = (x, y) => wash(id, rectD(x - 20, y - 22, 40, 44, 10), '#a8744b') + box(x - 20, y - 22, 40, 44, 2.2, 0.8);
  g.push(`<ellipse cx="${cx}" cy="${cy + 54}" rx="${rx + 10}" ry="18" fill="${INK}" opacity="0.13" filter="url(#${id}soft)"/>`);
  if (big) g.push(stool(cx - 46, cy - 46) + stool(cx + 46, cy - 46));
  g.push(stool(cx - rx - 26, cy + 6) + stool(cx + rx + 26, cy + 6));
  g.push(wash(id, rectD(cx - 10, cy + 6, 20, 44, 4), '#9c6a43') + line([P(cx - 9, cy + 10), P(cx - 10, cy + 50)], 2, 0.7) + line([P(cx + 10, cy + 10), P(cx + 11, cy + 50)], 2.6, 0.8));
  g.push(wash(id, ellD(cx, cy + 50, 30, 7), '#9c6a43'));
  g.push(wash(id, ellD(cx, cy, rx, ry), '#d9a870'));
  g.push(`<ellipse cx="${cx - 14}" cy="${cy - 10}" rx="${rx * 0.58}" ry="${ry * 0.4}" fill="#fff" opacity="0.22" filter="url(#${id}soft)"/>`);
  g.push(line(quadPts(P(cx - rx * 0.66, cy - 12), P(cx, cy - 20), P(cx + rx * 0.6, cy - 8), 16), 1.1, 0.2) + line(quadPts(P(cx - rx * 0.5, cy + 8), P(cx, cy + 14), P(cx + rx * 0.5, cy + 6), 16), 1.1, 0.18));
  g.push(line(sample([segC(P(cx - rx, cy + 2), P(cx - rx, cy - ry * 1.2), P(cx + rx, cy - ry * 1.2), P(cx + rx, cy))], 24), 2.4, 0.7, { bias: 0.6 }));
  g.push(line(sample([segC(P(cx + rx, cy - 2), P(cx + rx + 2, cy + ry * 1.2), P(cx - rx, cy + ry * 1.2), P(cx - rx, cy + 4))], 24), 3.6, 0.85, { bias: 0.4 }));
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 200" width="640" height="400">${g[0]}<g filter="url(#${id}ink)">${g.slice(1).join('')}</g></svg>`;
}

// ---------- 菜品 viewBox 120×80 ----------
function dishSVG(key) {
  const id = 'd' + (++_sid);
  const g = [`<defs>${sceneDefs(id, 120, 80)}</defs>`];
  g.push(`<ellipse cx="60" cy="66" rx="44" ry="8" fill="${INK}" opacity="0.12" filter="url(#${id}soft)"/>`);
  const bowl = (col, rim) => wash(id, `M 18 40 Q 20 70 60 70 Q 100 70 102 40 Z`, col) + wash(id, ellD(60, 40, 42, 12), rim)
    + line(sample([segQ(P(18, 41), P(22, 72), P(60, 71)), segQ(P(60, 71), P(98, 72), P(102, 41))], 12), 2.8, 0.85, { bias: 0.6 });
  const plate = () => wash(id, ellD(60, 56, 50, 14), '#f4f0e8') + line(sample([segC(P(10, 57), P(12, 76), P(108, 76), P(110, 56))], 20), 2.4, 0.8, { bias: 0.6 }) + line(sample([segC(P(110, 55), P(108, 40), P(12, 40), P(10, 55))], 20), 1.2, 0.5);
  if (key === 'mapo') {
    g.push(bowl('#f3eee6', '#c9452f'));
    g.push(`<g filter="url(#${id}wash)">${[[44, 36], [58, 40], [72, 35], [52, 44], [68, 45], [80, 41]].map(([x, y]) => `<rect x="${x - 6}" y="${y - 5}" width="12" height="10" rx="2" fill="#f6ead2"/>`).join('')}${[[40, 42], [62, 34], [84, 44], [50, 38]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.4" fill="#6f9a4e"/>`).join('')}</g>`);
    g.push(lineQ(P(26, 40), P(60, 25), P(94, 39), 1.6, 0.5));
  } else if (key === 'mian') {
    g.push(bowl('#f3eee6', '#c78d42'));
    g.push(`<g filter="url(#${id}wash)"><path d="M 26 40 q 10 -6 20 0 q 10 6 20 0 q 10 -6 20 0 q 6 4 10 2" stroke="#f3dca4" stroke-width="5" fill="none"/><ellipse cx="70" cy="36" rx="12" ry="5" fill="#8a5038"/><ellipse cx="52" cy="38" rx="11" ry="4.5" fill="#94573c"/>${[[42, 33], [82, 36], [62, 31]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3" fill="#6f9a4e"/>`).join('')}<circle cx="88" cy="42" r="3" fill="#c9452f"/></g>`);
    g.push(line([P(34, 30), P(60, 4), P(66, 2)], 1.6, 0.7) + line([P(42, 31), P(70, 6), P(76, 5)], 1.6, 0.7));
    g.push(lineQ(P(26, 40), P(60, 25), P(94, 39), 1.4, 0.45));
  } else if (key === 'chashao') {
    g.push(plate());
    g.push(`<g filter="url(#${id}wash)"><ellipse cx="46" cy="50" rx="24" ry="14" fill="#fbf8f2"/>${[0, 1, 2].map((i) => `<rect x="${58 + i * 12}" y="${40 + i * 2}" width="14" height="20" rx="4" transform="rotate(${-14 + i * 6} ${65 + i * 12} 50)" fill="#b94a3a"/>`).join('')}<ellipse cx="36" cy="60" rx="12" ry="5" fill="#6f9a4e"/></g>`);
    g.push(lineQ(P(26, 46), P(46, 32), P(68, 44), 1.6, 0.55));
  } else if (key === 'gongbao') {
    g.push(plate());
    g.push(`<g filter="url(#${id}wash)">${[[40, 52], [54, 46], [68, 50], [82, 47], [50, 58], [74, 58], [62, 42]].map(([x, y]) => `<rect x="${x - 6}" y="${y - 5}" width="12" height="10" rx="3" fill="#d9a06a"/>`).join('')}${[[46, 46], [60, 54], [78, 54], [88, 52], [66, 46]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="4" ry="3" fill="#c98a52"/>`).join('')}${[[44, 56], [70, 44], [84, 56]].map(([x, y]) => `<rect x="${x - 2}" y="${y - 5}" width="4" height="10" rx="2" fill="#c4392d" transform="rotate(30 ${x} ${y})"/>`).join('')}${[[56, 50], [80, 44]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.6" fill="#6f9a4e"/>`).join('')}</g>`);
    g.push(lineQ(P(28, 50), P(60, 36), P(94, 50), 1.4, 0.45));
  } else if (key === 'dandan') {
    g.push(bowl('#f3eee6', '#c74a32'));
    g.push(`<g filter="url(#${id}wash)"><path d="M 28 40 q 10 -6 20 0 q 10 6 20 0 q 10 -6 20 0" stroke="#efd9a3" stroke-width="5" fill="none"/><ellipse cx="60" cy="34" rx="12" ry="5" fill="#8a5038"/>${[[46, 36], [72, 37], [58, 30]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.6" fill="#d6a56a"/>`).join('')}<ellipse cx="80" cy="40" rx="8" ry="4" fill="#6f9a4e"/></g>`);
    g.push(line([P(36, 30), P(64, 4), P(70, 2)], 1.6, 0.7) + line([P(44, 31), P(74, 6), P(80, 5)], 1.6, 0.7));
    g.push(lineQ(P(26, 40), P(60, 25), P(94, 39), 1.4, 0.45));
  } else if (key === 'xiajiao') {
    g.push(wash(id, ellD(60, 54, 44, 14), '#d9b77a') + wash(id, `M 16 54 Q 18 70 60 70 Q 102 70 104 54 Z`, '#cfa86a'));
    g.push(line(sample([segQ(P(16, 55), P(18, 72), P(60, 71)), segQ(P(60, 71), P(102, 72), P(104, 55))], 10), 2.6, 0.85) + line([P(18, 62), P(60, 64), P(102, 62)], 1, 0.4));
    g.push(`<g filter="url(#${id}wash)">${[[40, 48], [60, 44], [80, 48], [50, 56], [70, 56]].map(([x, y]) => `<path d="M ${x - 12} ${y + 4} Q ${x - 10} ${y - 12} ${x} ${y - 10} Q ${x + 10} ${y - 12} ${x + 12} ${y + 4} Z" fill="#f8efe8"/><ellipse cx="${x}" cy="${y - 3}" rx="6" ry="4" fill="#f1b8a6" opacity="0.7"/>`).join('')}</g>`);
    g.push([[40, 48], [60, 44], [80, 48], [50, 56], [70, 56]].map(([x, y]) => line(sample([segQ(P(x - 12, y + 4), P(x - 10, y - 12), P(x, y - 10)), segQ(P(x, y - 10), P(x + 10, y - 12), P(x + 12, y + 4))], 8), 1.2, 0.6)).join(''));
  } else if (key === 'baozai') {
    g.push(wash(id, `M 22 40 Q 22 70 60 70 Q 98 70 98 40 Z`, '#6e4a36') + wash(id, ellD(60, 40, 38, 11), '#f6efe2'));
    g.push(`<g filter="url(#${id}wash)">${[[46, 38], [60, 36], [74, 39]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="7" ry="4" fill="#b9473a"/>`).join('')}<ellipse cx="62" cy="42" rx="9" ry="5" fill="#fbf6ea"/><ellipse cx="62" cy="42" rx="4" ry="3" fill="#f1c24e"/><ellipse cx="82" cy="44" rx="7" ry="4" fill="#6f9a4e"/></g>`);
    g.push(line(sample([segQ(P(22, 41), P(22, 72), P(60, 71)), segQ(P(60, 71), P(98, 72), P(98, 41))], 10), 2.8, 0.85, { bias: 0.6 }) + line([P(98, 46), P(112, 44), P(114, 50)], 2.4, 0.8));
  } else if (key === 'shuizhu') { // 水煮鱼：红油大碗 + 鱼片 + 干辣椒
    g.push(bowl('#f3eee6', '#c9452f'));
    g.push(`<g filter="url(#${id}wash)">${[[42, 37], [58, 34], [74, 37], [50, 42], [68, 42]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="9" ry="4.5" fill="#f6ead8"/>`).join('')}${[[36, 40], [62, 39], [84, 41], [48, 33], [78, 33]].map(([x, y]) => `<rect x="${x - 2}" y="${y - 5}" width="4" height="10" rx="2" fill="#9a2a20" transform="rotate(40 ${x} ${y})"/>`).join('')}${[[54, 38], [70, 34]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.6" fill="#6f9a4e"/>`).join('')}</g>`);
    g.push(lineQ(P(26, 40), P(60, 25), P(94, 39), 1.4, 0.45));
  } else if (key === 'qingzheng') { // 清蒸鱼：长盘 + 整条鱼 + 葱丝
    g.push(wash(id, ellD(60, 56, 52, 13), '#f4f0e8') + line(sample([segC(P(8, 57), P(10, 74), P(110, 74), P(112, 56))], 20), 2.4, 0.8, { bias: 0.6 }));
    g.push(`<g filter="url(#${id}wash)"><path d="M 22 52 Q 50 36 86 50 Q 50 64 22 52 Z" fill="#c9c2b0"/><path d="M 86 50 l 14 -9 q -3 9 0 18 Z" fill="#b8b09c"/><ellipse cx="54" cy="56" rx="34" ry="5" fill="#d9a441" opacity="0.5"/></g>`);
    g.push(`<path d="M 36 46 q 14 -4 30 2 M 40 50 q 12 -3 26 1" stroke="#6f9a4e" stroke-width="1.6" fill="none"/><path d="M 44 44 q 10 2 18 -1" stroke="#f3dca4" stroke-width="1.6" fill="none"/><circle cx="28" cy="50" r="1.8" fill="${INK}"/>`);
    g.push(line(sample([segQ(P(22, 52), P(50, 36), P(86, 50))], 10), 1.6, 0.7));
  } else if (key === 'water') {
    g.push(wash(id, `M 44 22 L 48 66 Q 60 70 72 66 L 76 22 Z`, '#dbe9ef', 0.8) + wash(id, `M 46 38 L 48 64 Q 60 68 72 64 L 74 38 Z`, '#b8d4e2', 0.8));
    g.push(line([P(44, 22), P(46, 44), P(48, 66)], 2, 0.75) + line([P(76, 22), P(74, 44), P(72, 66)], 2.4, 0.8) + line(sample([segQ(P(44, 22), P(60, 18), P(76, 22))], 8), 1.4, 0.6) + line(sample([segQ(P(48, 66), P(60, 71), P(72, 66))], 8), 1.6, 0.7));
  } else if (key === 'tea') {
    g.push(wash(id, ellD(60, 60, 30, 8), '#f4f0e8') + line(sample([segQ(P(30, 60), P(60, 72), P(90, 60))], 10), 2, 0.75));
    g.push(wash(id, `M 40 34 Q 42 60 60 60 Q 78 60 80 34 Z`, '#f3efe6') + wash(id, ellD(60, 34, 20, 6), '#c9a25a'));
    g.push(line(sample([segQ(P(40, 35), P(42, 62), P(60, 61)), segQ(P(60, 61), P(78, 62), P(80, 35))], 10), 2.6, 0.85, { bias: 0.6 }) + line(sample([segQ(P(40, 34), P(60, 26), P(80, 34))], 10), 1.4, 0.6));
    g.push(`<g filter="url(#${id}wash)"><path d="M 52 50 q 8 -6 16 0" stroke="#7c9a6a" stroke-width="3" fill="none"/></g>`);
    g.push(line([P(54, 22), P(50, 12), P(55, 2)], 1.3, 0.35) + line([P(66, 22), P(70, 12), P(65, 2)], 1.3, 0.35));
  } else if (key === 'snack') {
    g.push(plate());
    g.push(`<g filter="url(#${id}wash)">${[[42, 50], [64, 46], [84, 52]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="13" ry="8" fill="#e9b75c"/><ellipse cx="${x}" cy="${y - 2}" rx="8" ry="4.5" fill="#f6d77e"/>`).join('')}<circle cx="64" cy="40" r="2" fill="#c4523f"/></g>`);
    g.push([[42, 50], [64, 46], [84, 52]].map(([x, y]) => line(sample([segQ(P(x - 13, y), P(x, y + 12), P(x + 13, y))], 8), 1.6, 0.7)).join(''));
  } else if (key === 'dirty') {
    g.push(plate());
    g.push(`<path d="M 40 54 q 12 -8 26 -2 q 10 6 -4 8 q -14 2 -22 -6" fill="#b98a5c" opacity="0.5" filter="url(#${id}wash)"/>`);
    g.push(line([P(70, 46), P(92, 40), P(100, 38)], 1.6, 0.6));
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 80" width="240" height="160">${g[0]}<g filter="url(#${id}ink)">${g.slice(1).join('')}</g></svg>`;
}

// ---------- 茶点车 viewBox 160×120：左边茶壶，右边点心罩 ----------
function teaCartSVG(hasTea, hasSnack) {
  const id = 'k' + (++_sid);
  const g = [`<defs>${sceneDefs(id, 160, 120)}</defs>`];
  g.push(`<ellipse cx="80" cy="112" rx="70" ry="7" fill="${INK}" opacity="0.12" filter="url(#${id}soft)"/>`);
  g.push(wash(id, rectD(14, 60, 132, 40, 6), '#a8744b') + wash(id, rectD(8, 52, 144, 12, 4), '#c99a62'));
  g.push(box(8, 52, 144, 48, 2.4, 0.85));
  g.push(wash(id, ellD(30, 104, 9, 9), '#6e5038') + wash(id, ellD(130, 104, 9, 9), '#6e5038') + line(sample([segQ(P(21, 104), P(30, 116), P(39, 104))], 8), 1.8, 0.7) + line(sample([segQ(P(121, 104), P(130, 116), P(139, 104))], 8), 1.8, 0.7));
  if (hasTea) {
    g.push(wash(id, `M 26 50 Q 26 22 46 22 Q 66 22 66 50 Z`, '#e8e2d6') + wash(id, ellD(46, 20, 7, 4), '#c9a25a'));
    g.push(line(sample([segQ(P(26, 50), P(24, 22), P(46, 21)), segQ(P(46, 21), P(68, 22), P(66, 50))], 10), 2.4, 0.85));
    g.push(line(sample([segQ(P(66, 34), P(80, 30), P(78, 22))], 8), 2.2, 0.8) + line(sample([segQ(P(26, 30), P(16, 34), P(22, 44))], 8), 2, 0.75));
    g.push(`<g filter="url(#${id}wash)"><path d="M 36 38 q 10 -8 20 0" stroke="#7c9a6a" stroke-width="3" fill="none"/></g>`);
    for (const x of [62, 78]) g.push(wash(id, `M ${x - 7} 52 l 2 -9 h 10 l 2 9 Z`, '#f3efe6') + line([P(x - 7, 52), P(x - 5, 43), P(x + 5, 43), P(x + 7, 52)], 1.4, 0.7));
  }
  if (hasSnack) {
    g.push(wash(id, ellD(118, 50, 26, 5), '#f4f0e8'));
    g.push(`<g filter="url(#${id}wash)">${[[106, 44], [120, 42], [132, 45], [113, 36], [126, 35]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="8" ry="5" fill="#e9b75c"/><ellipse cx="${x}" cy="${y - 1.5}" rx="5" ry="3" fill="#f6d77e"/>`).join('')}</g>`);
    g.push(`<path d="M 92 50 Q 92 14 118 14 Q 144 14 144 50" fill="#ffffff" opacity="0.28"/>` + line(sample([segQ(P(92, 50), P(91, 14), P(118, 13)), segQ(P(118, 13), P(145, 14), P(144, 50))], 12), 1.8, 0.6) + line([P(116, 13), P(118, 6), P(120, 13)], 2.2, 0.8));
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 120" width="320" height="240">${g[0]}<g filter="url(#${id}ink)">${g.slice(1).join('')}</g></svg>`;
}

if (typeof module !== 'undefined') module.exports = { roomSVG, tableSVG, dishSVG, teaCartSVG, ROOM_LABELS };
