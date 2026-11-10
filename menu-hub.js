/* Infinity Space — main menu experience.
 * Presentation only: original game handlers, saves, language and reward flow
 * stay attached to the EXISTING buttons when they move into the new layout.
 */
(()=>{'use strict';
 const words={
  ru:{modes:'РЕЖИМЫ ИГРЫ',modesSub:'Арена · Выживание · Захват · Гонка',world:'ТВОЯ ВСЕЛЕННАЯ',
      worldSub:'Прогресс и открытия',bonus:'БОНУСЫ',bonusSub:'Награды каждый день',
      more:'ЕЩЁ',less:'СВЕРНУТЬ',progress:'ТЕКУЩАЯ ЭВОЛЮЦИЯ',newSub:'Начать с начала',
      tabMap:'Карта',tap:'Открыть',progressTitle:'Прогресс'},
  en:{modes:'GAME MODES',modesSub:'Arena · Royale · Conquest · Race',world:'YOUR UNIVERSE',
      worldSub:'Progress and discoveries',bonus:'BONUSES',bonusSub:'Claim daily rewards',
      more:'MORE',less:'COLLAPSE',progress:'CURRENT EVOLUTION',newSub:'Start over',
      tabMap:'Map',tap:'Open',progressTitle:'Progress'},
  es:{modes:'MODOS DE JUEGO',modesSub:'Arena · Supervivencia · Control · Carrera',
      world:'TU UNIVERSO',worldSub:'Progreso y descubrimientos',bonus:'BONOS',
      bonusSub:'Recompensas diarias',more:'MÁS',less:'CERRAR',
      progress:'EVOLUCIÓN ACTUAL',newSub:'Comenzar de nuevo',tabMap:'Mapa',
      tap:'Abrir',progressTitle:'Progreso'}
 };
 const esc=text=>String(text).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const q=(parent,selector)=>parent?.querySelector(selector);
 function reshape(root){
  if(!root||root.dataset.hubReady==='true')return;
  const main=q(root,'.menu-main'),grid=q(root,'.menu-grid'),actions=q(root,'.menu-buttons');
  const play=q(actions,'.primary.big-play'),reset=q(actions,'.quiet-btn');
  const daily=q(root,'[data-reward-page="daily"]'),roulette=q(root,'[data-reward-page="roulette"]');
  const modes=[...root.querySelectorAll('.modes-menu-entry')].find(b=>!b.textContent.toLowerCase().includes('arena')&&!b.textContent.toLowerCase().includes('арена'))||
    [...root.querySelectorAll('.modes-menu-entry')].at(-1);
  if(!main||!grid||!actions||!play||!reset||!daily||!roulette||!modes)return;
  root.dataset.hubReady='true';
  const code=q(root,'#current-language-code')?.textContent?.trim()?.toLowerCase()||'ru';
  const w=words[code]||words.ru;
  main.classList.add('hub-menu');
  const divider=q(main,'.menu-divider');divider?.remove();
  actions.classList.add('hub-actions');
  play.classList.add('hub-continue');
  reset.classList.add('hub-new-world');
  modes.classList.add('hub-modes');
  modes.removeAttribute('title');
  modes.setAttribute('aria-label',w.modes);
  // Keep the native SVG and click handler; move the button instead of cloning.
  const modeText=modes.children[1];
  if(modeText){modeText.innerHTML='<strong>'+esc(w.modes)+'</strong><small>'+esc(w.modesSub)+'</small>';}
  actions.insertBefore(modes,reset);
  const description=document.createElement('div');
  description.className='hub-reset-description';
  description.textContent=w.newSub;reset.appendChild(description);
  const footer=q(root,'.menu-foot');
  const epoch=footer?.children?.[1]?.textContent||'';
  const percent=footer?.querySelector('.mint')?.textContent||'0%';
  const fraction=footer?.querySelector('.menuprog > div')?.style.width||'0%';
  const stage=document.createElement('section');
  stage.className='hub-current';
  stage.setAttribute('aria-label',w.progress);
  stage.innerHTML='<div class="hub-current-info"><span class="hub-current-mark">✧</span>'+
   '<div class="hub-current-label"><small>'+esc(w.progress)+'</small><strong>'+esc(epoch)+'</strong></div>'+
   '<b class="hub-current-percent">'+esc(percent)+'</b></div><div class="hub-current-bar"><span></span></div>';
  stage.querySelector('.hub-current-bar span').style.width=fraction;
  actions.insertAdjacentElement('afterend',stage);
  function sectionHead(title,subtitle){
   const el=document.createElement('div');el.className='hub-section-head';
   el.innerHTML='<strong>'+esc(title)+'</strong><small>'+esc(subtitle)+'</small>';return el;
  }
  const progress=document.createElement('section');
  progress.className='hub-progress';
  progress.append(sectionHead(w.world,w.worldSub));
  const progressGrid=document.createElement('div');progressGrid.className='hub-progress-grid';
  for(const name of ['map','evolution','achievements','music']){
   const button=q(grid,'[data-page="'+name+'"]');
   if(button){button.classList.add('hub-progress-tile');progressGrid.append(button);}
  }
  progress.append(progressGrid);main.append(progress);
  const bonuses=document.createElement('section');bonuses.className='hub-bonuses';
  bonuses.append(sectionHead(w.bonus,w.bonusSub));
  const utilityRow=document.createElement('div');utilityRow.className='hub-utility-row';
  daily.classList.add('hub-reward');
  roulette.classList.add('hub-reward');
  utilityRow.append(daily,roulette);
  const extraBtn=document.createElement('button');extraBtn.type='button';
  extraBtn.className='hub-more-button';
  extraBtn.innerHTML='<span class="hub-more-symbol">•••</span><strong>'+esc(w.more)+'</strong><span class="hub-more-caret">⌄</span>';
  extraBtn.setAttribute('aria-controls','hub-more-panel');extraBtn.setAttribute('aria-expanded','false');
  const extraPanel=document.createElement('div');extraPanel.id='hub-more-panel';extraPanel.className='hub-more-panel';extraPanel.hidden=true;
  for(const name of ['bestiary','statistics','settings']){
   const button=q(grid,'[data-page="'+name+'"]');
   if(button){button.classList.add('hub-extra-tile');extraPanel.append(button);}
  }
  extraBtn.onclick=()=>{
   const show=extraPanel.hidden;
   extraPanel.hidden=!show;
   extraBtn.setAttribute('aria-expanded',String(show));
   extraBtn.classList.toggle('open',show);
   q(extraBtn,'strong').textContent=show?w.less:w.more;
  };
  utilityRow.append(extraBtn);bonuses.append(utilityRow,extraPanel);main.append(bonuses);
  // The quick "Arena" link was redundant with the modes selector.
  grid.remove();
  main.scrollTop=0;
 }
 function refresh(){
  const root=document.querySelector('#modal #screen-menu');
  if(root)reshape(root);
 }
 function init(){
  const modal=document.getElementById('modal');
  if(!modal)return;
  new MutationObserver(refresh).observe(modal,{childList:true,subtree:false});
  refresh();
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
 else init();
})();
