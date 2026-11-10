'use strict';
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
 try{
  for(const [width,height,mobile] of [[1280,720,false],[390,844,true]]){
   const context=await browser.newContext({viewport:{width,height},isMobile:mobile,hasTouch:mobile});
   const page=await context.newPage();const errors=[];
   page.on('pageerror',e=>errors.push(String(e)));
   await page.addInitScript(()=>{
    const save=JSON.stringify({version:1,tier:0,credits:987,matter:0,tutorialDone:true});
    const messages=[],put=[];
    window.__bridgeTest={messages,put};
    const watchers={};
    window.bridge={
     EVENT_NAME:{AUDIO_STATE_CHANGED:'audio',PAUSE_STATE_CHANGED:'pause',REWARDED_STATE_CHANGED:'rewarded',INTERSTITIAL_STATE_CHANGED:'interstitial'},
     async initialize(){},
     platform:{id:'playgama',language:'en',isAudioEnabled:true,isPaused:false,
       sendMessage(name){messages.push(name);return Promise.resolve()},
       on(name,fn){watchers[name]=fn}},
     storage:{
      async get(){return {'cosmic-evolution-save-v1':save,'infiniti-space-language':'en'}},
      async set(keys,values){put.push({keys,values});}
     },
     advertisement:{
      isRewardedSupported:true,isInterstitialSupported:true,
      on(name,fn){watchers[name]=fn;},
      off(name,fn){if(watchers[name]===fn)delete watchers[name]},
      showRewarded(){Promise.resolve().then(()=>watchers.rewarded?.('rewarded'));return Promise.resolve()},
      showInterstitial(){Promise.resolve().then(()=>watchers.interstitial?.('closed'));return Promise.resolve()}
     }
    };
   });
   await page.goto('http://127.0.0.1:8765/?playgama_qa=1',{waitUntil:'domcontentloaded',timeout:90000});
   await page.waitForFunction(()=>window.SpacePlatform?.status==='ready'&&window.CosmicEvolutionDebug?.credits===987,{timeout:85000});
   await page.waitForFunction(()=>window.__bridgeTest.messages.includes('game_ready'),{timeout:30000});
   const result=await page.evaluate(()=>({
    status:window.SpacePlatform.status,provider:window.SpacePlatform.provider,
    readyEvents:window.__bridgeTest.messages.filter(e=>e==='game_ready').length,
    credits:window.CosmicEvolutionDebug.credits,
    gameVersion:document.querySelector('script[src*="game.js?v="]')?.src,
    configFlag:window.__INFINITY_PLAYGAMA,
    ui:document.getElementById('modal')?.dataset.screen
   }));
   assert.equal(result.provider,'playgama');
   assert.equal(result.status,'ready');
   assert.equal(result.credits,987);
   assert.equal(result.readyEvents,1);
   assert.equal(result.configFlag,true);
   assert.ok(result.gameVersion.includes('3.60.0'));
   const important=errors.filter(s=>!/AudioContext|Audio|WebGL|NotAllowedError/i.test(s));
   assert.deepEqual(important,[],'No game boot errors: '+important.slice(0,4).join(' | '));
   console.log('PASS PLAYGAMA ZIP '+width+'x'+height+' '+JSON.stringify(result));
   await context.close();
  }
 }finally{await browser.close();}
})().catch(e=>{console.error(e.stack||e);process.exit(1)});
