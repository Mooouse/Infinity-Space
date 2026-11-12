/* Infinity Space / Cosmic Worms — shared, persistent per-segment skin workshop.
   Runs in the main game menu and in the Cosmic Worms pause screen. */
(function(){
'use strict';
const KEY='infinity-space-worms-settings-v2';
const HEADS=['classic','blackhole','pulsar','comet','crystal','eclipse'];
const COLORS=['#ff1744','#ff6633','#ffe500','#ffb200','#27ff40','#79ff27','#2860ff','#648bff','#9922ff','#d64aff','#ffffff','#15192e','#f7a8ff','#8a3bff'];
const PRESETS=[
 ['nebula','Nebula','Туманность','Nebulosa',['#9922ff','#ff1744','#2860ff','#39006b']],
 ['aurora','Aurora','Сияние','Aurora',['#27ff40','#ffe500','#2860ff','#0b5e1e']],
 ['pulsar','Pulsar','Пульсар','Púlsar',['#2860ff','#ffffff','#ffe500','#071d83']],
 ['flare','Solar Flare','Вспышка','Llamarada',['#ffe500','#ff1744','#ff6633','#7d2300']],
 ['horizon','Event Horizon','Горизонт','Horizonte',['#9922ff','#15192e','#2860ff','#ffffff']],
 ['supernova','Supernova','Сверхновая','Supernova',['#ff1744','#ffe500','#ffffff','#75041d']],
 ['comet','Comet Ice','Лёд кометы','Hielo de cometa',['#2860ff','#ffffff','#27ff40','#081260']],
 ['stardust','Stardust','Звёздная пыль','Polvo estelar',['#ffe500','#ffffff','#9922ff','#695009']],
 ['eclipse','Eclipse','Затмение','Eclipse',['#15192e','#ff1744','#a928ff','#ffe500']],
 ['meteor','Meteor','Метеор','Meteoro',['#ff1744','#ffe500','#601017','#ffffff']],
 ['galaxy','Spiral Galaxy','Спиральная галактика','Galaxia espiral',['#2860ff','#9922ff','#ffe500','#a928ff']],
 ['crystal','Crystal','Кристалл','Cristal',['#27ff40','#2860ff','#ffffff','#10255c']]
];
const L={
 ru:{title:'Конструктор червя',desc:'Выбирай готовый облик или раскрашивай каждый круг отдельно. Рисунок повторяется при росте червя.',
 templates:'Готовые стили',segment:'Цвет отдельных сегментов',palette:'Палитра',all:'Залить всё',stripes:'Чередовать',reset:'Сбросить рисунок',done:'Готово',close:'Закрыть',picked:'Сегмент',custom:'Свой цвет',tip:'Нажми на круг для окрашивания. Shift + нажатие — закрасить диапазон.'},
 en:{title:'Worm Workshop',desc:'Pick a preset or paint individual body circles. Your pattern continues as your worm grows.',
 templates:'Ready-made styles',segment:'Individual body circles',palette:'Colors',all:'Fill all',stripes:'Alternate',reset:'Reset pattern',done:'Done',close:'Close',picked:'Segment',custom:'Custom color',tip:'Click any circle to paint it. Shift + click paints a range.'},
 es:{title:'Taller de gusanos',desc:'Elige un estilo o pinta cada segmento. El patrón continúa al crecer.',
 templates:'Estilos',segment:'Segmentos individuales',palette:'Colores',all:'Rellenar',stripes:'Alternar',reset:'Restablecer',done:'Listo',close:'Cerrar',picked:'Segmento',custom:'Color propio',tip:'Pulsa un círculo para pintarlo. Mayús + clic pinta un rango.'}
};
const normalize=x=>/^#[0-9a-f]{6}$/i.test(x)?x.toLowerCase():null;
const presetColors=id=>PRESETS.find(x=>x[0]===id)?.[4]||PRESETS[0][4];
function load(){
 let raw={};try{raw=JSON.parse(localStorage.getItem(KEY)||'{}')||{}}catch(_){}
 const skin=PRESETS.some(p=>p[0]===raw.skin)?raw.skin:'nebula';
 const backup=presetColors(skin);
 return {
  ...raw,skin,head:HEADS.includes(raw.head)?raw.head:'classic',
  customEnabled:raw.customEnabled===true,
  customSegments:Array.from({length:64},(_,i)=>normalize(raw.customSegments?.[i])||backup[i%backup.length])
 };
}
function save(obj){
 try{localStorage.setItem(KEY,JSON.stringify(obj))}catch(_){}
 window.dispatchEvent(new CustomEvent('infinity-worm-skin-changed',{detail:{skin:obj.skin,customEnabled:obj.customEnabled,customSegments:obj.customSegments.slice(),head:obj.head}}));
}
let active=null;
function close(){
 if(!active)return;
 const {root,onClose}=active;
 active=null;root.remove();
 document.documentElement.classList.remove('worm-skin-workshop-open');
 if(typeof onClose==='function')onClose();
}
function open({onChange,onClose}={}){
 if(active){close()}
 const lang=/^(ru|en|es)$/.test(localStorage.getItem('infiniti-space-language')||'')?localStorage.getItem('infiniti-space-language'):(/^ru/i.test(navigator.language)?'ru':/^es/i.test(navigator.language)?'es':'en');
 const t=L[lang];
 let data=load(),selectedColor=COLORS[0],selectedIndex=0;
 const root=document.createElement('div');
 root.className='ws-overlay';root.setAttribute('role','dialog');root.setAttribute('aria-modal','true');root.setAttribute('aria-label',t.title);
 root.innerHTML='<section class="ws-dialog"><header class="ws-header"><div><span class="ws-eyebrow">INFINITY SPACE / COSMIC WORMS</span><h2 class="ws-title"></h2><p class="ws-desc"></p></div><button class="ws-x" type="button" aria-label=""></button></header>'+
 '<div class="ws-body"><h3 class="ws-presets-title"></h3><div class="ws-presets"></div>'+
 '<div class="ws-section"><h3 class="ws-head-heading"></h3><div class="ws-head-options"></div></div>'+
 '<div class="ws-section"><div class="ws-part-head"><h3 class="ws-segments-title"></h3><span class="ws-indicator"></span></div><p class="ws-tip"></p><div class="ws-segments" role="group"></div></div>'+
 '<div class="ws-section"><h3 class="ws-palette-title"></h3><div class="ws-palette"></div><label class="ws-custom-label"><span class="ws-custom-title"></span><input type="color" class="ws-custom" value="#ff1744"></label></div>'+
 '</div><footer class="ws-footer"><button class="ws-reset" type="button"></button><button class="ws-stripes" type="button"></button><button class="ws-fill" type="button"></button><button class="ws-done" type="button"></button></footer></section>';
 const $=s=>root.querySelector(s);
 $('.ws-title').textContent=t.title;$('.ws-desc').textContent=t.desc;
 $('.ws-x').textContent='×';$('.ws-x').setAttribute('aria-label',t.close);
 $('.ws-presets-title').textContent=t.templates;$('.ws-segments-title').textContent=t.segment;
 $('.ws-tip').textContent=t.tip;$('.ws-palette-title').textContent=t.palette;
 $('.ws-custom-title').textContent=t.custom;
 $('.ws-head-heading').textContent=lang==='ru'?'Форма головы':lang==='es'?'Forma de cabeza':'Head shape';
 const headLabels={classic:['Классическая','Classic','Clásica'],blackhole:['Чёрная дыра','Black Hole','Agujero negro'],pulsar:['Пульсар','Pulsar','Púlsar'],comet:['Комета','Comet','Cometa'],crystal:['Кристалл','Crystal','Cristal'],eclipse:['Затмение','Eclipse','Eclipse']};
 for(const id of HEADS){const b=document.createElement('button');b.type='button';b.className='ws-head-choice';b.dataset.head=id;b.innerHTML='<span class="ws-head-symbol" aria-hidden="true"></span><span></span>';b.lastChild.textContent=headLabels[id][lang==='ru'?0:lang==='es'?2:1];b.onclick=()=>{data.head=id;persist();root.querySelectorAll('.ws-head-choice').forEach(x=>x.classList.toggle('selected',x.dataset.head===id))};$('.ws-head-options').append(b)}
 root.querySelectorAll('.ws-head-choice').forEach(x=>x.classList.toggle('selected',x.dataset.head===data.head));
 $('.ws-reset').textContent=t.reset;$('.ws-stripes').textContent=t.stripes;
 $('.ws-fill').textContent=t.all;$('.ws-done').textContent=t.done;
 const persist=()=>{save(data);if(typeof onChange==='function')onChange(data)};
 const colorsForView=()=>data.customEnabled?data.customSegments:Array.from({length:64},(_,i)=>presetColors(data.skin)[i%presetColors(data.skin).length]);
 function renderSegments(){
  const list=$('.ws-segments');list.replaceChildren();
  const colors=colorsForView();
  colors.forEach((color,i)=>{
   const item=document.createElement('button');item.type='button';
   item.className='ws-bead'+(selectedIndex===i?' selected':'');
   item.style.setProperty('--bead-color',color);
   item.title=(i+1)+' — '+color;item.setAttribute('aria-label',(i+1)+' — '+color);
   item.onclick=e=>{
    const old=selectedIndex;
    if(!data.customEnabled){data.customSegments=colors.slice();data.customEnabled=true}
    if(e.shiftKey){for(let j=Math.min(old,i);j<=Math.max(old,i);j++)data.customSegments[j]=selectedColor}
    else data.customSegments[i]=selectedColor;
    selectedIndex=i;persist();renderSegments();renderPresets();
   };
   list.append(item);
  });
  $('.ws-indicator').textContent=t.picked+' '+(selectedIndex+1)+' / 64';
 }
 function renderPresets(){
  const list=$('.ws-presets');list.replaceChildren();
  PRESETS.forEach(p=>{
   const item=document.createElement('button');item.type='button';
   item.className='ws-preset'+(data.skin===p[0]&&!data.customEnabled?' selected':'');
   item.setAttribute('aria-pressed',String(data.skin===p[0]&&!data.customEnabled));
   const beads=document.createElement('span');beads.className='ws-preset-beads';
   for(const color of p[4].slice(0,4)){
    const bead=document.createElement('i');bead.style.background=color;beads.append(bead);
   }
   const label=document.createElement('span');label.textContent=p[lang==='ru'?2:lang==='es'?3:1];
   item.append(beads,label);
   item.onclick=()=>{
    data.skin=p[0];data.customEnabled=false;data.customSegments=Array.from({length:64},(_,i)=>p[4][i%p[4].length]);
    persist();renderPresets();renderSegments();
   };
   list.append(item);
  });
 }
 function renderPalette(){
  const list=$('.ws-palette');list.replaceChildren();
  COLORS.forEach(color=>{
   const item=document.createElement('button');item.type='button';
   item.className='ws-color'+(selectedColor===color?' selected':'');
   item.style.setProperty('--bead-color',color);item.title=color;item.setAttribute('aria-label',color);
   item.setAttribute('aria-pressed',String(selectedColor===color));
   item.onclick=()=>{selectedColor=color;$('.ws-custom').value=color;renderPalette()};
   list.append(item);
  });
 }
 $('.ws-custom').addEventListener('input',e=>{selectedColor=normalize(e.target.value)||COLORS[0];renderPalette()});
 $('.ws-reset').onclick=()=>{
  data.customEnabled=false;data.customSegments=Array.from({length:64},(_,i)=>presetColors(data.skin)[i%presetColors(data.skin).length]);
  persist();renderPresets();renderSegments();
 };
 $('.ws-stripes').onclick=()=>{
  const prev=data.customSegments[selectedIndex]||presetColors(data.skin)[1];
  data.customEnabled=true;data.customSegments=data.customSegments.map((_,i)=>i%2?prev:selectedColor);
  persist();renderPresets();renderSegments();
 };
 $('.ws-fill').onclick=()=>{data.customEnabled=true;data.customSegments.fill(selectedColor);persist();renderPresets();renderSegments()};
 $('.ws-done').onclick=close;$('.ws-x').onclick=close;
 root.addEventListener('pointerdown',e=>{if(e.target===root)close()});
 const esc=e=>{if(e.key==='Escape'&&active?.root===root){e.preventDefault();e.stopImmediatePropagation();close()}};
 window.addEventListener('keydown',esc,true);
 const oldClose=onClose;onClose=()=>{window.removeEventListener('keydown',esc,true);if(typeof oldClose==='function')oldClose()};
 document.body.append(root);document.documentElement.classList.add('worm-skin-workshop-open');
 active={root,onClose};
 renderPresets();renderPalette();renderSegments();
 return close;
}
window.WormSkinStudio={open,close,read:load,presets:PRESETS};
})();