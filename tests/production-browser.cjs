const {chromium}=require('playwright');const assert=require('node:assert/strict');const fs=require('node:fs');
const base=process.env.INFINITI_SMOKE_URL||'http://127.0.0.1:8765';
(async()=>{const browser=await chromium.launch({headless:true});fs.mkdirSync('screenshots',{recursive:true});
for(const viewport of [{width:2048,height:1035},{width:1440,height:900},{width:390,height:844},{width:844,height:390}]){
 for(const route of ['index.html','cosmic-worms.html','cosmic-arena.html?mode=arena','cosmic-arena.html?mode=royale','cosmic-arena.html?mode=core','cosmic-arena.html?mode=race']){
  const page=await browser.newPage({viewport,isMobile:viewport.width<900,hasTouch:viewport.width<900});const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('https://sdk.crazygames.com/**',r=>r.abort());
  if(route==='index.html')await page.route('**/game.js?*',async r=>{
   const response=await r.fetch();let body=await response.text();const end=body.lastIndexOf('})();');
   body=body.slice(0,end)+`window.__releaseHarness={start:startFlight,daily:showDailyRewards,roulette:showCosmicRoulette,music:showMusicShop,death:()=>dieInAbyss({id:'release',name:'Void',x:0,y:0,r:100}),state:()=>({running,time:g.time,credits:g.credits,owned:[...g.ownedTracks]})};`+body.slice(end);
   await r.fulfill({response,body});
  });
  await page.goto(base+'/'+route);await page.waitForTimeout(1800);
  assert.deepEqual(errors,[],route+' startup');
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,route+' overflow');
  assert.equal(await page.locator('button:visible').count()>0,true,route+' controls');
  assert.deepEqual(await page.evaluate(()=>Object.keys(window).filter(k=>/QA$|Debug$|TestActions$/.test(k))),[]);
  if(route==='index.html'){
   await page.waitForFunction(()=>!!window.__releaseHarness);
   await page.waitForSelector('#screen-menu.hub-main-carousel .hub-mode-story-play');
   const layout=await page.evaluate(()=>{
    const story=document.querySelector('.hub-mode-story'),old=document.querySelector('.menu-main.hub-menu'),button=document.querySelector('.hub-mode-story-play');
    const r=button.getBoundingClientRect();
    return {display:getComputedStyle(story).display,old:getComputedStyle(old).display,color:getComputedStyle(story).color,inView:r.width>100&&r.height>30&&r.left>=0&&r.right<=innerWidth+1&&r.top>=0&&r.bottom<=innerHeight+1};
   });
   assert.equal(layout.display,'grid');assert.equal(layout.old,'none');assert.notEqual(layout.color,'rgb(0, 0, 0)');assert(layout.inView,JSON.stringify(layout));
   async function launchVisible(){
    assert(await page.locator('.hub-mode-story-play').evaluate(button=>{const r=button.getBoundingClientRect();return button.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));}), 'Launch button must be visible without auto-scrolling');
   }
   await launchVisible();
   await page.screenshot({path:`screenshots/${viewport.width}-main-menu.png`});
   await page.locator('.hub-mode-step[data-dir="1"]').click();await page.waitForTimeout(500);
   assert.equal(await page.locator('#screen-menu').getAttribute('data-preview-mode'),'worms');
   await launchVisible();
   await page.screenshot({path:`screenshots/${viewport.width}-worms-menu.png`});
   await page.locator('.hub-mode-step[data-dir="-1"]').click();await page.waitForTimeout(450);
   await page.locator('.hub-mode-story-play').click();await page.waitForTimeout(800);
   assert.equal(await page.evaluate(()=>__releaseHarness.state().running),true);
   assert(await page.evaluate(()=>__releaseHarness.state().time)>0);
   await page.evaluate(()=>__releaseHarness.music());
   assert(await page.getByText('Velvet Orbit',{exact:true}).count()>0);
   await page.waitForFunction(()=>[...document.querySelectorAll('img[src$=".svg"]')].filter(i=>{const r=i.getBoundingClientRect();return r.height>0&&r.top<innerHeight&&r.bottom>0}).every(i=>i.complete&&i.naturalWidth>0));
   await page.screenshot({path:`screenshots/${viewport.width}-music.png`});
   await page.evaluate(()=>__releaseHarness.daily('menu'));
   await page.locator('#daily-claim').click();
   await page.evaluate(()=>__releaseHarness.roulette('menu'));
   assert.equal(await page.locator('#daily-spin').isEnabled(),true);
   await page.locator('#daily-spin').click();
   assert.equal(await page.locator('#daily-spin').isEnabled(),false);
   await page.evaluate(()=>__releaseHarness.daily('menu'));
   await page.evaluate(()=>__releaseHarness.roulette('menu'));
   assert.equal(await page.locator('#daily-spin').isEnabled(),false);
   const before=await page.evaluate(()=>__releaseHarness.state());
   await page.evaluate(()=>__releaseHarness.death());
   await page.locator('#revive-restart').click();
   const after=await page.evaluate(()=>__releaseHarness.state());
   assert.equal(after.running,true);assert.deepEqual(after.owned,before.owned);assert.equal(after.credits,before.credits);
  }else if(route==='cosmic-worms.html'){
   if(await page.locator('#worm-guide-skip:visible').count())await page.locator('#worm-guide-skip').click();
   await page.waitForTimeout(500);await page.locator('#worm-pause').click();await page.locator('#worm-resume').click();
  }else{
   const skip=page.locator('#guide-skip:visible');if(await skip.count())await skip.click();
   await page.waitForTimeout(300);
  }
  await page.screenshot({path:`screenshots/${viewport.width}-${route.replace(/[^\w]/g,'_')}.png`});assert.deepEqual(errors,[],route);await page.close();
 }
}
// SDK contract: no advertising property access, cloud authority and round-trip.
const page=await browser.newPage();await page.route('https://sdk.crazygames.com/**',r=>r.abort());
await page.addInitScript(()=>{window.cloud=new Map([['infiniti-space-language','ru']]);window.calls=[];window.CrazyGames={SDK:{environment:'crazygames',init:async()=>{},data:{getItem:k=>cloud.get(k)??null,setItem:(k,v)=>cloud.set(k,v),removeItem:k=>cloud.delete(k)},get ad(){throw Error('Advertising module touched');},game:{settings:{muteAudio:false},addSettingsChangeListener(){},loadingStart(){calls.push('loadingStart')},loadingStop(){calls.push('loadingStop')},gameplayStart(){calls.push('gameplayStart')},gameplayStop(){calls.push('gameplayStop')}}}};localStorage.setItem('infiniti-space-language','en');});
const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(base+'/index.html');await page.waitForTimeout(1500);
assert.equal(await page.evaluate(()=>SpacePlatform.storage.getItem('infiniti-space-language')),'ru');
assert.equal(await page.evaluate(()=>{SpacePlatform.storage.setItem('roundtrip','42');return cloud.get('roundtrip')}),'42');assert.deepEqual(errors,[]);assert(await page.evaluate(()=>calls.includes('loadingStop')));await page.close();await browser.close();console.log('Desktop, portrait, landscape, six modes and SDK storage: OK');
})().catch(e=>{console.error(e);process.exit(1)});
