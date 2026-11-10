/* Playgama boot gate: restore Bridge cloud progress before starting the game. */
(() => {
 'use strict';
 let started=false;
 function start(){
  if(started)return;
  started=true;
  const tag=document.createElement('script');
  tag.src='game.js?v=3.60.0';
  tag.async=true;
  tag.onerror=()=>console.error('Infinity Space: game.js could not load');
  document.body.append(tag);
 }
 const ready=window.SpacePlatform?.bootstrap||Promise.resolve();
 Promise.race([
  ready,
  new Promise(resolve=>setTimeout(resolve,26000))
 ]).then(start,start);
})();
