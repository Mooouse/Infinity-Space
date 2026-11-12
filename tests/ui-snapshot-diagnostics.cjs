/* One-time actionable screenshots for design regression review.
   Emit small JPEGs as single console markers so GitHub CI can be inspected
   even when the local workstation has no network access. */
'use strict';
const {chromium}=require('playwright');
const root=process.env.INFINITI_SMOKE_URL||'http://127.0.0.1:8765';
(async()=>{
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader-webgl']});
async function visit(path,width,height,label,fn){
 const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:1, reducedMotion:'reduce'});
 const page=await context.newPage();
 await page.addInitScript(()=>{
  localStorage.setItem('infinity-space-player-v1',JSON.stringify({version:1,nickname:'Interface QA'}));
  localStorage.setItem('infiniti-space-language','ru');
  localStorage.setItem('infinity-space-mode-guide-v2:arena','1');
 });
 try{
  await page.goto(root+path,{waitUntil:'domcontentloaded',timeout:65000});
  if(fn)await fn(page);
  await page.waitForTimeout(400);
  const buffer=await page.screenshot({type:'jpeg',quality:36,animations:'disabled'});
  console.log('VISUAL_SCREENSHOT_'+label+'='+buffer.toString('base64'));
  const rects=await page.evaluate(()=>[...document.querySelectorAll('button,input,select')].filter(el=>{
   const s=getComputedStyle(el),r=el.getBoundingClientRect();return s.display!=='none'&&s.visibility!=='hidden'&&r.width>3&&r.height>3;
  }).map(el=>{const r=el.getBoundingClientRect();return {id:el.id||String(el.className).slice(0,35),x:Math.round(r.x),y:Math.round(r.y),w:Math.round(r.width),h:Math.round(r.height)};}).slice(0,25));
  console.log('VISUAL_RECTS_'+label+'='+JSON.stringify(rects));
 }catch(err){console.log('VISUAL_ERROR_'+label+'='+String(err.stack||err).slice(0,600));}
 await context.close();
}
const openWorm=async(page)=>{
 await page.waitForFunction(()=>!!window.InfinityWormsQA,{timeout:25000});
 await page.locator('#worm-guide-skip').click({timeout:13000});
 await page.locator('#worm-pause').click({timeout:13000});
};
try{
 await visit('/index.html?tester=1',1366,768,'home-desktop',p=>p.locator('#screen-menu .hub-mode-story-play').waitFor({state:'visible',timeout:25000}));
 await visit('/index.html?tester=1',390,844,'home-phone',p=>p.locator('#screen-menu .hub-mode-story-play').waitFor({state:'visible',timeout:25000}));
 await visit('/index.html?tester=1',1366,768,'settings-desktop',async p=>{
  await p.locator('.hub-story-shortcut[data-shortcut="settings"]').click();
  await p.locator('#screen-settings').waitFor({state:'visible',timeout:15000});
 });
 await visit('/index.html?tester=1',1366,768,'achievements-desktop',async p=>{
  await p.locator('.hub-story-shortcut[data-shortcut="achievements"]').click();
  await p.locator('#screen-achievements').waitFor({state:'visible',timeout:15000});
 });
 await visit('/index.html?tester=1',1366,768,'statistics-desktop',async p=>{
  await p.locator('.hub-mode-dots [data-mode="worms"]').click();
  await p.locator('.hub-story-shortcut[data-shortcut="statistics"]').click();
  await p.locator('.infinity-stats-panel').waitFor({state:'visible',timeout:12000});
 });
 await visit('/cosmic-worms.html?tester=1',1366,768,'worms-pause-desktop',openWorm);
 await visit('/cosmic-worms.html?tester=1',390,844,'worms-pause-phone',openWorm);
 await visit('/cosmic-worms.html?tester=1',1366,768,'worms-settings-desktop',async p=>{
  await openWorm(p);await p.locator('#worm-settings-open').click();
 });
 await visit('/cosmic-worms.html?tester=1',1366,768,'worms-skins-desktop',async p=>{
  await openWorm(p);await p.locator('#worm-skins-open').click();
 });
 await visit('/cosmic-arena.html?mode=arena&tester=1',1366,768,'arena-pause-desktop',async p=>{
  await p.locator('#hud:not([hidden])').waitFor({state:'visible',timeout:15000});
  await p.locator('#pause').click();
  await p.locator('#paused').waitFor({state:'visible'});
 });
}finally{await browser.close();}
})().catch(e=>{console.error('UI_SNAPSHOT_FATAL',String(e.stack||e));process.exitCode=1;});
