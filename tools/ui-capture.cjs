// Visual QA capture for the Infinity Space UI Atlas.
// Takes screenshots of actual screen DOM rather than redrawn mockups.
// Refresh after shared HUD and mobile text containment corrections.
'use strict';
const {chromium}=require('playwright');
const fs=require('node:fs');
const path=require('node:path');
const base=process.env.INFINITI_SMOKE_URL||'http://127.0.0.1:8765';
const out=path.resolve(__dirname,'..','ui-snapshots');
fs.mkdirSync(out,{recursive:true});
const screens=[
 {id:'main-menu',url:'index.html?select=endless',wait:'#hub-mode-story'},
 {id:'mode-worms',url:'index.html?select=worms',wait:'#hub-mode-story'},
 {id:'mode-arena',url:'index.html?select=arena',wait:'#hub-mode-story'},
 {id:'mode-race',url:'index.html?select=race',wait:'#hub-mode-story'},
 {id:'map',url:'index.html?select=endless',action:'.hub-story-shortcut[data-shortcut="map"]',wait:'#screen-map'},
 {id:'evolution',url:'index.html?select=endless',action:'.hub-story-shortcut[data-shortcut="evolution"]',wait:'#screen-evolution'},
 {id:'achievements',url:'index.html?select=endless',action:'.hub-story-shortcut[data-shortcut="achievements"]',wait:'#screen-achievements'},
 {id:'bestiary',url:'index.html?select=endless',action:'.hub-story-shortcut[data-shortcut="bestiary"]',wait:'#screen-bestiary'},
 {id:'statistics',url:'index.html?select=endless',action:'.hub-story-shortcut[data-shortcut="statistics"]',wait:'.infinity-stats-panel'},
 {id:'settings',url:'index.html?select=endless',action:'.hub-story-shortcut[data-shortcut="settings"]',wait:'#screen-settings'},
 {id:'music',url:'index.html?select=endless',action:'.hub-story-shortcut[data-shortcut="music"]',wait:'#screen-music'},
 {id:'daily',url:'index.html?select=endless',action:'[data-reward-page="daily"]',wait:'[data-screen="daily"]'},
 {id:'roulette',url:'index.html?select=endless',action:'[data-reward-page="roulette"]',wait:'[data-screen="roulette"]'},
 {id:'worms-play',url:'cosmic-worms.html?tester=1',wait:'#worm-hud'},
 {id:'worms-pause',url:'cosmic-worms.html?tester=1',action:'worm-pause',wait:'#worm-pause-overlay'},
 {id:'worms-skins',url:'cosmic-worms.html?tester=1',action:'worm-skins',wait:'.ws-overlay'},
 {id:'arena-play',url:'cosmic-arena.html?mode=arena&tester=1',wait:'#hud'},
 {id:'arena-pause',url:'cosmic-arena.html?mode=arena&tester=1',action:'arena-pause',wait:'#paused'},
 {id:'royale',url:'cosmic-arena.html?mode=royale&tester=1',wait:'#hud'},
 {id:'core',url:'cosmic-arena.html?mode=core&tester=1',wait:'#hud'},
 {id:'race',url:'cosmic-arena.html?mode=race&tester=1',wait:'#hud'}
];
async function go(page,screen){
 await page.goto(base+'/'+screen.url,{waitUntil:'domcontentloaded',timeout:40000});
 const qa=screen.url.includes('cosmic-worms');
 if(qa){
  await page.waitForFunction(()=>window.InfinityWormsQA?.snapshot?.(),{timeout:16000});
  await page.evaluate(()=>{
   if(!document.querySelector('#worm-guide')?.hidden)document.querySelector('#worm-guide-skip')?.click();
   window.InfinityWormsQA?.testProtection?.(120);
  });
 }
 if(screen.action?.startsWith('worm')){
  await page.locator('#worm-pause').click();
  if(screen.action==='worm-skins'){
   await page.locator('#worm-pause-overlay').waitFor({state:'visible',timeout:9000});
   await page.locator('#worm-skins-open').click();
  }
 }else if(screen.action==='arena-pause'){
  const guide=page.locator('#guide');
  if(await guide.isVisible())await page.locator('#guide-skip').click().catch(()=>{});
  await page.locator('#pause').click();
 }else if(screen.action){
  await page.locator(screen.action).waitFor({state:'visible',timeout:18000});
  await page.locator(screen.action).click();
 }
 if(screen.wait)await page.locator(screen.wait).waitFor({state:'visible',timeout:16000});
 await page.waitForTimeout(350);
}
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader-webgl']});
 const failures=[];
 try{
  for(const [suffix,viewport,ids] of [
   ['',{width:1280,height:720},screens.map(x=>x.id)],
   ['-mobile',{width:390,height:844},['main-menu','settings','achievements','worms-play','worms-pause','worms-skins','arena-play']]
  ]){
   const context=await browser.newContext({viewport,deviceScaleFactor:1});
   await context.addInitScript(()=>{
    localStorage.setItem('infiniti-space-language','ru');
    localStorage.setItem('infinity-space-player-v1',JSON.stringify({version:1,nickname:'UI ATLAS'}));
    localStorage.setItem('infinity-space-mode-guide-v2:worms','1');
    for(const id of ['arena','royale','core','race'])localStorage.setItem('infinity-space-mode-guide-v2:'+id,'1');
   });
   const page=await context.newPage();
   page.setDefaultTimeout(16000);
   for(const id of ids){
    const s=screens.find(x=>x.id===id);
    try{
     await go(page,s);
     const file=path.join(out,id+suffix+'.jpg');
     await page.screenshot({path:file,type:'jpeg',quality:67,animations:'disabled',timeout:16000});
     console.log('CAPTURE',id+suffix,fs.statSync(file).size);
    }catch(e){failures.push({screen:id+suffix,error:String(e).slice(0,370)});console.log('CAPTURE_FAILED',id+suffix,String(e).slice(0,300))}
   }
   await context.close();
  }
 }finally{await browser.close()}
 console.log('CAPTURE_SUMMARY',JSON.stringify({screens:screens.length,failures}));
 if(failures.length>3)process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1});
