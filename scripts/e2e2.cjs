const { chromium } = require('playwright');
const OUT = process.env.SHOTS;
(async () => {
  const b = await chromium.launch();
  const p = await (await b.newContext({ viewport: { width: 1366, height: 860 } })).newPage();
  const errs = [];
  p.on('console', (m) => m.type() === 'error' && errs.push(m.text()));
  await p.goto('http://localhost:5173/');
  await p.waitForTimeout(1200);
  for (let i = 1; i <= 9; i++) {
    await p.mouse.wheel(0, 800);
    await p.waitForTimeout(700);
    await p.screenshot({ path: `${OUT}/scroll-${i}.png` });
  }
  const m = await (await b.newContext({ viewport: { width: 320, height: 640 } })).newPage();
  for (const path of ['/settings', '/library']) {
    await m.goto('http://localhost:5173' + path);
    await m.waitForTimeout(800);
    const wide = await m.evaluate(() => [...document.querySelectorAll('body *')].filter((e) => e.getBoundingClientRect().right > 321).slice(0, 5).map((e) => e.tagName + '.' + (e.className?.toString?.() || '').slice(0, 60) + ' ' + Math.round(e.getBoundingClientRect().right)));
    console.log(path, wide);
  }
  await m.getByRole('button', { name: /Cell Structure/ }).click();
  await m.waitForSelector('#p1');
  await m.waitForTimeout(400);
  console.log('reader overflow', await m.evaluate(() => document.documentElement.scrollWidth - 320));
  await m.screenshot({ path: `${OUT}/m-reader2.png` });
  await m.getByRole('button', { name: 'Compare' }).click();
  await m.waitForTimeout(2000);
  await m.screenshot({ path: `${OUT}/m-compare.png` });
  const d = await (await b.newContext({ viewport: { width: 1366, height: 860 } })).newPage();
  await d.goto('http://localhost:5173/library');
  await d.getByRole('button', { name: /Cell Structure/ }).click();
  await d.waitForSelector('#p1');
  await d.getByRole('button', { name: 'Compare' }).click();
  await d.waitForTimeout(2500);
  await d.screenshot({ path: `${OUT}/compare2.png` });
  console.log('errors', errs);
  await b.close();
})();
