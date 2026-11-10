/* Infinity Space platform adapter.
 * Playgama upload: Playgama Bridge v2, cloud storage and ads.
 * Existing CrazyGames/GitHub Pages builds: retain SDK v3 or standalone fallback.
 * Never grant a rewarded ad on "closed", "resolved" or timeout. */
(() => {
 'use strict';
 const playgamaBuild=window.__INFINITY_PLAYGAMA===true;
 let provider=playgamaBuild?'playgama':'crazygames';
 let bridge=null,crazy=null,ready=false,wantsPlay=false,sentPlay=false,loaded=false,loadingReported=false;
 let platformMuted=false,adMuted=false,hostPaused=false,adBusy=false,everPlayed=false;
 let lastHappy=-Infinity,lastInterstitial=-Infinity;
 let cloudTimer=null,cloudPending=null,cloudSending=false,cloudRevision=0;
 let cloudKey='cosmic-evolution-save-v1';
 const notifyAudio=()=>window.dispatchEvent(new Event('space-platform-audio'));
 const notifyPause=()=>window.dispatchEvent(new CustomEvent('space-platform-pause',{detail:{paused:hostPaused}}));
 const api={
  provider,
  status:'loading',
  get muted(){return platformMuted||adMuted||hostPaused;},
  get hostPaused(){return hostPaused;},
  get adBusy(){return adBusy;},
  get adsAvailable(){
   if(!ready||adBusy)return false;
   if(provider==='playgama'){
    try{return bridge?.advertisement?.isRewardedSupported===true;}
    catch(_){return false;}
   }
   try{return crazyEnabled()&&typeof crazy?.ad?.requestAd==='function';}
   catch(_){return false;}
  },
  get cloudAvailable(){return ready&&provider==='playgama'&&!!bridge?.storage?.set;},
  loaded(){loaded=true;sync();},
  playing(value){wantsPlay=!!value;sync();},
  happy(){
   if(!ready||performance.now()-lastHappy<60000)return;
   lastHappy=performance.now();
   if(provider==='playgama')pgMessage('player_got_achievement');
   else crazyCall('happytime');
  },
  saveSnapshot(key,value){
   if(provider!=='playgama'||!ready||!bridge?.storage?.set||key!==cloudKey||typeof value!=='string')return;
   cloudPending=value;cloudRevision++;
   clearTimeout(cloudTimer);
   cloudTimer=setTimeout(flushCloud,1300);
  },
  flushSave(){
   if(provider==='playgama'&&cloudPending){clearTimeout(cloudTimer);flushCloud();}
  },
  requestAd,
  // Playgama's cloud snapshot must be read BEFORE game.js restores local data.
  bootstrap:Promise.resolve()
 };
 window.SpacePlatform=api;
 function crazyEnabled(){
  try{return crazy?.environment==='local'||crazy?.environment==='crazygames';}
  catch(_){return false;}
 }
 function crazyCall(name){
  try{crazy?.game?.[name]?.();}catch(_){}
 }
 function pgMessage(name,params){
  if(!ready||provider!=='playgama')return;
  try{Promise.resolve(bridge.platform.sendMessage(name,params)).catch(()=>{});}catch(_){}
 }
 function sync(){
  if(!ready)return;
  if(provider==='playgama'){
   if(loaded&&!loadingReported){loadingReported=true;pgMessage('game_ready');}
   if(wantsPlay!==sentPlay){
    sentPlay=wantsPlay;
    if(wantsPlay){pgMessage(everPlayed?'level_resumed':'level_started');everPlayed=true;}
    else if(everPlayed)pgMessage('level_paused');
   }
   return;
  }
  if(loaded&&!loadingReported){loadingReported=true;crazyCall('loadingStop');}
  if(wantsPlay!==sentPlay){sentPlay=wantsPlay;crazyCall(wantsPlay?'gameplayStart':'gameplayStop');}
 }
 async function flushCloud(){
  if(cloudSending||!cloudPending||!api.cloudAvailable)return;
  cloudSending=true;
  const value=cloudPending,revision=cloudRevision;cloudPending=null;
  try{await bridge.storage.set([cloudKey],[value]);}
  catch(error){
   // Preserve local progress on ad-block, quota, connection and SDK errors.
   // Don't endlessly retry during an outage; the next normal save retries.
   console.warn('Playgama cloud save failed:',String(error?.message||error));
  }finally{
   cloudSending=false;
   if(cloudPending&&cloudRevision!==revision){
    clearTimeout(cloudTimer);
    cloudTimer=setTimeout(flushCloud,600);
   }
  }
 }
 async function requestAd(type){
  if(type!=='rewarded'&&type!=='midgame')return false;
  if(!ready||adBusy)return false;
  if(provider==='playgama')return requestPlaygamaAd(type);
  return requestCrazyAd(type);
 }
 async function requestCrazyAd(type){
  if(!api.adsAvailable)return false;
  adBusy=true;
  return new Promise(resolve=>{
   let finished=false;
   const timeout=setTimeout(()=>finish(false),120000);
   function finish(success){
    if(finished)return;
    finished=true;clearTimeout(timeout);
    adBusy=false;adMuted=false;notifyAudio();sync();
    resolve(!!success);
   }
   try{
    const result=crazy.ad.requestAd(type,{
     adStarted(){adMuted=true;notifyAudio();},
     adFinished(){finish(true);},
     adError(){finish(false);}
    });
    if(result&&typeof result.catch==='function')result.catch(()=>finish(false));
   }catch(_){finish(false);}
  });
 }
 function requestPlaygamaAd(type){
  const reward=type==='rewarded';
  if(reward&&!api.adsAvailable)return Promise.resolve(false);
  if(!reward&&bridge?.advertisement?.isInterstitialSupported!==true)return Promise.resolve(false);
  if(!reward&&performance.now()-lastInterstitial<90000)return Promise.resolve(false);
  if(!reward)lastInterstitial=performance.now();
  adBusy=true;
  adMuted=true;notifyAudio();
  return new Promise(resolve=>{
   let done=false,granted=false;
   const ad=bridge.advertisement;
   const event=reward?bridge.EVENT_NAME?.REWARDED_STATE_CHANGED:bridge.EVENT_NAME?.INTERSTITIAL_STATE_CHANGED;
   const timeout=setTimeout(()=>finish(false),120000);
   function finish(success){
    if(done)return;
    done=true;clearTimeout(timeout);
    try{ad.off?.(event,onState);}catch(_){}
    adBusy=false;adMuted=false;notifyAudio();sync();
    resolve(!!success);
   }
   function onState(state){
    // A reward is valid ONLY after the SDK explicitly emitted rewarded.
    if(reward&&state==='rewarded'){granted=true;finish(true);return;}
    if(state==='failed'||state==='closed')finish(reward?granted:true);
    if(state==='opened'){adMuted=true;notifyAudio();}
   }
   try{
    if(!event||typeof ad.on!=='function')throw Error('Missing advertisement state events');
    ad.on(event,onState);
    const result=reward?ad.showRewarded('extra_spin_or_revival'):
     ad.showInterstitial('natural_break');
    Promise.resolve(result).catch(()=>finish(false));
    // The SDK's resolved Promise is NOT proof that a rewarded video finished.
    // Some adapters complete showRewarded() before the callback is sent.
   }catch(_){finish(false);}
  });
 }
 function crazySettings(value){platformMuted=!!value?.muteAudio;notifyAudio();}
 async function initializeCrazy(){
  try{
   crazy=window.CrazyGames?.SDK;
   if(!crazy)throw Error('No CrazyGames SDK');
   await crazy.init();
   if(!crazyEnabled())throw Error('CrazyGames SDK disabled');
   ready=true;api.status='ready';
   crazyCall('loadingStart');
   crazySettings(crazy.game.settings);
   crazy.game.addSettingsChangeListener?.(crazySettings);
   sync();
  }catch(_){ready=false;crazy=null;api.status='standalone';}
 }
 function loadBridgeScript(){
  if(window.bridge)return Promise.resolve(window.bridge);
  return new Promise((resolve,reject)=>{
   const script=document.createElement('script');
   script.src='https://bridge.playgama.com/v2/stable/playgama-bridge.js';
   script.async=true;
   const timer=setTimeout(()=>{
    script.onload=script.onerror=null;script.remove();
    reject(Error('Playgama SDK download timeout'));
   },12000);
   script.onload=()=>{clearTimeout(timer);resolve(window.bridge);};
   script.onerror=()=>{clearTimeout(timer);reject(Error('Playgama SDK blocked'));};
   document.head.append(script);
  });
 }
 async function initializePlaygama(){
  try{
   bridge=await loadBridgeScript();
   if(!bridge||typeof bridge.initialize!=='function')throw Error('Bridge unavailable');
   await bridge.initialize();
   ready=true;api.status='ready';api.provider='playgama';
   const platform=bridge.platform;
   platformMuted=platform?.isAudioEnabled===false;
   hostPaused=platform?.isPaused===true;
   notifyAudio();
   try{
    platform?.on?.(bridge.EVENT_NAME.AUDIO_STATE_CHANGED,enabled=>{
     platformMuted=!enabled;notifyAudio();
    });
    platform?.on?.(bridge.EVENT_NAME.PAUSE_STATE_CHANGED,paused=>{
     hostPaused=!!paused;notifyAudio();notifyPause();
    });
   }catch(_){}
   if(!new URLSearchParams(location.search).has('tester')){
    // Restore cloud progress before game.js reads the existing save key.
    // Never replace a local save with missing/invalid remote data.
    try{
     const stored=await bridge.storage.get([cloudKey,'infiniti-space-language']);
     const raw=stored?.[cloudKey];
     if(typeof raw==='string'&&raw.length>2){
      const data=JSON.parse(raw);
      if(data?.version===1&&Number.isFinite(data.tier)&&data.tier>=0&&data.tier<=27){
       try{localStorage.setItem(cloudKey,raw);}catch(_){}
      }
     }
     const lang=stored?.['infiniti-space-language'];
     if(['en','ru','es'].includes(lang)&&!localStorage.getItem('infiniti-space-language')){
      window.SpaceI18n?.setLanguage?.(lang);
     }
    }catch(error){
     console.warn('Playgama cloud restore unavailable:',String(error?.message||error));
    }
   }
   sync();
  }catch(error){
   // A temporary SDK outage must never strand the user on a loading screen.
   console.warn('Playgama Bridge init unavailable:',String(error?.message||error));
   ready=false;bridge=null;api.status='standalone';
  }
 }
 if(playgamaBuild){
  api.bootstrap=initializePlaygama();
 }else if(window.CrazyGames?.SDK){
  initializeCrazy();
 }else{
  const script=document.createElement('script');
  script.src='https://sdk.crazygames.com/crazygames-sdk-v3.js';
  script.async=true;script.onload=initializeCrazy;
  script.onerror=()=>{api.status='standalone';};
  document.head.append(script);
 }
 window.addEventListener('pagehide',()=>api.flushSave());
 document.addEventListener('visibilitychange',()=>{
  if(document.hidden)api.flushSave();
 });
})();
