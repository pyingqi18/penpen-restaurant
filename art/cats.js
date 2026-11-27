// 盆盆餐厅 · 猫猫矢量绘制 v6（水墨淡彩，头身分开）
// 方向：毛笔墨线有粗细浓淡、接头留白；毛色是带水痕的晕染；杏仁眼加墨线眼皮。
// catSVG(def, view, opts) → SVG 字符串。def 是一只猫的外观参数，支持玩家「捏猫」。

const hex = (h) => (h.length === 4 ? [1, 2, 3].map((i) => parseInt(h[i] + h[i], 16)) : [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)));
const toHex = (a) => '#' + a.map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('');
const mix = (a, b, t) => { const x = hex(a), y = hex(b); return toHex(x.map((v, i) => v + (y[i] - v) * t)); };
const lum = (h) => { const [r, g, b] = hex(h); return 0.299 * r + 0.587 * g + 0.114 * b; };
const f = (n) => +(+n).toFixed(1);

// ---- 捏猫选项 ----
const FURS = [
  { id: 'orange', n: '橘色', c: '#e5a46c' }, { id: 'cream', n: '奶油', c: '#eedcbf' },
  { id: 'brown', n: '棕色', c: '#a68b70' }, { id: 'grey', n: '灰色', c: '#a8a7ab' },
  { id: 'black', n: '黑色', c: '#56504d' }, { id: 'white', n: '白色', c: '#f7f3ec' },
];
const PATTERNS = [
  { id: 'solid', n: '纯色' }, { id: 'tabby', n: '虎斑' }, { id: 'cow', n: '奶牛' }, { id: 'calico', n: '三花' },
];
const EYES = [
  { id: 'amber', n: '琥珀', c: '#d6a23a' }, { id: 'green', n: '绿色', c: '#98b363' },
  { id: 'blue', n: '蓝色', c: '#7fa9c9' }, { id: 'copper', n: '铜色', c: '#c97a38' },
];
const EYES2 = [{ id: 'same', n: '两眼一样', c: '#e9dfd2' }].concat(EYES.map((e) => ({ ...e, n: '右眼' + e.n })));
const BUILDS = [{ id: 'normal', n: '苗条' }, { id: 'fat', n: '圆润' }, { id: 'chonk', n: '超胖' }];
const TUFTS = [{ id: 'none', n: '没有' }, { id: 'black', n: '头顶一点黑', c: '#5a5652' }, { id: 'brown', n: '头顶一点棕', c: '#8a6a4c' }, { id: 'orange', n: '头顶一点橘', c: '#dd8f45' }];
const COLLARS = [
  { id: 'none', n: '不戴' }, { id: 'crochet-white', n: '白毛线+小花' }, { id: 'crochet-pink', n: '粉毛线' }, { id: 'bandana', n: '蓝领巾' },
];
// 衣服：unlock 是解锁条件（第几天、或星星数）
const OUTFITS = [
  { id: 'apron', n: '粉围裙', unlock: null },
  { id: 'none', n: '不穿', unlock: null },
  { id: 'bowtie', n: '红领结', unlock: { day: 3 } },
  { id: 'xiaoer', n: '店小二装', unlock: { day: 5 } },
  { id: 'scarf', n: '毛线围巾', unlock: { stars: 8 } },
  { id: 'dance', n: '广场舞红绸', unlock: { day: 8 } },
  { id: 'chef', n: '厨师帽', unlock: { stars: 15 } },
  { id: 'backpack', n: '旅行背包', unlock: { day: 12 } },
];

function buildCat(o) {
  const fur = o.furHex || (FURS.find((x) => x.id === o.fur) || FURS[0]).c;
  const pat = o.pattern || 'solid';
  const base = pat === 'cow' || pat === 'calico' ? '#faf7f2' : fur;
  const eye = (EYES.find((x) => x.id === o.eye) || EYES[0]).c;
  const e2 = EYES.find((x) => x.id === o.eye2);
  return {
    build: o.build || 'fat', pattern: pat, fur: base,
    patch: pat === 'cow' ? (o.fur === 'white' || o.fur === 'cream' ? '#4a4442' : fur) : null,
    patch1: pat === 'calico' ? (o.fur === 'white' || o.fur === 'black' || o.fur === 'cream' ? '#e9a35e' : fur) : null,
    patch2: pat === 'calico' ? '#4a4442' : null,
    stripe: pat === 'tabby' ? mix(fur, '#000000', 0.45) : null,
    cream: pat === 'cow' || pat === 'calico' ? '#ffffff' : mix(base, '#ffffff', 0.7),
    eye, eye2: e2 ? e2.c : eye,
    tuft: (TUFTS.find((x) => x.id === o.tuft) || {}).c || null,
    earIn: '#e9aea6', pupil: o.pupil || 'normal', brows: o.brows === 'bracket' ? 'bracket' : !!o.brows,
    collar: o.collar || 'none', outfit: o.outfit || 'apron', kitten: !!o.kitten,
    ears: o.ears || 'cat', mask: o.mask || null, earCol: o.earCol || null, tail: o.tail || 'long',
  };
}

const CATS = {
  laoda: { name: '老大', role: '厨师', look: { fur: 'brown', pattern: 'tabby', eye: 'amber', build: 'chonk', pupil: 'big', brows: 'bracket', collar: 'crochet-white', outfit: 'chef' }, tweak: { fur: '#b8875c' } },
  laoer: { name: '老二', role: '店小二', look: { fur: 'brown', pattern: 'tabby', eye: 'green', build: 'normal', collar: 'crochet-pink', outfit: 'xiaoer' }, tweak: { fur: '#9a9189' } },
  mimi: { name: '咪咪', role: '小帮工', look: { fur: 'white', pattern: 'solid', eye: 'blue', eye2: 'green', tuft: 'black', build: 'normal', collar: 'bandana', outfit: 'none', kitten: true } },
  // 呆猫：原创造型——大圆脸、半眯的呆眼、灰棕耳朵和头顶一撮毛，背着旅行包
  aju: { name: '呆猫', role: '远行的旅人', look: { furHex: '#ece4d6', pattern: 'solid', eye: 'amber', pupil: 'sleepy', tuft: 'brown', earCol: '#8a6a4c', build: 'fat', collar: 'none', outfit: 'backpack', mask: 'cheeks' } },
  // 帅老头：阿比西尼亚那种红棕色的大个子公猫，绿眼睛，浓眉
  shuai: { name: '帅老头', role: '盆盆的老伴', look: { furHex: '#b8703e', pattern: 'solid', eye: 'green', build: 'chonk', brows: true, earCol: '#7a4424', collar: 'none', outfit: 'dance', tail: 'long' } },
  penpen: { name: '盆盆', role: '主角（可捏）', look: { fur: 'cream', pattern: 'solid', eye: 'amber', build: 'fat', collar: 'none', outfit: 'apron' } },
};
// 顾客（动物）造型，复用同一套画法
const CUSTOMER_LOOKS = {
  shiba: { furHex: '#dd9a5e', pattern: 'solid', eye: 'copper', build: 'fat', ears: 'dog', outfit: 'tie', mask: 'cheeks', brows: true, collar: 'none' },
  panda: { furHex: '#f3efe7', pattern: 'solid', eye: 'amber', build: 'chonk', ears: 'round', earCol: '#3a322e', mask: 'panda', outfit: 'shawl', collar: 'none', tail: 'none' },
  bunny: { furHex: '#efe6dc', pattern: 'solid', eye: 'copper', build: 'normal', ears: 'long', outfit: 'none', collar: 'bandana', kitten: true, tail: 'none' },
  fox: { furHex: '#d9814a', pattern: 'solid', eye: 'amber', build: 'normal', ears: 'fox', mask: 'cheeks', outfit: 'bowtie', collar: 'none' },
  raccoon: { furHex: '#9c958f', pattern: 'solid', eye: 'amber', build: 'chonk', ears: 'round', earCol: '#5b534e', mask: 'raccoon', outfit: 'scarf', collar: 'none', tail: 'ringed' },
};
// 同一桌一般是同一个物种，但每位长得不一样（'shiba#2' = 柴犬第 3 种样子）
const CUSTOMER_VARIANTS = {
  shiba: [{}, { furHex: '#4a403b', n: '黑柴' }, { furHex: '#f2ece2', n: '白柴', outfit: 'none' }, { furHex: '#c98a52', build: 'normal', n: '瘦柴' }],
  bunny: [{}, { furHex: '#a88468', n: '棕兔' }, { furHex: '#b9b4b0', n: '灰兔', collar: 'crochet-pink' }, { furHex: '#f7f3ec', eye: 'blue', n: '白兔' }],
  raccoon: [{}, { furHex: '#7d7670', build: 'fat', n: '深色狸' }, { furHex: '#b3aa9f', outfit: 'apron', n: '浅色狸' }],
  panda: [{}, { build: 'fat', outfit: 'scarf', n: '熊猫爷爷' }],
  fox: [{}, { furHex: '#c9c3bc', n: '银狐' }, { furHex: '#e7a05a', outfit: 'scarf', n: '赤狐' }],
  neko: [
    { fur: 'orange', pattern: 'tabby', eye: 'copper', build: 'chonk', brows: true, collar: 'none', outfit: 'none', n: '胖橘' },
    { fur: 'white', pattern: 'solid', eye: 'blue', eye2: 'amber', build: 'fat', collar: 'crochet-white', outfit: 'none', n: '波斯猫' },
    { fur: 'orange', pattern: 'calico', eye: 'green', build: 'normal', collar: 'crochet-pink', outfit: 'bowtie', n: '美女三花' },
    { fur: 'black', pattern: 'cow', eye: 'amber', build: 'fat', collar: 'bandana', outfit: 'none', n: '奶牛猫' },
    { fur: 'black', pattern: 'solid', eye: 'green', build: 'normal', collar: 'none', outfit: 'scarf', n: '小黑' },
  ],
};
function presetCat(key) {
  const [base, vi] = String(key).split('#');
  if (CUSTOMER_VARIANTS[base]) { const v = CUSTOMER_VARIANTS[base][+vi || 0] || {}; return buildCat({ ...(CUSTOMER_LOOKS[base] || {}), ...v }); }
  if (CUSTOMER_LOOKS[key]) return buildCat(CUSTOMER_LOOKS[key]);
  const p = CATS[key]; const c = buildCat(p.look);
  if (p.tweak && p.tweak.fur) { c.fur = p.tweak.fur; c.stripe = mix(c.fur, '#000000', 0.45); c.cream = mix(c.fur, '#ffffff', 0.7); }
  return c;
}

// ---------------- 毛笔画法 ----------------
let _uid = 0;
const INK = '#2c2420';
const P = (x, y) => [x, y];
// 线段工具：L / Q / C 都转成三次贝塞尔
const segL = (a, b) => [a, [a[0] + (b[0] - a[0]) / 3, a[1] + (b[1] - a[1]) / 3], [a[0] + (b[0] - a[0]) * 2 / 3, a[1] + (b[1] - a[1]) * 2 / 3], b];
const segQ = (a, c, b) => [a, [a[0] + (c[0] - a[0]) * 2 / 3, a[1] + (c[1] - a[1]) * 2 / 3], [b[0] + (c[0] - b[0]) * 2 / 3, b[1] + (c[1] - b[1]) * 2 / 3], b];
const segC = (a, c1, c2, b) => [a, c1, c2, b];
const rev = (s) => [s[3], s[2], s[1], s[0]];
function bez(s, t) {
  const u = 1 - t;
  return [0, 1].map((i) => u * u * u * s[0][i] + 3 * u * u * t * s[1][i] + 3 * u * t * t * s[2][i] + t * t * t * s[3][i]);
}
function sample(segs, n = 14) {
  const pts = [];
  segs.forEach((s, k) => { for (let i = k ? 1 : 0; i <= n; i++) pts.push(bez(s, i / n)); });
  return pts;
}
const segsD = (segs) => `M ${f(segs[0][0][0])} ${f(segs[0][0][1])} ` + segs.map((s) => `C ${f(s[1][0])} ${f(s[1][1])} ${f(s[2][0])} ${f(s[2][1])} ${f(s[3][0])} ${f(s[3][1])}`).join(' ');
// 一笔：两头尖、中间粗，可以偏重某一端
function brush(pts, wMax, opt = {}) {
  const wMin = opt.wMin ?? 0.35, bias = opt.bias ?? 0.5, n = pts.length;
  if (n < 2) return '';
  const L = [], R = [];
  for (let i = 0; i < n; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)];
    let dx = b[0] - a[0], dy = b[1] - a[1]; const d = Math.hypot(dx, dy) || 1; dx /= d; dy /= d;
    const t = i / (n - 1);
    const shape = Math.pow(Math.sin(Math.PI * Math.min(1, Math.max(0, t <= bias ? t / bias * 0.5 : 0.5 + (t - bias) / (1 - bias) * 0.5))), 0.7);
    const wv = (wMin + (wMax - wMin) * shape) / 2;
    L.push([pts[i][0] - dy * wv, pts[i][1] + dx * wv]); R.push([pts[i][0] + dy * wv, pts[i][1] - dx * wv]);
  }
  const all = L.concat(R.reverse());
  return 'M ' + all.map((p) => `${f(p[0])} ${f(p[1])}`).join(' L ') + ' Z';
}
const quadPts = (a, c, b, n = 12) => sample([segQ(a, c, b)], n);
function offsetPts(pts, d) {
  return pts.map((p, i) => {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
    let dx = b[0] - a[0], dy = b[1] - a[1]; const l = Math.hypot(dx, dy) || 1;
    return [p[0] - (dy / l) * d, p[1] + (dx / l) * d];
  });
}

// 共用：滤镜（晕染、柔边、墨线、纸纹、受光）
function inkDefs(id) {
  return `<filter id="${id}wash" x="-10%" y="-10%" width="120%" height="120%"><feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="3" seed="4" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="4"/><feGaussianBlur stdDeviation="0.6"/></filter>
    <filter id="${id}soft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="3.2"/></filter>
    <filter id="${id}ink" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="1" seed="2" result="g"/><feDisplacementMap in="SourceGraphic" in2="g" scale="1.3"/><feGaussianBlur stdDeviation="0.25"/></filter>
    <filter id="${id}grain"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="7"/><feColorMatrix values="0 0 0 0 0.2  0 0 0 0 0.15  0 0 0 0 0.1  0 0 0 0.16 0"/></filter>
    <radialGradient id="${id}lit" cx="0.42" cy="0.3" r="0.75"><stop offset="0" stop-color="#ffffff" stop-opacity="0.38"/><stop offset="0.6" stop-color="#ffffff" stop-opacity="0.06"/><stop offset="1" stop-color="#000000" stop-opacity="0.08"/></radialGradient>`;
}
// 一块晕染：底色 + 边缘加深 + 受光 + 纸纹，内容裁在形状里
function washShape(id, key, d, col, inner = '', darkK = 0.35) {
  return `<clipPath id="${id}${key}"><path d="${d}"/></clipPath><g clip-path="url(#${id}${key})"><path d="${d}" fill="${col}" filter="url(#${id}wash)"/>${inner}<path d="${d}" fill="none" stroke="${mix(col, '#000000', darkK)}" stroke-width="12" stroke-opacity="0.35" filter="url(#${id}soft)"/><path d="${d}" fill="url(#${id}lit)"/><rect x="0" y="0" width="200" height="220" filter="url(#${id}grain)"/></g>`;
}
const inkPath = (d, op = 0.9) => `<path d="${d}" fill="${INK}" opacity="${op}"/>`;

function catSVG(def, view = 'front', opts = {}) {
  const c = typeof def === 'string' ? presetCat(def) : def.fur && def.fur[0] === '#' ? def : buildCat(def);
  const id = 'c' + (++_uid).toString(36);
  const back = view === 'back';
  const fur = c.fur, outfit = c.outfit;
  const dark = (col, t) => mix(col, '#000000', t);
  // hw 头半宽，bw 肚子半宽
  const S = { normal: { hw: 46, bw: 33 }, fat: { hw: 50, bw: 42 }, chonk: { hw: 54, bw: 54 } }[c.build] || { hw: 50, bw: 42 };
  const { hw, bw } = S;
  const cx = 100, bot = 203, hy = 90, neckY = 122;
  const g = [];
  const inkG = (inner) => `<g filter="url(#${id}ink)">${inner}</g>`;
  const lineThin = `stroke="${INK}" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round" stroke-opacity="0.8"`;
  g.push(`<defs>${inkDefs(id)}</defs>`);

  // ---- 形状：头、身体分开 ----
  const earT = c.ears === 'fox' ? hy - 60 : c.ears === 'dog' ? hy - 43 : hy - 50, headTop = hy - 33, chin = hy + 31;
  const H = {
    lc: P(cx - hw, hy + 8), lo: P(cx - hw + 5, hy - 22), lt: P(cx - hw + 9, earT), li: P(cx - hw + 30, hy - 30),
    ri: P(cx + hw - 30, hy - 30), rt: P(cx + hw - 9, earT), ro: P(cx + hw - 5, hy - 22), rc: P(cx + hw, hy + 8), ch: P(cx, chin),
  };
  const h1 = segQ(H.lc, P(cx - hw - 3, hy - 10), H.lo), h2 = segQ(H.lo, P(cx - hw + 5, earT - 4), H.lt), h3 = segQ(H.lt, P(cx - hw + 18, hy - 33), H.li);
  const h4 = segQ(H.li, P(cx, headTop - 6), H.ri);
  const h5 = segQ(H.ri, P(cx + hw - 18, hy - 33), H.rt), h6 = segQ(H.rt, P(cx + hw - 5, earT - 4), H.ro), h7 = segQ(H.ro, P(cx + hw + 3, hy - 10), H.rc);
  // 腮毛：脸颊外鼓再收到下巴
  const h8 = segC(H.rc, P(cx + hw + 4, hy + 20), P(cx + hw * 0.55, chin + 2), H.ch);
  const h9 = segC(H.ch, P(cx - hw * 0.55, chin + 2), P(cx - hw - 4, hy + 20), H.lc);
  const ears = c.ears || 'cat';
  const catEars = ears === 'cat' || ears === 'fox' || ears === 'dog';
  const r1 = segC(H.lc, P(cx - hw - 2, hy - 26), P(cx - hw * 0.55, headTop - 2), P(cx, headTop - 2));
  const r2 = segC(P(cx, headTop - 2), P(cx + hw * 0.55, headTop - 2), P(cx + hw + 2, hy - 26), H.rc);
  const headD = catEars ? segsD([h1, h2, h3, h4, h5, h6, h7, h8, h9]) + ' Z' : segsD([r1, r2, h8, h9]) + ' Z';

  const by0 = neckY - 6;
  const B = {
    ls: P(cx - bw * 0.62, by0 + 2), lh: P(cx - bw, 168), lb: P(cx - bw * 0.55, bot), bc: P(cx, bot + 1),
    rb: P(cx + bw * 0.55, bot), rh: P(cx + bw, 168), rs: P(cx + bw * 0.62, by0 + 2),
  };
  const b1 = segC(B.ls, P(cx - bw * 0.95, by0 + 14), P(cx - bw, 150), B.lh), b2 = segC(B.lh, P(cx - bw, 190), P(cx - bw * 0.8, bot), B.lb);
  const b3 = segQ(B.lb, P(cx - bw * 0.2, bot + 2), B.bc), b4 = segQ(B.bc, P(cx + bw * 0.2, bot + 2), B.rb);
  const b5 = segC(B.rb, P(cx + bw * 0.8, bot), P(cx + bw, 190), B.rh), b6 = segC(B.rh, P(cx + bw, 150), P(cx + bw * 0.95, by0 + 14), B.rs);
  const b7 = segQ(B.rs, P(cx, by0 - 10), B.ls);
  const bodyD = segsD([b1, b2, b3, b4, b5, b6, b7]) + ' Z';

  // 影子
  g.push(`<ellipse cx="${cx}" cy="206" rx="${bw + 12}" ry="5" fill="${INK}" opacity="0.12" filter="url(#${id}soft)"/>`);
  if (outfit === 'backpack' && !back) g.push(`<rect x="${cx - bw - 6}" y="124" width="${bw * 2 + 12}" height="56" rx="18" fill="#9db584" filter="url(#${id}wash)"/>`);

  // ---- 尾巴 ----
  const tailSeg = back
    ? segC(P(cx + 4, bot - 22), P(cx + 14, bot + 2), P(cx + 54, bot - 22), P(cx + 44, bot - 70))
    : segC(P(cx + bw - 16, bot - 12), P(cx + bw + 24, bot - 10), P(cx + bw + 32, bot - 54), P(cx + bw + 14, bot - 84));
  const tp = sample([tailSeg], 24);
  if (c.tail !== 'none') {
  g.push(`<path d="${segsD([tailSeg])}" fill="none" stroke="${c.patch && !back ? c.patch : fur}" stroke-width="14" stroke-linecap="round" filter="url(#${id}wash)"/>`);
  if (c.stripe) g.push(`<path d="${segsD([tailSeg])}" fill="none" stroke="${c.stripe}" stroke-width="12" stroke-dasharray="3 10" stroke-opacity="0.7" filter="url(#${id}wash)"/>`);
  if (c.patch1) g.push(`<path d="${segsD([tailSeg])}" fill="none" stroke="${c.patch1}" stroke-width="12" stroke-dasharray="16 40" filter="url(#${id}wash)"/>`);
  g.push(inkG(inkPath(brush(offsetPts(tp, 7.5).slice(4), 2.8, { bias: 0.45 })) + inkPath(brush(offsetPts(tp, -7.5).slice(5, -1), 2, { bias: 0.6 }), 0.75)));
  if (c.tail === 'ringed') g.push(`<path d="${segsD([tailSeg])}" fill="none" stroke="#4a423d" stroke-width="12" stroke-dasharray="6 8" stroke-opacity="0.8" filter="url(#${id}wash)"/>`);
  }

  // ---- 身体 ----
  const sx = back ? -1 : 1;
  const bIn = [];
  if (!back) bIn.push(`<ellipse cx="${cx}" cy="168" rx="${bw * 0.55}" ry="32" fill="${c.cream}" filter="url(#${id}soft)"/>`);
  if (c.patch) bIn.push(`<ellipse cx="${cx - sx * bw * 0.62}" cy="150" rx="22" ry="20" fill="${c.patch}" filter="url(#${id}wash)"/>`);
  if (c.patch1) bIn.push(`<ellipse cx="${cx + sx * bw * 0.66}" cy="146" rx="20" ry="18" fill="${c.patch1}" filter="url(#${id}wash)"/>`);
  if (c.patch2) bIn.push(`<ellipse cx="${cx - sx * bw * 0.7}" cy="180" rx="14" ry="12" fill="${c.patch2}" filter="url(#${id}wash)"/>`);
  if (c.stripe) {
    const st = (pts, wm, op = 0.65) => `<path d="${brush(pts, wm)}" fill="${c.stripe}" opacity="${op}"/>`;
    for (const s of [-1, 1]) for (const k of [0, 1, 2]) bIn.push(st(quadPts(P(cx + s * (bw + 3), 140 + k * 15), P(cx + s * (bw - 8), 143 + k * 15), P(cx + s * (bw - 18), 150 + k * 15)), 5.5));
    if (back) for (const k of [0, 1, 2, 3, 4]) bIn.push(st(quadPts(P(cx - bw * 0.6, 128 + k * 15), P(cx, 137 + k * 15), P(cx + bw * 0.6, 128 + k * 15)), 5.5));
  }
  g.push(washShape(id, 'b', bodyD, fur, bIn.join('')));
  g.push(inkG(
    inkPath(brush(sample([b1, b2], 14).slice(1, -2), 3.2, { bias: 0.55 }), 0.85)
    + inkPath(brush(sample([rev(b6), rev(b5)], 14).slice(1, -2), 4.4, { bias: 0.6 }), 0.92)
    + inkPath(brush(sample([b3, b4], 10).slice(2, -2), 1.8), 0.55)));
  // 脚
  for (const side of [-1, 1]) {
    const stride = side * (opts.stride || 0), x = cx + side * bw * 0.45 + stride * 2;
    const y = bot - 3 + stride * 5;
    if (opts.stride) g.push(inkG('<ellipse cx="' + x + '" cy="' + (y + 4) + '" rx="12" ry="7" fill="' + fur + '"/>'));
    g.push(inkG(inkPath(brush(quadPts(P(x - 12, y), P(x, y + 9), P(x + 12, y)), 2.2), 0.8)));
  }

  // ---- 衣服（淡彩 + 细墨线）----
  const cloth = (d, col) => `<path d="${d}" fill="${col}" opacity="0.92" filter="url(#${id}wash)"/><path d="${d}" fill="none" ${lineThin} filter="url(#${id}ink)"/>`;
  if (outfit === 'apron') {
    g.push(back
      ? `<path d="M ${cx - bw + 4} 146 Q ${cx} 154 ${cx + bw - 4} 146" fill="none" stroke="#e9b8a6" stroke-width="6"/>${cloth(`M ${cx} 151 l -12 -8 v 16 Z M ${cx} 151 l 12 -8 v 16 Z`, '#e9b8a6')}`
      : cloth(`M ${cx - bw * 0.52} 132 L ${cx + bw * 0.52} 132 L ${cx + bw * 0.72} 192 Q ${cx} 202 ${cx - bw * 0.72} 192 Z`, '#edc2b2') + cloth(`M ${cx - 10} 158 h 20 v 10 q -10 5 -20 0 Z`, '#e0a593'));
  }
  if (outfit === 'tie' && !back) g.push(cloth(`M ${cx - bw * 0.55} 128 L ${cx} 150 L ${cx + bw * 0.55} 128 L ${cx + bw * 0.6} 196 Q ${cx} 202 ${cx - bw * 0.6} 196 Z`, '#f6f3ec') + cloth(`M ${cx - 5} 128 h 10 l 4 40 l -9 10 l -9 -10 Z`, '#b8504a'));
  if (outfit === 'shawl') g.push(cloth(`M ${cx - bw - 2} 132 Q ${cx} 116 ${cx + bw + 2} 132 L ${cx + bw * 0.7} 160 Q ${cx} 176 ${cx - bw * 0.7} 160 Z`, '#a7889c'));
  if (outfit === 'xiaoer') {
    g.push(back
      ? cloth(`M ${cx - bw + 3} 146 h ${(bw - 3) * 2} v 7 h ${-(bw - 3) * 2} Z`, '#4a6384') + cloth(`M ${cx - 4} 153 l -8 18 h 6 Z M ${cx + 4} 153 l 8 18 h -6 Z`, '#4a6384')
      : cloth(`M ${cx - bw + 3} 148 L ${cx + bw - 3} 148 L ${cx + bw - 7} 194 Q ${cx} 202 ${cx - bw + 7} 194 Z`, '#5b7395'));
  }
  if (outfit === 'backpack' && back) g.push(cloth(`M ${cx - bw + 2} 132 q 0 -14 16 -14 h ${(bw - 2) * 2 - 32} q 16 0 16 14 v 46 q 0 16 -16 16 h ${-((bw - 2) * 2 - 32)} q -16 0 -16 -16 Z`, '#9db584') + cloth(`M ${cx - 18} 156 h 36 v 18 q -18 7 -36 0 Z`, '#86a26c'));
  if (outfit === 'backpack' && !back) for (const s of [-1, 1]) g.push(`<path d="M ${cx + s * bw * 0.5} 124 L ${cx + s * (bw * 0.55)} 178" stroke="#86a26c" stroke-width="6" stroke-linecap="round" filter="url(#${id}wash)"/>`);

  // ---- 前爪 ----
  if (!back) for (const s of [-1, 1]) {
    const ax = cx + s * Math.max(14, bw * 0.32), ay = 158;
    g.push(`<ellipse cx="${f(ax)}" cy="${ay}" rx="9.5" ry="11" fill="${mix(fur, '#ffffff', 0.15)}" filter="url(#${id}wash)"/>`);
    g.push(inkG(inkPath(brush(quadPts(P(ax - s * 9, ay - 8), P(ax - s * 11, ay + 12), P(ax + s * 2, ay + 11)), 2.4), 0.85) + inkPath(brush(quadPts(P(ax + s * 9, ay - 6), P(ax + s * 10, ay + 6), P(ax + s * 4, ay + 10)), 1.6), 0.6)));
    if (c.stripe) g.push(`<path d="${brush(quadPts(P(ax - 6, ay - 3), P(ax, ay - 1), P(ax + 6, ay - 3)), 2.4)}" fill="${c.stripe}" opacity="0.6"/>`);
  }
  if (outfit === 'dance' && !back) {
    const px = cx + Math.max(14, bw * 0.32) + 6, py = 158;
    g.push(cloth(`M ${px} ${py} L ${px + 30} ${py - 36} A 40 40 0 0 1 ${px + 42} ${py + 6} Z`, '#d9605a') + `<path d="M ${px} ${py} L ${px + 37} ${py - 15}" stroke="#e8b84a" stroke-width="1.6"/>`);
  }

  // ---- 非猫耳朵（画在头后面）----
  if (!catEars) {
    const ec = c.earCol || fur;
    for (const s of [-1, 1]) {
      if (ears === 'round') {
        const ex0 = cx + s * hw * 0.72, ey0 = headTop + 6;
        g.push(washShape(id, 'er' + (s + 1), `M ${ex0 - 14} ${ey0} a 14 14 0 1 1 28 0 a 14 14 0 1 1 -28 0 Z`, ec));
        g.push(inkG(inkPath(brush(sample([segC(P(ex0 - s * 13, ey0 + 6), P(ex0 - s * 16, ey0 - 16), P(ex0 + s * 12, ey0 - 18), P(ex0 + s * 14, ey0 + 2))], 12), 2.6), 0.85)));
      } else if (ears === 'long') {
        const ex0 = cx + s * 15, ey0 = headTop - 26;
        const d = `M ${ex0} ${ey0 - 32} C ${ex0 + 13} ${ey0 - 30}, ${ex0 + 13} ${ey0 + 28}, ${ex0} ${ey0 + 32} C ${ex0 - 13} ${ey0 + 28}, ${ex0 - 13} ${ey0 - 30}, ${ex0} ${ey0 - 32} Z`;
        g.push(`<g transform="rotate(${s * 10} ${ex0} ${ey0 + 30})">${washShape(id, 'el' + (s + 1), d, ec)}<ellipse cx="${ex0}" cy="${ey0}" rx="5" ry="22" fill="${c.earIn}" opacity="0.6" filter="url(#${id}soft)"/>${inkG(inkPath(brush(sample([segC(P(ex0 - 9, ey0 + 26), P(ex0 - 14, ey0 - 20), P(ex0 - 4, ey0 - 34), P(ex0 + 4, ey0 - 32)), segC(P(ex0 + 4, ey0 - 32), P(ex0 + 12, ey0 - 26), P(ex0 + 12, ey0 + 10), P(ex0 + 8, ey0 + 26))], 10), 2.6), 0.85))}</g>`);
      }
    }
  }
  // ---- 头 ----
  const hIn = [];
  if (!back) hIn.push(`<ellipse cx="${cx}" cy="${hy + 22}" rx="20" ry="11" fill="${c.cream}" filter="url(#${id}soft)"/>`);
  if (c.patch) hIn.push(`<path d="M ${cx + sx * 3} ${headTop - 12} q ${sx * 46} -4 ${sx * 50} 42 q ${-sx * 24} 18 ${-sx * 44} -6 Z" fill="${c.patch}" filter="url(#${id}wash)"/>`);
  if (c.patch1) hIn.push(`<path d="M ${cx - sx * 2} ${headTop - 12} q ${-sx * 48} -2 ${-sx * 50} 42 q ${sx * 22} 16 ${sx * 40} -8 Z" fill="${c.patch1}" filter="url(#${id}wash)"/>`);
  if (c.patch2) hIn.push(`<ellipse cx="${cx + sx * (hw - 8)}" cy="${headTop + 8}" rx="16" ry="14" fill="${c.patch2}" filter="url(#${id}wash)"/>`);
  if (c.mask === 'panda') for (const s of [-1, 1]) hIn.push(`<ellipse cx="${cx + s * hw * 0.42}" cy="${hy + 4}" rx="14" ry="11" transform="rotate(${s * 25} ${cx + s * hw * 0.42} ${hy + 4})" fill="#3a322e" filter="url(#${id}wash)" opacity="0.92"/>`);
  if (c.mask === 'raccoon') hIn.push(`<path d="M ${cx - hw} ${hy - 2} Q ${cx} ${hy - 14} ${cx + hw} ${hy - 2} L ${cx + hw} ${hy + 12} Q ${cx} ${hy + 4} ${cx - hw} ${hy + 12} Z" fill="#4a423d" filter="url(#${id}wash)" opacity="0.85"/><ellipse cx="${cx}" cy="${headTop + 6}" rx="8" ry="14" fill="#4a423d" opacity="0.5" filter="url(#${id}soft)"/>`);
  if (c.mask === 'cheeks' && !back) hIn.push(`<ellipse cx="${cx}" cy="${hy + 24}" rx="${hw * 0.8}" ry="15" fill="#fbf6ee" filter="url(#${id}soft)"/>`);
  if (c.tuft) hIn.push(`<ellipse cx="${cx + 3}" cy="${headTop + 3}" rx="12" ry="7" fill="${c.tuft}" filter="url(#${id}soft)" opacity="0.9"/>`);
  if (c.stripe) {
    const st = (pts, wm, op = 0.75) => `<path d="${brush(pts, wm)}" fill="${c.stripe}" opacity="${op}"/>`;
    for (const dx of [-10, 0, 10]) hIn.push(st(quadPts(P(cx + dx, headTop - 3), P(cx + dx * 1.2, headTop + 7), P(cx + dx * 0.8, headTop + 16)), 4));
    if (!back) for (const s of [-1, 1]) for (const k of [0, 1]) hIn.push(st(quadPts(P(cx + s * (hw + 3), hy + 4 + k * 9), P(cx + s * (hw - 6), hy + 5 + k * 9), P(cx + s * (hw - 15), hy + 8 + k * 9)), 3.6));
    else for (const k of [0, 1, 2]) hIn.push(st(quadPts(P(cx - 24, hy - 8 + k * 11), P(cx, hy + 1 + k * 11), P(cx + 24, hy - 8 + k * 11)), 4.4, 0.65));
  }
  g.push(washShape(id, 'h', headD, fur, hIn.join(''), 0.3));
  if (!back && catEars) for (const s of [-1, 1]) g.push(`<path d="M ${cx + s * (hw - 10)} ${earT + 9} L ${cx + s * (hw - 24)} ${hy - 26} L ${cx + s * (hw - 5)} ${hy - 18} Z" fill="${c.earIn}" opacity="0.65" filter="url(#${id}soft)"/>`);
  g.push(inkG(
    (catEars ? inkPath(brush(sample([h1, h2, h3], 10), 3.0, { bias: 0.5 }), 0.95)
    + inkPath(brush(sample([h4], 16).slice(2, -2), 1.6), 0.6)
    + inkPath(brush(sample([h5, h6, h7], 10), 3.0, { bias: 0.5 }), 0.95)
    : inkPath(brush(sample([r1], 16).slice(0, -2), 3.0, { bias: 0.4 }), 0.9) + inkPath(brush(sample([r2], 16).slice(2), 3.2, { bias: 0.6 }), 0.92))
    + inkPath(brush(sample([h8], 14).slice(0, -2), 3.8, { bias: 0.4 }), 0.9)
    + inkPath(brush(sample([h9], 14).slice(2), 2.6, { bias: 0.6 }), 0.8)));

  // ---- 脖子上的东西（画在头下沿）----
  const cw = hw * 0.62, cy0 = chin - 4;
  if (c.collar.startsWith('crochet')) {
    const band = c.collar === 'crochet-pink' ? '#eab2a8' : '#f4efe4', edgeC = c.collar === 'crochet-pink' ? '#d98f84' : '#e4b54c';
    for (let i = 0; i <= 8; i++) { const t = i / 8; g.push(`<circle cx="${f(cx - cw + 2 * cw * t)}" cy="${f(cy0 + 8 + Math.sin(Math.PI * t) * 5)}" r="3.5" fill="${edgeC}" filter="url(#${id}wash)"/>`); }
    g.push(cloth(`M ${f(cx - cw)} ${cy0 - 2} Q ${cx} ${cy0 + 8} ${f(cx + cw)} ${cy0 - 2} L ${f(cx + cw)} ${cy0 + 4} Q ${cx} ${cy0 + 14} ${f(cx - cw)} ${cy0 + 4} Z`, band));
    if (c.collar === 'crochet-white' && !back) {
      const fx = cx + 13, fy = cy0 + 10;
      for (let k = 0; k < 5; k++) { const a = (k / 5) * Math.PI * 2 - Math.PI / 2; g.push(`<circle cx="${f(fx + Math.cos(a) * 5)}" cy="${f(fy + Math.sin(a) * 5)}" r="3.7" fill="#eab949" filter="url(#${id}wash)"/>`); }
      g.push(`<circle cx="${fx}" cy="${fy}" r="2.5" fill="#d9822f"/>`);
    }
  } else if (c.collar === 'bandana') {
    g.push(cloth(`M ${f(cx - cw)} ${cy0} Q ${cx} ${cy0 + 7} ${f(cx + cw)} ${cy0} L ${cx} ${cy0 + 20} Z`, '#9dbfd9'));
  }
  if (outfit === 'bowtie' && !back) g.push(cloth(`M ${cx} ${cy0 + 8} l -14 -8 v 16 Z M ${cx} ${cy0 + 8} l 14 -8 v 16 Z`, '#c9524b'));
  if (outfit === 'scarf') g.push(cloth(`M ${f(cx - cw - 6)} ${cy0 - 4} Q ${cx} ${cy0 + 8} ${f(cx + cw + 6)} ${cy0 - 4} L ${f(cx + cw + 6)} ${cy0 + 7} Q ${cx} ${cy0 + 20} ${f(cx - cw - 6)} ${cy0 + 7} Z`, '#cc645a') + (back ? '' : cloth(`M ${cx + 8} ${cy0 + 9} h 13 v 30 h -13 Z`, '#b9544b')));
  if (outfit === 'dance' && !back) g.push(`<circle cx="${cx - 16}" cy="${cy0 + 12}" r="8" fill="#d9605a" filter="url(#${id}wash)"/><circle cx="${cx - 16}" cy="${cy0 + 12}" r="3" fill="#e8b84a"/>`);
  if (outfit === 'xiaoer') g.push(back ? cloth(`M ${f(cx + bw * 0.55)} ${cy0 + 2} q 15 2 16 13 l -4 26 h -12 Z`, '#fbf9f4') : cloth(`M ${f(cx - bw * 0.55)} ${cy0 + 2} q -15 2 -16 13 l 4 26 h 12 Z`, '#fbf9f4'));
  if (outfit === 'chef') {
    const t0 = headTop + 2;
    g.push(cloth(`M ${cx - 24} ${t0 + 4} C ${cx - 44} ${t0 - 12}, ${cx - 26} ${t0 - 40}, ${cx - 8} ${t0 - 30} C ${cx - 2} ${t0 - 46}, ${cx + 22} ${t0 - 42}, ${cx + 14} ${t0 - 26} C ${cx + 36} ${t0 - 34}, ${cx + 42} ${t0 - 8}, ${cx + 24} ${t0 + 4} Z`, '#fbfaf6'));
    g.push(cloth(`M ${cx - 25} ${t0 + 1} Q ${cx} ${t0 - 4} ${cx + 25} ${t0 + 1} L ${cx + 25} ${t0 + 12} Q ${cx} ${t0 + 7} ${cx - 25} ${t0 + 12} Z`, '#fbfaf6'));
  }

  // ---- 脸 ----
  if (!back) {
    const ey = hy + 5, ex = hw * 0.4, big = c.pupil === 'big';
    // 腮红
    for (const s of [-1, 1]) g.push(`<ellipse cx="${f(cx + s * hw * 0.6)}" cy="${ey + 13}" rx="8.5" ry="5" fill="#ee9d98" opacity="0.42" filter="url(#${id}soft)"/>`);
    // 眉毛：括号眉（竖着的「( )」）或豆豆眉
    if (c.brows === 'bracket') for (const s of [-1, 1]) {
      const bx = cx + s * ex * 0.92, by = ey - 18;
      g.push(inkG(inkPath(brush(quadPts(P(bx - s * 1.6, by - 7), P(bx + s * 3.8, by), P(bx - s * 1.6, by + 7)), 2.8), 0.78)));
    } else if (c.brows) for (const s of [-1, 1]) {
      const bx = cx + s * ex * 0.95, by = ey - 17;
      g.push(`<ellipse cx="${f(bx)}" cy="${by}" rx="4.8" ry="3.2" transform="rotate(${s * -15} ${f(bx)} ${by})" fill="${INK}" opacity="0.55" filter="url(#${id}soft)"/>`);
      g.push(`<ellipse cx="${f(bx)}" cy="${by}" rx="3.6" ry="2.3" transform="rotate(${s * -15} ${f(bx)} ${by})" fill="${INK}" opacity="0.5"/>`);
    }
    // 眼睛：圆圆的，大瞳孔，两个高光
    for (const s of [-1, 1]) {
      const x = cx + s * ex, col = s === 1 ? c.eye2 : c.eye;
      const ew = big ? 10.2 : 9.4, eh = big ? 10 : 9.2;
      if (opts.blink) { g.push(inkG(inkPath(brush(quadPts(P(x - ew, ey + 1), P(x, ey - 6), P(x + ew, ey + 1)), 2.8)))); continue; }
      g.push(`<clipPath id="${id}e${s + 1}"><ellipse cx="${f(x)}" cy="${ey}" rx="${ew}" ry="${eh}"/></clipPath>`);
      g.push(`<g clip-path="url(#${id}e${s + 1})"><rect x="${x - 14}" y="${ey - 14}" width="28" height="28" fill="${col}"/><ellipse cx="${f(x)}" cy="${f(ey + 5)}" rx="9" ry="5" fill="#ffffff" opacity="0.22" filter="url(#${id}soft)"/>`
        + (c.pupil === 'sleepy' ? `<circle cx="${f(x + s * 0.6)}" cy="${f(ey + 3)}" r="3.2" fill="#1c1513"/><rect x="${x - 14}" y="${ey - 14}" width="28" height="${f(13.5)}" fill="${fur}"/>`
        : `<ellipse cx="${f(x + s * 0.3)}" cy="${f(ey + 0.3)}" rx="${big ? 7 : 4.6}" ry="${big ? 8.2 : 7.4}" fill="#1c1513"/>`)
        + (c.pupil === 'sleepy' ? `<circle cx="${f(x - 0.6)}" cy="${f(ey + 2)}" r="1.1" fill="#fff"/></g><path d="M ${f(x - ew - 1)} ${f(ey - 0.4)} Q ${f(x)} ${f(ey + 1.6)} ${f(x + ew + 1)} ${f(ey - 0.4)}" stroke="${INK}" stroke-width="2.6" fill="none" stroke-linecap="round" opacity="0.85"/>`
        : `<circle cx="${f(x - 3.2)}" cy="${f(ey - 3.6)}" r="${big ? 2.9 : 2.5}" fill="#fff"/><circle cx="${f(x + 3)}" cy="${f(ey + 3.4)}" r="1.3" fill="#fff" opacity="0.9"/></g>`));
      g.push(inkG(inkPath(brush(sample([segC(P(x - ew - 1.5, ey + 2), P(x - ew, ey - eh * 1.3), P(x + ew, ey - eh * 1.3), P(x + ew + 1.5, ey + 1))], 16), 3, { bias: s === 1 ? 0.62 : 0.38 })) + inkPath(brush(sample([segC(P(x - ew + 2, ey + eh * 0.6), P(x - ew * 0.4, ey + eh * 1.15), P(x + ew * 0.4, ey + eh * 1.15), P(x + ew - 2, ey + eh * 0.6))], 12), 1.1), 0.45)));
    }
    const ny = hy + 18;
    g.push(`<path d="M ${cx - 3.6} ${ny} h 7.2 l -3.6 3.8 Z" fill="#d08a85"/>`);
    g.push(inkG(inkPath(brush(quadPts(P(cx, ny + 3.6), P(cx - 2.5, ny + 8.5), P(cx - 7.5, ny + 6.5)), 1.6), 0.8) + inkPath(brush(quadPts(P(cx, ny + 3.6), P(cx + 2.5, ny + 8.5), P(cx + 7.5, ny + 6.5)), 1.6), 0.8)
      + [-1, 1].map((s) => [0, 1].map((k) => inkPath(brush(quadPts(P(cx + s * 16, ny + 3 + k * 4), P(cx + s * 28, ny + 1 + k * 5), P(cx + s * 38, ny + k * 7)), 1.0, { wMin: 0.15, bias: 0.25 }), 0.42)).join('')).join('')));
  }

  const scale = c.kitten ? `transform="translate(100 210) scale(0.78) translate(-100 -210)"` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 220" width="${opts.w || 200}" height="${opts.h || 220}"><g ${scale}>${g.join('')}</g></svg>`;
}

if (typeof module !== 'undefined') module.exports = { catSVG, buildCat, presetCat, CATS, CUSTOMER_LOOKS, FURS, PATTERNS, EYES, EYES2, BUILDS, TUFTS, COLLARS, OUTFITS, mix };
