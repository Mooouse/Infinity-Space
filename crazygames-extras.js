/* CrazyGames-only advertising for competitive modes.
   Never invoke the Playgama bridge or show its inventory on other portals. */
(()=>{
 'use strict';
 function crazyEnvironment(){
  if(window.SpacePlaygamaBuild===true||location.protocol==='blob:'||
     /(^|\.)playgama\.(com|io)$/.test(location.hostname||'')||
     new URLSearchParams(location.search).has('playgama'))return false;
  try{
   const env=window.CrazyGames?.SDK?.environment;
   return env==='crazygames'||env==='local';
  }catch(_){return false;}
 }
 let busy=false;
 const api={
  get supported(){return crazyEnvironment();},
  get available(){return crazyEnvironment()&&!busy&&window.SpacePlatform?.adsAvailable===true;},
  get busy(){return busy;},
  rewarded:()=>request('rewarded'),
  midgame:()=>request('midgame')
 };
 window.SpaceCrazyAds=api;
 async function request(type){
  if(!api.available)return false;
  busy=true;
  window.dispatchEvent(new CustomEvent('space-crazy-ad-request',{detail:{active:true,type}}));
  try{
   // Platform bridge resolves true only from the SDK's adFinished callback;
   // an unfilled/error/disabled ad never yields a reward.
   return await window.SpacePlatform.requestAd(type)===true;
  }catch(_){return false}
  finally{
   busy=false;
   window.dispatchEvent(new CustomEvent('space-crazy-ad-request',{detail:{active:false,type}}));
  }
 }
})();
