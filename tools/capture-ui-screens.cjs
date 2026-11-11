// Generates genuine screen captures for the one-page UI overview.
'use strict';
const {chromium}=require('playwright');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const base=process.env.INFINITI_SMOKE_URL||'http://127.0.0.1:8765';
const out=path.join(root,'ui-snapshots');
const screens=[
 ['menu','index.html?select=endless',null],
 ['endless','index.html?select=endless',null],
 ['map','index.html?select=endless','.hub-story-shortcut[data-shortcut="map"]'],
 ['evolution','index.html?select=endless','.hub-story-shortcut[data-shortcut="evolution"]'],
 ['achievements','index.html?select=endless','.hub-story-shortcut[data-shortcut="achievements"]'],
 ['bestiary','index.html?select=endless','.hub-story-shortcut[data-shortcut="bestiary"]'],
 ['statistics','index.html?select=endless','.hub-story-shortcut[data-shortcut="statistics"]'],
 ['settings','index.html?select=endless','.hub-story-shortcut[data-shortcut="settings"]'],
 ['music','index.html?select=endless','.hub-story-shortcut[data-shortcut="music"]'],
 ['daily','index.html?select=endless','[data-reward-page="daily"]'],
 ['roulette','index.html?select=endless','[data-reward-page="roulette"]'],
 ['arena','cosmic-arena.html?mode=arena',null],
 ['royale','cosmic-arena.html?mode=royale',null],
 ['core','cosmic-arena.html?mode=core',null],
 ['race','cosmic-arena.html?mode=race',null],
 ['worms','cosmic-worms.html?tester=1',null],
 ['worms-pause','cosmic-worms.html?tester=1','pause-worms'],
 ['worms-skins','cosmic-worms.html?tester=1','show-worms-skins']
];
const timeout=ms=>new Promise(r=>setTimeout(r,ms));
async function capture(browser,id,url,action,width=1280,height=720,suffix=''){
 const ctx=await browser.newContext({viewport:{width,height},deviceScaleFactor:1,reducedMotion:'reduce',locale:'ru-RU'});
 await ctx.addInitScript(()=>{
  localStorage.setItem('infiniti-space-language','ru');
  localStorage.setItem('infinity-space-player-v1',JSON.stringify({version:1,nickname:'UI REVIEW'}));
  localStorage.setItem('infinity-space-mode-guide-v2:worms','1');
  for(const name of ['arena','royale','core','race'])
   localStorage.setItem('infinity-space-mode-guide-v2:'+name,'1');
 });
 const page=await ctx.newPage();
 page.setDefaultTimeout(12000);
 page.on('dialog',d=>d.dismiss().catch(()=>{}));
 try{
  await page.goto(base+'/'+url,{waitUntil:'domcontentloaded',timeout:30000});
  await timeout(700);
  if(url.startsWith('index.html')){
   await page.locator('#hub-mode-story').waitFor({state:'visible',timeout:18000});
   if(action){
    const button=page.locator(action).first();
    await button.waitFor({state:'attached',timeout:10000});
    // The button has original click handlers and remains usable when moved.
    if(await button.isVisible())await button.click({force:true,timeout:5000});
    else await button.evaluate(node=>node.click());
    await timeout(500);
   }
  }else if(url.startsWith('cosmic-worms.html')){
   await page.locator('#worm-field').waitFor({state:'attached'});
   if(await page.locator('#worm-guide').isVisible())await page.locator('#worm-guide-skip').click({force:true});
   if(action){
    await page.evaluate(()=>window.InfinityWormsQA?.testProtection?.(90));
    await page.locator('#worm-pause').click({force:true});
    if(action==='show-worms-skins')await page.locator('#worm-skins-open').click({force:true});
   }
   await timeout(300);
  }else{
   await page.locator('#arena').waitFor({state:'attached'});
   if(await page.locator('#guide').isVisible())await page.locator('#guide-skip').click({force:true}).catch(()=>{});
   await timeout(500);
  }
  const filename=id+suffix+'.jpg';
  await page.screenshot({path:path.join(out,filename),type:'jpeg',quality:76,animations:'disabled',timeout:18000});
  console.log('CAPTURE',filename,action||'game');
 }finally{await ctx.close()}
}
(async()=>{
 fs.mkdirSync(out,{recursive:true});
 const browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader-webgl']});
 let failed=[];
 try{
  for(const [id,url,action] of screens){
   try{await capture(browser,id,url,action)}
   catch(e){failed.push({screen:id,error:String(e).slice(0,500)});console.error('FAILED',id,String(e).slice(0,250))}
  }
  for(const id of ['menu','settings','worms','worms-skins']){
   const row=screens.find(x=>x[0]===id);
   try{await capture(browser,...row,390,780,'-mobile')}
   catch(e){failed.push({screen:id+'-mobile',error:String(e).slice(0,500)});console.error('FAILED',id+'-mobile',String(e).slice(0,250))}
  }
 }finally{await browser.close()}
 console.log('CAPTURED',fs.readdirSync(out).filter(x=>x.endsWith('.jpg')).length,'of',screens.length+4);
 if(failed.length){console.error('CAPTURE_ERRORS',JSON.stringify(failed));process.exitCode=1}
})();
