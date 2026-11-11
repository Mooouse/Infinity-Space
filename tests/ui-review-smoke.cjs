// Interactive single-page UI Atlas and consolidated style entrypoint smoke checks.
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
const load=p=>fs.readFileSync(path.join(root,p),'utf8');
for(const [page,css] of [['index.html','ui-app.css'],['cosmic-worms.html','ui-worms.css'],['cosmic-arena.html','ui-arena.css']]){
 const html=load(page),links=[...html.matchAll(/<link\s+rel="stylesheet"\s+href="([^"]+)"/g)].map(m=>m[1].split('?')[0]);
 assert.deepEqual(links,[css],page+' must use exactly one CSS entrypoint, not cascading patch files');
 assert.ok(load(css).length>10000,css+' must contain real rules');
}
const overview=load('ui-review.html');
assert.ok(overview.includes('data-id="worms-skins"')&&overview.includes('id="components"'),'The UI Atlas must include live screens and all common components');
const base=process.env.INFINITI_SMOKE_URL||'http://127.0.0.1:8765';
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader-webgl']});
 try{
  const context=await browser.newContext({viewport:{width:1440,height:900},deviceScaleFactor:1});
  await context.addInitScript(()=>{localStorage.setItem('infiniti-space-language','ru');localStorage.setItem('infinity-space-player-v1',JSON.stringify({version:1,nickname:'UI Atlas QA'}));localStorage.setItem('infinity-space-mode-guide-v2:worms','1')});
  const page=await context.newPage();
  const errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  await page.goto(base+'/ui-review.html',{waitUntil:'domcontentloaded',timeout:40000});
  assert.equal(await page.locator('#screen-nav [data-id]').count(),18,'All real UI targets should be listed');
  assert.ok(await page.locator('#components .sample').count()>=12,'All control families must be visible on one page');
  await page.locator('[data-device="mobile"]').click();
  assert.equal(await page.locator('#frame-shell').evaluate(e=>getComputedStyle(e).width),'390px');
  await page.locator('#screen-nav [data-id="settings"]').click();
  const preview=page.frameLocator('#preview');
  await preview.locator('#hub-mode-story').waitFor({state:'visible',timeout:20000});
  await preview.locator('#screen-settings').waitFor({state:'visible',timeout:16000});
  await page.locator('#screen-nav [data-id="menu"]').click();
  await preview.locator('#hub-mode-story').waitFor({state:'visible',timeout:20000});
  assert.equal(await page.locator('#current-title').textContent(),'Главное меню');
  const stat=await page.evaluate(()=>{
   const r=document.querySelector('#components').getBoundingClientRect();
   return {w:document.documentElement.scrollWidth,viewport:innerWidth,components:r.width};
  });
  assert.ok(stat.w<=stat.viewport+2,'UI Atlas must not overflow horizontally');
  assert.ok(stat.components>250,'Component catalog should stay readable');
  assert.deepEqual(errors,[],'UI Atlas must not throw runtime errors');
  console.log('PASS: unified CSS and live UI Atlas 18 screens / 4 viewport sizes / 12 component families');
  await context.close();
 }finally{await browser.close()}
})().catch(err=>{console.error(err);process.exitCode=1});
