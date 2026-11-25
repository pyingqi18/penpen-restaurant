// 把画猫函数和游戏代码内联进一个 index.html
const fs = require('fs');
const path = require('path');
const dir = __dirname;
const cats = fs.readFileSync(path.join(dir, '../art/cats.js'), 'utf8') + '\n' + fs.readFileSync(path.join(dir, '../art/scene.js'), 'utf8') + '\n' + fs.readFileSync(path.join(dir, '../art/world.js'), 'utf8') + '\n' + fs.readFileSync(path.join(dir, '../art/room.js'), 'utf8') + '\n' + fs.readFileSync(path.join(dir, '../art/icons.js'), 'utf8');
const game = fs.readFileSync(path.join(dir, 'game.js'), 'utf8');
const tpl = fs.readFileSync(path.join(dir, 'template.html'), 'utf8');
// GPT 美术：assets/*.webp 原样拷到 dist/assets，尺寸表内联进页面
const adir = path.join(dir, 'assets');
const man = fs.existsSync(path.join(adir, 'manifest.json')) ? fs.readFileSync(path.join(adir, 'manifest.json'), 'utf8') : '{}';
const lay = fs.existsSync(path.join(dir, 'layout.json')) ? JSON.stringify(JSON.parse(fs.readFileSync(path.join(dir, 'layout.json'), 'utf8'))) : 'null';
const page = (grey) => tpl.replace('/*CATS_JS*/', () => 'const ART_MANIFEST = ' + man.replace(/\s+/g, '') + ';\n' + cats)
  .replace('/*GAME_JS*/', () => `const PENPEN_LAYOUT = ${lay};\nconst PENPEN_GREYBOX = ${grey};\n` + game);
const out = page(false), grey = page(true); // 正式版 index.html；灰盒单独入口 greybox.html
fs.mkdirSync(path.join(dir, 'dist/assets'), { recursive: true });
if (fs.existsSync(adir)) for (const f of fs.readdirSync(adir)) if (f.endsWith('.webp')) fs.copyFileSync(path.join(adir, f), path.join(dir, 'dist/assets', f));
fs.mkdirSync(path.join(dir, 'dist'), { recursive: true });
fs.writeFileSync(path.join(dir, 'dist/index.html'), out);
fs.writeFileSync(path.join(dir, 'dist/greybox.html'), grey);
console.log('built', (out.length / 1024).toFixed(1) + ' KB');
