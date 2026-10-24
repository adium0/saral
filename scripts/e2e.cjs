const { chromium } = require('playwright');
const fs = require('fs');
const AXE = fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
const OUT = process.env.SHOTS;
const BASE = 'http://localhost:5173';
const errors = [];
async function axe(page, name) {
  await page.addScriptTag({ content: AXE });
  const r = await page.evaluate(async () => {
    const res = await window.axe.run(document, { runOnly: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa', 'best-practice'] });
    return res.violations.map((v) => `${v.impact} ${v.id}: ${v.nodes.length} · ${v.nodes.slice(0, 2).map((n) => n.target.join(' ')).join(' | ')}`);
  });
  console.log(`AXE ${name}:`, r.length ? '\n  ' + r.join('\n  ') : 'clean');
}
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 860 } });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  page.on('console', (m) => m.type() === 'error' && errors.push(`console: ${m.text()}`));
  const step = process.argv[2] || 'all';

  await page.goto(BASE + '/');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${OUT}/landing-top.png` });
  await axe(page, 'landing');
  await page.mouse.wheel(0, 500);
  await page.waitForTimeout(900);
  await page.screenshot({ path: `${OUT}/landing-scroll1.png` });
  await page.mouse.wheel(0, 600);
  await page.waitForTimeout(900);
  await page.screenshot({ path: `${OUT}/landing-scroll2.png` });
  await page.screenshot({ path: `${OUT}/landing-full.png`, fullPage: true });

  await page.goto(BASE + '/start');
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${OUT}/welcome.png`, fullPage: true });
  await axe(page, 'welcome');

  await page.goto(BASE + '/library');
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${OUT}/library.png`, fullPage: true });
  await axe(page, 'library');
  const t0 = Date.now();
  await page.getByRole('button', { name: /Cell Structure/ }).click();
  await page.waitForURL(/\/read\//);
  await page.waitForSelector('#p1');
  console.log('sample open ms', Date.now() - t0);
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${OUT}/reader.png` });
  await axe(page, 'reader');

  // AI simplify on section (cached)
  await page.locator('[data-pid="p10"] button').first().click();
  await page.getByRole('button', { name: 'Simplify', exact: true }).click();
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${OUT}/reader-simplified.png` });
  await page.getByRole('button', { name: /Summarize/ }).click();
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${OUT}/reader-summary.png` });
  const terms = await page.locator('.term').count();
  console.log('glossary terms underlined', terms);

  // Compare
  await page.getByRole('button', { name: 'Compare' }).click();
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${OUT}/reader-compare.png` });
  await page.getByRole('button', { name: 'Compare' }).click();

  // Display dialog
  await page.getByRole('button', { name: 'Display' }).click();
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${OUT}/reader-display.png` });
  await page.keyboard.press('Escape');

  // Presets via welcome
  await page.goto(BASE + '/start');
  await page.getByRole('button', { name: /Dyslexia-friendly/ }).click();
  await page.waitForURL(/library/);
  await page.getByRole('link', { name: /Cell Structure/ }).first().click();
  await page.waitForSelector('#p1');
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${OUT}/reader-dyslexia.png` });
  await page.goto(BASE + '/start');
  await page.getByRole('button', { name: /Low vision/ }).click();
  await page.getByRole('link', { name: /Cell Structure/ }).first().click();
  await page.waitForSelector('#p1');
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${OUT}/reader-lowvision.png` });
  await axe(page, 'reader low vision');
  await page.goto(BASE + '/start');
  await page.getByRole('button', { name: /Focus/ }).click();
  await page.getByRole('link', { name: /Operating Systems/ }).first().click().catch(async () => {
    await page.getByRole('button', { name: /Operating Systems/ }).click();
  });
  await page.waitForSelector('#p1');
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${OUT}/reader-focus.png` });

  await page.goto(BASE + '/captions');
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${OUT}/captions.png`, fullPage: true });
  await axe(page, 'captions');
  await page.goto(BASE + '/settings');
  await page.screenshot({ path: `${OUT}/settings.png`, fullPage: true });
  await axe(page, 'settings');
  await page.goto(BASE + '/help');
  await axe(page, 'help');
  await page.goto(BASE + '/about');
  await axe(page, 'about');

  // Mobile 320px reflow
  const m = await browser.newContext({ viewport: { width: 320, height: 640 } });
  const mp = await m.newPage();
  for (const path of ['/', '/library', '/start', '/captions', '/settings']) {
    await mp.goto(BASE + path);
    await mp.waitForTimeout(700);
    const over = await mp.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    console.log('320px', path, 'horizontal overflow px:', over);
  }
  await mp.goto(BASE + '/library');
  await mp.getByRole('button', { name: /Cell Structure/ }).click();
  await mp.waitForSelector('#p1');
  await mp.waitForTimeout(500);
  const over = await mp.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  console.log('320px reader overflow', over);
  await mp.screenshot({ path: `${OUT}/m-reader.png` });
  await mp.goto(BASE + '/');
  await mp.waitForTimeout(800);
  await mp.screenshot({ path: `${OUT}/m-landing.png` });
  console.log('ERRORS:\n' + [...new Set(errors)].join('\n'));
  await browser.close();
})();
