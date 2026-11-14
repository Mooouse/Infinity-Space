'use strict';
// CrazyGames ad regression: native SDK callbacks mocked, zero external ad requests.
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const base=process.env.INFINITI_SMOKE_URL||'http://127.0.0.1:8765';
function seed(){
 localStorage.setItem('infiniti-space-language','en');
 localStorage.setItem('infinity-space-player-v1',JSON.stringify({version:1,nickname:'Ads QA'}));
 for(const mode of ['worms','arena','royale','core','race'])
  localStorage.setItem('infinity-space-mode-guide-v2:'+mode,'1');
 localStorage.removeItem('infinity-space-crazy-worm-rewards-v1');
}
function installAds(){
 window.__midgames=0;
 window.SpaceCrazyAds={supported:true,available:true,rewarded:async()=>false,
  midgame:async()=>{window.__midgames++;return false}};
}
(async()=>{
 const browser=await chromium.launch({headless:true,args:[
  '--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader',
  '--use-gl=angle','--use-angle=swiftshader-webgl'
 ]});
 const errors=[];
 try{
  const page=await browser.newPage({viewport:{width:980,height:700}});
  page.on('pageerror',error=>errors.push(String(error.stack||error).slice(0,450)));
  await page.addInitScript(seed);
  await page.goto(base+'/cosmic-worms.html?tester=1',{waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForFunction(()=>!!window.InfinityWormsQA&&!!window.WormSkinStudio,{timeout:30000});
  await page.evaluate(installAds);
  await page.evaluate(()=>window.InfinityWormsQA.testProtection(120));
  if(await page.locator('#worm-guide').isVisible())await page.locator('#worm-guide-skip').click();
  await page.locator('#worm-pause').click();
  await page.locator('#worm-skins-open').click();
  await page.locator('.ws-preset[data-skin="adnova"]').waitFor({state:'visible'});
  assert.equal(await page.locator('.ws-preset').count(),18);
  assert.equal(await page.locator('.ws-head-choice').count(),32);
  assert.equal(await page.evaluate(()=>window.WormSkinStudio.isUnlocked('adnova')),false);
  assert.equal(await page.evaluate(()=>window.WormSkinStudio.isHeadUnlocked('rocket')),false);
  const aspect=await page.locator('.ws-preview-canvas').evaluate(el=>{
   const rect=el.getBoundingClientRect();return rect.width/rect.height;
  });
  assert.ok(Math.abs(aspect-920/220)<.04,'Preview must preserve head proportions: '+aspect);
  await page.locator('.ws-preset[data-skin="adnova"]').click();
  assert.equal(await page.evaluate(()=>window.WormSkinStudio.isUnlocked('adnova')),false,
   'Unfilled ad must not grant skin');
  await page.evaluate(()=>{window.SpaceCrazyAds.rewarded=async()=>true;});
  await page.locator('.ws-preset[data-skin="adnova"]').click();
  await page.waitForFunction(()=>window.WormSkinStudio.isUnlocked('adnova'));
  await page.locator('.ws-head-choice[data-head="rocket"]').click();
  await page.waitForFunction(()=>window.WormSkinStudio.isHeadUnlocked('rocket'));
  const owned=await page.evaluate(()=>JSON.parse(localStorage.getItem('infinity-space-crazy-worm-rewards-v1')));
  assert.ok(owned.skins.includes('adnova')&&owned.heads.includes('rocket'));
  // CrazyGames unavailable/disabled and standalone distributions must never
  // offer ad-exclusive unlock buttons that cannot grant their rewards.
  await page.locator('.ws-x').click();
  await page.evaluate(()=>{window.SpaceCrazyAds.supported=false;});
  await page.locator('#worm-skins-open').click();
  assert.equal(await page.locator('.ws-preset').count(),16,
   'Disabled CrazyGames SDK must hide the two rewarded skin offers');
  assert.equal(await page.locator('.ws-head-choice').count(),30,
   'Disabled CrazyGames SDK must hide the two rewarded head offers');
  await page.locator('.ws-x').click();
  await page.locator('#worm-resume').click();
  await page.evaluate(()=>{window.InfinityWormsQA.setMass(900);window.InfinityWormsQA.forceDeath();});
  await page.locator('#worm-result').waitFor({state:'visible',timeout:12000});
  assert.equal(await page.locator('#worm-revive-ad').isVisible(),true);
  const before=await page.evaluate(()=>window.InfinityWormsQA.snapshot());
  await page.evaluate(()=>{window.SpaceCrazyAds.rewarded=async()=>false;});
  await page.locator('#worm-revive-ad').click();
  assert.equal(await page.evaluate(()=>window.InfinityWormsQA.snapshot().reviveUsed),false);
  await page.evaluate(()=>{window.SpaceCrazyAds.rewarded=async()=>true;});
  await page.locator('#worm-revive-ad').click();
  await page.waitForFunction(()=>window.InfinityWormsQA.snapshot().state==='playing',{timeout:7000});
  const revived=await page.evaluate(()=>window.InfinityWormsQA.snapshot());
  assert.ok(revived.reviveUsed&&Math.abs(revived.mass-Math.max(40,Math.floor(before.deathMass*.5)))<30,
   'Half mass required after rewarded Worms revival');
  await page.evaluate(()=>{window.InfinityWormsQA.setRunTime(70);window.InfinityWormsQA.forceDeath();});
  await page.locator('#worm-result').waitFor({state:'visible',timeout:12000});
  await page.waitForFunction(()=>window.__midgames>0,{timeout:5000});
  assert.equal(await page.locator('#worm-revive-ad').isVisible(),false,
   'Rewarded revival must be limited to one per run');
  await page.close();

  const arena=await browser.newPage({viewport:{width:1000,height:680}});
  arena.on('pageerror',error=>errors.push(String(error.stack||error).slice(0,450)));
  await arena.addInitScript(seed);
  for(const mode of ['arena','core','race']){
   await arena.goto(base+'/cosmic-arena.html?mode='+mode+'&tester=1',{waitUntil:'domcontentloaded',timeout:50000});
   await arena.waitForFunction(()=>!!window.InfinityArenaQA,{timeout:30000});
   await arena.evaluate(installAds);
   await arena.evaluate(()=>{window.InfinityArenaQA.setMass(960);window.InfinityArenaQA.forcePlayerDeath();});
   await arena.locator('#arena-death-offer').waitFor({state:'visible',timeout:7000});
   await arena.locator('#arena-revive-ad').click();
   assert.equal(await arena.evaluate(()=>window.InfinityArenaQA.snapshot().reviveUsed),false);
   await arena.evaluate(()=>{window.SpaceCrazyAds.rewarded=async()=>true;});
   await arena.locator('#arena-revive-ad').click();
   await arena.waitForFunction(()=>window.InfinityArenaQA.snapshot().state==='playing',{timeout:7000});
   const snapshot=await arena.evaluate(()=>window.InfinityArenaQA.snapshot());
   assert.ok(snapshot.reviveUsed&&Math.abs(snapshot.mass-480)<4,
    mode+' reward must restore exactly 50% mass');
   await arena.evaluate(()=>{window.InfinityArenaQA.setMass(900);window.InfinityArenaQA.forcePlayerDeath();});
   assert.equal(await arena.locator('#arena-death-offer').isVisible(),false,
    mode+' must not offer another rewarded revival');
  }
  await arena.goto(base+'/cosmic-arena.html?mode=royale&tester=1',{waitUntil:'domcontentloaded',timeout:50000});
  await arena.waitForFunction(()=>!!window.InfinityArenaQA,{timeout:30000});
  await arena.evaluate(installAds);
  await arena.evaluate(()=>{window.InfinityArenaQA.setMass(960);window.InfinityArenaQA.forcePlayerDeath();});
  await arena.locator('#result').waitFor({state:'visible',timeout:7000});
  assert.equal(await arena.locator('#arena-result-revive-ad').isVisible(),true);
  await arena.evaluate(()=>{window.SpaceCrazyAds.rewarded=async()=>true;});
  await arena.locator('#arena-result-revive-ad').click();
  await arena.waitForFunction(()=>window.InfinityArenaQA.snapshot().state==='playing',{timeout:7000});
  assert.ok(Math.abs((await arena.evaluate(()=>window.InfinityArenaQA.snapshot())).mass-480)<4);
  await arena.evaluate(()=>{window.InfinityArenaQA.setElapsed(90);window.InfinityArenaQA.forcePlayerDeath();});
  await arena.locator('#result').waitFor({state:'visible',timeout:7000});
  await arena.waitForFunction(()=>window.__midgames>0,{timeout:5000});
  assert.equal(await arena.locator('#arena-result-revive-ad').isVisible(),false);
  assert.deepEqual(errors,[],'No browser JS errors in ad flows');
  console.log('PASS: CrazyGames rewarded skins, heads, half-mass revivals, no free grants, one revive per match, and post-match midgame');
 }finally{await browser.close()}
})().catch(err=>{console.error(err.stack||err);process.exitCode=1;});
