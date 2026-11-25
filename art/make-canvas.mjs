// 生成设计画布的三个画板文件 + canvas.json
import fs from 'fs';
const root = '/home/claude/penpen/canvas/project';
fs.mkdirSync(root, { recursive: true });

const blobs = {
  soft: ['1745ac3e055871b3c7ac258c3b5b7fc6', '95a33d8f9c6501a9a9a1e79949bfbb60', '488fbf6288708c186550c0dc2d846fdf', 'e0490a316ca395fabfd0cb77f85c7acc'],
  flat: ['3c8cd7b7b80f8eb5d3bb98215e9a9b9e', 'bf39fc5242b9be71cbf1ee1b878965fd', 'a65bf09805cceeecddadad5399a2e79c', '2e38bc29655940cf2e39f3ffa1461e2b'],
  book: ['f870da6fed891aee42c9bc0facb92ed6', 'a11b9c2976fdc3559bc66faa60af263f', 'ffdc768bab1438fdd29896c843d73ecb', 'ee6e42a04eef9daea0b92121de43ad31'],
};
const labels = [['老大', '店长 · 正面'], ['老二', '主厨 · 正面'], ['咪咪', '小帮工 · 正面'], ['老大', '店长 · 背面（往里走时）']];
const boards = [
  { file: 'Main.dc.html', key: 'soft', title: 'A 软萌描边', desc: '深棕色圆润描边、粉彩配色、豆豆眼加腮红。最接近《猫咪和汤》的气质，缩小后轮廓依然清楚。' },
  { file: 'StyleB.dc.html', key: 'flat', title: 'B 扁平无描边', desc: '不描边，靠色块和淡阴影区分层次；保留琥珀色、绿色的真实眼睛颜色，更像家里的猫本猫。' },
  { file: 'StyleC.dc.html', key: 'book', title: 'C 绘本手绘', desc: '细线条带一点手抖感，像儿童绘本插画；也保留了真实眼睛颜色。' },
];
const W = 1040, H = 420;

for (const b of boards) {
  const cards = labels.map(([n, r], i) => `
<div style="display: flex; flex-direction: column; align-items: center; gap: 6px; background: #fffaf2; border-radius: 20px; padding: 12px 8px 14px">
<img src="/_blob/${blobs[b.key][i]}" alt="${n}，${r}" style="width: 200px; height: 220px">
<div style="font-size: 20px; font-weight: 700; color: #4d3b2f">${n}</div>
<div style="font-size: 15px; color: #6e5a4b">${r}</div>
</div>`).join('');
  const html = `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<title>盆盆餐厅 猫猫画风 ${b.title}</title>
<script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;700&amp;display=swap" rel="stylesheet">
<style>
body{margin:0}
a{color:#8a5a3c}a:hover{color:#5e3b25}
</style>
</helmet>
<div style="width: ${W}px; height: ${H}px; box-sizing: border-box; padding: 28px 32px; background: #f8ecd9; font-family: 'Noto Sans SC', sans-serif; display: flex; flex-direction: column; gap: 18px">
<div style="display: flex; align-items: baseline; gap: 20px">
<h1 style="margin: 0; font-size: 30px; color: #4d3b2f">${b.title}</h1>
<p style="margin: 0; font-size: 16px; line-height: 1.5; color: #6e5a4b">${b.desc}</p>
</div>
<div style="display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 16px">${cards}
</div>
</div>
</x-dc>
<script type="text/x-dc" data-dc-script data-props='{"$preview":{"width":${W},"height":${H}}}'>
class Component extends DCLogic {
renderVals() {
return {};
}
}
</script>
</body>
</html>
`;
  fs.writeFileSync(`${root}/${b.file}`, html);
}

const canvas = {
  v: 3,
  createdOnFiles: { v: 1, at: new Date().toISOString().replace(/\.\d+Z$/, 'Z') },
  title: '盆盆餐厅 · 猫猫画风样图',
  launch: { view: 'canvas' },
  pages: [],
  boards: Object.fromEntries(boards.map((b, i) => [b.file, { x: 0, y: i * (H + 120), w: W, h: H, title: b.title }])),
  order: boards.map((b) => b.file),
  notes: {
    pick: { x: W + 80, y: 0, w: 300, text: '挑一版画风：可以在喜欢的那版上留评论，或者直接告诉我「要 A，但眼睛用 B 的」这样混搭。', size: 'm', fill: 'orange' },
  },
  designSystems: [],
};
fs.writeFileSync(`${root}/canvas.json`, JSON.stringify(canvas, null, 2));
console.log('ok');
