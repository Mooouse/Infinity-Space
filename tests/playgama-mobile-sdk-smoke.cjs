'use strict';
// Validate the Playgama upload itself on touch screens, including SDK loading
// inside Blob-backed modes (which differ from the CrazyGames distribution).
const assert = require('node:assert/strict');
const { chromium } = require('playwright');

const playgamaMock = `window.bridge = {
  EVENT_NAME: {
    AUDIO_STATE_CHANGED:'audio', PAUSE_STATE_CHANGED:'pause',
    REWARDED_STATE_CHANGED:'rewarded', INTERSTITIAL_STATE_CHANGED:'interstitial'
  },
  initialize:async options => {
    const path=options?.configFilePath||'./playgama-bridge-config.json';
    const response=await fetch(path);
    if(!response.ok)throw Error('Bridge configuration unavailable: '+path);
    window.__playgamaInit={path,config:await response.json()};
  },
  platform:{id:'playgama_sandbox',language:'en',isPaused:false,isAudioEnabled:true,
    sendMessage:async()=>{},on:()=>{},off:()=>{}},
  advertisement:{isRewardedSupported:true,isInterstitialSupported:true,
    on:()=>{},off:()=>{},checkAdBlock:async()=>false,
    showRewarded:async()=>{},showInterstitial:async()=>{}},
  storage:{get:async()=>[],set:async()=>{}}
};`;

(async()=>{
  const browser = await chromium.launch({
    headless:true,args:['--no-sandbox','--disable-dev-shm-usage',
      '--use-gl=angle','--use-angle=swiftshader-webgl']
  });
  try{
    for(const viewport of [{width:390,height:844},{width:844,height:390}]){
      const page=await browser.newPage({viewport,isMobile:true,hasTouch:true});
      const errors=[];
      page.on('pageerror',error=>errors.push(error.message));
      await page.route('https://bridge.playgama.com/**',route=>route.fulfill({
        status:200,contentType:'application/javascript',body:playgamaMock
      }));
      const root='http://127.0.0.1:8766/playgama/index.html';
      for(const mode of ['worms','arena']){
        await page.goto(root,{waitUntil:'domcontentloaded',timeout:60000});
        await page.waitForFunction(()=>window.SpacePlatform?.status==='ready',
          null,{timeout:30000});
        assert.equal(await page.evaluate(()=>window.__playgamaInit?.path),
          './playgama-bridge-config.json','Playgama upload must read sibling config');
        assert.equal(await page.evaluate(mode=>window.SpaceOpenMode(mode)),true);
        await page.waitForURL(url=>url.protocol==='blob:',{timeout:20000});
        await page.waitForFunction(()=>window.SpacePlatform?.status==='ready',
          null,{timeout:25000});
        const state=await page.evaluate(()=>({
          playgama:window.SpacePlatform?.isPlaygama,
          adAvailable:window.SpacePlatform?.adsAvailable,
          configIsData:window.__playgamaInit?.path?.startsWith('data:'),
          configLoaded:window.__playgamaInit?.config?.advertisement?.rewarded?.preloadOnStart,
          crazyScript:!!document.querySelector('script[src*="crazygames-sdk"]'),
          width:innerWidth,height:innerHeight,
          hasCanvas:!!document.querySelector('canvas')
        }));
        assert.equal(state.playgama,true,'Playgama mode selection');
        assert.equal(state.adAvailable,true,'Rewarded ads adapter must initialize');
        assert.equal(state.configIsData,true,'Blob mode Bridge config must be embedded');
        assert.equal(state.configLoaded,true,'Real config must be parsed');
        assert.equal(state.crazyScript,false,'CrazyGames SDK must not be loaded');
        assert.equal(state.hasCanvas,true,'Game should render');
        assert.deepEqual(errors,[],mode+' '+viewport.width+'x'+viewport.height+' JS errors');
        console.log('PASS: Playgama '+mode+' '+viewport.width+'x'+viewport.height+
          ' touch mode, SDK, configuration, ads and canvas');
      }
      await page.close();
    }
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
