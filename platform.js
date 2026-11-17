/* Platform lifecycle, audio settings and persistent progress. */
(() => {
 'use strict';
 let sdk=null,ready=false,wantsPlay=false,sentPlay=false,loaded=false,loadingReported=false,lastHappy=-Infinity,muted=false;
 const memory=new Map();
 const local={
  getItem(key){try{return localStorage.getItem(key);}catch(_){return memory.get(key)??null;}},
  setItem(key,value){memory.set(key,String(value));try{localStorage.setItem(key,String(value));}catch(_){}},
  removeItem(key){memory.delete(key);try{localStorage.removeItem(key);}catch(_){}}
 };
 let data=local;
 const storage={
  getItem(key){return data.getItem(key);},
  setItem(key,value){data.setItem(key,String(value));},
  removeItem(key){data.removeItem(key);}
 };
 function call(name){try{sdk?.game?.[name]?.();}catch(_){}}
 function sync(){
  if(!ready)return;
  if(loaded&&!loadingReported){loadingReported=true;call('loadingStop');}
  if(wantsPlay!==sentPlay){sentPlay=wantsPlay;call(wantsPlay?'gameplayStart':'gameplayStop');}
 }
 function settings(value){muted=!!value?.muteAudio;window.dispatchEvent(new Event('space-platform-audio'));}
 const api=window.SpacePlatform={storage,status:'loading',get muted(){return muted;},
  playing(value){wantsPlay=!!value;sync();},loaded(){loaded=true;sync();},
  happy(){if(ready&&performance.now()-lastHappy>60000){lastHappy=performance.now();call('happytime');}}
 };
 api.startup=(async()=>{
  try{
   if(!window.CrazyGames?.SDK)await new Promise((resolve,reject)=>{
    const script=document.createElement('script');script.src='https://sdk.crazygames.com/crazygames-sdk-v3.js';
    const timer=setTimeout(()=>reject(Error('SDK load timeout')),8000);
    script.onload=()=>{clearTimeout(timer);resolve();};script.onerror=()=>{clearTimeout(timer);reject(Error('SDK unavailable'));};document.head.append(script);
   });
   sdk=window.CrazyGames?.SDK;await sdk.init();
   if(!['local','crazygames'].includes(sdk.environment)){sdk=null;api.status='standalone';return;}
   ready=true;api.status='ready';call('loadingStart');
   try{
    const cloud=sdk.data;
    // Read before writing. Existing platform progress always wins over local migration.
    cloud.getItem('cosmic-evolution-save-v1');
    data=cloud;
    const keys=[];try{for(let i=0;i<localStorage.length;i++){const key=localStorage.key(i);if(/^(cosmic-evolution-save-v1|infinity-space-|infiniti-space-)/.test(key)&&!key.endsWith('-backup'))keys.push(key);}}catch(_){}
    for(const key of keys){if(cloud.getItem(key)===null){const value=local.getItem(key);if(value!==null)cloud.setItem(key,value);}}
    data=cloud;
   }catch(error){api.storageError=error?.code||'unavailable';}
   settings(sdk.game.settings);sdk.game.addSettingsChangeListener?.(settings);sync();
  }catch(_){sdk=null;ready=false;api.status='standalone';}
 })();
})();
