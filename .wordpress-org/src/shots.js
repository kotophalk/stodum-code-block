const { chromium } = require('playwright-core');
const fs = require('fs');
const os = require('os');
const OUT = process.argv[2];
const BASE = 'http://localhost:8891';
(async () => {
  const exe = fs.readdirSync(os.homedir()+'/.cache/ms-playwright').filter(d=>d.startsWith('chromium-'))[0];
  const browser = await chromium.launch({ executablePath: os.homedir()+'/.cache/ms-playwright/'+exe+'/chrome-linux/chrome', args:['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport:{width:1280,height:800}, deviceScaleFactor:2, locale:'ru-RU' });
  const page = await ctx.newPage();
  await page.goto(BASE+'/wp-login.php');
  await page.fill('#user_login','admin'); await page.fill('#user_pass','password');
  await Promise.all([page.waitForNavigation(), page.click('#wp-submit')]);
  // 1. frontend — anonymous context (no admin bar)
  const anon = await browser.newContext({ viewport:{width:1280,height:800}, deviceScaleFactor:2, locale:'ru-RU' });
  const fp = await anon.newPage();
  await fp.goto(BASE+'/kodosvet-demo/', {waitUntil:'networkidle'});
  await fp.waitForTimeout(800);
  await fp.evaluate(()=>window.scrollTo(0, document.querySelector('.stodum-code-wrapper').getBoundingClientRect().top + window.scrollY - 120));
  await fp.waitForTimeout(300);
  await fp.screenshot({path:OUT+'/screenshot-1.png'});
  // 4. theme toggle → light, line numbers on
  await fp.click('.stodum-code-wrapper .stodum-code-theme-toggle');
  await fp.waitForTimeout(400);
  await fp.click('.stodum-code-wrapper .stodum-code-lines-toggle');
  await fp.waitForTimeout(400);
  await fp.evaluate(()=>document.activeElement && document.activeElement.blur());
  await fp.waitForTimeout(200);
  await fp.screenshot({path:OUT+'/screenshot-4.png'});
  await anon.close();
  // 2. editor
  const postId = process.argv[3];
  await page.goto(BASE+'/wp-admin/post.php?post='+postId+'&action=edit', {waitUntil:'load', timeout:90000});
  await page.waitForSelector('.editor-styles-wrapper, iframe[name="editor-canvas"]', {timeout:90000});
  await page.waitForTimeout(3000);
  // close welcome guide if any
  for (const sel of ['button[aria-label="Close"]','.components-guide button[aria-label="Закрыть"]','.components-modal__header button']) {
    const b = await page.$(sel); if (b) { try { await b.click({timeout:1000}); } catch(e){} }
  }
  await page.waitForTimeout(500);
  const hasFrame = await page.$('iframe[name="editor-canvas"]');
  const scope = hasFrame ? page.frameLocator('iframe[name="editor-canvas"]') : page;
  console.log('iframe:', !!hasFrame);
  const blk = scope.locator('[data-type="stodum/code-block"]').first();
  try { await blk.click({position:{x:400,y:120}}); await page.waitForTimeout(600);
        const tab = page.getByRole('tab',{name:/^Block$/}); if (await tab.count()) { await tab.first().click(); await page.waitForTimeout(600);} }
  catch(e){ console.log('select failed', e.message); }
  await page.screenshot({path:OUT+'/screenshot-2.png'});
  // 3. migrator
  await page.goto(BASE+'/wp-admin/tools.php?page=stodum-code-block', {waitUntil:'load', timeout:90000});
  await page.waitForTimeout(500);
  const scan = await page.$('#cs-scan-btn, #stodum-scan-btn, button.cs-scan, #scan-posts');
  const btn = scan || (await page.getByRole('button',{name:/scan/i}).first());
  try { await btn.click(); await page.waitForTimeout(2500); } catch(e){ console.log('scan click failed', e.message); }
  await page.evaluate(()=>{ const h=[...document.querySelectorAll('h2')].find(x=>/Migrator/.test(x.textContent)); if(h) window.scrollTo(0, h.getBoundingClientRect().top + window.scrollY - 60); });
  await page.waitForTimeout(300);
  await page.screenshot({path:OUT+'/screenshot-3.png'});
  try { await page.locator('.cs-preview-btn').first().click(); await page.waitForTimeout(1500); await page.screenshot({path:OUT+'/screenshot-5.png'}); } catch(e){ console.log('preview failed', e.message); }
  await browser.close();
})().catch(e=>{console.error(e);process.exit(1);});
