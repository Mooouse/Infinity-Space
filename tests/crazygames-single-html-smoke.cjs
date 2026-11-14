// Validate the *actual release HTML* in Chromium, including arcade Blob modes.
// The SDK mock emulates CrazyGames local mode; never grants real ad rewards.
const assert = require('node:assert/strict');
const { chromium } = require('playwright');

const mockSDK = `window.CrazyGames={SDK:{
  environment:'local',
  init:async()=>{},
  game:{
    settings:{muteAudio:false},loadingStart(){},loadingStop(){},
    gameplayStart(){},gameplayStop(){},happytime(){},
    addSettingsChangeListener(){}
  },
  ad:{requestAd:(type,callbacks)=>{
    callbacks.adStarted?.();
    callbacks.adFinished?.();
    return Promise.resolve();
  }}
}};`;

(async()=>{
  const browser = await chromium.launch({
    headless:true,
    args:['--no-sandbox','--disable-dev-shm-usage',
      '--use-gl=angle','--use-angle=swiftshader-webgl']
  });
  try{
    for(const device of [
      {name:'desktop',viewport:{width:1366,height:768},isMobile:false},
      {name:'mobile',viewport:{width:390,height:844},isMobile:true}
    ]){
      const page = await browser.newPage({
        viewport:device.viewport,isMobile:device.isMobile,
        hasTouch:device.isMobile
      });
      const errors=[];
      page.on('pageerror',e=>errors.push(e.message));
      await page.route('https://sdk.crazygames.com/**',route=>route.fulfill({
        status:200,contentType:'application/javascript',body:mockSDK
      }));
      const start='http://127.0.0.1:8767/index.html';
      await page.goto(start,{waitUntil:'domcontentloaded',timeout:60000});
      await page.locator('#screen-menu [data-reward-page="roulette"]')
        .waitFor({state:'visible',timeout:40000});
      await page.waitForFunction(()=>window.SpacePlatform?.status==='ready',
        null,{timeout:12000});
      let root=await page.evaluate(()=>({
        url:location.href,
        tracks:window.SpaceMusicTracks?.length,
        cover:window.SpaceMusicTracks?.[0]?.cover?.startsWith('data:image/jpeg;base64,'),
        music:window.SpaceMusicTracks?.[0]?.src,
        supported:window.SpacePlatform?.adsAvailable,
        hasBridge:!!document.querySelector('script[src*="playgama-bridge"]')
      }));
      assert.equal(root.tracks,12);
      assert.ok(root.cover);
      assert.ok(root.music.startsWith('https://mooouse.github.io/Infinity-Space/assets/music/'));
      assert.equal(root.supported,true);
      assert.equal(root.hasBridge,false);
      assert.equal(await page.evaluate(()=>window.SpacePlatform.requestAd('rewarded')),true);

      for(const mode of ['worms','arena']){
        await page.evaluate(mode=>window.SpaceOpenMode(mode),mode);
        await page.waitForURL(u=>u.protocol==='blob:',{timeout:30000});
        await page.waitForFunction(()=>window.SpacePlatform?.status==='ready',
          null,{timeout:20000});
        const actual=await page.evaluate(()=>({
          code:document.querySelector('script[data-origin="cosmic-worms.js"]')?
            'worms':document.querySelector('canvas#arena')?'arena':'unknown',
          tracks:window.SpaceMusicTracks?.length,
          cover:window.SpaceMusicTracks?.[0]?.cover||'',
          music:window.SpaceMusicTracks?.[0]?.src||'',
          supported:window.SpaceCrazyAds?.supported,
          adAvailable:window.SpaceCrazyAds?.available,
          hasBridge:!!document.querySelector('script[src*="playgama-bridge"]')
        }));
        assert.equal(actual.code,mode,mode+' did not launch');
        assert.equal(actual.tracks,12);
        assert.ok(actual.cover.startsWith('data:image/jpeg;base64,'),mode+' cover');
        assert.ok(actual.music.startsWith('https://mooouse.github.io/Infinity-Space/assets/music/'),mode+' soundtrack');
        assert.equal(actual.supported,true,mode+' SDK should work in Blob pages');
        assert.equal(actual.adAvailable,true,mode+' rewarded ads should be available');
        assert.equal(actual.hasBridge,false);
        assert.equal(await page.evaluate(()=>window.SpaceCrazyAds.rewarded()),true);
        await page.goto(start,{waitUntil:'domcontentloaded',timeout:60000});
        await page.locator('#screen-menu [data-reward-page="roulette"]')
          .waitFor({state:'visible',timeout:40000});
      }
      assert.deepEqual(errors,[],device.name+' JS errors: '+errors.slice(0,5).join('\n'));
      console.log('PASS: '+device.name+' CrazyGames HTML, main mode, worms, arena, music and SDK ads');
      await page.close();
    }
  }finally{await browser.close()}
})().catch(err=>{console.error(err);process.exitCode=1});
