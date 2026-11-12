// Per-mode achievements: real persisted match stats, independent catalogs and
// the always-visible competitive nickname input in the centered mode picker.
'use strict';
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const base=process.env.INFINITI_SMOKE_URL||'http://127.0.0.1:8765';
(async()=>{
 const browser=await chromium.launch({headless:true,args:[
  '--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader',
  '--use-gl=angle','--use-angle=swiftshader-webgl'
 ]});
 const context=await browser.newContext({viewport:{width:1280,height:800},deviceScaleFactor:1});
 const page=await context.newPage(),errors=[];
 page.on('pageerror',err=>errors.push(String(err.stack||err)));
 try{
  await page.addInitScript(()=>{
   localStorage.setItem('infinity-space-player-v1',JSON.stringify({version:1,nickname:'Mode Explorer'}));
  });
  await page.goto(base+'/index.html?tester=1',{waitUntil:'domcontentloaded',timeout:50000});
  const ids=['worms','arena','royale','core','race'];
  const firstTitles=new Set();
  for(let i=0;i<ids.length;i++){
   const mode=ids[i];
   await page.locator('.hub-mode-dots button').nth(i+1).click();
   const input=page.locator('.hub-mode-nickname input');
   assert.equal(await input.isVisible(),true,mode+' nickname field must remain visible');
   assert.equal(await input.inputValue(),'Mode Explorer',mode+' must share the saved callsign');
   await page.locator('.hub-story-shortcut[data-shortcut="achievements"]').click();
   const popup=page.locator('.infinity-mode-achievements-overlay');
   await popup.waitFor({state:'visible',timeout:6000});
   assert.ok((await popup.locator('.infinity-mode-achievement').count())>=18,mode+' must have expanded achievements');
   const snap=await page.evaluate(id=>window.InfinityProfile.achievementStats(id),mode);
   assert.equal(snap.earned,0,'No fabricated unlocks in '+mode);
   assert.ok(snap.items.length>=18);
   firstTitles.add(snap.items[0].title);
   assert.ok(snap.items.every(a=>a.percent===0),'New achievements begin at zero');
   const heading=await popup.locator('.infinity-panel-top small').textContent();
   assert.ok(heading.length>14,'Achievements must identify the selected mode');
   await popup.locator('.infinity-overlay-close').click();
   assert.equal(await popup.count(),0,'Achievements should close without changing mode');
  }
  assert.equal(firstTitles.size,5,'Each competitive mode must have original achievements');
  // Real game scripts call exactly this persistent recordMatch API after a match.
  await page.evaluate(()=>{
   window.InfinityProfile.recordMatch('arena',{win:true,place:1,kills:11,objects:270,mass:720,time:210});
   window.InfinityProfile.recordMatch('worms',{win:false,place:40,kills:0,objects:17,mass:38,time:75});
  });
  const state=await page.evaluate(()=>({
   arena:window.InfinityProfile.achievementStats('arena'),
   worms:window.InfinityProfile.achievementStats('worms'),
   royale:window.InfinityProfile.achievementStats('royale'),
   storage:JSON.parse(localStorage.getItem('infinity-space-mode-achievements-v1')||'{}')
  }));
  assert.ok(state.arena.earned>=3,'Arena completes first match, collection and predator goals');
  assert.ok(state.worms.earned>=1,'Worms unlock only their own first-match achievement');
  assert.equal(state.royale.earned,0,'Royale must not inherit Arena or Worms unlocks');
  assert.equal(state.storage.arena.first,true);
  assert.equal(state.storage.worms.first,true);
  assert.equal(state.storage.royale?.first,undefined);
  await page.reload({waitUntil:'domcontentloaded'});
  await page.locator('.hub-mode-dots button').nth(2).click();
  assert.ok((await page.evaluate(()=>window.InfinityProfile.achievementStats('arena'))).earned>=3,
   'Arena unlocks persist across reload');
  await page.locator('.hub-story-shortcut[data-shortcut="achievements"]').click();
  assert.ok((await page.locator('.infinity-mode-achievement.unlocked').count())>=3);
  await page.locator('.infinity-overlay-close').click();
  assert.equal(errors.length,0,errors.join('\n'));
  console.log('PASS: six original achievements per mode, isolated progress, match-based unlocks and persistence');
 }finally{await browser.close();}
})().catch(err=>{console.error(err.stack||err);process.exitCode=1;});
