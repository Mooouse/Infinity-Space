/* Infinity Space — one music library and playlist for every arcade mode.
   Reads the canonical Endless Space save rather than creating a second shop. */
(()=>{'use strict';
const tracks=window.SpaceMusicTracks||[];
const params=new URLSearchParams(location.search);
const previewParams=new URLSearchParams(location.hash.slice(1));
if(!tracks.length||params.has('demo')||previewParams.has('demo'))return;
const locale=()=>{
 let language='en';try{language=localStorage.getItem('infiniti-space-language')||navigator.language||'en'}catch(_){}
 return /^ru/i.test(language)?'ru':/^es/i.test(language)?'es':'en';
};
const translation=(en,ru,es)=>({ru,es,en})[locale()];
const SAVE='cosmic-evolution-save-v1';
const safeRead=()=>{
 try{const value=JSON.parse(localStorage.getItem(SAVE)||'null');return value&&typeof value==='object'?value:null;}catch(_){return null;}
};
const first=tracks[0];
const owned=data=>new Set([first.id,...(Array.isArray(data?.ownedTracks)?data.ownedTracks:[])]);
const activeTrack=data=>tracks.find(t=>t.id===data?.activeTrack&&owned(data).has(t.id))||first;
const priceLabel=n=>n>=1e6?n.toExponential(2).replace('+',''):Math.floor(n).toLocaleString(locale());
let audio=null,selected=null,suspended=false,modal=null;
function sync(){
 const save=safeRead();const track=activeTrack(save);
 if(selected!==track.id){
  audio?.pause();audio=null;selected=track.id;
  try{audio=new Audio(track.src);audio.loop=true;audio.preload='auto';}catch(_){}
 }
 const muted=suspended||save?.music===false||window.SpacePlatform?.muted===true;
 if(audio)audio.volume=muted?0:Math.min(1,Math.max(0,Number(save?.musicVolume??.65)));
 if(!muted&&audio?.paused)audio.play().catch(()=>{});
 if(muted)audio?.pause();
 const button=document.querySelector('#mode-music-open');
 if(button){button.setAttribute('aria-label',translation('Music collection','Коллекция музыки','Colección musical'));
 button.title=translation('Music collection','Коллекция музыки','Colección musical');
 const caption=button.querySelector('.mode-music-button-label');if(caption)caption.textContent=translation('MUSIC','МУЗЫКА','MÚSICA');}
}
function saveSelection(track,disable=false){
 let saved=safeRead();
 if(!saved){
  if(track.id!==first.id)return false;
  saved={version:1,credits:0,ownedTracks:[first.id],activeTrack:first.id,music:true,musicVolume:.65};
 }
 const bought=owned(saved);
 if(!disable&&!bought.has(track.id)){
  if((Number(saved.credits)||0)<track.price)return false;
  saved.credits-=track.price;bought.add(track.id);
 }
 if(disable)saved.music=!saved.music;
 else{saved.activeTrack=track.id;saved.music=true;}
 saved.ownedTracks=[...bought];
 try{const json=JSON.stringify(saved);localStorage.setItem(SAVE,json);window.SpacePlatform?.persist?.(json);}catch(_){return false;}
 sync();return true;
}
function close(){
 modal?.remove();modal=null;
 document.removeEventListener('keydown',onEscape,true);
}
function onEscape(ev){
 if(ev.key==='Escape'&&modal){ev.preventDefault();ev.stopImmediatePropagation();close();}
}
function open(){
 if(modal){close();return;}
 const saved=safeRead(),balance=Number(saved?.credits)||0,purchased=owned(saved),chosen=activeTrack(saved);
 modal=document.createElement('div');modal.className='mode-music-overlay';
 modal.setAttribute('role','dialog');modal.setAttribute('aria-modal','true');
 modal.setAttribute('aria-label',translation('Music collection','Коллекция музыки','Colección musical'));
 const dialog=document.createElement('section');dialog.className='mode-music-dialog';
 const heading=document.createElement('header');heading.className='mode-music-heading';
 heading.innerHTML='<div><small>INFINITY SPACE / SOUNDTRACK</small><h2></h2><p></p></div>';
 heading.querySelector('h2').textContent=translation('MUSIC COLLECTION','КОЛЛЕКЦИЯ МУЗЫКИ','COLECCIÓN DE MÚSICA');
 heading.querySelector('p').textContent=translation('One soundtrack across every game mode','Одна музыкальная коллекция для всех режимов','Una colección musical para todos los modos');
 const dismiss=document.createElement('button');dismiss.type='button';dismiss.className='mode-music-close';
 dismiss.textContent='×';dismiss.setAttribute('aria-label',translation('Close','Закрыть','Cerrar'));dismiss.onclick=close;heading.append(dismiss);
 const wallet=document.createElement('div');wallet.className='mode-music-wallet';
 wallet.textContent='✦ '+priceLabel(balance)+' '+translation('STARDUST','ЗВЁЗДНАЯ ПЫЛЬ','POLVO ESTELAR');
 const list=document.createElement('div');list.className='mode-music-list';
 for(const track of tracks){
  const row=document.createElement('article');row.className='mode-music-track';
  if(track.id===chosen.id)row.classList.add('current');
  const cover=document.createElement('img');cover.src=track.cover;cover.alt='';cover.loading='lazy';
  const info=document.createElement('div');info.className='mode-music-copy';
  const label=document.createElement('strong');label.textContent=track.title;
  const subtitle=document.createElement('small');subtitle.textContent=track.subtitle||'';
  const price=document.createElement('small');price.className='mode-music-cost';
  price.textContent=track.id===first.id?translation('FREE','БЕСПЛАТНО','GRATIS'):purchased.has(track.id)?
   translation('UNLOCKED','ОТКРЫТО','DESBLOQUEADO'):'✦ '+priceLabel(track.price);
  info.append(label,subtitle,price);
  const act=document.createElement('button');act.type='button';
  const canPlay=purchased.has(track.id),playing=track.id===chosen.id&&saved?.music!==false;
  act.textContent=playing?translation('PLAYING','ИГРАЕТ','SONANDO'):canPlay?
   translation('PLAY','СЛУШАТЬ','ESCUCHAR'):translation('UNLOCK','ОТКРЫТЬ','DESBLOQUEAR');
  act.disabled=!canPlay&&balance<track.price;act.title=act.disabled?
   translation('Not enough stardust','Недостаточно звёздной пыли','Polvo estelar insuficiente'):'';
  act.onclick=()=>{if(saveSelection(track)){close();open();}};
  row.append(cover,info,act);list.append(row);
 }
 const actions=document.createElement('footer');actions.className='mode-music-actions';
 const mute=document.createElement('button');mute.type='button';mute.textContent=saved?.music===false?
 translation('ENABLE MUSIC','ВКЛЮЧИТЬ МУЗЫКУ','ACTIVAR MÚSICA'):
 translation('MUTE MUSIC','ВЫКЛЮЧИТЬ МУЗЫКУ','SILENCIAR MÚSICA');
 mute.onclick=()=>{saveSelection(chosen,true);close();open();};
 const exit=document.createElement('button');exit.type='button';exit.textContent=translation('BACK TO GAME','В ИГРУ','VOLVER AL JUEGO');exit.onclick=close;
 actions.append(mute,exit);dialog.append(heading,wallet,list,actions);modal.append(dialog);
 modal.addEventListener('pointerdown',e=>{if(e.target===modal)close()});
 document.body.append(modal);document.addEventListener('keydown',onEscape,true);
}
function boot(){
 const button=document.createElement('button');button.id='mode-music-open';button.type='button';
 button.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 19V5l12-2v14"/><circle cx="5" cy="19" r="3"/><circle cx="17" cy="17" r="3"/></svg><span class="mode-music-button-label">MUSIC</span>';
 button.onclick=open;document.body.append(button);
 sync();
 const wake=()=>sync();
 document.addEventListener('pointerdown',wake,{capture:true,passive:true});
 document.addEventListener('keydown',wake,{capture:true});
 window.addEventListener('storage',e=>{if(e.key===SAVE)sync()});
 window.SpaceModeMusic={open,close,sync,owned:()=>[...owned(safeRead())],current:()=>activeTrack(safeRead()).id};
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
