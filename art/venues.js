// 盆盆餐厅 · 新版餐厅概念图：正前方整面窗、左边厨房、右边入口；两种店型（小院 / 列车）
// 依赖 cats.js + scene.js 的画笔工具

// ---------- 家具（参考猫咪和汤：矮、厚、圆，木头和布）----------
function lowRoundTable(id, cx, cy, r = 70) { // 矮圆桌：厚桌面 + 三条短腿
  const ry = r * 0.42;
  return `<ellipse cx="${cx}" cy="${cy + 40}" rx="${r * 0.95}" ry="${ry * 0.6}" fill="${INK}" opacity="0.14" filter="url(#${id}soft)"/>`
    + [[-0.55, 1], [0.55, 1], [0, 1.25]].map(([k, d]) => wash(id, rectD(cx + k * r - 7, cy + ry * 0.4, 14, 26 * d, 4), '#7a5236')).join('')
    + wash(id, ellD(cx, cy + 10, r, ry), '#8f5f3f') + wash(id, ellD(cx, cy, r, ry), '#c99560')
    + `<ellipse cx="${cx}" cy="${cy}" rx="${r * 0.7}" ry="${ry * 0.7}" fill="none" stroke="#a8744b" stroke-width="1.4" opacity="0.5"/><ellipse cx="${cx - r * 0.3}" cy="${cy - ry * 0.35}" rx="${r * 0.35}" ry="${ry * 0.25}" fill="#fff" opacity="0.2" filter="url(#${id}soft)"/>`
    + line(sample([segC(P(cx - r, cy), P(cx - r, cy + ry * 1.33), P(cx + r, cy + ry * 1.33), P(cx + r, cy))], 24), 2.6, 0.85, { bias: 0.6 })
    + line(sample([segC(P(cx - r, cy + 10), P(cx - r, cy + 10 + ry * 1.33), P(cx + r, cy + 10 + ry * 1.33), P(cx + r, cy + 10))], 24), 1.6, 0.6)
    + line(sample([segC(P(cx + r, cy), P(cx + r, cy - ry * 1.33), P(cx - r, cy - ry * 1.33), P(cx - r, cy))], 24), 1.4, 0.5);
}
function cushion(id, cx, cy, col, k = 1) { // 方坐垫 + 四角流苏
  const w = 34 * k, h = 14 * k;
  return `<ellipse cx="${cx}" cy="${cy + h}" rx="${w}" ry="${h * 0.6}" fill="${INK}" opacity="0.12" filter="url(#${id}soft)"/>`
    + wash(id, `M ${cx - w} ${cy} q 0 ${-h} ${w} ${-h} q ${w} 0 ${w} ${h} q 0 ${h} ${-w} ${h} q ${-w} 0 ${-w} ${-h} Z`, col)
    + `<path d="M ${cx - w * 0.6} ${cy} h ${w * 1.2}" stroke="#fff" stroke-width="1.2" stroke-dasharray="4 3" opacity="0.5"/>`
    + [[-1, -0.6], [1, -0.6], [-1, 0.6], [1, 0.6]].map(([a, b]) => `<circle cx="${cx + a * w * 0.95}" cy="${cy + b * h}" r="2.6" fill="#e9c96f"/>`).join('')
    + line(sample([segQ(P(cx - w, cy), P(cx - w, cy + h * 1.1), P(cx, cy + h)), segQ(P(cx, cy + h), P(cx + w, cy + h * 1.1), P(cx + w, cy))], 10), 1.8, 0.75);
}
function stump(id, cx, cy, k = 1) { // 树桩凳
  const r = 22 * k;
  return `<ellipse cx="${cx}" cy="${cy + 30 * k}" rx="${r * 1.1}" ry="${r * 0.35}" fill="${INK}" opacity="0.13" filter="url(#${id}soft)"/>`
    + wash(id, `M ${cx - r} ${cy} v ${26 * k} q ${r} ${10 * k} ${2 * r} 0 v ${-26 * k} Z`, '#8a6142') + wash(id, ellD(cx, cy, r, r * 0.38), '#d9b483')
    + `<ellipse cx="${cx}" cy="${cy}" rx="${r * 0.6}" ry="${r * 0.22}" fill="none" stroke="#a8744b" stroke-width="1.2" opacity="0.6"/>`
    + line([P(cx - r * 0.5, cy + 6 * k), P(cx - r * 0.45, cy + 26 * k)], 1, 0.4) + line([P(cx + r * 0.3, cy + 6 * k), P(cx + r * 0.35, cy + 28 * k)], 1, 0.4)
    + line(sample([segQ(P(cx - r, cy), P(cx, cy + r * 0.5), P(cx + r, cy))], 8), 1.8, 0.8) + line([P(cx + r, cy), P(cx + r, cy + 26 * k)], 2, 0.8);
}
function teaSet(id, cx, cy) { // 桌上的小茶壶 + 两只杯子 + 小花
  return wash(id, `M ${cx - 12} ${cy} q -2 -16 12 -16 q 14 0 12 16 Z`, '#e9e1d2') + wash(id, ellD(cx, cy - 16, 6, 2.4), '#c9b79a') + `<path d="M ${cx + 12} ${cy - 10} q 8 -2 8 -8" stroke="#c9b79a" stroke-width="3" fill="none"/>`
    + wash(id, rectD(cx + 22, cy - 8, 9, 8, 2), '#e9e1d2') + wash(id, rectD(cx - 32, cy - 6, 9, 8, 2), '#e9e1d2')
    + line(sample([segQ(P(cx - 12, cy), P(cx - 13, cy - 16), P(cx, cy - 16))], 8), 1.2, 0.7);
}
function armChair(id, cx, cy, col, face = 1) { // 列车软座椅（侧面）
  return `<ellipse cx="${cx}" cy="${cy + 30}" rx="30" ry="8" fill="${INK}" opacity="0.13" filter="url(#${id}soft)"/>`
    + wash(id, rectD(cx - 26, cy - 4, 52, 26, 8), col) + wash(id, rectD(cx + (face > 0 ? -30 : 16), cy - 48, 14, 70, 7), col)
    + wash(id, rectD(cx - 22, cy - 10, 44, 12, 6), mix(col, '#ffffff', 0.18)) + line([P(cx - 20, cy + 22), P(cx - 20, cy + 32)], 2, 0.8) + line([P(cx + 20, cy + 22), P(cx + 20, cy + 32)], 2, 0.8)
    + box(cx - 26, cy - 4, 52, 26, 1.8, 0.8);
}
function clothTable(id, cx, cy, w = 96) { // 列车小方桌：白桌布 + 台灯 + 小花瓶
  return `<ellipse cx="${cx}" cy="${cy + 56}" rx="${w * 0.6}" ry="10" fill="${INK}" opacity="0.14" filter="url(#${id}soft)"/>`
    + wash(id, rectD(cx - 5, cy + 10, 10, 44, 3), '#6e4a32') + wash(id, `M ${cx - w / 2} ${cy - 16} h ${w} l 6 24 h ${-w - 12} Z`, '#f6f1e6')
    + `<path d="M ${cx - w / 2 - 6} ${cy + 8} q ${w * 0.25} 8 ${w * 0.5} 0 q ${w * 0.25} 8 ${w * 0.5 + 12} 0" stroke="#d9cdb2" stroke-width="2" fill="none"/>`
    + line([P(cx - w / 2, cy - 16), P(cx + w / 2, cy - 16)], 1.6, 0.7) + line([P(cx - w / 2 - 6, cy + 8), P(cx + w / 2 + 6, cy + 8)], 2, 0.8)
    + wash(id, rectD(cx + 18, cy - 30, 4, 16, 1), '#b48a3c') + wash(id, `M ${cx + 10} ${cy - 30} h 20 l -4 -12 h -12 Z`, '#e9b66a') + `<ellipse cx="${cx + 20}" cy="${cy - 24}" rx="16" ry="8" fill="#ffd89a" opacity="0.35" filter="url(#${id}soft)"/>`
    + wash(id, `M ${cx - 24} ${cy - 16} q -4 -10 2 -14 h 6 q 6 4 2 14 Z`, '#9cc0cc') + `<circle cx="${cx - 21}" cy="${cy - 36}" r="4" fill="#efb6c0"/>` + line([P(cx - 21, cy - 30), P(cx - 21, cy - 34)], 1, 0.7);
}

// ---------- 窗外 ----------
function viewCourtyard(id, x, y, w, h, se = 'autumn') { // 小院：白墙黛瓦 + 桂花树 + 竹 + 石灯笼 + 水缸 + 远山
  const tree = { spring: '#f2c6d0', summer: '#7f9a6c', autumn: '#e0b040', winter: '#e8eded' }[se];
  return `<g clip-path="url(#${id}win)">`
    + `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${se === 'winter' ? '#cfdbe3' : '#d6e6ee'}"/>`
    + wash(id, `M ${x} ${y + h * 0.42} L ${x + w * 0.15} ${y + h * 0.18} L ${x + w * 0.3} ${y + h * 0.34} L ${x + w * 0.5} ${y + h * 0.1} L ${x + w * 0.7} ${y + h * 0.3} L ${x + w * 0.85} ${y + h * 0.16} L ${x + w} ${y + h * 0.32} V ${y + h * 0.6} H ${x} Z`, '#a7b3c6')
    + wash(id, `M ${x + w * 0.42} ${y + h * 0.17} L ${x + w * 0.5} ${y + h * 0.1} L ${x + w * 0.58} ${y + h * 0.17} Z M ${x + w * 0.79} ${y + h * 0.21} L ${x + w * 0.85} ${y + h * 0.16} L ${x + w * 0.91} ${y + h * 0.21} Z`, '#fbfbf8')
    + wash(id, rectD(x, y + h * 0.46, w, h * 0.34), '#f2efe8') + wash(id, rectD(x - 10, y + h * 0.42, w + 20, h * 0.07), '#4a4a4f')
    + Array.from({ length: Math.floor(w / 26) }, (_, i) => `<circle cx="${x + 13 + i * 26}" cy="${y + h * 0.495}" r="5" fill="#5a5a60"/>`).join('')
    + wash(id, rectD(x, y + h * 0.78, w, h * 0.22), '#cbbfa6') + `<g filter="url(#${id}wash)">${Array.from({ length: 24 }, (_, i) => `<ellipse cx="${x + (i * 61) % w}" cy="${y + h * 0.84 + (i % 3) * 10}" rx="9" ry="4" fill="#b9ad94"/>`).join('')}</g>`
    + line([P(x + w * 0.2, y + h * 0.86), P(x + w * 0.21, y + h * 0.42)], 6, 0.85) + line(quadPts(P(x + w * 0.205, y + h * 0.55), P(x + w * 0.26, y + h * 0.45), P(x + w * 0.3, y + h * 0.4)), 3, 0.8)
    + `<g filter="url(#${id}wash)">${[[0.12, 0.38, 60], [0.22, 0.28, 74], [0.3, 0.4, 56], [0.18, 0.47, 50]].map(([a, b, r]) => `<ellipse cx="${x + w * a}" cy="${y + h * b}" rx="${r}" ry="${r * 0.7}" fill="${tree}" opacity="0.92"/>`).join('')}</g>`
    + (se === 'autumn' ? `<g fill="#f2c94e">${Array.from({ length: 30 }, (_, i) => `<circle cx="${x + w * 0.1 + (i * 37) % (w * 0.24)}" cy="${y + h * 0.26 + (i * 23) % (h * 0.24)}" r="2.2"/>`).join('')}</g>` : '')
    + Array.from({ length: 6 }, (_, i) => line([P(x + w * 0.8 + i * 14, y + h * 0.86), P(x + w * 0.8 + i * 14 + 3, y + h * (0.2 + (i % 3) * 0.05))], 3.4, 0.7) + `<ellipse cx="${x + w * 0.8 + i * 14 + 10}" cy="${y + h * (0.3 + (i % 2) * 0.1)}" rx="12" ry="3" fill="#7f9a6c" transform="rotate(-25 ${x + w * 0.8 + i * 14 + 10} ${y + h * (0.3 + (i % 2) * 0.1)})"/>`).join('')
    + wash(id, rectD(x + w * 0.52, y + h * 0.62, 22, 46, 3), '#a39a8c') + wash(id, `M ${x + w * 0.52 - 14} ${y + h * 0.62} l ${25} -16 l 25 16 Z`, '#8e8780') + wash(id, rectD(x + w * 0.52 + 5, y + h * 0.66, 12, 10, 2), '#ffe2a8')
    + wash(id, `M ${x + w * 0.64} ${y + h * 0.9} q -6 -30 4 -40 h 56 q 10 10 4 40 Z`, '#6e5a48') + wash(id, ellD(x + w * 0.64 + 32, y + h * 0.69, 30, 7), '#7fa8b4') + `<ellipse cx="${x + w * 0.64 + 22}" cy="${y + h * 0.68}" rx="10" ry="3.5" fill="#6f9a5c"/><circle cx="${x + w * 0.64 + 40}" cy="${y + h * 0.66}" r="4" fill="#efb6c0"/>`
    + `</g>`;
}
function viewTrain(id, x, y, w, h, scene = 'snowpeak') { // 列车：雪山湖泊 + 电线杆（游戏里分三层视差滚动）
  return `<g clip-path="url(#${id}win)">`
    + `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#bcd6ea"/>`
    + `<ellipse cx="${x + w * 0.3}" cy="${y + h * 0.15}" rx="${w * 0.12}" ry="${h * 0.04}" fill="#fff" opacity="0.8" filter="url(#${id}soft)"/>`
    + wash(id, `M ${x} ${y + h * 0.55} L ${x + w * 0.08} ${y + h * 0.3} L ${x + w * 0.16} ${y + h * 0.42} L ${x + w * 0.28} ${y + h * 0.16} L ${x + w * 0.38} ${y + h * 0.36} L ${x + w * 0.5} ${y + h * 0.2} L ${x + w * 0.62} ${y + h * 0.4} L ${x + w * 0.74} ${y + h * 0.14} L ${x + w * 0.88} ${y + h * 0.38} L ${x + w} ${y + h * 0.26} V ${y + h * 0.6} H ${x} Z`, '#8a98b0')
    + [[0.28, 0.16], [0.5, 0.2], [0.74, 0.14], [0.08, 0.3]].map(([a, b]) => wash(id, `M ${x + w * a - 30} ${y + h * b + 26} L ${x + w * a} ${y + h * b} L ${x + w * a + 30} ${y + h * b + 26} q -8 -6 -15 2 q -8 -8 -15 -2 q -8 -6 -15 2 q -8 -8 -15 -2 Z`, '#fbfbf8')).join('')
    + Array.from({ length: Math.floor(w / 22) }, (_, i) => `<path d="M ${x + 6 + i * 22} ${y + h * 0.62} l 8 -${22 + (i % 3) * 8} l 8 ${22 + (i % 3) * 8} Z" fill="#4f6b52" filter="url(#${id}wash)"/>`).join('')
    + wash(id, rectD(x, y + h * 0.62, w, h * 0.2), '#7f9fb8') + `<g stroke="#fff" stroke-width="1.6" opacity="0.6">${[0, 1, 2, 3, 4].map((i) => `<line x1="${x + 30 + i * w * 0.2}" y1="${y + h * (0.66 + (i % 2) * 0.06)}" x2="${x + 80 + i * w * 0.2}" y2="${y + h * (0.66 + (i % 2) * 0.06)}"/>`).join('')}</g>`
    + wash(id, rectD(x, y + h * 0.82, w, h * 0.18), '#b7b58a')
    + `<g stroke="#e9eef2" stroke-width="2.4" opacity="0.55">${[0, 1, 2, 3, 4, 5].map((i) => `<line x1="${x + i * w * 0.19}" y1="${y + h * 0.9}" x2="${x + i * w * 0.19 + 70}" y2="${y + h * 0.9}"/>`).join('')}</g>`
    + [0.18, 0.62].map((a) => line([P(x + w * a, y + h), P(x + w * a + 4, y + h * 0.2)], 5, 0.85) + line([P(x + w * a - 16, y + h * 0.26), P(x + w * a + 22, y + h * 0.26)], 2.4, 0.8)).join('')
    + `<path d="M ${x} ${y + h * 0.3} Q ${x + w * 0.4} ${y + h * 0.36} ${x + w} ${y + h * 0.28}" stroke="${INK}" stroke-width="1.2" fill="none" opacity="0.5"/>`
    + `</g>`;
}

// ---------- 店型一：小院食堂 ----------
function venueCourtyardSVG(se = 'autumn') {
  const id = 'V' + (++_sid), g = [];
  const winX = 360, winY = 36, winW = 780, winH = 210;
  const defs = `${sceneDefs(id)}<clipPath id="${id}win"><rect x="${winX}" y="${winY}" width="${winW}" height="${winH}"/></clipPath>
    <radialGradient id="${id}glow"><stop offset="0" stop-color="#ffd89a" stop-opacity="0.55"/><stop offset="1" stop-color="#ffd89a" stop-opacity="0"/></radialGradient>
    <linearGradient id="${id}sun" x1="0" y1="0" x2="0.4" y2="1"><stop offset="0" stop-color="#fff3d0" stop-opacity="0.45"/><stop offset="1" stop-color="#fff3d0" stop-opacity="0"/></linearGradient>`;
  // 墙 + 梁
  g.push(`<rect width="1280" height="280" fill="#efe2c8"/>`);
  g.push(wash(id, rectD(-10, -6, 1300, 30), '#6e4c36'));
  for (let x = 20; x < 1280; x += 64) g.push(wash(id, rectD(x, 6, 14, 12, 2), '#8f6a4c'));
  // 正前方整面窗：外景 + 格栅窗框（上部冰裂纹，下部推拉门）
  g.push(viewCourtyard(id, winX, winY, winW, winH, se));
  for (let i = 0; i <= 6; i++) { const x = winX + (winW / 6) * i; g.push(wash(id, rectD(x - 5, winY, 10, winH), '#7b5539')); }
  g.push(wash(id, rectD(winX - 10, winY - 10, winW + 20, 14), '#7b5539') + wash(id, rectD(winX - 14, winY + winH - 4, winW + 28, 20, 3), '#8f6444'));
  for (let i = 0; i < 6; i++) { const x0 = winX + (winW / 6) * i + 5, x1 = x0 + winW / 6 - 10; g.push(`<path d="M ${x0} ${winY + 40} H ${x1} M ${x0 + 20} ${winY} V ${winY + 40} M ${x1 - 30} ${winY} V ${winY + 40} M ${x0} ${winY + 20} L ${x0 + 30} ${winY + 26} L ${x1} ${winY + 14}" stroke="#7b5539" stroke-width="3" fill="none"/>`); }
  g.push(`<rect x="${winX}" y="${winY}" width="${winW}" height="${winH}" fill="url(#${id}sun)"/>`);
  // 窗台上的装饰位：小盆栽、呆猫的明信片、猫睡在窗台
  g.push(propPlant(id, winX + 40, winY + winH + 6, 0.5) + propPlant(id, winX + winW - 60, winY + winH + 6, 0.6) + wash(id, `M ${winX + 470} ${winY + winH + 4} q -6 -14 6 -18 h 26 q 10 4 4 18 Z`, '#c9b79a'));
  g.push(wash(id, rectD(winX + 200, winY + winH - 22, 40, 26, 1), '#fbf6ec') + wash(id, rectD(winX + 203, winY + winH - 19, 34, 18), '#a7b3c6') + `<path d="M ${winX + 205} ${winY + winH - 4} l 10 -10 l 8 6 l 12 -10" stroke="#fbfbf8" stroke-width="2" fill="none"/>`);
  // 右边墙：入口（门帘）+ 伞架
  g.push(wash(id, `M 1170 0 L 1280 0 L 1280 640 L 1170 300 Z`, '#e6d6b8'));
  g.push(wash(id, `M 1192 140 L 1262 124 L 1262 420 L 1192 340 Z`, '#3a2e28') + wash(id, `M 1192 140 L 1262 124 L 1262 220 q -10 8 -18 2 q -8 10 -18 4 q -8 8 -16 2 L 1192 200 Z`, '#55708f') + line([P(1192, 140), P(1192, 340)], 2.4, 0.85) + line([P(1262, 124), P(1262, 420)], 2.8, 0.85) + line([P(1192, 140), P(1262, 124)], 2, 0.8));
  g.push(wash(id, rectD(1160, 300, 24, 46, 4), '#5f6f78') + line([P(1166, 300), P(1160, 240)], 2, 0.8) + `<path d="M 1172 300 q 4 -50 -8 -66" stroke="#b04a3c" stroke-width="5" fill="none"/>`);
  // 左边：厨房（灶台靠墙 + 竖着的出菜台）
  g.push(wash(id, rectD(0, 24, 340, 256), '#e6e1d4'));
  for (let yy = 30, r = 0; yy < 200; yy += 14, r++) for (let xx = (r % 2 ? 12 : 0); xx < 340; xx += 24) g.push(`<rect x="${xx + 1}" y="${yy + 1}" width="22" height="12" rx="2" fill="${(xx + yy) % 3 ? '#dbe4e0' : '#e6e7dd'}"/>`);
  g.push(wash(id, `M -10 24 H 350 L 330 52 H 10 Z`, '#6e4c36'));
  for (let i = 0; i < 5; i++) g.push(wash(id, `M ${14 + i * 64} 50 h 60 v 24 q -8 6 -15 0 q -8 6 -15 0 q -8 6 -15 0 q -8 6 -15 0 Z`, i % 2 ? '#4d6585' : '#55708f'));
  g.push(line([P(20, 96), P(320, 96)], 2, 0.75));
  for (const [x, sh] of [[40, 'pot'], [90, 'ladle'], [270, 'ladle'], [300, 'pan']]) g.push(line([P(x, 96), P(x, 116)], 1.4, 0.75) + (sh === 'ladle' ? wash(id, ellD(x, 120, 7, 5), '#8e8780') : sh === 'pan' ? wash(id, ellD(x, 120, 13, 10), '#4f4945') : wash(id, rectD(x - 10, 114, 20, 14, 3), '#b8b0a2')));
  g.push(wash(id, rectD(0, 190, 330, 70, 6), '#b8a492') + box(0, 190, 330, 70, 2.2, 0.8));
  for (const x of [70, 160, 250]) g.push(`<ellipse cx="${x}" cy="248" rx="20" ry="8" fill="#ff9a3c" opacity="0.6" filter="url(#${id}soft)"/>` + wash(id, `M ${x - 16} 262 q 0 -16 16 -16 q 16 0 16 16 Z`, '#3d302a'));
  g.push(wash(id, `M 42 186 Q 46 210 80 210 Q 114 210 118 186 Z`, '#4a4440') + wash(id, ellD(80, 186, 38, 8), '#6d6560') + line([P(118, 188), P(136, 180)], 3, 0.85));
  g.push(wash(id, rectD(136, 160, 50, 30, 5), '#9aa3a8') + wash(id, ellD(161, 160, 25, 6), '#e8dcc0') + line([P(170, 158), P(182, 140)], 1.6, 0.7));
  for (let i = 0; i < 3; i++) g.push(wash(id, rectD(212, 176 - i * 12, 52, 12, 4), i % 2 ? '#cfa86a' : '#d9b77a'));
  // 地板
  g.push(`<rect x="0" y="278" width="1280" height="442" fill="#b9946a"/>`);
  const R = rnd(13); const fl = [];
  for (let yy = 280; yy < 720; yy += 38) { let xx = -60 - Math.floor(R() * 200); while (xx < 1280) { const ww = 260 + Math.floor(R() * 240); fl.push(`<rect x="${xx + 1}" y="${yy + 1}" width="${ww - 2}" height="36" rx="2" fill="${['#e2c89d', '#dcc092', '#e6cea6', '#d8bb8c'][Math.floor(R() * 4)]}"/>`); xx += ww; } }
  g.push(fl.join(''));
  g.push(`<rect x="0" y="278" width="1280" height="40" fill="#3a2a1e" opacity="0.15" filter="url(#${id}soft)"/>`);
  g.push(`<path d="M ${winX} 290 L ${winX + winW} 290 L ${winX + winW + 160} 720 L ${winX - 160} 720 Z" fill="#fff3d0" opacity="0.13"/>`);
  // 出菜台（竖着，台面朝右）
  g.push(wash(id, `M 300 282 L 360 282 L 360 560 L 300 560 Z`, '#9b6b46') + wash(id, `M 284 270 L 352 270 L 352 286 L 284 286 Z`, '#d9a877') + wash(id, `M 340 282 L 370 282 L 370 560 L 340 560 Z`, '#d9a877'));
  for (let yy = 300; yy < 560; yy += 36) g.push(line([P(302, yy), P(338, yy)], 1, 0.3));
  g.push(box(300, 282, 70, 278, 2.6, 0.85));
  // 地上的圆草席 + 矮圆桌 + 坐垫 / 树桩凳（三组）
  for (const [cx, cy, r] of [[560, 400, 74], [870, 390, 70], [700, 590, 84]]) {
    g.push(wash(id, ellD(cx, cy + 20, r * 2.1, r * 0.95), '#d7c28f', 0.85) + [0.8, 0.6].map((k) => `<ellipse cx="${cx}" cy="${cy + 20}" rx="${r * 2.1 * k}" ry="${r * 0.95 * k}" fill="none" stroke="#b89c66" stroke-width="2" opacity="0.4"/>`).join(''));
  }
  g.push(cushion(id, 470, 380, '#a8b88c') + cushion(id, 650, 380, '#d49a6a') + stump(id, 560, 340, 0.9));
  g.push(lowRoundTable(id, 560, 390, 74) + teaSet(id, 560, 380));
  g.push(stump(id, 790, 380) + stump(id, 950, 380) + lowRoundTable(id, 870, 386, 70) + teaSet(id, 880, 376));
  g.push(cushion(id, 590, 540, '#9fb3c4') + cushion(id, 810, 540, '#c9b06a'));
  g.push(lowRoundTable(id, 700, 590, 84) + cushion(id, 580, 640, '#a8b88c', 1.1) + cushion(id, 820, 640, '#d49a6a', 1.1));
  // 等位区：入口旁的长凳 + 小黑板
  g.push(wash(id, rectD(1030, 470, 140, 18, 4), '#a8744b') + wash(id, rectD(1030, 488, 140, 8, 2), '#7b5539') + line([P(1040, 496), P(1040, 520)], 2.4, 0.8) + line([P(1160, 496), P(1160, 520)], 2.4, 0.8) + cushion(id, 1070, 466, '#d49a6a', 0.6) + cushion(id, 1130, 466, '#a8b88c', 0.6));
  g.push(wash(id, `M 1080 380 l 50 0 l 8 70 l -66 0 Z`, '#3f4a3f') + line([P(1084, 452), P(1076, 470)], 2, 0.8) + line([P(1134, 452), P(1142, 470)], 2, 0.8) + box(1076, 380, 62, 70, 2, 0.85));
  // 装饰：猫爬架（右前）、鱼缸（养钓到的鱼）、落地灯、大盆栽（左前前景）
  g.push(wash(id, rectD(1190, 520, 20, 150, 4), '#c9b79a') + wash(id, ellD(1200, 520, 40, 12), '#a8744b') + wash(id, ellD(1200, 600, 34, 10), '#a8744b') + wash(id, ellD(1200, 680, 50, 14), '#8a6142'));
  g.push(wash(id, rectD(980, 250, 120, 40, 6), '#7b5539') + wash(id, rectD(988, 196, 104, 56, 6), '#bcdde4', 0.85) + `<g filter="url(#${id}wash)"><path d="M 1010 222 q 10 -8 20 0 q -10 8 -20 0 Z" fill="#e8772e"/><path d="M 1050 236 q 8 -6 16 0 q -8 6 -16 0 Z" fill="#a9b5a8"/><path d="M 1000 250 q 4 -14 0 -26 M 1080 250 q -4 -16 2 -30" stroke="#6f9a5c" stroke-width="3" fill="none"/></g>` + box(988, 196, 104, 56, 2, 0.8));
  g.push(`<ellipse cx="560" cy="380" rx="200" ry="110" fill="url(#${id}glow)" opacity="0.5"/><ellipse cx="870" cy="380" rx="200" ry="110" fill="url(#${id}glow)" opacity="0.5"/>`);
  // 前景：左下大盆栽 + 右下垂下来的绿萝 + 两侧暗角
  g.push(`<g opacity="0.95">${[[60, 740, -30], [96, 730, 0], [130, 744, 30], [40, 760, -60]].map(([x, yy, rt]) => `<ellipse cx="${x}" cy="${yy - 60}" rx="34" ry="56" fill="#4f6b45" transform="rotate(${rt} ${x} ${yy})" filter="url(#${id}wash)"/>`).join('')}</g>`);
  g.push(`<rect width="1280" height="720" fill="none" stroke="#2c1d12" stroke-width="60" opacity="0.12" filter="url(#${id}soft)"/>`);
  g.push(`<rect width="1280" height="720" filter="url(#${id}grain)"/>`);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720" width="1280" height="720"><defs>${defs}</defs><g filter="url(#${id}ink)">${g.join('')}</g></svg>`;
}

// ---------- 店型二：旅行列车餐车 ----------
function venueTrainSVG(scene = 'snowpeak') {
  const id = 'V' + (++_sid), g = [];
  const defs = `${sceneDefs(id)}<clipPath id="${id}win">${[0, 1, 2, 3].map((i) => `<rect x="${388 + i * 190}" y="70" width="160" height="160" rx="26"/>`).join('')}</clipPath>
    <radialGradient id="${id}glow"><stop offset="0" stop-color="#ffd89a" stop-opacity="0.6"/><stop offset="1" stop-color="#ffd89a" stop-opacity="0"/></radialGradient>`;
  // 车厢墙（墨绿护墙板 + 奶油色上墙）+ 拱形车顶
  g.push(`<rect width="1280" height="290" fill="#efe4cf"/>`);
  g.push(wash(id, `M -10 0 H 1290 V 40 Q 640 70 -10 40 Z`, '#d9c9a8') + line(sample([segQ(P(-10, 40), P(640, 72), P(1290, 40))], 30), 2.4, 0.8));
  g.push(wash(id, rectD(-10, 228, 1300, 62), '#3f5a4c') + line([P(-10, 230), P(1290, 230)], 2.4, 0.85));
  for (let x = 20; x < 1280; x += 60) g.push(line([P(x, 236), P(x, 286)], 1, 0.3));
  // 车窗（圆角）+ 窗外景
  g.push(viewTrain(id, 388, 70, 750, 160, scene));
  for (let i = 0; i < 4; i++) { const x = 388 + i * 190; g.push(`<rect x="${x}" y="70" width="160" height="160" rx="26" fill="none" stroke="#7b5539" stroke-width="10" filter="url(#${id}wash)"/>` + line([P(x + 4, 150), P(x + 156, 150)], 3, 0.8) + wash(id, rectD(x - 6, 228, 172, 10, 3), '#8f6444')); }
  // 行李架（黄铜）+ 小壁灯
  g.push(line([P(380, 52), P(1150, 52)], 3, 0.85) + line([P(380, 60), P(1150, 60)], 1.6, 0.7));
  for (let x = 390; x < 1150; x += 40) g.push(line([P(x, 52), P(x, 60)], 1, 0.6));
  g.push(wash(id, rectD(470, 34, 60, 18, 3), '#b07a4e') + wash(id, rectD(860, 28, 44, 24, 6), '#a8744b') + wash(id, rectD(1000, 36, 70, 16, 4), '#55708f'));
  for (let i = 0; i < 3; i++) { const x = 553 + i * 190; g.push(wash(id, `M ${x - 10} 130 h 20 l -4 -16 h -12 Z`, '#e9b66a') + `<ellipse cx="${x}" cy="136" rx="30" ry="24" fill="#ffd89a" opacity="0.4" filter="url(#${id}soft)"/>`); }
  // 左端：餐车厨房（隔板 + 出菜窗口）
  g.push(wash(id, rectD(0, 40, 360, 250), '#e6e1d4'));
  for (let yy = 70, r = 0; yy < 220; yy += 14, r++) for (let xx = (r % 2 ? 12 : 0); xx < 360; xx += 24) g.push(`<rect x="${xx + 1}" y="${yy + 1}" width="22" height="12" rx="2" fill="${(xx + yy) % 3 ? '#dbe4e0' : '#e6e7dd'}"/>`);
  g.push(wash(id, rectD(0, 180, 340, 80, 6), '#9aa3a8') + box(0, 180, 340, 80, 2, 0.8));
  g.push(wash(id, `M 42 176 Q 46 200 80 200 Q 114 200 118 176 Z`, '#4a4440') + wash(id, ellD(80, 176, 38, 8), '#6d6560') + wash(id, rectD(150, 150, 50, 30, 5), '#9aa3a8'));
  for (let i = 0; i < 3; i++) g.push(wash(id, rectD(232, 166 - i * 12, 52, 12, 4), i % 2 ? '#cfa86a' : '#d9b77a'));
  g.push(wash(id, `M 0 40 H 360 V 70 H 0 Z`, '#7b5539') + line([P(30, 60), P(330, 60)], 1.6, 0.6));
  // 车厢小圆窗在厨房墙上
  g.push(`<circle cx="300" cy="110" r="26" fill="#bcd6ea"/><circle cx="300" cy="110" r="26" fill="none" stroke="#b48a3c" stroke-width="6"/>`);
  // 右端：车厢连接门（圆窗）
  g.push(wash(id, `M 1170 40 L 1280 20 L 1280 640 L 1170 300 Z`, '#e6d6b8'));
  g.push(wash(id, `M 1190 110 L 1262 96 L 1262 420 L 1190 340 Z`, '#7b5539') + `<ellipse cx="1226" cy="170" rx="18" ry="22" fill="#bcd6ea"/><ellipse cx="1226" cy="170" rx="18" ry="22" fill="none" stroke="#b48a3c" stroke-width="4"/>` + wash(id, rectD(1246, 250, 8, 20, 3), '#b48a3c'));
  // 地板：木地板 + 中间长条地毯
  g.push(`<rect x="0" y="288" width="1280" height="432" fill="#a8835a"/>`);
  const R = rnd(21); const fl = [];
  for (let yy = 290; yy < 720; yy += 30) { let xx = -60 - Math.floor(R() * 200); while (xx < 1280) { const ww = 300 + Math.floor(R() * 260); fl.push(`<rect x="${xx + 1}" y="${yy + 1}" width="${ww - 2}" height="28" rx="2" fill="${['#c9a274', '#c29a6a', '#cfa97c'][Math.floor(R() * 3)]}"/>`); xx += ww; } }
  g.push(fl.join(''));
  g.push(wash(id, rectD(380, 470, 800, 110, 8), '#8a3f3a', 0.85) + `<rect x="392" y="480" width="776" height="90" rx="6" fill="none" stroke="#e2c27a" stroke-width="3" opacity="0.7"/>`);
  for (let x = 420; x < 1160; x += 60) g.push(`<path d="M ${x} 525 l 12 -10 l 12 10 l -12 10 Z" fill="#e2c27a" opacity="0.5"/>`);
  g.push(`<rect x="0" y="288" width="1280" height="30" fill="#3a2a1e" opacity="0.18" filter="url(#${id}soft)"/>`);
  // 出菜台（竖着）
  g.push(wash(id, `M 300 290 L 370 290 L 370 560 L 300 560 Z`, '#7b5539') + wash(id, `M 344 290 L 376 290 L 376 560 L 344 560 Z`, '#c99560') + box(300, 290, 76, 270, 2.6, 0.85));
  // 靠窗的双人桌 + 软座椅（三组），过道另一侧四人卡座
  const seats = ['#3f6b52', '#8a3f3a', '#3f5a6b'];
  [468, 658, 848].forEach((x, i) => { g.push(armChair(id, x - 74, 360, seats[i], 1) + armChair(id, x + 74, 360, seats[i], -1) + clothTable(id, x, 346, 100)); });
  g.push(armChair(id, 520, 640, '#8a3f3a', 1) + armChair(id, 700, 640, '#8a3f3a', -1) + clothTable(id, 610, 626, 120));
  for (const x of [468, 658, 848]) g.push(`<ellipse cx="${x}" cy="340" rx="160" ry="80" fill="url(#${id}glow)" opacity="0.45"/>`);
  // 等位：入口旁的小沙发 + 手提箱（呆猫的？）
  g.push(armChair(id, 1100, 470, '#3f6b52', -1) + wash(id, rectD(1030, 560, 70, 46, 6), '#a8744b') + wash(id, rectD(1056, 552, 18, 8, 3), '#5a3b28') + `<rect x="1040" y="572" width="16" height="12" fill="#e9e1d2" transform="rotate(-8 1048 578)"/>`);
  // 前景：下方暗色座椅靠背剪影 + 暗角
  g.push(wash(id, rectD(-20, 676, 260, 70, 20), '#2f4a3c', 0.92) + wash(id, rectD(1060, 680, 260, 70, 20), '#2f4a3c', 0.92));
  g.push(`<rect width="1280" height="720" fill="none" stroke="#2c1d12" stroke-width="60" opacity="0.14" filter="url(#${id}soft)"/>`);
  g.push(`<rect width="1280" height="720" filter="url(#${id}grain)"/>`);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720" width="1280" height="720"><defs>${defs}</defs><g filter="url(#${id}ink)">${g.join('')}</g></svg>`;
}
if (typeof module !== 'undefined') module.exports = { venueCourtyardSVG, venueTrainSVG, lowRoundTable, cushion, stump, armChair, clothTable };
