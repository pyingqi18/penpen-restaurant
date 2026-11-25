  // ---------- 数据：炊具、食材、菜单 ----------
  // 同一种炊具一次只能做一道菜（排队），不同炊具可以同时开火
  const WARES = {
    wok: { n: '炒锅', x: 548 }, pot: { n: '面锅', x: 618 },
    steamer: { n: '蒸笼', x: 688, up: 'steamer' }, clay: { n: '砂锅', x: 758, up: 'clay' },
  };
  const ING = {
    tofu: { n: '豆腐', src: '早市', price: 4 }, beef: { n: '牛肉', src: '早市', price: 6 }, pork: { n: '叉烧肉', src: '早市', price: 6 },
    chili: { n: '辣椒', src: '菜地', price: 5 }, peanut: { n: '花生', src: '菜地', price: 4 },
    shrimp: { n: '鲜虾', src: '池塘', price: 7 }, egg: { n: '鸡蛋', src: '鸡舍', price: 4 },
  };
  // tops：最多两样可选配料 [名字, 默认放不放]
  const DISH = {
    mapo: { n: '麻婆豆腐', tags: ['麻', '辣', '肉'], price: 30, cook: 6, ware: 'wok', ing: 'tofu', tops: [['花椒', 1], ['葱花', 1]] },
    gongbao: { n: '宫保鸡丁', tags: ['辣', '甜', '肉', '花生'], price: 34, cook: 7, ware: 'wok', ing: 'chili', tops: [['花生', 1], ['干辣椒', 1]] },
    mian: { n: '兰州牛肉面', tags: ['面', '肉', '香菜'], price: 28, cook: 6, ware: 'pot', ing: 'beef', tops: [['香菜', 1], ['辣油', 0]] },
    dandan: { n: '担担面', tags: ['麻', '辣', '面', '花生'], price: 24, cook: 5, ware: 'pot', ing: 'peanut', tops: [['花生碎', 1], ['辣油', 1]] },
    xiajiao: { n: '虾饺', tags: ['海鲜', '清淡'], price: 26, cook: 5, ware: 'steamer', ing: 'shrimp', tops: [['醋', 0], ['辣油', 0]] },
    chashao: { n: '叉烧饭', tags: ['米饭', '肉', '甜'], price: 32, cook: 7, ware: 'clay', ing: 'pork', tops: [['青菜', 1], ['煎蛋', 0]] },
    baozai: { n: '煲仔饭', tags: ['米饭', '肉', '蛋', '清淡'], price: 36, cook: 8, ware: 'clay', ing: 'egg', tops: [['青菜', 1], ['腊肠', 1]] },
  };
  const hasWare = (w) => !WARES[w].up || has(WARES[w].up);
  const stockOf = (ing) => (save && save.stock && save.stock[ing]) || 0;
  const onMenu = (k) => hasWare(DISH[k].ware);
  const canCook = (k) => onMenu(k) && stockOf(DISH[k].ing) > 0;
  const menuNow = () => Object.keys(DISH).filter(onMenu);
  const useStock = (k, n = 1) => { save.stock[DISH[k].ing] = Math.max(0, stockOf(DISH[k].ing) - n); };

  // 顾客：menu = 普通客，直接点菜，配料要求很简单（也常常没要求）；omakase = 随缘客，说个口味让你挑
  const CT = [
    { id: 'shiba', n: '柴犬上班族', kind: 'menu', w: 3, pat: 1.35, eat: 4, water: 0.1, picky: 0.5, sizes: [1, 1, 2, 2, 3],
      add: ['辣油', '干辣椒', '花椒'], no: ['香菜', '葱花'], blurb: '午休只有半小时，永远在看手表。',
      say: { order: '老板，快点！', happy: '好吃！下午开会有劲了！', angry: '太慢了，我走了！', bad: '说了不要的！', water: '先来杯水，渴死了。' } },
    { id: 'bunny', n: '兔子小学生', kind: 'menu', w: 2, pat: 1.0, eat: 6, water: 0.4, picky: 0.7, sizes: [1, 2, 2, 3, 4],
      add: ['煎蛋', '醋'], no: ['香菜', '花生', '花生碎', '辣油', '干辣椒', '花椒'], blurb: '放学和同学一起来，挑食但很有礼貌。',
      say: { order: '我想好啦！', happy: '耶！好好吃！', angry: '呜呜，好饿……', bad: '我不吃这个……', water: '可以先给我一杯水吗？' } },
    { id: 'raccoon', n: '狸猫阿姨', kind: 'menu', w: 3, pat: 0.95, eat: 7, water: 0.5, picky: 0.4, sizes: [1, 2, 3, 4, 4],
      add: ['煎蛋', '醋', '腊肠'], no: ['香菜'], blurb: '买菜路过，最爱打听今天有没有特价。',
      say: { order: '老板，今天有特价吗？', happy: '划算！下次带姐妹来！', angry: '不吃了不吃了！', bad: '这个我不要的呀！', water: '先倒杯水，走得口干。' } },
    { id: 'panda', n: '熊猫奶奶', kind: 'omakase', w: 1.5, pat: 0.6, eat: 9, water: 0.7, sizes: [1, 1, 2],
      likes: ['清淡', '面', '米饭', '海鲜', '蛋', '甜'], hates: ['辣', '麻'], blurb: '不着急，你看着做就好。',
      say: { order: '你看着做吧，奶奶不挑。', happy: '真好吃，跟我做的一样香。', angry: '唉，等不动啦。', bad: '哎呀，奶奶吃不了这个呀。', water: '先给奶奶倒杯温水。' } },
    { id: 'fox', n: '狐狸美食家', kind: 'omakase', w: 1, pat: 1.0, eat: 7, water: 0.2, sizes: [1, 1, 2],
      likes: ['麻', '辣', '海鲜', '花生', '面'], hates: ['甜', '香菜'], blurb: '拿着小本子，吃一口记一笔。',
      say: { order: '主厨推荐吧，让我看看你的手艺。', happy: '嗯……可以写进我的美食笔记。', angry: '服务太慢，减分。', bad: '不合格，这个我不吃。', water: '先上一杯水，清清口。' } },
  ];
  const TAG_WORD = { '清淡': '想吃点清淡的', '米饭': '想吃点米饭', '海鲜': '想吃点海鲜', '蛋': '想吃带蛋的', '甜': '想吃点甜口的', '麻': '想吃麻的', '辣': '想吃辣的', '花生': '想吃点带花生的', '面': '想吃碗面', '肉': '想吃肉' };
  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const pickW = (arr) => { let r = Math.random() * arr.reduce((s, x) => s + x.w, 0); for (const x of arr) { r -= x.w; if (r <= 0) return x; } return arr[0]; };
  // 图鉴记录
  const dexOf = (id) => { save.dex = save.dex || {}; return (save.dex[id] = save.dex[id] || { met: 0, likes: [], hates: [], reqs: [] }); };
  function learn(c, list, tags) {
    const d = dexOf(c.type.id), got = [];
    for (const t of tags) if (!d[list].includes(t)) { d[list].push(t); got.push(t); }
    if (got.length) { const a = anchor(c); float(a.x, a.y - 54, `图鉴：${c.type.n}${list === 'likes' ? '喜欢' : '不吃'}「${got.join('、')}」`, list === 'likes' ? '#3f7a34' : '#a8322a'); }
  }
  // 给一伙客人里的一位生成点单
  function makeOrder(c) {
    const t = c.type;
    if (t.kind === 'menu') {
      const ok = menuNow().filter(canCook);
      if (!ok.length) return null;
      const k = pick(ok); useStock(k);
      const tops = {}; DISH[k].tops.forEach(([n, d]) => { tops[n] = !!d; });
      const cand = DISH[k].tops.filter(([n, d]) => (d && t.no.includes(n)) || (!d && t.add.includes(n)));
      const req = cand.length && Math.random() < t.picky ? (([n, d]) => ({ t: d ? 'no' : 'add', top: n }))(pick(cand)) : null;
      if (req) { const d = dexOf(t.id), s = (req.t === 'no' ? '不要' : '加') + req.top; if (!d.reqs.includes(s)) d.reqs.push(s); }
      return { kind: 'menu', dish: k, tops, req, st: 'none', reserved: true };
    }
    const okDishes = menuNow().filter((k) => canCook(k) && !DISH[k].tags.some((x) => t.hates.includes(x)));
    const wants = shuffle(t.likes).filter((w) => okDishes.some((k) => DISH[k].tags.includes(w)));
    const want = wants[0] || pick(t.likes);
    const d = dexOf(t.id); if (!d.likes.includes(want)) d.likes.push(want); // 说出口的口味直接记进图鉴
    return { kind: 'omakase', dish: null, want, st: 'none' };
  }
  const orderLine = (m) => m.kind === 'menu'
    ? `${DISH[m.dish].n}${m.req ? `，${m.req.t === 'no' ? '不要' : '多加'}${m.req.top}！` : '。'}`
    : `${TAG_WORD[m.want] || '想吃点' + m.want + '的'}。`;

  // ---------- 场景布局：两张 2 人桌、两张 4 人桌 ----------
  const SEATS = { 2: [[-102, 10], [102, 10]], 4: [[-122, 12], [122, 12], [-46, -36], [46, -36]] };
  const TABLES = [
    { id: 1, cx: 470, cy: 320, size: 2 }, { id: 2, cx: 800, cy: 320, size: 4 },
    { id: 3, cx: 470, cy: 548, size: 4 }, { id: 4, cx: 800, cy: 548, size: 2 },
  ];
  TABLES.forEach((t) => {
    t.seats = SEATS[t.size].map(([dx, dy]) => ({ x: t.cx + dx, y: t.cy + dy }));
    t.spot = { x: t.cx + 30, y: t.cy + (t.size === 4 ? 88 : 78) };
    t.rx = t.size === 4 ? 100 : 80; t.ry = t.size === 4 ? 54 : 46;
  });
  const PASS = { x: 500, y: 112, w: 300, h: 78, spot: { x: 640, y: 222 } };
  const SINK = { x: 1050, y: 110, w: 150, h: 80, spot: { x: 1125, y: 222 } };
  const WATER = { x: 782, y: 128, spot: { x: 782, y: 226 } };
  const DOOR = { x: 70, y: 700 };
  const QSPOTS = [{ x: 110, y: 300 }, { x: 110, y: 390 }, { x: 110, y: 480 }, { x: 110, y: 570 }];
  const IDLE = { x: 660, y: 262 };
  const TEA = { cx: 1040, cy: 318, spot: { x: 1040, y: 360 } };
  const SINK2 = { x: 1088, y: 226 };
  const MAXQ = 6, PASS_MAX = 6;
  const STAFF_DEF = {
    laoer: { name: '老二', home: { x: 905, y: 238 }, rest: { x: 1110, y: 646 } },
    mimi: { name: '咪咪', home: { x: 960, y: 640 }, rest: { x: 1176, y: 668 } },
  };
  const JOBS = [{ id: 'serve', n: '上菜' }, { id: 'water', n: '上水' }, { id: 'bus', n: '收盘子' }, { id: 'rest', n: '休息' }];
  const DEFAULT_JOB = { laoer: 'serve', mimi: 'bus' };
  const UPGRADES = [
    { id: 'tea', n: '茶台', desc: '客人心情不好时端一杯茶过去，+2 颗心（每杯 ¥2）', day: 2, cost: 80 },
    { id: 'steamer', n: '蒸笼', desc: '新炊具：能做虾饺（要鲜虾，去池塘钓）', day: 2, cost: 120 },
    { id: 'snack', n: '点心柜', desc: '送一碟点心，+3 颗心；客人退菜时也能哄回来（每碟 ¥5）', day: 3, cost: 150 },
    { id: 'clay', n: '砂锅', desc: '新炊具：能做叉烧饭、煲仔饭（要叉烧肉、鸡蛋）', day: 3, cost: 160 },
    { id: 'mimi', n: '雇佣咪咪', desc: '多一个帮手，可以安排她上菜、上水或收盘子', day: 4, cost: 220 },
  ];
  const has = (k) => !!(save && save.upgrades && save.upgrades[k]);
  const staffIds = () => ['laoer'].concat(has('mimi') ? ['mimi'] : []);
  const jobOf = (id) => (save && save.jobs && save.jobs[id]) || DEFAULT_JOB[id];

  // 寻路（店里、白天大地图各一张网格）
  function makeGrid(cols, rows, isBlocked) {
    const b = [];
    for (let r = 0; r < rows; r++) { b.push([]); for (let c = 0; c < cols; c++) b[r].push(isBlocked(c * TS + TS / 2, r * TS + TS / 2)); }
    return { cols, rows, b };
  }
  const SHOP_GRID = makeGrid(COLS, ROWS, (x, y) => y < 196 || TABLES.some((t) => ((x - t.cx) / t.rx) ** 2 + ((y - t.cy) / t.ry) ** 2 < 1) || (x > 965 && x < 1115 && y > 250 && y < 330));
  const inRect = (x, y, r, pad = 0) => x > r.x - pad && x < r.x + r.w + pad && y > r.y - pad && y < r.y + r.h + pad;
  const DOCK = { x: 1400, y: 960, w: 150, h: 60 };
  const WORLD_GRID = makeGrid(Math.ceil(WORLD_W / TS), Math.ceil(WORLD_H / TS), (x, y) => {
    const M = WMAP;
    if (inRect(x, y, M.shop) || inRect(x, y, { x: M.market.x, y: M.market.y + 60, w: M.market.w, h: 110 }) || inRect(x, y, { x: M.coop.x, y: M.coop.y + 40, w: M.coop.w, h: M.coop.h - 40 })) return true;
    if (M.farm.plots.some(([px, py]) => Math.abs(x - px) < M.farm.pw / 2 && Math.abs(y - py) < M.farm.ph / 2)) return true;
    if (((x - M.pond.cx) / (M.pond.rx + 10)) ** 2 + ((y - M.pond.cy) / (M.pond.ry + 10)) ** 2 < 1 && !inRect(x, y, DOCK)) return true;
    return y < 150;
  });
  function findPath(from, to, grid = SHOP_GRID) {
    const { cols: C, rows: R, b: blocked } = grid;
    const cell = (p) => ({ c: Math.max(0, Math.min(C - 1, Math.floor(p.x / TS))), r: Math.max(0, Math.min(R - 1, Math.floor(p.y / TS))) });
    const s = cell(from), g = cell(to);
    const key = (c, r) => r * C + c;
    const open = [{ c: s.c, r: s.r, g: 0, f: 0 }], came = new Map(), gs = new Map([[key(s.c, s.r), 0]]);
    const closed = new Set();
    while (open.length) {
      let bi = 0; for (let i = 1; i < open.length; i++) if (open[i].f < open[bi].f) bi = i;
      const cur = open.splice(bi, 1)[0]; const ck = key(cur.c, cur.r);
      if (closed.has(ck)) continue; closed.add(ck);
      if (cur.c === g.c && cur.r === g.r) {
        const pts = [to]; let k = ck;
        while (came.has(k)) { k = came.get(k); const c = k % C, r = Math.floor(k / C); if (k !== key(s.c, s.r)) pts.unshift({ x: c * TS + TS / 2, y: r * TS + TS / 2 }); }
        return pts;
      }
      for (let dc = -1; dc <= 1; dc++) for (let dr = -1; dr <= 1; dr++) {
        if (!dc && !dr) continue;
        const nc = cur.c + dc, nr = cur.r + dr;
        if (nc < 0 || nr < 0 || nc >= C || nr >= R) continue;
        const goal = nc === g.c && nr === g.r;
        if (blocked[nr][nc] && !goal) continue;
        if (dc && dr && (blocked[cur.r][nc] || blocked[nr][cur.c])) continue;
        const ng = cur.g + (dc && dr ? 1.414 : 1);
        const nk = key(nc, nr);
        if (ng < (gs.get(nk) ?? Infinity)) { gs.set(nk, ng); came.set(nk, ck); open.push({ c: nc, r: nr, g: ng, f: ng + Math.hypot(nc - g.c, nr - g.r) }); }
      }
    }
    return [to];
  }

  // ---------- 存档 ----------
  const SAVE_KEY = 'penpen.saves.v1';
  const loadSaves = () => { try { return JSON.parse(localStorage.getItem(SAVE_KEY)) || []; } catch (e) { return []; } };
  const storeSaves = (list) => { try { localStorage.setItem(SAVE_KEY, JSON.stringify(list)); } catch (e) { toast('存档没保存成功（浏览器不允许）'); } };
  let save = null; // 当前存档
  const START_STOCK = { tofu: 5, beef: 5, pork: 0, chili: 2, peanut: 2, shrimp: 0, egg: 0 };
  function fixSave(s) { // 老存档补字段
    s.stock = { ...START_STOCK, ...(s.stock || {}) };
    s.farm = s.farm || [{ crop: 'chili', ready: 1 }, { crop: 'chili', ready: 1 }, { crop: 'peanut', ready: 1 }, { crop: 'peanut', ready: 1 }];
    s.dex = s.dex || {}; s.dishDex = s.dishDex || {};
    return s;
  }

  // ---------- 游戏状态 ----------
  let G = null, TEA_IMG = null;
  const ENERGY = 6;
  function newDay() {
    G = {
      mode: 'day', t: 0, spawnT: 2, paused: false, over: false, soldOut: false,
      coins: 0, tips: 0, served: 0, angry: 0, rep: 0, wrong: 0,
      customers: [], floats: [], nextId: 1,
      tables: TABLES.map((t) => ({ ...t, cust: null, dirty: false, reserved: null, busClaim: null })),
      kitchen: { wares: Object.fromEntries(Object.keys(WARES).map((w) => [w, { q: [], cur: null }])), pass: [] },
      waiter: { x: IDLE.x, y: IDLE.y, path: [], hands: [], queue: [], face: 1, back: false, blinkT: 2 },
      staff: staffIds().map((id) => ({ id, x: STAFF_DEF[id].home.x, y: STAFF_DEF[id].home.y, path: [], hands: [], task: null, face: 1, back: false })),
      danceCD: 0, selected: null, orderOpen: null, dancer: null,
      D: { x: WMAP.shop.door.x, y: WMAP.shop.door.y + 30, path: [], face: 1, back: false, task: null, energy: ENERGY, fish: 0, cam: { x: 360, y: 300 }, manual: false },
    };
    TEA_IMG = (has('tea') || has('snack')) ? svgImg(teaCartSVG(has('tea'), has('snack'))) : null;
    setMode('day');
  }
  function setMode(m) {
    G.mode = m;
    $('#hud-screen').classList.toggle('mode-day', m === 'day');
    $('#hud-screen').classList.toggle('mode-shop', m === 'shop');
  }
  function openShop() {
    if (!G || G.mode !== 'day') return;
    setMode('shop'); G.t = 0; G.spawnT = 2; persist();
    if (save.day === 1 && !save.shopTipSeen) { save.shopTipSeen = true; showTip('shop'); }
    toast('开门营业啦！');
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
  ];
  const plotReady = (i) => save.farm[i] && save.farm[i].ready <= save.day;
  function dayTap(p) {
    const D = G.D;
    const h = HOT.find((h) => inRect(p.x, p.y, h.r));
    if (D.fish > 0) return;
    if (h) { D.task = h; D.path = findPath(D, h.spot(), WORLD_GRID); D.manual = false; sfx.tap(); return; }
    D.task = null; D.path = findPath(D, p, WORLD_GRID); D.manual = false;
  }
  const spend = () => { if (G.D.energy <= 0) { toast('今天累了，没体力了；去开店吧'); return false; } G.D.energy--; return true; };
  function gain(ing, n, x, y) { save.stock[ing] = stockOf(ing) + n; float(x, y, `${ING[ing].n} +${n}`, '#3f7a34'); sfx.ding(); }
  function dayArrive(h) {
    const D = G.D;
    if (h.id === 'door') { ask(`收拾好了，开门营业吗？${D.energy ? `（体力还剩 ${D.energy}）` : ''}`, '开店').then((ok) => ok && openShop()); return; }
    if (h.id === 'market') { openMarket(); return; }
    if (h.id === 'plot') {
      const f = save.farm[h.i];
      if (!plotReady(h.i)) { toast(`${ING[f.crop].n}还在长，明天才熟`); return; }
      if (!spend()) return;
      f.ready = save.day + 1; const [x, y] = WMAP.farm.plots[h.i]; gain(f.crop, 3, x, y - 60); return;
    }
    if (h.id === 'coop') {
      if (save.coopDay === save.day) { toast('今天的蛋已经捡过了'); return; }
      if (!spend()) return;
      save.coopDay = save.day; gain('egg', 3, 2160, 420); return;
    }
    if (h.id === 'pond') { if (!spend()) return; D.fish = 2.2; D.face = 1; return; }
    if (h.id === 'mail') { toast('阿橘还在远行，以后会从这里寄信和特产回来'); return; }
    if (h.id === 'plaza') { toast('爸爸的广场舞队在练舞，晚上营业时会来店门口跳'); return; }
  }
  function updateDay(dt) {
    const D = G.D;
    if (D.fish > 0) { D.fish -= dt; if (D.fish <= 0) { D.fish = 0; gain('shrimp', 2, 1600, 930); } }
    else if (D.path.length) { if (moveAlong(D, 340, dt) && D.task) { const h = D.task; D.task = null; dayArrive(h); } }
    const tx = Math.max(0, Math.min(WORLD_W - W, D.x - W / 2)), ty = Math.max(0, Math.min(WORLD_H - H, D.y - H / 2 - 40));
    if (!D.manual) { D.cam.x += (tx - D.cam.x) * Math.min(1, dt * 4); D.cam.y += (ty - D.cam.y) * Math.min(1, dt * 4); }
    G.floats = G.floats.filter((f) => (f.t += dt) < 1.6);
  }
  // 早市（妈妈特价：每天一样东西半价）
  const special = () => { const ks = Object.keys(ING); return ks[(save.day * 7 + 3) % ks.length]; };
  const priceOf = (k) => (k === special() ? Math.ceil(ING[k].price / 2) : ING[k].price);
  function openMarket() {
    G.paused = true;
    const sp = special();
    const box = $('#market-list');
    box.innerHTML = Object.keys(ING).map((k) => {
      const p = priceOf(k), uses = Object.keys(DISH).filter((d) => DISH[d].ing === k).map((d) => DISH[d].n).join('、');
      return `<div class="mrow ${k === sp ? 'sp' : ''}"><img alt="" src="${ingURL(k)}"><div><b>${ING[k].n}</b>${k === sp ? '<span class="tag-sp">妈妈特价 半价</span>' : ''}<small>做 ${uses}　·　库存 ${stockOf(k)}</small></div>
        <span class="mp">¥${p}${k === sp ? `<s>¥${ING[k].price}</s>` : ''}</span><button class="buy1" data-k="${k}" data-n="1" ${save.coins >= p ? '' : 'disabled'}>买 1</button><button class="buy1" data-k="${k}" data-n="5" ${save.coins >= p * 5 ? '' : 'disabled'}>买 5</button></div>`;
    }).join('');
    $('#market-coins').textContent = `存款 ¥ ${save.coins}`;
    box.querySelectorAll('.buy1').forEach((b) => b.addEventListener('click', () => {
      const k = b.dataset.k, n = +b.dataset.n, cost = priceOf(k) * n;
      if (save.coins < cost) return;
      save.coins -= cost; save.stock[k] = stockOf(k) + n; sfx.coin(); openMarket();
    }));
    show('market');
  }
  function openPantry() {
    if (!G) return; G.paused = true;
    $('#pantry-list').innerHTML = Object.keys(ING).map((k) => {
      const ds = Object.keys(DISH).filter((d) => DISH[d].ing === k);
      return `<div class="prow ${stockOf(k) ? '' : 'zero'}"><img alt="" src="${ingURL(k)}"><b>${ING[k].n}</b><span class="cnt">× ${stockOf(k)}</span><small>${ING[k].src} · 做 ${ds.map((d) => DISH[d].n + (onMenu(d) ? '' : `（要${WARES[DISH[d].ware].n}）`)).join('、')}</small></div>`;
    }).join('');
    show('pantry');
  }

  // ---------- 顾客（一桌一伙人，1–4 位，每人各点各的） ----------
  const inLine = (c) => ['queue', 'enter', 'called'].includes(c.state);
  const SEATED = ['toSeat', 'thirsty', 'reading', 'ordering', 'ordering-open', 'waitFood', 'eating', 'bill'];
  const seated = (c) => c.table && SEATED.includes(c.state);
  function spawnCustomer() {
    if (G.customers.filter(inLine).length >= QSPOTS.length) return;
    const type = pickW(CT), size = pick(type.sizes);
    const c = { id: G.nextId++, type, size, state: 'enter', x: DOOR.x, y: DOOR.y, path: [], hearts: 5, timer: 0, table: null,
      members: [], say: '', sayT: 0, bob: Math.random() * 6, upset: false, watered: false, wantsWater: Math.random() < type.water };
    dexOf(type.id).met++;
    G.customers.push(c);
    layoutQueue(); sfx.tap();
  }
  function layoutQueue() { G.customers.filter(inLine).forEach((c, i) => { c.qi = i; c.path = [QSPOTS[i]]; }); }
  function speak(c, key) { c.say = c.type.say[key]; c.sayT = 2.6; }
  function addHeart(c, n = 1) { c.hearts = Math.min(5, c.hearts + n); }
  function leave(c, angry) {
    // 还没下单就走：预留的食材退回库存
    for (const m of c.members) if (m.reserved && m.st === 'none') save.stock[DISH[m.dish].ing] = stockOf(DISH[m.dish].ing) + 1;
    if (c.table) { const t = c.table; if (t.cust === c) t.cust = null; c.table = null; }
    const k = G.kitchen;
    for (const w of Object.values(k.wares)) { w.q = w.q.filter((o) => o.cust !== c); if (w.cur && w.cur.cust === c) w.cur = null; }
    k.pass = k.pass.filter((o) => o.cust !== c);
    const w = G.waiter;
    w.hands = w.hands.filter((h) => h.cust !== c);
    if (G.selected === c) G.selected = null;
    for (const t of G.tables) if (t.reserved === c) t.reserved = null;
    if (w.busyAct && w.busyAct.cust === c) { w.busyAct = null; w.path = []; }
    w.queue = w.queue.filter((a) => a.cust !== c);
    c.state = 'leaving'; c.path = findPath(c, DOOR);
    if (angry) { G.angry++; G.rep--; speak(c, 'angry'); sfx.bad(); }
    layoutQueue();
  }
  // 心情下降速度（每秒掉几颗心）
  const DRAIN = { queue: 1 / 18, called: 1 / 20, thirsty: 1 / 20, ordering: 1 / 22, waitFood: 1 / 26, bill: 1 / 18 };
  function startOrdering(c) {
    for (let i = c.members.length; i < c.size; i++) c.members.push(makeOrder(c));
    c.members = c.members.filter(Boolean);
    if (!c.members.length) { c.say = '没有想吃的……下次再来。'; c.sayT = 2.4; const t = c.table; leave(c, false); if (t) t.dirty = 0; return; }
    c.state = 'ordering'; speak(c, 'order'); sfx.ding();
  }
  function giveWater(c) {
    c.watered = true; addHeart(c, 1);
    const a = anchor(c); float(a.x, a.y - 20, '喝口水 +♥', '#4a7fb5');
    if (c.state === 'thirsty') { c.state = 'reading'; c.timer = 2; }
  }

  // ---------- 盆盆的动作 ----------
  function enqueue(act) {
    const w = G.waiter;
    if (w.queue.length >= MAXQ) { toast(`盆盆一口气最多记 ${MAXQ} 件事，先等一等`); return false; }
    w.queue.push(act); sfx.tap(); return true;
  }
  function targetSpot(act) {
    if (act.kind === 'table') return act.table.spot;
    if (act.kind === 'seat') return act.phase === 1 ? { x: act.cust.x + 56, y: act.cust.y + 6 } : act.table.spot;
    if (act.kind === 'give') return act.cust.table ? act.cust.table.spot : { x: act.cust.x + 56, y: act.cust.y + 6 };
    if (act.kind === 'tea' || act.kind === 'snack') return TEA.spot;
    if (act.kind === 'pass') return PASS.spot;
    if (act.kind === 'water') return WATER.spot;
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
  const full = () => G.waiter.hands.length >= 2 && (toast('手里拿满了（最多 2 样）'), true);
  function doAction(act) {
    const w = G.waiter;
    if (act.kind === 'seat') { // 第二段：把客人领到桌边
      const c = act.cust, t = act.table;
      t.reserved = null;
      if (c.state !== 'following') return;
      t.cust = c; c.table = t; c.state = 'toSeat'; c.path = findPath(c, t.seats[0]); addHeart(c); sfx.tap();
      return;
    }
    if (act.kind === 'tea' || act.kind === 'snack') {
      if (full()) return;
      const cf = COMFORT[act.kind];
      w.hands.push({ kind: act.kind }); G.coins -= cf.cost; float(TEA.cx, TEA.cy - 120, `-¥${cf.cost}`, '#8a6a50'); sfx.tap();
      return;
    }
    if (act.kind === 'water') { if (full()) return; w.hands.push({ kind: 'water' }); sfx.tap(); return; }
    if (act.kind === 'give') { if (!giveComfort(act.cust)) toast('手里没有茶或点心'); return; }
    if (act.kind === 'pass') {
      let got = 0;
      const wanted = w.queue.filter((a) => a.kind === 'table' && a.table.cust).map((a) => a.table.cust);
      const order = G.kitchen.pass.filter((o) => !o.claim).sort((a, b) => (wanted.includes(b.cust) ? 1 : 0) - (wanted.includes(a.cust) ? 1 : 0));
      for (const o of order) { if (w.hands.length >= 2) break; G.kitchen.pass.splice(G.kitchen.pass.indexOf(o), 1); w.hands.push({ kind: 'dish', ...o }); got++; }
      if (!got) toast(w.hands.length >= 2 ? '手里拿满了（最多 2 样）' : G.kitchen.pass.length ? '这几道老二正在端' : '出菜口还没有菜');
      else sfx.tap();
      return;
    }
    if (act.kind === 'sink') {
      const n = w.hands.filter((h) => h.kind === 'plate').length;
      w.hands = w.hands.filter((h) => h.kind !== 'plate');
      if (n) { sfx.tap(); float(SINK.x + 75, SINK.y + 20, '洗好啦', '#4a7fb5'); } else toast('手里没有脏盘子');
      return;
    }
    if (act.kind === 'table') {
      const t = act.table, c = t.cust;
      if (c && c.state !== 'leaving') {
        const mine = w.hands.filter((h) => h.kind === 'dish' && h.cust === c);
        if (mine.length) { mine.forEach((h) => { w.hands.splice(w.hands.indexOf(h), 1); serve(c, h); }); return; }
        const wi = w.hands.findIndex((h) => h.kind === 'water');
        if (wi >= 0 && c.state === 'thirsty') { w.hands.splice(wi, 1); giveWater(c); return; }
        if (c.state === 'ordering' || c.state === 'reading') { if (c.state === 'reading') startOrdering(c); if (c.state === 'ordering') openOrder(c); return; }
        if (c.state !== 'eating' && (c.hearts < 4.5 || c.upset) && giveComfort(c)) return;
        if (wi >= 0 && !c.watered && c.state !== 'bill') { w.hands.splice(wi, 1); giveWater(c); return; }
        if (c.state === 'bill') { pay(c); return; }
        if (c.state === 'thirsty') { toast('客人想先喝杯水：点出菜口右边的水壶'); return; }
        if (c.state === 'toSeat') { toast('客人还在入座，等一下再来'); return; }
        if (c.state === 'waitFood') { toast(`${t.id} 号桌的菜还没做好`); return; }
        return;
      }
      if (!c && t.dirty) {
        if (full()) return;
        w.hands.push({ kind: 'plate', n: t.dirty }); t.dirty = 0; t.busClaim = null; sfx.tap(); return;
      }
    }
  }
  function serve(c, o) {
    const m = c.members[o.mi], d = DISH[o.dish], a = anchor(c);
    if (!m || m.st !== 'cook' || c.state === 'leaving') return;
    const refuse = (why) => {
      speak(c, 'bad'); sfx.bad(); float(a.x, a.y - 20, why, '#d0453a');
      c.hearts = Math.max(0.6, c.hearts - 2); c.upset = true; G.rep--; G.wrong++;
    };
    if (m.kind === 'menu') {
      if (m.req && m.req.t === 'no' && o.tops[m.req.top]) { // 放了不要的配料：老大马上重做一份
        refuse(`说了不要${m.req.top}！`);
        const fix = { ...o, tops: { ...o.tops, [m.req.top]: false }, claim: null };
        G.kitchen.wares[d.ware].q.push(fix);
        toast(has('snack') ? '老大重新做一份；可以送点心哄一哄' : '老大重新做一份');
        return;
      }
      m.good = !m.req || (m.req.t === 'add' ? !!o.tops[m.req.top] : true);
      if (!m.good) { c.hearts -= 1; float(a.x, a.y - 20, `没加${m.req.top}……`, '#b06a3a'); }
    } else {
      const hate = d.tags.filter((t) => c.type.hates.includes(t));
      if (hate.length) {
        refuse(`不吃${hate[0]}！要换一道`); learn(c, 'hates', hate);
        m.st = 'none'; m.dish = null; c.state = 'ordering';
        return;
      }
      const likes = d.tags.filter((t) => c.type.likes.includes(t));
      learn(c, 'likes', likes);
      m.good = d.tags.includes(m.want); m.likeN = likes.length;
      if (!m.good) { c.hearts -= 0.5; float(a.x, a.y - 20, '嗯……不太是我想吃的', '#b06a3a'); }
    }
    m.st = 'served'; addHeart(c, 0.5); sfx.ding();
    save.dishDex[o.dish] = (save.dishDex[o.dish] || 0) + 1;
    if (c.members.every((x) => x.st === 'served')) { c.state = 'eating'; c.timer = c.type.eat + c.size; }
  }
  function pay(c) {
    let price = 0, bonus = 0, allGood = true;
    for (const m of c.members) {
      const p = DISH[m.dish].price; price += p;
      if (!m.good) { allGood = false; continue; }
      bonus += m.kind === 'menu' ? p * (m.req ? 0.25 : 0.1) : p * (0.25 + 0.1 * Math.max(0, (m.likeN || 1) - 1));
    }
    const tip = c.upset ? 0 : Math.round(c.hearts * 1.5 * c.size + bonus);
    if (allGood && !c.upset) G.rep++;
    G.coins += price + tip; G.tips += tip; G.served += c.members.length;
    const a = anchor(c);
    float(a.x + 40, a.y, `+${price + tip}`, '#c98a12');
    speak(c, 'happy'); sfx.coin();
    const t = c.table; leave(c, false); if (t) t.dirty = c.members.length;
  }

  // ---------- 点单面板：普通客勾一两样配料，随缘客挑一道菜 ----------
  const dataURL = (svg) => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  const URLS = {};
  const dishURL = (k) => URLS['d' + k] || (URLS['d' + k] = dataURL(dishSVG(k)));
  const ingURL = (k) => URLS['i' + k] || (URLS['i' + k] = dataURL(ingSVG(k)));
  const custURL = (id) => URLS['c' + id] || (URLS['c' + id] = dataURL(catSVG(id, 'front', { w: 120, h: 132 })));
  function openOrder(c) {
    G.orderOpen = c; c.state = 'ordering-open';
    const panel = $('#order');
    const pend = c.members.map((m, i) => [m, i]).filter(([m]) => m.st === 'none');
    const dx = dexOf(c.type.id);
    const rows = pend.map(([m, i]) => {
      const head = `<img class="av" alt="" src="${custURL(c.type.id)}"><div class="q"><span class="no">${'①②③④'[i]}</span>「${orderLine(m)}」</div>`;
      if (m.kind === 'menu') {
        const tops = DISH[m.dish].tops.map(([n]) => `<button class="tp ${m.tops[n] ? 'on' : ''}" data-i="${i}" data-t="${n}">${n}</button>`).join('');
        return `<div class="orow">${head}<div class="od"><img alt="" src="${dishURL(m.dish)}"><b>${DISH[m.dish].n}</b></div><div class="tops">${tops}</div></div>`;
      }
      const unk = (list, known) => list.filter((x) => !known.includes(x)).length;
      const kl = c.type.likes.filter((x) => dx.likes.includes(x)), kh = c.type.hates.filter((x) => dx.hates.includes(x));
      const pref = `<div class="pref">喜欢：${kl.map((x) => `<span class="chip want">${x}</span>`).join('')}${unk(c.type.likes, dx.likes) ? `<span class="chip unk">？×${unk(c.type.likes, dx.likes)}</span>` : ''}　不吃：${kh.map((x) => `<span class="chip hate">${x}</span>`).join('')}${unk(c.type.hates, dx.hates) ? `<span class="chip unk">？×${unk(c.type.hates, dx.hates)}</span>` : ''}</div>`;
      const cards = menuNow().map((k) => {
        const d = DISH[k], left = stockOf(d.ing);
        const tg = d.tags.map((t) => `<span class="tg ${t === m.want ? 'want' : kl.includes(t) ? 'good' : kh.includes(t) ? 'bad' : ''}">${t}</span>`).join('');
        return `<button class="dcard ${m.dish === k ? 'on' : ''}" data-i="${i}" data-k="${k}" ${left ? '' : 'disabled'}><img alt="" src="${dishURL(k)}"><span class="dn">${d.n}</span><span class="dt">${tg}</span><span class="dp">¥${d.price} · 剩${left}</span></button>`;
      }).join('');
      return `<div class="orow oma">${head}${pref}<div class="menu">${cards}</div></div>`;
    }).join('');
    panel.innerHTML = `<div class="ohead"><b>${c.type.n}${c.size > 1 ? ` 一行 ${c.size} 位` : ''} · ${c.table.id} 号桌</b><span>${c.type.kind === 'omakase' ? '随缘客：按口味帮他们挑菜' : '点菜客：看清要求，配料点一下就能加 / 去掉'}</span></div>
      <div class="orows">${rows}</div><button class="go"></button>`;
    const go = panel.querySelector('.go');
    const refresh = () => {
      const left = pend.filter(([m]) => !m.dish).length;
      go.disabled = left > 0; go.textContent = left ? `还有 ${left} 位没选菜` : `下单（${pend.length} 道）`;
    };
    panel.querySelectorAll('.tp').forEach((b) => b.addEventListener('click', () => {
      const m = c.members[+b.dataset.i], n = b.dataset.t; m.tops[n] = !m.tops[n]; b.classList.toggle('on', m.tops[n]); sfx.tap();
    }));
    panel.querySelectorAll('.dcard').forEach((b) => b.addEventListener('click', () => {
      const i = +b.dataset.i; c.members[i].dish = b.dataset.k; sfx.tap();
      panel.querySelectorAll(`.dcard[data-i="${i}"]`).forEach((x) => x.classList.toggle('on', x === b)); refresh();
    }));
    go.addEventListener('click', () => {
      if (pend.some(([m]) => !m.dish)) return;
      for (const [m, i] of pend) {
        if (m.kind === 'omakase') { useStock(m.dish); m.tops = {}; DISH[m.dish].tops.forEach(([n, d]) => { m.tops[n] = !!d; }); }
        m.st = 'cook'; m.reserved = false;
        G.kitchen.wares[DISH[m.dish].ware].q.push({ table: c.table.id, dish: m.dish, tops: { ...m.tops }, cust: c, mi: i, cook: DISH[m.dish].cook });
      }
      c.state = 'waitFood'; addHeart(c, 0.5); G.orderOpen = null; panel.classList.remove('show'); sfx.ding();
    });
    refresh(); panel.classList.add('show');
  }

  // ---------- 输入 ----------
  function toLogical(e) {
    const r = cv.getBoundingClientRect();
    return { x: (e.clientX - r.left) / scale, y: (e.clientY - r.top) / scale };
  }
  let drag = null;
  cv.addEventListener('pointerdown', (e) => {
    if (!G || G.paused || G.orderOpen || G.over) return;
    const p = toLogical(e);
    if (G.mode === 'day') { drag = { x: p.x, y: p.y, cx: G.D.cam.x, cy: G.D.cam.y, moved: false }; return; }
    shopTap(p);
  });
  cv.addEventListener('pointermove', (e) => {
    if (!drag || !G || G.mode !== 'day') return;
    const p = toLogical(e), dx = p.x - drag.x, dy = p.y - drag.y;
    if (!drag.moved && Math.hypot(dx, dy) < 14) return;
    drag.moved = true; G.D.manual = true;
    G.D.cam.x = Math.max(0, Math.min(WORLD_W - W, drag.cx - dx)); G.D.cam.y = Math.max(0, Math.min(WORLD_H - H, drag.cy - dy));
  });
  const endDrag = (e) => {
    if (!drag) return;
    const d = drag; drag = null;
    if (!d.moved && G && G.mode === 'day' && !G.paused) { const p = toLogical(e); dayTap({ x: p.x + G.D.cam.x, y: p.y + G.D.cam.y }); }
  };
  cv.addEventListener('pointerup', endDrag);
  cv.addEventListener('pointercancel', () => { drag = null; });
  function shopTap(p) {
    const w = G.waiter;
    for (const c of G.customers) {
      if (inLine(c) && Math.abs(p.x - c.x) < 34 + c.size * 12 && p.y > c.y - 110 && p.y < c.y + 14) {
        if (w.hands.some((h) => h.kind === 'tea' || h.kind === 'snack')) { enqueue({ kind: 'give', cust: c }); return; }
        if (c.state === 'called') { toast('盆盆马上来领位'); return; }
        G.selected = G.selected === c ? null : c; sfx.tap(); return;
      }
    }
    for (const t of G.tables) {
      if (Math.abs(p.x - t.cx) < t.rx + 50 && p.y > t.cy - t.ry - 80 && p.y < t.cy + t.ry + 30) {
        if (G.selected) {
          const c = G.selected;
          if (t.cust || t.dirty || t.reserved) { toast(t.dirty ? '桌子还没收拾' : '这张桌有客人了'); return; }
          if (c.size > t.size) { toast(`这是 ${t.size} 人桌，坐不下 ${c.size} 位`); return; }
          if (!enqueue({ kind: 'seat', cust: c, table: t, phase: 1 })) return;
          G.selected = null; c.state = 'called'; t.reserved = c; c.say = '来啦～'; c.sayT = 1.2;
          return;
        }
        const c = t.cust;
        const room = (n) => w.queue.length + n <= MAXQ || (toast(`盆盆一口气最多记 ${MAXQ} 件事，先等一等`), false);
        // 顺路：要水的桌先去拿水；等菜的桌、菜已在出菜口就先去拿菜
        if (c && c.state === 'thirsty' && !w.hands.some((h) => h.kind === 'water') && !w.queue.some((a) => a.kind === 'water')) {
          if (!room(2)) return; enqueue({ kind: 'water' }); enqueue({ kind: 'table', table: t }); toast('先去倒杯水'); return;
        }
        if (c && ['waitFood', 'ordering'].includes(c.state) && !w.hands.some((h) => h.kind === 'dish' && h.cust === c)
          && G.kitchen.pass.some((o) => o.cust === c && !o.claim) && !w.queue.some((a) => a.kind === 'pass')) {
          if (!room(2)) return; enqueue({ kind: 'pass' }); enqueue({ kind: 'table', table: t }); toast('顺路去出菜口拿菜'); return;
        }
        enqueue({ kind: 'table', table: t }); return;
      }
    }
    if (p.x > WATER.x - 34 && p.x < WATER.x + 40 && p.y < PASS.y + PASS.h + 40) { enqueue({ kind: 'water' }); return; }
    if (p.x > PASS.x - 20 && p.x < PASS.x + PASS.w + 20 && p.y < PASS.y + PASS.h + 40) { enqueue({ kind: 'pass' }); return; }
    if (p.x > SINK.x - 20 && p.x < SINK.x + SINK.w + 20 && p.y < SINK.y + SINK.h + 40) { enqueue({ kind: 'sink' }); return; }
    if (p.x > TEA.cx - 85 && p.x < TEA.cx + 85 && p.y > TEA.cy - 120 && p.y < TEA.cy + 20) {
      const want = p.x < TEA.cx ? 'tea' : 'snack';
      const kind = has(want) ? want : has('tea') ? 'tea' : has('snack') ? 'snack' : null;
      if (!kind) { toast('茶台还没开，每天结算时可以在「店铺升级」里买'); return; }
      enqueue({ kind }); return;
    }
    if (Math.abs(p.x - w.x) < 30 && p.y > w.y - 95 && p.y < w.y - 10 && w.queue.length) { w.queue = []; w.busyAct = null; w.path = []; toast('已清空动作'); return; }
    if (G.selected) G.selected = null;
  }

  // ---------- 店员（老二、咪咪）按安排的工作自己干活 ----------
  function staffThink(sf) {
    const job = jobOf(sf.id), def = STAFF_DEF[sf.id];
    const go = (task, to) => { sf.task = task; sf.path = findPath(sf, to); };
    if (job === 'serve') {
      const o = G.kitchen.pass.find((o) => !o.claim && o.cust.table && o.cust.state !== 'leaving');
      if (o) { o.claim = sf.id; return go({ kind: 'pickDish', o }, { x: PASS.spot.x - 60, y: PASS.spot.y + 4 }); }
    } else if (job === 'water') {
      const need = (c) => c.table && !c.waterClaim && (c.state === 'thirsty' || (!c.watered && ['reading', 'ordering', 'ordering-open', 'waitFood'].includes(c.state)));
      const c = G.customers.find((c) => need(c) && c.state === 'thirsty') || G.customers.find(need);
      if (c) { c.waterClaim = sf.id; return go({ kind: 'getWater', c }, WATER.spot); }
    } else if (job === 'bus') {
      const t = G.tables.find((t) => t.dirty && !t.cust && !t.reserved && !t.busClaim);
      if (t) { t.busClaim = sf.id; return go({ kind: 'toTable', t }, { x: t.spot.x - 50, y: t.spot.y }); }
    }
    const home = job === 'rest' ? def.rest : def.home;
    if (Math.hypot(sf.x - home.x, sf.y - home.y) > 4) go({ kind: 'home' }, home);
  }
  function staffArrive(sf) {
    const tk = sf.task, home = jobOf(sf.id) === 'rest' ? STAFF_DEF[sf.id].rest : STAFF_DEF[sf.id].home;
    const goHome = () => { sf.task = { kind: 'home' }; sf.path = findPath(sf, home); };
    const alive = (c) => c && c.table && c.state !== 'leaving';
    if (tk.kind === 'pickDish') {
      const i = G.kitchen.pass.indexOf(tk.o);
      if (i >= 0 && alive(tk.o.cust)) {
        G.kitchen.pass.splice(i, 1); sf.hands = [{ kind: 'dish', ...tk.o }];
        sf.task = { kind: 'deliver', o: tk.o }; sf.path = findPath(sf, { x: tk.o.cust.table.spot.x - 50, y: tk.o.cust.table.spot.y });
      } else { if (tk.o) tk.o.claim = null; goHome(); }
    } else if (tk.kind === 'deliver') {
      sf.hands = []; if (alive(tk.o.cust)) serve(tk.o.cust, tk.o); goHome();
    } else if (tk.kind === 'getWater') {
      const c = tk.c;
      if (alive(c)) { sf.hands = [{ kind: 'water' }]; sf.task = { kind: 'giveWater', c }; sf.path = findPath(sf, { x: c.table.spot.x - 50, y: c.table.spot.y }); } else goHome();
    } else if (tk.kind === 'giveWater') {
      const c = tk.c; sf.hands = []; c.waterClaim = null;
      if (alive(c) && !c.watered) giveWater(c);
      goHome();
    } else if (tk.kind === 'toTable') {
      const t = tk.t; t.busClaim = null;
      if (t.dirty && !t.cust) { sf.hands = [{ kind: 'plate', n: t.dirty }]; t.dirty = 0; sf.task = { kind: 'toSink' }; sf.path = findPath(sf, SINK2); } else goHome();
    } else if (tk.kind === 'toSink') { sf.hands = []; float(SINK.x + 40, SINK.y + 10, '洗好啦', '#4a7fb5'); goHome(); }
    else sf.task = null;
  }

  // ---------- 更新 ----------
  function moveAlong(e, speed, dt) {
    if (!e.path.length) return true;
    const tgt = e.path[0];
    const dx = tgt.x - e.x, dy = tgt.y - e.y, d = Math.hypot(dx, dy);
    const step = speed * dt;
    if (d <= step) { e.x = tgt.x; e.y = tgt.y; e.path.shift(); }
    else { e.x += (dx / d) * step; e.y += (dy / d) * step; if (Math.abs(dx) > 2) e.face = dx > 0 ? 1 : -1; e.back = dy < -Math.abs(dx) * 0.6; }
    return !e.path.length;
  }
  const anyCookable = () => menuNow().some(canCook);
  function update(dt) {
    if (!G || G.paused || G.over) return;
    if (G.mode === 'day') { updateDay(dt); hud(); return; }
    dt *= G.orderOpen ? 0.5 : 1;
    if (dt <= 0) return;
    G.t += dt; G.danceCD = Math.max(0, G.danceCD - dt);
    if (G.t < DAY_LEN && !G.soldOut) {
      G.spawnT -= dt;
      if (G.spawnT <= 0) {
        if (!anyCookable()) { G.soldOut = true; toast('食材用完了，招待完这几桌就打烊'); }
        else { spawnCustomer(); G.spawnT = rand(11, 15) - Math.min(3, G.t / 50); }
      }
    }
    const w = G.waiter;
    for (const c of G.customers.slice()) {
      c.bob += dt * 3; if (c.sayT > 0) c.sayT -= dt;
      if (c.state === 'enter') { if (moveAlong(c, 170, dt)) c.state = 'queue'; }
      else if (c.state === 'queue' || c.state === 'called') moveAlong(c, 170, dt);
      else if (c.state === 'following') {
        const tx = w.x - (w.face || 1) * 56, ty = w.y - 2;
        const dx = tx - c.x, dy = ty - c.y, d = Math.hypot(dx, dy);
        if (d > 6) { const st = Math.min(d, 330 * dt); c.x += (dx / d) * st; c.y += (dy / d) * st; c.face = dx > 0 ? 1 : -1; }
      }
      else if (c.state === 'toSeat') { if (moveAlong(c, 190, dt)) { if (c.wantsWater) { c.state = 'thirsty'; speak(c, 'water'); } else { c.state = 'reading'; c.timer = 2.5; } } }
      else if (c.state === 'reading') { c.timer -= dt; if (c.timer <= 0) startOrdering(c); }
      else if (c.state === 'eating') { c.timer -= dt; if (c.timer <= 0) c.state = 'bill'; }
      else if (c.state === 'leaving') { if (moveAlong(c, 200, dt)) G.customers.splice(G.customers.indexOf(c), 1); continue; }
      const dr = DRAIN[c.state === 'enter' ? 'queue' : c.state];
      if (dr) { c.hearts -= dr * c.type.pat * (c.watered ? 0.75 : 1) * dt; if (c.hearts <= 0) { c.hearts = 0; leave(c, true); } }
    }
    // 厨房：每种炊具一次一道
    const k = G.kitchen;
    for (const [wid, ws] of Object.entries(k.wares)) {
      if (!ws.cur && ws.q.length) ws.cur = { ...ws.q.shift(), t: 0 };
      if (ws.cur) { ws.cur.t += dt; if (ws.cur.t >= ws.cur.cook && k.pass.length < PASS_MAX) { k.pass.push(ws.cur); ws.cur = null; sfx.ding(); } }
    }
    w.blinkT -= dt; if (w.blinkT < -0.15) w.blinkT = rand(2, 4);
    if (w.busyAct) {
      if (moveAlong(w, 300, dt)) {
        const a = w.busyAct;
        if (a.kind === 'seat' && a.phase === 1) {
          if (a.cust.state === 'called') { a.cust.state = 'following'; a.phase = 2; layoutQueue(); w.path = findPath(w, a.table.spot); sfx.tap(); }
          else { w.busyAct = null; w.queue.shift(); a.table.reserved = null; }
        } else { w.busyAct = null; w.queue.shift(); doAction(a); }
      }
    } else if (w.queue.length && !G.orderOpen) {
      const a = w.queue[0]; w.busyAct = a; w.path = findPath(w, targetSpot(a));
    } else w.back = false;
    for (const sf of G.staff) {
      if (sf.task) { if (moveAlong(sf, 230, dt)) staffArrive(sf); }
      else staffThink(sf);
    }
    G.floats = G.floats.filter((f) => (f.t += dt) < 1.6);
    if (G.dancer) { G.dancer.t -= dt; if (G.dancer.t <= 0) G.dancer = null; }
    if ((G.t >= DAY_LEN || G.soldOut) && G.customers.length === 0 && !G.orderOpen) endDay();
    hud();
  }
  function float(x, y, text, col) { G.floats.push({ x, y, text, col, t: 0 }); }

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
  function bubbleDish(x, y, dish, note) {
    const w = note ? 116 : 80, h = 50;
    ctx.fillStyle = '#fbf6ec'; ctx.strokeStyle = '#2c2420'; ctx.lineWidth = 2;
    rr(x - w / 2, y - h, w, h, 14); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x - 7, y - 1); ctx.lineTo(x, y + 9); ctx.lineTo(x + 7, y - 1); ctx.fill();
    const img = DISH_IMG[dish];
    if (img && img.complete) ctx.drawImage(img, x - w / 2 + 6, y - h + 6, 57, 38);
    if (note) { ctx.font = `16px ${FONT}`; ctx.fillStyle = '#2c2420'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(note, x + 30, y - h / 2); }
  }
  function drawRoom() {
    if (ROOM.complete) ctx.drawImage(ROOM, 0, 0, W, H);
    else { ctx.fillStyle = '#efe3cc'; ctx.fillRect(0, 0, W, H); }
    for (const l of ROOM_LABELS) label(l.t, l.x, l.y, l.size, l.fill, l.stroke, l.lw);
    menuNow().slice(0, 4).forEach((k, i) => label(DISH[k].n + (stockOf(DISH[k].ing) ? '' : '·卖完'), 982, 90 + i * 15, 13, stockOf(DISH[k].ing) ? '#e6dfc8' : '#a39b88'));
    if (DISH_IMG.water.complete) { ctx.drawImage(DISH_IMG.water, WATER.x - 30, WATER.y - 30, 42, 28); ctx.drawImage(DISH_IMG.water, WATER.x - 6, WATER.y - 26, 42, 28); }
    label('水', WATER.x + 4, WATER.y + 16, 16, '#fbf3e2', '#3f6680');
  }
  function drawKitchen() {
    const k = G.kitchen, t = performance.now();
    const busy = Object.keys(WARES).filter((w) => hasWare(w) && k.wares[w].cur);
    const cx = busy.length ? WARES[busy[Math.floor(t / 1600) % busy.length]].x : 652;
    G.chefX = G.chefX == null ? cx : G.chefX + (cx - G.chefX) * 0.06;
    const bob = busy.length ? Math.sin(t / 120) * 3 : 0;
    if (SPR.chef.complete) ctx.drawImage(SPR.chef, G.chefX - 45, 2 + bob, 90, 99);
    for (const [wid, wd] of Object.entries(WARES)) {
      if (!hasWare(wid)) continue;
      const ws = k.wares[wid], img = WARE_IMG[wid];
      if (img.complete) ctx.drawImage(img, wd.x - 32, 68, 64, 45);
      if (ws.cur) {
        const p = Math.min(1, ws.cur.t / ws.cur.cook);
        ctx.fillStyle = '#ffffff'; ctx.globalAlpha = 0.5 + 0.25 * Math.sin(t / 150);
        ctx.beginPath(); ctx.arc(wd.x - 6, 60 - p * 8, 8, 0, 7); ctx.arc(wd.x + 8, 52 - p * 10, 10, 0, 7); ctx.fill(); ctx.globalAlpha = 1;
        ctx.fillStyle = '#fbf6ecdd'; rr(wd.x - 30, 112, 60, 8, 4); ctx.fill();
        ctx.fillStyle = '#c9862f'; rr(wd.x - 30, 112, 60 * p, 8, 4); ctx.fill();
      }
      if (ws.q.length) { ctx.fillStyle = '#b04a3c'; ctx.beginPath(); ctx.arc(wd.x + 28, 72, 11, 0, 7); ctx.fill(); label(`${ws.q.length}`, wd.x + 28, 73, 15, '#fff'); }
    }
    k.pass.forEach((o, i) => drawPlate(PASS.x + 34 + i * 42, PASS.y + 24, o, 0.8));
  }
  function drawPlate(x, y, o, s = 1) {
    const img = o ? DISH_IMG[o.dish] : DISH_IMG.dirty;
    if (img && img.complete) ctx.drawImage(img, x - 33 * s, y - 30 * s, 66 * s, 44 * s);
    if (o && o.table) label(`${o.table}号`, x, y - 34 * s, 15, o.claim ? '#4a6384' : '#2c2420', '#fbf6ec');
  }
  function drawHeld(h, hx, hy) {
    if (h.kind === 'dish') drawPlate(hx, hy, h);
    else if (DISH_IMG[h.kind] && DISH_IMG[h.kind].complete) ctx.drawImage(DISH_IMG[h.kind], hx - 30, hy - 26, 60, 40);
    else drawPlate(hx, hy, null);
  }
  function drawTeaCart() {
    if (!TEA_IMG || !TEA_IMG.complete) return;
    ctx.drawImage(TEA_IMG, TEA.cx - 80, TEA.cy - 110, 160, 120);
    for (const [key, x, n] of [['tea', TEA.cx - 40, '茶'], ['snack', TEA.cx + 40, '点心']]) if (has(key)) label(n, x, TEA.cy - 22, 16, '#fbf3e2', '#5a3b28');
  }
  function drawTable(t) {
    const img = t.size === 4 ? TABLE4 : TABLE2;
    if (img.complete) ctx.drawImage(img, t.cx - 160, t.cy - 90, 320, 200);
    ctx.globalAlpha = 0.6; label(`${t.id}号 · ${t.size}人`, t.cx, t.cy + t.ry + 4, 18, '#2c2420'); ctx.globalAlpha = 1;
    if (t.dirty) drawPlate(t.cx + 4, t.cy - 2, null);
    const c = t.cust;
    if (c && ['waitFood', 'eating', 'bill', 'ordering', 'ordering-open'].includes(c.state)) c.members.forEach((m, i) => {
      if (m.st !== 'served' || c.state === 'bill') return;
      const sp = t.seats[i]; drawPlate(t.cx + (sp.x - t.cx) * 0.5, t.cy + (sp.y - t.cy) * 0.5 + 6, { dish: m.dish });
    });
  }
  function memberPos(c, i) {
    if (seated(c) && c.state !== 'toSeat') return c.table.seats[i];
    const n = c.size, dx = (i - (n - 1) / 2) * 30, dy = (i % 2) * 10 - 4;
    return { x: c.x + dx, y: c.y + dy };
  }
  function anchor(c) {
    if (c.table && seated(c) && c.state !== 'toSeat') return { x: c.table.cx, y: c.table.cy - (c.size > 2 && c.table.size === 4 ? 150 : 96) };
    return { x: c.x, y: c.y - 124 };
  }
  function drawMember(c, i) {
    const p = memberPos(c, i);
    const moving = ['enter', 'toSeat', 'leaving', 'following'].includes(c.state);
    const bob = Math.sin(c.bob + i) * (moving ? 4 : 1.2);
    const sc = c.size > 1 ? 0.88 : 1, w = 96 * sc, h = 106 * sc;
    ctx.fillStyle = '#00000018'; ctx.beginPath(); ctx.ellipse(p.x, p.y, 24 * sc, 7, 0, 0, 7); ctx.fill();
    const away = c.state === 'leaving' || (moving && c.path.length && c.path[c.path.length - 1].y < c.y - 20);
    const im = away ? custImgBack(c.type.id) : custImg(c.type.id);
    if (im.complete) ctx.drawImage(im, p.x - w / 2, p.y - h + 4 + bob, w, h);
  }
  function drawPartyUI(c) {
    const a = anchor(c);
    if (c.state === 'leaving') { if (c.sayT > 0) bubble(a.x, a.y - 8, c.say, { size: 17 }); return; }
    if (G.selected === c) { ctx.strokeStyle = '#f2a33a'; ctx.lineWidth = 5; ctx.beginPath(); ctx.ellipse(c.x, c.y + 2, 30 + c.size * 14, 14, 0, 0, 7); ctx.stroke(); }
    for (let i = 0; i < 5; i++) heart(a.x - 40 + i * 20, a.y, 16, c.hearts >= i + 0.5 ? (c.hearts < 2 ? '#ff4d4d' : '#ef6f7a') : '#d9cfc6');
    if (c.watered) label('水', a.x + 62, a.y + 9, 16, '#4a7fb5');
    if (c.type.kind === 'omakase' && c.state !== 'queue' && c.state !== 'enter') label('随缘', a.x - 66, a.y + 9, 15, '#8a5a8a');
    const waiting = c.members.filter((m) => m.st === 'cook');
    if (c.sayT > 0) bubble(a.x, a.y - 8, c.say, { size: 17 });
    else if (c.state === 'thirsty') bubbleDish(a.x, a.y - 8, 'water', '先要水');
    else if (c.state === 'ordering') bubble(a.x, a.y - 8, c.upset ? '换一道！' : '点单！', { bg: '#fff3c4' });
    else if (c.state === 'reading') bubble(a.x, a.y - 8, '看菜单…', { size: 16 });
    else if (c.state === 'waitFood' && waiting.length) bubbleDish(a.x, a.y - 8, waiting[0].dish, waiting.length > 1 ? `还差${waiting.length}` : '');
    else if (c.state === 'called') bubble(a.x, a.y - 8, '等领位', { size: 16 });
    else if (c.state === 'bill') bubble(a.x, a.y - 8, '结账 ¥', { bg: '#e4f4d8' });
    else if (c.state === 'eating') bubble(a.x, a.y - 8, '好香～', { size: 16 });
    else if (c.state === 'queue' || c.state === 'enter') bubble(a.x, a.y - 8, `${c.size} 位`, { size: 16 });
  }
  function drawCat(img, x, y, face, walking, s = 1) {
    const t = performance.now() / 1000;
    const bob = walking ? Math.abs(Math.sin(t * 12)) * -6 : 0, rot = walking ? Math.sin(t * 12) * 0.06 : 0;
    ctx.fillStyle = '#00000020'; ctx.beginPath(); ctx.ellipse(x, y, 34 * s, 9 * s, 0, 0, 7); ctx.fill();
    ctx.save(); ctx.translate(x, y + bob); ctx.rotate(rot); ctx.scale((face < 0 ? -1 : 1) * s, s);
    if (img && img.complete) ctx.drawImage(img, -52, -110, 104, 114);
    ctx.restore();
    return bob;
  }
  function drawWaiter() {
    const w = G.waiter, walking = !!w.busyAct && w.path.length;
    const bob = drawCat(w.back && walking ? SPR.pB : (w.blinkT < 0 ? SPR.pBlink : SPR.pF), w.x, w.y, w.face, walking);
    w.hands.forEach((h, i) => drawHeld(h, w.x + (i ? 40 : -40), w.y - 52 + bob));
  }
  function drawStaff(sf) {
    const moving = sf.task && sf.path.length, resting = !sf.task && jobOf(sf.id) === 'rest';
    drawCat(sf.back && moving ? custImgBack(sf.id) : custImg(sf.id), sf.x, sf.y, sf.face, moving, sf.id === 'mimi' ? 0.75 : 0.88);
    sf.hands.forEach((h) => drawHeld(h, sf.x + 32, sf.y - 50));
    const tag = `${STAFF_DEF[sf.id].name}·${resting ? 'Zzz' : JOBS.find((j) => j.id === jobOf(sf.id)).n}`;
    label(tag, sf.x, sf.y + 18, 15, '#4a6384', '#fbf6ec');
  }
  const DANCE_SPOT = { x: 625, y: 676 };
  function drawDancer(x0, y0, k = 1) {
    const t = performance.now() / 1000, x = x0 + Math.sin(t * 4) * 14;
    ctx.globalAlpha = k;
    ctx.fillStyle = '#00000018'; ctx.beginPath(); ctx.ellipse(x, y0, 34, 9, 0, 0, 7); ctx.fill();
    ctx.save(); ctx.translate(x, y0 - Math.abs(Math.sin(t * 8)) * 14); ctx.rotate(Math.sin(t * 6) * 0.22); ctx.scale(Math.sin(t * 2) > 0 ? 1 : -1, 1);
    if (SPR.dancer.complete) ctx.drawImage(SPR.dancer, -52, -110, 104, 114);
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
      if (a.kind === 'tea' || a.kind === 'snack') { x = TEA.cx + 70; y = TEA.cy - 100; }
      if (a.kind === 'pass') { x = PASS.x + 6; y = PASS.y + 20 - (i % 2) * 10; }
      if (a.kind === 'water') { x = WATER.x + 30; y = WATER.y - 10; }
      ctx.fillStyle = '#f2a33a'; ctx.strokeStyle = '#fff'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(x, y, 17, 0, 7); ctx.fill(); ctx.stroke();
      label(`${i + 1}`, x, y + 1, 20, '#fff');
    });
  }
  function drawFloats(ox = 0, oy = 0) {
    for (const f of G.floats) {
      ctx.globalAlpha = Math.max(0, 1 - f.t / 1.6);
      label(f.text, f.x - ox, f.y - oy - f.t * 40, 26, f.col, '#fff', 5);
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
    for (const l of WORLD_LABELS) { x.font = `${l.size}px ${FONT}`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.lineJoin = 'round'; x.lineWidth = l.lw; x.strokeStyle = l.stroke; x.strokeText(l.t, l.x, l.y); x.fillStyle = l.fill; x.fillText(l.t, l.x, l.y); }
    WORLD_CV = c; return c;
  }
  function renderDay() {
    const D = G.D, cam = D.cam, wc = worldCanvas();
    if (wc) ctx.drawImage(wc, cam.x * WS, cam.y * WS, W * WS, H * WS, 0, 0, W, H);
    else { ctx.fillStyle = '#d5dfb8'; ctx.fillRect(0, 0, W, H); }
    ctx.save(); ctx.translate(-cam.x, -cam.y);
    const items = [];
    WMAP.farm.plots.forEach(([x, y], i) => {
      const f = save.farm[i], ripe = plotReady(i), img = CROP_IMG[f.crop + (ripe ? 1 : 0)];
      for (let j = 0; j < 3; j++) items.push({ y: y + 30, d: () => { if (img.complete) ctx.drawImage(img, x - 75 + j * 50, y - 42, 56, 56); } });
      if (ripe) items.push({ y: 9999, d: () => label(`${ING[f.crop].n} · 熟了`, x, y - 66, 18, '#fbf3e2', '#5a6b3c') });
    });
    if (save.coopDay !== save.day) items.push({ y: 9999, d: () => { const im = ING_IMG.egg; if (im.complete) ctx.drawImage(im, 2190, 470, 40, 40); label('有蛋', 2210, 466, 16, '#fbf3e2', '#7a5a2c'); } });
    items.push({ y: WMAP.market.y + 150, d: () => { drawCat(SPR.vendor, WMAP.market.x + 150, WMAP.market.y + 150, 1, false, 0.8); label(`今日特价：${ING[special()].n}`, WMAP.market.x + 150, WMAP.market.y + 186, 17, '#fbf3e2', '#8a3a2c'); } });
    items.push({ y: WMAP.plaza.cy, d: () => drawDancer(WMAP.plaza.cx, WMAP.plaza.cy, 1) });
    items.push({ y: 720, d: () => drawCat(custImg('laoer'), 1120, 720, -1, false, 0.8) });
    items.push({ y: 680, d: () => drawCat(custImg('mimi'), 1860, 680 + Math.sin(performance.now() / 300) * 4, 1, false, 0.7) });
    items.push({ y: D.y, d: () => {
      const walking = D.path.length > 0;
      drawCat(D.back && walking ? SPR.pB : SPR.pF, D.x, D.y, D.face, walking);
      if (D.fish > 0) { const t = performance.now() / 300; ctx.strokeStyle = '#2c2420'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(D.x + 30, D.y - 70); ctx.quadraticCurveTo(D.x + 90, D.y - 110, D.x + 130, D.y - 10 + Math.sin(t) * 3); ctx.stroke(); ctx.fillStyle = '#d9453a'; ctx.beginPath(); ctx.arc(D.x + 130, D.y - 8 + Math.sin(t) * 3, 6, 0, 7); ctx.fill(); label('钓鱼中…', D.x, D.y - 130, 18, '#fbf3e2', '#3f6680'); }
    } });
    items.sort((a, b) => a.y - b.y).forEach((i) => i.d());
    if (D.task) { const s = D.task.spot(); ctx.strokeStyle = '#f2a33a'; ctx.lineWidth = 4; ctx.beginPath(); ctx.ellipse(s.x, s.y, 26, 9, 0, 0, 7); ctx.stroke(); }
    ctx.restore();
    drawFloats(cam.x, cam.y);
  }
  function render() {
    ctx.setTransform(scale * dpr, 0, 0, scale * dpr, 0, 0);
    if (!G) { ctx.fillStyle = '#f3ead9'; ctx.fillRect(0, 0, W, H); return; }
    if (G.mode === 'day') { renderDay(); return; }
    drawRoom(); drawKitchen();
    const items = [];
    G.tables.forEach((t) => items.push({ y: t.cy, d: () => drawTable(t) }));
    G.customers.forEach((c) => { for (let i = 0; i < c.size; i++) { const p = memberPos(c, i); items.push({ y: p.y + 0.5, d: () => drawMember(c, i) }); } });
    items.push({ y: G.waiter.y, d: drawWaiter });
    G.staff.forEach((sf) => items.push({ y: sf.y, d: () => drawStaff(sf) }));
    items.push({ y: TEA.cy, d: drawTeaCart });
    if (G.dancer) items.push({ y: DANCE_SPOT.y, d: () => drawDancer(DANCE_SPOT.x, DANCE_SPOT.y, Math.min(1, (4 - G.dancer.t) * 3, G.dancer.t * 3)) });
    items.sort((a, b) => a.y - b.y).forEach((i) => i.d());
    G.customers.forEach(drawPartyUI);
    drawQueueBadges();
    drawFloats();
  }
