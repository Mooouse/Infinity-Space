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
 ['crystal','Crystal','Кристалл','Cristal',['#27ff40','#2860ff','#ffffff','#10255c']],
 ['rift','Riftwalker','Разлом','Fractura',['#b832ff','#ff4bb7','#375aff','#270050']],
 ['dragon','Cosmic Dragon','Космический дракон','Dragón cósmico',['#fc244c','#ffdf47','#9d27ff','#570a2e']],
 ['royal','Royal Nebula','Королевская туманность','Nebulosa real',['#ffd24e','#a86cff','#ff76d1','#231461']],
 ['voidbloom','Void Bloom','Цветок пустоты','Flor del vacío',['#9c2ce7','#ff6cb9','#4b21b6','#080413']]
];
const L={
 ru:{title:'Конструктор червя',desc:'Выбирай цельный космический облик со звёздами и кометами внутри тела или настрой плавный перелив цветов.',
 templates:'Готовые стили',segment:'Цветовой перелив',palette:'Палитра',all:'Залить всё',stripes:'Чередовать',reset:'Сбросить рисунок',done:'Готово',close:'Закрыть',picked:'Сегмент',custom:'Свой цвет',tip:'Изменяй плавные цветовые переходы, не деля червя на секции.'},
 en:{title:'Worm Workshop',desc:'Choose a seamless cosmic body with living stars and comets, or customize its smooth color gradients.',
 templates:'Ready-made styles',segment:'Color gradient',palette:'Colors',all:'Fill all',stripes:'Alternate',reset:'Reset pattern',done:'Done',close:'Close',picked:'Segment',custom:'Custom color',tip:'Customize the seamless gradient; Shift + click edits a range.'},
 es:{title:'Taller de gusanos',desc:'Elige un cuerpo cósmico continuo con estrellas, cometas y degradados.',
 templates:'Estilos',segment:'Degradado',palette:'Colores',all:'Rellenar',stripes:'Alternar',reset:'Restablecer',done:'Listo',close:'Cerrar',picked:'Segmento',custom:'Color propio',tip:'Pulsa un círculo para pintarlo. Mayús + clic pinta un rango.'}
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
 const {root,onClose,previewCancel}=active;
 active=null;if(previewCancel)previewCancel();root.remove();
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
 '<div class="ws-body"><div class="ws-live-preview"><div class="ws-live-caption"><strong class="ws-preview-title"></strong><span class="ws-preview-hint"></span></div><canvas class="ws-preview-canvas" width="920" height="220" aria-label="Animated worm appearance preview"></canvas></div><h3 class="ws-presets-title"></h3><div class="ws-presets"></div>'+
 '<div class="ws-section"><h3 class="ws-head-heading"></h3><div class="ws-head-options"></div></div>'+
 '<details class="ws-advanced"><summary class="ws-advanced-summary"></summary>'+
 '<div class="ws-section"><div class="ws-part-head"><h3 class="ws-segments-title"></h3><span class="ws-indicator"></span></div><p class="ws-tip"></p><div class="ws-segments" role="group"></div></div>'+
 '<div class="ws-section"><h3 class="ws-palette-title"></h3><div class="ws-palette"></div><label class="ws-custom-label"><span class="ws-custom-title"></span><input type="color" class="ws-custom" value="#ff1744"></label></div></details>'+
 '</div><footer class="ws-footer"><button class="ws-reset" type="button"></button><button class="ws-stripes" type="button"></button><button class="ws-fill" type="button"></button><button class="ws-done" type="button"></button></footer></section>';
 const $=s=>root.querySelector(s);
 $('.ws-title').textContent=t.title;$('.ws-desc').textContent=t.desc;
 $('.ws-preview-title').textContent=lang==='ru'?'ЖИВОЙ ПРЕДПРОСМОТР':lang==='es'?'VISTA PREVIA ANIMADA':'LIVE IN-GAME PREVIEW';
 $('.ws-preview-hint').textContent=lang==='ru'?'Скин, голова и светящиеся частицы на движущемся черве':lang==='es'?'Diseño y partículas en movimiento':'Animated body, head and cosmic particles';
 $('.ws-x').textContent='×';$('.ws-x').setAttribute('aria-label',t.close);
 $('.ws-presets-title').textContent=t.templates;$('.ws-segments-title').textContent=t.segment;
 $('.ws-tip').textContent=t.tip;$('.ws-palette-title').textContent=t.palette;
 $('.ws-custom-title').textContent=t.custom;
 $('.ws-head-heading').textContent=lang==='ru'?'Форма головы':lang==='es'?'Forma de cabeza':'Head shape';
 $('.ws-advanced-summary').textContent=lang==='ru'?'НАСТРОЙКА ПЕРЕЛИВОВ · 64 ЦВЕТОВЫЕ ТОЧКИ':lang==='es'?'COLORES PERSONALIZADOS · 64 SEGMENTOS':'ADVANCED GRADIENT · 64 COLOR POINTS';
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
   item.dataset.skin=p[0];
   item.setAttribute('aria-pressed',String(data.skin===p[0]&&!data.customEnabled));
   const beads=document.createElement('span');
   beads.className='ws-preset-beads ws-preset-worm';
   beads.style.setProperty('--worm-skin-gradient','linear-gradient(90deg,'+
    [p[4][3],p[4][0],p[4][2],p[4][1]].join(',')+')');
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

 // Show the actual selected worm as a moving, fully-rendered body rather than
 // asking players to infer its appearance from 64 static colored buttons.
 const preview=$('.ws-preview-canvas'),pc=preview.getContext('2d');
 let previewFrame=0,lastPreviewPaint=0;
 function paintPreview(now){
  if(!root.isConnected)return;
  // 25fps is smooth for the worm while avoiding saturation of software canvas.
  if(now-lastPreviewPaint<39){previewFrame=requestAnimationFrame(paintPreview);return;}
  lastPreviewPaint=now;
  const w=preview.width,h=preview.height,t=now*.001;
  pc.clearRect(0,0,w,h);
  pc.fillStyle='#090719';pc.fillRect(0,0,w,h);
  for(let i=0;i<85;i++){
   const x=(i*397.71)%w,y=(i*181.39)%h;
   const a=.25+.5*(.5+.5*Math.sin(t*1.8+i*1.76));
   pc.fillStyle='rgba(227,220,255,'+a.toFixed(3)+')';
   pc.fillRect(x,y,i%11===0?2:1,i%11===0?2:1);
  }
  const colors=colorsForView(),count=59,body=[];
  for(let i=0;i<count;i++){
   const x=80+i*11.9;
   const y=111+Math.sin(i*.145-t*1.9)*21+Math.sin(i*.057+t*.55)*11;
   body.push({x,y});
  }
  // Render the same seamless nebula body as the game: no separate circles.
  pc.save();pc.lineCap='round';pc.lineJoin='round';
  const path=new Path2D();path.moveTo(body[0].x,body[0].y);
  for(let i=1;i<count-1;i++){
   const p=body[i],q=body[i+1];
   path.quadraticCurveTo(p.x,p.y,(p.x+q.x)*.5,(p.y+q.y)*.5);
  }
  path.lineTo(body[count-1].x,body[count-1].y);
  pc.shadowColor=presetColors(data.skin)[0];pc.shadowBlur=15;
  pc.lineWidth=49;pc.strokeStyle='#0d071d';pc.stroke(path);pc.shadowBlur=0;
  const gradient=pc.createLinearGradient(body[0].x,0,body[count-1].x,0);
  if(data.customEnabled){
   for(let j=0;j<16;j++)gradient.addColorStop(j/15,colors[Math.floor(j*63/15)]);
  }else{
   const c=presetColors(data.skin);
   gradient.addColorStop(0,c[3]);gradient.addColorStop(.35,c[0]);
   gradient.addColorStop(.7,c[2]);gradient.addColorStop(1,c[1]);
  }
  pc.lineWidth=44;pc.strokeStyle=gradient;pc.stroke(path);
  const normal=body.map((p,i)=>{
   const a=body[Math.max(0,i-1)],b=body[Math.min(count-1,i+1)];
   const dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy)||1;
   return {x:-dy/len,y:dx/len};
  });
  const silhouette=new Path2D();
  body.forEach((p,i)=>{const v=normal[i];
   i?silhouette.lineTo(p.x+v.x*19,p.y+v.y*19):
     silhouette.moveTo(p.x+v.x*19,p.y+v.y*19);
  });
  for(let i=count-1;i>=0;i--){
   const p=body[i],v=normal[i];silhouette.lineTo(p.x-v.x*19,p.y-v.y*19);
  }
  silhouette.closePath();
  pc.save();pc.clip(silhouette);
  pc.fillStyle=data.skin==='horizon'?'#03020c':'#071022';pc.fill(silhouette);
  const theme=presetColors(data.skin);
  for(let i=5;i<count;i+=10){
   const p=body[i],v=normal[i],x=p.x+v.x*Math.sin(t+i)*7,y=p.y+v.y*Math.sin(t+i)*7;
   const cloud=pc.createRadialGradient(x,y,0,x,y,38),color=theme[(i/10|0)%3];
   cloud.addColorStop(0,color+'cc');cloud.addColorStop(.45,color+'66');cloud.addColorStop(1,color+'00');
   pc.fillStyle=cloud;pc.fillRect(x-38,y-38,76,76);
  }
  for(let i=3;i<count-2;i+=2){
   const p=body[i],v=normal[i],x=p.x+v.x*Math.sin(t+i*1.7)*13,y=p.y+v.y*Math.sin(t+i*1.7)*13;
   pc.globalAlpha=.55+.45*Math.sin(t*3+i*11.1)**2;
   pc.fillStyle=i%9===0?'#ffe7aa':'#fffaf5';
   pc.beginPath();pc.arc(x,y,i%7===0?2.2:1.2,0,Math.PI*2);pc.fill();
  }
  pc.globalAlpha=1;
  for(let j=0;j<3;j++){
   const i=Math.max(1,Math.floor(count-4-(t*(8+j*.8)+j*15)%(count-8)));
   const p=body[i],tail=body[Math.min(count-1,i+7)];
   const trail=pc.createLinearGradient(tail.x,tail.y,p.x,p.y);
   trail.addColorStop(0,'#ffffff00');trail.addColorStop(.5,theme[j]+'aa');trail.addColorStop(1,'#ffffff');
   pc.strokeStyle=trail;pc.lineWidth=2.5;pc.beginPath();pc.moveTo(tail.x,tail.y);
   for(let k=Math.min(count-1,i+6);k>=i;k--)pc.lineTo(body[k].x,body[k].y);
   pc.stroke();
   pc.fillStyle='#fff';pc.beginPath();pc.arc(p.x,p.y,3,0,Math.PI*2);pc.fill();
  }
  pc.restore();
  const head=body[count-1],next=body[count-2],angle=Math.atan2(head.y-next.y,head.x-next.x);
  pc.translate(head.x,head.y);pc.rotate(angle);
  const radius=25,accent=data.customEnabled?colors[0]:presetColors(data.skin)[0];
  pc.shadowColor=accent;pc.shadowBlur=17;
  if(data.head==='blackhole'){
   const g=pc.createRadialGradient(0,0,3,0,0,48);
   g.addColorStop(0,'#000008');g.addColorStop(.38,'#080515');
   g.addColorStop(.52,'#ffd25e');g.addColorStop(.64,'#ee3c9c');
   g.addColorStop(.86,'#7737ff99');g.addColorStop(1,'#7737ff00');
   pc.fillStyle=g;pc.beginPath();pc.arc(0,0,48,0,Math.PI*2);pc.fill();
   pc.fillStyle='#000006';pc.beginPath();pc.arc(0,0,18,0,Math.PI*2);pc.fill();
   pc.strokeStyle='#ffe5b0';pc.lineWidth=3;pc.beginPath();pc.ellipse(0,0,35,12,-.28,0,Math.PI*2);pc.stroke();
   pc.shadowBlur=0;
   for(let i=0;i<8;i++){
    const a=t*3+i*Math.PI/4;
    pc.fillStyle=i%2?'#ffe599':'#fc7de6';pc.beginPath();
    pc.arc(Math.cos(a)*30,Math.sin(a)*12,2.2,0,Math.PI*2);pc.fill();
   }
  }else{
   pc.fillStyle=data.head==='eclipse'?'#03030b':data.head==='crystal'?'#9e8aff':data.head==='comet'?'#ffec9d':accent;
   pc.strokeStyle='#f5dfff';pc.lineWidth=3;
   pc.beginPath();
   if(data.head==='crystal'||data.head==='comet'){
    for(let j=0;j<6;j++){
     const a=j*Math.PI/3,rad=data.head==='comet'&&j===3?37:radius;
     j?pc.lineTo(Math.cos(a)*rad,Math.sin(a)*rad):pc.moveTo(Math.cos(a)*rad,Math.sin(a)*rad);
    }
    pc.closePath();
   }else pc.arc(0,0,radius,0,Math.PI*2);
   pc.fill();pc.stroke();pc.shadowBlur=0;
   if(data.head==='pulsar'||data.head==='eclipse'){
    pc.strokeStyle=data.head==='pulsar'?'#ffe500':'#ff5b98';pc.lineWidth=5;
    pc.beginPath();pc.ellipse(0,0,36,11,-.35,0,Math.PI*2);pc.stroke();
   }else if(data.head==='classic'){
    for(const side of [-1,1]){
     pc.fillStyle='#fff';pc.beginPath();pc.arc(10,side*10,6,0,Math.PI*2);pc.fill();
     pc.fillStyle='#0a1023';pc.beginPath();pc.arc(12,side*10,2.5,0,Math.PI*2);pc.fill();
    }
   }
  }
  pc.restore();
  previewFrame=requestAnimationFrame(paintPreview);
 }

 active={root,onClose,previewCancel:()=>cancelAnimationFrame(previewFrame)};
 renderPresets();renderPalette();renderSegments();
 previewFrame=requestAnimationFrame(paintPreview);
 return close;
}
window.WormSkinStudio={open,close,read:load,presets:PRESETS};
})();