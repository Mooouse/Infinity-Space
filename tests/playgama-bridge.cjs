'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync('platform.js','utf8');
const delay=t=>new Promise(resolve=>setTimeout(resolve,t));
(async()=>{
 const msgs=[],events=new Map(),adEvents=new Map(),saves=[];
 const key='cosmic-evolution-save-v1';
 const original=JSON.stringify({version:1,tier:4,credits:987,matter:15});
 const lang='ru';
 const local=new Map();
 const b={
  EVENT_NAME:{
   AUDIO_STATE_CHANGED:'AUDIO',PAUSE_STATE_CHANGED:'PAUSE',
   REWARDED_STATE_CHANGED:'REWARDED',INTERSTITIAL_STATE_CHANGED:'INTERSTITIAL'
  },
  async initialize(){},
  platform:{
   id:'playgama',language:'ru',isAudioEnabled:true,isPaused:false,
   on(type,callback){events.set(type,callback)},
   sendMessage(type){msgs.push(type);return Promise.resolve()}
  },
  storage:{
   async get(keys){assert.deepEqual(Array.from(keys),[key,'infiniti-space-language']);return {[key]:original,'infiniti-space-language':lang}},
   async set(keys,values){saves.push({keys:Array.from(keys),values:Array.from(values)})}
  },
  advertisement:{
   isRewardedSupported:true,isInterstitialSupported:true,
   on(type,listener){adEvents.set(type,listener)},
   off(type,listener){if(adEvents.get(type)===listener)adEvents.delete(type)},
   showRewarded(){return Promise.resolve()},
   showInterstitial(){return Promise.resolve()}
  }
 };
 const audio=[],pauses=[];
 const window={
  __INFINITY_PLAYGAMA:true,bridge:b,
  dispatchEvent(e){if(e.type==='space-platform-audio')audio.push(e.type);if(e.type==='space-platform-pause')pauses.push(e.detail?.paused)},
  SpaceI18n:{setLanguage(v){local.set('infiniti-space-language',v)}}
 };
 const doc={hidden:false,addEventListener(){}};
 const context={
  window, document:doc,location:{search:''},URLSearchParams,Promise,
  setTimeout,clearTimeout,console,performance:{now:()=>Date.now()},
  Event:class {constructor(type){this.type=type}},
  CustomEvent:class{constructor(type,props){this.type=type;this.detail=props.detail}},
  localStorage:{getItem:k=>local.get(k)||null,setItem:(k,v)=>local.set(k,v)}
 };
 vm.createContext(context);vm.runInContext(source,context);
 await window.SpacePlatform.bootstrap;
 const api=window.SpacePlatform;
 assert.equal(api.status,'ready');
 assert.equal(api.provider,'playgama');
 assert.equal(api.adsAvailable,true);
 assert.equal(local.get(key),original,'Cloud save must be restored before game boot');
 assert.equal(local.get('infiniti-space-language'),'ru','Platform language persisted');
 api.loaded();api.playing(true);api.playing(false);
 assert.deepEqual(msgs,['game_ready','level_started','level_paused'],'Game lifecycle messages');
 events.get('AUDIO')(false);assert.equal(api.muted,true);
 events.get('AUDIO')(true);assert.equal(api.muted,false);
 events.get('PAUSE')(true);assert.equal(api.hostPaused,true);
 assert.deepEqual(pauses,[true]);
 events.get('PAUSE')(false);assert.equal(api.hostPaused,false);
 const cancelled=api.requestAd('rewarded');
 assert.equal(api.adBusy,true);
 adEvents.get('REWARDED')('opened');
 adEvents.get('REWARDED')('closed');
 assert.equal(await cancelled,false,'Never grant reward on close without rewarded state');
 const completed=api.requestAd('rewarded');
 adEvents.get('REWARDED')('rewarded');
 assert.equal(await completed,true,'Reward granted only after explicit rewarded state');
 const commercial=api.requestAd('midgame');
 adEvents.get('INTERSTITIAL')('closed');
 assert.equal(await commercial,true,'Interstitial ends on closed');
 const consecutive=await api.requestAd('midgame');
 assert.equal(consecutive,false,'Interstitial cooldown prevents spam');
 api.saveSnapshot(key,JSON.stringify({version:1,tier:5,credits:1000}));
 await delay(1500);
 assert.ok(saves.some(x=>x.keys[0]===key&&JSON.parse(x.values[0]).credits===1000),'Bridge storage.set must save game progress');
 api.saveLanguage('es');
 await delay(10);
 assert.ok(saves.some(x=>x.keys[0]==='infiniti-space-language'&&x.values[0]==='es'),'Language changes sync to Bridge');
 assert.ok(audio.length>=3,'Ads/host state should update music mute');
 console.log('PASS Playgama: init, cloud restore/sync, game_ready, pause/mute, rewarded security, interstitial cooldown, settings');
})().catch(e=>{console.error(e.stack||e);process.exit(1)});
