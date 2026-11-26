const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
(async () => {
  const launchOptions = process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {};
  const b = await chromium.launch(launchOptions);
  const p = await (await b.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 2 })).newPage();
  const errs = []; p.on('pageerror', (e) => errs.push(e.message)); p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
  await p.goto(pathToFileURL(path.join(__dirname, 'dist', 'index.html')).href); await p.waitForTimeout(300);
  await p.fill('#new-name', '妈妈'); await p.click('#new-save .big'); await p.click('#start-tip');
  for (const [day, name] of [[23, 'winter'], [16, 'autumn']]) {
    await p.evaluate((d) => { const P = window.__penpen; P.save.day = d; P.save.mailDay = 1; P.newDay(); document.getElementById('start-tip').classList.remove('show'); }, day);
    await p.waitForTimeout(1500); await p.screenshot({ path: `shot-season-${name}.png` });
  }
  console.log('mail', await p.evaluate(() => window.__penpen.save.mail));
  await p.evaluate(() => window.__penpen.dayTap({ x: 1317, y: 620 }));
  await p.waitForFunction(() => document.getElementById('mail').classList.contains('show'), null, { timeout: 15000 });
  await p.screenshot({ path: 'shot-mail.png' });
  await p.click('#mail-ok');
  console.log('cards', await p.evaluate(() => JSON.stringify([window.__penpen.save.cards, window.__penpen.save.stock, window.__penpen.save.coins])));
  await p.evaluate(() => window.__penpen.openDex('card')); await p.waitForTimeout(300); await p.screenshot({ path: 'shot-dexcard.png' });
  await p.click('#dex-ok');
  await p.evaluate(() => window.__penpen.openShop()); await p.waitForTimeout(1200); await p.screenshot({ path: 'shot-shop-autumn.png' });
  console.log('errors:', errs.length ? errs.join('\n') : 'none'); await b.close();
})();
