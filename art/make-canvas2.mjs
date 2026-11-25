// 给设计画布加两块画板：角色定稿 + 盆盆捏猫示例
import fs from 'fs';
const root = '/home/claude/penpen/canvas/project';
const W = 1360, H = 420;
const boards = [
  { file: 'Cast.dc.html', title: 'B 版定稿 · 角色', desc: '更圆、更短手短脚，往《猫咪和汤》靠；老大超胖、豆豆眉、大瞳孔。',
    cells: [['031ba52f72e50dfcbdd1fe862b3c79f9', '老大', '厨师'], ['688e685861286445a84f5c5ecf165184', '老二', '店小二（毛巾+短围裙）'],
      ['5b6bdfde1c8c0e424d9f2119112f9f58', '老二', '背面（往里走时）'], ['c8022705a6a0b1b802e81cf11c6d1172', '咪咪', '小帮工'],
      ['12b88ab035af5fea5b89496e5132194a', '阿橘', '远行的旅人（暂定）'], ['de2d94504db6e45baa2ffc34f3f1c53a', '盆盆', '主角 · 默认长相'] ] },
  { file: 'Penpen.dc.html', title: '盆盆捏猫示例', desc: '新建存档时自己捏：毛色 6 种 × 花纹 4 种 × 眼睛 4 种 × 体型 3 种，加豆豆眉、大瞳孔、项圈；衣服逐步解锁。',
    cells: [['dde6865a95a183de4e600cc90e766976', '奶牛猫', '红领结（第 3 天解锁）'], ['e69041fcfbab12a927f1df2300f494a6', '三花 · 超胖', '广场舞红绸（第 8 天）'],
      ['b820531676851523eb48041099320d17', '灰虎斑 · 苗条', '毛线围巾（8 颗星）'], ['4f8b398fdd0b464740f88d894edf6576', '黑猫 · 大瞳孔', '粉围裙（初始）'],
      ['a7c04cf225536aacdf709aa7d0b30e68', '橘猫 · 超胖', '店小二装（第 5 天）'], ['45b3a42aa3197441e9b88ce864ab9b91', '三花', '背面'] ] },
];
for (const b of boards) {
  const cards = b.cells.map(([blob, n, r]) => `
<div style="display: flex; flex-direction: column; align-items: center; gap: 4px; background: #fffaf2; border-radius: 20px; padding: 12px 6px 14px">
<img src="/_blob/${blob}" alt="${n}，${r}" style="width: 190px; height: 209px">
<div style="font-size: 20px; font-weight: 700; color: #4d3b2f">${n}</div>
<div style="font-size: 14px; color: #6e5a4b; text-align: center">${r}</div>
</div>`).join('');
  fs.writeFileSync(`${root}/${b.file}`, `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<title>盆盆餐厅 ${b.title}</title>
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
<h1 style="margin: 0; font-size: 30px; color: #4d3b2f; white-space: nowrap">${b.title}</h1>
<p style="margin: 0; font-size: 16px; line-height: 1.5; color: #6e5a4b">${b.desc}</p>
</div>
<div style="display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 14px">${cards}
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
`);
}
const idx = JSON.parse(fs.readFileSync(`${root}/canvas.json`, 'utf8'));
idx.boards['Cast.dc.html'] = { x: 1520, y: 0, w: W, h: H, title: 'B 版定稿 · 角色' };
idx.boards['Penpen.dc.html'] = { x: 1520, y: 540, w: W, h: H, title: '盆盆捏猫示例' };
for (const f of ['Cast.dc.html', 'Penpen.dc.html']) if (!idx.order.includes(f)) idx.order.push(f);
idx.notes.pick.text = '已选 B 版。右边是按你的意见改的定稿：老大当厨师、老二当店小二、盆盆是可以自己捏的主角。';
fs.writeFileSync(`${root}/canvas.json`, JSON.stringify(idx, null, 2));
console.log('ok');
