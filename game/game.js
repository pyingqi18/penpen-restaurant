// 盆盆餐厅 · 试玩版（横屏 1280×720 逻辑分辨率，Canvas + HTML 界面）
// 依赖：catSVG（由构建脚本从 art/cats.js 内联进来）
(() => {
  'use strict';
  const W = 1280, H = 720, TS = 40, COLS = W / TS, ROWS = H / TS;
  const SUZHOU = typeof PENPEN_SUZHOU !== 'undefined' && PENPEN_SUZHOU;
  const SUZHOU_PREVIEW = SUZHOU && typeof PENPEN_SUZHOU_PREVIEW !== 'undefined' && PENPEN_SUZHOU_PREVIEW;
  const PREVIEW_SEASON = SUZHOU_PREVIEW && new URLSearchParams(window.location.search).get('season');
  let gardenMode = false;
  let yardMode = false;
  const SUZHOU_RELEASE = 'G068';
  const DAY_LEN = SUZHOU ? 230 : 150; // 每天营业秒数
  const cv = document.getElementById('game');
  const ctx = cv.getContext('2d');
  const stage = document.getElementById('stage');
  const ui = document.getElementById('ui');
  const $ = (s) => document.querySelector(s);
  let scale = 1;
  const dpr = Math.min(window.devicePixelRatio || 1, 3);

  // T-01（D-005）：界面层不再跟着场景一起缩。界面铺满安全区（手机横屏两侧的空白也能放按钮），
  // 缩放取 uiScale = max(场景缩放, UI_MIN)，所以小屏上字和按钮比场景大一些；UW×UH 是界面层的逻辑尺寸。
  const UI_MIN = 0.66; // 22–24 px 的字在 844×390 上约 15–16 CSS px（主人 D-006：字「还行」，不放特别大）
  let uiScale = 1, UW = W, UH = H, OX = 0, OY = 0, SX = 0, SY = 0; // SX/SY：中间 16:9 场景在画布里的偏移（CSS px），两侧画延伸背景（T-15 / D-009 全屏）
  const toUI = (x, y) => ({ x: (OX + x * scale) / uiScale, y: (OY + y * scale) / uiScale }); // 场景坐标 → 界面坐标
  function resize() {
    const vw = window.innerWidth, vh = window.innerHeight, cs = getComputedStyle(document.body);
    const pl = parseFloat(cs.paddingLeft) || 0, pr = parseFloat(cs.paddingRight) || 0, pt = parseFloat(cs.paddingTop) || 0, pb = parseFloat(cs.paddingBottom) || 0;
    const aw = Math.max(200, vw - pl - pr), ah = Math.max(150, vh - pt - pb);


    const stageHeight = gardenMode ? LAYOUT.scene.height : H;
    const visibleHeight = gardenMode ? stageHeight - 26 : yardMode ? 590 : stageHeight;
    scale = Math.min(aw / W, ah / visibleHeight);
    SX = pl + (aw - W * scale) / 2;
    const topRatio = yardMode && ah < stageHeight * scale ? 0.16 : 0.5;
    SY = pt + (ah - stageHeight * scale) * topRatio;
    stage.style.width = vw + 'px';
    stage.style.height = vh + 'px';
    cv.width = Math.round(vw * dpr);
    cv.height = Math.round(vh * dpr);
    uiScale = Math.max(scale, UI_MIN); UW = aw / uiScale; UH = ah / uiScale;
    const sr = stage.getBoundingClientRect(); OX = sr.left - pl + SX; OY = sr.top - pt + SY;
    Object.assign(ui.style, { left: pl + 'px', top: pt + 'px', width: UW + 'px', height: UH + 'px', transform: 'scale(' + uiScale + ')' });
    placeTeaMenu(); fitPanels();
    document.getElementById('rotate').style.display = vh > vw ? 'flex' : 'none';
  }
  window.addEventListener('resize', resize);
  window.addEventListener('orientationchange', () => setTimeout(resize, 200));
  window.visualViewport?.addEventListener('resize', resize);
  document.addEventListener('fullscreenchange', resize);

  // ---------- 声音（点一下后才能播放） ----------
  let actx = null;
  function beep(freq = 660, dur = 0.08, type = 'sine', vol = 0.06) {
    try {
      if (!actx) actx = new (window.AudioContext || window.webkitAudioContext)();
      const o = actx.createOscillator(), g = actx.createGain();
      o.type = type; o.frequency.value = freq; g.gain.value = vol;
      o.connect(g); g.connect(actx.destination);
      const t = actx.currentTime;
      g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.start(t); o.stop(t + dur + 0.02);
    } catch (e) { /* 没声音也不影响 */ }
  }
  const sfx = {
    tap: () => beep(720, 0.05),
    coin: () => { beep(988, 0.07, 'triangle'); setTimeout(() => beep(1319, 0.1, 'triangle'), 70); },
    bad: () => beep(220, 0.18, 'sawtooth', 0.04),
    ding: () => beep(1175, 0.12, 'triangle'),
    dance: () => [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => beep(f, 0.1, 'square', 0.03), i * 110)),
  };

  // ---------- 图片 ----------
  // GPT 生成的美术（assets/*.webp）；没加载出来的就先用程序画的顶上
  const ART = (typeof ART_MANIFEST !== 'undefined') ? ART_MANIFEST : {};
  const IMGS = {};
  const PAINTED = new WeakSet(); // 水墨绘本角色图（脚底在 0.876 处、朝右）
  const A = (k) => { if (!ART[k]) return null; if (!IMGS[k]) { const i = new Image(); i.src = 'assets/' + k + '.webp'; IMGS[k] = i; if (/^(s_|aju_|g_)/.test(k)) PAINTED.add(i); } return IMGS[k]; };
  const ok = (im) => im && im.complete && im.naturalWidth > 0;
  // 精灵：按底部中心放，给宽度（或高度）缩放
  function spr(k, x, by, w, opt = {}) {
    const im = A(k); if (!ok(im)) return false;
    const m = ART[k], h = opt.h || (w * m.h / m.w), ww = opt.h ? opt.h * m.w / m.h : w;
    ctx.save(); if (opt.alpha != null) ctx.globalAlpha = opt.alpha;
    if (opt.flip) { ctx.translate(x, 0); ctx.scale(-1, 1); ctx.drawImage(im, -ww / 2, by - h, ww, h); } else ctx.drawImage(im, x - ww / 2, opt.top ? by : by - h, ww, h);
    ctx.restore(); return true;
  }
  const svgImg = (svg) => { const i = new Image(); i.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg); return i; };
  const BIG = { w: 400, h: 440 };
  const SPR = {
    chef: svgImg(catSVG('laoda', 'front', BIG)),
    dancer: svgImg(catSVG('shuai', 'front', BIG)),
    vendor: svgImg(catSVG({ fur: 'white', pattern: 'calico', eye: 'amber', build: 'chonk', collar: 'bandana', outfit: 'apron' }, 'front', BIG)),
    pF: null, pB: null, pBlink: null,
  };
  let ROOM = svgImg(roomSVG2()), CUR_SE = 'spring'; const ROOM_FG = svgImg(roomFgSVG()), TABLE2 = svgImg(tableSVG2(2)), TABLE4 = svgImg(tableSVG2(4));
  const DISH_IMG = {};
  for (const k of ['mapo', 'mian', 'chashao', 'xiajiao', 'gongbao', 'dandan', 'baozai', 'shuizhu', 'qingzheng', 'dirty', 'tea', 'snack', 'water']) DISH_IMG[k] = svgImg(dishSVG(k));
  DISH_IMG.guihua = DISH_IMG.snack;
  const WARE_IMG = {}; for (const k of ['wok', 'pot', 'steamer', 'clay']) WARE_IMG[k] = svgImg(cookwareSVG(k));
  const ING_IMG = {}; for (const k of ['tofu', 'beef', 'pork', 'chili', 'peanut', 'shrimp', 'egg', 'fish', 'rice', 'tealeaf']) ING_IMG[k] = svgImg(ingSVG(k));
  const ICON_IMG = {}; const icon = (k) => ICON_IMG[k] || (ICON_IMG[k] = svgImg(iconSVG(k)));
  const FISH_IMG = {}; const fishImg = (k) => FISH_IMG[k] || (FISH_IMG[k] = svgImg(fishSVG(k)));
  const CROP_IMG = {}; for (const k of ['chili', 'peanut']) { CROP_IMG[k + 1] = svgImg(cropSVG(k, true)); CROP_IMG[k + 0] = svgImg(cropSVG(k, false)); }
  const MAP_SPR = !!ART.m_shop;
  let WORLD_IMG = svgImg(worldSVG('spring', MAP_SPR));
  function setSeason(se) {
    if (PREVIEW_SEASON && Object.hasOwn(SEASONS, PREVIEW_SEASON)) se = PREVIEW_SEASON;
    if (se === CUR_SE) return;
    CUR_SE = se; WORLD_IMG = svgImg(worldSVG(se, MAP_SPR)); WORLD_CV = null; ROOM = svgImg(roomSVG2(se));
  }
  const CUST_IMG = {};
  const custImg = (id) => CUST_IMG[id] || (CUST_IMG[id] = svgImg(catSVG(id, 'front', dressedFallback(id))));
  const custBack = {};
  // D-021：水墨绘本客人（每种 4–5 位，站姿排队、坐姿入座）；文件 assets/g_<物种>_<名字>_<stand|sit>.webp
  const GUEST_ART = { neko: ['orange', 'persian', 'calico', 'cow', 'black'], shiba: ['red', 'sesame', 'black_tan', 'cream'], bunny: ['lop', 'agouti', 'point', 'pied'], raccoon: ['gray', 'cinnamon', 'silver', 'dark'], panda: ['broad', 'tall', 'compact', 'elder'], fox: ['red', 'arctic', 'silver', 'fennec'] };
  const GUEST_S = 118; // 客人画多大（原 146，主人嫌大）
  const guestKey = (lk, sit) => { const [t, n] = String(lk).split('#'), v = GUEST_ART[t]; return v ? `g_${t}_${v[(+n || 0) % v.length]}_${sit ? 'sit' : 'stand'}` : null; };
  const GUEST_INK_COLORS = {
    neko: ['#687ca1', '#99a381', '#997e91', '#aa9278', '#b7a077'],
    shiba: ['#648a9a', '#a78a5c', '#8295ac', '#b17a69'],
    bunny: ['#a48a9c', '#8399ab', '#b28675', '#9aa084'],
    raccoon: ['#7d9991', '#b3a083', '#98829d', '#a2ac87'],
    panda: ['#85919f', '#96a27a', '#b49a64', '#9c8296'],
    fox: ['#688c89', '#b5909f', '#8294b1', '#a17f8d'],
  };
  function dressedFallback(id) {
    const [species, variant = '0'] = id.split('#'), color = GUEST_INK_COLORS[species]?.[Number(variant)];
    return SUZHOU && color ? { ...BIG, uniform: color } : BIG;
  }
  function guestNativeName(look, pose) {
    const key = guestKey(look, false);
    return key && key.replace(/_stand$/, '_dressed_' + pose);
  }
  const GUEST_FRAMES = new Map();
  function guestFrames(look) {
    if (!GUEST_FRAMES.has(look)) {
      const faces = {};
      for (const pose of ['stand', 'walk', 'sit', 'rear', 'smile']) {
        const name = guestNativeName(look, pose);
        if (name) faces[pose] = gardenArt(name);
      }
      GUEST_FRAMES.set(look, faces);
    }
    return GUEST_FRAMES.get(look);
  }
  const guestLook = (c, i) => c.looks?.[i] || c.type.id;
  const guestSeatReady = (c) => c.looks.every((look, i) => {
    const frames = guestFrames(look);
    return ok(frames[c.table.seats[i].front ? 'rear' : 'sit']);
  });
  const custImgBack = (id) => custBack[id] || (custBack[id] = svgImg(catSVG(id, 'back', dressedFallback(id))));
  // D-022：伙计和盆盆换成水墨绘本图；灰盒或没图时仍用旧的 SVG 猫
  const P = (k) => { if (GREY) return null; const i = A(k); return ok(i) ? i : null; };
  const staffImg = (id) => P('s_' + id) || custImg(id);
  const charURL = (id) => (!GREY && ART['s_' + id] ? 'assets/s_' + id + '.webp' : dataURL(catSVG(id, 'front', { w: 120, h: 132 })));
  const LOOK0 = { eye2: 'same', tuft: 'none', pupil: 'normal', brows: '', ...CATS.penpen.look };
  const nv = (v) => (v === undefined || v === null || v === false || v === 0 || v === '0' ? '' : String(v));
  const plainLook = (lk) => Object.keys({ ...LOOK0, ...(lk || {}) }).every((k) => nv((lk || {})[k] ?? LOOK0[k]) === nv(LOOK0[k]));
  
  const penImg = (back, blink) => {
    if (SPR.pPaint && SUZHOU) {
      const pic = gardenArt('s_penpen_empty');
      if (ok(pic)) { PAINTED.add(pic); return pic; }
    } else if (SPR.pPaint && P('s_penpen')) return P('s_penpen');
    return back ? SPR.pB : blink ? SPR.pBlink : SPR.pF;
  };
  const AJU_AT = { snowpeak: 'snowpeak', aurora: 'snowpeak', karst: 'bamboo', river: 'arcade', huizhou: 'wave', autumn: 'autumn', sakura: 'sakura', hotspring: 'hotspring' };
  // D-030：剧情明信片按路线一定寄到；路上的「随手拍」随机寄（像旅行青蛙），图到了才会出现
  const pcURL = (id, v) => { const k = v ? `snap_${id}_${v}` : `pc_${id}`; return !GREY && ART[k] ? 'assets/' + k + '.webp' : v ? null : dataURL(postcardSVG(id)); };
  const SNAP_MSG = ['随手拍了一张。', '这里的风好舒服。', '走累了，歇一会儿。', '猜猜我在哪儿？', '路边看到的，寄给你们看看。', '又是好天气！', '这个角度你们没见过吧。', '差点没拍到！'];
  const snapsLeft = () => { const got = new Set((save.snaps || []).map((x) => x.id + ':' + x.v)), out = [];
    for (const id of save.cards || []) for (let v = 1; v <= 4; v++) if (ART[`snap_${id}_${v}`] && !got.has(id + ':' + v)) out.push({ id, v }); return out; };
  const snapOf = (m) => { const a = String(m || '').split(':'); return a[0] === 'snap' ? { id: a[1], v: +a[2] } : null; };
  const ajuURL = (id) => { const k = 'aju_' + (AJU_AT[id] || 'wave'); return !GREY && ART[k] ? 'assets/' + k + '.webp' : ''; };
  function buildPlayerSprites(look) {
    SPR.pPaint = plainLook(look); // 没捏过的盆盆用画好的图；捏过的保留自己的样子
    SPR.pF = svgImg(catSVG(look, 'front', BIG));
    SPR.pB = svgImg(catSVG(look, 'back', BIG));
    SPR.pBlink = svgImg(catSVG(look, 'front', { ...BIG, blink: true }));
    SPR.pWalk = SUZHOU && !SPR.pPaint ? ['front', 'back'].map((direction) =>
      [1, 0.35, -1, -0.35].map((stride) => svgImg(catSVG(look, direction, { ...BIG, stride })))) : null;
  }

  // ---------- 数据：炊具、食材、菜单 ----------
  // 同一种炊具一次只能做一道菜（排队），不同炊具可以同时开火
  const WARES = {
    wok: { n: '炒锅', x: 62, y: 404 }, pot: { n: '面锅', x: 150, y: 400 },
    steamer: { n: '蒸笼', x: 254, y: 388, up: 'steamer' }, clay: { n: '砂锅', x: 332, y: 388, up: 'clay' },
  };
  const ING = {
    tofu: { n: '豆腐', src: '早市', price: 4 }, beef: { n: '牛肉', src: '早市', price: 6 }, pork: { n: '叉烧肉', src: '早市', price: 6 },
    chili: { n: '辣椒', src: '菜地', price: 5 }, peanut: { n: '花生', src: '菜地', price: 4 },
    shrimp: { n: '鲜虾', src: '池塘', price: 7 }, fish: { n: '鲜鱼', src: '池塘', price: 8 }, egg: { n: '鸡蛋', src: '鸡舍', price: 4 },
    rice: { n: '糯米粉', src: '早市', price: 3 }, tealeaf: { n: '茶叶', src: '茶园', price: 9 },
  };
  // tops：最多两样可选配料 [名字, 默认放不放]
  const DISH = {
    mapo: { n: '麻婆豆腐', tags: ['麻', '辣', '肉'], price: 30, cook: 6, ware: 'wok', ing: 'tofu', tops: [['花椒', 1], ['葱花', 1]] },
    gongbao: { n: '宫保鸡丁', tags: ['辣', '甜', '肉', '花生'], price: 34, cook: 7, ware: 'wok', ing: 'chili', tops: [['花生', 1], ['干辣椒', 1]] },
    mian: { n: '清汤牛肉面', tags: ['面', '肉', '香菜'], price: 28, cook: 6, ware: 'pot', ing: 'beef', tops: [['香菜', 1], ['辣油', 0]] },
    dandan: { n: '担担面', tags: ['麻', '辣', '面', '花生'], price: 24, cook: 5, ware: 'pot', ing: 'peanut', tops: [['花生碎', 1], ['辣油', 1]] },
    xiajiao: { n: '虾饺', tags: ['海鲜', '清淡'], price: 26, cook: 5, ware: 'steamer', ing: 'shrimp', tops: [['醋', 0], ['辣油', 0]] },
    chashao: { n: '叉烧饭', tags: ['米饭', '肉', '甜'], price: 32, cook: 7, ware: 'clay', ing: 'pork', tops: [['青菜', 1], ['煎蛋', 0]] },
    baozai: { n: '煲仔饭', tags: ['米饭', '肉', '蛋', '清淡'], price: 36, cook: 8, ware: 'clay', ing: 'egg', tops: [['青菜', 1], ['腊肠', 1]] },
    shuizhu: { n: '水煮鱼', tags: ['麻', '辣', '海鲜'], price: 38, cook: 8, ware: 'wok', ing: 'fish', tops: [['花椒', 1], ['香菜', 1]] },
    qingzheng: { n: '清蒸鱼', tags: ['海鲜', '清淡'], price: 36, cook: 7, ware: 'steamer', ing: 'fish', tops: [['葱丝', 1], ['姜丝', 1]] },
    guihua: { n: '桂花糕', tags: ['甜', '清淡'], price: 16, cook: 4, ware: 'steamer', ing: 'rice', tops: [], dessert: true }, // 甜品：饭后加点
  };
  // ---------- 第一周成长节奏：每天只开放一点新东西（之后沿用第 7 天） ----------
  const PROG_ADD = {
    1: { title: '开张啦', tables: [1, 3], dishes: ['mapo', 'mian'], slots: 2, ings: ['tofu', 'beef'] },
    2: { title: '种菜', tables: [2], map: ['market', 'plot', 'mirror'], plots: 1, seeds: ['chili'], water: true },
    3: { title: '收菜 · 钓鱼', tables: [4], map: ['pond', 'mail'], plots: 2, seeds: ['peanut'], ings: ['chili', 'peanut'], dishes: ['gongbao'], slots: 3, staff: ['laoer'], dance: true },
    4: { title: '喝茶', plots: 3, map: ['tea'], ings: ['tealeaf'], drinks: ['jasmine'] },
    5: { title: '点心', tables: [5], map: ['coop'], wares: ['steamer'], drinks: ['plum', 'soy'], slots: 4, ings: ['rice', ...(SUZHOU ? ['shrimp'] : [])], dishes: SUZHOU ? ['xiajiao'] : [] },
    6: { title: '咪咪管外面', plots: 4, staff: ['mimi'], drinks: ['puer'], ings: ['pork'] },
    7: { title: '猫猫日报', slots: 5, news: true },
  };
  const TABLE_NUMBERS = Object.values(PROG_ADD).flatMap((entry) => entry.tables || []);
  const tableNumber = (id) => SUZHOU ? TABLE_NUMBERS.indexOf(id) + 1 || id : id;
  const PROG_CACHE = {};
  function prog(day = save ? save.day : 1) {
    day = Math.min(7, Math.max(1, day));
    if (PROG_CACHE[day]) return PROG_CACHE[day];
    const p = { tables: [], map: ['door'], plots: 0, seeds: [], dishes: [], drinks: [], staff: [], wares: ['wok', 'pot'], ings: [], slots: 2, water: false, dance: false, news: false };
    for (let d = 1; d <= day; d++) for (const [k, v] of Object.entries(PROG_ADD[d])) p[k] = Array.isArray(v) ? p[k].concat(v) : v;
    return (PROG_CACHE[day] = p);
  }
  const openDay = (key, val) => { for (let d = 1; d <= 7; d++) { const v = PROG_ADD[d][key]; if (Array.isArray(v) ? v.includes(val) : v !== undefined && v >= val) return d; } return 99; };
  const hasWare = (w) => prog().wares.includes(w) || (WARES[w].up && has(WARES[w].up));
  const stockOf = (ing) => (save && save.stock && save.stock[ing]) || 0;
  // 会做的菜：按天学会的 + 呆猫寄来的食谱 + 老大试菜发明的
  const knownDish = (k) => prog().dishes.includes(k) || ((save && save.recipes) || []).includes(k);
  const dishList = () => Object.keys(DISH).filter(knownDish);
  const isNewDish = (k) => openDay('dishes', k) === save.day || (save.recipeDay || {})[k] === save.day;
  function learnRecipe(k) { save.recipes = save.recipes || []; if (save.recipes.includes(k)) return false; save.recipes.push(k); save.recipeDay = save.recipeDay || {}; save.recipeDay[k] = save.day; save.menuNew = true; return true; }
  // 老大试菜：到了那天、有那件炊具，就会冒出一个灵感；选对食材和炊具就发明出来
  const INVENT = {
    shuizhu: { ing: 'fish', ware: 'wok', day: 4, idea: '鱼片下炒锅，浇一勺滚烫的红油……' },
    qingzheng: { ing: 'fish', ware: 'steamer', day: 5, idea: '这么鲜的鱼，放蒸笼里蒸一蒸最好。' },
    baozai: { ing: 'egg', ware: 'clay', day: 6, idea: '砂锅焖一锅饭，上面卧个蛋。' },
  };
  const ideaNow = () => Object.keys(INVENT).find((k) => !knownDish(k) && save.day >= INVENT[k].day && hasWare(INVENT[k].ware));
  const SPD = () => 0.8 + 0.07 * Math.min(3, (save && save.spd) || 0); // 走路速度：一开始慢一点，泡温泉、练广场舞、呆猫寄的钙片会变快
  function speedUp(why, x, y) { save.spd = Math.min(3, (save.spd || 0) + 1); if (G) float(x, y, `${why}，跑得更快了！`, '#3f7a34', 'heart', 2.4); sfx.ding(); }
  const onMenu = (k) => knownDish(k) && hasWare(DISH[k].ware);
  const canCook = (k) => onMenu(k) && stockOf(DISH[k].ing) > 0;
  const dessertsNow = () => Object.keys(DISH).filter((k) => DISH[k].dessert && onMenu(k));
  const menuSlots = () => SUZHOU ? Math.min(prog().slots, 4 - dessertsNow().length) : prog().slots;
  const mains = (list) => list.filter((k) => !DISH[k].dessert);
  const menuNow = () => {
    const eligible = (k) => DISH[k] && !DISH[k].dessert && onMenu(k);
    const selected = [...new Set(((save && save.menu) || []).filter(eligible))];
    return (selected.length ? selected : Object.keys(DISH).filter(eligible)).slice(0, menuSlots()).concat(dessertsNow());
  };
  const useStock = (k, n = 1) => { save.stock[DISH[k].ing] = Math.max(0, stockOf(DISH[k].ing) - n); };

  // 顾客：menu = 普通客，直接点菜，配料要求很简单（也常常没要求）；omakase = 随缘客，说个口味让你挑
  const CT = [
    { id: 'shiba', tip: 'fixed', n: '柴犬上班族', kind: 'menu', w: 3, pat: 1.35, eat: 4, water: 0.1, picky: 0.5, sizes: [1, 1, 2, 2, 3],
      add: ['辣油', '干辣椒', '花椒'], no: ['香菜', '葱花'], blurb: '午休只有半小时，永远在看手表。',
      say: { order: '老板，快点！', happy: '好吃！下午开会有劲了！', angry: '太慢了，我走了！', bad: '说了不要的！', water: '先来杯水，渴死了。' } },
    { id: 'bunny', tip: 'candy', n: '兔子小学生', kind: 'menu', w: 2, pat: 1.0, eat: 6, water: 0.4, picky: 0.7, sizes: [1, 2, 2, 3, 4],
      add: ['煎蛋', '醋'], no: ['香菜', '花生', '花生碎', '辣油', '干辣椒', '花椒'], blurb: '放学和同学一起来，挑食但很有礼貌。',
      say: { order: '我想好啦！', happy: '耶！好好吃！', angry: '呜呜，好饿……', bad: '我不吃这个……', water: '可以先给我一杯水吗？' } },
    { id: 'raccoon', tip: 'goods', n: '狸猫阿姨', kind: 'menu', w: 3, pat: 0.95, eat: 7, water: 0.5, picky: 0.4, sizes: [1, 2, 3, 4, 4],
      add: ['煎蛋', '醋', '腊肠'], no: ['香菜'], blurb: '买菜路过，最爱打听今天有没有特价。',
      say: { order: '老板，今天有特价吗？', happy: '划算！下次带姐妹来！', angry: '不吃了不吃了！', bad: '这个我不要的呀！', water: '先倒杯水，走得口干。' } },
    { id: 'neko', tip: 'fishy', n: '猫街坊', kind: 'menu', w: 2.5, pat: 1.1, eat: 6, water: 0.35, picky: 0.5, sizes: [1, 2, 2, 3, 4],
      add: ['醋', '煎蛋'], no: ['辣油', '花椒', '香菜'], blurb: '胖橘、波斯、三花、奶牛……巷子里的猫邻居，一桌各有各的样子。',
      say: { order: '喵，就这个！', happy: '吃饱了，回去晒太阳~', angry: '哼，不等了。', bad: '这个味道不对喵。', water: '先来碗水。' } },
    { id: 'panda', tip: 'generous', n: '熊猫奶奶', kind: 'omakase', w: 1.5, pat: 0.6, eat: 9, water: 0.7, sizes: [1, 1, 2],
      likes: ['清淡', '面', '米饭', '海鲜', '蛋', '甜'], dislikes: ['香菜', '花生'], hates: ['辣', '麻'], blurb: '不着急，你看着做就好。',
      say: { order: '你看着做吧，奶奶不挑。', happy: '真好吃，跟我做的一样香。', angry: '唉，等不动啦。', bad: '哎呀，奶奶吃不了这个呀。', water: '先给奶奶倒杯温水。' } },
    { id: 'fox', tip: 'perfect', n: '狐狸美食家', kind: 'omakase', w: 1, pat: 1.0, eat: 7, water: 0.2, sizes: [1, 1, 2],
      likes: ['麻', '辣', '海鲜', '花生', '面'], dislikes: ['清淡', '米饭', '香菜'], hates: ['甜'], blurb: '拿着小本子，吃一口记一笔。',
      say: { order: '主厨推荐吧，让我看看你的手艺。', happy: '嗯……可以写进我的美食笔记。', angry: '服务太慢，减分。', bad: '不合格，这个我不吃。', water: '先上一杯水，清清口。' } },
  ];
  // 小费习惯：每种客人不一样，写在笔记里
  const TIP_TXT = { fishy: '照常给小费，开心了还会叼来一条鱼', fixed: '固定给一点点，吃得特别满意翻倍', candy: '零花钱不多，开心了送你一颗糖（人气 +1）', goods: '小费给一半，另一半塞点菜给你', generous: '心情好就多给，最大方', perfect: '每道都合口味才给大红包，不然一分不给' };
  const TAG_WORD = { '清淡': '想吃点清淡的', '米饭': '想吃点米饭', '海鲜': '想吃点海鲜', '蛋': '想吃带蛋的', '甜': '想吃点甜口的', '麻': '想吃麻的', '辣': '想吃辣的', '花生': '想吃点带花生的', '面': '想吃碗面', '肉': '想吃肉' };
  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const pickW = (arr) => { let r = Math.random() * arr.reduce((s, x) => s + x.w, 0); for (const x of arr) { r -= x.w; if (r <= 0) return x; } return arr[0]; };
  // 图鉴记录
  const dexOf = (id) => { save.dex = save.dex || {}; const d = (save.dex[id] = save.dex[id] || { met: 0, likes: [], hates: [], reqs: [] }); d.dislikes = d.dislikes || []; return d; };
  const markNote = (id) => { save.noteNew = id; };
  function learn(c, list, tags) {
    const d = dexOf(c.type.id), got = [];
    for (const t of tags) if (!d[list].includes(t)) { d[list].push(t); got.push(t); }
    if (got.length) { markNote(c.type.id); const a = anchor(c); float(a.x, a.y - 96, `记进笔记：${c.type.n}${{ likes: '喜欢', dislikes: '不太喜欢', hates: '不吃' }[list]}「${got.join('、')}」`, list === 'likes' ? '#3f7a34' : '#a8322a', null, 2.6); }
  }

  // 茶水：除了白开水，客人还会点饮料（在茶水台现泡，不占炊具）
  const DRINKS = {
    water: { n: '白水', s: '白水', price: 0, sweet: false, col: '#cfe6f2', cup: 'glass', brew: 0.6, verb: '倒', x: 150, y: 588 },
    // 每种饮品在茶水台有自己的器具、做法和时间
    jasmine: { n: '茉莉花茶', s: '茉莉', leaf: true, price: 8, sweet: false, col: '#e0cf7a', cup: 'tea', brew: 3, verb: '泡', x: 22, y: 586 },
    puer: { n: '普洱', s: '普洱', leaf: true, price: 8, sweet: false, col: '#7a4a2a', cup: 'tea', brew: 4, verb: '冲', x: 54, y: 586 },
    plum: { n: '酸梅汤', s: '酸梅', price: 10, sweet: true, col: '#8a2f2a', cup: 'glass', brew: 1.5, verb: '舀', x: 86, y: 586 },
    soy: { n: '豆浆', s: '豆浆', price: 6, sweet: true, col: '#f3eee0', cup: 'bowl', brew: 1.5, verb: '盛', x: 118, y: 588 },
  };
  const drinkList = () => (prog().water ? ['water'] : []).concat(prog().drinks);
  function pickDrink(c) {
    if (c.script) return null; // 白水和饮品合在一起：一位客人最多要一杯
    const can = prog().drinks.filter((k) => !DRINKS[k].leaf || stockOf('tealeaf') > 0); // 没茶叶就不卖茶
    if (can.length && Math.random() < (c.type.kind === 'omakase' ? 0.55 : 0.45)) {
      const sweet = c.type.kind === 'omakase' ? c.type.likes.includes('甜') : Math.random() < 0.4;
      const fit = can.filter((k) => DRINKS[k].sweet === sweet), k = pick(fit.length ? fit : can);
      if (DRINKS[k].leaf) save.stock.tealeaf = stockOf('tealeaf') - 1;
      return k;
    }
    if (prog().water && Math.random() < (c.type.water || 0.3) * (can.length ? 0.6 : 1)) return 'water';
    return null;
  }
  // 给一伙客人里的一位生成点单
  function makeOrder(c) {
    const t = c.type, plan = c.script && c.script[c.members.length];
    if (plan && plan.dish) {
      const k = plan.dish; useStock(k);
      const tops = {}; DISH[k].tops.forEach(([n, d]) => { tops[n] = !!d; });
      const req = plan.req || null;
      if (req) { const d = dexOf(t.id), s = (req.t === 'no' ? '不要' : '加') + req.top; if (!d.reqs.includes(s)) { d.reqs.push(s); markNote(t.id); } }
      return { kind: 'menu', dish: k, tops, req, st: 'none', reserved: true, drink: null, dst: null };
    }
    if (plan && plan.want) { const d = dexOf(t.id); if (!d.likes.includes(plan.want)) { d.likes.push(plan.want); markNote(t.id); } return { kind: 'omakase', dish: null, want: plan.want, st: 'none', drink: null, dst: null }; }
    if (t.kind === 'menu') {
      const ok = mains(menuNow()).filter(canCook);
      if (!ok.length) return null;
      const wt = (k) => (trendOf(k) === 'hot' ? 3 : trendOf(k) === 'cold' ? 0.4 : 1)
        * (G.brief && DISH[k].tags.includes(G.brief.tag) ? 1.6 : 1);
      const favorite = c.regular && c.members.length < 2 && ok.includes(REGULAR_DISH);
      let r = Math.random() * ok.reduce((a, k) => a + wt(k), 0), k = ok[0];
      for (const x of ok) { r -= wt(x); if (r <= 0) { k = x; break; } }
      if (favorite) k = REGULAR_DISH;
      useStock(k);
      const tops = {}; DISH[k].tops.forEach(([n, d]) => { tops[n] = !!d; });
      const cand = DISH[k].tops.filter(([n, d]) => (d && t.no.includes(n)) || (!d && t.add.includes(n)));
      const req = cand.length && Math.random() < t.picky * (save.day <= 3 ? 0.3 : 1) ? (([n, d]) => ({ t: d ? 'no' : 'add', top: n }))(pick(cand)) : null;
      if (req) { const d = dexOf(t.id), s = (req.t === 'no' ? '不要' : '加') + req.top; if (!d.reqs.includes(s)) d.reqs.push(s); }
      const dr = pickDrink(c);
      return { kind: 'menu', dish: k, tops, req, st: 'none', reserved: true, drink: dr, dst: dr ? 'none' : null };
    }
    const okDishes = mains(menuNow()).filter((k) => canCook(k) && !DISH[k].tags.some((x) => t.hates.includes(x)));
    const wants = shuffle(t.likes).filter((w) => okDishes.some((k) => DISH[k].tags.includes(w)));
    const hot = save.trend && save.trend.day === save.day && wants.includes(save.trend.hot) && Math.random() < 0.6 ? save.trend.hot : null;
    if (!okDishes.length) return null;
    const want = hot || wants[0] || okDishes.map((k) => DISH[k].tags.find((x) => !t.dislikes.includes(x))).find(Boolean) || DISH[okDishes[0]].tags[0];
    const d = dexOf(t.id); if (!d.likes.includes(want)) { d.likes.push(want); markNote(t.id); } // 说出口的口味直接记进笔记
    const dr = pickDrink(c);
    return { kind: 'omakase', dish: null, want, st: 'none', drink: dr, dst: dr ? 'none' : null };
  }
  const orderLine = (m) => (m.kind === 'menu' ? `${DISH[m.dish].n}${m.req ? `，${m.req.t === 'no' ? '不要' : '多加'}${m.req.top}！` : '。'}` : `${TAG_WORD[m.want] || '想吃点' + m.want + '的'}。`)
    + (m.drink ? `再来一杯${DRINKS[m.drink].n}。` : '');

  // ---------- 场景布局：坐标来自 layout.json（构建时内联为 PENPEN_LAYOUT），缺了就用下面的老数值 ----------
  const LAYOUT = typeof PENPEN_LAYOUT !== 'undefined' ? PENPEN_LAYOUT : null;
  const LI = {}; if (LAYOUT) for (const it of LAYOUT.items) LI[it.id] = it;
  const LP = (id, i = 0) => { const it = LI[id]; const s = it && it.stand && it.stand[i]; return s ? { x: s[0], y: s[1] } : null; };
  const LA = (id) => { const it = LI[id]; return it && it.anchor ? { x: it.anchor[0], y: it.anchor[1] } : null; };
  for (const w in WARES) { const a = LA('stove.' + w); if (a) { WARES[w].x = a.x; WARES[w].y = a.y; } }
  // 坐标按 GPT 店内底图换算（源图 1536×1024，裁掉上 60 下 100，缩到 1280×720）
  const K = (y) => SUZHOU ? Math.max(0.85, Math.min(1.04, 0.9 + (y - 380) * 0.0007)) : Math.max(0.7, Math.min(0.95, 0.7 + (y - 380) * 0.0009)); // 远小近大（比以前小两成，好放下更多桌）
  const TW = { 2: 124, 4: 176 };
  // 座位：后排（面朝我们）+ 前排（背对我们），先坐后排
  const SEATS = { 2: [[0, -30, 0], [0, 54, 1]], 4: [[-44, -30, 0], [44, -30, 0], [-44, 54, 1], [44, 54, 1]] };
  // 后排三张、前排两张；第 1 天两张 2 人桌，之后按天加（见 PROG_ADD.tables）
  const TABLES = LAYOUT ? LAYOUT.items.filter((it) => it.kind === 'table').map((it) => ({ id: +it.id.split('.')[1], cx: it.anchor[0], cy: it.anchor[1], size: it.seats, L: it })) : [
    { id: 1, cx: 505, cy: 440, size: 2 }, { id: 2, cx: 545, cy: 628, size: 2 },
    { id: 3, cx: 745, cy: 438, size: 4 }, { id: 4, cx: 815, cy: 628, size: 4 },
    { id: 5, cx: 985, cy: 440, size: 2 },
  ];
  TABLES.forEach((t) => {
    t.k = K(t.cy + 40); const k = t.k, hw = TW[t.size] / 2 * k;
    t.seats = SEATS[t.size].map(([dx, dy, f]) => ({ x: t.cx + dx * k, y: t.cy + dy * k, front: !!f }));
    t.spot = { x: t.cx + hw + 40, y: t.cy + 30 };
    t.chip = { x: t.cx + hw + 10, y: t.cy - 44 * k };
    t.rx = hw + 22; t.ry = 70 * k;
    const L = t.L; if (!L) return; // 用 layout.json 的数值覆盖
    if (SUZHOU && L.scale) t.k = L.scale;
    if (L.seatPos) t.seats = L.seatPos.map(([x, y]) => ({ x, y, front: y > t.cy }));
    if (L.stand) t.spot = { x: L.stand[0][0], y: L.stand[0][1] };
    if (L.chip) t.chip = { x: L.chip[0], y: L.chip[1] };
    if (L.footprint) t.foot = L.footprint;
    if (L.hit) t.hit = L.hit;
  });
  const WIN = ART.room_b ? { x: 262, y: 30, w: 760, h: 234 } : { x: 274.2, y: 32.5, w: 730, h: 198.3 }; // 窗户（品红区）；B 绘本水彩背景的窗洞
  const PASS = { slots: (LI.pass && LI.pass.slots) || [[232, 480], [282, 502], [220, 512], [268, 530], [258, 552]], tag: (LI.pass && LI.pass.label) || [376, 456], spot: LP('pass') || { x: 408, y: 520 } };
  const WATER = { ...(LA('tea') || { x: 206, y: 596 }), spot: LP('tea') || { x: 372, y: 600 } };
  const PASS_POINT = LA('pass') || { x: 260, y: 510 };
  const TEA_POINT = { x: WATER.x, y: WATER.y - 20 };
  const SPIKE = LI.rail && LI.rail.spike ? { x: LI.rail.spike[0], y: LI.rail.spike[1] } : null;
  const TICKET_POINT = SPIKE ? { x: SPIKE.x, y: SPIKE.y - (SUZHOU ? 4 : 30) } : PASS_POINT;
  const SINK = { ...(LA('sink') || { x: 410, y: 370 }), spot: LP('sink') || { x: 414, y: 428 } }; // 洗碗池：左上角，紧挨厨房
  const DOOR = LP('door') || LA('door') || { x: 1162, y: 396 }; // 客人进出走门槛内侧的站位（G-003）
  const QSPOTS = SUZHOU
    ? LAYOUT.items.filter((it) => it.kind === 'queue').map((it) => ({ x: it.anchor[0], y: it.anchor[1], approach: LP(it.id), zone: it.zone }))
    : [1, 2, 3, 4].map((i, j) => LA('queue.' + i) || [{ x: 1192, y: 662 }, { x: 1240, y: 606 }, { x: 1192, y: 550 }, { x: 1240, y: 502 }][j]); // 先来的排在最下面，左右错开
  const IDLE = LP('idle.penpen') || { x: 712, y: 526 };
  const TEA = (() => { const a = LA('teacart'); return a ? { cx: a.x, cy: a.y, spot: LP('teacart') } : { cx: 1070, cy: 712, spot: { x: 1070, y: 660 } }; })(); // 茶台放在右前角
  const RACK = LA('menurack') || { x: 1056, y: 166 }; // 窗和门之间那块墙上挂的菜单木牌
  const RACK_HIT = LI.menurack && LI.menurack.hit; // G-006：点按区统一用 layout.json
  const SINK_HIT = (LI.sink && LI.sink.hit) || { x: 360, y: 312, w: 100, h: 88 };
  const SINK2 = SINK.spot;
  // 厨房台子的范围（不能走）
  const KITCHEN_POLY = [[0, 348], [208, 348], [382, 355], [377, 450], [358, 450], [358, 608], [248, 796], [0, 796]];
  const inPoly = (x, y, P) => { let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) { const [xi, yi] = P[i], [xj, yj] = P[j]; if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c; } return c; };
  const MAXQ = 6, PASS_MAX = 5;
  const STAFF_DEF = {
    laoer: { name: '老二', wage: 30, home: SUZHOU ? { x: 495, y: 565 } : LP('staff.laoer') || { x: 450, y: 560 }, rest: SUZHOU ? { x: 495, y: 565 } : (LI['staff.laoer'] && { x: LI['staff.laoer'].rest[0], y: LI['staff.laoer'].rest[1] }) || { x: 470, y: 690 } },
    mimi: { name: '咪咪', wage: 30, home: LP('staff.mimi') || { x: 960, y: 712 }, rest: (LI['staff.mimi'] && { x: LI['staff.mimi'].rest[0], y: LI['staff.mimi'].rest[1] }) || { x: 1180, y: 700 } },
  };
  const JOBS = [{ id: 'serve', n: '上菜' }, { id: 'drink', n: '上茶水' }, { id: 'bus', n: '收盘子' }, { id: 'farm', n: '农活' }, { id: 'rest', n: '休息' }];
  const DEFAULT_JOBS = { laoer: ['serve', 'drink'], mimi: ['farm'] }; // 咪咪负责外面：菜园、茶园、院子
  const UPGRADES = [
    { id: 'tea', n: '茶台', desc: '客人心情不好时端一杯茶过去，+2 颗心（每杯 ¥2）', day: 4, cost: 80 },
    { id: 'snack', n: '点心柜', desc: '送一碟点心，+3 颗心；客人退菜时也能哄回来（每碟 ¥5）', day: 5, cost: 150 },
    ...(SUZHOU ? [{ id: 'plates', n: '备用碟架', desc: '开店时多 4 只干净盘子，满桌同上菜时更宽裕。', day: 3, cost: 65 }] : []),
    { id: 'clay', n: '砂锅', desc: '新炊具：能做叉烧饭、煲仔饭（要叉烧肉、鸡蛋）', day: 6, cost: 160 },
  ];
  const has = (k) => !!(save && save.upgrades && save.upgrades[k]);
  const staffIds = () => prog().staff.slice();
  const jobsOf = (id) => { let j = save && save.jobs && save.jobs[id]; if (typeof j === 'string') j = [j]; if (j) j = [...new Set(j.map((x) => (x === 'water' ? 'drink' : x)))]; return j && j.length ? j : DEFAULT_JOBS[id]; };
  const resting = (id) => jobsOf(id)[0] === 'rest';
  const skipping = (id) => !!(save && save.skipDay === save.day && (save.skip || []).includes(id)); // D-001：欠薪的伙计这一天不来上班，在院子里晒太阳

  // 寻路（店里、白天大地图各一张网格）
  function makeGrid(cols, rows, isBlocked, tile = TS) {
    const b = [];
    for (let r = 0; r < rows; r++) { b.push([]); for (let c = 0; c < cols; c++) b[r].push(isBlocked(c * tile + tile / 2, r * tile + tile / 2)); }
    return { cols, rows, b, tile };
  }
  let SHOP_GRID = null;
  // 墙、台体、洗碗池、茶车（茶车买了才挡路，G-003）；开店时按存档重算
  const wallsNow = () => LAYOUT.items.filter((it) => it.footprint && it.kind !== 'table'
    && (!it.season || it.season === CUR_SE)
    && (!it.needs || it.needs.some((k) => { try { return has(k); } catch (e) { return false; } }))).map((it) => it.footprint);
  const buildShopGrid = (tables) => {
    const WALLS = LAYOUT ? wallsNow() : null;
    if (SUZHOU) {
      const tile = 20;
      const obstacles = WALLS.concat(tables.map((t) => t.foot));
      const walkArea = LAYOUT.scene.walkArea;
      const margin = LAYOUT.scene.footClearance;
      const samples = [[0, 0], [-margin, 0], [margin, 0], [0, -margin], [0, margin],
        [-margin, -margin], [-margin, margin], [margin, -margin], [margin, margin]];
      const blocked = (x, y) => samples.some(([dx, dy]) => !inPoly(x + dx, y + dy, walkArea)
        || obstacles.some((p) => inPoly(x + dx, y + dy, p)));
      SHOP_GRID = makeGrid(W / tile, H / tile, blocked, tile);
      SHOP_GRID.blocked = blocked;
      return SHOP_GRID;
    }
    return (SHOP_GRID = WALLS ? makeGrid(COLS, ROWS, (x, y) => WALLS.some((P) => inPoly(x, y, P)) || tables.some((t) => (t.foot ? inPoly(x, y, t.foot) : ((x - t.cx) / t.rx) ** 2 + ((y - t.cy - 12) / t.ry) ** 2 < 1)))
    : makeGrid(COLS, ROWS, (x, y) => y < 340 || inPoly(x, y, KITCHEN_POLY) || x < 380 && y < 460
    || tables.some((t) => ((x - t.cx) / t.rx) ** 2 + ((y - t.cy - 12) / t.ry) ** 2 < 1)
    || (x > 1188 && y > 350 && y < 492) || ((() => { try { return has('tea') || has('snack'); } catch (e) { return false; } })() && Math.abs(x - TEA.cx) < 66 && y > TEA.cy - 50 && y < TEA.cy + 10) || (Math.abs(x - RACK.x) < 60 && y > RACK.y - 30 && y < RACK.y + 8) || (Math.abs(x - SINK.x) < 36 && y > SINK.y - 40 && y < SINK.y + 12))); };
  buildShopGrid(TABLES);
  const TEA_HIT = LI.teacart && LI.teacart.hit;
  const qCard = (c) => {
    const spot = SUZHOU && QSPOTS[c.qi];
    if (spot) return { x: c.x + (c.x > 1162 ? -115 : 55), y: c.y - 73, w: 58, h: 40 };
    return { x: c.x - 118, y: c.y - 95, w: 68, h: 50 };
  }; // 排队人数牌（左上）
  const qBody = (c) => ({ x: c.x - 51, y: c.y - (SUZHOU ? 116 : 100), w: 102, h: SUZHOU ? 123 : 120 }); // 排队这组人的身子
  const inRect = (x, y, r, pad = 0) => x > r.x - pad && x < r.x + r.w + pad && y > r.y - pad && y < r.y + r.h + pad;
  const DOCK = { x: 1400, y: 960, w: 150, h: 60 };
  const cubP = (a, b, c, d, t) => ({ x: a[0] * (1 - t) ** 3 + 3 * b[0] * t * (1 - t) ** 2 + 3 * c[0] * t * t * (1 - t) + d[0] * t ** 3, y: a[1] * (1 - t) ** 3 + 3 * b[1] * t * (1 - t) ** 2 + 3 * c[1] * t * t * (1 - t) + d[1] * t ** 3 });
  const STREAM = []; for (const sg of [[[1930, 230], [1880, 380], [1990, 520], [1925, 630]], [[1925, 630], [1880, 720], [1900, 820], [1880, 900]]]) for (let t = 0; t <= 1; t += 0.04) STREAM.push(cubP(...sg, t));
  const BRIDGE = { x: 1876, y: 596, w: 100, h: 64 };
  const WORLD_GRID = makeGrid(Math.ceil(WORLD_W / TS), Math.ceil(WORLD_H / TS), (x, y) => {
    const M = WMAP;
    if (inRect(x, y, M.shop) || inRect(x, y, { x: M.market.x, y: M.market.y + 60, w: M.market.w, h: 110 }) || inRect(x, y, { x: M.coop.x, y: M.coop.y + 40, w: M.coop.w, h: M.coop.h - 40 })) return true;
    if (M.farm.plots.some(([px, py]) => Math.abs(x - px) < M.farm.pw / 2 && Math.abs(y - py) < M.farm.ph / 2)) return true;
    if (((x - M.pond.cx) / (M.pond.rx + 10)) ** 2 + ((y - M.pond.cy) / (M.pond.ry + 10)) ** 2 < 1 && !inRect(x, y, DOCK)) return true;
    if (STREAM.some((p) => Math.hypot(p.x - x, p.y - y) < 26) && !inRect(x, y, BRIDGE)) return true;
    if (((x - 2200) / 150) ** 2 + ((y - 262) / 56) ** 2 < 1) return true;
    return y < 240;
  });
  // 走不到的记一笔（灰盒和测试会读 G.unreach），画面上冒一句「走不过去」，同一处 3 秒内只提示一次
  function noWay(who, to) {
    if (!G) return;
    const u = (G.unreach = G.unreach || []), x = Math.round(to.x), y = Math.round(to.y), last = u[u.length - 1];
    if (last && last.who === who && last.x === x && last.y === y && G.t - last.t < 3) return;
    u.push({ who, x, y, t: Math.round(G.t * 10) / 10, mode: G.mode });
    if (typeof float === 'function') float(x, y - 40, '走不过去', '#a8322a');
  }
  // 座位在桌子占地里面：入座先走到桌边（店员站位），再坐下；离座先回到桌边，再去门口
  function viaTable(c, t, end, sitting) {
    if (!t || !t.spot) return findPath(c, end) || (noWay('客人', end), sitting ? null : []);
    if (sitting) { const p = findPath(c, t.spot); if (!p) { noWay('客人', t.spot); return null; } return p.concat([end]); } // 坐不过去：交给调用方放回排队
    const p = findPath(t.spot, end); if (p) return [t.spot].concat(p);
    const q = findPath(c, end); if (q) return q;
    noWay('客人', end); return []; // 哪儿都走不出去：原地离开，不卡住客流
  }
  function findPath(from, to, grid = SHOP_GRID) {
    const { cols: C, rows: R, b: blocked, tile } = grid;
    const cell = (p) => ({ c: Math.max(0, Math.min(C - 1, Math.floor(p.x / tile))), r: Math.max(0, Math.min(R - 1, Math.floor(p.y / tile))) });
    const s = cell(from), g = cell(to);
    if (grid === YARD_GRID && (grid.b[g.r][g.c] || grid.blocked(to.x, to.y))) return null;
    const shop = SUZHOU && grid === SHOP_GRID;
    const center = (c, r) => ({ x: (c + 0.5) * tile, y: (r + 0.5) * tile });
    const clear = (a, b) => [0.25, 0.5, 0.75, 1].every((p) => !grid.blocked(a.x + (b.x - a.x) * p, a.y + (b.y - a.y) * p));
    if (shop && s.c === g.c && s.r === g.r) return clear(from, to) ? [to] : null;
    if (grid === SHOP_GRID && (grid.b[g.r][g.c] || (grid.blocked && grid.blocked(to.x, to.y)))) return null; // 店里的终点不能在墙里、桌子里（座位另走桌边中转，G-003）
    const key = (c, r) => r * C + c;
    const open = [{ c: s.c, r: s.r, g: 0, f: 0 }], came = new Map(), gs = new Map([[key(s.c, s.r), 0]]);
    const closed = new Set();
    while (open.length) {
      let bi = 0; for (let i = 1; i < open.length; i++) if (open[i].f < open[bi].f) bi = i;
      const cur = open.splice(bi, 1)[0]; const ck = key(cur.c, cur.r);
      if (closed.has(ck)) continue; closed.add(ck);
      if (cur.c === g.c && cur.r === g.r) {
        const pts = [to]; let k = ck;
        while (came.has(k)) { k = came.get(k); const c = k % C, r = Math.floor(k / C); if (k !== key(s.c, s.r)) pts.unshift({ x: c * tile + tile / 2, y: r * tile + tile / 2 }); }
        return pts;
      }
      for (let dc = -1; dc <= 1; dc++) for (let dr = -1; dr <= 1; dr++) {
        if (!dc && !dr) continue;
        const nc = cur.c + dc, nr = cur.r + dr;
        if (nc < 0 || nr < 0 || nc >= C || nr >= R) continue;
        const goal = nc === g.c && nr === g.r;
        if (blocked[nr][nc] && !goal) continue;
        if (dc && dr && (blocked[cur.r][nc] || blocked[nr][cur.c])) continue;
        if (shop || grid === YARD_GRID) {
          const a = cur.c === s.c && cur.r === s.r ? from : center(cur.c, cur.r);
          const b = goal ? to : center(nc, nr);
          if (!clear(a, b)) continue;
        }
        const ng = cur.g + (dc && dr ? 1.414 : 1);
        const nk = key(nc, nr);
        if (ng < (gs.get(nk) ?? Infinity)) { gs.set(nk, ng); came.set(nk, ck); open.push({ c: nc, r: nr, g: ng, f: ng + Math.hypot(nc - g.c, nr - g.r) }); }
      }
    }
    return null; // 走不到：调用方自己决定取消还是兜底（T-05）
  }

  // ---------- 存档 ----------
  const GREY = typeof PENPEN_GREYBOX !== 'undefined' && PENPEN_GREYBOX; // 灰盒入口（greybox.html）
  const SAVE_KEY = SUZHOU_PREVIEW ? 'penpen.suzhou.preview.v1' : GREY ? 'penpen.greybox.v1' : 'penpen.saves.v1'; // 灰盒用自己的存档，碰不到正式版
  const loadSaves = () => { try { return JSON.parse(localStorage.getItem(SAVE_KEY)) || []; } catch (e) { return []; } };
  const storeSaves = (list) => { try { localStorage.setItem(SAVE_KEY, JSON.stringify(list)); } catch (e) { toast('存档没保存成功（浏览器不允许）'); } };
  let save = null; // 当前存档
  const START_STOCK = { tofu: 8, beef: 8, pork: 0, chili: 0, peanut: 0, shrimp: 0, fish: 0, egg: 0, rice: 0 };
  function fixSave(s) { // 老存档补字段
    s.stock = { ...START_STOCK, ...(s.stock || {}) };
    // 菜地：每块 3×3 九格，每格种一颗种子（老存档：原来种着的算前三格）
    s.farm = (s.farm || []).concat([{}, {}, {}, {}]).slice(0, 4).map((f) => (f.cells ? f : { cells: Array.from({ length: 9 }, (_, j) => ((f.st === 'grow' || (!f.st && f.crop)) && j < 3 ? { k: f.crop, ready: f.ready || 1 } : null)) }));
    s.seeds = s.seeds || {}; s.did = s.did || {}; s.recipes = s.recipes || []; s.recipeDay = s.recipeDay || {}; s.history = s.history || [];
    s.decor = { tables: {}, linen: '', flowers: '', curtain: '', bench: false, wallLeft: 'bamboo', wallRight: 'canal', ...(s.decor || {}) };
    s.decor.tables ||= {};
    s.album ||= { clock: 'game', notes: {}, placements: {} };
    s.album.notes ||= {};
    s.album.placements ||= {};
    if (!s.farmLesson) s.farmLesson = s.day < 3 ? (s.did.plant ? 'wait' : s.did.seed ? 'plant' : 'seed')
      : (s.did.harvest && !s.did.fish && s.day === 3 ? 'fish' : 'done');

    s.dex = s.dex || {}; s.dishDex = s.dishDex || {}; s.fishDex = s.fishDex || {};
    if (s.farmLesson === 'plant' && s.farmLessonSown == null) {
      s.farmLessonSown = Math.min(3, s.farm[0].cells.filter((item) => item?.k === 'chili').length);
      s.seeds.chili = Math.max(s.seeds.chili || 0, 3 - s.farmLessonSown);
    }
    return s;
  }

  // ---------- 游戏状态 ----------
  let G = null, TEA_IMG = null;
  const ENERGY = 10;

  const BRIEFS = [
    { tag: '面', text: '沿河散步的客人想吃碗面。备些清汤牛肉面，留意牛肉存量。' },
    { tag: '辣', text: '集日爱吃辣的客人多。留意麻婆豆腐和炒锅是否忙得过来。' },
    { tag: '海鲜', text: '江边游人想吃鲜味。鱼塘有鱼的话，可以留给蒸笼。' },
  ];
  const REGULAR_DISH = 'mian';
  const regularDue = () => SUZHOU && save.regular && !save.regular.flower && save.day >= save.regular.due;
  function briefNow() {
    if (!SUZHOU || save.day <= 1) return null;
    const available = BRIEFS.filter((b) => dishList().some((k) => onMenu(k) && DISH[k].tags.includes(b.tag)));
    return available[(save.day - 2) % available.length] || null;
  }
  const tableHeld = (t) => G.visit?.table === t.id &&
    (!G.visit.spawned || inLine(G.visit.spawned)) && (!t.reserved || !t.reserved.regular);
  const waitingComfort = (c) => (save.decor.bench ? 0.9 : 1)
    * (save.regular?.flower && save.decor.flowers === 'gift' && QSPOTS[c.qi]?.zone === 'outside' ? 0.86 : 1);
  function dailyNote() {
    const brief = briefNow(), lines = [];
    if (brief) lines.push(brief.text);
    if (regularDue()) lines.push('狸猫阿姨带姐妹来，共四位，想点两份清汤面。');
    return lines.join(' ');
  }
  function tableSetup() {
    return TABLES.filter((t) => prog().tables.includes(t.id)).map((t) => {
      const state = { ...t, cust: null, dirty: false, reserved: null, busClaim: null };
      if (!SUZHOU || t.size !== 4 || save.decor.tables[t.id] !== 2) return state;
      const center = (p) => t.cx + (p - t.cx) * 0.7;
      return { ...state, size: 2, rx: TW[2] * t.k / 2 + 22,
        seats: SEATS[2].map(([dx, dy, front], i) => ({ x: t.cx + (i ? -27 : 26) * t.k, y: t.cy + dy * t.k * 0.62, front: !!front })),
        foot: t.foot.map(([x, y]) => [center(x), y]),
        hit: { ...t.hit, x: center(t.hit.x), w: t.hit.w * 0.7 },
      };
    });
  }
  const startingPlates = (tables) => 4 + tables.reduce((n, t) => n + t.size, 0) + (has('plates') ? 4 : 0);
  function newDay() {
    const tables = tableSetup();
    G = {
      mode: 'day', t: 0, spawnT: 2, paused: false, over: false, soldOut: false,
      coins: 0, tips: 0, served: 0, angry: 0, rep: 0, wrong: 0,
      customers: [], floats: [], nextId: 1,
      tables,
      plates: { clean: startingPlates(tables), dirty: 0, washT: 0 }, kitchen: { wares: Object.fromEntries(Object.keys(WARES).map((w) => [w, { q: [], cur: null }])), pass: [], drinkQ: [], drinkCur: null, drinkReady: [], rail: [] },
      waiter: { x: IDLE.x, y: IDLE.y, path: [], hands: [], queue: [], tickets: [], face: 1, back: false, blinkT: 2 },
      staff: staffIds().filter((id) => !jobsOf(id).includes('farm') && !skipping(id)).map((id) => ({ id, x: STAFF_DEF[id].home.x, y: STAFF_DEF[id].home.y, path: [], hands: [], task: null, face: 1, back: false })),
      danceCD: 0, selected: null, orderOpen: null, dancer: null,
      D: { ...(YARD ? yardPoint(YARD.spawn) : { x: WMAP.shop.door.x, y: WMAP.shop.door.y + 30 }), path: [], face: 1, back: false, task: null, energy: save.energyDay === save.day && save.energy != null ? save.energy : ENERGY, fish: 0, cam: { x: 360, y: 300 }, manual: false },
    };
    if (SUZHOU) {
      for (const id of Object.keys(IDLE_BEATS)) gardenArt('s_' + id + '_idle');
      for (const id of ['kitchen_g068','s_penpen_empty','s_penpen_empty_idle','s_penpen_empty_walk','wall_bamboo_g067','wall_canal','order_spike','tea_set_g066','tea_bowl','tea_bowl_water']) gardenArt(id);
    }
    TEA_IMG = (has('tea') || has('snack')) ? svgImg(teaCartSVG(has('tea'), has('snack'))) : null;
    setSeason(seasonOf(save.day)); G.parts = []; rollTrend();
    // 安排了农活的店员：一早去摘茶、收熟了的菜
    const firstMorning = save.morningDay !== save.day; save.morningDay = save.day; // T-03：早上的农活、茶叶、来信一天只发一次
    if (firstMorning) save.farmLog = [];
    if (firstMorning) for (const id of staffIds()) if (jobsOf(id).includes('farm') && !skipping(id)) {
      const got = [];
      if (spotOpen('tea')) { save.stock.tealeaf = stockOf('tealeaf') + 3; got.push('茶叶×3'); }
      save.farm.forEach((f, i) => { if (plotReady(i)) { const g = harvestPlot(i); for (const k in g) got.push(`${ING[k].n}×${g[k]}`); } });
      let re = 0; // 收完顺手补种：家里有哪样种子就种哪样
      save.farm.forEach((f, i) => { if (!plotOpen(i)) return; f.cells.forEach((c, j) => { const k = prog().seeds.filter((x) => save.seeds[x] > 0).sort((a, b) => save.seeds[b] - save.seeds[a])[0]; if (!c && k) { save.seeds[k]--; f.cells[j] = { k, ready: save.day + 1 }; re++; } }); });
      if (re) got.push(`补种 ${re} 格`);
      if (got.length) save.farmLog.push({ id, got });
    }
    // 呆猫的信：每隔两三天到一封
    if (firstMorning && !save.mail && spotOpen('mail') && save.day >= (save.mailDay || 3)) {
      const next = POSTCARDS.find((p) => !(save.cards || []).includes(p.id)); // 剧情明信片：按呆猫的旅行路线一站一站寄，一定会到
      if (next) save.mail = next.id;
    }
    if (firstMorning && !save.mail && spotOpen('mail') && Math.random() < 0.35) { // 不是剧情的日子：随缘寄一张随手拍
      const left = snapsLeft(); if (left.length) { const sp = left[Math.floor(Math.random() * left.length)]; save.mail = `snap:${sp.id}:${sp.v}`; }
    }
    updateFarmLesson();
    setMode('day');
  }
  function setMode(m) {
    G.mode = m;
    if (YARD) {
      syncFishingPanel();
      if (m === 'day') gardenArt('yard_' + CUR_SE, 'jpg');
      $('#hud-screen').classList.remove('yard-more-open');
    }
    if (SUZHOU && (gardenMode !== (m === 'shop') || yardMode !== (m === 'day'))) {
      gardenMode = m === 'shop'; yardMode = m === 'day'; resize();
    }
    $('#hud-screen').classList.toggle('mode-day', m === 'day');
    $('#hud-screen').classList.toggle('mode-shop', m === 'shop');
    $('#hud-screen').classList.toggle('suzhou', SUZHOU);
  }
  function openShop() {
    if (!G || G.mode !== 'day') return;
    if (YARD && teachingFarm() && save.ck?.day !== save.day) { toast(teachingFarm().msg, 2900); return; }
    if (save.day === 1) { save.menu = ['mapo', 'mian']; save.menuDay = 1; }
    if (save.menuDay !== save.day && !G.menuAsked) { G.menuAsked = true; openMenuPick(); return; }
    if (staffIds().length && G.staffDay !== save.day) { G.staffDay = save.day; openStaff(true); return; } // 开店前先安排店员
    if (!(save.ck && save.ck.day === save.day)) save.ck = JSON.parse(JSON.stringify({ day: save.day, stock: save.stock, seeds: save.seeds, coins: save.coins, menu: save.menu, menuDay: save.menuDay, farm: save.farm, energy: G.D.energy })); // T-03：开店那一刻的存档点
    G.brief = briefNow();
    if (SUZHOU && save.day >= 3 && Math.random() < 0.38) G.mischiefPlan = { prefer: Math.random() < 0.5 ? 'laoda' : 'laoer', delay: rand(27, 37) };
    if (regularDue()) G.visit = { look: save.regular.look, table: save.prep?.day === save.day ? save.prep.table : null };
    buildShopGrid(G.tables); setMode('shop'); G.t = 0; G.spawnT = 3; G.script = save.day === 1 ? DAY1.map((x) => ({ ...x })) : null; G.omaAt = save.day <= 3 ? rand(50, 90) : null; persist(); did('open');
  }

  // ---------- 白天：大地图 ----------
  const HOT = [ // 地图上能点的地方
    { id: 'door', r: { x: 930, y: 480, w: 140, h: 180 }, spot: () => WMAP.shop.door },
    { id: 'market', r: { x: 200, y: 290, w: 340, h: 230 }, spot: () => WMAP.market.spot },
    ...WMAP.farm.plots.map(([x, y], i) => ({ id: 'plot', i, r: { x: x - 85, y: y - 70, w: 170, h: 130 }, spot: () => ({ x, y: y + 82 }) })),
    { id: 'coop', r: { x: 2040, y: 300, w: 240, h: 230 }, spot: () => WMAP.coop.spot },
    { id: 'pond', r: { x: 1380, y: 880, w: 720, h: 330 }, spot: () => ({ x: 1520, y: 992 }) },
    { id: 'mail', r: { x: 1290, y: 570, w: 56, h: 120 }, spot: () => ({ x: 1317, y: 720 }) },
    { id: 'plaza', r: { x: 410, y: 900, w: 300, h: 200 }, spot: () => ({ x: 560, y: 1110 }) },
    { id: 'mirror', r: { x: 726, y: 540, w: 88, h: 120 }, spot: () => ({ x: 770, y: 700 }) },
    { id: 'tea', r: { x: 1060, y: 890, w: 230, h: 140 }, spot: () => ({ x: 1170, y: 1060 }) },
    { id: 'onsen', r: { x: 2050, y: 200, w: 300, h: 120 }, spot: () => ({ x: 2200, y: 340 }) },
  ];

  const YARD = SUZHOU ? LAYOUT.yard : null;
  const yardPoint = ([x, y]) => ({ x: x * W / YARD.source[0], y: y * H / YARD.source[1] });
  const YARD_PLACES = YARD ? YARD.sites.map((site) => {
    const [x, y, w, h] = site.hit;
    const p = yardPoint([x, y]), end = yardPoint([x + w, y + h]), stand = yardPoint(site.stand);
    return { id: site.id, i: site.i, name: site.name, sign: yardPoint(site.sign),
      r: { x: p.x, y: p.y, w: end.x - p.x, h: end.y - p.y }, spot: () => stand };
  }) : HOT;
  const yardPlace = (id, plot = 0) => YARD_PLACES.find((h) => h.id === id && (id !== 'plot' || h.i === plot));
  const YARD_GRID = YARD ? (() => {
    const tile = 12;
    const segments = YARD.lanes.flatMap((lane) => lane.points.slice(1).map((p, i) => ({
      a: yardPoint(lane.points[i]), b: yardPoint(p), width: lane.width * W / YARD.source[0],
    })));
    const clear = (x, y) => segments.some(({ a, b, width }) => {
      const dx = b.x - a.x, dy = b.y - a.y;
      const t = Math.max(0, Math.min(1, ((x - a.x) * dx + (y - a.y) * dy) / (dx ** 2 + dy ** 2)));
      return (x - a.x - t * dx) ** 2 + (y - a.y - t * dy) ** 2 <= width ** 2;
    }) || YARD_PLACES.some((h) => Math.hypot(x - h.spot().x, y - h.spot().y) < 16);
    const grid = makeGrid(Math.ceil(W / tile), Math.ceil(H / tile), (x, y) => !clear(x, y), tile);
    grid.blocked = (x, y) => !clear(x, y);
    return grid;
  })() : null;
  const plotOpen = (i) => i < prog().plots;
  const cellRipe = (c) => !!c && c.ready <= save.day;
  const plotReady = (i) => plotOpen(i) && save.farm[i].cells.some(cellRipe);
  const plotEmpty = (i) => plotOpen(i) && save.farm[i].cells.some((c) => !c);
  function harvestPlot(i) { // 收这块地里熟了的格子，返回 {辣椒: 5}
    const got = {}; save.farm[i].cells = save.farm[i].cells.map((c) => { if (!cellRipe(c)) return c; got[c.k] = (got[c.k] || 0) + 1; return null; });
    for (const k in got) save.stock[k] = stockOf(k) + got[k];
    return got;
  }
  const seedBuyable = () => prog().seeds.find((k) => mktLeft(k + '_seed') >= 3 && save.coins >= SEED_PRICE[k] * 3);
  const spotOpen = (id) => ['door', 'plaza', 'onsen'].includes(id) || (id === 'cottage' ? prog().map.includes('mail') : prog().map.includes(id));
  const did = (k) => { save.did[k] = (save.did[k] || 0) + 1; };


  const FARM_LESSON = {
    seed: { site: 'market', title: '领一包种子', msg: '去早市，用教学券领三颗辣椒种子。' },
    plant: { site: 'plot', title: '种三格辣椒', msg: '到第一畦，把三颗种子种进三格空地。' },
    harvest: { site: 'plot', title: '收昨天种的菜', msg: '先到第一畦收菜，收获会进储藏室。' },
    fish: { site: 'pond', title: '学抛竿和收线', msg: '去木钓台，先抛竿，再看浮漂。' },
    plan: { title: '定今天的菜单', msg: '先选菜，再用收获和鱼获对照库存。' },
    buy: { site: 'market', title: '按清单补货', msg: '去早市，只补今天菜单里还缺的食材。' },
  };
  const farmPhase = () => SUZHOU && save.day >= 2 ? save.farmLesson : 'done';
  const teachingFarm = () => FARM_LESSON[farmPhase()];
  function setFarmPhase(next) {
    save.farmLesson = next;
    persist();
  }
  function updateFarmLesson() {
    if (!YARD) return;
    if (farmPhase() === 'wait' && plotReady(0)) setFarmPhase('harvest');
    if (farmPhase() === 'harvest' && !plotReady(0)) setFarmPhase('fish');
    if (farmPhase() === 'buy' && !Object.keys(farmShortages()).length) setFarmPhase('done');
  }
  function farmGate(h) {
    const phase = farmPhase(), lesson = teachingFarm();
    if (phase === 'wait' && h.id === 'market') { toast('明早先收菜和钓鱼，再来看缺货单。', 2700); return true; }
    if (!lesson || !['door','market','plot','pond','coop','tea'].includes(h.id)) return false;
    if (h.id === lesson.site && (h.id !== 'plot' || h.i === 0)) return false;
    toast(lesson.msg, 2700); return true;
  }
  function yardGoal() {
    const phase = farmPhase(), step = teachingFarm();
    if (step) return { ...step, key: phase, place: step.site ? yardPlace(step.site) : null };
    if (phase === 'wait') return { key: phase, title: '种好了，明早来收', msg: '种子正在长。今天可以开店营业。', place: yardPlace('door') };
    return null;
  }
  function dayTap(p) {
    const D = G.D;
    const h = YARD_PLACES.find((h) => inRect(p.x, p.y, h.r));
    if (D.fish > 0 || D.fishing) return;
    if (h && (!spotOpen(h.id) || (h.id === 'plot' && !plotOpen(h.i)))) { // 还没开放：只冒一句「第几天开」
      const d = h.id === 'plot' ? openDay('plots', h.i + 1) : openDay('map', h.id === 'cottage' ? 'mail' : h.id);
      float(p.x, p.y - 30, `第 ${d} 天开放`, '#8a6a50'); sfx.tap(); return;
    }
    if (h && farmGate(h)) return;

    if (h) { walkToYard(h); return; }
    const grid = YARD_GRID || WORLD_GRID;
    if (YARD && grid.blocked(p.x, p.y)) return;
    D.task = null; D.path = findPath(D, p, grid) || []; D.manual = false; D.camGoal = null;
  }
  function walkToYard(h) {
    const D = G.D, sp = h.spot();
    D.task = h; D.path = findPath(D, sp, YARD_GRID || WORLD_GRID) || (noWay('盆盆', sp), (D.task = null), []);
    D.manual = false; D.camGoal = null; sfx.tap();
  }
  const spend = () => { if (G.D.energy <= 0) { toast('今天累了，没体力了；去开店吧'); return false; } G.D.energy--; save.energy = G.D.energy; save.energyDay = save.day; return true; }; // T-03：体力记进存档，重开不回满
  function gain(ing, n, x, y) { save.stock[ing] = stockOf(ing) + n; float(x, y, `${ING[ing].n} +${n}`, '#3f7a34'); sfx.ding(); }
  function dayArrive(h) {
    const D = G.D;
    if (h.id === 'door') { ask(`收拾好了，开门营业吗？${D.energy ? `（体力还剩 ${D.energy}）` : ''}`, '开店').then((ok) => ok && openShop()); return; }
    if (h.id === 'market') { openMarket(); did('market'); return; }
    if (h.id === 'cottage') { openTravelAlbum('hud-screen'); return; }
    if (h.id === 'tea') {
      if (save.teaDay === save.day) { float(h.sign?.x ?? 1170, h.sign?.y ?? 900, '明天再来摘', '#8a6a50'); return; }
      if (!spend()) return;
      save.teaDay = save.day; gain('tealeaf', 4, h.sign?.x ?? 1170, h.sign?.y ?? 940); did('tea'); persist(); return;
    }
    if (h.id === 'mirror') { G.paused = true; openCreator(save, false); did('mirror'); return; }
    if (h.id === 'plot') {
      if (plotOpen(h.i)) openPlot(h.i);
      return;
    }
    if (h.id === 'coop') {
      if (save.coopDay === save.day) { float(h.sign?.x ?? 2160, h.sign?.y ?? 400, '明天再来', '#8a6a50'); return; }
      if (!spend()) return;
      save.coopDay = save.day; gain('egg', 3, h.sign?.x ?? 2160, h.sign?.y ?? 420); did('egg'); persist(); return;
    }
    if (h.id === 'pond') {
      if (YARD) { G.D.fishing = { stage: 'ready', t: 0 }; G.D.face = 1; syncFishingPanel(); return; }
      if (!spend()) return;
      D.fish = 2.2; D.face = 1;
      if (farmPhase() === 'fish') toast('浮漂动了就收线。');
      return;
    }
    if (h.id === 'mail') { if (save.mail) { openMail(); did('mail'); } else float(h.sign?.x ?? 1317, h.sign?.y ?? 520, '今天没有信', '#8a6a50'); return; }
    if (h.id === 'onsen') { if (!save.soaked) { save.soaked = true; speedUp('泡了个温泉', 2200, 220); } else float(2200, 200, '店员休息时来泡温泉', '#3f6680'); return; }
    if (h.id === 'plaza') { const [x, y] = [h.sign?.x ?? 560, h.sign?.y ?? 900]; if (!save.danced && save.day >= 3) { save.danced = true; speedUp('跟着帅老头练了练广场舞', x, y); persist(); } else float(x, y - 20, '院子里坐一会儿', '#775b47'); return; }
  }
  function updateDay(dt) {
    const D = G.D;
    if (D.fishing) {
      const fish = D.fishing;
      fish.t += dt;
      if (fish.stage === 'cast' && fish.t >= fish.wait) { fish.stage = 'bite'; fish.t = 0; sfx.tap(); syncFishingPanel(); }
    } else if (D.fish > 0) { D.fish -= dt; if (D.fish <= 0) { D.fish = 0; if (farmPhase() === 'fish') openFishLesson(); else catchFish(); } }
    else if (D.path.length) { if (moveAlong(D, 340 * SPD(), dt) && D.task) { const h = D.task; D.task = null; dayArrive(h); } }
    if (YARD) { G.floats = G.floats.filter((f) => (f.t += dt) < (f.life || 1.6)); return; }
    const tx = Math.max(0, Math.min(WORLD_W - W, D.x - W / 2)), ty = Math.max(0, Math.min(WORLD_H - H, D.y - H * 0.74));
    if (D.camGoal) { // 引导要指的地方不在画面里：镜头慢慢移过去
      D.cam.x += (D.camGoal.x - D.cam.x) * Math.min(1, dt * 3); D.cam.y += (D.camGoal.y - D.cam.y) * Math.min(1, dt * 3);
      if (Math.hypot(D.camGoal.x - D.cam.x, D.camGoal.y - D.cam.y) < 4) D.camGoal = null;
    } else if (!D.manual) { D.cam.x += (tx - D.cam.x) * Math.min(1, dt * 4); D.cam.y += (ty - D.cam.y) * Math.min(1, dt * 4); }
    G.floats = G.floats.filter((f) => (f.t += dt) < (f.life || 1.6));
    // 季节飘落物：春花瓣、秋叶、冬雪
    const se = CUR_SE;
    if (se !== 'summer' && G.parts.length < 40 && Math.random() < dt * 8) G.parts.push({ x: D.cam.x + Math.random() * (W + 200) - 100, y: D.cam.y - 20, vx: rand(-20, 30), vy: rand(30, 60), r: rand(0, 6), t: 0 });
    G.parts.forEach((q) => { q.t += dt; q.x += (q.vx + Math.sin(q.t * 2 + q.r) * 20) * dt; q.y += q.vy * dt; });
    G.parts = G.parts.filter((q) => q.y < D.cam.y + H + 30);
  }
  function openMail() {
    const sn = snapOf(save.mail);
    if (sn) { // 随手拍：一张照片 + 一句话，有时顺手寄点小东西
      const pc = POSTCARDS.find((p) => p.id === sn.id); if (!pc) { save.mail = null; return; }
      if (!save.snapGift || save.snapGift.k !== save.mail) { const r = Math.random(); save.snapGift = { k: save.mail, msg: SNAP_MSG[Math.floor(Math.random() * SNAP_MSG.length)], coins: r < 0.25 ? 5 + Math.floor(Math.random() * 4) * 5 : 0, ing: r >= 0.25 && r < 0.4 && pc.gift.ing ? pc.gift.ing : null }; }
      const g = save.snapGift; G.paused = true;
      $('#mail-body').innerHTML = `<img class="pcard snap" alt="${pc.n}" src="${pcURL(sn.id, sn.v)}"><div class="pmsg"><b>呆猫寄来一张照片 · ${pc.from}</b><p>「${g.msg}」</p>${g.coins ? `<p class="gift">还夹着：存款 +¥${g.coins}</p>` : g.ing ? `<p class="gift">还夹着：${ING[g.ing].n} +2</p>` : ''}</div>`;
      show('mail'); return;
    }
    const pc = POSTCARDS.find((p) => p.id === save.mail); if (!pc) return;
    G.paused = true;
    const gift = pc.gift.calcium ? '一瓶钙片（盆盆跑得更快）' : pc.gift.coins ? `存款 +¥${pc.gift.coins}` : `${ING[pc.gift.ing].n} +${pc.gift.n}`;
    const wallGift = pc.id === 'huizhou' ? '<p class="gift">随信附画《白墙黛瓦》</p>' : '';
    const rec = (pc.recipes || []).map((k) => `<div class="prec"><img alt="" src="${dishURL(k)}"><b>${DISH[k].n}</b><small>新食谱</small></div>`).join('');
    $('#mail-body').innerHTML = `<img class="pcard" alt="${pc.n}" src="${pcURL(pc.id)}"><div class="pmsg">${ajuURL(pc.id) && !(ART['pc_' + pc.id] && !GREY) ? `<img class="aju" alt="呆猫" src="${ajuURL(pc.id)}">` : ''}<b>呆猫从「${pc.from}」寄来：${pc.n}</b><p>「${pc.msg}」</p>${rec ? `<div class="precs">${rec}</div>` : ''}<p class="gift">还寄来：${gift}</p>${wallGift}${pc.invite ? '<p class="invite">✈ 呆猫邀请盆盆去樱花之国开分店！（下一版开放）</p>' : ''}</div>`;
    show('mail');
  }
  $('#mail-ok').addEventListener('click', () => {
    const sn = snapOf(save.mail);
    if (sn) { const g = save.snapGift || {}; noteReceived('snap:' + sn.id + ':' + sn.v, g.msg); if (g.coins) save.coins += g.coins; if (g.ing) save.stock[g.ing] = stockOf(g.ing) + 2;
      save.snaps = (save.snaps || []).concat({ id: sn.id, v: sn.v, day: save.day }); save.mail = null; save.snapGift = null; persist(); sfx.coin(); G.paused = false; show('hud-screen'); return; }
    const pc = POSTCARDS.find((p) => p.id === save.mail);
    if (pc) {
      if (pc.gift.calcium) speedUp('吃了呆猫寄的钙片', G.D.x, G.D.y - 120); else if (pc.gift.coins) save.coins += pc.gift.coins; else save.stock[pc.gift.ing] = stockOf(pc.gift.ing) + pc.gift.n;
      (pc.recipes || []).forEach(learnRecipe); if (pc.invite) save.invite = pc.invite;
      noteReceived('card:' + pc.id);
      save.cards = (save.cards || []).concat(pc.id); save.mail = null; save.mailDay = save.day + 2; persist(); sfx.coin();
    }
    G.paused = false; show('hud-screen');
  });

  function openFishLesson() {
    G.paused = true; sfx.tap(); show('fish-lesson');
  }
  $('#fish-reel').onclick = () => {
    if (G?.mode !== 'day' || farmPhase() !== 'fish') return;
    catchFish(true); setFarmPhase('buy'); updateFarmLesson();
    G.paused = false; show('hud-screen');
  };
  function syncFishingPanel() {
    const fish = G?.D.fishing, panel = $('#yard-fishing');
    panel.hidden = G?.mode !== 'day' || !fish;
    if (panel.hidden) return;
    $('#yard-fish-text').textContent = {
      ready: '把鱼钩抛进水里。', cast: '看水面，等浮漂动。', bite: '浮漂沉下去了！',
    }[fish.stage];
    $('#yard-fish-action').textContent = { ready: '抛竿', cast: '试收线', bite: '收线' }[fish.stage];
  }
  $('#yard-fish-action').onclick = () => {
    const fish = G?.D.fishing;
    if (!fish || G.mode !== 'day') return;
    if (fish.stage === 'ready') {
      if (G.D.energy <= 0 && farmPhase() !== 'fish') { toast('今天的体力用完了，明早再来。'); return; }
      fish.stage = 'cast'; fish.t = 0; fish.wait = rand(1.45, 2.5); sfx.tap(); syncFishingPanel(); return;
    }
    if (fish.stage === 'cast') { toast('浮漂还没动，再等等。'); return; }
    const lesson = farmPhase() === 'fish';
    if ((G.D.energy > 0 || !lesson) && !spend()) return;
    G.D.fishing = null;
    catchFish(lesson);
    if (lesson) setFarmPhase('plan');
    syncFishingPanel();
  };
  $('#yard-fish-close').onclick = () => {
    if (!G) return;
    G.D.fishing = null; syncFishingPanel();
  };
  function catchFish(lesson = false) {
    const se = CUR_SE, pool = FISH.filter((f) => f.se.includes(se));
    const f = (lesson && pool.find((f) => f.ing === 'fish')) || pickW(pool), cm = Math.round(rand(f.size[0], f.size[1]));
    const rec = (save.fishDex[f.id] = save.fishDex[f.id] || { n: 0, max: 0 }), first = !rec.n;
    rec.n++; rec.max = Math.max(rec.max, cm);
    const point = YARD ? yardPlace('pond').sign : { x: 1600, y: 900 };
    const { x, y } = point;
    if (f.ing) { const n = f.ing === 'shrimp' ? 2 : 1; save.stock[f.ing] = stockOf(f.ing) + n; }
    if (f.coins) save.coins += f.coins;
    if (f.luck) save.luckDay = save.day;
    float(x, y, `钓到${f.n} ${cm}cm${f.ing ? ` · ${ING[f.ing].n}+${f.ing === 'shrimp' ? 2 : 1}` : f.coins ? ` · 卖了¥${f.coins}` : ' · 放生了'}`, '#3f6680', { fish: f.id }, 2.2);
    did('fish'); persist();
    if (first) setTimeout(() => toast(`新的鱼：${f.n}！记进笔记啦`), 300);
    sfx.ding();
  }
  // 今日菜单：开店前先选；没食材的地方在地图上高亮

  function farmShortages() {
    const needed = {};
    for (const k of menuNow()) {
      const ing = DISH[k].ing;
      if (prog().ings.includes(ing)) needed[ing] = (needed[ing] || 0) + 3;
    }
    return Object.fromEntries(Object.entries(needed).filter(([k, n]) => stockOf(k) < n)
      .map(([k, n]) => [k, n - stockOf(k)]));
  }
  const needIngs = () => { const n = {}; for (const k of menuNow()) { const ing = DISH[k].ing; if (stockOf(ing) < 6) n[ing] = true; } return n; };
  function openMenuPick() {
    if (!G) return; G.paused = true;
    const pick = new Set(mains(menuNow()));
    const sizes = G.tables.filter((t) => t.size === 4);
    const res = $('#menu-reserve');
    res.hidden = !regularDue() || !sizes.length;
    const selector = res.querySelector('select');
    selector.innerHTML = '<option value="">营业中自由安排</option>' + sizes.map((t) => '<option value="'+t.id+'">留四人桌 '+tableNumber(t.id)+'</option>').join('');
    if (save.prep?.day === save.day) selector.value = save.prep.table || '';
    else if (regularDue() && sizes.length > 1) selector.value = sizes[sizes.length - 1].id;
    for (const k of dishList()) if (isNewDish(k) && pick.size < menuSlots() && onMenu(k) && !DISH[k].dessert) pick.add(k); // 新菜先帮你放上
    const box = $('#menu-list');
    const render = () => {
      box.innerHTML = dishList().filter((k) => !DISH[k].dessert).map((k) => {
        const d = DISH[k], ok = onMenu(k), st = stockOf(d.ing), nw = isNewDish(k), tr = trendOf(k);
        return `<button class="mcard ${pick.has(k) ? 'on' : ''}" data-k="${k}" ${ok ? '' : 'disabled'}>${nw ? '<i class="newb">新</i>' : ''}${tr ? `<i class="trb ${tr}">${tr === 'hot' ? '流行' : '冷门'}</i>` : ''}${d.dessert ? '<i class="desb">甜品</i>' : ''}<img alt="" src="${dishURL(k)}"><b>${d.n}</b><span class="dt">${d.tags.map((t) => tagTiny(t)).join('')}</span>
          <span class="need ${st < 3 ? 'low' : ''}"><img alt="" src="${ingURL(d.ing)}">${ING[d.ing].n} × ${st}</span><small>${ok ? `${WARES[d.ware].n} · ¥${d.price}` : `要先买${WARES[d.ware].n}`}</small></button>`;
      }).join('');
const stations = {};
      const ingredients = {};
      for (const k of pick) {
        const { ware, ing } = DISH[k];
        stations[ware] = (stations[ware] || 0) + 1;
        ingredients[ing] = (ingredients[ing] || 0) + 1;
      }
      const lines = Object.entries(stations).map(([w, n]) => WARES[w].n + ' ' + n + ' 道');
      const low = Object.keys(ingredients).filter((ing) => stockOf(ing) < 3 * ingredients[ing]).map((ing) => ING[ing].n);
      $('#menu-plan').textContent = [dailyNote(), lines.length && '分工 ' + lines.join(' · '),
        Object.entries(stations).some(([, n]) => n > 1) && '同一炊具一次做一道。',
        low.length && '需补 ' + low.join('、'),
        regularDue() && !pick.has(REGULAR_DISH) && '菜单上还没有清汤面。'].filter(Boolean).join(' ');
      $('#menu-count').textContent = `已选 ${pick.size} / ${menuSlots()} 道`;
      box.querySelectorAll('.mcard').forEach((b) => b.addEventListener('click', () => {
        const k = b.dataset.k;
        if (pick.has(k)) pick.delete(k); else if (pick.size < menuSlots()) pick.add(k); else { toast(`今天最多上 ${menuSlots()} 道菜`); return; }
        sfx.tap(); render();
      }));
    };
    render();
    $('#menu-ok').onclick = () => {
      if (!mains([...pick]).length) { toast('至少选一道主菜'); return; }
      save.menu = [...pick]; save.menuDay = save.day;
      save.prep = { day: save.day, table: res.hidden ? null : Number(selector.value) || null };
      if (farmPhase() === 'plan') { setFarmPhase('buy'); updateFarmLesson(); }
      persist();
      G.paused = false; show('hud-screen');

    };
    show('menu');
  }
  // 早市（妈妈特价：每天一样东西半价）
  const SEED_PRICE = { chili: 1, peanut: 1 }; // 一颗种子种一格，收一个
  // 猫猫日报：第 7 天起每天一个流行口味、一个冷门口味
  const TREND_TAGS = ['辣', '麻', '甜', '面', '海鲜', '清淡', '肉', '米饭', '花生'];
  function rollTrend() {
    if (!prog().news) { save.trend = null; return; }
    if (save.trend && save.trend.day === save.day) return;
    const tags = TREND_TAGS.filter((t) => dishList().some((k) => !DISH[k].dessert && DISH[k].tags.includes(t)));
    const hot = tags[(save.day * 5 + 1) % tags.length], rest = tags.filter((t) => t !== hot);
    save.trend = { day: save.day, hot, cold: rest[(save.day * 3) % rest.length] };
  }
  const trendOf = (k) => { const tr = save && save.trend; if (!tr || tr.day !== save.day || !DISH[k]) return null; return DISH[k].tags.includes(tr.hot) ? 'hot' : DISH[k].tags.includes(tr.cold) ? 'cold' : null; };
  const special = () => { const ks = prog().ings; return ks[(save.day * 7 + 3) % ks.length]; };
  const dayHash = (k) => { let x = save.day * 131 + [...k].reduce((a, c) => a * 31 + c.charCodeAt(0), 7); x = Math.imul(x ^ (x >>> 13), 1274126177); return Math.abs(x ^ (x >>> 16)) % 1000; };
  const priceRate = (k) => [0.8, 0.9, 1, 1, 1.1, 1.3][dayHash(k) % 6]; // 每天价钱有涨有跌
  const priceOf = (k) => (k === special() ? Math.ceil(ING[k].price / 2) : Math.max(1, Math.round(ING[k].price * priceRate(k))));
  function mktLeft(k) { // 每样今天只有这么多
    if (!save.mkt || save.mkt.day !== save.day) save.mkt = { day: save.day, left: {} };
    if (save.mkt.left[k] == null) save.mkt.left[k] = k.endsWith('_seed') ? 12 + dayHash(k) % 10 : 8 + dayHash(k) % 9;
    return save.mkt.left[k];
  }
  function openMarket() {
    G.paused = true;
    const sp = special();
    const box = $('#market-list');
    const phase = farmPhase(), shortages = phase === 'buy' ? farmShortages() : {};
    $('#market-lesson').hidden = !['seed','buy'].includes(phase);
    $('#market-lesson').textContent = phase === 'seed' ? '教学券抵掉第一包的价钱。每颗种一格，明早成熟。' : '清单已扣除储藏室里的存量。';
    const canSeed = phase !== 'buy', canBuy = phase !== 'seed';
    box.innerHTML = (canSeed ? prog().seeds : []).map((k) => { const p = SEED_PRICE[k], nw = openDay('seeds', k) === save.day;
      const left = mktLeft(k + '_seed');
      if (phase === 'seed') return '<div class="mrow seed"><img alt="" src="' + ingURL(k) + '"><div><b>' + ING[k].n + '种子</b><small>种下后，下一天收成</small></div><button class="buy1" data-k="' + k + '" data-seed="1" data-n="3">领 3 颗</button></div>';
      return `<div class="mrow seed"><img alt="" src="${ingURL(k)}"><div><b>${ING[k].n}种子</b>${nw ? '<span class="tag-new">新</span>' : ''}<small>一颗种一格，明天收　·　有 ${save.seeds[k] || 0} 颗　·　<em class="left">今天还剩 ${left}</em></small></div>
        <span class="mp">¥${p}</span><button class="buy1" data-k="${k}" data-seed="1" data-n="3" ${save.coins >= p * 3 && left >= 3 ? '' : 'disabled'}>买 3</button><button class="buy1" data-k="${k}" data-seed="1" data-n="9" ${save.coins >= p * 9 && left >= 9 ? '' : 'disabled'}>买 9</button></div>`; }).join('')
    + (canBuy ? prog().ings.filter((k) => phase !== 'buy' || shortages[k]) : []).map((k) => {
      const p = priceOf(k), pending = Math.min(shortages[k] || 0, Math.floor(save.coins / priceOf(k)), mktLeft(k)), uses = Object.keys(DISH).filter((d) => DISH[d].ing === k && knownDish(d)).map((d) => DISH[d].n).join('、') || '泡茶';
      const nd = phase === 'buy' ? shortages[k] : needIngs()[k];
      const left = mktLeft(k), r = priceRate(k), trend = k === sp ? '' : r < 1 ? '<span class="tag-dn">今天便宜</span>' : r > 1 ? '<span class="tag-up">今天贵</span>' : '';

      if (phase === 'buy') return '<div class="mrow nd"><img alt="" src="' + ingURL(k) + '"><div><b>' + ING[k].n + '</b><small>已有 ' + stockOf(k) + ' 份 · 还差 ' + nd + ' 份</small></div>'
        + '<span class="mp">¥' + p + '</span><button class="buy1" data-k="' + k + '" data-n="' + pending + '" ' + (pending ? '' : 'disabled') + '>补 ' + pending + ' 份</button></div>';
      return `<div class="mrow ${k === sp ? 'sp' : ''} ${nd ? 'nd' : ''} ${left ? '' : 'out'}"><img alt="" src="${ingURL(k)}"><div><b>${ING[k].n}</b>${k === sp ? '<span class="tag-sp">妈妈特价 半价</span>' : trend}${nd ? '<span class="tag-nd">菜单要用</span>' : ''}<small>做 ${uses}　·　家里有 ${stockOf(k)}　·　<em class="left">${left ? `今天还剩 ${left}` : '卖完了'}</em></small></div>
        <span class="mp">¥${p}${p !== ING[k].price ? `<s>¥${ING[k].price}</s>` : ''}</span><button class="buy1" data-k="${k}" data-n="1" ${save.coins >= p && left >= 1 ? '' : 'disabled'}>买 1</button><button class="buy1" data-k="${k}" data-n="5" ${save.coins >= p * 5 && left >= 5 ? '' : 'disabled'}>买 5</button></div>`;
    }).join('');
    $('#market-coins').textContent = `存款 ¥ ${save.coins}`;
    box.querySelectorAll('.buy1').forEach((b) => b.addEventListener('click', () => {
      const k = b.dataset.k, n = +b.dataset.n, seed = !!b.dataset.seed;
      if (farmPhase() === 'seed' && seed) {
        save.seeds[k] = (save.seeds[k] || 0) + n; save.farmLessonSown = 0; did('seed'); setFarmPhase('plant'); sfx.coin();
        G.paused = false; show('hud-screen'); toast(teachingFarm().msg, 2600); return;
      }
      const cost = (seed ? SEED_PRICE[k] : priceOf(k)) * n;
      const lk = seed ? k + '_seed' : k; if (save.coins < cost || mktLeft(lk) < n) return;
      save.mkt.left[lk] -= n; save.coins -= cost; if (seed) { save.seeds[k] = (save.seeds[k] || 0) + n; did('seed'); } else { save.stock[k] = stockOf(k) + n; did('buy'); } persist(); sfx.coin(); openMarket();
    }));
    $('#market-ok').textContent = phase === 'buy' ? (Object.keys(shortages).length ? '先用现有食材' : '备齐了') : '买好了';
    show('market');
  }
  function openPantry() {
    if (!G) return; G.paused = true;
    $('#pantry-list').innerHTML = Object.keys(ING).filter((k) => stockOf(k) > 0 || (Object.keys(DISH).some((d) => DISH[d].ing === k && knownDish(d)) || (k === 'tealeaf' && prog().drinks.length))).map((k) => {
      const ds = Object.keys(DISH).filter((d) => DISH[d].ing === k);
      return `<div class="prow ${stockOf(k) ? '' : 'zero'} ${needIngs()[k] ? 'nd' : ''}"><img alt="" src="${ingURL(k)}"><b>${ING[k].n}</b><span class="cnt">× ${stockOf(k)}</span><small>${ING[k].src} · 做 ${ds.map((d) => DISH[d].n + (onMenu(d) ? '' : `（要${WARES[DISH[d].ware].n}）`)).join('、')}</small></div>`;
    }).join('');
    show('pantry');
  }

  // ---------- 顾客（一桌一伙人，1–4 位，每人各点各的） ----------
  // 首日保留四组教学客人。苏州使用营业时刻安排到店，空桌只影响入座。
  const DAY1 = [
    { type: 'shiba', size: 1, plan: [{ dish: 'mapo' }], when: 'start', arrival: 2.5 },
    { type: 'raccoon', size: 2, plan: [{ dish: 'mian', req: { t: 'no', top: '香菜' } }, { dish: 'mapo' }], when: 'prevFed', arrival: 23 },
    { type: 'bunny', size: 1, plan: [{ dish: 'mian' }], when: 'prevFed', arrival: 47 },
    { type: 'panda', size: 1, plan: [{ want: '面' }], when: 'empty', arrival: 75 },
  ];
  function scriptSpawn() {
    const sc = G.script; if (!sc.length) return;
    const nx = sc[0], last = G.lastScripted, since = G.t - (G.lastSpawnT || 0);
    if (SUZHOU) {
      if (G.t >= nx.arrival && spawnCustomer(nx)) sc.shift();
      return;
    }
    const ok = nx.when === 'start' ? G.t > 1.5
      : nx.when === 'prevFed' ? since > 6 && (!last || !G.customers.includes(last) || ['waitFood', 'eating', 'bill', 'linger', 'leaving'].includes(last.state))
        : since > 3 && G.customers.length === 0;
    if (!ok) return;
    const customer = spawnCustomer(nx);
    if (customer) { sc.shift(); G.lastScripted = customer; G.lastSpawnT = G.t; }
  }
  function chooseType() {
    if (G.omaAt != null && G.t >= G.omaAt) { G.omaAt = null; return pickW(CT.filter((t) => t.kind === 'omakase')); }
    return pickW(save.day <= 3 ? CT.filter((t) => t.kind === 'menu') : CT);
  }
  const inLine = (c) => ['queue', 'enter', 'called'].includes(c.state);
  const SEATED = ['toSeat', 'thirsty', 'reading', 'ordering', 'ordering-open', 'waitFood', 'eating', 'bill', 'linger'];
  const seated = (c) => c.table && SEATED.includes(c.state);
  function spawnCustomer(sc) {
    if (G.customers.filter(inLine).length >= QSPOTS.length) return null;
    const type = sc ? CT.find((t) => t.id === sc.type) : chooseType();
    let size = sc ? sc.size : pick(type.sizes); if (!sc && save.day <= 3) size = Math.min(size, 2);
    const c = { id: G.nextId++, type, size, state: 'enter', x: DOOR.x, y: DOOR.y, path: [], hearts: 5, timer: 0, table: null, script: sc ? sc.plan : null,
      members: [], say: '', sayT: 0, bob: Math.random() * 6, upset: false, watered: false, wantsWater: false,
      looks: Array.from({ length: size }, () => { const n = (GUEST_ART[type.id] || CUSTOMER_VARIANTS[type.id] || [0]).length; return n > 1 ? `${type.id}#${Math.floor(Math.random() * n)}` : type.id; }) };
    if (sc?.regular) { c.regular = true; c.looks[0] = G.visit.look || c.looks[0]; }
    if (SUZHOU) c.looks.forEach(guestFrames);
    dexOf(type.id).met++;
    G.customers.push(c);
    if (!wouldEat(c)) { c.state = 'browse'; c.timer = 2.4; return c; } // 主人 11/25：不想吃的，在门口看完菜单就走，不进来排队
    layoutQueue(); sfx.tap();
    if (c.regular) { c.say = '我带姐妹来啦。'; c.sayT = 4; }
    return c;
  }
  function wouldEat(c) { // 今天的菜单里有没有这桌能吃的（只看，不占食材）
    if (c.script) return true;
    const ok = mains(menuNow()).filter(canCook);
    return c.type.kind === 'menu' ? ok.length > 0 : ok.some((k) => !DISH[k].tags.some((x) => c.type.hates.includes(x)));
  }
  function layoutQueue() { // 候位也按格子找路（G-004：门站位到候位 4 的直线会穿门侧墙）
    G.customers.filter(inLine).forEach((c, i) => {
      const spot = QSPOTS[i];
      if (c.qi === i) return;
      c.qi = i; c.path = findPath(c, spot) || (noWay('客人', QSPOTS[i]), []);
    });
  }
  function speak(c, key) { c.say = c.type.say[key]; c.sayT = 2.6; }
  function addHeart(c, n = 1) { c.hearts = Math.min(5, c.hearts + n); }
  function leave(c, angry) {
    const fromT = c.table && seated(c) && c.state !== 'toSeat' ? c.table : null; // 坐着走的：先回桌边
    // 还没下单就走：预留的食材退回库存
    for (const m of c.members) if (m.reserved && m.st === 'none') save.stock[DISH[m.dish].ing] = stockOf(DISH[m.dish].ing) + 1;
    if (c.table) { // 桌上吃过的盘子都留下，等着收（包括生气走掉的、加过甜品的）
      const t = c.table, used = c.members.filter((m) => m.st === 'served').length + (c.extraPlates || 0);
      if (t.cust === c) t.cust = null; c.table = null; if (used) t.dirty = (+t.dirty || 0) + used;
    }
    const k = G.kitchen;
    for (const w of Object.values(k.wares)) { w.q = w.q.filter((o) => o.cust !== c); if (w.cur && w.cur.cust === c) w.cur = null; }
    const gone = k.pass.filter((o) => o.cust === c).length; if (gone) { k.pass = k.pass.filter((o) => o.cust !== c); G.plates.dirty += gone; } // 出菜台上的菜撤下：盘子算脏盘
    k.drinkQ = k.drinkQ.filter((o) => o.cust !== c); k.drinkReady = k.drinkReady.filter((o) => o.cust !== c); if (k.drinkCur && k.drinkCur.cust === c) k.drinkCur = null;
    const w = G.waiter;
    w.tickets = w.tickets.filter((t) => t.c !== c);
    G.plates.dirty += w.hands.filter((h) => h.cust === c && h.kind === 'dish').length; // 盆盆手上的菜撤下：盘子算脏盘
    w.hands = w.hands.filter((h) => h.cust !== c);
    if (G.selected === c) G.selected = null;
    for (const t of G.tables) if (t.reserved === c) t.reserved = null;
    if (w.busyAct && w.busyAct.cust === c) { w.busyAct = null; w.path = []; }
    w.queue = w.queue.filter((a) => a.cust !== c);
    c.state = 'leaving'; c.path = viaTable(c, fromT, DOOR, false);
    if (angry) { G.angry++; G.rep--; speak(c, 'angry'); sfx.bad(); }
    layoutQueue();
  }
  // 心情下降速度（每秒掉几颗心）
  const SINK_DROP_TIME = 0.65;
  const sinkDiscard = (h) => ['plate', 'water', 'tea', 'snack'].includes(h.kind);
  const DRAIN = { queue: 1 / 32, called: 1 / 32, thirsty: 1 / 20, ordering: 1 / 22, waitFood: 1 / 26, bill: 1 / 18 };
  function startOrdering(c) {
    for (let i = c.members.length; i < c.size; i++) c.members.push(makeOrder(c));
    c.members = c.members.filter(Boolean);
    if (!c.members.length) { c.say = '没有想吃的……下次再来。'; c.sayT = 2.4; const t = c.table; leave(c, false); if (t) t.dirty = 0; return; }
    c.state = 'ordering'; speak(c, 'order'); sfx.ding();
  }
  function giveWater(c) {
    c.watered = true; addHeart(c, 1); did('water');
    const a = anchor(c); float(a.x, a.y - 20, '喝口水 +♥', '#4a7fb5');
    if (c.state === 'thirsty') { c.state = 'reading'; c.timer = SUZHOU ? 4 : 2; }
  }

  // ---------- 盆盆的动作 ----------
  function enqueue(act) {
    const w = G.waiter;
    if (w.queue.length >= MAXQ) { toast(`盆盆一口气最多记 ${MAXQ} 件事，先等一等`); return false; }
    w.queue.push(act); sfx.tap(); return true;
  }
  function queueApproach(c) {
    return SUZHOU && QSPOTS[c.qi]?.approach || { x: c.x + 56, y: c.y + 6 };
  }
  function targetSpot(act) {
    if (act.kind === 'table') return act.table.spot;
    if (act.kind === 'seat') return act.phase === 1 ? queueApproach(act.cust) : act.table.spot;
    if (act.kind === 'give') return act.cust.table ? act.cust.table.spot : queueApproach(act.cust);
    if (act.kind === 'tea' || act.kind === 'snack') return SUZHOU && act.kind === 'tea' ? WATER.spot : TEA.spot;
    if (act.kind === 'pass') return PASS.spot;
    if (['water', 'dump', 'pour'].includes(act.kind)) return WATER.spot;
    if (act.kind === 'sink') return SINK.spot;
    return IDLE;
  }
  const COMFORT = { tea: { hearts: 2, cost: 2 }, snack: { hearts: 3, cost: 5 } };
  function giveComfort(c) {
    const w = G.waiter;
    const i = w.hands.findIndex((h) => h.kind === 'tea' || h.kind === 'snack');
    if (i < 0 || !c || c.state === 'leaving') return false;
    const it = w.hands.splice(i, 1)[0];
    addHeart(c, COMFORT[it.kind].hearts);
    if (it.kind === 'snack' && c.upset) { c.upset = false; speak(c, 'happy'); }
    const a = anchor(c);
    float(a.x, a.y - 20, it.kind === 'tea' ? '喝口茶 +♥♥' : '吃点心 +♥♥♥', '#c0506a'); sfx.ding();
    return true;
  }
  const full = () => G.waiter.hands.length >= 2;
  function readyMeals() {
    const groups = new Map();
    for (const dish of G.kitchen.pass) {
      if (!dish.cust.table || dish.cust.state === 'leaving') continue;
      if (!groups.has(dish.cust)) groups.set(dish.cust, []);
      groups.get(dish.cust).push(dish);
    }
    return [...groups].flatMap(([c, dishes]) => {
      const waiting = c.members.filter((m) => m.st === 'cook').length;
      return waiting && dishes.length === waiting ? [dishes] : [];
    });
  }
  function pickUpMeal(dishes) {
    const pass = G.kitchen.pass;
    for (const dish of dishes) pass.splice(pass.indexOf(dish), 1);
    return dishes.map((dish) => ({ kind: 'dish', ...dish }));
  }
  const sameTops = (a = {}, b = {}) => Object.keys({ ...a, ...b }).every((k) => !!a[k] === !!b[k]);
  // 端给了点同样东西的另一桌：把原来给这位的那份（还在锅里 / 出菜台 / 谁手上）改给原主人
  function swapOwner(h, c2, mi2) {
    const c1 = h.cust, mi1 = h.mi;
    const pools = [G.kitchen.pass, G.waiter.hands, ...Object.values(G.kitchen.wares).flatMap((wr) => [wr.q, wr.cur ? [wr.cur] : []]), ...G.staff.flatMap((sf) => [sf.hands, sf.task && sf.task.o ? [sf.task.o] : [], sf.brew ? [sf.brew.o] : []])];
    for (const pool of pools) for (const o of pool) if (o !== h && o.cust === c2 && o.mi === mi2 && (h.kind === 'drink' ? o.drink === h.drink : o.dish === h.dish)) { o.cust = c1; o.mi = mi1; o.table = c1.table ? c1.table.id : o.table; }
    if (h.kind === 'drink') { c1.members[mi1].dClaim = c2.members[mi2].dClaim; c2.members[mi2].dClaim = 'w'; }
    h.cust = c2; h.mi = mi2; h.table = c2.table.id;
  }
  // 还没做的饮品单：已经下单、没人在泡
  const drinkWants = () => { const out = []; for (const c of G.customers) if (c.table && c.state !== 'leaving') c.members.forEach((m, i) => { if (m.drink && m.dst === 'make' && !m.dClaim) out.push({ c, m, mi: i, drink: m.drink, table: c.table.id }); }); return out; };
  function doAction(act) {
    const w = G.waiter;
    if (act.kind === 'seat') { // 第二段：把客人领到桌边
      const c = act.cust, t = act.table;
      t.reserved = null;
      if (c.state !== 'following') return;
      const seatPath = viaTable(c, t, t.seats[0], true);
      if (!seatPath) { c.state = 'queue'; layoutQueue(); return; } // 坐不过去：放掉桌子，回去排队
      t.cust = c; c.table = t; c.state = 'toSeat'; c.path = seatPath; addHeart(c); sfx.tap(); did('seat');
      return;
    }
    if (act.kind === 'tea' || act.kind === 'snack') {
      if (full()) return;
      const cf = COMFORT[act.kind];
      w.hands.push({ kind: act.kind }); G.coins -= cf.cost; float(TEA.cx, TEA.cy - 120, `-¥${cf.cost}`, '#8a6a50'); sfx.tap();
      return;
    }
    if (act.kind === 'water') { if (full()) return; w.hands.push({ kind: 'water' }); sfx.tap(); return; }
    if (act.kind === 'dump') { const wi = w.hands.findIndex((h) => h.kind === 'water'); if (wi >= 0) { w.hands.splice(wi, 1); float(WATER.x, WATER.y - 40, '把水倒掉了', '#4a7fb5'); sfx.tap(); } return; }
    if (act.kind === 'pour') { // 泡一杯客人点的饮品：站在茶水台等几秒
      if (full()) return;
      const o = drinkWants().filter((x) => x.drink === act.drink).sort((a, b) => a.c.id - b.c.id)[0];
      if (!o) return;
      o.m.dClaim = 'w'; w.brew = { drink: o.drink, t: 0, need: DRINKS[o.drink].brew, o: { kind: 'drink', drink: o.drink, table: o.table, cust: o.c, mi: o.mi } };
      return;
    }
    if (act.kind === 'give') { giveComfort(act.cust); return; }
    if (act.kind === 'pass') {
      if (SUZHOU && act.step === 'pickup') {
        const meal = readyMeals().find((dishes) => dishes.includes(act.order) && !dishes.some((dish) => dish.claim));
        if (meal && !w.hands.length) { w.hands.push(...pickUpMeal(meal)); sfx.tap(); did('pick'); }
        return;
      }
      // 先把单子交给老大，菜才开始做。
      if (w.tickets.length) {
        for (const tk of w.tickets) { if (tk.c.state === 'leaving') continue; tk.items.forEach((o) => G.kitchen.wares[DISH[o.dish].ware].q.push(o)); const r = G.kitchen.rail; if (!r.includes(tk.c)) r.push(tk.c); tk.c.railDone = 0; }
        if (SUZHOU && SPIKE) float(SPIKE.x - 10, SPIKE.y - 52, '已插单', '#775541', null, 1.05);
        else float(PASS.spot.x - 60, PASS.spot.y - 90, `单子挂上去了（${w.tickets.length} 张）`, '#8a5a10', 'order');
        w.tickets = []; sfx.ding(); did('pass');
      }
      if (SUZHOU) return;
      let got = 0;
      const wanted = w.queue.filter((a) => a.kind === 'table' && a.table.cust).map((a) => a.table.cust);
      const order = G.kitchen.pass.filter((o) => !o.claim).sort((a, b) => (wanted.includes(b.cust) ? 1 : 0) - (wanted.includes(a.cust) ? 1 : 0));
      for (const o of order) { if (w.hands.length >= 2) break; G.kitchen.pass.splice(G.kitchen.pass.indexOf(o), 1); w.hands.push({ kind: 'dish', ...o }); got++; }
      if (got) { sfx.tap(); did('pick'); }
      return;
    }
    if (act.kind === 'sink') { // 收碗处：脏盘子放下，多余的水、茶、点心也可以倒掉
      const junk = sinkDiscard;
      const n = w.hands.filter(junk).length, plates = w.hands.reduce((a, h) => a + (h.kind === 'plate' ? h.n || 1 : 0), 0); // 一摞几个盘子就算几个（以前一摞只算 1 个）
      w.hands = w.hands.filter((h) => !junk(h));
      if (plates) {
        G.plates.dirty += plates;
        if (SUZHOU && !save.did.wash && !G.washLessonUntil) {
          G.washLessonUntil = G.t + 12;
          toast('再点洗碗池洗盘子。老大有空也会帮忙。', 4200);
        }
      }
      if (n) { sfx.tap(); float(SINK.x + 20, SINK.y - 70, plates ? '放进洗碗池' : '倒掉了', '#4a7fb5'); if (plates) did('sink'); }
      else if (G.plates.dirty > 0 && !w.hands.length) G.waiter.wash = { t: 0, n: Math.min(4, G.plates.dirty) };
      return;
    }
    if (act.kind === 'table') {
      const t = act.table, c = t.cust;
      if (c && c.state !== 'leaving') {
        const mine = w.hands.filter((h) => (h.kind === 'dish' || h.kind === 'drink') && h.cust === c);
        if (mine.length) {
          for (const h of mine) {
            w.hands.splice(w.hands.indexOf(h), 1);
            if (h.kind === 'drink') serveDrink(c, h); else serve(c, h);
          }
          return;
        }
        if (SUZHOU && w.hands.some((h) => h.kind === 'dish')) { toast('这托菜是另一桌的'); return; }
        const other = w.hands.filter((h) => (h.kind === 'dish' || h.kind === 'drink') && h.cust !== c);
        if (other.length && c.members.some((m) => m.st === 'cook' || m.dst === 'make')) {
          for (const h of other) { // 这桌也点了一样的：直接给这桌，原来那桌的那份顺延
            const mi = h.kind === 'dish' ? c.members.findIndex((m) => m.st === 'cook' && m.dish === h.dish && sameTops(m.tops, h.tops)) : c.members.findIndex((m) => m.dst === 'make' && m.drink === h.drink);
            if (mi >= 0) { swapOwner(h, c, mi); w.hands.splice(w.hands.indexOf(h), 1); h.kind === 'drink' ? serveDrink(c, h) : serve(c, h); return; }
          }
          const a = anchor(c); speak(c, 'bad'); float(a.x, a.y - 20, '这不是我点的', '#d0453a', 'cross'); c.hearts = Math.max(0.5, c.hearts - 1); sfx.bad(); G.wrong++; return;
        }
        const wi = w.hands.findIndex((h) => h.kind === 'water');
        if (wi >= 0 && c.state === 'thirsty') { w.hands.splice(wi, 1); giveWater(c); return; }
        if (c.state === 'ordering' && c.members.some((m) => m.dessert && m.st === 'none') && c.members.every((m) => m.st !== 'none' || m.dessert)) { // 甜品：客人说了就记，不用开面板
          sendTicket(c, c.members.map((m, i) => [m, i]).filter(([m]) => m.st === 'none')); const a = anchor(c); float(a.x, a.y - 20, '加一份桂花糕', '#8a5a10', 'order'); return;
        }
        if (c.state === 'ordering' || c.state === 'reading') { if (c.state === 'reading') startOrdering(c); if (c.state === 'ordering') { openOrder(c); did('order'); } return; }
        if (!['eating', 'linger', 'bill'].includes(c.state) && (c.hearts < 4.5 || c.upset) && giveComfort(c)) return;
        if (wi >= 0 && !c.watered && !['bill', 'linger'].includes(c.state)) { w.hands.splice(wi, 1); giveWater(c); return; }
        if (c.state === 'bill') { pay(c); return; }
        return; // 这会儿没事可做：直接换下一件
      }
      if (!c && t.dirty) {
        if (full()) return;
        w.hands.push({ kind: 'plate', n: t.dirty }); t.dirty = 0; t.busClaim = null; sfx.tap(); did('bus'); return;
      }
    }
  }
  function serve(c, o) {
    const m = c.members[o.mi], d = DISH[o.dish], a = anchor(c);
    if (!m || m.st !== 'cook' || c.state === 'leaving') { G.plates.dirty++; return; } // 菜已离手但用不上：盘子算脏盘
    const refuse = (why) => {
      speak(c, 'bad'); sfx.bad(); float(a.x, a.y - 20, why, '#d0453a');
      c.hearts = Math.max(0.6, c.hearts - 2); c.upset = true; G.rep--; G.wrong++;
    };
    if (m.dessert) { float(a.x, a.y - 20, '甜甜的～', '#c0506a', 'heart', 1.6); }
    else if (m.kind === 'menu') {
      if (m.req && m.req.t === 'no' && o.tops[m.req.top]) { // 放了不要的配料：老大马上重做一份
        refuse(`说了不要${m.req.top}！`);
        const fix = { ...o, tops: { ...o.tops, [m.req.top]: false }, claim: null };
        G.kitchen.wares[d.ware].q.push(fix);
        toast(has('snack') ? '老大重新做一份；可以送点心哄一哄' : '老大重新做一份');
        G.plates.dirty++; return; // 退回的那盘算脏盘，重做的出锅再领新盘
      }
      m.good = !m.req || (m.req.t === 'add' ? !!o.tops[m.req.top] : true);
      if (!m.good) { c.hearts -= 1; float(a.x, a.y - 20, `没加${m.req.top}……`, '#b06a3a'); }
    } else {
      const hate = d.tags.filter((t) => c.type.hates.includes(t));
      if (hate.length) {
        refuse(`不吃${hate[0]}！要换一道`); learn(c, 'hates', hate);
        m.st = 'none'; m.dish = null; c.state = 'ordering';
        G.plates.dirty++; return; // 退回的那盘算脏盘
      }
      const likes = d.tags.filter((t) => c.type.likes.includes(t)), dis = d.tags.filter((t) => c.type.dislikes.includes(t));
      m.good = d.tags.includes(m.want); m.likeN = likes.length; m.disN = dis.length;
      // 像夜雀食堂一样：每个喜欢的口味冒一颗爱心，不喜欢的冒一个皱眉
      let k = 0;
      if (m.good) float(a.x, a.y - 20, '正合我意！', '#c0506a', 'heart', 1.8);
      else { c.hearts -= 0.5; float(a.x, a.y - 20, '嗯……不太是我想吃的', '#b06a3a', 'meh', 1.8); }
      for (const t of likes) { k++; const kk = k; setTimeout(() => G && float(a.x - 70 + kk * 46, a.y - 52, `♥${t}`, '#c0506a', t, 1.6), kk * 260); }
      for (const t of dis) { k++; const kk = k; c.hearts -= 0.5; setTimeout(() => G && float(a.x - 70 + kk * 46, a.y - 52, `✕${t}`, '#a8322a', t, 1.6), kk * 260); }
      learn(c, 'likes', likes); learn(c, 'dislikes', dis);
    }
    m.st = 'served'; addHeart(c, 0.5); sfx.ding(); did('serve');
    if (SUZHOU && !G.signatureServed && m.good && save.signature?.day === save.day && save.signature.dish === o.dish) {
      G.signatureServed = true; addHeart(c, 0.5);
      float(a.x, a.y - 48, '今日招牌', '#a15b55', 'heart', 2);
    }
    if (trendOf(o.dish) === 'hot') { m.hot = true; addHeart(c, 1); setTimeout(() => G && float(a.x + 60, a.y - 70, '流行！+♥', '#b04a3c', 'heart', 1.6), 500); }
    else if (trendOf(o.dish) === 'cold') c.hearts -= 0.5;
    save.dishDex[o.dish] = (save.dishDex[o.dish] || 0) + 1;
    if (c.members.every((x) => x.st === 'served')) { c.state = 'eating'; c.timer = (c.type.eat + c.size) * (SUZHOU ? 2 : 1); }
  }
  function serveDrink(c, o) {
    const m = c.members[o.mi]; if (!m || m.dst !== 'make' || c.state === 'leaving') return;
    m.dst = 'served'; addHeart(c, 0.5);
    const a = anchor(c); float(a.x, a.y - 20, DRINKS[o.drink].n, '#4a7fb5', 'water', 1.4); sfx.ding();
  }
  function pay(c) {
    let price = 0, bonus = 0, allGood = true;
    for (const m of c.members) {
      if (m.dst === 'served') price += DRINKS[m.drink].price;
      const p = DISH[m.dish].price; price += p + (m.prevPaid || 0);
      if (!m.good) { allGood = false; continue; }
      bonus += m.kind === 'menu' ? p * (m.req ? 0.25 : 0.1) : p * Math.max(0, 0.25 + 0.12 * Math.max(0, (m.likeN || 1) - 1) - 0.1 * (m.disN || 0));
    }
    const base = c.upset ? 0 : Math.round(c.hearts * 1.5 * c.size + bonus), happy = !c.upset && c.hearts >= 3;
    let tip = base, gift = null, candy = false;
    if (c.type.tip === 'fixed') tip = c.upset ? 0 : 3 * c.members.length * (c.hearts >= 4 ? 2 : 1);
    else if (c.type.tip === 'candy') { tip = 0; candy = happy; }
    else if (c.type.tip === 'goods') { tip = Math.round(base / 2); const pool = prog().ings.filter((k) => k !== 'tealeaf'); if (happy && pool.length) { gift = pick(pool); save.stock[gift] = stockOf(gift) + c.members.length; } }
    else if (c.type.tip === 'fishy') { if (happy && Math.random() < 0.5) { gift = 'fish'; save.stock.fish = stockOf('fish') + 1; } }
    else if (c.type.tip === 'generous') tip = happy ? Math.round(base * 1.5) : base;
    else if (c.type.tip === 'perfect') tip = allGood && !c.upset ? Math.round(base * 2.5) : 0;
    if (candy) G.rep++;
    const hotN = c.members.filter((m) => m.hot).length; if (hotN) tip += Math.round(tip * hotN / c.members.length); // 流行菜小费翻倍
    if (allGood && !c.upset) G.rep++;
    G.coins += price + tip; G.tips += tip; G.served += c.members.length;
    const a = anchor(c);
    float(a.x + 40, a.y, `+¥${price + tip}`, '#c98a12', 'bill');
    if (tip > 0) setTimeout(() => G && float(a.x + 40, a.y - 36, `小费 ¥${tip}${c.members.some((m) => m.kind === 'omakase' && m.likeN > 1) ? ' ♥' : ''}`, '#c0506a', 'heart'), 300);
    if (candy) setTimeout(() => G && float(a.x + 40, a.y - 72, '送你一颗糖 · 人气+1', '#c0506a', 'heart', 1.6), 700);
    if (gift) setTimeout(() => G && float(a.x + 40, a.y - 72, gift === 'fish' && c.type.tip === 'fishy' ? '叼来一条鱼！' : `塞给你 ${ING[gift].n}×${c.members.length}`, '#3f7a34', null, 1.6), 700);
    if (c.type.tip === 'perfect' && !tip && !c.upset) setTimeout(() => G && float(a.x + 40, a.y - 72, '没有全合口味，不给小费', '#8a6a50', null, 1.6), 700);
    speak(c, 'happy'); sfx.coin(); did('pay');
    if (SUZHOU && c.regular) {
      const favorites = c.members.filter((m) => m.dish === REGULAR_DISH && m.good).length;
      G.visit.gift = happy && favorites >= 2;
      c.say = G.visit.gift ? '姐妹们也爱这碗面。\n这盆花送你！' : '下次再来喝碗清汤。';
      c.sayT = 5.2; c.state = 'linger'; c.timer = 5.2; return;
    }
    if (SUZHOU && !save.regular && !G.invitedRegular && c.type.id === 'raccoon' && happy && allGood) {
      G.invitedRegular = { due: Math.max(3, save.day + 1), look: c.looks[0] };
      if (save.day > 1) { c.say = '改天带三位姐妹来吃面。'; c.sayT = 4.6; c.state = 'linger'; c.timer = 4.6; return; }
    }
    if (Math.random() < (c.size > 1 ? 0.6 : 0.25)) { c.state = 'linger'; c.timer = c.size > 1 ? rand(4, 7) : rand(2, 4); return; } // 一伙人吃饱了聊会儿天；一个人偶尔坐一会
    finishLeave(c);
  }
  function finishLeave(c) { leave(c, false); } // 盘子数在 leave 里按实际上过的菜算

  // ---------- 点单面板：普通客勾一两样配料，随缘客挑一道菜 ----------
  const dataURL = (svg) => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  const URLS = {};
  const dishURL = (k) => URLS['d' + k] || (URLS['d' + k] = dataURL(dishSVG(k === 'guihua' ? 'snack' : k)));
  const ingURL = (k) => URLS['i' + k] || (URLS['i' + k] = dataURL(ingSVG(k)));
  const iconURL = (k) => URLS['ic' + k] || (URLS['ic' + k] = dataURL(iconSVG(k)));
  const tagChip = (t, cls = '') => `<span class="chip ${cls}"><img alt="" src="${iconURL(t)}">${t}</span>`;
  const tagTiny = (t, cls = '') => `<span class="tg ${cls}"><img alt="" src="${iconURL(t)}">${t}</span>`;
  const custURL = (id) => URLS['c' + id] || (URLS['c' + id] = dataURL(catSVG(id, 'front', { w: 120, h: 132 })));
  function openOrder(c) {
    G.orderOpen = c; c.state = 'ordering-open';
    const panel = $('#order');
    const pend = c.members.map((m, i) => [m, i]).filter(([m]) => m.st === 'none');
    const dx = dexOf(c.type.id);
    // 一位客人一列，最多 4 列，整桌一屏放下；要求用醒目的牌子标出来
    const reqTag = (m) => m.req ? `<div class="req ${m.req.t}"><img alt="" src="${iconURL(m.req.t === 'no' ? 'cross' : 'heart')}"><b>${m.req.t === 'no' ? '不要' : '多加'}${m.req.top}</b></div>` : '<div class="req none">没有特别要求</div>';
    const drinkTag = (m) => m.drink ? `<div class="drk"><span class="cupdot" style="background:${DRINKS[m.drink].col}"></span>饮品：<b>${DRINKS[m.drink].n}</b> <small>¥${DRINKS[m.drink].price} · 茶水台${DRINKS[m.drink].verb}${DRINKS[m.drink].brew}秒</small></div>` : '<div class="drk none">不要饮品</div>';
    const cols = pend.map(([m, i]) => {
      const head = `<div class="ohd"><img class="av" alt="" src="${custURL((c.looks && c.looks[0]) || c.type.id)}"></div>`;
      if (m.kind === 'menu') {
        const tops = DISH[m.dish].tops.map(([n]) => `<button class="tp ${m.tops[n] ? 'on' : ''} ${m.req && m.req.top === n ? 'must' : ''}" data-i="${i}" data-t="${n}">${n}</button>`).join('');
        return `<div class="ocol">${head}<div class="od"><img alt="" src="${dishURL(m.dish)}"><b>${DISH[m.dish].n}</b></div>${reqTag(m)}<div class="tops">${tops}</div>${drinkTag(m)}</div>`;
      }
      const unk = (list, known) => list.filter((x) => !known.includes(x)).length;
      const kl = c.type.likes.filter((x) => dx.likes.includes(x)), kd = c.type.dislikes.filter((x) => dx.dislikes.includes(x)), kh = c.type.hates.filter((x) => dx.hates.includes(x));
      const row = (lab, all, known, cls) => `<span class="prow2"><span class="plab">${lab}</span>${known.map((x) => tagTiny(x, cls)).join('')}${unk(all, known) ? `<span class="tg unk">？×${unk(all, known)}</span>` : ''}</span>`;
      const cards = mains(menuNow()).map((k) => {
        const d = DISH[k], left = stockOf(d.ing);
        const tg = d.tags.map((t) => `<img class="${t === m.want ? 'want' : kl.includes(t) ? 'good' : kh.includes(t) ? 'bad' : kd.includes(t) ? 'meh' : ''}" alt="${t}" title="${t}" src="${iconURL(t)}">`).join('');
        return `<button class="dcard ${m.dish === k ? 'on' : ''}" data-i="${i}" data-k="${k}" ${left ? '' : 'disabled'}><img class="di" alt="" src="${dishURL(k)}"><span class="dn">${d.n}</span><span class="dt">${tg}</span></button>`;
      }).join('');
      return `<div class="ocol oma"><div class="ohd">${head.replace(/^<div class="ohd">|<\/div>$/g, '')}<div class="req want"><img alt="" src="${iconURL(m.want)}"><b>想吃${m.want}</b></div></div><div class="pref">${row('喜欢', c.type.likes, kl, 'good')}${row('不吃', c.type.hates, kh, 'bad')}${kd.length ? row('不太喜欢', c.type.dislikes, kd, 'meh') : ''}</div><div class="dlist">${cards}</div>${drinkTag(m)}</div>`;
    }).join('');
    panel.style.setProperty('--n', pend.length);
    panel.innerHTML = `<button class="oclose" aria-label="等一下再点">✕</button><div class="ohead"><b>${tableNumber(c.table.id)} 号桌 · ${c.type.n}${c.size > 1 ? ` 一行 ${c.size} 位` : ''}</b><span>「${c.upset ? '上一道不行，换一道吧。' : c.type.say.order}」　${c.type.kind === 'omakase' ? '随缘客：按口味挑菜（绿=喜欢 红=不吃）' : '点菜客：照红色 / 绿色的要求点配料'}</span></div>
      <div class="ocols">${cols}</div><button class="go"></button>`;
    const go = panel.querySelector('.go');
    panel.querySelector('.oclose').addEventListener('click', () => { G.orderOpen = null; panel.classList.remove('show'); if (c.state === 'ordering-open') c.state = 'ordering'; sfx.tap(); });
    const refresh = () => {
      const left = pend.filter(([m]) => !m.dish).length;
      go.disabled = left > 0; go.textContent = left ? `还有 ${left} 位没选菜` : `下单（${pend.length} 道）`;
    };
    panel.querySelectorAll('.tp').forEach((b) => b.addEventListener('click', () => {
      const m = c.members[+b.dataset.i], n = b.dataset.t; m.tops[n] = !m.tops[n]; b.classList.toggle('on', m.tops[n]); sfx.tap();
    }));
    // 同一桌可以点一样的，也可以不一样；只看库存够不够（同桌已选的会占用份数）
    const chosen = (k, i) => pend.filter(([m, j]) => j !== i && m.kind === 'omakase' && m.dish && DISH[m.dish].ing === DISH[k].ing).length;
    const sync = () => panel.querySelectorAll('.dcard').forEach((x) => { x.disabled = x.classList.contains('on') ? false : stockOf(DISH[x.dataset.k].ing) - chosen(x.dataset.k, +x.dataset.i) <= 0; });
    panel.querySelectorAll('.dcard').forEach((b) => b.addEventListener('click', () => {
      const i = +b.dataset.i;
      c.members[i].dish = b.dataset.k; sfx.tap();
      panel.querySelectorAll(`.dcard[data-i="${i}"]`).forEach((x) => x.classList.toggle('on', x === b)); sync(); refresh();
    }));
    sync();
    go.addEventListener('click', () => {
      if (pend.some(([m]) => !m.dish)) return;
      sendTicket(c, pend); did('go'); if (pend.some(([m]) => m.req)) did('req'); if (pend.some(([m]) => m.kind === 'omakase')) did('oma');
      G.orderOpen = null; panel.classList.remove('show');
    });
    refresh(); panel.classList.add('show');
  }

  function sendTicket(c, pend) {
    const ticket = { c, items: [], drinks: [] };
    for (const [m, i] of pend) {
      if (m.kind === 'omakase' && !m.dessert) { useStock(m.dish); m.tops = {}; DISH[m.dish].tops.forEach(([n, d]) => { m.tops[n] = !!d; }); }
      m.st = 'cook'; m.reserved = false;
      ticket.items.push({ table: c.table.id, dish: m.dish, tops: { ...m.tops }, cust: c, mi: i, cook: DISH[m.dish].cook });
      if (m.drink && m.dst === 'none') { m.dst = 'make'; ticket.drinks.push({ table: c.table.id, drink: m.drink, cust: c, mi: i }); }
    }
    const w = G.waiter; w.tickets.push(ticket); // 单子拿在手上，点挂单柱交给厨师。
    c.state = 'waitFood'; addHeart(c, 0.5); sfx.ding();
  }
  // 吃完有的客人再加一份甜品（第 5 天解锁桂花糕）
  function dessertAsk(c) {
    if (c.dessertDone || c.script || !menuNow().includes('guihua') || !canCook('guihua')) return false;
    c.dessertDone = true;
    const t = c.type, p = t.kind === 'omakase' ? (t.hates.includes('甜') ? 0 : t.likes.includes('甜') ? 0.7 : 0.25) : 0.35;
    if (Math.random() > p) return false;
    const m = pick(c.members); m.prevPaid = (m.prevPaid || 0) + DISH[m.dish].price;
    if (m.st === 'served') c.extraPlates = (c.extraPlates || 0) + 1; // 主菜的盘子还在桌上（以前这个盘子会凭空消失）
    Object.assign(m, { dish: 'guihua', st: 'none', tops: {}, req: null, reserved: true, dessert: true }); useStock('guihua');
    c.state = 'ordering'; c.say = '再来一份甜的！'; c.sayT = 2.4; sfx.ding();
    return true;
  }
  // ---------- 输入 ----------
  function toLogical(e) {
    const r = cv.getBoundingClientRect();
    return { x: (e.clientX - r.left - SX) / scale, y: (e.clientY - r.top - SY) / scale };
  }
  let drag = null;
  cv.addEventListener('pointerdown', (e) => {
    if (!G || G.paused || G.orderOpen || G.over) return;
    G.idle = 0;
    if (G.teaOpen) { closeTea(); return; }
    const p = toLogical(e);
    if (G.mode === 'day' && YARD) { dayTap(p); return; }
    if (G.mode === 'day') { G.idle = 0; drag = { x: p.x, y: p.y, cx: G.D.cam.x, cy: G.D.cam.y, moved: false }; return; }
    shopTap(p);
  });
  cv.addEventListener('pointermove', (e) => {
    if (!drag || !G || G.mode !== 'day') return;
    const p = toLogical(e), dx = p.x - drag.x, dy = p.y - drag.y;
    if (!drag.moved && Math.hypot(dx, dy) < 14) return;
    drag.moved = true; G.D.manual = true; G.D.camGoal = null;
    G.D.cam.x = Math.max(0, Math.min(WORLD_W - W, drag.cx - dx)); G.D.cam.y = Math.max(0, Math.min(WORLD_H - H, drag.cy - dy));
  });
  const endDrag = (e) => {
    if (!drag) return;
    const d = drag; drag = null;
    if (!d.moved && G && G.mode === 'day' && !G.paused) { const p = toLogical(e); dayTap({ x: p.x + G.D.cam.x, y: p.y + G.D.cam.y }); }
  };
  cv.addEventListener('pointerup', endDrag);
  cv.addEventListener('pointercancel', () => { drag = null; });
  // 点茶壶：还没解锁饮品时直接拿水（拿着没人要的水就倒掉）；解锁后展开一排饮品选
  function teaTap() {
    if (!prog().drinks.length) { // 只有白水：点茶壶直接倒
      if (drinkWants().some((o) => o.drink === 'water')) enqueue({ kind: 'pour', drink: 'water' }); else toast('现在没人要水');
      return;
    }
    openTeaMenu();
  }
  function placeTeaMenu() { // 茶水选单的小尖角指着茶水台（场景坐标换成界面坐标）
    const box = document.getElementById('teamenu'); if (!box) return;
    const tip = toUI(WATER.x - 12, WATER.y - 56); // 跟着茶水台走
    box.style.left = Math.max(8, tip.x - 170) + 'px'; box.style.top = 'auto'; box.style.bottom = Math.max(8, UH - tip.y + 14) + 'px';
  }
  function fitPanels() { // 弹窗比屏幕高/宽时整体缩小放进来（不滚动）
    document.querySelectorAll('#ui .modal.show > *, #plot > *, #choose > *, #order').forEach((el) => {
      if (!el.offsetWidth) return;
      const f = Math.min(1, (UH - 16) / el.offsetHeight, (UW - 16) / el.offsetWidth);
      el.style.scale = f < 0.999 ? String(f) : '';
    });
  }
  setInterval(fitPanels, 250);
  function openTeaMenu() {
    const box = $('#teamenu'), w = G.waiter, wants = drinkWants(), opts = [];
    for (const k of drinkList()) opts.push({ k, n: DRINKS[k].n, who: wants.filter((o) => o.drink === k).map((o) => o.c), sec: `${DRINKS[k].verb} ${DRINKS[k].brew} 秒` });
    if (SUZHOU && has('tea')) opts.push({ k: 'comfort-tea', n: '安抚茶', who: [], sec: '每杯 ¥2', free: true });
    box.innerHTML = opts.map((o) => `<button class="topt ${o.who.length ? 'want' : ''}" data-k="${o.k}" ${o.free || o.who.length ? '' : 'disabled'}><img alt="" src="${o.k === 'dump' ? iconURL('cross') : cupURL(o.k === 'comfort-tea' ? 'jasmine' : o.k)}"><b>${o.n}</b><small>${o.who.length ? o.who.map((c) => `<span class="tno">${c.table ? tableNumber(c.table.id) : ''}</span><img class="fc" alt="" src="${custURL(c.type.id)}">`).join('') : o.free ? '' : '没人点'}</small>${o.sec ? `<em>${o.sec}</em>` : ''}</button>`).join('');
    box.querySelectorAll('.topt').forEach((b) => b.addEventListener('click', (e) => {
      e.stopPropagation(); const k = b.dataset.k;
      enqueue(k === 'comfort-tea' ? { kind: 'tea' } : { kind: 'pour', drink: k }); closeTea();
    }));
    box.classList.add('show'); G.teaOpen = true; sfx.tap();
  }
  function closeTea() { $('#teamenu').classList.remove('show'); if (G) G.teaOpen = false; }
  function shopTap(p) {
    const w = G.waiter;
    const prank = G.mischief;
    if (prank && !prank.caught && inRect(p.x, p.y, mischiefHit(prank))) {
      prank.caught = G.t;
      G.selected = null; sfx.ding();
      return;
    }
    if (SUZHOU && !G.selected) {
      const side = ['left', 'right'].find((key) => inRect(p.x, p.y, LAYOUT.scene.wallArt[key]));
      if (side) { openTravelAlbum('hud-screen', save.decor[side === 'left' ? 'wallLeft' : 'wallRight']); return; }
      if (inRect(p.x, p.y, RACK_HIT)) { openRack(); return; }
    }
    { // G-006：先看点没点到人数牌，再按离哪组身子最近；和 queueChip 用同一套矩形
      const line = G.customers.filter(inLine);
      const c = line.find((q) => inRect(p.x, p.y, qCard(q))) || line.filter((q) => inRect(p.x, p.y, qBody(q))).sort((a, b) => Math.hypot(p.x - a.x, p.y - a.y + 40) - Math.hypot(p.x - b.x, p.y - b.y + 40))[0];
      if (c) {
        if (w.hands.some((h) => h.kind === 'tea' || h.kind === 'snack')) { enqueue({ kind: 'give', cust: c }); return; }
        if (c.state === 'called') { toast('盆盆马上来领位'); return; }
        G.selected = G.selected === c ? null : c; sfx.tap(); return;
      }
    }
    if (inRect(p.x, p.y, SINK_HIT)) {
      if (!SUZHOU) { enqueue({ kind: 'sink' }); return; }
      G.sinkInfoUntil = G.t + 2.2;
      const canDrop = w.hands.some(sinkDiscard);
      const canWash = G.plates.dirty > 0 && !w.hands.length;
      const pending = w.wash || w.sinkDrop !== undefined || w.queue.some((a) => a.kind === 'sink');
      if ((canDrop || canWash) && !pending) enqueue({ kind: 'sink' });
      else sfx.tap();
      return;
    }
    if (!G.selected && (RACK_HIT ? inRect(p.x, p.y, RACK_HIT) : Math.abs(p.x - RACK.x) < 40 && p.y > RACK.y - 10 && p.y < RACK.y + 175)) { openRack(); return; }
    for (const t of G.tables) {
      if (t.hit ? inRect(p.x, p.y, t.hit) : p.x > t.cx - t.rx - 10 && p.x < t.chip.x + 90 && p.y > t.cy - 120 * t.k && p.y < t.cy + 96 * t.k) {
        if (G.selected && (t.cust || t.dirty || t.reserved)) G.selected = null; // 点到有人的桌：当作对这桌做事
        if (G.selected) {
          const c = G.selected;
          if (tableHeld(t) && !c.regular) { toast('这张桌留给狸猫阿姨和三位姐妹'); return; }
          if (c.size > t.size) { toast(`这是 ${t.size} 人桌，坐不下 ${c.size} 位`); return; }
          if (!enqueue({ kind: 'seat', cust: c, table: t, phase: 1 })) return;
          G.selected = null; c.state = 'called'; c.calledAt = G.t; t.reserved = c; c.say = '来啦～'; c.sayT = 1.5;
          return;
        }
        enqueue({ kind: 'table', table: t }); return;
      }
    }
    const teaDist = Math.hypot(p.x - TEA_POINT.x, p.y - TEA_POINT.y);
    const inTea = LI.tea?.hit ? inRect(p.x, p.y, LI.tea.hit) : teaDist < (ART_B() ? 32 : 50);
    const inSpike = SPIKE && LI.rail.hit && inRect(p.x, p.y, LI.rail.hit);
    const inPass = LI.pass?.hit ? inRect(p.x, p.y, LI.pass.hit) : inPoly(p.x, p.y, [[222, 420], [380, 420], [262, 590], [120, 590]]);
    const spikeDist = Math.hypot(p.x - TICKET_POINT.x, p.y - TICKET_POINT.y);
    if (SUZHOU && inPass) {
      const ready = readyMeals();
      let choice = null, nearest = 30;
      for (const [i, meal] of ready.entries()) {
        const order = meal[0];
        if (meal.some((dish) => dish.claim) || w.queue.some((a) => meal.includes(a.order))) continue;
        const [x, y] = PASS.slots[i];
        const d = Math.hypot(p.x - x, p.y - y + 4);
        if (d < nearest) { choice = order; nearest = d; }
      }
      if (choice && (!inSpike || nearest < spikeDist)) {
        if (w.hands.length) toast('先把手上的东西送过去');
        else enqueue({ kind: 'pass', step: 'pickup', order: choice });
        return;
      }
    }
    if (inSpike && (!inTea || spikeDist < teaDist)) {
      if (!SUZHOU || w.tickets.length) enqueue({ kind: 'pass', step: 'ticket' });
      return;
    }
    if (inTea) { teaTap(); return; }
    if (inPass && !SUZHOU) { enqueue({ kind: 'pass' }); return; }
    if (TEA_HIT ? inRect(p.x, p.y, TEA_HIT) : p.x > TEA.cx - 85 && p.x < TEA.cx + 85 && p.y > TEA.cy - 120 && p.y < TEA.cy + 20) {
      const want = SUZHOU ? 'snack' : p.x < TEA.cx ? 'tea' : 'snack';
      const kind = has(want) ? want : has('tea') ? 'tea' : has('snack') ? 'snack' : null;
      if (!kind) { toast('茶台还没开，每天结算时可以在「店铺升级」里买'); return; }
      enqueue({ kind }); return;
    }
    if (Math.abs(p.x - w.x) < 30 && p.y > w.y - 95 && p.y < w.y - 10 && w.queue.length) { w.queue = []; w.busyAct = null; w.path = []; toast('已清空动作'); return; }
    if (G.selected) G.selected = null;
  }

  // ---------- 店员（老二、咪咪）按安排的工作自己干活 ----------
  function staffThink(sf) {
    const def = STAFF_DEF[sf.id];
    if (sf.blockT > G.t) return; // 回不了家：歇两秒再想
    if (sf.hands.length) return carryRetry(sf); // 手上还拿着东西：先把它送到
    sf.skip = sf.skip || new Map();
    const skipped = (obj) => (sf.skip.get(obj) || 0) > G.t; // 刚才走不到的那一单，3 秒内先跳过，去看别的单
    const go = (task, to) => {
      const pth = findPath(sf, to);
      if (!pth) { // 走不到：放掉认领，这一单先跳过
        noWay(STAFF_DEF[sf.id].name, to); sf.task = null; sf.path = [];
        sf.skip.set(task.o ? (task.kind === 'brewDrink' ? task.o.cust.members[task.o.mi] : task.o) : task.c || task.t || task, G.t + 3);
        if (task.o && task.o.claim === sf.id) task.o.claim = null;
        for (const order of task.meal || []) if (order.claim === sf.id) order.claim = null;
        if (task.kind === 'brewDrink' && task.o.cust.members[task.o.mi]) task.o.cust.members[task.o.mi].dClaim = null;
        if (task.c && task.c.waterClaim === sf.id) task.c.waterClaim = null;
        if (task.t && task.t.busClaim === sf.id) task.t.busClaim = null;
        return;
      }
      sf.task = task; sf.path = pth;
    };
    for (const job of resting(sf.id) ? [] : jobsOf(sf.id)) { // 按安排的顺序，先干第一件
      if (job === 'serve') {
        const meal = SUZHOU ? readyMeals().find((dishes) => dishes.every((d) => !d.claim && !skipped(d))) : null;
        const o = SUZHOU ? meal?.[0] : G.kitchen.pass.find((d) => !d.claim && d.cust.table && d.cust.state !== 'leaving' && !skipped(d));
        if (o) {
          for (const dish of meal || [o]) dish.claim = sf.id;
          return go({ kind: 'pickDish', o, meal }, { x: PASS.spot.x - 10, y: PASS.spot.y + 30 });
        }
      } else if (job === 'drink') {
        const o = drinkWants().find((o) => !skipped(o.m));
        if (o) { o.m.dClaim = sf.id; return go({ kind: 'brewDrink', o: { drink: o.drink, table: o.table, cust: o.c, mi: o.mi } }, { x: WATER.spot.x, y: WATER.spot.y + 30 }); }
      } else if (job === 'water') {
        const need = (c) => c.table && !c.waterClaim && (c.state === 'thirsty' || (!c.watered && ['reading', 'ordering', 'ordering-open', 'waitFood'].includes(c.state)));
        const c = G.customers.find((c) => need(c) && c.state === 'thirsty') || G.customers.find(need);
        if (c) { c.waterClaim = sf.id; return go({ kind: 'getWater', c }, WATER.spot); }
      } else if (job === 'bus') {
        const t = G.tables.find((t) => t.dirty && !t.cust && !t.reserved && !t.busClaim && !skipped(t));
        if (t) { t.busClaim = sf.id; return go({ kind: 'toTable', t }, { x: t.spot.x, y: t.spot.y + 20 }); }
      }
    }
    const home = resting(sf.id) ? def.rest : def.home;
    if (Math.hypot(sf.x - home.x, sf.y - home.y) > 4) { const pth = findPath(sf, home); if (pth) { sf.task = { kind: 'home' }; sf.path = pth; } else { noWay(STAFF_DEF[sf.id].name, home); sf.blockT = G.t + 2; } }
  }
  // 店员拿着东西却走不到：东西留在手上（不丢、不重复认领），过两秒换条路再送（G-003：守住盘子和饮品的账）
  function staffCarry(sf, to) {
    const pth = findPath(sf, to); if (pth) { sf.path = pth; return true; }
    noWay(STAFF_DEF[sf.id].name, to);
    sf.task = null; sf.path = []; sf.carryT = G.t + 2;
    return false;
  }
  function carryRetry(sf) {
    if ((sf.carryT || 0) > G.t) return;
    const h = sf.hands[0], alive = (c) => c && c.table && c.state !== 'leaving';
    if (h.kind === 'plate') { sf.task = { kind: 'toSink' }; staffCarry(sf, SINK2); return; }
    if ((h.kind === 'dish' || h.kind === 'drink') && alive(h.cust)) { sf.task = { kind: h.kind === 'dish' ? 'deliver' : 'deliverDrink', o: h }; staffCarry(sf, h.cust.table.spot); return; }
    if (h.kind === 'dish') G.plates.dirty++; // 客人走了：这盘菜撤下，盘子算脏盘
    sf.hands.shift();
  }
  function staffArrive(sf) {
    const tk = sf.task, home = resting(sf.id) ? STAFF_DEF[sf.id].rest : STAFF_DEF[sf.id].home;
    if (tk.kind === 'sample') { G.mischief = { who: 'laoer', actor: sf, at: G.t }; sf.task = null; return; }
    const goHome = () => { const pth = findPath(sf, home); if (pth) { sf.task = { kind: 'home' }; sf.path = pth; } else { noWay(STAFF_DEF[sf.id].name, home); sf.task = null; sf.path = []; sf.blockT = G.t + 2; } };
    const alive = (c) => c && c.table && c.state !== 'leaving';
    if (tk.kind === 'pickDish') {
      const meal = tk.meal || [tk.o];
      if (alive(tk.o.cust) && meal.every((dish) => G.kitchen.pass.includes(dish))) {
        sf.hands = pickUpMeal(meal);
        sf.task = { kind: 'deliver', o: tk.o }; staffCarry(sf, tk.o.cust.table.spot);
      } else { for (const dish of meal) dish.claim = null; goHome(); }
    } else if (tk.kind === 'deliver') {
      const meal = sf.hands.splice(0);
      if (alive(tk.o.cust)) for (const dish of meal) serve(tk.o.cust, dish);
      else G.plates.dirty += meal.length;
      goHome();
    } else if (tk.kind === 'brewDrink') {
      if (alive(tk.o.cust)) { sf.brew = { drink: tk.o.drink, t: 0, need: DRINKS[tk.o.drink].brew, o: tk.o }; sf.task = { kind: 'brewing', o: tk.o }; sf.path = []; } else goHome();
    } else if (tk.kind === 'pickDrink') {
      const i = G.kitchen.drinkReady.indexOf(tk.o);
      if (i >= 0 && alive(tk.o.cust)) { G.kitchen.drinkReady.splice(i, 1); sf.hands = [{ kind: 'drink', ...tk.o }]; sf.task = { kind: 'deliverDrink', o: tk.o }; staffCarry(sf, tk.o.cust.table.spot); }
      else { if (tk.o) tk.o.claim = null; goHome(); }
    } else if (tk.kind === 'deliverDrink') {
      sf.hands = []; if (alive(tk.o.cust)) serveDrink(tk.o.cust, tk.o); goHome();
    } else if (tk.kind === 'getWater') {
      const c = tk.c;
      if (alive(c)) { sf.hands = [{ kind: 'water' }]; sf.task = { kind: 'giveWater', c }; staffCarry(sf, c.table.spot); } else goHome();
    } else if (tk.kind === 'giveWater') {
      const c = tk.c; sf.hands = []; c.waterClaim = null;
      if (alive(c) && !c.watered) giveWater(c);
      goHome();
    } else if (tk.kind === 'toTable') {
      const t = tk.t; t.busClaim = null;
      if (t.dirty && !t.cust) { sf.hands = [{ kind: 'plate', n: t.dirty }]; t.dirty = 0; sf.task = { kind: 'toSink' }; staffCarry(sf, SINK2); } else goHome();
    } else if (tk.kind === 'toSink') { G.plates.dirty += (sf.hands[0] && sf.hands[0].n) || 1; sf.hands = []; float(SINK.x + 40, SINK.y - 60, '放进洗碗池', '#4a7fb5'); goHome(); }
    else sf.task = null;
  }

  // ---------- 更新 ----------
  function moveAlong(e, speed, dt) {
    if (!e.path.length) return true;
    const tgt = e.path[0];
    const dx = tgt.x - e.x, dy = tgt.y - e.y, d = Math.hypot(dx, dy);
    const step = speed * dt;
    if (SUZHOU) e.walkDistance = ((e.walkDistance || 0) + Math.min(d, step)) % 528;
    if (d <= step) { e.x = tgt.x; e.y = tgt.y; e.path.shift(); }
    else { e.x += (dx / d) * step; e.y += (dy / d) * step; if (Math.abs(dx) > 2) e.face = dx > 0 ? 1 : -1; e.back = dy < -Math.abs(dx) * 0.6; }
    return !e.path.length;
  }
  const anyCookable = () => menuNow().some(canCook);
  const NONWORKING = new Set(['enter','queue','called','leaving','linger','browse']);
  const CHEF_NAP = { x: 267, y: 415 };
  const SNACK_SPOT = { x: 195, y: 560 };
  function mischiefHit(m) {
    const p = m.who === 'laoda' ? CHEF_NAP : m.actor;
    return m.who === 'laoda' ? { x: p.x - 66, y: p.y - 62, w: 132, h: 68 }
      : { x: p.x - 43, y: p.y - 100, w: 86, h: 102 };
  }
  function updateMischief(dt, kitchenIdle) {
    const m = G.mischief;
    if (m) {
      if (m.caught && G.t - m.caught >= 0.8) { G.mischief = null; return; }
      if (!m.caught && !m.hint && G.t - m.at >= 8 && (!kitchenIdle || G.t >= DAY_LEN || G.soldOut || G.customers.some((c) => !NONWORKING.has(c.state)))) {
        m.hint = true;
        toast(m.who === 'laoda' ? '点一下躺着的老大，他就回灶台。' : '点一下偷吃的老二，他就回岗位。', 2900);
      }
      return;
    }
    if (!G.mischiefPlan || G.soldOut || G.t > DAY_LEN - 55) return;
    const worker = G.staff.find((sf) => sf.id === 'laoer' && !resting(sf.id));
    const chefFree = kitchenIdle && !G.plates.dirty && !G.waiter.tickets.length
      && !G.customers.some((c) => c.state === 'ordering-open' || c.state === 'waitFood');
    const workerFree = worker && !worker.task && !worker.hands.length
      && !drinkWants().length && !readyMeals().length;
    const plan = G.mischiefPlan;
    plan.chef = chefFree ? (plan.chef || 0) + dt : 0;
    plan.worker = workerFree ? (plan.worker || 0) + dt : 0;
    const chefReady = plan.chef >= plan.delay, workerReady = plan.worker >= plan.delay + 4;
    if (workerReady && (plan.prefer === 'laoer' || !chefReady)) {
      const path = findPath(worker, SNACK_SPOT);
      if (path) { worker.task = { kind: 'sample' }; worker.path = path; G.mischiefPlan = null; }
    } else if (chefReady && (plan.prefer === 'laoda' || !worker || plan.chef > plan.delay + 10)) {
      G.mischief = { who: 'laoda', at: G.t }; G.mischiefPlan = null;
    }
  }
  function update(dt) {
    if (!G || G.paused || G.over) return;
    G.ambientTime = (G.ambientTime || 0) + dt;
    if (G.mode === 'day') { G.idle = (G.idle || 0) + dt; updateDay(dt); hud(); return; }
    dt *= G.orderOpen ? 0.5 : 1;
    if (dt <= 0) return;
    G.t += dt; G.danceCD = Math.max(0, G.danceCD - dt);
    if (G.script) scriptSpawn();
    if (G.t < DAY_LEN && !G.soldOut) {
      G.spawnT -= dt;
      if (G.script) G.spawnT = 99;
      if (G.spawnT <= 0) {
        if (!anyCookable()) { G.soldOut = true; toast('食材用完了，招待完这几桌就打烊'); }
        else {
          const visit = G.visit && !G.visit.spawned && G.t >= 15;
          const customer = spawnCustomer(visit ? { type: 'raccoon', size: 4, regular: true } : undefined);
          if (visit && customer) G.visit.spawned = customer;
          G.spawnT = SUZHOU ? (customer ? rand(26, 35) - Math.min(3, G.t / 65) : 4) : rand(18, 25) - Math.min(4, G.t / 40);
        }
      }
    }
    const w = G.waiter;
    if (SUZHOU && CUR_SE === 'winter') updateGardenDoor(dt);
    for (const c of G.customers.slice()) {
      c.bob += dt * 3; if (c.sayT > 0) c.sayT -= dt;
      if (c.state === 'enter') { if (moveAlong(c, SUZHOU ? 146 : 170, dt)) c.state = 'queue'; }
      else if (c.state === 'browse') { // 门口看菜单 → 说一句 → 走
        c.timer -= dt;
        if (c.timer <= 0 && !c.say) { c.say = '没有想吃的……下次再来。'; c.sayT = 1.8; c.timer = 1.8; c.face = 1; }
        else if (c.timer <= 0) { G.customers.splice(G.customers.indexOf(c), 1); continue; }
      }
      else if (c.state === 'queue' || c.state === 'called') moveAlong(c, SUZHOU ? 146 : 170, dt);
      else if (c.state === 'following' && SUZHOU) moveAlong(c, 210, dt);
      else if (c.state === 'following') {
        const tx = w.x - (w.face || 1) * 56, ty = w.y - 2;
        const dx = tx - c.x, dy = ty - c.y, d = Math.hypot(dx, dy);
        if (d > 6) { const st = Math.min(d, 330 * dt); c.x += (dx / d) * st; c.y += (dy / d) * st; c.face = dx > 0 ? 1 : -1; }
      }
      else if (c.state === 'toSeat' && moveAlong(c, SUZHOU ? 165 : 190, dt)) {
        if (SUZHOU) {
          c.seatWait = (c.seatWait || 0) + dt;
          if (c.seatWait < 0.9 && !guestSeatReady(c)) continue;
          c.seatEase = Math.min(1, (c.seatEase || 0) + dt / 0.28);
          if (c.seatEase < 1) continue;
          delete c.seatWait;
          delete c.seatEase;
        }
        if (c.wantsWater) { c.state = 'thirsty'; speak(c, 'water'); }
        else { c.state = 'reading'; c.timer = SUZHOU ? 4 : 2.5; }
      }
      else if (c.state === 'reading') { c.timer -= dt; if (c.timer <= 0) startOrdering(c); }
      else if (c.state === 'eating') { c.timer -= dt; if (c.timer <= 0 && !dessertAsk(c)) c.state = 'bill'; }
      else if (c.state === 'linger') { c.timer -= dt; if (c.timer <= 0) { finishLeave(c); continue; } }
      else if (c.state === 'leaving') { if (moveAlong(c, SUZHOU ? 176 : 200, dt)) G.customers.splice(G.customers.indexOf(c), 1); continue; }
      const dr = DRAIN[c.state === 'enter' ? 'queue' : c.state];
      if (dr) { c.hearts -= dr * c.type.pat * (SUZHOU ? 0.63 : 1) * (c.watered ? 0.75 : 1) * (save.luckDay === save.day ? 0.8 : 1) * (SUZHOU && inLine(c) ? waitingComfort(c) : 1) * dt; if (c.hearts <= 0) { c.hearts = 0; leave(c, true); } }
    }
    // 厨房：每种炊具一次一道
    const k = G.kitchen;
    const kitchenIdle = !Object.values(k.wares).some((ws) => ws.cur || ws.q.length);
    if (SUZHOU) updateMischief(dt, kitchenIdle);
    for (const ws of Object.values(k.wares)) {
      if (G.mischief?.who === 'laoda') break;
      if (!ws.cur && ws.q.length) {
        const order = ws.q.shift();
        ws.cur = { ...order, t: 0, cook: SUZHOU ? Math.round(order.cook * 1.6) : order.cook };
      }
      if (ws.cur) { ws.cur.t += dt; if (ws.cur.t >= ws.cur.cook && (SUZHOU || k.pass.length < PASS_MAX) && G.plates.clean > 0) { G.plates.clean--; k.pass.push(ws.cur); ws.cur = null; sfx.ding(); } }
    }
    // 老大没菜做的时候，顺手去洗碗（慢一点）
    const pl = G.plates, chefFree = !Object.values(k.wares).some((ws) => ws.cur || ws.q.length);
    G.chefWash = chefFree && G.mischief?.who !== 'laoda' && pl.dirty > 0 && (!SUZHOU || (!w.wash && G.t >= (G.washLessonUntil || 0)));
    if (SUZHOU && G.chefWash && !G.chefWashShown) {
      G.chefWashShown = true;
      float(SINK.x + 29, SINK.y - 66, '老大在洗碗', '#677d73', null, 2.4);
    }
    if (G.chefWash) { pl.washT += dt; if (pl.washT >= 2.2) { pl.washT = 0; pl.dirty--; pl.clean++; } } else if (!G.waiter.wash) pl.washT = 0;
    // 盆盆洗碗：站在洗碗池前，一只一秒
    const ww = G.waiter.wash;
    if (ww) { ww.t += dt; if (ww.t >= 1) { ww.t = 0; if (pl.dirty > 0) { pl.dirty--; pl.clean++; ww.n--; sfx.tap(); } if (ww.n <= 0 || pl.dirty <= 0) { G.waiter.wash = null; did('wash'); } } }
    // 茶水台：一杯一杯泡
    w.blinkT -= dt; if (w.blinkT < -0.15) w.blinkT = rand(2, 4);
    G.idle = (G.idle || 0) + dt;
    if (w.sinkDrop !== undefined) {
      w.sinkDrop += dt;
      if (w.sinkDrop >= SINK_DROP_TIME) { delete w.sinkDrop; doAction({ kind: 'sink' }); }
    } else if (w.wash) { /* 洗碗中，站着不动 */ } else if (w.brew) {
      w.brew.t += dt;
      if (w.brew.t >= w.brew.need) { const o = w.brew.o; w.brew = null; if (o.cust.state !== 'leaving' && !full()) { w.hands.push(o); did('drink'); sfx.tap(); } else o.cust.members[o.mi].dClaim = null; }
    } else if (w.busyAct) {
      const act = w.busyAct;
      const greeting = SUZHOU && act.kind === 'seat' && act.phase === 1 && act.cust.state === 'called' && G.t - act.cust.calledAt < 0.83;
      if (moveAlong(w, (SUZHOU ? 265 : 300) * SPD(), dt) && !greeting) {
        const a = w.busyAct;
        if (a.kind === 'seat' && a.phase === 1) {
          if (a.cust.state === 'called') {
            const pth = findPath(w, a.table.spot);
            const guestPath = SUZHOU ? findPath(a.cust, a.table.spot) : [];
            if (pth && guestPath) {
              a.cust.state = 'following'; a.phase = 2; layoutQueue(); w.path = pth;
              if (SUZHOU) a.cust.path = guestPath;
              sfx.tap();
            }
            else { noWay('盆盆', a.table.spot); a.cust.state = 'queue'; a.table.reserved = null; w.busyAct = null; w.queue.shift(); layoutQueue(); }
          }
          else { w.busyAct = null; w.queue.shift(); a.table.reserved = null; }
        } else {
          w.busyAct = null; w.queue.shift();
          if (SUZHOU && a.kind === 'sink' && w.hands.some(sinkDiscard)) { w.face = -1; w.sinkDrop = 0; }
          else doAction(a);
        }
      }
    } else if (w.queue.length && !G.orderOpen) {
      const a = w.queue[0], to = targetSpot(a), pth = findPath(w, to);
      if (pth) { w.busyAct = a; w.path = pth; }
      else { // 走不到：这一步取消，放掉占位，手上的东西不动
        noWay('盆盆', to); w.queue.shift();
        if (a.kind === 'seat') { a.table.reserved = null; if (a.cust.state === 'called') a.cust.state = 'queue'; layoutQueue(); }
      }
    } else w.back = false;
    if (GREY) { const n = gbPlates(); if (GB.plates != null && n !== GB.plates) GB.plateLog.push({ t: Math.round(G.t * 10) / 10, from: GB.plates, to: n, hands: w.hands.map((h) => h.kind + (h.cust ? ':' + h.cust.state : '')), staff: G.staff.map((sf) => sf.hands.map((h) => h.kind + (h.cust ? ':' + h.cust.state : '')).join('+')), pass: G.kitchen.pass.length, dirty: G.plates.dirty, clean: G.plates.clean }); GB.plates = n; }
    if (GREY) { GB.tick = (GB.tick || 0) + dt; if (GB.tick > 0.25) { GB.tick = 0; GB.trail.push(['盆盆', w.x, w.y]); for (const sf of G.staff) GB.trail.push([sf.id, sf.x, sf.y]); for (const c of G.customers) if (['enter', 'queue', 'called', 'following'].includes(c.state)) GB.trail.push(['客人', c.x, c.y]); if (GB.trail.length > 6000) GB.trail.splice(0, 1000); } }
    for (const sf of G.staff) {
      if (G.mischief?.actor === sf) continue;
      if (sf.brew) {
        sf.brew.t += dt;
        if (sf.brew.t >= sf.brew.need) { const o = sf.brew.o; sf.brew = null;
          if (o.cust.table && o.cust.state !== 'leaving') { sf.hands = [{ kind: 'drink', ...o }]; sf.task = { kind: 'deliverDrink', o }; staffCarry(sf, o.cust.table.spot); } else sf.task = null; }
        continue;
      }
      if (sf.sinkDrop !== undefined) {
        sf.sinkDrop += dt;
        if (sf.sinkDrop >= SINK_DROP_TIME) { delete sf.sinkDrop; staffArrive(sf); }
      } else if (sf.task) {
        if (moveAlong(sf, (save.sulk || []).includes(sf.id) ? 150 : SUZHOU ? 194 : 230, dt)) {
          if (SUZHOU && sf.task.kind === 'toSink') { sf.face = -1; sf.sinkDrop = 0; }
          else staffArrive(sf);
        }
      } else staffThink(sf);
    }
    G.floats = G.floats.filter((f) => (f.t += dt) < (f.life || 1.6));
    if (G.dancer) { G.dancer.t -= dt; if (G.dancer.t <= 0) G.dancer = null; }
    if (!G.mischief && (G.script ? !G.script.length : (G.t >= DAY_LEN || G.soldOut)) && G.customers.length === 0 && !G.orderOpen) {
      const cleanup = SUZHOU && (pl.dirty > 0 || G.tables.some((t) => t.dirty)
        || w.hands.some((h) => h.kind === 'plate') || G.staff.some((sf) => sf.hands.some((h) => h.kind === 'plate')));
      if (!cleanup) endDay();
      else if (!G.closing) { G.closing = true; toast('收工前，把剩下的盘子洗完。', 3300); }
    }
    hud();
  }
  function float(x, y, text, col, ico = null, life = 1.6) { G.floats.push({ x, y, text, col, t: 0, ico, life }); }

  // ---------- 绘制 ----------
  function rr(x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); }
  function heart(x, y, s, fill) {
    ctx.beginPath();
    ctx.moveTo(x, y + s * 0.3);
    ctx.bezierCurveTo(x, y, x - s * 0.5, y, x - s * 0.5, y + s * 0.3);
    ctx.bezierCurveTo(x - s * 0.5, y + s * 0.6, x, y + s * 0.8, x, y + s);
    ctx.bezierCurveTo(x, y + s * 0.8, x + s * 0.5, y + s * 0.6, x + s * 0.5, y + s * 0.3);
    ctx.bezierCurveTo(x + s * 0.5, y, x, y, x, y + s * 0.3);
    ctx.fillStyle = fill; ctx.fill();
  }
  const FONT = '"ZCOOL KuaiLe","PingFang SC","Hiragino Sans GB","Noto Sans SC","Microsoft YaHei",sans-serif';
  function label(t, x, y, size, fill, stroke, lw = 4) {
    ctx.font = `${size}px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
    if (stroke) { ctx.lineWidth = lw; ctx.strokeStyle = stroke; ctx.strokeText(t, x, y); }
    ctx.fillStyle = fill; ctx.fillText(t, x, y);
  }
  function bubble(x, y, text, opts = {}) {
    ctx.font = `${(opts.size || 20) + 1}px ${FONT}`;
    const w = ctx.measureText(text).width + 24, h = (opts.size || 20) + 16;
    ctx.fillStyle = opts.bg || '#fbf6ec'; ctx.strokeStyle = '#2c2420'; ctx.lineWidth = 2;
    rr(x - w / 2, y - h, w, h, 12); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x - 7, y - 1); ctx.lineTo(x, y + 9); ctx.lineTo(x + 7, y - 1); ctx.fill();
    ctx.fillStyle = opts.color || '#2c2420'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(text, x, y - h / 2 + 1);
  }
  function bubbleIcon(x, y, ic, text, bg = '#fbf6ec', size = 19) {
    ctx.font = `${size + 1}px ${FONT}`;
    const tw = text ? ctx.measureText(text).width : 0, w = 46 + (text ? tw + 12 : 0), h = 44;
    ctx.fillStyle = bg; ctx.strokeStyle = '#2c2420'; ctx.lineWidth = 2;
    rr(x - w / 2, y - h, w, h, 14); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x - 7, y - 1); ctx.lineTo(x, y + 9); ctx.lineTo(x + 7, y - 1); ctx.fill();
    const im = icon(ic); if (im.complete) ctx.drawImage(im, x - w / 2 + 6, y - h + 5, 34, 34);
    if (text) { ctx.fillStyle = '#2c2420'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillText(text, x - w / 2 + 44, y - h / 2 + 1); }
  }
  function bubbleDish(x, y, dish, note) {
    const w = note ? 116 : 80, h = 50;
    ctx.fillStyle = '#fbf6ec'; ctx.strokeStyle = '#2c2420'; ctx.lineWidth = 2;
    rr(x - w / 2, y - h, w, h, 14); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x - 7, y - 1); ctx.lineTo(x, y + 9); ctx.lineTo(x + 7, y - 1); ctx.fill();
    const img = DISH_IMG[dish];
    if (img && img.complete) ctx.drawImage(img, x - w / 2 + 6, y - h + 6, 57, 38);
    if (note) { ctx.font = `16px ${FONT}`; ctx.fillStyle = '#2c2420'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(note, x + 30, y - h / 2); }
  }
  const ART_ROOM = () => ok(A('room_courtyard'));
  const GARDEN_ART = new Map();
  const GARDEN_ROOM_PAINT = new Set(['kitchen_g068', 'spring_g066', 'winter_g066', 'winter_open_g066', 'counter_g066', 'counter_winter_g066', 'table_small_g066', 'table_large_g066', 'wall_bamboo_g067', 'wall_canal', 'order_spike', 'tea_set_g066', 'tea_bowl', 'tea_bowl_water']);
  function gardenArt(name, extension = 'png') {
    if (!GARDEN_ART.has(name)) {
      const im = new Image();
      const version = (GARDEN_ROOM_PAINT.has(name) || /^yard_/.test(name)) ? LAYOUT?.scene.paintRevision : (/^(g_.+_dressed_|s_)/.test(name) ? SUZHOU_RELEASE : null);
      im.src = 'assets/suzhou/' + name + '.' + extension + (version ? '?v=' + version : '');
      GARDEN_ART.set(name, im);
    }
    return GARDEN_ART.get(name);
  }
  function gardenSprite(name, x, y, width) {
    const revised = /^table_(large|small)$/.test(name) ? name + '_g066' : name;
    const im = gardenArt(revised);
    if (!ok(im)) return false;
    const height = width * im.naturalHeight / im.naturalWidth;
    ctx.drawImage(im, x - width / 2, y - height, width, height);
    return true;
  }
  function doorLine(x) {
    const [[x1, y1], [x2, y2]] = LAYOUT.scene.threshold;
    return y1 + (y2 - y1) * (x - x1) / (x2 - x1);
  }
  function updateGardenDoor(dt) {
    const crossing = [G.waiter, ...G.customers].some((actor) => actor.path.length
      && actor.x > 1001 && actor.x < 1186 && Math.abs(actor.y - doorLine(actor.x)) < 49);
    if (crossing) G.doorHold = G.t + 0.33;
    const moving = crossing || G.t < (G.doorHold || 0);
    const open = G.doorBlend || 0;
    G.doorBlend = moving ? Math.min(1, open + dt * 6) : Math.max(0, open - dt * 4);
  }

  function paintGardenMargins(room, h, landscape = false) {
    const l = Math.max(0, SX / scale), r = Math.max(0, (cv.width / dpr - SX) / scale - W);
    const up = Math.max(0, SY / scale), down = Math.max(0, (cv.height / dpr - SY) / scale - h);
    const iw = room.naturalWidth, ih = room.naturalHeight;
    const side = landscape ? Math.min(196, iw * 0.12) : Math.min(15, iw * 0.012), edge = Math.min(74, ih * 0.09);
    if (l + r > 0.5) {
      ctx.save(); ctx.scale(-1, 1);
      if (landscape) ctx.filter = 'blur(6px)';
      if (l > 0.2) ctx.drawImage(room, 0, 0, side, ih, 0, 0, l + 0.3, h);
      if (r > 0.2) ctx.drawImage(room, iw - side, 0, side, ih, -W - r - 0.3, 0, r + 0.3, h);
      ctx.restore();
    }
    if (up > 0.2) ctx.drawImage(room, 0, 0, iw, edge, -l, -up, W + l + r, up + 0.3);
    if (down > 0.2) ctx.drawImage(room, 0, ih - edge, iw, edge, -l, h - 0.2, W + l + r, down + 0.3);
  }
  function drawGardenRoom() {
    const winter = CUR_SE === 'winter', room = gardenArt(winter ? 'winter_g066' : 'spring_g066', 'jpg');
    if (!ok(room)) return;
    const { height } = LAYOUT.scene;
    paintGardenMargins(room, height);
    ctx.drawImage(room, 0, 0, W, height);
    drawKitchenPlane();
    const patch = LAYOUT.scene.windowSource;
    const wx = W / LAYOUT.source.w, wy = height / LAYOUT.source.h;
    const [px, py, pw, ph] = patch;
    if (CUR_SE === 'summer' || CUR_SE === 'autumn') {
      const view = gardenArt('window_' + CUR_SE);
      if (ok(view)) ctx.drawImage(view, px * wx, py * wy, pw * wx, ph * wy);
    }
    drawGardenWindowFx(px * wx, py * wy, pw * wx, ph * wy, winter);
    if (winter) {
      const open = gardenArt('winter_open_g066', 'jpg');
      if (G.doorBlend && ok(open)) {
        const [x, y, w, h] = LAYOUT.scene.doorPatch;
        const sx = open.naturalWidth / W, sy = open.naturalHeight / height;
        ctx.save();
        ctx.globalAlpha = G.doorBlend;
        ctx.drawImage(open, x * sx, y * sy, w * sx, h * sy, x, y, w, h);
        ctx.restore();
      }
    }
    drawWallArt('left'); drawWallArt('right');
    const curtain = save.decor.curtain || CUR_SE;
    if (curtain !== 'winter') {
      const cloth = gardenArt('curtain_' + curtain);
      if (ok(cloth)) ctx.drawImage(cloth, 1459 * W / 1813, 55 * height / 868, 142 * W / 1813, 110 * height / 868);
    }
  }
  const ART_B = () => !GREY && ok(A('room_b')); // D-018：B 绘本水彩背景（2136×1024，两侧延伸，窗洞透明）
  // 试验（主人 11/26「餐厅太黄太花哨，人看不清」）：背景留白 / 换冷淡色两种方案对比，DBG.bg = 'wash' | 'cool'
  const BGT = {};
  const treated = (k, im) => { const mode = DBG.bg; if (!mode) return im; const key = k + ':' + mode; if (BGT[key]) return BGT[key];
    const c = document.createElement('canvas'); c.width = im.naturalWidth; c.height = im.naturalHeight; const x = c.getContext('2d');
    if (mode === 'cool') x.filter = 'saturate(0.45) brightness(1.05) contrast(0.92)';
    x.drawImage(im, 0, 0); x.filter = 'none'; x.globalCompositeOperation = 'source-atop';
    x.fillStyle = mode === 'wash' ? 'rgba(251,248,241,0.5)' : 'rgba(226,233,238,0.22)'; x.fillRect(0, 0, c.width, c.height);
    return (BGT[key] = c); };
  const drawLayer = (k) => { const im = A(k), m = ART[k]; if (ok(im) && m) ctx.drawImage(treated(k, im), m.x, m.y, m.w, m.h); };
  function drawRoom() {
    if (SUZHOU) { drawGardenRoom(); return; }
    if (ART_B()) { // 窗外四季 → 飘落物 → B 背景（窗洞透明）
      const v = A('view_' + CUR_SE); if (ok(v)) ctx.drawImage(treated('view_' + CUR_SE, v), WIN.x, WIN.y, WIN.w, WIN.h);
      drawWindowFx(); drawLayer('room_b'); return;
    }
    if (!ART_ROOM()) { // 美术还没加载：先画旧的
      if (ROOM.complete) ctx.drawImage(ROOM, 0, 0, W, H); else { ctx.fillStyle = '#efe3cc'; ctx.fillRect(0, 0, W, H); }
      return;
    }
    // 窗外（四季）→ 窗外飘落物 → 抠掉品红的店内底图
    const v = A('view_' + CUR_SE); if (ok(v)) ctx.drawImage(v, WIN.x, WIN.y, WIN.w, WIN.h);
    drawWindowFx();
    ctx.drawImage(A('room_courtyard'), 0, 0, W, H);
    // 墙上：四季挂饰、蒜辫；窗台：四季插花、小盆栽
    spr(CUR_SE + '_hanging', 662, 26, 52, { top: true });
    spr('d_garlic', 240, 28, 36, { top: true });
    spr(CUR_SE + '_vase', 440, 262, 40);
    spr('d_pilea', 896, 262, 44);
  }
  // 窗外飘落：春桃花瓣、夏蝴蝶、秋枫叶、冬雪
  const MENU_INK = '"Penpen Menu Ink","Kaiti SC",KaiTi,serif';
  function drawWallArt(side) {
    const id = save.decor[side === 'left' ? 'wallLeft' : 'wallRight'];
    const mount = LAYOUT.scene.wallArt[side];
    if (!id || !mount) return;
    const { x, y, w, h } = mount;
    if (id === 'bamboo' || id === 'canal') {
      const art = gardenArt(id === 'bamboo' ? 'wall_bamboo_g067' : 'wall_canal');
      if (ok(art)) ctx.drawImage(art, x, y, w, h);
      return;
    }
    const art = wallPhoto(id);
    if (!ok(art)) return;
    const width = w - 3, height = Math.min(h - 12, width * art.naturalHeight / art.naturalWidth + 16);
    ctx.save(); ctx.translate(x + 1, y + (h - height) / 2);
    ctx.transform(1, side === 'left' ? 0.18 : -0.12, 0, 1, 0, 0);
    ctx.fillStyle = '#6f4a36'; ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#eee0c5'; ctx.fillRect(3, 3, width - 6, height - 6);
    ctx.drawImage(art, 6, 6, width - 12, height - 12); ctx.restore();
  }
  const WALL_PHOTOS = new Map();
  function wallPhoto(id) {
    if (WALL_PHOTOS.has(id)) return WALL_PHOTOS.get(id);
    const key = id.split(':');
    const src = id === 'family' ? 'assets/suzhou/family_photo.jpg' : id === 'paint:huizhou' ? 'assets/suzhou/wall_huizhou.jpg' : pcURL(key[1], +key[2]);
    if (!src) return null;
    const image = new Image(); image.src = src;
    WALL_PHOTOS.set(id, image);
    return image;
  }
  function drawWallMenu() {
    const [nearTop, farTop, nearFoot, farFoot] = LI.menurack.paper;
    const width = farTop[0] - nearTop[0];
    const between = (a, b, p) => a + (b - a) * p;
    const row = (v) => {
      const near = between(nearTop[1], nearFoot[1], v), far = between(farTop[1], farFoot[1], v);
      ctx.translate(nearTop[0], near);
      ctx.transform(1, (far - near) / width, 0, 1, 0, 0);
    };
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(nearTop[0] + 2, nearTop[1] + 2);
    ctx.lineTo(farTop[0] + 2, farTop[1] + 2);
    ctx.lineTo(farFoot[0] + 3, farFoot[1] + 3);
    ctx.lineTo(nearFoot[0] + 2, nearFoot[1] + 3); ctx.closePath();
    ctx.fillStyle = '#6f482b24'; ctx.fill();
    ctx.beginPath(); ctx.moveTo(...nearTop); ctx.lineTo(...farTop);
    ctx.lineTo(...farFoot); ctx.lineTo(...nearFoot); ctx.closePath();
    const paper = ctx.createLinearGradient(nearTop[0], nearTop[1], farTop[0], farFoot[1]);
    paper.addColorStop(0, '#f6e7c9'); paper.addColorStop(0.48, '#efe0bf'); paper.addColorStop(1, '#e2c7a4');
    ctx.fillStyle = paper; ctx.fill();
    ctx.strokeStyle = '#a88058'; ctx.lineWidth = 0.9; ctx.stroke();
    ctx.lineCap = 'round';
    const nail = [nearTop[0] + width * 0.49, nearTop[1] - 18];
    ctx.strokeStyle = '#8b673e'; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.moveTo(...nearTop); ctx.lineTo(...nail); ctx.lineTo(...farTop); ctx.stroke();
    ctx.fillStyle = '#765133'; ctx.beginPath(); ctx.arc(...nail, 1.9, 0, Math.PI * 2); ctx.fill();
    for (const [a, b] of [[nearTop, farTop], [nearFoot, farFoot]]) {
      ctx.save(); ctx.translate(a[0], a[1]);
      ctx.rotate(Math.atan2(b[1] - a[1], b[0] - a[0]));
      const length = Math.hypot(b[0] - a[0], b[1] - a[1]);
      ctx.beginPath(); ctx.moveTo(-2.1, 0); ctx.lineTo(length + 2.1, 0);
      ctx.lineWidth = 5.2; ctx.strokeStyle = '#936145'; ctx.stroke();
      ctx.translate(0, -1.05); ctx.lineWidth = 1.5; ctx.strokeStyle = '#d8ae76'; ctx.stroke();
      ctx.fillStyle = '#81553a';
      for (const x of [-2.2, length + 2.2]) { ctx.beginPath(); ctx.arc(x, 0.6, 3.1, 0, Math.PI * 2); ctx.fill(); }
      ctx.restore();
    }
    ctx.save(); row(0.126);
    ctx.font = '21px ' + MENU_INK; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const titleInk = ctx.createLinearGradient(width * 0.14, -6, width * 0.85, 6);
    titleInk.addColorStop(0, '#42302a'); titleInk.addColorStop(0.55, '#735a47'); titleInk.addColorStop(1, '#433128');
    ctx.fillStyle = titleInk; ctx.fillText('今日食单', width / 2, 0, width - 8); ctx.restore();
    for (const [i, key] of menuNow().entries()) {
      const dish = DISH[key], art = DISH_IMG[key];
      ctx.save(); row(0.308 + i * 0.174);
      if (stockOf(dish.ing) <= 0) ctx.globalAlpha = 0.47;
      if (ok(art)) ctx.drawImage(art, 4, -7, 18, 15);
      ctx.font = '15px ' + MENU_INK; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      const ink = ctx.createLinearGradient(39, -7, width - 5, 8);
      ink.addColorStop(0, '#51382a'); ink.addColorStop(0.52, '#82654f'); ink.addColorStop(1, '#4b352b');
      ctx.fillStyle = ink; ctx.fillText(dish.n, 24, 0, width - 27); ctx.restore();
    }
    ctx.restore();
  }
  function drawMenuRack() {
    if (SUZHOU) { drawWallMenu(); return; }
    const list = menuNow(), n = Math.max(1, list.length), rows = Math.ceil(n / 2), x0 = RACK.x, top = RACK.y, t = performance.now() / 1000;
    const tw = 27, th = Math.min(84, (150 - (rows - 1) * 5) / rows), fs = rows <= 2 ? 15 : 12;
    ctx.save();
    ctx.strokeStyle = '#5a3b28'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(x0 - 26, top + 2); ctx.lineTo(x0, top - 10); ctx.lineTo(x0 + 26, top + 2); ctx.stroke();
    ctx.fillStyle = '#5a3b28'; ctx.beginPath(); ctx.arc(x0, top - 10, 2.5, 0, 7); ctx.fill();
    ctx.fillStyle = '#8a5636'; ctx.strokeStyle = '#4a3020'; rr(x0 - 31, top, 62, 15, 3); ctx.fill(); ctx.stroke();
    label('今日菜单', x0, top + 8, 11, '#f3e3c0');
    list.forEach((dk, i) => {
      const d = DISH[dk], out = stockOf(d.ing) <= 0, hot = trendOf(dk) === 'hot', row = Math.floor(i / 2);
      const cx = n % 2 && i === n - 1 ? x0 : x0 + (i % 2 ? 1 : -1) * (tw / 2 + 2), ty = top + 19 + row * (th + 5);
      const name = d.n.replace('黄土高原', ''), shown = rows <= 2 || name.length <= 3 ? name : name.slice(0, 2);
      ctx.save(); ctx.translate(cx, ty); ctx.rotate(Math.sin(t * 1.1 + i * 1.7) * 0.02);
      ctx.fillStyle = out ? '#d6cdc0' : '#f1dfbb'; ctx.strokeStyle = '#6b4a30'; ctx.lineWidth = 1.5; rr(-tw / 2, 0, tw, th, 3); ctx.fill(); ctx.stroke();
      ctx.font = `bold ${fs}px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = out ? '#9a8f82' : '#33241a';
      const step = Math.min(fs + 1, (th - 22) / shown.length);
      [...shown].forEach((ch, j) => ctx.fillText(ch, 0, 4 + step / 2 + j * step));
      ctx.fillStyle = out ? '#b0a596' : '#b8402e'; rr(-tw / 2 + 3, th - 16, tw - 6, 13, 3); ctx.fill();
      ctx.font = `bold 10px ${FONT}`; ctx.fillStyle = '#fff6e8'; ctx.fillText(d.price, 0, th - 9);
      if (hot && !out) { ctx.fillStyle = '#d9453a'; ctx.beginPath(); ctx.arc(tw / 2 - 1, 2, 7, 0, 7); ctx.fill(); ctx.font = `bold 9px ${FONT}`; ctx.fillStyle = '#fff'; ctx.fillText('热', tw / 2 - 1, 2.5); }
      if (out) { ctx.rotate(-0.35); ctx.strokeStyle = '#c0392b'; ctx.lineWidth = 1.6; rr(-14, th / 2 - 8, 28, 15, 2); ctx.stroke(); ctx.font = `bold 10px ${FONT}`; ctx.fillStyle = '#c0392b'; ctx.fillText('售完', 0, th / 2); }
      ctx.restore();
    });
    ctx.restore();
  }
  // 饮品小图（选饮品、开局卡片用）
  function cupSVG(k) {
    const d = k === 'water' ? { col: '#cfe6f2', cup: 'glass' } : DRINKS[k], ink = '#2c2420';
    const body = d.cup === 'glass' ? `<path d="M17 8 L43 8 L39 52 L21 52 Z" fill="#eef5f7" stroke="${ink}" stroke-width="2.4" stroke-linejoin="round"/><path d="M19.5 22 L40.5 22 L38.6 50 L21.4 50 Z" fill="${d.col}"/>`
      : d.cup === 'bowl' ? `<path d="M7 24 Q9 52 30 52 Q51 52 53 24 Z" fill="#f6f1e6" stroke="${ink}" stroke-width="2.4"/><ellipse cx="30" cy="24" rx="23" ry="6" fill="${d.col}" stroke="${ink}" stroke-width="2"/><path d="M11 36 H49" stroke="#7fa9c9" stroke-width="2.4"/>`
        : `<path d="M11 22 Q13 52 30 52 Q47 52 49 22 Z" fill="#f6f1e6" stroke="${ink}" stroke-width="2.4"/><ellipse cx="30" cy="22" rx="19" ry="5" fill="${d.col}" stroke="${ink}" stroke-width="2"/><path d="M24 14 q-4 -5 0 -10 M35 14 q-4 -5 0 -10" stroke="#b9a68c" stroke-width="2" fill="none"/>`;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 60" width="120" height="120">${body}</svg>`;
  }
  const cupURL = (k) => SUZHOU && ['water','jasmine','puer'].includes(k) ? 'assets/suzhou/tea_bowl' + (k === 'water' ? '_water' : '') + '.png' : URLS['c' + k] || (URLS['c' + k] = dataURL(cupSVG(k)));
  // ---------- 菜地面板：3×3 九格，先选种子再点空地 ----------
  const PLOT = { i: 0, seed: null, msg: '' };
  const cropURL = (k, r) => URLS['cr' + k + r] || (URLS['cr' + k + r] = dataURL(cropSVG(k, r)));
  function openPlot(i) {
    G.paused = true; PLOT.i = i; PLOT.msg = '';
    if (!(save.seeds[PLOT.seed] > 0)) PLOT.seed = prog().seeds.find((k) => save.seeds[k] > 0) || null;
    renderPlot(); $('#plot').classList.add('show'); sfx.tap();
  }
  function plantCell(j) {
    const f = save.farm[PLOT.i], k = PLOT.seed;
    if (f.cells[j] || !k || !(save.seeds[k] > 0)) return false;
    save.seeds[k]--; f.cells[j] = { k, ready: save.day + 1 }; did('plant');
    if (farmPhase() === 'plant') {
      save.farmLessonSown = (save.farmLessonSown || 0) + 1;
      if (save.farmLessonSown >= 3) setFarmPhase('wait'); else persist();
    }
    if (!(save.seeds[k] > 0)) PLOT.seed = prog().seeds.find((x) => save.seeds[x] > 0) || null;
    return true;
  }
  function renderPlot() {
    const f = save.farm[PLOT.i], ripeN = f.cells.filter(cellRipe).length, emptyN = f.cells.filter((c) => !c).length;
    $('#plot-no').textContent = `第 ${PLOT.i + 1} 块`;
    $('#plot-grid').innerHTML = f.cells.map((c, j) => {
      if (!c) return `<button class="pc empty" data-j="${j}">${PLOT.seed ? `<img class="ghost" alt="" src="${ingURL(PLOT.seed)}">` : ''}</button>`;
      const r = cellRipe(c);
      return `<button class="pc ${r ? 'ripe' : 'grow'}" data-j="${j}"><img alt="" src="${cropURL(c.k, r)}"><small>${r ? ING[c.k].n + ' 熟了' : '明天熟'}</small></button>`;
    }).join('');
    $('#plot-seeds').innerHTML = prog().seeds.map((k) => `<button class="sd ${PLOT.seed === k ? 'on' : ''}" data-k="${k}" ${save.seeds[k] > 0 ? '' : 'disabled'}><img alt="" src="${ingURL(k)}"><b>${ING[k].n}种子</b><i>×${save.seeds[k] || 0}</i></button>`).join('');
    const hb = $('#plot-harvest'), fb = $('#plot-fill');
    hb.disabled = !ripeN; hb.textContent = ripeN ? `收菜 ${ripeN} 格（用 1 体力）` : '还没熟';
    fb.disabled = !emptyN || !PLOT.seed; fb.textContent = PLOT.seed && emptyN ? `空地全种${ING[PLOT.seed].n}` : '种满';
    $('#plot-tip').textContent = farmPhase() === 'plant' ? '辣椒已种 ' + (save.farmLessonSown || 0) + ' / 3，明早一起收。' : PLOT.msg || (ripeN ? '熟了！点「收菜」一起收' : emptyN && PLOT.seed ? '先选种子，再点空地种下' : emptyN ? '没有种子了，去早市买' : '都种上了，明天来收');
    $('#plot-grid').querySelectorAll('.pc').forEach((b) => { b.onclick = () => {
      const c = f.cells[+b.dataset.j]; PLOT.msg = '';
      if (!c) { if (plantCell(+b.dataset.j)) sfx.tap(); else PLOT.msg = '没有种子了，去早市买'; }
      else if (cellRipe(c)) return plotHarvest();
      else PLOT.msg = `${ING[c.k].n}明天才熟`;
      renderPlot();
    }; });
    $('#plot-seeds').querySelectorAll('.sd').forEach((b) => { b.onclick = () => { PLOT.seed = b.dataset.k; PLOT.msg = ''; sfx.tap(); renderPlot(); }; });
  }
  function plotHarvest() {
    if ((G.D.energy > 0 || farmPhase() !== 'harvest') && !spend()) { PLOT.msg = '今天没体力了'; return renderPlot(); }
    const g = harvestPlot(PLOT.i), point = YARD ? yardPlace('plot', PLOT.i).sign : { x: WMAP.farm.plots[PLOT.i][0], y: WMAP.farm.plots[PLOT.i][1] };
    const { x, y } = point;
    PLOT.msg = '收了 ' + Object.keys(g).map((k) => `${ING[k].n}×${g[k]}`).join('、');
    Object.keys(g).forEach((k, n) => float(x, y - 60 - n * 30, `${ING[k].n} +${g[k]}`, '#3f7a34'));
    sfx.ding(); did('harvest'); updateFarmLesson(); persist(); renderPlot();
  }
  $('#plot-harvest').addEventListener('click', plotHarvest);
  $('#plot-fill').addEventListener('click', () => { let n = 0; const limit = farmPhase() === 'plant' ? 3 - (save.farmLessonSown || 0) : Infinity; save.farm[PLOT.i].cells.forEach((c, j) => { if (n < limit && plantCell(j)) n++; }); PLOT.msg = n ? `种下 ${n} 格` : ''; if (n) sfx.ding(); renderPlot(); });
  $('#plot-ok').addEventListener('click', () => { $('#plot').classList.remove('show'); did('plotok'); persist(); if (G) G.paused = false; });
  // 多个按钮的选择框（比如种什么）
  function choose(title, opts) {
    return new Promise((resolve) => {
      const box = $('#choose'); box.querySelector('h3').textContent = title;
      box.querySelector('.opts').innerHTML = opts.map((o) => `<button data-v="${o.v}"><img alt="" src="${o.img}"><b>${o.t}</b></button>`).join('');
      const done = (v) => { box.classList.remove('show'); resolve(v); };
      box.querySelectorAll('.opts button').forEach((b) => { b.onclick = () => done(b.dataset.v); });
      box.querySelector('.no').onclick = () => done(null);
      box.classList.add('show');
    });
  }
  function openRack() {
    if (!G) return;
    G.paused = true; sfx.tap();
    $('#rack-list').innerHTML = menuNow().map((dk) => { const d = DISH[dk], left = stockOf(d.ing);
      return `<div class="rrow ${left ? '' : 'out'}"><img alt="" src="${dishURL(dk)}"><b class="${SUZHOU ? 'wall-menu-name' : ''}">${d.n}</b><span class="rt">${d.tags.map((x) => tagTiny(x)).join('')}</span><span class="rp">¥${d.price}</span><span class="rl">${left ? `还能做 ${left} 份` : '卖完了'}</span></div>`; }).join('');
    show('rack');
  }
  let gardenFx = null;
  function drawGardenWindowFx(x, y, width, height, winter) {
    const mask = gardenArt('window_mask');
    if (!winter && !ok(mask)) return;
    if (!gardenFx) {
      gardenFx = document.createElement('canvas');
      gardenFx.width = Math.ceil(width);
      gardenFx.height = Math.ceil(height);
    }
    const paint = gardenFx.getContext('2d');
    const w = gardenFx.width, h = gardenFx.height;
    paint.clearRect(0, 0, w, h);
    paint.save();
    if (winter) {
      paint.beginPath();
      for (const [start, end] of [[16, 205], [228, 407], [435, 611], [638, 806]]) {
        paint.rect(start * w / 830, 61 * h / 266, (end - start) * w / 830, 179 * h / 266);
      }
      paint.clip();
    }
    drawWindowFx({ x: 0, y: 0, w, h }, paint);
    if (!winter) {
      paint.globalCompositeOperation = 'destination-in';
      paint.drawImage(mask, 0, 0, w, h);
    }
    paint.restore();
    ctx.drawImage(gardenFx, x, y, width, height);
  }
  function drawWindowFx(win = WIN, paint = ctx) {
    const t = performance.now() / 1000, se = CUR_SE;
    paint.save(); paint.beginPath(); paint.rect(win.x, win.y, win.w, win.h); paint.clip();
    for (let i = 0; i < 18; i++) {
      const sp = 0.25 + (i % 5) * 0.05, ph = (i * 0.137 + t * sp / 6) % 1;
      const x = win.x + ((i * 97 + t * (se === 'summer' ? 30 : 14) * (1 + i % 3)) % (win.w + 40)) - 20;
      const y = se === 'summer' ? win.y + 60 + ((i * 41) % 120) + Math.sin(t * 2 + i) * 14 : win.y + ph * (win.h + 20) - 10;
      paint.save(); paint.translate(x, y); paint.rotate(t * (1 + i % 3) + i);
      if (se === 'spring') { paint.fillStyle = '#f6c3cf'; paint.beginPath(); paint.ellipse(0, 0, 5, 3, 0, 0, 7); paint.fill(); }
      else if (se === 'autumn') { paint.fillStyle = ['#c4602f', '#d98c3a', '#b8452a'][i % 3]; paint.scale(Math.cos(t * 3 + i), 1); paint.beginPath(); paint.moveTo(0, -6); paint.lineTo(5, 0); paint.lineTo(0, 6); paint.lineTo(-5, 0); paint.fill(); }
      else if (se === 'winter') { paint.fillStyle = '#ffffff'; paint.globalAlpha = 0.85; paint.beginPath(); paint.arc(0, 0, 2.4 + (i % 3), 0, 7); paint.fill(); }
      else if (i < 4) { paint.rotate(-(t * (1 + i % 3) + i)); const f = Math.abs(Math.sin(t * 9 + i)); paint.fillStyle = ['#f2e6a8', '#f3f0f6', '#cfe2f0', '#f6d0a0'][i]; paint.beginPath(); paint.ellipse(-3, 0, 4 * f + 1, 3, -0.4, 0, 7); paint.ellipse(3, 0, 4 * f + 1, 3, 0.4, 0, 7); paint.fill(); }
      paint.restore();
    }
    paint.restore();
  }
  const IDLE_BEATS = {
    laoda: { start: 1.1, gap: 6.2, duration: 0.74, sway: 0.020 },
    laoer: { start: 1.7, gap: 6.8, duration: 0.88, sway: 0.024 },
    penpen: { start: 0.8, gap: 4.8, duration: 0.37, sway: 0.011 },
    mimi: { start: 2.3, gap: 7.4, duration: 0.95, sway: 0.024 },
    shuai: { start: 2.8, gap: 7.8, duration: 1.16, sway: 0.017 },
  };
  function crewIdle(id, active, gesture = active) {
    if (!SUZHOU) return null;
    const beats = G.crewIdleSince || (G.crewIdleSince = {});
    if (!active) { delete beats[id]; return null; }
    const clock = G.ambientTime || 0, spec = IDLE_BEATS[id];
    beats[id] ??= clock;
    const elapsed = clock - beats[id], phase = elapsed - spec.start;
    return {
      pose: gesture && phase >= 0 && phase % spec.gap < spec.duration,
      lean: Math.sin(elapsed * 1.8) * spec.sway,
      stretch: 1 + 0.017 * Math.sin(elapsed * 2.5),
    };
  }

  function drawSteam(x, y, clock, scale = 1) {
    ctx.save();
    ctx.lineCap = 'round';
    for (let i = 0; i < 3; i++) {
      const phase = (clock * 0.49 + i * 0.29) % 1;
      const sx = x + (i - 1) * 8 * scale + Math.sin(clock * 1.3 + i) * 3;
      const sy = y - phase * 24 * scale;
      const opacity = Math.sin(phase * Math.PI);
      ctx.beginPath();
      ctx.moveTo(sx - 1, sy + 5 * scale);
      ctx.bezierCurveTo(sx - 7 * scale, sy, sx + 8 * scale, sy - 6 * scale, sx + (i - 1) * 4 * scale, sy - 15 * scale);
      ctx.globalAlpha = opacity * 0.2;
      ctx.strokeStyle = '#fff7ec'; ctx.lineWidth = 7 * scale; ctx.stroke();
      ctx.globalAlpha = opacity * 0.78;
      ctx.strokeStyle = '#fff9ed'; ctx.lineWidth = 2.2 * scale; ctx.stroke();
    }
    ctx.restore();
  }
  function drawCookProgress(x, y, p, width = 34) {
    ctx.fillStyle = '#77605295'; rr(x - width / 2, y, width, 4, 2); ctx.fill();
    if (p > 0) { ctx.fillStyle = '#f5cd8f'; rr(x - width / 2, y, width * p, 4, Math.min(2, width * p / 2)); ctx.fill(); }
  }
  function drawKitchen() {
    const k = G.kitchen, t = performance.now();
    const busy = Object.keys(WARES).filter((w) => hasWare(w) && k.wares[w].cur);
    const cx = busy.length ? WARES[busy[Math.floor(t / 1600) % busy.length]].x + 34 : G.chefWash ? (LI.chef && LI.chef.wash ? LI.chef.wash[0] : 320) : 150; // 洗碗时走到洗碗池后面
    G.chefX = G.chefX == null ? cx : G.chefX + (cx - G.chefX) * 0.06;
    const bob = busy.length ? Math.sin(t / (SUZHOU ? 410 : 120)) * 3 : 0;
    const art = ART_ROOM();
    if (SUZHOU) {
      const [lo, hi] = LI.chef.range.map(([x]) => x);
      const target = G.chefWash && !busy.length ? LI.chef.wash[0] : Math.max(lo, Math.min(hi, cx - 22));
      G.gardenChefX ??= LA('chef').x;
      const dx = (target - G.gardenChefX) * 0.06;
      G.gardenChefX += dx;
      G.chefWalk = ((G.chefWalk || 0) + Math.abs(dx)) % 528;
      if (Math.abs(dx) > 0.12) G.chefFace = Math.sign(dx);
      const prank = G.mischief;
      const moving = Math.abs(target - G.gardenChefX) > 2;
      const idle = crewIdle('laoda', !busy.length && !G.chefWash && !moving && prank?.who !== 'laoda');
      let acted = false;
      if (prank?.who === 'laoda') {
        acted = gardenSprite(prank.caught ? 's_laoda_getup' : 's_laoda_nap', CHEF_NAP.x, CHEF_NAP.y, prank.caught ? 88 : 111);
        G.gardenChefX = CHEF_NAP.x;
      }
      if (!acted) drawCat(P('s_laoda') || SPR.chef, G.gardenChefX, LA('chef').y + bob * 0.18, G.chefFace || 1, moving, 1.14, 'laoda', G.chefWalk, idle);
      drawKitchenPlane('front');
    } else if (ART_B()) { // 主人 11/26：老大待在两条木台围出来的厨房圈里，站在灶台前左右走；洗碗时走到洗碗池旁
      const ch = LI.chef || {}, [lo, hi] = ch.range ? [ch.range[0][0], ch.range[1][0]] : [-60, 110], cy = ch.anchor ? ch.anchor[1] : 548;
      const C = G.chef || (G.chef = { x: 96, y: cy, path: [] }), tx = Math.max(lo, Math.min(hi, G.chefWash && !busy.length && ch.wash ? ch.wash[0] : cx));
      C.y = cy; const dx = tx - C.x; if (Math.abs(dx) > 1.5) { C.x += Math.sign(dx) * Math.min(3.2, Math.abs(dx)); C.face = dx < 0 ? -1 : 1; }
      drawLayer('room_b_fgc'); // 台子前沿先画：老大站在后墙灶台的前面
      drawCat(P('s_laoda') || SPR.chef, C.x, C.y + bob, C.face || 1, Math.abs(dx) > 1.5, 1.12);
    } else if (art) { // 老大站在灶台后面：先画人，再盖上灶台
      drawCat(P('s_laoda') || SPR.chef, Math.max(70, Math.min(320, G.chefX)), 376 + bob, 1, false, 1.12);
      const kf = A('kitchen_fg'), m = ART.kitchen_fg, sc = W / 1536;
      if (ok(kf) && !GREY) ctx.drawImage(kf, m.x * sc, m.y * sc, m.w * sc, m.h * sc);
    } else if (SPR.chef.complete) ctx.drawImage(SPR.chef, G.chefX - 45, 2 + bob, 90, 99);
    for (const [wid, wd] of Object.entries(WARES)) {
      if (!hasWare(wid)) continue;
      const ws = k.wares[wid];
      if (SUZHOU) gardenSprite('burner', wd.x, wd.y + 5, 49);
      if (!spr('ware_' + wid, wd.x, wd.y - (SUZHOU ? 5 : 0), SUZHOU ? 42 : wid === 'steamer' ? 44 : 60)) { const img = WARE_IMG[wid]; if (img.complete) ctx.drawImage(img, wd.x - 32, wd.y - 45, 64, 45); }
      if (ws.cur) {
        const p = Math.min(1, ws.cur.t / ws.cur.cook);
        if (SUZHOU) {
          drawSteam(wd.x, wd.y - (wid === 'steamer' ? 49 : 33), (G.ambientTime || 0) + wd.x * 0.01);
          drawCookProgress(wd.x, wd.y + 3, p);
        } else {
        ctx.fillStyle = '#ffffff'; ctx.globalAlpha = 0.5 + 0.25 * Math.sin(t / 150);
        ctx.beginPath(); ctx.arc(wd.x - 6, wd.y - 52 - p * 8, 8, 0, 7); ctx.arc(wd.x + 8, wd.y - 60 - p * 10, 10, 0, 7); ctx.fill(); ctx.globalAlpha = 1;
        ctx.fillStyle = '#fbf6ecdd'; rr(wd.x - 28, wd.y + 2, 56, 8, 4); ctx.fill();
        ctx.fillStyle = '#c9862f'; rr(wd.x - 28, wd.y + 2, 56 * p, 8, 4); ctx.fill();
        }
      }
      if (ws.q.length && SUZHOU) label('×' + ws.q.length, wd.x + 25, wd.y - 23, 14, '#614b3d', '#f9eedb');
      else if (ws.q.length) { ctx.fillStyle = '#b04a3c'; ctx.beginPath(); ctx.arc(wd.x + 26, wd.y - 40, 11, 0, 7); ctx.fill(); label(`${ws.q.length}`, wd.x + 26, wd.y - 39, 15, '#fff'); }
    }
    // 出菜台上的菜、水壶、收碗处
    if (SUZHOU) readyMeals().forEach((meal, i) => { const [x, y] = PASS.slots[i]; drawMealTray(meal, x, y, 0.85); });
    else k.pass.forEach((o, i) => { const [x, y] = PASS.slots[i] || PASS.slots[PASS.slots.length - 1]; drawPlate(x, y, o, 0.72, true); });
    if (SUZHOU) gardenSprite('tea_set_g066', WATER.x, WATER.y, 76);
    else if (!spr('water_set', WATER.x, WATER.y, ART_B() ? 46 : 66) && DISH_IMG.water.complete) ctx.drawImage(DISH_IMG.water, WATER.x - 21, WATER.y - 28, 42, 28);
    drawVessels();
    drawRail(k);
    if (!SUZHOU) drawCleanPlates();
    if (SUZHOU || ART_B()) { /* 工位由台面和道具辨认 */ }
    else if (art) { label('出菜', 318, 432, 19, '#fbf3e2', '#5a3b28'); label('茶水台', 196, 640, 19, '#fbf3e2', '#3f6680'); }
  }
  function drawSink() { // 石砌洗碗池 + 旁边一摞脏碗；洗的时候冒泡泡
    const x = SINK.x, y = SINK.y, pl = G.plates, t = performance.now() / 1000, washing = G.chefWash || G.waiter.wash;
    if (SUZHOU || ART_B()) {
      if (SUZHOU) {
        if (pl.dirty > 0 && !spr('dirty_dishes', x, y + 4, 23)) drawPlate(x, y - 2, null, 0.32);
      } else {
        for (let i = 0; i < Math.min(pl.dirty, 6); i++) drawPlate(x - 6 + (i % 2) * 6, y - 6 - i * 3, null, 0.5);
      }
      if (washing) { ctx.fillStyle = '#ffffffdd'; for (let i = 0; i < 5; i++) { const ph = (t * 0.8 + i / 5) % 1; ctx.beginPath(); ctx.arc(x - 18 + i * 9, y - 12 - ph * 22, 3.5 + 2 * Math.sin(i), 0, 7); ctx.fill(); } }
      return;
    }
    ctx.fillStyle = '#00000020'; ctx.beginPath(); ctx.ellipse(x, y + 2, 40, 8, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#9a958c'; ctx.strokeStyle = '#4a4540'; ctx.lineWidth = 2.5; rr(x - 36, y - 34, 72, 36, 10); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#bfe0ec'; rr(x - 28, y - 30, 56, 14, 6); ctx.fill();
    ctx.strokeStyle = '#6a7a84'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x + 24, y - 34); ctx.lineTo(x + 24, y - 50); ctx.lineTo(x + 12, y - 50); ctx.stroke();
    if (washing) { ctx.fillStyle = '#ffffffdd'; for (let i = 0; i < 5; i++) { const ph = (t * 0.8 + i / 5) % 1; ctx.beginPath(); ctx.arc(x - 20 + i * 10, y - 26 - ph * 26, 4 + 2 * Math.sin(i), 0, 7); ctx.fill(); } }
    if (pl.dirty > 0) { spr('dirty_dishes', x - 46, y + 6, 40 + Math.min(pl.dirty, 8) * 3) || drawPlate(x - 46, y - 4, null, 0.7); label(`脏×${pl.dirty}`, x - 46, y - 46, 16, '#fff', '#8a5a3a'); }
    label(G.chefWash ? '老大在洗碗' : G.waiter.wash ? '洗碗中' : '洗碗池', x, y + 14, 18, '#fbf3e2', '#3f6680');
  }
  function drawCleanPlates() {
    if (SUZHOU) {
      if (G.t < (G.sinkInfoUntil || 0)) drawGardenSpeech(SINK.x - 2, SINK.y - 64, '干净盘子 ' + G.plates.clean + ' 只');
      return;
    }
    const pl = G.plates, [x, y] = (SUZHOU || ART_B()) ? [SINK.x, SINK.y + 26] : [356, 470];
    if (pl.clean > 0) label(`盘子×${pl.clean}`, x, y, 15, '#2c2420', '#fbf6ec');
    else if (Math.floor(performance.now() / 400) % 2) label('没盘子了！', x, y, 17, '#fff', '#d0453a');
  }
  // 桌号小木牌（盘子、单子、饮品上都用它）
  function tableTag(n, x, y, sz = 15) {
    ctx.fillStyle = '#8a5636'; ctx.strokeStyle = '#4a3020'; ctx.lineWidth = 1.5; rr(x - sz * 0.75, y - sz * 0.72, sz * 1.5, sz * 1.44, 4); ctx.fill(); ctx.stroke();
    label(String(tableNumber(n)), x, y + 1, sz, '#fff6e0');
  }
  // 客人的小头像：圆圈里只露出头
  function faceTag(c, x, y, r = 13) {
    const im = custImg((c.looks && c.looks[0]) || c.type.id); if (!im || !im.complete) return;
    ctx.save(); ctx.fillStyle = '#fbf6ec'; ctx.strokeStyle = '#2c2420'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); ctx.stroke(); ctx.clip();
    ctx.drawImage(im, x - r * 1.5, y - r * 1.05, r * 3, r * 3.3); ctx.restore();
  }
  function drawPlate(x, y, o, s = 1, showTag = true) {
    const img = o ? DISH_IMG[o.dish] : DISH_IMG.dirty;
    if (img && img.complete) ctx.drawImage(img, x - 33 * s, y - 30 * s, 66 * s, 44 * s);
    if (showTag && o && o.cust) { faceTag(o.cust, x + 30 * s, y - 30 * s, 17); if (o.table) tableTag(o.table, x - 26 * s, y - 30 * s); }
  }
  // 茶水台左边的四样器具：玻璃壶茉莉、紫砂壶普洱、酸梅汤坛、豆浆桶。正在做的那样会动、冒热气、头上转圈
  function drawVessels() {
    const act = []; if (G.waiter.brew) act.push(G.waiter.brew); for (const sf of G.staff) if (sf.brew) act.push(sf.brew);
    act.forEach((b, i) => drawVessel(b.drink, SUZHOU ? WATER.x + i * 27 : 128 - i * 44,
      SUZHOU ? WATER.y : 590, Math.min(1, b.t / b.need), b.o.table));
  }
  function drawVessel(id, vx, vy, p, table) {

    if (SUZHOU && ['water','jasmine','puer'].includes(id)) {
      if (id !== 'water') drawSteam(vx - 5, vy - 52, G.ambientTime || 0, 0.75);
      drawCookProgress(vx, vy + 4, p, 29);
      return;
    }
    const t = performance.now() / 1000, d = { ...DRINKS[id], x: vx, y: vy }, on = true, cur = { table };
    {
      ctx.save(); ctx.translate(d.x, d.y); if (on) ctx.rotate(Math.sin(t * 6) * 0.06 - (id === 'jasmine' || id === 'puer' ? 0.12 : 0));
      ctx.strokeStyle = '#2c2420aa'; ctx.lineWidth = 1.4;
      ctx.fillStyle = '#00000018'; ctx.beginPath(); ctx.ellipse(0, 1, 15, 4, 0, 0, 7); ctx.fill();
      if (id === 'jasmine') { // 玻璃壶，看得见黄茶和小白花
        ctx.fillStyle = '#eaf3f3cc'; ctx.beginPath(); ctx.ellipse(0, -13, 13, 12, 0, 0, 7); ctx.fill(); ctx.stroke();
        ctx.fillStyle = d.col; ctx.beginPath(); ctx.ellipse(0, -10, 11, 8, 0, 0, Math.PI); ctx.fill();
        ctx.fillStyle = '#fff'; for (const [a, b] of [[-4, -8], [3, -6], [0, -11]]) { ctx.beginPath(); ctx.arc(a, b, 1.8, 0, 7); ctx.fill(); }
        ctx.beginPath(); ctx.moveTo(12, -16); ctx.quadraticCurveTo(20, -22, 22, -26); ctx.stroke(); ctx.beginPath(); ctx.arc(-14, -13, 5, Math.PI * 0.5, Math.PI * 1.5); ctx.stroke();
        ctx.fillStyle = '#c9b48a'; rr(-4, -28, 8, 4, 2); ctx.fill();
      } else if (id === 'puer') { // 紫砂壶
        ctx.fillStyle = '#7b4a3a'; ctx.beginPath(); ctx.ellipse(0, -9, 13, 9, 0, 0, 7); ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(11, -11); ctx.lineTo(20, -18); ctx.lineWidth = 3; ctx.strokeStyle = '#7b4a3a'; ctx.stroke(); ctx.lineWidth = 1.4; ctx.strokeStyle = '#2c2420aa';
        ctx.beginPath(); ctx.arc(-13, -10, 5, Math.PI * 0.5, Math.PI * 1.5); ctx.stroke();
        ctx.fillStyle = '#6a3c2e'; ctx.beginPath(); ctx.ellipse(0, -17, 7, 2.5, 0, 0, 7); ctx.fill(); ctx.beginPath(); ctx.arc(0, -20, 2.5, 0, 7); ctx.fill();
      } else if (id === 'plum') { // 酸梅汤坛 + 木勺
        ctx.fillStyle = '#9a3a2e'; ctx.beginPath(); ctx.moveTo(-9, -26); ctx.quadraticCurveTo(-17, -14, -11, 0); ctx.lineTo(11, 0); ctx.quadraticCurveTo(17, -14, 9, -26); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#f2e3c4'; rr(-7, -18, 14, 9, 2); ctx.fill(); ctx.fillStyle = '#9a3a2e'; ctx.font = `9px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('梅', 0, -13);
        ctx.strokeStyle = '#a0703a'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(3, -24); ctx.lineTo(9, -36); ctx.stroke();
      } else if (id === 'water') { // 铜水壶
        ctx.fillStyle = '#c98a4a'; ctx.beginPath(); ctx.ellipse(0, -11, 13, 11, 0, 0, 7); ctx.fill(); ctx.stroke();
        ctx.lineWidth = 3; ctx.strokeStyle = '#8a5a2a'; ctx.beginPath(); ctx.moveTo(11, -12); ctx.lineTo(21, -22); ctx.stroke();
        ctx.beginPath(); ctx.arc(0, -22, 9, Math.PI, 0); ctx.stroke(); ctx.lineWidth = 1.4; ctx.strokeStyle = '#2c2420aa';
      } else { // 豆浆桶：白搪瓷，蓝边
        ctx.fillStyle = '#f5f1e6'; rr(-12, -24, 24, 24, 4); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#4a7fb5'; rr(-13, -26, 26, 4, 2); ctx.fill(); rr(-12, -10, 24, 2, 1); ctx.fill();
      }
      if (on && !SUZHOU) for (let i = 0; i < 3; i++) { const ph = (t * 0.8 + i / 3) % 1; ctx.strokeStyle = `rgba(255,255,255,${0.8 * (1 - ph)})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-5 + i * 5, -30 - ph * 18); ctx.quadraticCurveTo(-1 + i * 5, -36 - ph * 18, -5 + i * 5, -42 - ph * 18); ctx.stroke(); }
      ctx.restore();
      if (SUZHOU) { drawSteam(vx, vy - 26, G.ambientTime || 0, 0.64); drawCookProgress(vx, vy + 4, p, 29); }
      else if (on) {
        ctx.strokeStyle = '#fbf6ec'; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(d.x, d.y - 58, 10, 0, 7); ctx.stroke();
        ctx.strokeStyle = '#4a7fb5'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(d.x, d.y - 58, 10, -Math.PI / 2, -Math.PI / 2 + p * Math.PI * 2); ctx.stroke();
        label(`${d.verb}${d.s}`, Math.max(50, d.x + 4), d.y - 80, 17, '#2c2420', '#fbf6ec');
      }
    }
  }
  // 出菜口上方的挂单绳：送到的单子一桌一张，上一道勾一道，上齐盖章取下
  const RAIL = LI.rail && LI.rail.line ? { x0: LI.rail.line[0][0], x1: LI.rail.line[1][0], y: LI.rail.line[0][1] } : { x0: 232, x1: 438, y: 276 };
  function drawSpike(k) {
    const S = SPIKE, t = performance.now() / 1000, show = k.rail.slice(0, 3), n = show.length, top = S.y - (SUZHOU ? 22 : 58);
    if (SUZHOU) gardenSprite('order_spike', S.x, S.y, 32);
    else {
      ctx.fillStyle = '#2c241824'; ctx.beginPath(); ctx.ellipse(S.x, S.y + 2, 14, 4, 0, 0, 7); ctx.fill();
      ctx.fillStyle = '#8a5636'; ctx.strokeStyle = '#4a3020'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(S.x, S.y - 3, 12, 5, 0, 0, 7); ctx.fill(); ctx.stroke();
    }
    show.slice().reverse().forEach((c, ri) => { // 最早的单子在最前面
      const i = n - 1 - ri, lines = [];
      c.members.forEach((m) => { const dk = m.drink && m.dst !== 'none'; if (m.dish && m.st !== 'none') lines.push({ dish: m.dish, drink: dk ? m.drink : null, done: m.st === 'served' && (!dk || m.dst === 'served') }); else if (dk) lines.push({ drink: m.drink, done: m.dst === 'served' }); });
      if (!c.railDone && lines.length && lines.every((l) => l.done)) c.railDone = G.t;
      const w = 58, h = 34 + lines.length * 26, sc = 0.7, off = (i - (n - 1) / 2);
      ctx.save(); ctx.translate(S.x + off * 26, top + 6 + Math.abs(off) * 6); ctx.rotate(off * 0.2 + Math.sin(t * 1.1 + i) * 0.015 + (c.railDone ? 0.1 : 0)); ctx.scale(sc, sc);
      ctx.fillStyle = '#00000014'; ctx.fillRect(-w / 2 + 3, 3, w, h);
      ctx.fillStyle = '#fbf6e6'; ctx.strokeStyle = '#c9b48a'; ctx.lineWidth = 1; ctx.fillRect(-w / 2, 0, w, h); ctx.strokeRect(-w / 2, 0, w, h);
      ctx.fillStyle = '#6b4a30'; ctx.beginPath(); ctx.arc(0, 8, 3, 0, 7); ctx.fill(); // 戳穿的小孔
      faceTag(c, 12, 22, 13); if (c.table) tableTag(c.table.id, -14, 22, 16);
      lines.forEach((l, j) => {
        const ly = 44 + j * 26; ctx.globalAlpha = l.done ? 0.45 : 1;
        if (l.dish) { const im = DISH_IMG[l.dish]; if (im && im.complete) ctx.drawImage(im, -27, ly - 11, 36, 24); if (l.drink) drawCup(6, ly + 9, l.drink, 0.5); } else drawCup(-9, ly + 10, l.drink, 0.6);
        ctx.globalAlpha = 1;
        if (l.done) { ctx.strokeStyle = '#3f7a34'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(12, ly); ctx.lineTo(17, ly + 6); ctx.lineTo(25, ly - 6); ctx.stroke(); }
        else { ctx.fillStyle = '#e3a43a'; ctx.beginPath(); ctx.arc(18, ly, 4.5, 0, 7); ctx.fill(); }
      });
      if (c.railDone) { ctx.rotate(-0.3); ctx.strokeStyle = '#c0392b'; ctx.lineWidth = 2; rr(-18, h / 2 - 6, 36, 20, 3); ctx.stroke(); label('上齐', 0, h / 2 + 4, 13, '#c0392b'); }
      ctx.restore();
    });
    if (!SUZHOU) {
      ctx.strokeStyle = '#4a4440'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(S.x, S.y - 6); ctx.lineTo(S.x, top); ctx.stroke();
      ctx.fillStyle = '#4a4440'; ctx.beginPath(); ctx.moveTo(S.x - 3, top + 2); ctx.lineTo(S.x, top - 8); ctx.lineTo(S.x + 3, top + 2); ctx.fill();
      if (!n && !ART_B()) label('单子', S.x, S.y + 16, 14, '#fbe9c6', '#8a5636');
    }
    if (k.rail.length > 3) label(`+${k.rail.length - 3}`, S.x + 34, S.y - 12, 14, '#2c2420', '#fbf6ec');
    if (!SUZHOU && !n && G.waiter.tickets.length) { const b = Math.abs(Math.sin(t * 3.3)) * 6; label('↓ 单子插这里', S.x, top - 22 - b, 16, '#b04a3c', '#fbf6ec'); }
  }
  function drawRail(k) {
    k.rail = k.rail.filter((c) => G.customers.includes(c) && c.state !== 'leaving' && !(c.railDone && G.t - c.railDone > 1.6));
    ctx.save();
    if (SPIKE) { drawSpike(k); ctx.restore(); return; }
    ctx.strokeStyle = '#6b4a30'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(RAIL.x0, RAIL.y); ctx.lineTo(RAIL.x1, RAIL.y); ctx.stroke();
    ctx.fillStyle = '#8a5a3a'; for (const x of [RAIL.x0, RAIL.x1]) { ctx.beginPath(); ctx.arc(x, RAIL.y, 4, 0, 7); ctx.fill(); }
    // 挂单处的小木牌
    ctx.fillStyle = '#8a5636'; ctx.strokeStyle = '#4a3020'; ctx.lineWidth = 2; rr(RAIL.x1 - 6, RAIL.y - 34, 62, 28, 5); ctx.fill(); ctx.stroke();
    label('挂单', RAIL.x1 + 25, RAIL.y - 20, 17, '#fbe9c6');
    if (!k.rail.length && G.waiter.tickets.length) { const b = Math.abs(Math.sin(performance.now() / 300)) * 6; label('↓ 单子挂这里', (RAIL.x0 + RAIL.x1) / 2, RAIL.y + 22 + b, 16, '#b04a3c', '#fbf6ec'); }
    const t = performance.now() / 1000, show = k.rail.slice(0, 3);
    show.forEach((c, i) => {
      const lines = []; c.members.forEach((m) => { const dk = m.drink && m.dst !== 'none'; if (m.dish && m.st !== 'none') lines.push({ dish: m.dish, drink: dk ? m.drink : null, done: m.st === 'served' && (!dk || m.dst === 'served') }); else if (dk) lines.push({ drink: m.drink, done: m.dst === 'served' }); });
      if (!c.railDone && lines.length && lines.every((l) => l.done)) c.railDone = G.t;
      const w = 58, h = 34 + lines.length * 26, x = RAIL.x0 + 34 + i * 64;
      ctx.save(); ctx.translate(x, RAIL.y); ctx.rotate(Math.sin(t * 1.3 + i * 2) * 0.03 + (c.railDone ? 0.08 : 0));
      ctx.fillStyle = '#00000014'; ctx.fillRect(-w / 2 + 3, 9, w, h);
      ctx.fillStyle = '#fbf6e6'; ctx.strokeStyle = '#c9b48a'; ctx.lineWidth = 1; ctx.fillRect(-w / 2, 6, w, h); ctx.strokeRect(-w / 2, 6, w, h);
      ctx.fillStyle = '#a0703a'; rr(-4, 0, 8, 12, 2); ctx.fill(); // 小夹子
      faceTag(c, 12, 22, 13); if (c.table) tableTag(c.table.id, -14, 22, 16);
      lines.forEach((l, j) => {
        const ly = 44 + j * 26;
        ctx.globalAlpha = l.done ? 0.45 : 1;
        if (l.dish) { const im = DISH_IMG[l.dish]; if (im && im.complete) ctx.drawImage(im, -27, ly - 11, 36, 24); if (l.drink) drawCup(6, ly + 9, l.drink, 0.5); } else drawCup(-9, ly + 10, l.drink, 0.75);
        ctx.globalAlpha = 1;
        if (l.done) { ctx.strokeStyle = '#3f7a34'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(12, ly); ctx.lineTo(17, ly + 6); ctx.lineTo(25, ly - 6); ctx.stroke(); }
        else { ctx.fillStyle = '#e3a43a'; ctx.beginPath(); ctx.arc(18, ly, 4.5, 0, 7); ctx.fill(); }
      });
      if (c.railDone) { ctx.rotate(-0.3); ctx.strokeStyle = '#c0392b'; ctx.lineWidth = 2; rr(-18, h / 2 - 6, 36, 20, 3); ctx.stroke(); label('上齐', 0, h / 2 + 4, 13, '#c0392b'); }
      ctx.restore();
    });
    if (k.rail.length > 3) label(`+${k.rail.length - 3}`, RAIL.x1 - 6, RAIL.y + 20, 14, '#2c2420', '#fbf6ec');
    ctx.restore();
  }
  function drawCup(x, y, drink, s = 1) { // 茶杯 / 玻璃杯 / 豆浆碗（先用程序画）
    if (SUZHOU && ['water','jasmine','puer'].includes(drink) && gardenSprite(drink === 'water' ? 'tea_bowl_water' : 'tea_bowl', x, y + 1, 24 * s)) return;
    const d = DRINKS[drink]; ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    ctx.fillStyle = '#00000018'; ctx.beginPath(); ctx.ellipse(0, 2, 13, 4, 0, 0, 7); ctx.fill();
    if (d.cup === 'glass') { ctx.fillStyle = '#e8f1f4cc'; ctx.beginPath(); ctx.moveTo(-9, -24); ctx.lineTo(9, -24); ctx.lineTo(7, 0); ctx.lineTo(-7, 0); ctx.closePath(); ctx.fill(); ctx.fillStyle = d.col; ctx.beginPath(); ctx.moveTo(-8, -16); ctx.lineTo(8, -16); ctx.lineTo(7, -1); ctx.lineTo(-7, -1); ctx.fill(); }
    else { ctx.fillStyle = '#f6f1e6'; ctx.beginPath(); ctx.moveTo(-12, -14); ctx.quadraticCurveTo(-11, 0, 0, 0); ctx.quadraticCurveTo(11, 0, 12, -14); ctx.closePath(); ctx.fill(); ctx.fillStyle = d.col; ctx.beginPath(); ctx.ellipse(0, -14, 11, 3.5, 0, 0, 7); ctx.fill(); ctx.strokeStyle = '#7fa9c9'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(-10, -9); ctx.lineTo(10, -9); ctx.stroke(); }
    ctx.strokeStyle = '#2c2420aa'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.ellipse(0, d.cup === 'glass' ? -24 : -14, d.cup === 'glass' ? 9 : 12, 3.5, 0, 0, 7); ctx.stroke();
    ctx.restore();
  }
  function drawHeld(h, hx, hy, k = 1) {
    if (h.kind === 'drink') { drawCup(hx, hy + 8, h.drink, 1.1); if (h.cust) faceTag(h.cust, hx + 20, hy - 24, 17); if (h.table) tableTag(h.table, hx - 16, hy - 24); return; }
    if (h.kind === 'dish') drawPlate(hx, hy, h);
    else if (SUZHOU && h.kind === 'plate') drawPlate(hx, hy, null, 0.58 * k, false);
    else if (SUZHOU && h.kind === 'water') drawCup(hx, hy + 5, 'water', 1.12 * k);
    else if (DISH_IMG[h.kind] && DISH_IMG[h.kind].complete) ctx.drawImage(DISH_IMG[h.kind], hx - 30, hy - 26, 60, 40);
    else drawPlate(hx, hy, null);
  }
  function drawTeaCart() {
    if (SUZHOU) { if (has('snack')) gardenSprite('pastries', TEA.cx - 43, TEA.cy, 78); return; }
    if (!(has('tea') || has('snack'))) return;
    if (!spr('tea_cart', TEA.cx, TEA.cy, 120)) { if (!TEA_IMG || !TEA_IMG.complete) return; ctx.drawImage(TEA_IMG, TEA.cx - 80, TEA.cy - 110, 160, 120); }
    for (const [key, x, n] of [['tea', TEA.cx - 30, '茶'], ['snack', TEA.cx + 30, '点心']]) if (has(key)) label(n, x, TEA.cy + 12, 16, '#fbf3e2', '#5a3b28');
  }
  function drawStool(x, y, k = 1) {
    if (!spr('stool', x, y + 12 * k, 46 * k)) { ctx.fillStyle = '#b07a4e'; ctx.beginPath(); ctx.ellipse(x, y, 20 * k, 8 * k, 0, 0, 7); ctx.fill(); } }
  function gardenTableSurface(t) {
    const large = t.size === 4;
    const width = TW[t.size] * t.k;
    const bottom = t.cy + 48 * t.k;
    const native = large ? [417, 274, 64, 63] : [292, 238, 47, 46];
    return { x: t.cx, y: bottom - (native[1] - native[2]) * width / native[0],
      rx: width / 2 - 1, ry: native[3] * width / native[0], width, bottom,
      sprite: large ? 'table_large' : 'table_small' };
  }
  const GARDEN_RUNNERS = new Map();
  function drawGardenRunner(surface, k) {
    const linen = save.decor.linen || CUR_SE;
    const runner = A(linen + '_runner');
    if (!ok(runner)) return;
    const { x, y, rx, ry, width } = surface;

    const farW = width * 0.32, nearW = width * 0.40, pad = 2;
    const key = linen + ':' + width;
    let fitted = GARDEN_RUNNERS.get(key);
    if (!fitted) {
      fitted = document.createElement('canvas');
      fitted.width = Math.ceil(nearW + 2 * pad);
      fitted.height = Math.ceil(2 * ry + 19 * k + pad);
      const paint = fitted.getContext('2d'), center = pad + nearW / 2;
      const sw = runner.naturalWidth, sh = runner.naturalHeight, split = sh * (93 / 242);
      const rows = Math.ceil(2 * ry);
      paint.save(); paint.beginPath(); paint.ellipse(center, ry, rx, ry, 0, 0, Math.PI * 2); paint.clip();
      for (let row = 0; row < rows; row++) {
        const p = row / rows;
        const w = farW + (nearW - farW) * p;
        const inset = sw * (0.29 - p * 0.175);
        paint.drawImage(runner, inset, sh * (10 / 242) + p * (split - sh * (10 / 242)), sw - inset * 2, 1,
          center - w / 2, row * (2 * ry / rows), w, 2 * ry / rows + 0.45);
      }
      paint.restore();
      const bands = Math.ceil(nearW / 2), dx = nearW / bands;
      for (let i = 0; i < bands; i++) {
        const px = pad + i * dx, offset = (px + dx / 2 - center) / rx;
        const edge = ry + ry * Math.sqrt(1 - offset ** 2);
        const sx = sw * (0.055 + 0.89 * i / bands);
        paint.drawImage(runner, sx, split, sw * 0.89 / bands, sh - split,
          px, edge - 1.2, dx + 0.42, 18 * k + 1.2);
      }
      paint.save();
      paint.globalCompositeOperation = 'source-atop';
      const shade = paint.createLinearGradient(0, 0, 0, fitted.height);
      shade.addColorStop(0, '#71504a18'); shade.addColorStop(0.55, '#f6dbb000'); shade.addColorStop(1, '#513b321a');
      paint.fillStyle = shade; paint.fillRect(0, 0, fitted.width, fitted.height);
      paint.restore();
      GARDEN_RUNNERS.set(key, fitted);
    }
    ctx.drawImage(fitted, x - nearW / 2 - pad, y - ry);
  }
  function drawGardenSeatArt(name, x, bottom, height, facingRight) {
    const im = gardenArt(name);
    if (!ok(im)) return false;
    const w = height * im.naturalWidth / im.naturalHeight;
    ctx.save();
    ctx.translate(x, bottom);
    if (facingRight) ctx.scale(-1, 1);
    ctx.drawImage(im, -w / 2, -height, w, height);
    ctx.restore();
    return true;
  }

  function guestExpression(c) {
    if (c.state === 'called' || (c.sayT > 0 && c.say === c.type.say.happy)) return 'greet';
    if (c.upset || c.hearts < 1.5 || (c.state === 'leaving' && c.angry)) return 'upset';
    if (c.hearts < 3) return 'worry';
    return 'calm';
  }
  function guestPose(look, pose) {
    const key = guestNativeName(look, pose);
    if (!key) return null;
    return gardenArt(key);
  }
  function drawGardenDiner(c, i, seat, t, surface, chairTop) {
    const look = guestLook(c, i);
    const frames = guestFrames(look);
    const tasting = c.state === 'eating' && c.members[i]?.st === 'served';
    const delighted = tasting && Math.sin(G.t * 1.25 + i * 0.78 + c.bob) > 0.1;

    const mood = guestExpression(c);
    const uneasy = !seat.front && !tasting && (mood === 'worry' || mood === 'upset');
    const face = uneasy ? guestPose(look, 'sit_worry') : null;
    const im = seat.front ? frames.rear : delighted && ok(frames.smile) ? frames.smile : ok(face) ? face : frames.sit;

    const nod = tasting ? Math.max(0, Math.sin(G.t * 2.1 + i * 0.78 + c.bob)) : 0;
    const settling = 1 - (c.seatEase ?? 1);
    const h = (look.startsWith('bunny') ? 83 : 73) * t.k - 2 * nod * t.k;
    const hem = seat.front ? 6 * t.k : 0;
    const bottom = (seat.front ? chairTop + 18 * t.k : surface.y - 2 * t.k) + (2 * nod - 7 * settling) * t.k;
    ctx.save(); ctx.translate(seat.x, bottom);
    if (seat.x < t.cx) ctx.scale(-1, 1);
    if (ok(im)) {
      const w = h * im.naturalWidth / im.naturalHeight;
      if (hem) {
        // Keep the painted head size and extend only the lower coat behind the chair.
        const y = Math.floor(im.naturalHeight * 0.83), lower = h * (im.naturalHeight - y) / im.naturalHeight;
        ctx.drawImage(im, 0, 0, im.naturalWidth, y, -w / 2, -h, w, h - lower);
        ctx.drawImage(im, 0, y, im.naturalWidth, im.naturalHeight - y, -w / 2, -lower - 0.35, w, lower + hem + 0.35);
      } else {
        ctx.drawImage(im, -w / 2, -h, w, h);
      }
    } else if (ok(frames.stand)) {
      const stand = frames.stand, w = stand.naturalWidth, height = stand.naturalHeight;
      ctx.drawImage(stand, w * 0.13, height * 0.09, w * 0.74, height * 0.57, -h * 0.60, -h, h * 1.20, h + hem);
    }
    ctx.restore();
  }
  function drawGardenTable(t) {
    const surface = gardenTableSurface(t), k = t.k;
    const c = t.cust && seated(t.cust) && (t.cust.state !== 'toSeat' || t.cust.seatEase != null) ? t.cust : null;
    const selected = G.selected?.state === 'queue' && !t.cust && !t.reserved && !t.dirty;
    const selectable = selected && t.size >= G.selected.size && (!tableHeld(t) || G.selected.regular);
    const spare = selected && !selectable;
    if (selectable) {
      ctx.save();
      ctx.strokeStyle = '#e79439';
      ctx.fillStyle = '#f2a33a22';
      ctx.lineWidth = 4.5;
      ctx.beginPath();
      ctx.ellipse(t.cx, surface.bottom - 10 * k, surface.rx + 19, 37 * k, 0, 0, 2 * Math.PI);
      ctx.fill(); ctx.stroke();
      ctx.restore();
    }
    if (spare) ctx.globalAlpha = 0.70;
    ctx.fillStyle = '#453c3720';
    ctx.beginPath();
    ctx.ellipse(t.cx, surface.bottom - 5 * k, surface.rx * 0.88, 10 * k, 0, 0, 2 * Math.PI);
    ctx.fill();
    for (const [i, seat] of t.seats.entries()) {
      if (seat.front) continue;
      const h = 58 * k, bottom = seat.y + 25 * k;
      drawGardenSeatArt('chair_far', seat.x, bottom, h, seat.x < t.cx);
      if (c && i < c.size) drawGardenDiner(c, i, seat, t, surface, bottom - h);
    }
    gardenSprite(surface.sprite, surface.x, surface.bottom, surface.width);
    if (t.size === 4) drawGardenRunner(surface, k);
    else spr((save.decor.flowers && save.decor.flowers !== 'gift' ? save.decor.flowers : CUR_SE)
      + '_vase', surface.x + surface.rx * 0.61, surface.y - surface.ry * 0.1, 17 * k);
    if (tableHeld(t) && !c && !t.dirty) label('熟客留桌', t.cx, surface.y + 2, 15, '#f9eedb', '#7d5745');
    t.topY = [surface.y - 0.43 * surface.ry, surface.y + 0.48 * surface.ry];
    if (t.dirty) drawPlate(surface.x, surface.y + 7 * k, null, 0.53 * k);
    if (c && ['waitFood', 'eating', 'bill', 'ordering', 'ordering-open', 'linger'].includes(c.state)) {
      for (const [i, m] of c.members.entries()) {
        const seat = t.seats[i], px = surface.x + (seat.x - surface.x) * 0.70;
        const py = t.topY[Number(seat.front)] + 7 * k;
        if (c.state === 'linger') drawPlate(px, py, null, 0.49 * k);
        else if (m.st === 'served' && c.state !== 'bill') drawPlate(px, py, { dish: m.dish }, 0.69 * k);
        if (m.dst === 'served' && c.state !== 'bill') {
          const side = Math.sign(seat.x - surface.x) || 1;
          drawCup(px + (t.size === 4 ? side : -side) * 24 * k, py + 3 * k, m.drink, 0.78 * k);
        }
      }
    }
    for (const [i, seat] of t.seats.entries()) {
      if (!seat.front) continue;
      const h = 50 * k, bottom = seat.y + 16 * k;
      if (c && i < c.size) drawGardenDiner(c, i, seat, t, surface, bottom - h);
      drawGardenSeatArt('chair_near', seat.x, bottom, h, seat.x < t.cx);
    }
    ctx.globalAlpha = 1;
    const tx = t.cx - surface.rx * 0.86, ty = surface.y + surface.ry * 0.52;
    tableTag(t.id, tx, ty - 4 * k, 18);
    t.sizeAt = { x: tx, y: ty + 12 * k };
    if (spare) label('坐不下 ' + G.selected.size + ' 位', t.cx, surface.y - 10, 16, '#fbf6ec', '#5a4b3a');
  }
  function drawTable(t) {
    const k = t.k, sel = G.selected && G.selected.state === 'queue' ? G.selected : null, empty = !t.cust && !t.reserved && !t.dirty;
    if (sel && empty && t.size >= sel.size) { // T-02：选了排队的客人 → 坐得下的空桌亮起来
      const pulse = 0.6 + 0.4 * Math.sin(performance.now() / 160);
      ctx.save(); ctx.globalAlpha = pulse; ctx.strokeStyle = '#f2a33a'; ctx.lineWidth = 7; ctx.fillStyle = '#f2a33a22';
      ctx.beginPath(); ctx.ellipse(t.cx, t.cy + 14 * k, TW[t.size] * 0.62 * k + 18, 62 * k, 0, 0, 7); ctx.fill(); ctx.stroke(); ctx.restore();
    }
    ctx.fillStyle = '#2c241824'; ctx.beginPath(); ctx.ellipse(t.cx, t.cy + (t.size === 4 ? 80 : 74) * k, TW[t.size] * 0.55 * k, 12 * k, 0, 0, 7); ctx.fill();
    const art = spr(t.size === 4 ? 'table_m' : 'table_s', t.cx, t.cy + (t.size === 4 ? 82 : 76) * k, TW[t.size] * k);
    if (!art) { const img = t.size === 4 ? TABLE4 : TABLE2; if (img.complete) ctx.drawImage(img, t.cx - 160, t.cy - 90, 320, 200); }
    const tw = TW[t.size] * k, sc = tw / (t.size === 4 ? 351 : 247), ty = t.cy + (t.size === 4 ? 82 : 76) * k - tw * (t.size === 4 ? 225 / 351 : 218 / 247);
    if (t.size === 4) { const rn = A(CUR_SE + '_runner'); if (ok(rn)) { const rw = tw * 0.6, rs = rw / rn.naturalWidth; ctx.drawImage(rn, 0, 0, rn.naturalWidth, 92 * rn.naturalHeight / 242, t.cx - rw / 2, ty + 8 * sc, rw, 95 * sc); ctx.drawImage(rn, 0, 92 * rn.naturalHeight / 242, rn.naturalWidth, 150 * rn.naturalHeight / 242, t.cx - rw / 2, ty + 103 * sc, rw, 34 * sc); } }
    else spr(CUR_SE + '_vase', t.cx + tw * 0.3, ty + 62 * sc, 22 * k);
    t.topY = [ty + 40 * sc, ty + 82 * sc]; // 桌面上后排、前排放菜的高度
    { // 桌号牌：木底座 + 白卡片，大号数字
      const nx = t.cx - tw * 0.34, ny = ty + 58 * sc;
      ctx.fillStyle = '#7a4d30'; rr(nx - 13, ny - 3, 26, 7, 3); ctx.fill();
      ctx.fillStyle = '#fbf6ec'; ctx.strokeStyle = '#4a3020'; ctx.lineWidth = 2; rr(nx - 12, ny - 30, 24, 28, 4); ctx.fill(); ctx.stroke();
      label(`${t.id}`, nx, ny - 15, 20, '#b04a3c');
      t.sizeAt = { x: nx, y: ny + 16 }; // T-02：几人桌的小牌，等人物画完再画在最上层
    }
    if (t.dirty) drawPlate(t.cx, t.cy, null, 0.7 * k);
    const c = t.cust;
    if (c && ['waitFood', 'eating', 'bill', 'ordering', 'ordering-open', 'linger'].includes(c.state)) c.members.forEach((m, i) => {
      const sp = t.seats[i], py = t.topY[sp.front ? 1 : 0];
      if (c.state === 'linger') { drawPlate(sp.x, py, null, 0.55 * k); return; }
      if (m.st === 'served' && c.state !== 'bill') drawPlate(sp.x, py, { dish: m.dish }, 0.6 * k);
      if (m.dst === 'served' && c.state !== 'bill') drawCup(sp.x + 26 * k, py + 2, m.drink, 0.7 * k);
    });
    if (sel && empty && t.size < sel.size) { // 坐不下的空桌变灰
      ctx.save(); ctx.fillStyle = '#e9e2d6b3'; ctx.beginPath(); ctx.ellipse(t.cx, t.cy + 14 * k, TW[t.size] * 0.62 * k + 14, 70 * k, 0, 0, 7); ctx.fill();
      label(`坐不下 ${sel.size} 位`, t.cx, t.cy + 14 * k, 17, '#fbf3e2', '#8a7a6a'); ctx.restore();
    }
  }
  function memberPos(c, i) {
    if (seated(c) && c.state !== 'toSeat') return c.table.seats[i];
    if (!SUZHOU && c.state === 'toSeat' && c.table) { const sp = c.table.seats[i], f = Math.min(1, Math.hypot(c.x - sp.x, c.y - sp.y) / 200); return { x: sp.x + (c.x - sp.x) * f, y: sp.y + (c.y - sp.y) * f }; }

    const n = c.size;
    if (SUZHOU && inLine(c) && QSPOTS[c.qi]?.zone === 'outside' && c.y < doorLine(c.x)) {
      const row = Math.floor(i / 2), count = Math.min(2, n - row * 2);
      return { x: c.x + (i % 2 - (count - 1) / 2) * 26 - row * 6, y: c.y - row * 12 + (i % 2) * 5 };
    }
    const r = i < 2 ? 0 : 1, inRow = r ? n - 2 : 2;
    const group = n <= 2
      ? { x: c.x + (i - (n - 1) / 2) * 30, y: c.y + (i % 2) * 6 - 3 }
      : { x: c.x + ((i % 2) - (inRow - 1) / 2) * 32 + (r ? 6 : -6), y: c.y + (r ? 10 : -12) };
    if (!SUZHOU || c.state !== 'toSeat' || !c.table) return group;
    const lead = c.table.seats[0], seat = c.table.seats[i];
    const far = Math.min(1, Math.hypot(c.x - lead.x, c.y - lead.y) / 138);
    const f = far * far * (3 - 2 * far);
    return { x: seat.x + (group.x - seat.x) * f, y: seat.y + (group.y - seat.y) * f };
  }
  function anchor(c) {
    if (c.table && seated(c) && c.state !== 'toSeat') return { x: c.table.chip.x + 56, y: c.table.chip.y };
    return { x: c.x, y: c.y - 124 };
  }
  function drawGardenWalk(name, x, y, size, flip, distance) {
    const im = typeof name === 'string' ? gardenArt(name) : name;
    if (!ok(im)) return false;
    const cell = im.naturalWidth / 4, frame = Math.floor((distance || 0) / 22) % 4;
    ctx.save(); ctx.translate(x, y);
    if (flip) ctx.scale(-1, 1);
    ctx.drawImage(im, frame * cell, 0, cell, im.naturalHeight, -size / 2, -size * 0.875, size, size);
    ctx.restore();
    return true;
  }

  function drawWaitingPose(im, x, y, size, flip, time, lean, nod, mood) {
    const w = im.naturalWidth, h = im.naturalHeight, unit = size / h;
    const easing = mood === 'upset' ? -0.88 : 1;
    const sway = Math.sin(time * 1.6) * 0.8;
    const breath = Math.sin(time * 2.2) * 0.75;
    const edges = [0, 23, 45, 63, 80, 99, 121, 144];
    ctx.save(); ctx.translate(x, y); if (flip) ctx.scale(-1, 1);
    const dx = (v) => (sway + easing * lean * 4 - nod * 4.3) * Math.max(0, 1 - v / 106) * unit;
    const dy = (v) => (breath - lean * 1.35 - nod * 5.3) * Math.max(0, 1 - v / 111) * unit;
    for (let i = 1; i < edges.length; i++) {
      const a = edges[i - 1], b = edges[i], top = a * size / 144, bottom = b * size / 144;
      ctx.save();
      ctx.translate(dx(a) - size / 2, top - size * 0.875 + dy(a));
      ctx.transform(1, 0, (dx(b) - dx(a)) / (bottom - top), 1, 0, 0);
      ctx.drawImage(im, 0, a * h / 144, w, (b - a) * h / 144, 0, 0, size, bottom - top + dy(b) - dy(a) + 0.22);
      ctx.restore();
    }
    ctx.restore();
  }
  function drawMember(c, i) {
    const p = memberPos(c, i);
    if (SUZHOU) {

      const look = guestLook(c, i), frames = guestFrames(look);
      if (!ok(frames.stand)) return;
      const scale = (c.size > 1 ? 0.95 : 1.02) * K(p.y) * 1.23, size = GUEST_S * scale;
      const called = c.state === 'called' ? G.t - (c.calledAt ?? G.t) - i * 0.06 : -1;
      const time = G.t + c.bob + i * 0.62;
      const moving = c.path.length > 0, flip = c.face > 0;
      const mood = guestExpression(c);
      const idleBeat = time % (4.5 + (i % 3) * 0.47);
      const lean = idleBeat > 3.16 && idleBeat < 4.02 ? Math.sin((idleBeat - 3.16) * Math.PI / 0.86) : 0;
      const nod = called > 0.06 && called < 0.8 ? Math.sin((called - 0.06) * Math.PI / 0.74) : 0;
      ctx.fillStyle = '#00000018'; ctx.beginPath(); ctx.ellipse(p.x, p.y, 24 * scale, 7 - nod, 0, 0, 7); ctx.fill();
      if (moving && drawGardenWalk(frames.walk, p.x, p.y, size, flip, (c.walkDistance || 0) + 11 * i)) return;
      if (called >= 0.06 && called < 0.30
        && drawGardenWalk(frames.walk, p.x, p.y - nod * 3, size, flip, (called < 0.18 ? 1 : 3) * 22)) return;
      const blink = idleBeat > 1.29 && idleBeat < 1.45;
      const next = mood === 'upset' || mood === 'worry' ? 'stand_worry'
        : (called > 0.30 && called < 0.91) || (mood === 'greet' && c.state !== 'called') ? 'greet' : blink ? 'blink' : null;
      const alternate = next ? guestPose(look, next) : null;
      drawWaitingPose(ok(alternate) ? alternate : frames.stand, p.x, p.y, size, flip, time, lean, nod, mood);
      return;
    }
    const moving = ['enter', 'toSeat', 'leaving', 'following'].includes(c.state);
    const bob = Math.sin(c.bob + i) * (moving ? 4 : 1.2);
    const sit = c.table && seated(c) && c.state !== 'toSeat', sp = sit ? c.table.seats[i] : null;
    const sc = (c.size > 1 ? 0.95 : 1.02) * K(p.y), w = 96 * sc, h = 106 * sc;
    if (!sit) { ctx.fillStyle = '#00000018'; ctx.beginPath(); ctx.ellipse(p.x, p.y, 24 * sc, 7, 0, 0, 7); ctx.fill(); }
    const away = (sp && sp.front) || c.state === 'leaving' || (moving && c.path.length && c.path[c.path.length - 1].y < c.y - 20);
    const lk = (c.looks && c.looks[i]) || c.type.id, gk = !GREY && guestKey(lk, sit);
    const gi = gk && A(gk);
    if (gi && ok(gi)) { // 新画的客人：图朝左；走向右边或坐在桌子左侧时翻过来
      const S = GUEST_S * sc, nx = c.path && c.path.length ? c.path[0].x : c.x;
      const flip = sit ? (sp && sp.x < c.table.cx) : moving && nx > c.x + 2;
      const t = performance.now() / 1000 + i * 0.37 + (c.bob || 0), m = c.members[i] || {};
      let hop = 0, rot = 0, sy = 1 + 0.012 * Math.sin(t * 2.2); // 呼吸
      if (moving && !sit) { const ph = t * 8; hop = -Math.abs(Math.sin(ph)) * 6 * sc; rot = Math.sin(ph) * 0.13; sy = 1 - 0.05 * Math.abs(Math.cos(ph)); } // 主人：走路身体左右摇、上下颠，萌一点
      else if (sit && c.state === 'eating' && m.st === 'served') { // 低头吃一口、抬头嚼
        const e = Math.max(0, Math.sin(t * 4.2)), dir = sp.x < c.table.cx - 4 ? 1 : sp.x > c.table.cx + 4 ? -1 : 0;
        rot = dir * 0.1 * e; sy = 1 - 0.045 * e; hop = (dir ? 0 : 3 * e) * sc;
      } else if (sit && c.state === 'ordering' && i === 0) hop = -Math.abs(Math.sin(t * 5)) * 3 * sc;
      ctx.save(); ctx.translate(p.x, p.y + hop); ctx.rotate(rot); ctx.scale(flip ? -1 : 1, sy);
      ctx.drawImage(gi, -S / 2, -0.878 * S, S, S);
      ctx.restore(); return;
    }
    const im = away ? custImgBack(lk) : custImg(lk);
    if (im.complete) ctx.drawImage(im, p.x - w / 2, p.y - h + 4 + bob, w, h);
  }
  // 人身上的动作提示：生气冒火、等久了冒汗、举手点单、吃饭冒热气、聊天的小点点、结账掏钱
  function drawMood(c) {
    if (!c.table || !seated(c) || c.state === 'toSeat') return;
    const t = performance.now() / 1000;
    c.members.forEach((m, i) => {
      const p = memberPos(c, i), k = K(p.y), hy = p.y - 96 * k, hx = p.x + 22 * k;
      if (c.upset || c.hearts < 1.5) { ctx.save(); ctx.translate(hx, hy - 4 + Math.sin(t * 8) * 2); ctx.strokeStyle = '#d0453a'; ctx.lineWidth = 3; for (const r of [0, 1.57, 3.14, 4.71]) { ctx.beginPath(); ctx.arc(Math.cos(r + 0.78) * 7, Math.sin(r + 0.78) * 7, 5, r - 0.9, r + 0.9); ctx.stroke(); } ctx.restore(); }
      else if (['waitFood', 'thirsty', 'ordering'].includes(c.state) && c.hearts < 3) { ctx.fillStyle = '#7fb6e0'; ctx.beginPath(); const yy = hy + 4 + (t * 12 % 10); ctx.moveTo(hx, yy - 9); ctx.quadraticCurveTo(hx + 6, yy, hx, yy + 4); ctx.quadraticCurveTo(hx - 6, yy, hx, yy - 9); ctx.fill(); }
      if (!SUZHOU && c.state === 'ordering' && i === 0) { const yy = hy - 18 - Math.abs(Math.sin(t * 5)) * 6; ctx.fillStyle = '#e3a43a'; ctx.beginPath(); ctx.arc(p.x, yy, 13, 0, 7); ctx.fill(); label('!', p.x, yy + 1, 20, '#fff'); }
      if (c.state === 'eating' && m.st === 'served') for (let j = 0; j < 2; j++) { const ph = (t * 0.7 + j / 2 + i * 0.3) % 1; ctx.strokeStyle = `rgba(255,255,255,${0.9 * (1 - ph)})`; ctx.lineWidth = 2.5; const sx = p.x - 6 + j * 10, sy = c.table.topY[c.table.seats[i].front ? 1 : 0] - 20 - ph * 22; ctx.beginPath(); ctx.moveTo(sx, sy + 8); ctx.quadraticCurveTo(sx + 5, sy + 2, sx, sy - 4); ctx.stroke(); }
      if (!SUZHOU && c.state === 'bill' && i === 0) { const im = icon('bill'); if (im.complete) ctx.drawImage(im, p.x - 14, hy - 34 - Math.abs(Math.sin(t * 4)) * 5, 28, 28); }
    });
    if (c.state === 'linger') { const p = memberPos(c, 0), k = K(p.y); for (let j = 0; j < 3; j++) { ctx.fillStyle = `rgba(192,96,122,${0.4 + 0.6 * ((Math.floor(t * 3) % 3) === j)})`; ctx.beginPath(); ctx.arc(p.x + (c.size > 1 ? 30 : 0) * k - 10 + j * 10, p.y - 112 * k, SUZHOU ? 2.4 : 4, 0, 7); ctx.fill(); } }
  }
  // 坐下的客人：状态牌挂在桌子右边（图标 + 字 + 一排小爱心），不挡别的桌
  const CHIP = { thirsty: ['#dceefa', '#3f86c4'], reading: ['#eeeae4', '#9a8f82'], ordering: ['#fff0b8', '#e3a43a'], waitFood: ['#fbf6ec', '#6e5a4b'], eating: ['#e2f3d6', '#4f9a3a'], bill: ['#ffe6a8', '#c98a14'], linger: ['#fbe3ea', '#c0607a'], upset: ['#fbd3cc', '#d0453a'] };
  function tableChip(c, ic, text, bg = '#fbf6ec', dish = null) {
    const t = c.table, st = c.upset ? 'upset' : c.state === 'ordering-open' ? 'ordering' : c.state, sty = CHIP[st] || ['#fbf6ec', '#2c2420'];
    const now = performance.now() / 1000, x = t.chip.x + (st === 'upset' ? Math.sin(now * 30) * 1.5 : 0), y = t.chip.y - (['ordering', 'bill'].includes(st) ? Math.abs(Math.sin(now * 4)) * 5 : 0);

    if (SUZHOU) {
      ctx.save(); ctx.font = '16px "PingFang SC","Microsoft YaHei",sans-serif';
      const w = Math.min(125, Math.max(83, 40 + ctx.measureText(text || '').width));
      const left = Math.max(12, Math.min(x, W - w - 12)), top = y - 24;
      ctx.fillStyle = '#faf0dd'; ctx.strokeStyle = '#ad9178'; ctx.lineWidth = 1.15;
      rr(left, top, w, 46, 8); ctx.fill(); ctx.stroke();
      const im = dish ? DISH_IMG[dish] : icon(ic);
      if (ok(im)) ctx.drawImage(im, left + 5, top + 2, 25, dish ? 19 : 25);
      ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#5a4336';
      ctx.fillText(text || '', left + 35, top + 13, w - 40);
      for (let i = 0; i < 5; i++) heart(left + 14 + i * 12, top + 34, 8.5, c.hearts >= i + 0.5 ? '#bb766b' : '#dcd0be');
      ctx.restore();
      return;
    }
    bg = sty[0];
    ctx.font = `bold 20px ${FONT}`;
    const tw = text ? ctx.measureText(text).width : 0, w = Math.max(104, 48 + tw + 12), h = 66;
    ctx.fillStyle = bg; ctx.strokeStyle = sty[1]; ctx.lineWidth = 3.5;
    rr(x, y - h / 2, w, h, 12); ctx.fill(); ctx.stroke(); ctx.fillStyle = sty[1]; rr(x + 3, y - h / 2 + 4, 5, h - 8, 3); ctx.fill(); ctx.fillStyle = bg;
    ctx.beginPath(); ctx.moveTo(x + 1, y - 7); ctx.lineTo(x - 9, y); ctx.lineTo(x + 1, y + 7); ctx.fill();
    if (dish) { const im = DISH_IMG[dish]; if (im && im.complete) ctx.drawImage(im, x + 3, y - 30, 46, 31); }
    else { const im = icon(ic); if (im && im.complete) ctx.drawImage(im, x + 6, y - 31, 36, 36); }
    if (text) { ctx.fillStyle = '#2c2420'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillText(text, x + 50, y - 12); }
    for (let i = 0; i < 5; i++) heart(x + 11 + i * 18, y + 14, 15, c.hearts >= i + 0.5 ? (c.hearts < 2 ? '#ff4d4d' : '#ef6f7a') : '#d9cfc6');
  }
  function queueChip(c) {

    const r = qCard(c);
    if (SUZHOU) {
      const called = c.state === 'called';
      if (G.selected === c) {
        ctx.fillStyle = '#ad86562c'; ctx.strokeStyle = '#aa8052'; ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.ellipse(c.x, c.y + 1, 24 + c.size * 9, 7, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      }
      ctx.save();
      ctx.strokeStyle = '#a5866b'; ctx.lineWidth = 1;
      ctx.fillStyle = called ? '#f6e6ce' : '#f9f0df';
      rr(r.x, r.y, r.w, r.h, 7); ctx.fill(); ctx.stroke();
      const left = r.x > c.x, p = left ? r.x + 1 : r.x + r.w - 1;
      ctx.beginPath(); ctx.moveTo(p, r.y + 17); ctx.lineTo(p + (left ? -7 : 7), r.y + 21); ctx.lineTo(p, r.y + 24); ctx.fill();
      label(called ? '已叫到' : c.size + ' 位', r.x + r.w / 2, r.y + 13, 15, '#655044');
      for (let i = 0; i < 5; i++) heart(r.x + 9 + i * 10, r.y + 28, 8.5, c.hearts >= i + 0.5 ? '#bb766b' : '#dcd0be');
      ctx.restore();
      return;
    }
    const w = r.w, h = r.h, x = r.x + w, y = r.y + h / 2; // D-006：牌子挂在这组左上，斜线排队时不压前后两组；点按用同一矩形
    if (G.selected === c) { ctx.strokeStyle = '#f2a33a'; ctx.lineWidth = 5; ctx.beginPath(); ctx.ellipse(c.x, c.y + 2, 30 + c.size * 14, 14, 0, 0, 7); ctx.stroke(); }
    ctx.fillStyle = c.state === 'called' ? '#fff3c4' : '#fbf6ec'; ctx.strokeStyle = '#2c2420'; ctx.lineWidth = 2;
    rr(x - w, y - h / 2, w, h, 10); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x - 1, y - 6); ctx.lineTo(x + 8, y); ctx.lineTo(x - 1, y + 6); ctx.fill();
    const im = icon('wait'); if (im.complete) ctx.drawImage(im, x - w + 3, y - 21, 24, 24);
    label(`${c.size}位`, x - 18, y - 9, 18, '#2c2420');
    for (let i = 0; i < 5; i++) heart(x - w + 8 + i * 11.5, y + 8, 10, c.hearts >= i + 0.5 ? (c.hearts < 2 ? '#ff4d4d' : '#ef6f7a') : '#d9cfc6');
  }
  function drawDrinkWants(c) { // 点了茶水还没送到：杯子画在那位客人头上
    if (!c.table || !['ordering', 'ordering-open', 'waitFood', 'eating'].includes(c.state)) return;
    const t = performance.now() / 1000;
    c.members.forEach((m, i) => {
      if (!m.drink || m.dst === 'served' || m.dst == null || (SUZHOU && m.dst !== 'make')) return;
      const p = memberPos(c, i), k = K(p.y), x = p.x + 30 * k, y = p.y - 128 * k + Math.sin(t * 3 + i) * 2;

      if (SUZHOU) {
        ctx.fillStyle = '#f9efdd'; ctx.strokeStyle = '#a69177'; ctx.lineWidth = 1;
        rr(x - 15, y - 13, 30, 27, 6); ctx.fill(); ctx.stroke();
        drawCup(x, y + 9, m.drink, 0.84);
        return;
      }
      ctx.fillStyle = m.dst === 'make' ? '#e4f0f6' : '#fbf6ecdd'; ctx.strokeStyle = '#3f86c4'; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.arc(x, y, 19, 0, 7); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x - 5, y + 17); ctx.lineTo(x, y + 25); ctx.lineTo(x + 5, y + 17); ctx.fill();
      drawCup(x, y + 11, m.drink, 0.78);
    });
  }
  function drawGardenSpeech(x, y, text) {
    const width = 210, lines = [''];
    if (!text) return;
    ctx.save();
    ctx.font = '18px "PingFang SC","Microsoft YaHei",system-ui,sans-serif';
    for (const char of text) {
      const i = lines.length - 1;
      if (char === '\n') lines.push('');
      else if (lines[i] && ctx.measureText(lines[i] + char).width > width) lines.push(char);
      else lines[i] += char;
    }

    const lineH = 24, w = Math.max(...lines.map((line) => ctx.measureText(line).width)) + 26, height = lines.length * lineH + 10;
    const left = Math.max(12, Math.min(x - w / 2, W - w - 12));
    const top = Math.max(75, y - height - 5), tail = Math.max(left + 12, Math.min(left + w - 12, x));
    ctx.fillStyle = '#fff6e7f8'; ctx.strokeStyle = '#ac8a6d'; ctx.lineWidth = 1.15;
    ctx.shadowColor = '#5c463846'; ctx.shadowBlur = 7; ctx.shadowOffsetY = 2;
    ctx.beginPath(); ctx.roundRect(left, top, w, height, 8); ctx.fill();
    ctx.shadowColor = 'transparent'; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(tail - 6, top + height - 1); ctx.lineTo(tail + 1, top + height + 5);
    ctx.lineTo(tail + 6, top + height - 1); ctx.fill(); ctx.stroke();
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#58463e';
    lines.forEach((line, i) => ctx.fillText(line, left + w / 2, top + 5 + lineH * (i + 0.5)));
    ctx.restore();
  }
  function drawPartyUI(c) {
    const a = anchor(c); drawMood(c); drawDrinkWants(c);
    if (inLine(c)) {
      if (SUZHOU && c.sayT > 0 && (c.regular || c.state === 'called')) drawGardenSpeech(c.x, c.y - 106, c.say);
      else if (c.sayT > 0 && c.state === 'called') bubble(c.x, c.y - 112, c.say, { size: 19 });
      queueChip(c); return;
    }
    if (c.state === 'browse') {
      if (SUZHOU) drawGardenSpeech(c.x, c.y - 101, c.say || '看看食单');
      else if (c.say) bubble(c.x, c.y - 112, c.say, { size: 19 });
      else bubbleIcon(c.x, c.y - 100, 'wait', '看菜单', '#fbf6ec', 16);
      return;
    }
    if (c.table && seated(c) && c.state !== 'toSeat') {
      const oma = c.type.kind === 'omakase', w = G.waiter;
      const waiting = c.members.filter((m) => m.st === 'cook'), want = oma && c.members.find((m) => m.st === 'none' && m.want);
      const t = c.table;
      // 看菜单、吃饭和等续坐已经有画面动作。让出桌边，低心情时才补小爱心。
      const relaxed = c.state === 'reading' || c.state === 'linger'
        || (c.state === 'eating' && !c.members.some((m) => m.dst === 'make'));
      if (SUZHOU && c.sayT <= 0 && relaxed) {
        if (c.hearts < 3 && c.state !== 'linger') {
          const y = gardenTableSurface(t).bottom + 9 * t.k;
          for (let i = 0; i < 5; i++) heart(t.cx - 20 + i * 10, y, 9, i + 0.5 <= c.hearts ? '#ef6f7a' : '#d9cfc6');
        }
        return;
      }
      if (oma && ['reading', 'ordering', 'ordering-open', 'waitFood', 'thirsty'].includes(c.state)) { // 随缘客：已解锁的喜好排在牌子上面
        const dx = dexOf(c.type.id), ks = c.type.likes.filter((x) => dx.likes.includes(x)).map((x) => [x, 'heart']).concat(c.type.hates.filter((x) => dx.hates.includes(x)).map((x) => [x, 'cross']));
        label('随缘', t.chip.x + 22, t.chip.y - 50, 17, '#8a5a8a', '#fbf6ec');
        ks.slice(0, 3).forEach(([x2, b], i) => { const xx = t.chip.x + 60 + i * 32, yy = t.chip.y - 66; const im = icon(x2), bi = icon(b); ctx.fillStyle = '#fbf6ecdd'; ctx.beginPath(); ctx.arc(xx, yy + 14, 16, 0, 7); ctx.fill(); if (im.complete) ctx.drawImage(im, xx - 14, yy, 28, 28); if (bi.complete) ctx.drawImage(bi, xx + 4, yy - 4, 15, 15); });
      }
      if (SUZHOU && c.sayT > 0 && c.say) { drawGardenSpeech(t.cx, t.chip.y - 15, c.say); return; }
      if (c.sayT > 0) { tableChip(c, 'order', c.say.length > 6 ? c.say.slice(0, 6) + '…' : c.say, '#fbf6ec'); return; }
      if (c.state === 'thirsty') return tableChip(c, 'water', '先要水', '#e4f0f6');
      if (c.state === 'ordering') return c.upset ? tableChip(c, 'cross', '换一道', '#fbdcd8') : want ? tableChip(c, want.want, `想吃${want.want}`, '#fff3c4') : tableChip(c, 'order', '点单', '#fff3c4');
      if (c.state === 'reading') return tableChip(c, 'wait', '看菜单');
      if (c.state === 'waitFood' && w.tickets.some((tk) => tk.c === c)) return tableChip(c, 'order', '没送单', '#fde7c8');
      if (c.state === 'waitFood' && waiting.length) return tableChip(c, null, waiting.length > 1 ? `等×${waiting.length}` : '等菜', '#fbf6ec', waiting[0].dish);
      if (c.state === 'bill') return tableChip(c, 'bill', '结账', '#e4f4d8');
      if (c.state === 'linger') return tableChip(c, 'heart', c.size > 1 ? '聊天中' : '坐一会', '#fbeef0');
      if (c.state === 'eating') return tableChip(c, 'eat', c.members.some((m) => m.dst === 'make') ? (c.members.every((m) => m.dst !== 'make' || m.drink === 'water') ? '等水' : '等茶') : '好香');
      return tableChip(c, 'wait', '…');
    }
    if (c.state === 'leaving') { if (c.sayT > 0) { if (SUZHOU) drawGardenSpeech(a.x, a.y, c.say); else bubble(a.x, a.y - 8, c.say, { size: 19 }); } return; }
    if (G.selected === c) { ctx.strokeStyle = '#f2a33a'; ctx.lineWidth = 5; ctx.beginPath(); ctx.ellipse(c.x, c.y + 2, 30 + c.size * 14, 14, 0, 0, 7); ctx.stroke(); }
    for (let i = 0; i < 5; i++) heart(a.x - 30 + i * 15, a.y + 8, 12, c.hearts >= i + 0.5 ? (c.hearts < 2 ? '#ff4d4d' : '#ef6f7a') : '#d9cfc6');
    if (c.watered) { const im = icon('water'); if (im.complete) ctx.drawImage(im, a.x + 54, a.y - 4, 22, 22); }
    const oma = c.type.kind === 'omakase';
    if (oma && c.state !== 'queue' && c.state !== 'enter') label('随缘', a.x - 66, a.y + 9, 15, '#8a5a8a');
    // 随缘客头顶的图鉴引导：已解锁的喜欢 / 不吃
    if (oma && ['reading', 'ordering', 'ordering-open', 'waitFood', 'thirsty'].includes(c.state)) {
      const dx = dexOf(c.type.id), ks = c.type.likes.filter((t) => dx.likes.includes(t)).map((t) => [t, 'heart']).concat(c.type.hates.filter((t) => dx.hates.includes(t)).map((t) => [t, 'cross']));
      ks.slice(0, 6).forEach(([t, b], i) => { const x = a.x - (Math.min(6, ks.length) - 1) * 15 + i * 30, y = a.y + 22; const im = icon(t), bi = icon(b); ctx.fillStyle = '#fbf6eccc'; ctx.beginPath(); ctx.arc(x, y + 12, 15, 0, 7); ctx.fill(); if (im.complete) ctx.drawImage(im, x - 13, y - 1, 26, 26); if (bi.complete) ctx.drawImage(bi, x + 4, y - 4, 14, 14); });
    }
    const waiting = c.members.filter((m) => m.st === 'cook');
    const want = oma && c.members.find((m) => m.st === 'none' && m.want);
    if (c.sayT > 0) bubble(a.x, a.y - 8, c.say, { size: 19 });
    else if (c.state === 'thirsty') bubbleIcon(a.x, a.y - 8, 'water', '先要水', '#e4f0f6');
    else if (c.state === 'ordering') { if (c.upset) bubbleIcon(a.x, a.y - 8, 'cross', '换一道', '#fbdcd8'); else if (want) bubbleIcon(a.x, a.y - 8, want.want, `想吃${want.want}`, '#fff3c4'); else bubbleIcon(a.x, a.y - 8, 'order', '点单', '#fff3c4'); }
    else if (c.state === 'reading') bubbleIcon(a.x, a.y - 8, 'wait', '看菜单', '#fbf6ec', 16);
    else if (c.state === 'waitFood' && waiting.length) bubbleDish(a.x, a.y - 8, waiting[0].dish, waiting.length > 1 ? `还差${waiting.length}` : '');
    else if (c.state === 'called') bubbleIcon(a.x, a.y - 8, 'wait', '等领位', '#fbf6ec', 16);
    else if (c.state === 'bill') bubbleIcon(a.x, a.y - 8, 'bill', '结账', '#e4f4d8');
    else if (c.state === 'eating') bubbleIcon(a.x, a.y - 8, 'eat', '好香', '#fbf6ec', 16);
    else if (c.state === 'queue' || c.state === 'enter') bubbleIcon(a.x, a.y + 4, 'wait', `${c.size}位`, '#fbf6ec', 14);
  }
  function drawCat(img, x, y, face, walking, s = 1, gait = null, distance = 0, idle = null) {
    const t = performance.now() / 1000;
    const bob = walking ? -Math.abs(Math.sin(t * (SUZHOU ? 5 : 12))) * (SUZHOU ? 1 : 6) : 0;
    const rot = walking && !SUZHOU ? Math.sin(t * 12) * 0.06 : 0;
    ctx.fillStyle = '#00000020'; ctx.beginPath(); ctx.ellipse(x, y, 34 * s, 9 * s, 0, 0, 7); ctx.fill();
    if (SUZHOU && gait && walking && drawGardenWalk('s_' + gait + '_walk', x, y, 146 * s, face < 0, distance)) return 0;
    ctx.save(); ctx.translate(x, y + bob); ctx.rotate(rot); ctx.scale((face < 0 ? -1 : 1) * s, s);
    if (idle) ctx.transform(1, 0, idle.lean, idle.stretch, 0, 0);
    const pose = idle?.pose && gait ? gardenArt('s_' + gait + '_idle') : null;
    if (ok(pose)) ctx.drawImage(pose, -73, -128, 146, 146);
    else if (PAINTED.has(img)) {
      if (ok(img)) {
        ctx.drawImage(img, -73, -128, 146, 146);
      }
    }
    else if (img && img.complete) ctx.drawImage(img, -52, -110, 104, 114);
    ctx.restore();
    return bob;
  }
  function drawMealTray(meal, x, y, scale) {
    ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale);
    ctx.fillStyle = '#b08459'; ctx.strokeStyle = '#725139'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(0, 0, 29, 9, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    const split = meal.length > 1;
    drawPlate(split ? -11 : 0, -4, meal[0], 0.61, false);
    if (split) drawPlate(12, -5, meal[1], 0.61, false);
    tableTag(meal[0].table, 24, 5, 13);
    ctx.restore();
  }
  function drawHands(actor, k, bob, staff = false) {
    if (SUZHOU && actor.hands[0]?.kind === 'dish') {
      drawMealTray(actor.hands, actor.x + (actor.face || 1) * 28 * k, actor.y - 61 * k + bob, k); return;
    }
    actor.hands.forEach((h, i) => {
      const x = actor.x + (staff && actor.sinkDrop === undefined ? 32 / k : i ? 42 : -42) * k;
      const y = actor.y - (staff ? 50 : 56 * k) + bob;

      const progress = actor.sinkDrop === undefined || !sinkDiscard(h) ? 0 : Math.min(1, actor.sinkDrop / SINK_DROP_TIME);
      if (!SUZHOU || !progress) { drawHeld(h, x, y, k); return; }
      const drop = progress * progress * (3 - 2 * progress);
      if (drop >= 0.96) return;
      const px = x + (SINK.x + i * 5 - x) * drop;
      const py = y + (SINK.y - 5 - y) * drop - 6 * Math.sin(Math.PI * drop);
      ctx.save(); ctx.translate(px, py); ctx.rotate(-drop * 0.24);
      const shrink = 1 - 0.51 * drop;
      ctx.scale(shrink, shrink);
      drawHeld(h, 0, 0, k);
      ctx.restore();
    });
  }
  function drawWaiter() {
    const w = G.waiter, walking = !!w.busyAct && w.path.length;
    const k = K(w.y);
    const frame = walking && SPR.pWalk && SPR.pWalk[w.back ? 1 : 0][Math.floor((w.walkDistance || 0) / 22) % 4];
    const idle = crewIdle('penpen', !walking && !w.busyAct && !w.wash && !w.brew && w.sinkDrop === undefined);
    const blink = SUZHOU ? idle?.pose : w.blinkT < 0;
    const bob = drawCat(ok(frame) ? frame : penImg(w.back && walking, blink), w.x, w.y, w.face, walking, (SUZHOU ? 1.18 : 1.05) * k, SPR.pPaint ? (SUZHOU ? 'penpen_empty' : 'penpen') : null, w.walkDistance, idle);
    if (w.sinkDrop === undefined) drawHands(w, k, bob);
    if (w.tickets.length) { const im = icon('order'); if (im.complete) ctx.drawImage(im, w.x + 18 * k, w.y - 132 * k, 30, 30); label(`单×${w.tickets.length}`, w.x + 33 * k, w.y - 92 * k, 17, '#8a5a10', '#fbf6ec'); }
  }
  function drawStaff(sf) {
    const moving = sf.task && sf.path.length, zz = !sf.task && resting(sf.id);
    const prank = G.mischief;
    const idle = crewIdle(sf.id, !sf.task && !sf.hands.length && prank?.actor !== sf);
    if (SUZHOU && prank?.actor === sf && gardenSprite(prank.caught ? 's_laoer_caught' : 's_laoer_nibble', sf.x, sf.y, 70)) return;
    drawCat(P('s_' + sf.id) || (sf.back && moving ? custImgBack(sf.id) : custImg(sf.id)), sf.x, sf.y, sf.face, moving, (sf.id === 'mimi' ? 0.8 : 0.92) * K(sf.y) * (SUZHOU ? 1.13 : 1), sf.id, sf.walkDistance, idle);
    if (sf.sinkDrop === undefined) drawHands(sf, K(sf.y), 0, true);
    if (zz) { const t = performance.now() / 1000; ctx.fillStyle = '#4a6384'; ctx.font = `bold 18px ${FONT}`; ctx.textAlign = 'center'; ctx.fillText('z', sf.x + 26, sf.y - 96 - (t * 8 % 10)); ctx.fillText('Z', sf.x + 38, sf.y - 112 - (t * 8 % 10)); } // 主人 11/26：店员脚下不写字
  }
  function drawIdleShuai(x, y) {
    drawCat(P('s_shuai') || SPR.dancer, x, y, 1, false, 0.99, 'shuai', 0, crewIdle('shuai', true));
  }
  const DANCE_SPOT = SUZHOU ? { x: LAYOUT.scene.dance[0], y: LAYOUT.scene.dance[1] } : { x: 760, y: 690 };
  function drawDancer(x0, y0, k = 1) {
    const t = performance.now() / 1000, x = x0 + Math.sin(t * 4) * 14;
    ctx.globalAlpha = k;
    ctx.fillStyle = '#00000018'; ctx.beginPath(); ctx.ellipse(x, y0, 34, 9, 0, 0, 7); ctx.fill();
    ctx.save(); ctx.translate(x, y0 - Math.abs(Math.sin(t * 8)) * 14); ctx.rotate(Math.sin(t * 6) * 0.22); ctx.scale(Math.sin(t * 2) > 0 ? 1 : -1, 1);
    const di = P('s_shuai_dance');
    if (di) {
      ctx.drawImage(di, -73, -128, 146, 146);
    } else if (SPR.dancer.complete) ctx.drawImage(SPR.dancer, -52, -110, 104, 114);
    ctx.restore();
    ctx.fillStyle = '#b04a3c'; ctx.font = `30px ${FONT}`; ctx.textAlign = 'center';
    ctx.fillText('♪', x - 64, y0 - 120 + Math.sin(t * 8) * 8); ctx.fillText('♫', x + 64, y0 - 110 - Math.sin(t * 8) * 8);
    ctx.globalAlpha = 1;
  }
  function drawQueueBadges() {
    const w = G.waiter;
    w.queue.forEach((a, i) => {
      const s = targetSpot(a);
      let x = s.x + 50, y = s.y - 50;
      if (a.kind === 'table') { x = a.table.cx + a.table.rx - 10; y = a.table.cy - a.table.ry - 20; }
      if (a.kind === 'seat' || a.kind === 'give') { const tb = a.kind === 'seat' && a.phase === 2; x = tb ? a.table.cx + a.table.rx - 10 : a.cust.x + 40; y = tb ? a.table.cy - a.table.ry - 20 : a.cust.y - 100; }
      if (a.kind === 'tea' || a.kind === 'snack') { x = TEA.cx + 60; y = TEA.cy - 90; }
      if (a.kind === 'pass') {
        const slot = a.step === 'pickup' && PASS.slots[readyMeals().findIndex((dishes) => dishes.includes(a.order))];
        x = SUZHOU ? slot?.[0] ?? TICKET_POINT.x : 340;
        y = (SUZHOU ? slot?.[1] ?? TICKET_POINT.y : 470) - (i % 2) * 10;
      }
      if (a.kind === 'water') { x = WATER.x + 34; y = WATER.y - 40; }
      ctx.save(); ctx.globalAlpha = 0.85; ctx.fillStyle = '#f2a33a'; // 排着要去的地方：小爪印（不标数字）
      ctx.beginPath(); ctx.ellipse(x, y + 4, 8, 7, 0, 0, 7); ctx.fill();
      for (const [dx, dy] of [[-8, -6], [-3, -10], [3, -10], [8, -6]]) { ctx.beginPath(); ctx.arc(x + dx, y + dy, 3, 0, 7); ctx.fill(); }
      ctx.restore();
    });
  }
  function drawFloats(ox = 0, oy = 0) {
    for (const f of G.floats) {
      const life = f.life || 1.6, y = f.y - oy - Math.min(f.t, 1) * 34, x = f.x - ox;
      ctx.globalAlpha = Math.max(0, Math.min(1, (life - f.t) / 0.5));

      if (SUZHOU && G.mode === 'shop') {
        ctx.save(); ctx.font = '16px "PingFang SC","Microsoft YaHei",sans-serif';
        const w = ctx.measureText(f.text).width + 16, left = Math.max(6, Math.min(W - w - 6, x - w / 2));
        ctx.fillStyle = '#fbf2e1ec'; ctx.strokeStyle = '#bba184'; ctx.lineWidth = 0.8;
        rr(left, y - 12, w, 24, 6); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#674e41'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(f.text, left + w / 2, y + 0.5);
        ctx.restore(); ctx.globalAlpha = 1;
        continue;
      }
      ctx.font = `24px ${FONT}`; const tw = ctx.measureText(f.text).width;
      if (f.ico) {
        const im = typeof f.ico === 'object' ? fishImg(f.ico.fish) : icon(f.ico), iw = typeof f.ico === 'object' ? 56 : 34;
        if (im.complete) ctx.drawImage(im, x - tw / 2 - iw - 4, y - (typeof f.ico === 'object' ? 18 : 17), iw, typeof f.ico === 'object' ? 35 : 34);
      }
      label(f.text, x, y, 24, f.col, '#fff', 5);
      ctx.globalAlpha = 1;
    }
  }

  // 大地图先画到一张离屏画布上，之后每帧只裁一块
  let WORLD_CV = null; const WS = 1.5;
  function worldCanvas() {
    if (WORLD_CV || !WORLD_IMG.complete) return WORLD_CV;
    const c = document.createElement('canvas'); c.width = WORLD_W * WS; c.height = WORLD_H * WS;
    const x = c.getContext('2d'); x.drawImage(WORLD_IMG, 0, 0, c.width, c.height);
    x.setTransform(WS, 0, 0, WS, 0, 0);
    const old = ctx; // 用同一个 label 函数把地名写上去
    for (const l of WORLD_LABELS.filter((l) => !MAP_SPR || !/[→←]|盆盆餐厅/.test(l.t))) { x.font = `${l.size}px ${FONT}`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.lineJoin = 'round'; if (l.stroke) { x.lineWidth = l.lw; x.strokeStyle = l.stroke; x.strokeText(l.t, l.x, l.y); } x.fillStyle = l.fill; x.fillText(l.t, l.x, l.y); }
    WORLD_CV = c; return c;
  }

  function yardTag(x, y, text, active = false) {
    ctx.save();
    ctx.font = (active ? '600 19px ' : '16px ') + '"PingFang SC","Microsoft YaHei",sans-serif';
    const w = ctx.measureText(text).width + 20;
    ctx.fillStyle = active ? '#f9e8be' : '#fff7e4e8';
    ctx.strokeStyle = active ? '#a7804c' : '#927b60b0'; ctx.lineWidth = active ? 1.5 : 0.85;
    rr(x - w / 2, y - 15, w, 27, 7); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#554332'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, x, y - 1);
    ctx.restore();
  }
  function interpolateBed(corners, x, y) {
    const [a, b, c, d] = corners;
    return yardPoint([
      (a[0] + (b[0] - a[0]) * x) * (1 - y) + (d[0] + (c[0] - d[0]) * x) * y,
      (a[1] + (b[1] - a[1]) * x) * (1 - y) + (d[1] + (c[1] - d[1]) * x) * y,
    ]);
  }
  function yardWater() {
    const p = yardPoint(YARD.bobber), D = G.D, fish = D.fishing;
    const tick = (G.ambientTime || G.D.fishing?.t || performance.now() / 1000);
    ctx.save();
    for (let i = 0; i < 3; i++) {
      const a = (tick * 0.21 + i / 3) % 1, x = p.x + 31 * i - 20, y = p.y + 10 + i * 9;
      ctx.globalAlpha = 0.24 * Math.sin(Math.PI * a); ctx.strokeStyle = '#f3fff7'; ctx.lineWidth = 1.3;
      ctx.beginPath(); ctx.ellipse(x, y, 4 + a * 15, 1.8 + 5 * a, -0.08, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.globalAlpha = 1;
    if (fish && fish.stage !== 'ready') {
      const nibble = fish.stage === 'bite', y = p.y + (nibble ? 3 + Math.sin(fish.t * 15) * 3 : Math.sin(fish.t * 3));
      ctx.strokeStyle = '#6a4c35'; ctx.lineWidth = 2.2; ctx.beginPath();
      ctx.moveTo(D.x + 12, D.y - 30); ctx.quadraticCurveTo(p.x - 25, p.y - 85, p.x - 6, p.y - 31); ctx.stroke();
      ctx.strokeStyle = '#fcf7db'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(p.x - 6, p.y - 31); ctx.lineTo(p.x, y); ctx.stroke();
      ctx.fillStyle = '#ad5a49'; ctx.beginPath(); ctx.ellipse(p.x, y, 4, 5, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#f9eddb'; ctx.beginPath(); ctx.ellipse(p.x, y + 1, 4, 2.7, 0, 0, Math.PI); ctx.fill();
      if (nibble) yardTag(p.x, p.y - 22, '咬钩了', true);
    }
    ctx.restore();
  }
  function drawYard() {
    const art = gardenArt('yard_' + CUR_SE, 'jpg');
    if (!ok(art)) return;
    paintGardenMargins(art, H, true); ctx.drawImage(art, 0, 0, W, H);
    const D = G.D, lesson = yardGoal(), target = lesson?.place;
    const nodes = [];
    for (const [i, bed] of YARD.beds.entries()) {
      const site = yardPlace('plot', i);
      if (!plotOpen(i)) continue;
      save.farm[i].cells.forEach((plant, k) => {
        if (!plant) return;
        const ground = interpolateBed(bed, 0.17 + 0.33 * (k % 3), 0.18 + Math.floor(k / 3) * 0.33);
        const crop = CROP_IMG[plant.k + Number(cellRipe(plant))];
        if (ok(crop)) {
          const w = cellRipe(plant) ? 34 : 24;
          ctx.drawImage(crop, ground.x - w / 2, ground.y - w + 5, w, w);
        }
      });
      if (!lesson || target === site) {
        const ripe = save.farm[i].cells.filter(cellRipe).length;
        const growing = save.farm[i].cells.filter(Boolean).length - ripe;
        const text = ripe ? site.name + ' · 熟了 ' + ripe + ' 格' : growing ? site.name + ' · 明早收' : site.name;
        nodes.push(() => yardTag(site.sign.x, site.sign.y - 4, text, target === site));
      }
    }
    yardWater();
    if (staffIds().includes('laoer')) {
      const q = yardPoint(YARD.staff);
      drawCat(staffImg('laoer'), q.x, q.y, -1, false, 0.47, 'laoer', 0, crewIdle('laoer', true));
    }
    if (staffIds().includes('mimi')) {
      const q = yardPoint(YARD.helper);
      drawCat(staffImg('mimi'), q.x, q.y, 1, false, 0.43, 'mimi', 0, crewIdle('mimi', true));
    }
    const walking = D.path.length > 0;
    drawCat(penImg(D.back && walking, false), D.x, D.y, D.face, walking,
      YARD.actorScale, SPR.pPaint ? 'penpen_empty' : null, D.walkDistance, crewIdle('penpen', !walking && !D.fishing));
    for (const h of YARD_PLACES) {
      if (h.id === 'plot' || !spotOpen(h.id)) continue;
      if (lesson && target !== h) continue;
      if (!['door', 'market', 'pond', 'mail', 'coop', 'cottage', 'tea'].includes(h.id)) continue;
      const name = h.id === 'mail' && save.mail ? '邮筒 · 有信' : h.name;
      nodes.push(() => yardTag(h.sign.x, h.sign.y, name, target === h || (h.id === 'mail' && Boolean(save.mail))));
    }
    for (const node of nodes) node();
    if (target && D.task === target) {
      const p = target.spot();
      ctx.strokeStyle = '#c28b50'; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.ellipse(p.x, p.y, 13, 4, 0, 0, Math.PI * 2); ctx.stroke();
    }
    drawFloats();
  }
  function refreshYardTask() {
    const box = $('#yard-task'), goal = yardGoal();
    box.hidden = !goal || Boolean(G.D.fishing);
    if (box.hidden) return;
    const button = $('#yard-task-go');
    if (button.dataset.step === goal.key) return;
    button.dataset.step = goal.key;
    $('#yard-task-title').textContent = goal.title;
    $('#yard-task-text').textContent = goal.msg;
    button.textContent = goal.place ? '去' + goal.place.name : '选菜单';
  }
  $('#yard-task-go').onclick = () => {
    if (G?.mode !== 'day' || G.paused || G.D.fishing) return;
    const goal = yardGoal();
    if (!goal) return;
    if (goal.place) walkToYard(goal.place);
    else openMenuPick();
  };
  $('#b-yard-more').onclick = () => {
    const menu = $('#hud-screen'), open = menu.classList.toggle('yard-more-open');
    $('#b-yard-more').setAttribute('aria-expanded', String(open));
  };
  function renderDay() {
    if (YARD) { drawYard(); return; }
    const D = G.D, cam = D.cam, wc = worldCanvas(), EX = SX / scale, EY = SY / scale; // 全屏：两侧多画一截地图
    ctx.fillStyle = '#d5dfb8'; ctx.fillRect(-EX, -EY, W + 2 * EX, H + 2 * EY);
    if (wc) { const x0 = Math.max(0, cam.x - EX), x1 = Math.min(WORLD_W, cam.x + W + EX); ctx.drawImage(wc, x0 * WS, cam.y * WS, (x1 - x0) * WS, H * WS, x0 - cam.x, 0, x1 - x0, H); }
    ctx.save(); ctx.translate(-cam.x, -cam.y);
    const items = [];
    const sign = (x, y, d) => { ctx.fillStyle = '#8a5a3a'; ctx.fillRect(x - 3, y - 40, 6, 42); ctx.fillStyle = '#d9b98a'; ctx.strokeStyle = '#5a3b28'; ctx.lineWidth = 2; rr(x - 46, y - 62, 92, 30, 6); ctx.fill(); ctx.stroke(); label(`第 ${d} 天开`, x, y - 47, 16, '#5a3b28'); };
    WMAP.farm.plots.forEach(([x, y], i) => {
      const f = save.farm[i], open = plotOpen(i), ripe = plotReady(i);
      items.push({ y: y - 40, d: () => { // 土垄
        ctx.globalAlpha = open ? 1 : 0.45;
        for (let j = 0; j < 9; j++) { const cx = x - 56 + (j % 3) * 56, cy = y - 36 + Math.floor(j / 3) * 32; ctx.fillStyle = '#9a7048'; rr(cx - 25, cy - 12, 50, 26, 10); ctx.fill(); ctx.fillStyle = '#b48a5c'; rr(cx - 23, cy - 12, 46, 9, 6); ctx.fill(); }
        ctx.globalAlpha = 1;
      } });
      if (!open) { items.push({ y: y + 40, d: () => { ctx.strokeStyle = '#7a5a3a'; ctx.lineWidth = 4; for (const yy of [y - 30, y + 26]) { ctx.beginPath(); ctx.moveTo(x - 92, yy); ctx.lineTo(x + 92, yy); ctx.stroke(); } for (let j = 0; j < 5; j++) { ctx.fillStyle = '#8a6440'; rr(x - 92 + j * 46 - 4, y - 40, 8, 76, 3); ctx.fill(); } sign(x, y + 10, openDay('plots', i + 1)); } }); return; }
      if (open) f.cells.forEach((c, j) => { if (!c) return; const img = CROP_IMG[c.k + (cellRipe(c) ? 1 : 0)], cx = x - 56 + (j % 3) * 56, cy = y - 36 + Math.floor(j / 3) * 32; items.push({ y: cy + 12, d: () => { if (img && img.complete) ctx.drawImage(img, cx - 19, cy - 30, 38, 38); } }); });
      const rn = open ? f.cells.filter(cellRipe).length : 0, gn = open ? f.cells.filter((c) => c && !cellRipe(c)).length : 0, en = open ? f.cells.filter((c) => !c).length : 0;
      if (rn) items.push({ y: 9999, d: () => label(`${rn} 格熟了`, x, y - 76, 18, '#fbf3e2', '#5a6b3c') });
      else if (gn) items.push({ y: 9999, d: () => label(en ? `明天熟 · 空 ${en} 格` : '明天熟', x, y - 74, 15, '#fbf3e2', '#6b7a4c') });
      else if (open && en === 9) items.push({ y: 9999, d: () => label('空地', x, y - 74, 15, '#fbf3e2', '#8a6a50') });
    });
    if (spotOpen('mirror')) items.push({ y: 660, d: drawMirror });
    items.push({ y: 1000, d: drawTeaGarden });
    for (const [id, x, y] of [['market', 370, 560], ['pond', 1520, 960], ['coop', 2160, 540], ['mail', 1317, 700], ['tea', 1170, 1010]]) if (!spotOpen(id)) items.push({ y: 9998, d: () => sign(x, y, openDay('map', id)) });
    if (spotOpen('coop') && save.coopDay !== save.day) items.push({ y: 9999, d: () => { const im = ING_IMG.egg; if (im.complete) ctx.drawImage(im, 2190, 470, 40, 40); label('有蛋', 2210, 466, 16, '#fbf3e2', '#7a5a2c'); } });
    if (spotOpen('market')) items.push({ y: WMAP.market.y + 150, d: () => { drawCat(SPR.vendor, WMAP.market.x + 150, WMAP.market.y + 150, 1, false, 0.8); label(`今日特价：${ING[special()].n}`, WMAP.market.x + 150, WMAP.market.y + 186, 17, '#fbf3e2', '#8a3a2c'); } });
    items.push({ y: WMAP.plaza.cy, d: () => SUZHOU ? drawIdleShuai(WMAP.plaza.cx, WMAP.plaza.cy) : drawDancer(WMAP.plaza.cx, WMAP.plaza.cy, 1) });
    if (MAP_SPR) { // GPT 画的房子、摊子、鸡舍、邮筒、路牌、稻草人
      items.push({ y: 640, d: () => { if (spr('m_shop', 1000 + 0.08 * 480, 646, 480)) label('盆盆餐厅', 1000, 486, 20, '#f3e3c0', '#2a201a'); } });
      items.push({ y: 520, d: () => spr('m_market', 370, 526, 330) });
      items.push({ y: 500, d: () => spr('m_coop', 2160, 504, 250) });
      items.push({ y: 660, d: () => spr('m_mailbox', 1317, 664, 0, { h: 104 }) });
      items.push({ y: 796, d: () => { if (spr('m_sign', 1300, 800, 120)) { label('菜地 →', 1300, 734, 15, '#4a3326'); label('← 早市', 1300, 754, 15, '#4a3326'); } } });
      items.push({ y: 480, d: () => spr('m_scarecrow', 1600, 484, 0, { h: 112 }) });
    }
    if (save.mail && spotOpen('mail')) items.push({ y: 9999, d: () => { const b = Math.sin(performance.now() / 200) * 4; ctx.fillStyle = '#fbf6ec'; ctx.strokeStyle = '#2c2420'; ctx.lineWidth = 2; rr(1296, 546 + b, 44, 30, 4); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.moveTo(1296, 546 + b); ctx.lineTo(1318, 562 + b); ctx.lineTo(1340, 546 + b); ctx.stroke(); label('有信！', 1318, 530 + b, 18, '#fbf3e2', '#b04a3c'); } });
    if (staffIds().includes('laoer')) items.push({ y: 720, d: () => drawCat(staffImg('laoer'), 1120, 720, -1, false, 0.8, 'laoer', 0, crewIdle('laoer', true)) });
    if (staffIds().includes('mimi')) items.push({ y: 1040, d: () => { drawCat(staffImg('mimi'), 1290, 1040, -1, false, 0.7, 'mimi', 0, crewIdle('mimi', true)); label('咪咪', 1290, 1056, 15, '#fbf3e2', '#4f7d3a'); } }); // 咪咪在茶园边上
    items.push({ y: D.y, d: () => {
      const walking = D.path.length > 0;
      const frame = walking && SPR.pWalk && SPR.pWalk[D.back ? 1 : 0][Math.floor((D.walkDistance || 0) / 22) % 4];
      const idle = crewIdle('penpen', !walking && !D.fish);
      drawCat(ok(frame) ? frame : penImg(D.back && walking, idle?.pose), D.x, D.y, D.face, walking, 1, SPR.pPaint ? 'penpen' : null, D.walkDistance, idle);
      if (D.fish > 0) { const t = performance.now() / 300; ctx.strokeStyle = '#2c2420'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(D.x + 30, D.y - 70); ctx.quadraticCurveTo(D.x + 90, D.y - 110, D.x + 130, D.y - 10 + Math.sin(t) * 3); ctx.stroke(); ctx.fillStyle = '#d9453a'; ctx.beginPath(); ctx.arc(D.x + 130, D.y - 8 + Math.sin(t) * 3, 6, 0, 7); ctx.fill(); label('钓鱼中…', D.x, D.y - 130, 18, '#fbf3e2', '#3f6680'); }
    } });
    items.sort((a, b) => a.y - b.y).forEach((i) => i.d());
    // 今日菜单需要、但库存不够的食材：在能弄到的地方亮起来
    const nd = needIngs(), pulse = 0.55 + 0.45 * Math.sin(performance.now() / 260);
    const hl = (x, y, rx, ry, ings) => {
      ctx.strokeStyle = `rgba(242,163,58,${pulse})`; ctx.lineWidth = 6; ctx.setLineDash([14, 10]); ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, 7); ctx.stroke(); ctx.setLineDash([]);
      const txt = '菜单要用', w = 40 + ings.length * 34 + 70; ctx.fillStyle = '#fff3c4ee'; rr(x - w / 2, y - ry - 44, w, 38, 12); ctx.fill(); ctx.strokeStyle = '#e3a43a'; ctx.lineWidth = 2; ctx.stroke();
      label(txt, x - w / 2 + 50, y - ry - 25, 17, '#8a5a10');
      ings.forEach((k, i) => { const im = ING_IMG[k]; if (im.complete) ctx.drawImage(im, x - w / 2 + 92 + i * 34, y - ry - 42, 32, 32); });
    };
    WMAP.farm.plots.forEach(([x, y], i) => { if (!plotOpen(i)) return; const ks = [...new Set(save.farm[i].cells.filter(cellRipe).map((c) => c.k))].filter((k) => nd[k]); if (ks.length) hl(x, y, 100, 72, ks); });
    const pondNeed = ['shrimp', 'fish'].filter((k) => nd[k]); if (pondNeed.length && spotOpen('pond')) hl(1470, 990, 110, 60, pondNeed);
    if (nd.egg && spotOpen('coop') && save.coopDay !== save.day) hl(2160, 430, 140, 110, ['egg']);
    const mk = Object.keys(nd).filter((k) => prog().ings.includes(k)); if (mk.length && spotOpen('market')) hl(370, 420, 190, 110, mk.slice(0, 4));
    if (D.task) { const s = D.task.spot(); ctx.strokeStyle = '#f2a33a'; ctx.lineWidth = 4; ctx.beginPath(); ctx.ellipse(s.x, s.y, 26, 9, 0, 0, 7); ctx.stroke(); }
    const PC = { spring: '#f2c6d0', autumn: '#d98c3a', winter: '#ffffff' }[CUR_SE];
    if (PC) for (const q of G.parts) { ctx.fillStyle = PC; ctx.globalAlpha = 0.85; ctx.beginPath(); ctx.ellipse(q.x, q.y, CUR_SE === 'winter' ? 3.5 : 6, CUR_SE === 'winter' ? 3.5 : 3.5, q.t * 2 + q.r, 0, 7); ctx.fill(); ctx.globalAlpha = 1; }
    ctx.restore();
    drawFloats(cam.x, cam.y);
  }
  function render() {
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = '#e9dcc4'; ctx.fillRect(0, 0, cv.width, cv.height);
    ctx.setTransform(scale * dpr, 0, 0, scale * dpr, SX * dpr, SY * dpr);
    if (!G) { ctx.fillStyle = '#f3ead9'; ctx.fillRect(0, 0, W, H); return; }
    if (G.mode === 'day') { renderDay(); return; }
    drawShopScene();
  }
  function sideFill() { // 美术还没有两侧延伸图之前：把场景最边上一截镜像过去，再压一点暗角，让画面铺满不留空条
    const sx = Math.round(SX * dpr), sy = Math.round(SY * dpr), w = cv.width, h = Math.round(H * scale * dpr);
    if (sx < 2) return;
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.save(); ctx.translate(sx, 0); ctx.scale(-1, 1); ctx.drawImage(cv, sx, sy, sx, h, 0, sy, sx, h); ctx.restore();
    ctx.save(); ctx.translate(w - sx, 0); ctx.scale(-1, 1); ctx.drawImage(cv, w - 2 * sx, sy, sx, h, -sx, sy, sx, h); ctx.restore();
    for (const [x0, x1] of [[sx, 0], [w - sx, w]]) { const g = ctx.createLinearGradient(x0, 0, x1, 0); g.addColorStop(0, '#2c242000'); g.addColorStop(1, '#2c242040'); ctx.fillStyle = g; ctx.fillRect(Math.min(x0, x1), 0, sx, cv.height); }
    ctx.restore();
  }
  function drawGardenBench() {
    ctx.save(); ctx.translate(1247, 450);
    ctx.fillStyle = '#6750432a'; ctx.beginPath(); ctx.ellipse(0, 5, 29, 7, -0.16, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#865838'; ctx.lineWidth = 4; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-21,-1); ctx.lineTo(-21,8); ctx.moveTo(21,-9); ctx.lineTo(21,0); ctx.stroke();
    ctx.fillStyle = '#ae7855'; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.moveTo(-26,-8); ctx.lineTo(20,-19); ctx.lineTo(27,-11); ctx.lineTo(-20,1); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = '#d4aa80'; ctx.beginPath(); ctx.moveTo(-22,-7); ctx.lineTo(21,-17); ctx.stroke();
    ctx.restore();
  }


  function drawKitchenPlane(layer) {
    const art = gardenArt('kitchen_g068'), geom = LAYOUT.scene.kitchenArt;
    if (!ok(art)) return;
    const [left, top, w, h] = geom.source;
    ctx.save();
    ctx.scale(W / 1816, LAYOUT.scene.height / 866);
    if (layer) {
      ctx.beginPath();
      for (const polygon of geom[layer]) {
        polygon.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
        ctx.closePath();
      }
      ctx.clip();
    }
    ctx.drawImage(art, left, top, w, h);
    ctx.restore();
  }
  function drawShopScene() {
    if (GREY) drawGreyBase(); else { drawRoom(); if (!SUZHOU && !ART_B()) sideFill(); } // B 背景自带两侧延伸；旧图才镜像

    const behind = (a) => SUZHOU && a.y < 320 && a.x < 474;
    const backActors = [G.waiter, ...G.staff].filter(behind).sort((a, b) => a.y - b.y);
    for (const a of backActors) a === G.waiter ? drawWaiter() : drawStaff(a);
    if (backActors.length) drawKitchenPlane('rear');
    drawKitchen();
    if (SUZHOU) {
      if (save.decor.bench) drawGardenBench();
      if (save.regular?.flower && save.decor.flowers === 'gift') spr('spring_vase', 1174, 295, 33);
    }
    for (const a of backActors) if (a.sinkDrop !== undefined) drawHands(a, K(a.y), 0, a !== G.waiter);
    const items = [];
    G.tables.forEach((t) => {
      if (SUZHOU) { items.push({ y: t.cy + 48 * t.k, d: () => drawGardenTable(t) }); return; }
      items.push({ y: t.cy + 20, d: () => (GREY ? drawGreyTable(t) : drawTable(t)) });
      if (!GREY) t.seats.forEach((sp) => items.push({ y: sp.y - 1, d: () => drawStool(sp.x, sp.y, t.k) }));
    });
    if (SUZHOU) {
      items.push({ y: SINK.y, d: drawSink });
      if (G.staff.some((sf) => sf.id === 'laoer')) items.push({ y: 555, d: () => spr('d_catbed', 441, 564, 63) });
      if (prog().dance && !G.dancer) items.push({ y: DANCE_SPOT.y, d: () => drawIdleShuai(DANCE_SPOT.x, DANCE_SPOT.y) });
      else crewIdle('shuai', false);
    }
    else if (ART_ROOM() && !GREY) {
      items.push({ y: SINK.y, d: drawSink });
      if (!ART_B()) items.push({ y: 706, d: () => { spr('d_ricesack', 402, 712, 60); spr('d_vegbasket', 460, 708, 62); } }); // B 背景里米袋菜筐画在角落了
      items.push({ y: 704, d: () => { spr('d_catbed', 1168, 712, 90); spr('d_cattree', 1236, 706, 60); } });
    }
    G.customers.forEach((c) => {
      if (SUZHOU && seated(c) && (c.state !== 'toSeat' || c.seatEase != null)) return;
      for (let i = 0; i < c.size; i++) {
        const p = memberPos(c, i);
        const d = () => {

          if (!SUZHOU || p.x < 989 || p.x > 1180 || p.y >= doorLine(p.x)) { drawMember(c, i); return; }
          ctx.save(); ctx.beginPath();
          if (CUR_SE === 'winter' && G.doorBlend < 0.62) {
            ctx.rect(1005, 113, 64, 124);
            ctx.rect(1081, 112, 78, 131);
          } else {
            LAYOUT.scene.courtyardOpening.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
            ctx.closePath();
          }
          ctx.clip();
          drawMember(c, i);
          ctx.restore();
        };
        items.push({ y: p.y + 0.5, d });
      }
    });
    if (!behind(G.waiter)) items.push({ y: G.waiter.y, d: drawWaiter });
    G.staff.forEach((sf) => { if (!behind(sf)) items.push({ y: sf.y, d: () => drawStaff(sf) }); });
    items.push({ y: TEA.cy, d: drawTeaCart });
    items.push({ y: RACK.y, d: drawMenuRack });
    if (G.dancer) items.push({ y: DANCE_SPOT.y, d: () => { drawDancer(DANCE_SPOT.x, DANCE_SPOT.y, Math.min(1, (4 - G.dancer.t) * 3, G.dancer.t * 3)); label('帅老头', DANCE_SPOT.x, DANCE_SPOT.y + 16, 18, '#fbf3e2', '#b04a3c'); } });
    items.sort((a, b) => a.y - b.y).forEach((i) => i.d());
    if (GREY || SUZHOU) { /* 苏式前台遮挡已随厨房绘制 */ } else if (ART_B()) drawLayer('room_b_fgd'); else if (ART_ROOM()) { const f = A('room_fg'); if (ok(f)) ctx.drawImage(f, 0, 0, W, H); } else if (ROOM_FG.complete) ctx.drawImage(ROOM_FG, 0, 0, W, H);
    G.tables.forEach((t) => { if (t.sizeAt) label(`${t.size}人`, t.sizeAt.x, t.sizeAt.y, 15, '#fbf3e2', '#7a4d30'); });
    G.customers.forEach(drawPartyUI);
    if (G.mischief) {
      const m = G.mischief, p = m.who === 'laoda' ? CHEF_NAP : m.actor;
      const y = p.y - (m.who === 'laoda' ? 65 : 113);
      label(m.caught ? '！' : m.who === 'laoda' ? '呼噜' : '唔……', p.x, y, m.caught ? 34 : 17, '#fff0cf', '#8c5546');
      if (m.caught && m.who === 'laoer') {
        ctx.fillStyle = '#cda05e'; const t = (G.t - m.caught) / 0.8;
        for (const dx of [14, 23]) { ctx.beginPath(); ctx.arc(p.x + dx + t * dx, p.y - 66 - Math.sin(t * Math.PI) * 12, 2 + dx / 18, 0, Math.PI * 2); ctx.fill(); }
      }
    }
    drawQueueBadges();
    drawFloats();
    if (SUZHOU) drawCleanPlates();
    if (GREY) drawGreyOverlay();
  }
  // ---------- 界面 ----------
  // 游戏内的确认框（网页环境里不能用浏览器自带的 confirm）
  function ask(msg, yes = '确定', only = false) { // only：只有一个按钮的提示
    return new Promise((resolve) => {
      const box = $('#ask');
      box.querySelector('p').innerHTML = msg; box.querySelector('.no').style.display = only ? 'none' : '';
      box.querySelector('.yes').textContent = yes;
      box.classList.add('show');
      const done = (v) => { box.classList.remove('show'); box.querySelector('.yes').onclick = null; box.querySelector('.no').onclick = null; resolve(v); };
      box.querySelector('.yes').onclick = () => { done(true); if (save) did('ask'); };
      box.querySelector('.no').onclick = () => done(false);
    });
  }
  let toastT = null;
  function toast(msg, duration = 1600) { const el = $('#toast'); el.textContent = msg; el.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove('show'), duration); }
  function hud() {
    $('#h-day').textContent = `${save.name} · ${SEASONS[SUZHOU ? CUR_SE : seasonOf(save.day)].n} · 第 ${save.day} 天`;
    for (const b of ['#b-dex', '#b-dex2']) $(b).classList.toggle('newdot', !!save.noteNew);
    $('#b-decor').style.display = SUZHOU && G.mode === 'day' && save.day >= 2 ? '' : 'none';
    $('#b-staff').style.display = staffIds().length ? '' : 'none'; $('#b-invent').style.display = G.mode === 'day' && (ideaNow() || practiceDishes().length) ? '' : 'none'; $('#b-invent').classList.toggle('newdot', !!ideaNow()); $('#b-menu').classList.toggle('newdot', !!save.menuNew && G.mode === 'day'); $('#b-dance').style.display = prog().dance ? '' : 'none';

    if (G.mode === 'day') {
      if (YARD) refreshYardTask();
      $('#h-energy').textContent = `体力 ${G.D.energy}/${ENERGY}`;
      $('#h-save').textContent = `存款 ¥ ${save.coins}`;
      return;
    }
    $('#h-coin').textContent = `¥ ${G.coins}`;
    $('#h-rep').textContent = `口碑 ${G.rep >= 0 ? '+' : ''}${G.rep}`;
    $('#h-time').style.width = `${G.script ? (G.script.length + G.customers.length) / (DAY1.length + 1) * 100 : Math.max(0, 1 - G.t / DAY_LEN) * 100}%`;
    $('#h-q').textContent = `动作 ${G.waiter.queue.length}/${MAXQ}`;
    const db = $('#b-dance');
    db.disabled = G.danceCD > 0;
    db.textContent = G.danceCD > 0 ? `跳舞 ${Math.ceil(G.danceCD)}s` : '跳广场舞';
  }
  function show(id) { if (id !== 'hud-screen') { $('#hud-screen').classList.remove('yard-more-open'); $('#b-yard-more').setAttribute('aria-expanded', 'false'); } document.querySelectorAll('.screen').forEach((s) => s.classList.toggle('show', s.id === id)); }

  function renderSaves() {
    const list = loadSaves();
    const box = $('#save-list');
    box.innerHTML = list.length ? '' : '<p class="empty">还没有存档，先新建一个吧。</p>';
    list.sort((a, b) => b.updated - a.updated).forEach((s) => {
      const stars = (s.history || []).reduce((a, h) => a + h.stars, 0);
      const row = document.createElement('div');
      row.className = 'save';
      row.innerHTML = `<div class="sname">${escapeHTML(s.name)}</div><div class="sinfo">第 ${s.day} 天 · ¥${s.coins} · ★${stars}</div>
        <button class="play">继续</button><button class="look">捏脸 / 换衣服</button><button class="del" aria-label="删除存档">删除</button>`;
      row.querySelector('.play').addEventListener('click', () => startSave(s.id));
      row.querySelector('.look').addEventListener('click', () => openCreator(s, false));
      const av = document.createElement('img'); av.className = 'avatar'; av.alt = '';
      av.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(catSVG({ ...CATS.penpen.look, ...(s.look || {}) }, 'front', { w: 120, h: 132 }));
      row.prepend(av);
      row.querySelector('.del').addEventListener('click', () => {
        ask(`确定删除「${escapeHTML(s.name)}」的存档吗？删除后找不回来。`, '删除').then((ok) => { if (ok) { storeSaves(loadSaves().filter((x) => x.id !== s.id)); renderSaves(); } });
      });
      box.appendChild(row);
    });
  }
  function escapeHTML(s) { return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
  $('#new-save').addEventListener('submit', (e) => {
    e.preventDefault();
    const name = $('#new-name').value.trim() || '盆盆';
    const s = { id: Date.now().toString(36), name: name.slice(0, 12), day: 1, coins: 50, rep: 0, history: [],
      look: { ...CATS.penpen.look }, created: Date.now(), updated: Date.now() };
    storeSaves(loadSaves().concat(s)); $('#new-name').value = ''; renderSaves();
    startSave(s.id); // 直接开始；样子之后照镜子再换
  });
  function startSave(id) {
    save = loadSaves().find((s) => s.id === id); if (!save) return;
    fixSave(save);
    travel.page = 0;
    buildPlayerSprites(save.look || CATS.penpen.look);
    const ck = save.ck && save.ck.day === save.day ? save.ck : null;
    if (ck) Object.assign(save, { stock: ck.stock, seeds: ck.seeds, coins: ck.coins, menu: ck.menu, menuDay: ck.menuDay, farm: ck.farm, energy: ck.energy, energyDay: save.day }); // 营业中退出：回到开店那一刻
    newDay(); show('hud-screen');
    if (ck) { G.staffDay = save.day; openShop(); G.paused = true; save.lastSeen = Date.now(); persist(); ask('上次营业到一半就离开了，这一班从开店那一刻重新开始。', '好的', true).then(() => { G.paused = false; }); sfx.tap(); return; }
    if (!showAway()) showTip('day');
    sfx.tap();
  }

  // ---------- 挂机经营：不玩的时候店员自己卖基础款，累了就去休息 ----------
  const IDLE_CAP_MIN = 8 * 60; // 最多算 8 小时
  const RESTS = [
    (n) => `${n}去后山泡了一会儿温泉，回来毛都蓬松了。`,
    (n) => `${n}在田野里散步，叼回来一朵小野花。`,
    (n) => `${n}趁没人偷吃了一块叉烧……嘴边还有酱汁。`,
    (n) => `${n}在窗台上打了个长长的盹。`,
    (n) => `${n}抓到一只小虫子，得意地拿给大家看。`,
    (n) => `${n}去河边钓鱼，钓到两条小鱼。`,
    (n) => `${n}躺在门口晒太阳，晒成了一张猫饼。`,
    (n) => `${n}把桌子擦得亮亮的，然后在上面睡着了。`,
  ];
  function showAway() {
    const now = Date.now(), last = save.lastSeen || now;
    const mins = Math.min(IDLE_CAP_MIN, Math.floor((now - last) / 60000));
    save.lastSeen = now;
    if (mins < 3) { persist(); return false; }
    const rate = 1 + Math.min(1, totalStars(save) / 30); // 星星越多，挂机卖得越好
    const earned = Math.floor(mins * rate);
    const sold = Math.max(1, Math.round(earned / 6));
    save.coins += earned; persist();
    const staff = ['老大', '老二', '咪咪', '盆盆'];
    const events = shuffle(RESTS).slice(0, Math.min(4, 1 + Math.floor(mins / 45))).map((fn, i) => fn(staff[i % staff.length]));
    const hrs = mins >= 60 ? `${Math.floor(mins / 60)} 小时${mins % 60 ? (mins % 60) + ' 分钟' : ''}` : `${mins} 分钟`;
    $('#away-body').innerHTML = `
      <p class="away-sum">你离开了 ${hrs}。店员们照常营业，卖出了 <b>${sold}</b> 份家常小菜和清茶，收入 <b>¥ ${earned}</b>。</p>
      <ul class="away-list">${events.map((e) => `<li>${escapeHTML(e)}</li>`).join('')}</ul>
      ${mins >= IDLE_CAP_MIN ? '<p class="goal">店员们最多帮忙 8 小时，之后就收摊休息了。</p>' : ''}`;
    show('away'); G.paused = true;
    return true;
  }
  $('#away-ok').addEventListener('click', () => { G.paused = false; show('hud-screen'); showTip('day'); });
  const TIPS = {
    day: `<h3>白天：准备食材</h3><ol>
      <li>点地图上的地方，盆盆会自己走过去：<b>菜地</b>摘辣椒和花生、<b>池塘</b>钓虾、<b>鸡舍</b>捡蛋，每次花 1 点体力。</li>
      <li><b>早市</b>可以花存款买食材，每天有一样是「妈妈特价」半价。</li>
      <li>按住拖动可以看地图别的地方。右上「储藏室」看库存，「图鉴」看客人的口味。</li>
      <li>准备好了点「开店营业」，或者走到店门口。</li></ol>`,
    shop: `<h3>开张啦！怎么玩：</h3><ol>
      <li>点门口排队的客人，再点一张坐得下的空桌（2 人桌 / 4 人桌）：盆盆会去把客人领过来。</li>
      <li>有的客人坐下先要水：点长台上的<b>茶水台</b>（水壶）拿水。多余的水再点一次茶水台就倒掉。</li>
      <li>点完单，盆盆手里会拿着<b>单子</b>，送到<b>出菜台</b>后单子挂在墙上，老大开始做菜。</li>
      <li>客人点的<b>饮品</b>写在单子上：茉莉花茶用玻璃壶泡、普洱用紫砂壶冲、酸梅汤从坛里舀、豆浆从桶里盛，时间各不一样。做好的杯子摆在茶水台前（写着几号桌），点茶水台拿，再点桌子送去。</li>
      <li>客人「点单！」时点桌子。<b>点菜客</b>自己报菜名，只要按要求点一下配料；<b>随缘客</b>只说想吃什么口味，要你挑菜，挑对了口味会记进图鉴。</li>
      <li>每人各点各的。同一种锅一次只做一道，换着锅点上菜更快。做好的菜放在出菜口。</li>
      <li>盆盆一口气最多记 6 件事、一次端 2 样。开店前会先让你安排店员：老二可以帮忙上菜、上茶水或收盘子。</li></ol>`,
  };
  // 每天开头一张小卡：今天新开放了什么（图 + 两三个字）；第 7 天起是猫猫日报
  // 店门口的落地镜：照一照换毛色、换衣服
  const MIRROR_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 120" width="160" height="240"><rect x="36" y="96" width="8" height="16" fill="#8a5a3a"/><path d="M18 116 H62" stroke="#6b4a30" stroke-width="6" stroke-linecap="round"/><ellipse cx="40" cy="52" rx="28" ry="44" fill="#a7744a" stroke="#4a3020" stroke-width="3"/><ellipse cx="40" cy="52" rx="21" ry="36" fill="#dcecf2"/><path d="M28 30 Q34 22 42 22 M27 42 L45 24" stroke="#fff" stroke-width="4" stroke-linecap="round" fill="none" opacity="0.9"/><circle cx="40" cy="10" r="4" fill="#c9503a"/></svg>`;
  const MIRROR_IMG = svgImg(MIRROR_SVG);
  function drawMirror() { if (MIRROR_IMG.complete) ctx.drawImage(MIRROR_IMG, 734, 540, 72, 108); label('镜子', 770, 662, 17, '#fbf3e2', '#5a3b28'); }
  // 茶园：三丛茶树，今天摘过就少点嫩芽
  function drawTeaGarden() {
    const open = spotOpen('tea'), picked = save.teaDay === save.day;
    ctx.save(); ctx.globalAlpha = open ? 1 : 0.5;
    for (const [x, y] of [[1100, 980], [1170, 950], [1240, 985], [1135, 1020], [1210, 1020]]) {
      ctx.fillStyle = '#00000018'; ctx.beginPath(); ctx.ellipse(x, y + 14, 40, 9, 0, 0, 7); ctx.fill();
      ctx.fillStyle = '#4f7d3a'; ctx.beginPath(); ctx.ellipse(x, y, 40, 24, 0, 0, 7); ctx.fill();
      ctx.fillStyle = '#6a9a4a'; ctx.beginPath(); ctx.ellipse(x - 6, y - 8, 30, 15, 0, 0, 7); ctx.fill();
      if (!picked) { ctx.fillStyle = '#a9d36a'; for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.ellipse(x - 24 + i * 9, y - 14 + (i % 2) * 6, 4, 2.4, -0.5, 0, 7); ctx.fill(); } }
    }
    ctx.restore();
    if (open) label(picked ? '茶园 · 明天再摘' : '茶园', 1170, 900, 18, '#fbf3e2', '#4f7d3a');
  }
  function dayCard() {
    if (save.day === 1 && G && G.mode === 'day') { openShop(); G.paused = true; hud(); }
    const add = PROG_ADD[Math.min(save.day, 8)] || {}, it = [];
    const tile = (img, t) => `<div class="nt"><i>新</i><img alt="" src="${img}"><b>${t}</b></div>`;
    for (const k of add.dishes || []) it.push(tile(dishURL(k), DISH[k].n));
    for (const k of add.drinks || []) it.push(tile(cupURL(k), DRINKS[k].n));
    for (const k of add.seeds || []) it.push(tile(ingURL(k), ING[k].n + '种子'));
    for (const k of add.staff || []) it.push(tile(charURL(k), STAFF_DEF[k].name));
    if ((add.map || []).includes('mirror')) it.push(tile(dataURL(MIRROR_SVG), '镜子'));
    const MAPN = { tea: ['茶园', 'tealeaf'], market: ['早市', 'tofu'], plot: ['菜地', 'chili'], pond: ['池塘', 'fish'], coop: ['鸡舍', 'egg'], mail: ['邮筒', null] };
    for (const k of add.map || []) if (MAPN[k]) it.push(tile(MAPN[k][1] ? ingURL(MAPN[k][1]) : iconURL('order'), MAPN[k][0]));
    if (add.plots && !(add.map || []).includes('plot')) it.push(tile(ingURL('chili'), `第 ${add.plots} 块地`));
    if (add.water) it.push(tile(cupURL('water'), '倒水'));
    for (const id of staffIds()) if (skipping(id)) it.push(`<div class="nt farm"><img alt="" src="${charURL(id)}"><b>${STAFF_DEF[id].name} · 休工</b><small>工钱未结清，在院子里晒太阳</small></div>`); // D-001
    for (const f of save.farmLog || []) it.push(`<div class="nt farm"><img alt="" src="${charURL(f.id)}"><b>${STAFF_DEF[f.id].name}干农活</b><small>${f.got.join(' ')}</small></div>`);
    if (save.invite && !save.inviteShown) { save.inviteShown = true; it.push(tile(dataURL(postcardSVG('hotspring')), '樱花之国的邀请')); }
    for (const id of add.tables || []) if (save.day > 1) it.push(tile(`assets/${TABLES.find((t) => t.id === id).size === 4 ? 'table_m' : 'table_s'}.webp`, TABLES.find((t) => t.id === id).size === 4 ? '四人桌' : '两人桌'));
    const tr = save.trend && save.trend.day === save.day ? save.trend : null;
    const note = dailyNote();
    if (teachingFarm()) it.unshift('<div class="nt farm"><b>今天的备料</b><small>' + teachingFarm().msg + '</small></div>');
    if (note) it.unshift('<div class="nt farm"><b>街坊消息</b><small>' + note + '</small></div>');
    const paper = tr ? `<div class="paper"><div class="mast">猫猫日报 <small>第 ${save.day} 天</small></div><div class="hl"><img alt="" src="${iconURL(tr.hot)}"><b>今天流行「${tr.hot}」</b></div><div class="cold"><img alt="" src="${iconURL(tr.cold)}">「${tr.cold}」没人点</div></div>` : '';
    $('#tip-close').innerHTML = save.day === 1 ? '<button class="primary tip-open">开始营业</button>' : '点这里关闭'; // T-02：第一天一个大按钮
    $('#tip-body').innerHTML = `<h3>第 ${save.day} 天${add.title ? ` · ${add.title}` : ''}</h3>${paper}${it.length ? `<div class="newrow">${it.join('')}</div>` : ''}`;
    $('#start-tip').classList.add('show');
  }
  function showTip(k) {
    if (k === 'day') { dayCard(); return; }
    if (k === 'day' && save.day > 1) { if (save.menuDay !== save.day) setTimeout(openMenuPick, 200); return; }
    $('#tip-body').innerHTML = TIPS[k]; $('#tip-close').textContent = '点这里关闭'; $('#start-tip').classList.add('show');
  }
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden' && save) { save.lastSeen = Date.now(); persist(); if (G && !G.over && !G.paused) { G.paused = true; G.sysPaused = true; } } // T-03：只记系统挂起
    if (document.visibilityState === 'visible' && G && G.sysPaused) { G.sysPaused = false; G.paused = false; } // 回来只解除系统挂起，玩家自己按的暂停不动
  });

  // ---------- 捏猫 / 换衣服 ----------
  const totalStars = (s) => (s.history || []).reduce((a, h) => a + h.stars, 0);
  const isUnlocked = (o, s) => !o.unlock || (o.unlock.day && s.day >= o.unlock.day) || (o.unlock.stars && totalStars(s) >= o.unlock.stars);
  const lockText = (o) => (o.unlock.day ? `第 ${o.unlock.day} 天解锁` : `${o.unlock.stars} 颗星解锁`);
  let creatorFor = null, creatorThen = null;
  function openCreator(s, thenStart) {
    creatorFor = s; creatorThen = thenStart;
    const look = { eye2: 'same', tuft: 'none', pupil: 'normal', ...CATS.penpen.look, ...(s.look || {}) };
    const box = $('#creator');
    const swatch = (list, key) => list.map((x) => `<button class="sw ${look[key] === x.id ? 'on' : ''}" data-k="${key}" data-v="${x.id}" style="background:${x.c}" aria-label="${x.n}"><span>${x.n}</span></button>`).join('');
    const pills = (list, key) => list.map((x) => `<button class="pill ${look[key] === x.id ? 'on' : ''}" data-k="${key}" data-v="${x.id}">${x.n}</button>`).join('');
    const yesno = (key, a, b) => `<button class="pill ${look[key] ? 'on' : ''}" data-k="${key}" data-v="1">${a}</button><button class="pill ${!look[key] ? 'on' : ''}" data-k="${key}" data-v="0">${b}</button>`;
    const outfits = OUTFITS.map((o) => {
      const ok = isUnlocked(o, s);
      return `<button class="pill ${look.outfit === o.id ? 'on' : ''} ${ok ? '' : 'locked'}" data-k="outfit" data-v="${o.id}" ${ok ? '' : 'disabled'}>${o.n}${ok ? '' : `<small>${lockText(o)}</small>`}</button>`;
    }).join('');
    box.innerHTML = `
      <div class="cr-left"><img id="cr-img" alt="盆盆的样子"><div class="cr-name">${escapeHTML(s.name)}</div></div>
      <div class="cr-right">
        <h2>捏一只自己的盆盆</h2>
        <div class="row"><label>毛色</label><div>${swatch(FURS, 'fur')}</div></div>
        <div class="row"><label>花纹</label><div>${pills(PATTERNS, 'pattern')}</div></div>
        <div class="row"><label>眼睛</label><div>${swatch(EYES, 'eye')}</div></div>
        <div class="row"><label>异瞳</label><div>${swatch(EYES2, 'eye2')}</div></div>
        <div class="row"><label>头顶毛</label><div>${pills(TUFTS, 'tuft')}</div></div>
        <div class="row"><label>体型</label><div>${pills(BUILDS, 'build')}</div></div>
        <div class="row"><label>瞳孔</label><div>${pills([{ id: 'normal', n: '普通' }, { id: 'big', n: '大大的' }], 'pupil')}</div></div>
        <div class="row"><label>豆豆眉</label><div>${yesno('brows', '有', '没有')}</div></div>
        <div class="row"><label>项圈</label><div>${pills(COLLARS, 'collar')}</div></div>
        <div class="row"><label>衣服</label><div class="wrap">${outfits}</div></div>
        <button class="go" id="cr-done">${thenStart ? '开张营业！' : '换好了'}</button>
      </div>`;
    const refresh = () => {
      $('#cr-img').src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(catSVG(look, 'front', { w: 400, h: 440 }));
      box.querySelectorAll('[data-k]').forEach((b) => {
        const k = b.dataset.k, v = b.dataset.v;
        b.classList.toggle('on', k === 'brows' ? String(look.brows ? 1 : 0) === v : look[k] === v);
      });
    };
    box.querySelectorAll('[data-k]').forEach((b) => b.addEventListener('click', () => {
      const k = b.dataset.k, v = b.dataset.v;
      look[k] = k === 'brows' ? v === '1' : v; sfx.tap(); refresh();
    }));
    $('#cr-done').addEventListener('click', () => {
      if (save) did('look');
      const list = loadSaves(); const t = list.find((x) => x.id === creatorFor.id);
      if (t) { t.look = look; t.updated = Date.now(); storeSaves(list); }
      if (save && save.id === creatorFor.id) { save.look = look; buildPlayerSprites(look); }
      if (creatorThen) startSave(creatorFor.id);
      else if (G && save && save.id === creatorFor.id) { G.paused = false; show('hud-screen'); }
      else { renderSaves(); show('title'); }
    });
    refresh(); show('creator');
  }
  function persist() { save.lastSeen = Date.now(); const list = loadSaves().map((s) => (s.id === save.id ? save : s)); storeSaves(list); }
  const CATSTICK = () => URLS.stick || (URLS.stick = dataURL('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><g transform="rotate(-35 32 32)"><rect x="25" y="3" width="14" height="58" rx="4" fill="#f2a33a" stroke="#2c2420" stroke-width="2.4"/><rect x="25" y="3" width="14" height="9" rx="3" fill="#d9603a" stroke="#2c2420" stroke-width="2"/><rect x="25" y="52" width="14" height="9" rx="3" fill="#d9603a" stroke="#2c2420" stroke-width="2"/><path d="M28 32 q4 -6 8 0 q-4 6 -8 0z" fill="#fbf6ec"/><path d="M35 32 l3 -3 v6z" fill="#fbf6ec"/></g></svg>'));
  function endDay() {
    G.over = true;
    const goals = save.day === 1 ? [60, 100, 140] : save.day <= 3 ? [120, 200, 280] : [200, 360, 520];
    const stars = goals.filter((g) => G.coins >= g).length;
    // 工资（D-001）：1 元 = 1 根猫条。先用当班收入付，不够再动存款；先补欠薪，再发今天的
    const owed = save.owed || {}, ids = staffIds();
    const work = (id) => !resting(id) && !skipping(id); // 休息、欠薪没来的那天不发
    const full = ids.map((id) => ({ id, due: work(id) ? STAFF_DEF[id].wage || 30 : 0, back: owed[id] || 0, why: resting(id) ? '休假' : skipping(id) ? '休工' : '' }));
    // 主人 11/25：不减半，发不出就直接记欠薪
    const need = full.reduce((a, x) => a + x.due + x.back, 0), can = Math.max(0, G.coins) + Math.max(0, save.coins);
    let left = Math.min(need, can); const fromShift = Math.min(left, Math.max(0, G.coins)), fromSave = left - fromShift;
    full.forEach((x) => { x.paidBack = Math.min(x.back, left); left -= x.paidBack; }); // 先补欠薪
    full.forEach((x) => { x.paid = Math.min(x.due, left); left -= x.paid; });
    save.owed = {}; full.forEach((x) => { const o = (x.back - x.paidBack) + (x.due - x.paid); if (o > 0) save.owed[x.id] = o; });
    save.skip = Object.keys(save.owed); save.skipDay = save.day + 1; save.sulk = [];
    const paidW = fromShift + fromSave; save.coins -= paidW; // 下面 save.coins += G.coins，合起来就是净额
    const wages = full, wageAll = need;
    const stick = (n) => `<span class="stk"><img alt="" src="${CATSTICK()}">×${n}</span>`;
    const before = OUTFITS.filter((o) => isUnlocked(o, save)).map((o) => o.id);
    if (G.invitedRegular) save.regular = G.invitedRegular;
    if (G.visit) {
      if (G.visit.gift) save.regular.flower = true;
      else save.regular.due = save.day + 2;
    }
    delete save.ck; // 这一班结算了，存档点作废（只结算一次）
    save.coins += G.coins; save.rep += G.rep; save.history.push({ day: save.day, stars, coins: G.coins }); save.day++; save.updated = Date.now();
    persist();
    $('#res-body').innerHTML = `
      <div class="stars">${'★'.repeat(stars)}<span class="dim">${'★'.repeat(3 - stars)}</span></div>
      <table><tr><td>营业额</td><td>¥ ${G.coins}</td></tr><tr><td>　含小费</td><td>¥ ${G.tips}</td></tr>
      <tr><td>接待</td><td>${G.served} 位</td></tr><tr><td>不满离店</td><td>${G.angry} 位</td></tr>
      <tr><td>口碑</td><td>${G.rep >= 0 ? '+' : ''}${G.rep}</td></tr>
      ${wages.map((x) => { const nm = STAFF_DEF[x.id].name, why = x.why;
        return `<tr class="wage"><td>工钱 · ${nm}${why ? `<small>（${why}）</small>` : ''}${x.back ? `<br><small>含补发欠薪 ${x.back}</small>` : ''}</td><td>${stick(x.due + x.back)}</td></tr>`; }).join('')}
      ${wageAll ? `<tr><td>实付</td><td>${stick(paidW)}</td></tr><tr><td colspan="2"><small>营业额支付 ¥${fromShift}${fromSave ? ` · 存款垫付 ¥${fromSave}` : ''}</small></td></tr>` : ''}
      ${G.visit?.gift ? '<tr><td colspan="2">狸猫阿姨送了候位花。开店前可以在装修里摆上。</td></tr>' : ''}
      <tr><td><b>今日结余</b></td><td><b>¥ ${G.coins - paidW}</b></td></tr></table>
      ${save.skip.length ? `<p class="unlock" style="color:#a8322a">工钱未结清：${save.skip.map((id) => `${STAFF_DEF[id].name} ${save.owed[id]} 根`).join('、')}<br>明日休工一天，下次结算优先补发</p>` : ''}
      <p class="goal">星星目标：¥${goals.join(' / ¥')}</p>
      <button id="res-dex" style="font-size:20px;min-height:48px">看笔记</button>
      ${OUTFITS.filter((o) => isUnlocked(o, save) && !before.includes(o.id)).map((o) => `<p class="unlock">新服装解锁：${o.n}（可在「捏脸 / 换衣服」中穿戴）</p>`).join('')}`;
    renderShop();
    show('result'); sfx.coin();
    $('#res-dex').addEventListener('click', () => openDex('cust'));
  }
  function renderShop() {
    const up = save.upgrades || {};
    const box = $('#res-shop');
    box.innerHTML = `<h3>店铺升级 <small>存款 ¥ ${save.coins}</small></h3>` + UPGRADES.map((u) => {
      const own = up[u.id], open = save.day >= u.day, afford = save.coins >= u.cost;
      const btn = own ? '<span class="owned">已拥有</span>' : !open ? `<span class="lock">第 ${u.day} 天解锁</span>` : `<button class="buy" data-id="${u.id}" ${afford ? '' : 'disabled'}>¥${u.cost} 购买</button>`;
      return `<div class="up ${own ? 'own' : ''}"><div><b>${u.n}</b><p>${u.desc}</p></div>${btn}</div>`;
    }).join('');
    box.querySelectorAll('.buy').forEach((b) => b.addEventListener('click', () => {
      const u = UPGRADES.find((x) => x.id === b.dataset.id);
      if (!u || save.coins < u.cost) return;
      save.coins -= u.cost; save.upgrades = { ...(save.upgrades || {}), [u.id]: true }; persist(); sfx.coin();
      toast(`${u.n}已就位，明天开始可以用`); renderShop();
    }));
  }
  $('#b-next').addEventListener('click', () => { newDay(); show('hud-screen'); showTip('day'); });
  $('#b-menu').addEventListener('click', openMenuPick);
  const DECOR_OPTIONS = {
    linen: ['随四季','桃粉','荷绿','桂褐','雪蓝'],
    flowers: ['随四季','桃枝','荷花','桂枝','腊梅'],
    curtain: ['随四季','淡紫','松绿','赭红','靛蓝'],
  };
  const DECOR_SEASONS = ['', 'spring', 'summer', 'autumn', 'winter'];
  function openDecor() {
    if (!SUZHOU || G?.mode !== 'day' || save.day < 2) return;
    G.paused = true;
    const draft = { ...save.decor, tables: { ...save.decor.tables } };
    const box = $('#decor-body');
    const title = { linen: '大桌桌布', flowers: '插花', curtain: '门帘' };
    const wallItems = travelEntries();
    const large = TABLES.filter((t) => t.size === 4 && prog().tables.includes(t.id));
    box.innerHTML = Object.entries(DECOR_OPTIONS).map(([key, names]) =>
      '<label>' + title[key] + '<select data-field="' + key + '">' +
      DECOR_SEASONS.map((season, i) => '<option value="' + season + '">' + names[i] + '</option>').join('') +
      (key === 'flowers' && save.regular?.flower ? '<option value="gift">狸猫阿姨的候位花</option>' : '') + '</select></label>').join('')
      + large.map((t) => '<label>后排桌 ' + tableNumber(t.id) + '<select data-table="' + t.id + '"><option value="4">四人桌</option><option value="2">两人桌</option></select></label>').join('')
      + [['wallLeft', '左墙'], ['wallRight', '食单上方']].map(([field, label]) => '<label>' + label + '<select data-field="' + field + '">' + wallItems.map((item) => '<option value="' + item.id + '">' + escapeHTML(item.title) + '</option>').join('') + '</select></label>').join('')
      + '<label class="bench"><input type="checkbox" data-field="bench"> 门边候位凳</label>';
    for (const el of box.querySelectorAll('[data-field]')) {
      const field = el.dataset.field;
      if (field === 'bench') el.checked = draft.bench; else el.value = draft[field];
      el.onchange = () => { draft[field] = field === 'bench' ? el.checked : el.value; preview(); };
    }
    for (const el of box.querySelectorAll('[data-table]')) {
      el.value = draft.tables[el.dataset.table] || 4;
      el.onchange = () => { draft.tables[el.dataset.table] = Number(el.value); preview(); };
    }
    function preview() {
      const season = draft.linen || CUR_SE;
      const flowers = draft.flowers === 'gift' ? 'spring' : draft.flowers || CUR_SE;
      $('#decor-preview').innerHTML = '<figure><img alt="" src="assets/' + season + '_runner.webp"><figcaption>桌布</figcaption></figure>'
        + '<figure><img alt="" src="assets/' + flowers + '_vase.webp"><figcaption>' + (draft.flowers === 'gift' ? '门外候位花' : '桌花') + '</figcaption></figure>'
        + '<figure><img alt="" src="assets/suzhou/table_' + (large.some((t) => draft.tables[t.id] !== 2) ? 'large' : 'small')
        + '.png"><figcaption>桌型</figcaption></figure>';
      const seats = TABLES.filter((t) => prog().tables.includes(t.id)).reduce((n, t) => n + (draft.tables[t.id] || t.size), 0);
      $('#decor-info').textContent = seats + ' 个座位。' + (draft.bench ? '候位凳让门口客人等得更久。' : '')
        + (draft.flowers === 'gift' ? '门外候位的客人看花时耐心多一点。' : '');
    }
    preview();
    const close = () => { G.paused = false; show('hud-screen'); };
    $('#decor-close').onclick = close;
    $('#decor-apply').onclick = () => {
      if (large.length && large.every((t) => draft.tables[t.id] === 2)) { toast('保留一张四人桌，才能招待四位同行的客人'); return; }
      save.decor = draft;
      if (save.prep?.day === save.day && draft.tables[save.prep.table] === 2) save.prep.table = null;
      G.tables = tableSetup();
      G.plates.clean = startingPlates(G.tables);
      persist(); close(); toast('装修已保存，开门后就能看到');
    };
    show('decorate'); fitPanels();
  }
  $('#b-decor').addEventListener('click', openDecor);
  $('#b-open').addEventListener('click', () => { if (G && G.mode === 'day') ask(`开门营业吗？${G.D.energy ? `（体力还剩 ${G.D.energy}）` : ''}`, '开店').then((ok) => ok && openShop()); });
  $('#b-pantry').addEventListener('click', openPantry);
  $('#b-dex').addEventListener('click', () => openDex('cust'));
  $('#p-dex').addEventListener('click', () => openDex('cust'));
  $('#b-dex2').addEventListener('click', () => openDex('cust'));
  for (const id of ['market-ok', 'pantry-ok']) $('#' + id).addEventListener('click', () => { G.paused = false; show('hud-screen'); });
  $('#dex-ok').addEventListener('click', () => { if (save) did('dexok'); if (G && !G.over) { G.paused = false; show('hud-screen'); } else show('result'); });
  document.querySelectorAll('#dex .tabs button').forEach((b) => b.addEventListener('click', () => openDex(b.dataset.tab)));

  // 旅行收件、纸相簿和墙上装饰共用同一份收藏。
  const TRAVEL_PAINTINGS = {
    bamboo: { title: '竹石卷轴', from: '苏式首店', msg: '墨竹随窗外的春光一起挂着。', src: 'assets/suzhou/wall_bamboo_g067.png' },
    canal: { title: '春水石桥', from: '江南水乡', msg: '呆猫沿河走过一座石桥，把春天画下来寄回了店里。', src: 'assets/suzhou/wall_canal.png' },
  };
  const travel = { from: 'hud-screen', page: 0, placing: '', ids: [] };
  const zhNumber = (n) => n < 10 ? '〇一二三四五六七八九'[n] : (n < 20 ? '' : zhNumber(Math.floor(n / 10))) + '十' + (n % 10 ? zhNumber(n % 10) : '');
  function albumDate(info) {
    if (save.album.clock === 'real') {
      if (!info?.at) return '收件日期未记';
      const d = new Date(info.at);
      return Number.isFinite(d.getTime()) ? d.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' }) : '收件日期未记';
    }
    if (!info?.day) return '收件日期未记';
    const year = Math.ceil(info.day / 28);
    const day = (info.day - 1) % 7 + 1;
    return (year === 1 ? '元' : year < 100 ? zhNumber(year) : year) + '年 · ' + SEASONS[seasonOf(info.day)].n + zhNumber(day) + '日';
  }
  function travelEntries() {
    const notes = save.album.notes;
    const cards = (save.cards || []).flatMap((id) => {
      const p = POSTCARDS.find((entry) => entry.id === id);
      return p ? [{ id: 'card:' + id, title: p.n, from: p.from, msg: p.msg, src: pcURL(id), date: notes['card:' + id], kind: '明信片' }] : [];
    });
    const photos = (save.snaps || []).flatMap(({ id, v, day }) => {
      const p = POSTCARDS.find((entry) => entry.id === id), key = 'snap:' + id + ':' + v, src = pcURL(id, v);
      return p && src ? [{ id: key, title: '路上的一张照片', from: p.from, msg: notes[key]?.msg || '呆猫在旅途中拍下的风景。', src, date: notes[key] || { day }, kind: '相片' }] : [];
    });
    const paintings = Object.entries(TRAVEL_PAINTINGS).map(([id, p]) => ({ ...p, id, kind: '挂画', date: notes[id] }));
    if ((save.cards || []).includes('huizhou')) paintings.push({ id: 'paint:huizhou', title: '白墙黛瓦', from: POSTCARDS.find((p) => p.id === 'huizhou').from,
      msg: '桥那头的青瓦在雨里特别好看。想把这一抹墨色也寄给你们。', src: 'assets/suzhou/wall_huizhou.jpg', date: notes['card:huizhou'], kind: '挂画' });
    if (save.day >= 6 && save.history.some((h) => h.day >= 5)) paintings.push({ id: 'family', title: '首店全家福', from: '苏式首店',
      msg: '灶边忙完，大家难得都在。', src: 'assets/suzhou/family_photo.jpg', kind: '相片' });
    return [...cards, ...photos, ...paintings];
  }
  function noteReceived(id, msg) {
    const notes = save.album.notes;
    notes[id] ||= { day: save.day, at: new Date().toISOString(), ...(msg ? { msg } : {}) };
    if (SUZHOU && !save.album.taught) {
      save.album.taught = true;
      toast('照片收进了旅行相簿。开店前可把照片或挂画布置到墙上。', 4500);
    }
  }
  function openTravelAlbum(from = 'dex', focus) {
    if (!G || !save) return;
    G.paused = true; travel.from = from; travel.placing = '';
    travel.ids = travelEntries().map((item) => item.id);
    if (focus) travel.page = Math.max(0, travel.ids.indexOf(focus));
    travel.page = Math.min(travel.page, travel.ids.length - 1);
    show('travel-album'); renderTravelAlbum();
  }
  function renderTravelAlbum() {
    const entries = travelEntries(), entry = entries.find((item) => item.id === travel.ids[travel.page]);
    if (!entry) return;
    const format = $('#album-clock');
    format.value = save.album.clock;
    $('#album-title').textContent = entry.title;
    $('#album-sender').textContent = entry.id === 'family' || entry.id === 'bamboo' ? entry.from : '呆猫 · 寄自' + entry.from;
    $('#album-date').textContent = albumDate(entry.date);
    $('#album-message').textContent = entry.msg;
    $('#album-photo').src = entry.src; $('#album-photo').alt = entry.title;
    $('#album-photo').classList.toggle('narrow', entry.id === 'bamboo');
    $('#album-prev').disabled = travel.page <= 0;
    $('#album-next').disabled = travel.page >= travel.ids.length - 1;
    $('#album-page-number').textContent = (travel.page + 1) + ' / ' + travel.ids.length;
    $('#album-wall-controls').hidden = !SUZHOU || G.mode !== 'day';
    $('#album-hang-left').disabled = save.decor.wallLeft === entry.id;
    $('#album-hang-right').disabled = save.decor.wallRight === entry.id;
    const pick = $('#album-add-photo');
    pick.value = ''; pick.innerHTML = '<option value="">选照片贴到留白处</option>';
    for (const item of entries.filter((item) => item.kind !== '挂画')) pick.add(new Option(item.title + ' · ' + item.from, item.id));
    pick.value = travel.placing;
    const place = $('#album-paper');
    place.classList.toggle('placing', !!travel.placing);
    $('#album-paper-hint').hidden = !travel.placing;
    const decorations = save.album.placements[entry.id] || [];
    $('#album-stickers').replaceChildren();
    decorations.forEach((d, i) => {
      const item = entries.find((item) => item.id === d.id);
      if (!item) return;
      const button = document.createElement('button'), im = document.createElement('img');
      button.type = 'button'; button.className = 'album-sticker';
      button.style.left = d.x + '%'; button.style.top = d.y + '%';
      button.style.rotate = d.angle + 'deg';
      button.setAttribute('aria-label', '取下' + item.title);
      im.src = item.src; im.alt = item.title; im.draggable = false; button.append(im);
      button.onclick = (ev) => { ev.stopPropagation(); decorations.splice(i, 1); persist(); renderTravelAlbum(); };
      $('#album-stickers').append(button);
    });
  }
  function hangAlbumEntry(side) {
    if (G?.mode !== 'day') return;
    save.decor[side] = travel.ids[travel.page];
    persist(); renderTravelAlbum(); toast(side === 'wallLeft' ? '已经挂在左墙' : '已经挂在食单上方');
  }
  $('#album-prev').onclick = () => { if (travel.page > 0) { travel.page--; travel.placing = ''; renderTravelAlbum(); } };
  $('#album-next').onclick = () => { if (travel.page + 1 < travel.ids.length) { travel.page++; travel.placing = ''; renderTravelAlbum(); } };
  $('#album-close').onclick = () => {
    if (travel.from === 'dex') openDex('cust');
    else { G.paused = false; show('hud-screen'); }
  };
  $('#album-clock').onchange = (e) => { save.album.clock = e.target.value; persist(); renderTravelAlbum(); };
  $('#album-hang-left').onclick = () => hangAlbumEntry('wallLeft');
  $('#album-hang-right').onclick = () => hangAlbumEntry('wallRight');
  $('#album-add-photo').onchange = (e) => { travel.placing = e.target.value; renderTravelAlbum(); };
  $('#album-paper').onclick = (ev) => {
    if (!travel.placing) return;
    const r = ev.currentTarget.getBoundingClientRect();
    const items = (save.album.placements[travel.ids[travel.page]] ||= []);
    if (items.length >= 3) { toast('这页已经贴了三张照片'); return; }
    items.push({ id: travel.placing, x: Math.max(14, Math.min(86, (ev.clientX - r.left) * 100 / r.width)),
      y: Math.max(29, Math.min(71, (ev.clientY - r.top) * 100 / r.height)), angle: [-5, 4, -2][items.length] });
    travel.placing = ''; persist(); renderTravelAlbum();
  };

  // ---------- 图鉴 ----------
  function openDex(tab) {
    if (SUZHOU && tab === 'card') { openTravelAlbum(); return; }
    if (G) G.paused = true;
    document.querySelectorAll('#dex .tabs button').forEach((b) => b.classList.toggle('on', b.dataset.tab === tab));
    const box = $('#dex-list');
    if (tab === 'cust') {
      box.innerHTML = CT.map((t) => {
        const d = (save.dex || {})[t.id];
        if (!d || !d.met) return `<div class="dx locked"><div class="ph">？</div><b>？？？</b><small>还没来过</small></div>`;
        const known = (all, k, cls) => all.map((x) => (k.includes(x) ? tagChip(x, cls) : '<span class="chip unk">？</span>')).join('');
        const body = t.kind === 'omakase'
          ? `<div>喜欢：${known(t.likes, d.likes, 'want')}</div><div>不太喜欢：${known(t.dislikes, d.dislikes || [], 'meh')}</div><div>不吃：${known(t.hates, d.hates, 'hate')}</div>`
          : `<div>常说：${d.reqs.length ? d.reqs.map((x) => `<span class="chip">${x}</span>`).join('') : '<span class="none">还没提过要求</span>'}</div>`;
        return `<div class="dx ${save.noteNew === t.id ? 'fresh' : ''}" data-id="${t.id}"><img alt="" src="${custURL(t.id)}"><b>${t.n}</b>${save.noteNew === t.id ? '<i class="newb">新</i>' : ''}<span class="kind ${t.kind}">${t.kind === 'omakase' ? '随缘客' : '点菜客'}</span><small>${t.blurb}　来过 ${d.met} 次</small>${body}<div class="tiph">小费：${TIP_TXT[t.tip] || ''}</div></div>`;
      }).join('');
    } else if (tab === 'fish') {
      box.innerHTML = FISH.map((f) => { const r = (save.fishDex || {})[f.id];
        return r ? `<div class="dx"><img class="fish" alt="" src="${URLS['f' + f.id] || (URLS['f' + f.id] = dataURL(fishSVG(f.id)))}"><b>${f.n}</b><small>${f.se.map((x) => SEASONS[x].n).join(' ')} · 钓到 ${r.n} 条 · 最大 ${r.max}cm</small><small>${f.blurb}</small></div>`
          : `<div class="dx locked"><div class="ph">🎣</div><b>？？？</b><small>${f.se.length === 4 ? '四季都有' : f.se.map((x) => SEASONS[x].n).join('、') + '天才有'}</small></div>`; }).join('');
    } else if (tab === 'card') {
      box.innerHTML = POSTCARDS.map((p) => (save.cards || []).includes(p.id)
        ? `<div class="dx"><img class="pcimg" alt="" src="${URLS['p' + p.id] || (URLS['p' + p.id] = pcURL(p.id))}"><b>${p.n}</b><small>${p.from} · ${SEASONS[p.se].n}</small></div>`
        : `<div class="dx locked"><div class="ph">✉</div><b>？？？</b><small>呆猫还没寄来</small></div>`).join('')
        + (save.snaps || []).map((x) => { const p = POSTCARDS.find((q) => q.id === x.id); return p ? `<div class="dx"><img class="pcimg" alt="" src="${pcURL(x.id, x.v)}"><b>随手拍</b><small>${p.from} · 第 ${x.day} 天</small></div>` : ''; }).join('');
    } else {
      const how = (k) => (INVENT[k] ? '老大还在琢磨' : POSTCARDS.some((p) => (p.recipes || []).includes(k)) ? '等呆猫寄来' : `第 ${openDay('dishes', k)} 天学会`);
      box.innerHTML = Object.keys(DISH).map((k) => {
        if (!knownDish(k)) return `<div class="dx locked"><div class="ph">？</div><b>？？？</b><small>${how(k)}</small></div>`;
        const d = DISH[k], n = (save.dishDex || {})[k] || 0;
        return `<div class="dx ${n ? '' : 'dim'}"><img class="dish" alt="" src="${dishURL(k)}"><b>${d.n}</b><small>${WARES[d.ware].n} · ${ING[d.ing].n} · ¥${d.price}${onMenu(k) ? '' : '（未解锁）'}　上过 ${n} 份</small><div>${d.tags.map((x) => tagChip(x)).join('')}</div></div>`;
      }).join('');
    }
    show('dex');
    const fr = box.querySelector('.dx.fresh'); if (fr) { fr.scrollIntoView({ block: 'center' }); save.noteNew = null; did('note'); }
  }
  $('#b-home').addEventListener('click', () => { G = null; renderSaves(); show('title'); });
  $('#b-pause').addEventListener('click', () => { if (!G) return; G.paused = true; $('#p-resume').textContent = G.mode === 'day' ? '继续' : '继续营业'; show('pause'); });

  $('#p-fullscreen').addEventListener('click', async () => {
    if (document.fullscreenElement) { await document.exitFullscreen(); return; }
    if (document.fullscreenEnabled && document.documentElement.requestFullscreen) {
      try { await document.documentElement.requestFullscreen(); return; } catch {}
    }
    toast('在 Safari 的分享菜单选「添加到主屏幕」，再从主屏幕打开。', 6500);
  });
  $('#p-resume').addEventListener('click', () => { G.paused = false; show('hud-screen'); });
  $('#p-look').style.display = 'none'; // 换样子改成在地图上照镜子
  $('#p-quit').addEventListener('click', () => { ask('回到存档列表？今天的进度不会保存。', '回去').then((ok) => { if (ok) { G = null; renderSaves(); show('title'); } }); });
  $('#b-dance').addEventListener('click', () => {
    if (!G || G.mode !== 'shop' || G.danceCD > 0 || G.paused) return;
    G.dancer = { t: 4 }; G.danceCD = 45; sfx.dance();
    G.customers.forEach((c) => { if (c.state !== 'leaving') { addHeart(c); const a = anchor(c); float(a.x, a.y - 20, '+♥', '#ef6f7a'); } });
  });
  $('#start-tip').addEventListener('click', () => { $('#start-tip').classList.remove('show'); if (G && G.mode === 'shop') G.paused = false; if (G && G.mode === 'day') { if (save.day === 1) openShop(); else if (save.menuDay !== save.day && !YARD && !teachingFarm()) openMenuPick(); } });

  // ---------- 老大试菜 ----------
  const INV = { target: null, ing: null, ware: null, running: false };
  const PRACTICE = ['xiajiao', 'mian', 'mapo'];
  const practiceDishes = () => SUZHOU && save.day >= 2 && save.signature?.day !== save.day
    ? PRACTICE.filter((k) => menuNow().includes(k) && canCook(k)) : [];
  function openInvent() {
    if (G?.mode !== 'day') return;
    const idea = ideaNow(), practice = practiceDishes();
    if (!idea && !practice.length) return;
    G.paused = true;
    const target = $('#inv-target');
    const choices = [...(idea ? [idea] : []), ...practice];
    target.hidden = choices.length < 2;
    target.innerHTML = choices.map((k) => '<option value="' + k + '">' + (k === idea ? '跟着老大的灵感' : '做招牌 · ' + DISH[k].n) + '</option>').join('');
    const render = (k) => {
      Object.assign(INV, { target: k, ing: null, ware: null, running: false });
      const iv = INVENT[k], isIdea = k === idea;
      $('#inv-ok').textContent = '先不试了';
      $('#inv-go').textContent = '开始准备（用掉 1 份）';
      $('#inv-idea').innerHTML = '<img alt="" src="' + charURL('laoda') + '"><div><b>'
        + (isIdea ? '老大的灵感' : '今天做道招牌菜')
        + '</b><p>' + (isIdea ? '「' + iv.idea + '」' : DISH[k].n + '用' + ING[DISH[k].ing].n + '和' + WARES[DISH[k].ware].n + '。学会这道，再交给老大出餐。') + '</p></div>';
      $('#inv-res').innerHTML = '';
      const ings = Object.keys(ING).filter((x) => stockOf(x) > 0);
      $('#inv-ings').innerHTML = ings.length ? ings.map((x) => '<button data-k="' + x + '"><img alt="" src="' + ingURL(x) + '"><b>'
        + ING[x].n + '</b><small>×' + stockOf(x) + '</small></button>').join('') : '<p class="none">先去早市买一点食材</p>';
      $('#inv-wares').innerHTML = Object.keys(WARES).filter(hasWare).map((x) =>
        '<button data-k="' + x + '"><b>' + WARES[x].n + '</b></button>').join('');
      const sync = () => {
        document.querySelectorAll('#inv-ings button').forEach((b) => { b.disabled = !stockOf(b.dataset.k); b.classList.toggle('on', b.dataset.k === INV.ing); });
        document.querySelectorAll('#inv-wares button').forEach((b) => b.classList.toggle('on', b.dataset.k === INV.ware));
        $('#inv-go').disabled = !(INV.ing && stockOf(INV.ing) && INV.ware);
      };
      $('#inv-ings').onclick = (e) => { const b = e.target.closest('button'); if (b && !INV.running) { INV.ing = b.dataset.k; sfx.tap(); sync(); } };
      $('#inv-wares').onclick = (e) => { const b = e.target.closest('button'); if (b && !INV.running) { INV.ware = b.dataset.k; sfx.tap(); sync(); } };
      sync();
    };
    target.onchange = () => { if (!INV.running) render(target.value); };
    target.disabled = false;
    render(choices[0]); show('invent'); fitPanels();
    $('#inv-go').onclick = () => {
      const k = INV.target;
      if (INV.running || !INV.ing || !INV.ware || !stockOf(INV.ing)) return;
      const recipe = k === idea;
      const expected = recipe ? INVENT[k] : DISH[k];
      const ok = INV.ing === expected.ing && INV.ware === expected.ware;
      save.stock[INV.ing]--; did('inventdo'); persist();
      if (!ok) {
        render(k);
        $('#inv-res').innerHTML = '<div class="no">老大尝了一口：「食材或炊具还差点意思。」</div>';
        sfx.bad(); return;
      }
      INV.running = true; target.disabled = true;
      $('#inv-go').disabled = true;
      const finish = () => {
        if (recipe) learnRecipe(k);
        else save.signature = { day: save.day, dish: k };
        sfx.coin(); did('invent'); persist();
        $('#inv-res').innerHTML = '<div class="ok"><img alt="" src="' + dishURL(k) + '"><b>'
          + (recipe ? '学会了' : '今日招牌') + ' · ' + DISH[k].n + '</b><small>'
          + (recipe ? '加进菜单就能供应' : '今天第一次正确端上这道菜时，多加半颗心') + '</small></div>';
        $('#inv-ok').textContent = '好了';
      };
      if (!SUZHOU) { finish(); return; }
      startCookingTrial(k, finish);
    };
  }
  function startCookingTrial(k, finish) {
    const box = $('#inv-res');
    const dumpling = k === 'xiajiao', ware = DISH[k].ware;
    const steps = dumpling ? ['放虾馅','从左捏第一褶','捏中间一褶','合上右边'] :
      ware === 'steamer' ? ['摆好食材','盖上蒸笼','揭盖出锅'] :
      ware === 'wok' ? ['把食材入锅','翻炒拌匀','盛入碟子'] :
      ware === 'clay' ? ['放好米和配料','盖上焖一会儿','开盖出锅'] : ['把食材入锅','拨散面条','盛入碗中'];
    let step = 0;
    const paint = () => {
      box.innerHTML = '<div class="trial"><div class="trial-food ' + (dumpling ? 'dumpling' : '') + '" data-step="' + step + '"><img alt="" src="'
        + ingURL(DISH[k].ing) + '"><span></span><i></i><i></i><i></i></div><div class="trial-actions">'
        + '<p aria-live="polite">' + steps[step] + ' · ' + (step + 1) + '/' + steps.length + '</p>'
        + steps.map((name, i) => '<button type="button" data-step="' + i + '" ' + (i === step ? '' : 'disabled')
          + ' aria-label="' + name + '">' + (i < step ? '✓' : name) + '</button>').join('') + '</div></div>';
      box.querySelector('button:not([disabled])').onclick = () => {
        sfx.tap(); step++;
        if (step === steps.length) finish(); else paint();
      };
      fitPanels();
    };
    paint();
  }
  $('#inv-ok').addEventListener('click', () => { if (G) G.paused = false; show('hud-screen'); });
  $('#b-invent').addEventListener('click', openInvent);

  // ---------- 安排店员 ----------
  let staffThen = null; // 主人 11/26：店员职责只能在开店前安排；按「开店营业」时先弹出来
  function openStaff(thenOpen) {
    if (!G || G.mode !== 'day') return;
    if (thenOpen !== undefined) staffThen = thenOpen === true;
    G.paused = true; $('#staff-ok').textContent = staffThen ? '就这样，开店营业！' : '安排好了';
    const box = $('#staff-list');
    box.innerHTML = staffIds().map((id) => { const js = jobsOf(id);
      return `<div class="srow"><img alt="" src="${charURL(id)}"><b>${STAFF_DEF[id].name}<small class="wg"><img alt="" src="${CATSTICK()}">每天 ${STAFF_DEF[id].wage} 根</small></b><div class="jobs">${JOBS.map((j) => { const n = js.indexOf(j.id); return `<button class="pill ${n >= 0 ? 'on' : ''}" data-s="${id}" data-j="${j.id}">${n >= 0 && j.id !== 'rest' ? `<i>${n + 1}</i>` : ''}${j.n}</button>`; }).join('')}</div></div>`; }).join('')
      + '<p class="goal">每只猫最多两件事，数字是先后顺序。开店后就不能换了。</p>'
      + (has('mimi') ? '' : '<p class="goal">第 4 天以后可以在「店铺升级」里雇佣咪咪，多一个帮手。</p>');
    box.querySelectorAll('[data-j]').forEach((b) => b.addEventListener('click', () => {
      const id = b.dataset.s, j = b.dataset.j; let js = jobsOf(id).filter((x) => x !== 'rest');
      if (j === 'rest') js = ['rest'];
      else if (js.includes(j)) js = js.filter((x) => x !== j);
      else js = js.length >= 2 ? [js[0], j] : js.concat(j);
      if (!js.length) js = ['rest'];
      save.jobs = { ...(save.jobs || {}), [id]: js }; persist(); sfx.tap();
      const sf = G.staff.find((x) => x.id === id);
      if (sf && sf.task && sf.task.kind === 'home') sf.task = null;
      openStaff();
    }));
    show('staff');
  }
  $('#b-staff').addEventListener('click', () => openStaff(false));
  $('#staff-ok').addEventListener('click', () => { G.paused = false; show('hud-screen'); did('staffok'); if (staffThen) { staffThen = false; openShop(); } });
  $('#rack-ok').addEventListener('click', () => { G.paused = false; show('hud-screen'); });

  // ---------- 引导：一次只指一处（脉动圆圈 + 猫爪 + 几个字），做过两次就不再指；发呆 8 秒会再提示 ----------
  const LIM = 2;
  const DBG = { all: false, speed: 1 }; // 测试用：总是提示、加速
  const need = (k, lim = LIM) => DBG.all || (save.did[k] || 0) < lim || (G && G.idle > 8);
  const shown = (sel) => { const e = document.querySelector(sel); return e && e.offsetParent !== null ? e : null; };
  function shopHint() {
    const w = G.waiter, k = G.kitchen;
    const queued = (f) => w.queue.some(f) || (w.busyAct && f(w.busyAct));
    const qT = (t) => queued((a) => (a.kind === 'table' || a.kind === 'seat') && a.table === t);
    const T = (t, text, type) => ({ type, x: t.cx, y: t.cy - 16 * t.k, r: 62 * t.k, text });
    const P = (x, y, r, text, type) => ({ type, x, y, r, text });
    if (G.teaOpen) { const b = shown('#teamenu .topt.want') || shown('#teamenu .topt:not([disabled])'); return b && need('drink') ? { type: 'drink', sel: b, text: '选这个' } : null; }
    const cand = [];
    for (const c of G.customers) if (c.state === 'bill' && !qT(c.table)) cand.push(T(c.table, '收钱', 'pay'));
    for (const h of w.hands) if ((h.kind === 'dish' || h.kind === 'drink') && h.cust.table && !qT(h.cust.table)) cand.push(T(h.cust.table, '端过去', 'serve'));
    if (w.hands.some((h) => h.kind === 'water')) { const c = G.customers.find((c) => c.state === 'thirsty' && !qT(c.table)); if (c) cand.push(T(c.table, '送水', 'water')); }
    if (w.hands.some((h) => h.kind === 'plate') && !queued((a) => a.kind === 'sink')) cand.push(P(SINK.x, SINK.y - 30, 50, '放碗', 'sink'));
    if ((G.plates.clean <= 2 || SUZHOU && (G.closing || !save.did.wash)) && G.plates.dirty > 0 && !w.hands.length && !w.wash && !queued((a) => a.kind === 'sink')) cand.unshift(P(SINK.x, SINK.y - 30, 50, '洗碗', 'wash'));
    if (w.tickets.length && !queued((a) => a.kind === 'pass')) cand.push(P(TICKET_POINT.x, TICKET_POINT.y, 50, '送单子', 'pass'));
    const readyIndex = SUZHOU ? readyMeals().findIndex((meal) => meal.every((dish) => !dish.claim && !queued((a) => a.order === dish))) : k.pass.findIndex((dish) => !dish.claim);
    if (readyIndex >= 0 && w.hands.length < (SUZHOU ? 1 : 2) && !queued((a) => a.kind === 'pass')) {
      const [x, y] = SUZHOU ? PASS.slots[readyIndex] : [PASS_POINT.x, PASS_POINT.y];
      cand.push(P(x, y - 4, SUZHOU ? 34 : 60, SUZHOU ? '' : '取菜', 'pick'));
    }
    if (G.customers.some((c) => c.state === 'thirsty') && !w.hands.some((h) => h.kind === 'water') && !queued((a) => a.kind === 'water')) cand.push(P(TEA_POINT.x, TEA_POINT.y, 46, '倒水', 'water'));
    const brewer = G.staff.some((sf) => jobsOf(sf.id).includes('drink') && !resting(sf.id));
    if (drinkWants().length && !brewer && !w.brew && w.hands.length < 2 && !queued((a) => a.kind === 'pour')) cand.push(P(TEA_POINT.x, TEA_POINT.y, 46, drinkWants().every((o) => o.drink === 'water') ? '倒水' : '泡饮品', 'drink'));
    for (const c of G.customers) if (c.state === 'ordering' && !qT(c.table)) cand.push(T(c.table, c.members.some((m) => m.dessert && m.st === 'none') ? '加单' : '点单', 'order'));
    const q = (G.selected && G.selected.state === 'queue' ? G.selected : null) || G.customers.filter((c) => c.state === 'queue').sort((a, b) => a.id - b.id)[0];
    if (q) {
      const free = G.tables.filter((t) => !t.cust && !t.dirty && !t.reserved && t.size >= q.size).sort((a, b) => a.size - b.size)[0];
      if (free) { if (G.selected === q) cand.unshift(T(free, '坐这桌', 'seat')); else cand.push(P(q.x, q.y - 50, 50, '点客人', 'seat')); }
    }
    for (const t of G.tables) if (t.dirty && !t.cust && !qT(t) && !t.busClaim) { cand.push(T(t, '收盘子', 'bus')); break; }
    if (save.noteNew && shown('#b-dex2')) cand.push({ type: 'note', sel: shown('#b-dex2'), text: '看笔记' });
    return cand.find((h) => need(h.type)) || null;
  }
  function panelHint() {
    const c = G.orderOpen; if (!c) return null;
    for (const [m, i] of c.members.map((m, i) => [m, i]).filter(([m]) => m.st === 'none')) {
      if (m.kind === 'menu' && m.req && (m.req.t === 'no') === !!m.tops[m.req.top] && need('req', 3)) return { type: 'req', sel: shown(`#order .tp.must[data-i="${i}"]`), text: m.req.t === 'no' ? `去掉${m.req.top}` : `加${m.req.top}` };
      if (m.kind === 'omakase' && !m.dish && need('oma')) {
        const best = mains(menuNow()).find((k) => canCook(k) && DISH[k].tags.includes(m.want) && !DISH[k].tags.some((x) => c.type.hates.includes(x)));
        return best ? { type: 'oma', sel: shown(`#order .dcard[data-i="${i}"][data-k="${best}"]`), text: `想吃${m.want}` } : null;
      }
    }
    return need('go') ? { type: 'go', sel: shown('#order .go:not([disabled])'), text: '下单' } : null;
  }
  function dayHint() {
    if (YARD) return null;
    const D = G.D; if (D.path.length || D.fish > 0) return null;
    const W_ = (x, y, r, text, type) => ({ type, x: x - D.cam.x, y: y - D.cam.y, r, text, wx: x, wy: y });
    const cand = [], plots = WMAP.farm.plots;
    const lesson = teachingFarm();
    if (lesson) {
      const [x, y] = lesson.site === 'plot' ? plots[0] : [lesson.x, lesson.y];
      return W_(x, y, 90, lesson.msg, farmPhase());
    }
    if (save.noteNew && need('note')) return { type: 'note', sel: shown('#b-dex'), text: '看笔记' };
    if (save.menuNew && save.menuDay === save.day && need('remenu', 2)) return { type: 'remenu', sel: shown('#b-menu'), text: '加新菜' };
    if (ideaNow() && need('invent', 2)) return { type: 'invent', sel: shown('#b-invent'), text: '老大想试菜' };
    if (spotOpen('tea') && save.teaDay !== save.day && prog().drinks.some((k) => DRINKS[k].leaf) && stockOf('tealeaf') < 4 && D.energy > 0) cand.push(W_(1170, 960, 90, '摘茶', 'tea'));
    for (let i = 0; i < prog().plots; i++) {
      const [x, y] = plots[i];
      if (plotReady(i) && D.energy > 0) cand.push(W_(x, y, 90, '收菜', 'harvest'));
      else if (plotEmpty(i) && prog().seeds.some((k) => save.seeds[k] > 0)) cand.push(W_(x, y, 90, '种下', 'plant'));
      else if (plotEmpty(i) && spotOpen('market') && seedBuyable()) cand.push(W_(370, 430, 110, '买种子', 'seed'));
    }
    const low = menuNow().map((k) => DISH[k].ing).find((ing) => prog().ings.includes(ing) && stockOf(ing) < 6 && save.coins >= priceOf(ing) * 5 && mktLeft(ing) >= 5);
    if (low && spotOpen('market')) cand.unshift(W_(370, 430, 110, `买${ING[low].n}`, 'buy'));
    if (spotOpen('pond') && D.energy > 0) cand.push(W_(1520, 990, 90, '钓鱼', 'fish'));
    if (spotOpen('coop') && save.coopDay !== save.day && D.energy > 0) cand.push(W_(2160, 430, 100, '捡蛋', 'egg'));
    if (spotOpen('mail') && save.mail) cand.push(W_(1317, 620, 60, '有信', 'mail'));
    if (spotOpen('mirror') && !(save.did.mirror > 0)) cand.push(W_(770, 600, 56, '照镜子', 'mirror'));
    const h = cand.find((h) => need(h.type, ['fish', 'egg', 'mirror'].includes(h.type) ? 1 : h.type === 'buy' ? 4 : h.type === 'plant' ? 12 : LIM));
    if (h) return h;
    const door = WMAP.shop.door; return need('open') || G.idle > 8 ? W_(door.x, door.y - 60, 80, '开店', 'open') : null;
  }
  function currentHint() {
    if (!G || !save) return null;
    if (SUZHOU && G.mode === 'shop' && !DBG.all && G.idle < 8) return null;
    if (shown('#ask.show')) return need('ask') ? { type: 'ask', sel: shown('#ask .yes'), text: '好' } : null;
    if (shown('#fish-lesson.show')) return { type: 'reel', sel: shown('#fish-reel'), text: '收线' };
    if (shown('#plot.show')) {
      const f = save.farm[PLOT.i];
      if (f.cells.some(cellRipe) && G.D.energy > 0 && need('harvest')) return { type: 'harvest', sel: shown('#plot-harvest'), text: '收菜' };
      if (PLOT.seed && f.cells.some((c) => !c) && need('plant', 12)) return { type: 'plant', sel: shown('#plot-grid .pc.empty'), text: '点空地种下' };
      if (!PLOT.seed && prog().seeds.some((k) => save.seeds[k] > 0) && need('plant', 12)) return { type: 'plant', sel: shown('#plot-seeds .sd:not([disabled])'), text: '选种子' };
      return need('plotok', 3) ? { type: 'plotok', sel: shown('#plot-ok'), text: '好了' } : null;
    }
    if (shown('#choose.show')) return need('plant') ? { type: 'choose', sel: shown('#choose .opts button'), text: '选一个' } : null;
    if (shown('#start-tip.show')) return null;
    if (shown('#result.show')) return need('next') ? { type: 'next', sel: shown('#b-next'), text: '下一天' } : null;
    if (shown('#menu.show')) return need('menu') ? { type: 'menu', sel: shown('#menu-ok'), text: '就这些' } : null;

    if (shown('#market.show')) {
      if (farmPhase() === 'seed') return { type: 'seed', sel: shown('#market .buy1[data-seed]'), text: '领种子' };
      if (farmPhase() === 'buy') return null;
      const low = menuNow().map((k) => DISH[k].ing).find((ing) => prog().ings.includes(ing) && stockOf(ing) < 6 && save.coins >= priceOf(ing) * 5 && mktLeft(ing) >= 5);
      if (low && need('buy', 4)) return { type: 'buy', sel: shown(`#market .buy1:not([data-seed])[data-k="${low}"][data-n="5"]`), text: `买${ING[low].n}` };
      const sk = !prog().seeds.some((k) => save.seeds[k] > 0) && seedBuyable(), sn = sk && mktLeft(sk + '_seed') >= 9 && save.coins >= SEED_PRICE[sk] * 9 ? 9 : 3;
      if (sk && save.farm.some((f, i) => plotEmpty(i)) && need('seed')) return { type: 'seed', sel: shown(`#market .buy1[data-seed][data-k="${sk}"][data-n="${sn}"]`), text: '买种子' };
      return need('mok') ? { type: 'mok', sel: shown('#market-ok'), text: '买好了' } : null;
    }
    if (shown('#dex.show')) return need('dexok') ? { type: 'dexok', sel: shown('#dex-ok'), text: '看完了' } : null;
    if (shown('#creator.show')) return need('look', 1) ? { type: 'look', sel: shown('#cr-done'), text: '换好了' } : null;
    if (shown('#invent.show')) {
      const k = ideaNow(); if (!k) return { type: 'inventok', sel: shown('#inv-ok'), text: '好了' }; if (!need('inventdo', 2)) return null; const iv = INVENT[k];
      if (INV.ing !== iv.ing) return { type: 'inventdo', sel: shown(`#inv-ings button[data-k="${iv.ing}"]`), text: '用这个' };
      if (INV.ware !== iv.ware) return { type: 'inventdo', sel: shown(`#inv-wares button[data-k="${iv.ware}"]`), text: '用这个' };
      return { type: 'inventdo', sel: shown('#inv-go'), text: '试一试' };
    }
    if (shown('#mail.show')) return { type: 'mailok', sel: shown('#mail-ok'), text: '收下' };
    if (shown('#staff.show')) return { type: 'staffok', sel: shown('#staff-ok'), text: staffThen ? '开店' : '好了' };
    if (!shown('#hud-screen.show') || G.paused || G.over) return null;
    if (G.mode === 'shop') return G.orderOpen ? panelHint() : shopHint();
    return dayHint();
  }
  let HINT = null;
  let lastDayHint = '';
  function updateCoach() {
    const el = $('#coach'), h = currentHint(); HINT = h;
    if (h && h.wx != null && G.mode === 'day') { // 地图上的新提示：不在画面里就把镜头挪过去
      const key = h.type + h.wx + ',' + h.wy;
      if (key !== lastDayHint) { lastDayHint = key; if (h.x < 80 || h.x > W - 80 || h.y < 110 || h.y > H - 60) { const D = G.D; D.manual = true; D.camGoal = { x: Math.max(0, Math.min(WORLD_W - W, h.wx - W / 2)), y: Math.max(0, Math.min(WORLD_H - H, h.wy - H / 2)) }; } }
    }
    if (!h || (h.sel === null)) { el.classList.remove('show'); return; }
    let x, y, w, hh, box = false;
    if (h.sel) { const r = h.sel.getBoundingClientRect(), u = ui.getBoundingClientRect(); x = (r.left - u.left + r.width / 2) / uiScale; y = (r.top - u.top + r.height / 2) / uiScale; w = r.width / uiScale + 18; hh = r.height / uiScale + 18; box = true; }
    else { const k = scale / uiScale, q = toUI(Math.max(70, Math.min(W - 70, h.x)), Math.max(110, Math.min(H - 60, h.y))); x = q.x; y = q.y; w = hh = h.r * 2 * k; }
    const [ring, paw, cap] = el.children;
    Object.assign(ring.style, { left: `${x - w / 2}px`, top: `${y - hh / 2}px`, width: `${w}px`, height: `${hh}px` });
    Object.assign(paw.style, { left: `${x + Math.min(w, 120) * 0.22}px`, top: `${y + Math.min(hh, 120) * 0.12}px` });
    cap.textContent = h.text;
    cap.hidden = !h.text;
    const above = y - hh / 2 - 48 > 64 && !(h.sel && h.sel.closest && h.sel.closest('#order, #ask')); // 提示框里的按钮：字放在按钮下面，不压提示文字
    const below = y + hh / 2 + 10, capTop = above || below > UH - 50 ? Math.max(8, y - hh / 2 - 48) : below; // 屏幕下面放不下就放上面
    Object.assign(cap.style, { left: `${Math.max(60, Math.min(UW - 60, x))}px`, top: `${capTop}px`, transform: 'translateX(-50%)' });
    const paper = SUZHOU && G.mode === 'shop';
    el.classList.toggle('paper-hint', paper);
    el.classList.toggle('has-text', !!h.text);
    if (paper && h.text) cap.style.top = String(Math.max(56, y - Math.min(44, hh * 0.36) - 29)) + 'px';
    el.classList.toggle('box', box); el.classList.add('show');
  }
  $('#b-next').addEventListener('click', () => did('next'));
  $('#market-ok').addEventListener('click', () => { did('mok'); if (farmPhase() === 'buy') setFarmPhase('done'); });
  $('#menu-ok').addEventListener('click', () => { if (save) { did('menu'); save.menuNew = false; } });

  // ---------- 主循环 ----------
  let last = performance.now();
  function loop(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    requestAnimationFrame(loop);
    try { for (let i = 0; i < DBG.speed; i++) update(dt); render(); updateCoach(); } catch (e) { console.error(e); }
  }
  $('#logo-cat').src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(catSVG('penpen', 'front', { w: 400, h: 440 }));
  resize(); renderSaves(); show('title');
  requestAnimationFrame(loop);
  // ---------- 灰盒（T-07）：色块画场景，叠上占地 / 站位 / 点按区 / 碰撞格 / 安全区 / 走位 / 不可达 ----------
  function polyPath(P) { ctx.beginPath(); P.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.closePath(); }
  function gbLabel(t, x, y, col = '#2c2420', size = 14) { ctx.save(); ctx.font = `${size}px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineWidth = 3; ctx.strokeStyle = '#ffffffcc'; ctx.strokeText(t, x, y); ctx.fillStyle = col; ctx.fillText(t, x, y); ctx.restore(); }
  const GB_COL = { stove: '#e8a25a', pass: '#d9c08a', sink: '#8fc1dd', rail: '#c0504a', menurack: '#9a6a44', tea: '#8fc48a', door: '#a58ac8', queue: '#c8b4e6', idle: '#f0d070', staff: '#f3c0a0', chef: '#e8a25a' };
  const GB_NAME = { 'stove.wok': '灶·炒锅', 'stove.pot': '灶·面锅', 'stove.steamer': '灶·蒸笼', 'stove.clay': '灶·砂锅', pass: '出菜台', sink: '洗碗池', rail: '挂单绳', menurack: '菜单架', tea: '茶水台', teacart: '茶车', door: '门', 'idle.penpen': '盆盆待命', 'staff.laoer': '老二', 'staff.mimi': '咪咪', chef: '老大' };
  function drawGreyBase() {
    ctx.fillStyle = '#ece7dd'; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = '#00000010'; ctx.lineWidth = 1; for (let x = 0; x <= W; x += TS) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); } for (let y = 0; y <= H; y += TS) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    if (LAYOUT) for (const it of LAYOUT.items) if (it.kind === 'wall') { ctx.fillStyle = '#b8b0a2cc'; polyPath(it.footprint); ctx.fill(); }
    ctx.fillStyle = '#cfe3ee'; ctx.fillRect(WIN.x, WIN.y, WIN.w, WIN.h); gbLabel('窗', WIN.x + WIN.w / 2, WIN.y + WIN.h / 2, '#4a7fb5', 20);
    if (!LAYOUT) return;
    for (const it of LAYOUT.items) {
      if (it.kind === 'table' || it.kind === 'wall' || it.kind === 'queue' || it.kind === 'staff' || it.kind === 'idle' || it.kind === 'chef') continue;
      const col = GB_COL[it.kind] || '#ccc';
      if (it.needs && !it.needs.some((k) => has(k))) continue; // 茶车：和碰撞用同一个判定
      if (it.footprint) { ctx.fillStyle = col + 'cc'; polyPath(it.footprint); ctx.fill(); }
      if (it.line) { ctx.strokeStyle = col; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(...it.line[0]); ctx.lineTo(...it.line[1]); ctx.stroke(); }
      if (it.hit && !it.footprint && !it.line) { ctx.fillStyle = col + '99'; ctx.fillRect(it.hit.x, it.hit.y, it.hit.w, it.hit.h); }
      if (it.slots) it.slots.forEach(([x, y], i) => { ctx.fillStyle = '#fff'; ctx.strokeStyle = '#8a6a40'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(x, y, 14, 7, 0, 0, 7); ctx.fill(); ctx.stroke(); gbLabel('盘' + (i + 1), x - 26, y, '#8a6a40', 11); });
      const a = it.anchor; if (a) gbLabel(GB_NAME[it.id] || it.id, a[0], a[1] - (it.kind === 'stove' ? 58 : 0), '#2c2420', 15);
    }
    QSPOTS.forEach((q, i) => { ctx.fillStyle = GB_COL.queue + 'aa'; ctx.beginPath(); ctx.ellipse(q.x, q.y, 34, 14, 0, 0, 7); ctx.fill(); gbLabel('候位' + (i + 1), q.x, q.y + 22, '#6a4a9a', 13); });
  }
  function drawGreyTable(t) {
    ctx.fillStyle = t.cust ? '#d8b88acc' : '#c9a77caa'; ctx.strokeStyle = '#7a5434'; ctx.lineWidth = 2;
    if (t.foot) polyPath(t.foot); else { ctx.beginPath(); ctx.ellipse(t.cx, t.cy + 12, t.rx, t.ry, 0, 0, 7); }
    ctx.fill(); ctx.stroke();
    t.seats.forEach((sp, i) => { ctx.fillStyle = sp.front ? '#fff8' : '#fffc'; ctx.strokeStyle = '#7a5434'; ctx.beginPath(); ctx.arc(sp.x, sp.y + 10, 9, 0, 7); ctx.fill(); ctx.stroke(); });
    gbLabel(`桌${t.id} · ${t.size}人`, t.cx, t.cy + 6, '#4a3020', 18);
    t.topY = [t.cy - 6, t.cy + 16];
  }
  function gbPlates() { // 盘子总数：干净 + 脏 + 桌上待收 + 出菜台 + 手上 + 客人面前
    const pl = G.plates, k = G.kitchen, hand = (h) => (h.kind === 'dish' ? 1 : h.kind === 'plate' ? h.n || 1 : 0);
    return pl.clean + pl.dirty + G.tables.reduce((a, t) => a + (+t.dirty || 0), 0) + k.pass.length + G.waiter.hands.reduce((a, h) => a + hand(h), 0) + G.staff.reduce((a, sf) => a + sf.hands.reduce((b, h) => b + hand(h), 0), 0)
      + G.customers.reduce((a, c) => a + (c.table ? c.members.filter((m) => m.st === 'served').length + (c.extraPlates || 0) : 0), 0);
  }
  const GB = { plateLog: [], plates: null, trail: [], show: { foot: true, stand: true, hit: false, grid: false, safe: true, trail: false, unreach: true, ids: false } };
  function drawGreyOverlay() {
    const S = GB.show;
    if (S.grid && SHOP_GRID) { ctx.fillStyle = '#d0453a22'; ctx.strokeStyle = '#d0453a55'; for (let r = 0; r < SHOP_GRID.rows; r++) for (let c = 0; c < SHOP_GRID.cols; c++) if (SHOP_GRID.b[r][c]) { ctx.fillRect(c * TS, r * TS, TS, TS); ctx.beginPath(); ctx.moveTo(c * TS, r * TS); ctx.lineTo(c * TS + TS, r * TS + TS); ctx.stroke(); } }
    if (LAYOUT) for (const it of LAYOUT.items) {
      if (it.kind === 'table' && !G.tables.some((t) => 'table.' + t.id === it.id)) continue;
      if (it.needs && !it.needs.some((k) => has(k))) continue;
      if (S.foot && it.footprint) { ctx.strokeStyle = '#d0453a'; ctx.lineWidth = 1.5; ctx.setLineDash([]); polyPath(it.footprint); ctx.stroke(); }
      if (S.hit && it.hit) { ctx.strokeStyle = '#3f86c4'; ctx.lineWidth = 1.5; ctx.setLineDash([6, 4]); ctx.strokeRect(it.hit.x, it.hit.y, it.hit.w, it.hit.h); ctx.setLineDash([]); }
      if (S.hit && it.card) { ctx.strokeStyle = '#8a5ab5'; ctx.lineWidth = 1.5; ctx.setLineDash([3, 3]); ctx.strokeRect(it.card.x, it.card.y, it.card.w, it.card.h); ctx.setLineDash([]); } // 候位人数牌
      if (S.stand && it.stand) it.stand.forEach(([x, y]) => { ctx.fillStyle = '#2e8b57'; ctx.beginPath(); ctx.arc(x, y, 6, 0, 7); ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke(); });
      if (S.ids) { const a = it.anchor || (it.stand && it.stand[0]); if (a) gbLabel(it.id, a[0], a[1] + 16, '#3f5a8a', 11); }
    }
    if (S.trail && GB.trail.length) { const cols = { '盆盆': '#c0504a', laoer: '#3f86c4', mimi: '#2e8b57' }; for (const [who, x, y] of GB.trail) { ctx.fillStyle = (cols[who] || '#666') + '55'; ctx.fillRect(x - 2, y - 2, 4, 4); } }
    if (S.unreach && G.unreach) for (const u of G.unreach) { ctx.strokeStyle = '#d0453a'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(u.x - 10, u.y - 10); ctx.lineTo(u.x + 10, u.y + 10); ctx.moveTo(u.x + 10, u.y - 10); ctx.lineTo(u.x - 10, u.y + 10); ctx.stroke(); }
    if (S.safe) { // 顶部 44 CSS px 的界面安全区（按当前屏幕缩放换算）
      const top = 44 / scale; // 顶部 44 CSS px 换成游戏 px ctx.fillStyle = '#3f86c41f'; ctx.fillRect(0, 0, W, top); ctx.strokeStyle = '#3f86c4'; ctx.setLineDash([8, 6]); ctx.beginPath(); ctx.moveTo(0, top); ctx.lineTo(W, top); ctx.stroke(); ctx.setLineDash([]);
      gbLabel(`顶部界面安全区 44 CSS px = ${top.toFixed(0)} 游戏 px`, W / 2, Math.min(top - 10, 60), '#3f5a8a', 14);
    }
  }
  function gbPreset(name) { // 两桌 / 五桌：换桌子、重算碰撞格。只在 gbStart 开新班时调用（G-005：运行中换桌会丢桌上脏盘、盘数预算对不上）
    if (!G || !LAYOUT) return;
    const ids = LAYOUT.presets[name] || LAYOUT.presets.two;
    if (G.customers.some((c) => c.table)) { toast('有客人坐着，等这一班结束再换'); return; }
    G.tables = TABLES.filter((t) => ids.includes('table.' + t.id)).map((t) => ({ ...t, cust: null, dirty: false, reserved: null, busClaim: null }));
    buildShopGrid(G.tables); GB.preset = name; gbInfo();
  }
  function gbStart(name) { // 开一班：灰盒专用存档，跳过地图直接营业
    const day = name === 'five' ? 7 : 1;
    const s = { id: 'gb' + Date.now().toString(36), name: name === 'five' ? '灰盒五桌' : '灰盒两桌', day, coins: 500, rep: 0, history: [], look: { ...CATS.penpen.look }, created: Date.now(), updated: Date.now(), did: {} };
    if (day > 1) { s.recipes = ['shuizhu', 'dandan']; s.menu = ['mapo', 'mian', 'gongbao', 'shuizhu', 'dandan']; s.menuDay = day; s.stock = Object.fromEntries(Object.keys(ING).map((k) => [k, 30])); }
    storeSaves([s]); startSave(s.id); GB.trail = []; GB.plateLog = []; GB.plates = null;
    $('#start-tip').classList.remove('show'); show('hud-screen');
    if (G.mode === 'day') openShop();
    G.paused = false; gbPreset(name);
  }
  function gbInfo() {
    const el = document.getElementById('gb-info'); if (!el) return;
    const vw = window.innerWidth, vh = window.innerHeight;
    el.textContent = `屏幕 ${vw}×${vh} CSS · 画面缩放 ${scale.toFixed(2)} · 16 CSS px 字 = ${(16 / scale).toFixed(0)} 游戏 px · 44 CSS px 按钮 = ${(44 / scale).toFixed(0)} 游戏 px · 桌子：${GB.preset === 'five' ? '五桌' : '两桌'} · 走不到 ${(G && G.unreach || []).length} 次`;
  }
  if (GREY) {
    const p = document.createElement('div'); p.id = 'gb-panel';
    p.style.cssText = 'position:fixed;left:6px;bottom:6px;z-index:99;background:#fffffff0;border:2px solid #3f86c4;border-radius:10px;padding:6px 8px;font:13px sans-serif;max-width:min(96vw,760px);display:flex;flex-wrap:wrap;gap:6px;align-items:center';
    const btn = (t, f) => { const b = document.createElement('button'); b.textContent = t; b.style.cssText = 'font-size:13px;padding:4px 8px;min-height:32px'; b.onclick = f; p.appendChild(b); return b; };
    const tog = (k, t) => { const l = document.createElement('label'); l.style.cssText = 'display:flex;gap:2px;align-items:center'; const c = document.createElement('input'); c.type = 'checkbox'; c.checked = GB.show[k]; c.onchange = () => { GB.show[k] = c.checked; }; l.append(c, t); p.appendChild(l); };
    const tt = document.createElement('b'); tt.textContent = '灰盒'; p.appendChild(tt);
    btn('两桌开一班', () => gbStart('two')); btn('五桌开一班', () => gbStart('five'));
    tog('foot', '占地'); tog('stand', '站位'); tog('hit', '点按区'); tog('grid', '碰撞格'); tog('safe', '安全区'); tog('trail', '走位'); tog('unreach', '走不到'); tog('ids', 'ID');
    const info = document.createElement('div'); info.id = 'gb-info'; info.style.cssText = 'flex-basis:100%;color:#3f5a8a'; p.appendChild(info);
    const fold = document.createElement('button'); fold.textContent = '灰盒 ▸'; fold.style.cssText = 'position:fixed;left:6px;bottom:6px;z-index:99;font:13px sans-serif;padding:4px 10px;min-height:32px;border:2px solid #3f86c4;border-radius:10px;background:#fff';
    const setOpen = (o) => { p.style.display = o ? 'flex' : 'none'; fold.style.display = o ? 'none' : 'block'; };
    fold.onclick = () => setOpen(true); btn('收起 ◂', () => setOpen(false));
    document.body.append(p, fold); setOpen(window.innerHeight >= 500); setInterval(gbInfo, 1000);
  }
  window.__penpen = { release: SUZHOU_RELEASE, hasWare, get season() { return CUR_SE; }, QSPOTS, DOOR, openMenuPick, catchFish, openMail, openMarket, openOrder, endDay, spawnCustomer, get ui() { return { scale, uiScale, UW, UH, SX, SY }; }, newDay: () => { newDay(); show('hud-screen'); showTip('day'); }, openDex, get G() { return G; }, get save() { return save; }, TABLES, PASS, SINK, WATER, DISH, findPath, YARD_PLACES, YARD_GRID, get LAYOUT() { return LAYOUT; }, GB, gbStart, gbPreset: gbStart, get SHOP_GRID() { return SHOP_GRID; }, enqueue, gbPlates, WMAP, openShop, dayTap, openRack, openOrder, startOrdering, CT, DBG, get hint() { const h = HINT; return h && { type: h.type, text: h.text, sel: h.sel ? true : false, el: h.sel || null, x: h.x, y: h.y, wx: h.wx, wy: h.wy }; } };
})();
