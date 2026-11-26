// 跟着引导自己玩：每次读当前提示，点它指的地方。用来检查引导能不能把一整天带完。
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const DAYS = +(process.argv[2] || 2), START = +(process.argv[3] || 1);
(async () => {
  const launchOptions = process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {};
  const b = await chromium.launch(launchOptions);
  const p = await (await b.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 2 })).newPage();
  const errs = []; p.on('pageerror', (e) => errs.push(e.message)); p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
  const GB = process.env.GREYBOX; // two / five：在灰盒入口跑一班
  await p.goto(pathToFileURL(path.join(__dirname, 'dist', GB ? 'greybox.html' : 'index.html')).href); await p.waitForTimeout(400);
  await p.evaluate(() => { window.__penpen.DBG.all = true; window.__penpen.DBG.speed = 3; });
  if (GB) { await p.evaluate((n) => window.__penpen.gbStart(n), GB); await p.waitForTimeout(500); }
  else { await p.fill('#new-name', '测试'); await p.click('#new-save .big'); await p.waitForTimeout(500); }
  const ev = (fn, a) => p.evaluate(fn, a);
  const shot = async (n) => p.screenshot({ path: `bot-${n}.png` });
  if (START > 1 && !GB) await p.evaluate((d) => { const P = window.__penpen, s = P.save; document.getElementById('start-tip').classList.remove('show'); s.day = d; s.coins = 600; Object.assign(s.stock, { tofu: 10, beef: 10, chili: 6, peanut: 6, fish: 4, shrimp: 4, egg: 4 }); s.did = { seat: 9, order: 9, go: 9, pass: 9, pick: 9, serve: 9, pay: 9, bus: 9, sink: 9, req: 9, oma: 9, next: 9, menu: 9, mok: 9, open: 9, ask: 9, water: 9, buy: 9, seed: 9, plant: 9, harvest: 9, fish: 9, mail: 9 }; P.newDay(); document.getElementById('tip-body') && null; }, START);
  await shot('d1-card');
  const log = []; let lastType = '', same = 0, shots = {}, nh = 0;
  for (let step = 0; step < 2500; step++) {
    const st = await ev(() => { const P = window.__penpen, G = P.G, s = P.save; return { day: s && s.day, mode: G && G.mode, over: G && G.over, card: document.getElementById('start-tip').classList.contains('show'), result: document.getElementById('result').classList.contains('show'), h: P.hint && { ...P.hint, el: undefined } }; });
    if (st.day > DAYS) break;
    if (st.card) { await shot(`d${st.day}-card`); await p.click('#start-tip'); await p.waitForTimeout(300); continue; }
    const h = st.h;
    if (!h) { nh = (nh || 0) + 1; if (nh % 20 === 0) { log.push('nohint ' + JSON.stringify(await ev(() => { const G = window.__penpen.G; return { t: G.t|0, mode: G.mode, paused: G.paused, idle: G.idle|0, cust: G.customers.map((c) => c.state), q: G.waiter.queue.length, screens: [...document.querySelectorAll('.screen.show,.modal.show,#start-tip.show')].map((e) => e.id) }; }))); await shot('nohint'); if (nh > 200) break; } await p.waitForTimeout(400); continue; }
    const key = `d${st.day}-${h.type}`;
    if (!shots[key]) { shots[key] = 1; await shot(key); log.push(`${key}:${h.text}`); }
    if (h.sel) await ev(() => { const h = window.__penpen.hint; h.el && h.el.click(); });
    else if (st.mode === 'day') await ev(([x, y]) => window.__penpen.dayTap({ x, y }), [h.wx, h.wy]);
    else { const r = await ev(() => { const b = document.getElementById('game').getBoundingClientRect(); const s = Math.min(b.width / 1280, b.height / 720); return { l: b.left + (b.width - 1280 * s) / 2, t: b.top + (b.height - 720 * s) / 2, s }; }); await p.mouse.click(r.l + h.x * r.s, r.t + h.y * r.s); } // T-15：画布铺满，场景居中
    await p.waitForTimeout(h.type === 'open' ? 900 : 500);
    if (key === lastType) same++; else { same = 0; lastType = key; }
    if (same > 60) { log.push('STUCK ' + key); await shot('stuck'); break; }
  }
  if (GB) { const g = await ev(() => { const P = window.__penpen; document.querySelectorAll('.show').forEach((e) => e.id !== 'hud-screen' && e.classList.remove('show')); document.getElementById('hud-screen').classList.add('show'); P.GB.show.trail = true; P.GB.show.foot = true; P.GB.show.stand = true; const G = P.G, L = P.LAYOUT, inPoly = (x, y, Q) => { let c = false; for (let i = 0, j = Q.length - 1; i < Q.length; j = i++) { const [xi, yi] = Q[i], [xj, yj] = Q[j]; if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c; } return c; };
      const walls = L.items.filter((it) => it.kind === 'wall').map((it) => it.footprint); // 墙和台体：任何人都不该走进去
      const wallHits = P.GB.trail.filter(([who, x, y]) => walls.some((Q) => inPoly(x, y, Q))).map(([who, x, y]) => who + '@' + Math.round(x) + ',' + Math.round(y));
      const pl = G.plates, k = G.kitchen, hand = (h) => (h.kind === 'dish' ? 1 : h.kind === 'plate' ? h.n || 1 : 0);
      const plates = P.gbPlates();
      const expected = 4 + G.tables.reduce((a, t) => a + t.size, 0);
      return { plateLog: P.GB.plateLog.slice(0, 12), unreach: G.unreach || [], trail: P.GB.trail.length, wallHits: wallHits.slice(0, 10), wallHitCount: wallHits.length, plates: { expected, counted: plates }, tables: G.tables.map((t) => t.id) }; }); log.push('GREYBOX ' + JSON.stringify(g)); await p.waitForTimeout(300); await shot('greybox-' + GB + '-trail'); }
  const fin = await ev(() => { const s = window.__penpen.save; return { dish: s.dishDex, day: s.day, coins: s.coins, did: s.did, hist: s.history, stock: s.stock, seeds: s.seeds, farm: s.farm }; });
  console.log(log.join('\n')); console.log(JSON.stringify(fin));
  console.log('errors:', errs.length ? errs.slice(0, 5).join('\n') : 'none');
  if (errs.length || fin.day <= DAYS || (GB && !Object.values(fin.dish).some((count) => count > 0))) {
    console.error('Regression failed: expected days did not finish, a browser error occurred, or the greybox served no meals.');
    process.exitCode = 1;
  }
  await b.close();
})();
