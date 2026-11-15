'use strict';
// QA the exact multi-file ZIP upload as served from its extracted root.
// SDK is mocked to test integration without requesting real advertisements.
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const base='http://127.0.0.1:8768';
const sdk=`window.CrazyGames={SDK:{
 environment:'local',init:async()=>{},
 game:{settings:{muteAudio:false},loadingStart(){},loadingStop(){},
  gameplayStart(){},gameplayStop(){},happytime(){},addSettingsChangeListener(){}},
 ad:{requestAd:(_type,callbacks)=>{callbacks.adStarted?.();
  callbacks.adFinished?.();return Promise.resolve()}}
}};`;
(async()=>{
 const browser=await chromium.launch({headless:true,args:[
  '--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader',
  '--use-gl=angle','--use-angle=swiftshader-webgl'
 ]});
 try{
  for(const cfg of [
   {name:'desktop',viewport:{width:1366,height:768},mobile:false},
   {name:'portrait phone',viewport:{width:390,height:844},mobile:true},
   {name:'landscape phone',viewport:{width:844,height:390},mobile:true}
  ]){
   const page=await browser.newPage({
    viewport:cfg.viewport,isMobile:cfg.mobile,hasTouch:cfg.mobile
   });
   const errors=[],bridgeRequests=[],local404=[];
   page.on('pageerror',error=>errors.push(error.message));
   page.on('response',res=>{
    if(res.status()===404&&res.url().startsWith(base))local404.push(res.url());
   });
   await page.route('https://sdk.crazygames.com/**',route=>route.fulfill({
    status:200,contentType:'application/javascript',body:sdk
   }));
   await page.route('https://bridge.playgama.com/**',route=>{
    bridgeRequests.push(route.request().url());
    return route.fulfill({status:410,body:'Playgama must not be loaded'});
   });
   await page.goto(base+'/index.html',{waitUntil:'domcontentloaded',timeout:60000});
   await page.waitForFunction(()=>window.SpacePlatform?.status==='ready',
    null,{timeout:35000});
   await page.locator('#hub-mode-story').waitFor({state:'visible',timeout:35000});
   const home=await page.evaluate(()=>({
    songs:window.SpaceMusicTracks?.length||0,
    song:window.SpaceMusicTracks?.[0]?.src||'',
    cover:window.SpaceMusicTracks?.[0]?.cover||'',
    ad:window.SpaceCrazyAds?.available,
    playgama:window.SpacePlaygamaBuild===true
   }));
   assert.equal(home.songs,12,cfg.name+' music catalog');
   assert.ok(home.song.startsWith('https://mooouse.github.io/Infinity-Space/assets/music/'));
   assert.ok(home.cover.startsWith('assets/music/'),cfg.name+' cover images remain local');
   assert.equal(home.ad,true,cfg.name+' CrazyGames ad integration');
   assert.equal(home.playgama,false);
   assert.equal(await page.evaluate(()=>window.SpaceCrazyAds.rewarded()),true);
   for(const mode of ['worms','arena','royale','core','race']){
    const url=mode==='worms'?base+'/cosmic-worms.html?mode=worms':
     base+'/cosmic-arena.html?mode='+mode;
    await page.goto(url,{waitUntil:'domcontentloaded',timeout:60000});
    await page.waitForFunction(()=>window.SpacePlatform?.status==='ready',
      null,{timeout:25000});
    const game=await page.evaluate(()=>({
      sdk:window.SpaceCrazyAds?.supported,
      available:window.SpaceCrazyAds?.available,
      playgama:window.SpacePlaygamaBuild===true,
      songs:window.SpaceMusicTracks?.length||0,
      song:window.SpaceMusicTracks?.[0]?.src||'',
      canvas:!!document.querySelector('canvas')
    }));
    assert.equal(game.sdk,true,cfg.name+' '+mode+' SDK');
    assert.equal(game.available,true,cfg.name+' '+mode+' rewarded ad');
    assert.equal(game.playgama,false);
    assert.equal(game.songs,12);
    assert.ok(game.song.startsWith('https://mooouse.github.io/Infinity-Space/assets/music/'));
    assert.equal(game.canvas,true,cfg.name+' '+mode+' canvas');
   }
   assert.deepEqual(bridgeRequests,[],cfg.name+' Playgama SDK must be absent');
   assert.deepEqual(local404,[],cfg.name+' missing packaged resources');
   assert.deepEqual(errors,[],cfg.name+' JS errors');
   console.log('PASS: '+cfg.name+' CrazyGames multi-file ZIP, 6 modes, SDK, music, assets');
   await page.close();
  }
 }finally{await browser.close()}
})().catch(error=>{console.error(error.stack||error);process.exitCode=1});
