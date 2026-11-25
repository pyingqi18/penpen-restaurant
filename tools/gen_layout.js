// 从现有代码里的坐标生成第一版 layout.json（之后手改 layout.json 本身）
const fs = require('fs');
const r = (n) => Math.round(n);
const K = (y) => Math.max(0.7, Math.min(0.95, 0.7 + (y - 380) * 0.0009));
const TW = { 2: 124, 4: 176 };
const SEATS = { 2: [[0, -30], [0, 54]], 4: [[-44, -30], [44, -30], [-44, 54], [44, 54]] };
// D-006（主人 11/25 实机看后）：桌子可以更靠窗，窗户不必完全无遮挡 → 后排上移 48、前排上移 32，中间过道和底边都更宽
const BACK = -48, FRONT = -32;
const TABLES = [{ id: 1, cx: 505, cy: 440 + BACK, size: 2 }, { id: 2, cx: 545, cy: 628 + FRONT, size: 2 }, { id: 3, cx: 745, cy: 438 + BACK, size: 4 }, { id: 4, cx: 815, cy: 628 + FRONT, size: 4 }, { id: 5, cx: 985, cy: 440 + BACK, size: 2 }];
const rect = (x, y, w, h) => [[x, y], [x + w, y], [x + w, y + h], [x, y + h]].map((p) => p.map(r));
const ellipse = (cx, cy, rx, ry, n = 48) => { const f = 1 / Math.cos(Math.PI / n); return Array.from({ length: n }, (_, i) => [+(cx + rx * f * Math.cos(i / n * 2 * Math.PI)).toFixed(1), +(cy + ry * f * Math.sin(i / n * 2 * Math.PI)).toFixed(1)]); }; // 外切 48 边形，和原来的椭圆碰撞格完全一致
const HITS = { 1: { x: 424, y: 345 + BACK, w: 224, h: 168 }, 2: { x: 454, y: 514 + FRONT, w: 246, h: 205 }, 3: { x: 650, y: 343 + BACK, w: 259, h: 170 }, 4: { x: 702, y: 514 + FRONT, w: 296, h: 205 }, 5: { x: 911, y: 345 + BACK, w: 223, h: 168 } }; // G-003 的点按区跟着桌子平移
const items = [];
for (const t of TABLES) {
  const k = K(t.cy + 40), hw = TW[t.size] / 2 * k, rx = hw + 22, ry = 70 * k;
  items.push({ id: `table.${t.id}`, kind: 'table', seats: t.size, anchor: [t.cx, t.cy],
    hit: HITS[t.id], // G-003：五块桌区互不重叠，保住右边状态牌
    stand: [[r(t.cx + hw + 40), r(t.cy + 30)]],
    footprint: ellipse(t.cx, t.cy + 12, rx, ry),
    seatPos: SEATS[t.size].map(([dx, dy]) => [r(t.cx + dx * k), r(t.cy + dy * k)]),
    chip: [r(t.cx + hw + 10), r(t.cy - 44 * k)], scale: +k.toFixed(3) });
}
// D-006：主人说候位「略挤略小」→ 从左下（队首）往右上门口排成斜线，每组错开 62×48；人数牌挂在每组左上，不压别组
[[1050, 690], [1112, 642], [1174, 594], [1236, 546]].forEach(([x, y], i) => { const x0 = x - 50; items.push({ id: `queue.${i + 1}`, kind: 'queue', anchor: [x, y], stand: [[x, y]], hit: { x: x0, y: y - 100, w: Math.min(100, 1280 - x0), h: 120 }, card: { x: x - 118, y: y - 95, w: 68, h: 50 } }); }); // card = 人数牌（G-006：牌子也能点）
// G-003：门的画面锚点不动，进出站位移到室内门槛下侧
items.push({ id: 'door', kind: 'door', anchor: [1162, 396], stand: [[1162, 413]], hit: { x: 1120, y: 250, w: 100, h: 160 } });
const WARES = { wok: [62, 404], pot: [150, 400], steamer: [254, 388], clay: [332, 388] };
for (const [w, [x, y]] of Object.entries(WARES)) items.push({ id: `stove.${w}`, kind: 'stove', anchor: [x, y], hit: { x: x - 34, y: y - 50, w: 68, h: 60 } });
items.push({ id: 'chef', kind: 'chef', anchor: [150, 376], stand: [[150, 376]], range: [[70, 376], [395, 376]], wash: [395, 376], note: '老大在灶台后左右移动；主人 11/25：老大要能直接够到洗碗池 → 灶台后的走道一直通到洗碗池后面，洗碗时站 395' });
items.push({ id: 'pass', kind: 'pass', anchor: [260, 510], slots: [[292, 466], [276, 488], [260, 510], [244, 532], [228, 554]], stand: [[408, 520]], hit: { x: 200, y: 440, w: 140, h: 140 } });
items.push({ id: 'sink', kind: 'sink', anchor: [410, 370], stand: [[414, 428]], hit: { x: 374, y: 320, w: 72, h: 62 } /* G-006：对准台体，不压桌 1 */, footprint: rect(374, 330, 72, 52) });
items.push({ id: 'rail', kind: 'rail', anchor: [335, 276], line: [[232, 276], [438, 276]], hit: { x: 222, y: 250, w: 226, h: 70 } });
items.push({ id: 'menurack', kind: 'menurack', anchor: [1056, 166], hit: { x: 1010, y: 100, w: 92, h: 120 } });
items.push({ id: 'tea', kind: 'tea', anchor: [206, 596], stand: [[372, 600]], hit: { x: 140, y: 540, w: 140, h: 90 }, vessels: [[22, 586], [54, 586], [86, 586], [118, 588], [150, 588]] });
items.push({ id: 'teacart', kind: 'tea', anchor: [375, 712], stand: [[375, 660]], hit: { x: 305, y: 610, w: 140, h: 110 }, footprint: rect(311, 662, 128, 60), needs: ['tea', 'snack'], note: '茶车：买了茶台或点心柜才出现、才挡路（G-003）；D-006 从右下角挪到茶水台旁，把右下角让给候位' });
items.push({ id: 'idle.penpen', kind: 'idle', anchor: [712, 526], stand: [[712, 526]] });
items.push({ id: 'staff.laoer', kind: 'staff', stand: [[450, 560]], rest: [470, 690] });
items.push({ id: 'staff.mimi', kind: 'staff', stand: [[960, 712]], rest: [1180, 700] });
// 不能走的地方
items.push({ id: 'wall.back', kind: 'wall', footprint: rect(0, 0, 1280, 340), note: '后墙和窗下' });
items.push({ id: 'wall.kitchen', kind: 'wall', footprint: [[0, 348], [208, 348], [382, 355], [377, 450], [358, 450], [358, 608], [248, 796], [0, 796]], note: '灶台、出菜台、茶水台' });
items.push({ id: 'wall.kitchen-top', kind: 'wall', footprint: rect(0, 0, 380, 460), note: '厨房上半' });
items.push({ id: 'wall.door-side', kind: 'wall', footprint: rect(1188, 350, 92, 142), note: '门右侧墙' });
const L = { version: 1, space: { w: 1280, h: 720 },
  source: { image: 'assets/01-restaurant/room_courtyard.png', w: 1536, h: 1024, crop: { x: 0, y: 60, w: 1536, h: 864 } },
  presets: { two: ['table.1', 'table.3'], five: ['table.1', 'table.2', 'table.3', 'table.4', 'table.5'] },
  notes: '坐标都是 1280×720 游戏坐标；源图 = (x×1.2, y×1.2+60)。footprint 是地面多边形（碰撞），stand 是站位，hit 是点按区，anchor 是画的位置。',
  items };
const head = { ...L }; delete head.items;
const txt = JSON.stringify(head, null, 2).replace(/\n\}$/, ',\n  "items": [\n' + items.map((it) => '    ' + JSON.stringify(it)).join(',\n') + '\n  ]\n}');
fs.writeFileSync(process.argv[2], txt + '\n'); JSON.parse(txt);
console.log(items.length, 'items');
