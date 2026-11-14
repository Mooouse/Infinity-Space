/* Infinity Space / Cosmic Worms — shared, persistent per-segment skin workshop.
   Runs in the main game menu and in the Cosmic Worms pause screen. */
(function(){
'use strict';
const KEY='infinity-space-worms-settings-v2';
const HEADS=["classic","pizza","pig","blackhole","cat","dragon","robot","alien","shark","skull","ghost","astronaut","planet","sun","comet","crystal","eclipse","pulsar","mushroom","crown","star","donut","fox","demon","octopus","ufo","panda","cyclops","frog","flame","rocket","lollipop"];
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
 ['voidbloom','Void Bloom','Цветок пустоты','Flor del vacío',['#9c2ce7','#ff6cb9','#4b21b6','#080413']],
 ['adnova','Neon Comet','Неоновая комета','Cometa neón',['#fa24a0','#ffce30','#7344ff','#270b62']],
 ['adember','Solar Candy','Солнечный леденец','Caramelo solar',['#ff572c','#ffe749','#ff256a','#481025']]
];
const L={
 ru:{title:'Конструктор червя',desc:'Выбирай цельный космический облик со звёздами и кометами внутри тела или настрой плавный перелив цветов.',
 templates:'Готовые стили',segment:'Цветовой перелив',palette:'Палитра',all:'Залить всё',stripes:'Чередовать',reset:'Сбросить рисунок',done:'Готово',close:'Закрыть',picked:'Сегмент',custom:'Свой цвет',tip:'Изменяй плавные цветовые переходы, не деля червя на секции.'},
 en:{title:'Worm Workshop',desc:'Choose a seamless cosmic body with living stars and comets, or customize its smooth color gradients.',
 templates:'Ready-made styles',segment:'Color gradient',palette:'Colors',all:'Fill all',stripes:'Alternate',reset:'Reset pattern',done:'Done',close:'Close',picked:'Segment',custom:'Custom color',tip:'Customize the seamless gradient; Shift + click edits a range.'},
 es:{title:'Taller de gusanos',desc:'Elige un cuerpo cósmico continuo con estrellas, cometas y degradados.',
 templates:'Estilos',segment:'Degradado',palette:'Colores',all:'Rellenar',stripes:'Alternar',reset:'Restablecer',done:'Listo',close:'Cerrar',picked:'Segmento',custom:'Color propio',tip:'Pulsa un círculo para pintarlo. Mayús + clic pinta un rango.'}
};
// Two skins and two heads are CrazyGames rewarded-only and persist independently
// from the selected settings. No ads are ever requested by the Playgama build.
const AD_ONLY_SKINS=new Set(['adnova','adember']);
const AD_ONLY_HEADS=new Set(['rocket','lollipop']);
const AD_REWARDS_KEY='infinity-space-crazy-worm-rewards-v1';
function ownedAdRewards(){
 try{
  const data=JSON.parse(localStorage.getItem(AD_REWARDS_KEY)||'{}');
  return {skins:Array.isArray(data.skins)?data.skins.filter(x=>AD_ONLY_SKINS.has(x)):[],
    heads:Array.isArray(data.heads)?data.heads.filter(x=>AD_ONLY_HEADS.has(x)):[]};
 }catch(_){return {skins:[],heads:[]}}
}
function adOwned(type,id){const k=type==='skin'?'skins':'heads';return ownedAdRewards()[k].includes(id);}
function grantAdReward(type,id){
 const valid=type==='skin'?AD_ONLY_SKINS.has(id):AD_ONLY_HEADS.has(id);
 if(!valid)return false;
 const all=ownedAdRewards(),key=type==='skin'?'skins':'heads';
 if(!all[key].includes(id))all[key].push(id);
 try{localStorage.setItem(AD_REWARDS_KEY,JSON.stringify(all))}catch(_){return false}
 return true;
}
function headUnlocked(id){return HEADS.includes(id)&&(!AD_ONLY_HEADS.has(id)||adOwned('head',id))}
const playgamaBuild=()=>window.SpacePlaygamaBuild===true||location.protocol==='blob:'||
 /(^|\.)playgama\.(com|io)$/.test(location.hostname||'')||
 new URLSearchParams(location.search).has('playgama');
// In standalone / disabled CrazyGames environments an inert 'watch ad'
// purchase would violate the SDK's launch requirements. Expose these
// optional offers only where the CrazyGames SDK can actually serve them.
const adRewardsVisible=()=>!playgamaBuild()&&window.SpaceCrazyAds?.supported===true;
// Preset skins are lasting rewards for rank-one finishes, eliminations
// and personal mass records. The first two are always available.
const UNLOCKS={
 pulsar:['kills',5],flare:['mass',400],horizon:['wins',1],
 supernova:['kills',15],comet:['mass',1200],stardust:['wins',3],
 eclipse:['mass',3000],meteor:['kills',40],galaxy:['wins',5],
 crystal:['mass',6000],rift:['wins',10],dragon:['kills',100],
 royal:['wins',20],voidbloom:['mass',12000]
};
function milestones(){
 const totals=window.InfinityProfile?.getStats?.().worms||{};
 const live=window.InfinityWormsProgress?.()||{};
 return {wins:Math.max(0,totals.wins||0),kills:Math.max(0,(totals.kills||0)+(live.kills||0)),
  mass:Math.max(0,totals.maxMass||0,live.mass||0)};
}
function rewardFor(id){
 if(AD_ONLY_SKINS.has(id))return {unlocked:adOwned('skin',id),kind:'ad',need:1,current:adOwned('skin',id)?1:0};
 const challenge=UNLOCKS[id];
 if(!challenge)return {unlocked:true,kind:'free',need:0,current:0};
 const [kind,need]=challenge,progress=milestones();
 const current=Number(progress[kind])||0;
 return {unlocked:current>=need,kind,need,current};
}
function requirementText(id,language){
 const r=rewardFor(id);if(r.unlocked)return language==='ru'?'ОТКРЫТО':language==='es'?'DESBLOQUEADO':'UNLOCKED';
 if(r.kind==='ad')return language==='ru'?'▶ РЕКЛАМА':language==='es'?'▶ VER ANUNCIO':'▶ WATCH AD';
 const key=r.kind==='wins'?
  (language==='ru'?'ТОП-1':language==='es'?'TOP 1':'TOP 1'):
  r.kind==='kills'?(language==='ru'?'УБИЙСТВ':language==='es'?'BAJAS':'KILLS'):
  (language==='ru'?'МАССА':language==='es'?'MASA':'MASS');
 return '🔒 '+key+' '+Math.floor(r.current)+' / '+r.need;
}
const normalize=x=>/^#[0-9a-f]{6}$/i.test(x)?x.toLowerCase():null;
const presetColors=id=>PRESETS.find(x=>x[0]===id)?.[4]||PRESETS[0][4];
function load(){
 let raw={};try{raw=JSON.parse(localStorage.getItem(KEY)||'{}')||{}}catch(_){}
 const skin=PRESETS.some(p=>p[0]===raw.skin)&&rewardFor(raw.skin).unlocked?raw.skin:'nebula';
 const backup=presetColors(skin);
 return {
  ...raw,skin,head:headUnlocked(raw.head)?raw.head:'classic',
  customEnabled:raw.customEnabled===true,
  customSegments:Array.from({length:64},(_,i)=>normalize(raw.customSegments?.[i])||backup[i%backup.length])
 };
}
function save(obj){
 try{localStorage.setItem(KEY,JSON.stringify(obj))}catch(_){}
 window.dispatchEvent(new CustomEvent('infinity-worm-skin-changed',{detail:{skin:obj.skin,customEnabled:obj.customEnabled,customSegments:obj.customSegments.slice(),head:obj.head}}));
}
// Preview motion is a true trailing path, sampled at equal time intervals.
// Unlike the old nonlinear vertical projection, the same constant transform
// is applied to every point, so bends propagate through the body naturally.
// World heading changes smoothly; the camera follows the head's position.
function previewCenterline(seconds,count=59){
 const speed=152,interval=.079,headX=767,headY=110;
 const heading=t=>.34*Math.sin(t*1.55)+.075*Math.sin(t*.91+.75);
 const body=Array(count);let x=headX,y=headY;
 body[count-1]={x,y};
 for(let i=count-2;i>=0;i--){
  const age=(count-1-i-.5)*interval;
  const turn=heading(seconds-age),distance=speed*interval;
  x-=distance*Math.cos(turn);
  // Constant camera height scale preserves the body's physical continuity.
  y-=distance*Math.sin(turn)*.78;
  body[i]={x,y};
 }
 return body;
}


// Canonical, self-contained 64×64 SVG artwork shared by the selector,
// live workshop preview and canvas gameplay. Heads face toward +X.
const icon=shape=>'<svg viewBox="0 0 64 64" aria-hidden="true"><g stroke-linecap="round" stroke-linejoin="round">'+shape+'</g></svg>';
const headArt={
 classic:icon('<path d="M19 10Q7 19 9 34Q11 51 31 53Q53 53 56 33Q56 12 33 10Z" fill="#884cff" stroke="#ead0ff" stroke-width="3"/><path d="M14 26Q28 3 45 18" fill="none" stroke="#ff90fa" stroke-width="5" opacity=".8"/><ellipse cx="36" cy="24" rx="5" ry="7" fill="#fff"/><ellipse cx="36" cy="42" rx="5" ry="7" fill="#fff"/><circle cx="39" cy="25" r="2.4" fill="#180730"/><circle cx="39" cy="41" r="2.4" fill="#180730"/><path d="M43 30Q52 33 43 36" fill="none" stroke="#ffd5ff" stroke-width="2.5"/>'),
 pizza:icon('<path d="M6 10Q10 30 6 53L57 32Z" fill="#ffce46" stroke="#ffefad" stroke-width="2.4"/><path d="M7 10Q3 33 7 53L17 49Q15 33 17 14Z" fill="#aa5a26" stroke="#f6a04a" stroke-width="3"/><path d="M20 18 49 31 20 45" fill="none" stroke="#ff8c33" stroke-width="3" opacity=".7"/><circle cx="27" cy="26" r="6" fill="#e43642" stroke="#a0142d" stroke-width="1.6"/><circle cx="28" cy="38" r="5.2" fill="#d82a42" stroke="#a0142d" stroke-width="1.4"/><circle cx="40" cy="32" r="3.6" fill="#e43642"/><path d="M19 34q4-3 6-2M35 20q-2 4 2 6" fill="none" stroke="#3f9f45" stroke-width="2.8"/>'),
 pig:icon('<path d="M13 17 14 5 30 15M14 47 14 59 30 49" fill="#ff87bd" stroke="#c84182" stroke-width="3"/><path d="M16 17Q35 7 48 19Q57 28 50 43Q36 57 16 46Q7 32 16 17" fill="#ff9fc8" stroke="#ffe1ef" stroke-width="2.6"/><ellipse cx="46" cy="32" rx="13" ry="12" fill="#f271ab" stroke="#bf3d78" stroke-width="2"/><ellipse cx="46" cy="27" rx="2.3" ry="3.8" fill="#9c315b"/><ellipse cx="46" cy="37" rx="2.3" ry="3.8" fill="#9c315b"/><circle cx="30" cy="22" r="3.1" fill="#24122d"/><circle cx="30" cy="42" r="3.1" fill="#24122d"/><circle cx="29" cy="21" r="1" fill="#fff"/>'),
 blackhole:icon('<defs><radialGradient id="wh-new-bh"><stop offset="0" stop-color="#03000a"/><stop offset=".43" stop-color="#03000a"/><stop offset=".50" stop-color="#ffe57f"/><stop offset=".63" stop-color="#ff536a"/><stop offset=".79" stop-color="#8d40ff"/><stop offset="1" stop-color="#8d40ff" stop-opacity="0"/></radialGradient></defs><circle cx="32" cy="32" r="30" fill="url(#wh-new-bh)"/><ellipse cx="32" cy="32" rx="28" ry="10" transform="rotate(-24 32 32)" stroke="#ffe7ae" stroke-width="3.3" fill="none"/><circle cx="32" cy="32" r="14" fill="#010008"/><path d="M11 17 14 13M51 45 55 49" stroke="#c28aff" stroke-width="3"/>'),
 cat:icon('<path d="M11 19 13 4 30 15 46 4 49 20Q58 33 49 45Q32 57 14 45Q6 34 11 19" fill="#be88ff" stroke="#f1d9ff" stroke-width="3"/><path d="M15 17 18 11 27 18M37 18 44 11 47 20" fill="#fc8db2"/><ellipse cx="34" cy="24" rx="4" ry="6" fill="#2c153e"/><ellipse cx="34" cy="40" rx="4" ry="6" fill="#2c153e"/><path d="M47 29 53 32 47 35Z" fill="#ff6eab"/><path d="M44 33 56 25M44 33 57 41" stroke="#fff0fa" stroke-width="1.5" fill="none"/>'),
 dragon:icon('<path d="M8 15 3 4 22 14 25 3 38 19 51 17 60 29 52 35 60 45 41 43 30 56 20 46 4 59 9 40Z" fill="#38bb62" stroke="#d8ff8c" stroke-width="2.6"/><path d="M14 20 5 26 17 29M15 44 5 38 18 36" fill="#ffe247" stroke="#246f35" stroke-width="2"/><path d="M34 18 55 31 33 45" fill="#20994d" opacity=".7"/><ellipse cx="39" cy="24" rx="5" ry="3" fill="#ffde37"/><ellipse cx="39" cy="40" rx="5" ry="3" fill="#ffde37"/><path d="M51 28 56 32 51 36" stroke="#fff59a" stroke-width="2" fill="none"/>'),
 robot:icon('<path d="M17 14V8H28M36 8H47V14" stroke="#a4b6ff" stroke-width="4" fill="none"/><rect x="8" y="13" width="49" height="39" rx="9" fill="#5478d1" stroke="#d1e1ff" stroke-width="3"/><rect x="14" y="18" width="38" height="28" rx="6" fill="#1c234a"/><rect x="23" y="23" width="9" height="8" rx="2" fill="#ffe86b"/><rect x="35" y="23" width="9" height="8" rx="2" fill="#ffe86b"/><path d="M22 39H45" stroke="#9e79ff" stroke-width="3"/><circle cx="32" cy="8" r="3.7" fill="#ff557e"/>'),
 alien:icon('<path d="M6 30Q9 8 34 10Q55 12 58 30Q57 51 34 54Q10 52 6 30" fill="#85ef6c" stroke="#e6ffb1" stroke-width="3"/><path d="M23 25Q40 15 43 28Q34 37 23 25M22 40Q40 31 44 40Q35 50 22 40" fill="#1e1737"/><circle cx="45" cy="30" r="3" fill="#f0ffb8"/><circle cx="45" cy="40" r="2.3" fill="#f0ffb8"/><path d="M11 16 5 8M16 15 16 4" stroke="#a8ff8e" stroke-width="2.5"/>'),
 shark:icon('<path d="M8 20 3 8 28 18 35 3 42 22 58 31 42 42 34 60 27 45 4 56 8 42Z" fill="#588cd5" stroke="#d8ebff" stroke-width="3"/><path d="M15 24Q36 28 53 31Q35 38 15 40" fill="#bce5ff"/><path d="M39 26 48 31 39 36" fill="#172b5c"/><circle cx="37" cy="22" r="3" fill="#101a36"/><circle cx="37" cy="42" r="3" fill="#101a36"/><path d="M46 29 48 32 46 35M50 30 52 32 50 34" stroke="#fff" stroke-width="1.8"/>'),
 skull:icon('<path d="M11 22Q11 8 30 8Q49 8 52 24L52 39 45 43 45 55 19 55 19 43 12 39Z" fill="#f1e5d6" stroke="#fffefa" stroke-width="2.5"/><path d="M24 19 40 19 36 29 23 29Z" fill="#291b3d"/><path d="M22 38Q30 31 38 38" stroke="#301b42" stroke-width="4" fill="none"/><path d="M24 47V54M32 47V54M40 47V54" stroke="#8a7582" stroke-width="2.5"/><path d="M10 29 4 33 10 37" fill="#d2bead"/>'),
 ghost:icon('<path d="M11 17Q18 2 34 7Q54 9 55 30L55 54 46 47 38 55 29 48 21 55 13 47 7 52 7 31Q7 22 11 17" fill="#d9d3ff" stroke="#fff" stroke-width="2.8"/><ellipse cx="36" cy="25" rx="5" ry="6.5" fill="#342168"/><ellipse cx="36" cy="41" rx="5" ry="6.5" fill="#342168"/><circle cx="39" cy="23" r="2" fill="#fff"/><path d="M46 31q5 4 0 8" stroke="#a78dff" stroke-width="3" fill="none"/>'),
 astronaut:icon('<circle cx="32" cy="32" r="26" fill="#f2f4ff" stroke="#9cb1ed" stroke-width="3.5"/><ellipse cx="34" cy="32" rx="19" ry="22" fill="#181e48" stroke="#a6b9ff" stroke-width="2.5"/><path d="M20 24Q28 14 40 20" stroke="#6b84e9" stroke-width="5" opacity=".7" fill="none"/><circle cx="40" cy="28" r="4" fill="#ffdf6c"/><path d="M16 44 23 50 39 51" stroke="#fff" stroke-width="2.5" fill="none"/><circle cx="9" cy="32" r="4" fill="#ff586f"/>'),
 planet:icon('<circle cx="32" cy="32" r="21" fill="#a76aff" stroke="#e2bcff" stroke-width="2.8"/><path d="M16 27Q30 36 50 23M16 39Q31 46 47 35" fill="none" stroke="#5d31b9" stroke-width="5" opacity=".8"/><ellipse cx="32" cy="32" rx="29" ry="10" transform="rotate(-27 32 32)" fill="none" stroke="#ffe374" stroke-width="5"/><ellipse cx="32" cy="32" rx="29" ry="10" transform="rotate(-27 32 32)" fill="none" stroke="#fff4c1" stroke-width="1.4"/>'),
 sun:icon('<path d="M32 1 38 13 50 7 49 21 62 26 52 34 60 47 45 46 39 61 28 49 15 57 16 43 2 36 13 27 5 14 21 16Z" fill="#ffad24" stroke="#ffe78f" stroke-width="2.4"/><circle cx="32" cy="32" r="20" fill="#ffe155" stroke="#fff8bb" stroke-width="2.7"/><circle cx="41" cy="26" r="3" fill="#9c4626"/><circle cx="41" cy="39" r="3" fill="#9c4626"/><path d="M45 30Q51 33 45 36" fill="none" stroke="#a34e27" stroke-width="2.6"/>'),
 comet:icon('<path d="M4 15Q19 18 37 25L12 8M3 45Q20 42 37 36L9 56" fill="#ff563f" opacity=".82"/><path d="M2 28Q20 26 39 31Q20 37 2 40" fill="#ffcd42" stroke="#ff9f2b" stroke-width="2"/><circle cx="42" cy="32" r="15" fill="#ffdf73" stroke="#fff8ba" stroke-width="3"/><path d="M37 25q9-2 13 5" fill="none" stroke="#fff" stroke-width="4" opacity=".9"/>'),
 crystal:icon('<path d="M30 2 58 32 31 62 5 32Z" fill="#8055e9" stroke="#f6eaff" stroke-width="2.7"/><path d="M30 2 29 62 5 32Z" fill="#b79aff"/><path d="M30 2 58 32 30 62 40 31Z" fill="#6245cb"/><path d="M5 32 58 32M30 2 20 32 30 62" stroke="#f7edff" stroke-width="1.5" fill="none" opacity=".9"/>'),
 eclipse:icon('<circle cx="32" cy="32" r="27" fill="#aa56ff" opacity=".38"/><circle cx="32" cy="32" r="23" fill="#ff4a96"/><circle cx="31" cy="32" r="19" fill="#10071f"/><path d="M40 12Q59 27 45 47" stroke="#ffedb2" stroke-width="5.2" fill="none" stroke-linecap="round"/><circle cx="14" cy="14" r="3.2" fill="#b68aff"/>'),
 pulsar:icon('<path d="M30 2 22 25 28 33 34 62M40 2 33 25 38 34 25 62" fill="none" stroke="#4c74ff" stroke-width="5"/><circle cx="32" cy="32" r="18" fill="#3d65f4" stroke="#d7e8ff" stroke-width="2.8"/><circle cx="32" cy="32" r="11" fill="#fff0a2"/><circle cx="32" cy="32" r="5" fill="#fff"/><ellipse cx="32" cy="32" rx="30" ry="10" transform="rotate(-20 32 32)" fill="none" stroke="#ffdf37" stroke-width="3.6"/>'),
 mushroom:icon('<path d="M28 29 28 57Q42 60 47 51L44 29Z" fill="#fff1d6" stroke="#dbbaaa" stroke-width="2.4"/><path d="M6 31Q9 6 31 6Q54 7 59 31L52 38Q32 44 8 38Z" fill="#f34856" stroke="#ffb7a4" stroke-width="3"/><circle cx="26" cy="18" r="5.5" fill="#fff1d6"/><circle cx="45" cy="28" r="5" fill="#fff1d6"/><circle cx="13" cy="29" r="3.5" fill="#fff1d6"/><path d="M41 45 49 45" stroke="#85636b" stroke-width="2.5"/>'),
 crown:icon('<path d="M7 14 18 24 27 5 36 24 53 12 55 47 10 47Z" fill="#ffc837" stroke="#fff3a3" stroke-width="2.8"/><path d="M10 44H55V53H10Z" fill="#cc7c27" stroke="#ffeca1" stroke-width="2"/><path d="M17 31 27 37 40 28" fill="none" stroke="#fff6ae" stroke-width="3"/><circle cx="16" cy="46" r="3" fill="#ff3672"/><circle cx="33" cy="46" r="3" fill="#8f57ff"/><circle cx="49" cy="46" r="3" fill="#ff3672"/>'),
 star:icon('<path d="M33 2 41 22 62 25 45 39 49 60 32 49 13 60 18 39 2 25 24 22Z" fill="#ffe34b" stroke="#fff9b5" stroke-width="2.7"/><circle cx="36" cy="28" r="3" fill="#8a4b21"/><circle cx="36" cy="41" r="3" fill="#8a4b21"/><path d="M41 32Q47 35 41 38" fill="none" stroke="#b46b26" stroke-width="2.6"/>'),
 donut:icon('<circle cx="32" cy="32" r="26" fill="#d49a5d" stroke="#ffe4b8" stroke-width="2.4"/><path d="M8 29Q11 10 30 9Q54 8 57 32Q55 55 32 57Q8 55 8 29" fill="#ff82c6"/><circle cx="32" cy="32" r="11" fill="#603c48" stroke="#d59b62" stroke-width="4"/><path d="M15 23 20 20M40 13 44 17M50 42 45 46M17 45 23 48M49 24 53 21" stroke="#fff2a5" stroke-width="3"/><path d="M23 12 28 15M13 35 19 34M38 51 40 47" stroke="#6654ee" stroke-width="3"/>'),
 fox:icon('<path d="M9 18 10 3 30 16 42 4 49 24 60 32 49 43 42 60 27 48 10 60 10 43Z" fill="#ff9a3c" stroke="#ffdfaa" stroke-width="2.7"/><path d="M12 20 15 10 25 19M38 19 44 10 46 22" fill="#ffdb8e"/><path d="M28 33Q39 29 56 32Q41 47 27 44" fill="#fff0cd"/><ellipse cx="35" cy="23" rx="3.3" ry="4" fill="#352033"/><ellipse cx="35" cy="43" rx="3.3" ry="4" fill="#352033"/><circle cx="57" cy="32" r="3.5" fill="#39243a"/>'),
 demon:icon('<path d="M14 19 9 1 29 14 42 1 50 20Q58 32 51 45Q39 58 18 49Q7 35 14 19" fill="#d9295e" stroke="#ffa2b2" stroke-width="3"/><path d="M12 16 9 7 24 18M37 18 44 6 48 20" fill="#ffc05d"/><path d="M27 26 42 29 28 32" fill="#ffe46c"/><path d="M26 41 42 38 29 36" fill="#ffe46c"/><path d="M44 30 54 32 44 36" fill="#46102e"/><path d="M23 48 27 57 32 49" fill="#fff0db"/>'),
 octopus:icon('<path d="M25 14Q9 2 6 17Q-2 34 15 37M23 29Q3 22 8 43Q10 57 22 49M23 43Q7 50 18 59Q31 62 34 51" stroke="#9c5ae5" stroke-width="7" fill="none"/><path d="M15 17Q22 3 40 11Q57 17 56 34Q52 52 33 54Q13 52 15 34Z" fill="#ad73f2" stroke="#e8ccff" stroke-width="3"/><circle cx="39" cy="24" r="4" fill="#fff"/><circle cx="39" cy="43" r="4" fill="#fff"/><circle cx="41" cy="24" r="2" fill="#201039"/><circle cx="41" cy="43" r="2" fill="#201039"/><path d="M47 32Q51 35 47 38" stroke="#ffacd9" stroke-width="2.5" fill="none"/>'),
 ufo:icon('<ellipse cx="32" cy="38" rx="29" ry="15" fill="#6d69d9" stroke="#c6b8ff" stroke-width="3"/><path d="M17 35Q16 12 31 9Q47 10 49 35Z" fill="#a9a5ff" stroke="#ebfaff" stroke-width="2.2"/><ellipse cx="32" cy="35" rx="29" ry="10" fill="#8177ed" stroke="#ded5ff" stroke-width="2.8"/><circle cx="15" cy="37" r="3" fill="#ffdc44"/><circle cx="32" cy="42" r="3" fill="#ff5a8a"/><circle cx="50" cy="37" r="3" fill="#ffdc44"/><path d="M23 23Q29 16 38 21" stroke="#fff" stroke-width="3" fill="none"/>'),
 panda:icon('<circle cx="15" cy="17" r="11" fill="#212038"/><circle cx="15" cy="48" r="11" fill="#212038"/><ellipse cx="33" cy="32" rx="25" ry="24" fill="#fffaf1" stroke="#c8c5db" stroke-width="2.4"/><ellipse cx="34" cy="22" rx="8" ry="10" fill="#2d2941"/><ellipse cx="34" cy="42" rx="8" ry="10" fill="#2d2941"/><circle cx="37" cy="23" r="2.8" fill="#fff"/><circle cx="37" cy="41" r="2.8" fill="#fff"/><path d="M47 28Q55 32 47 36" fill="#24243a"/>'),
 cyclops:icon('<path d="M13 13Q25 3 42 12Q59 21 56 40Q50 59 28 54Q8 49 9 32Z" fill="#6e79ff" stroke="#d6d8ff" stroke-width="3"/><path d="M29 11 24 3 19 12M40 13 49 4" fill="none" stroke="#ba98ff" stroke-width="4"/><circle cx="37" cy="32" r="15" fill="#fff" stroke="#321e68" stroke-width="2"/><circle cx="40" cy="32" r="8" fill="#ffab34"/><circle cx="42" cy="32" r="4" fill="#251336"/><circle cx="39" cy="28" r="2" fill="#fff"/>'),
 frog:icon('<path d="M14 15Q30 4 48 17Q59 29 52 43Q34 57 13 46Q5 34 14 15" fill="#6adf5b" stroke="#d8ff9e" stroke-width="3"/><circle cx="35" cy="14" r="11" fill="#7ff26c" stroke="#d8ff9e" stroke-width="2.4"/><circle cx="35" cy="50" r="11" fill="#7ff26c" stroke="#d8ff9e" stroke-width="2.4"/><circle cx="39" cy="16" r="5" fill="#fff"/><circle cx="39" cy="48" r="5" fill="#fff"/><circle cx="41" cy="16" r="2.5" fill="#1f4831"/><circle cx="41" cy="48" r="2.5" fill="#1f4831"/><path d="M44 30Q54 32 44 35" fill="none" stroke="#286d3c" stroke-width="2.7"/>'),
 flame:icon('<path d="M6 46Q21 39 17 13Q30 24 33 3Q46 23 55 17Q47 35 61 42Q42 64 24 54Z" fill="#ff6429" stroke="#ffd35d" stroke-width="3"/><path d="M21 43Q29 32 28 24Q38 33 44 28Q40 41 48 46Q37 58 23 50Z" fill="#ffe64b"/><path d="M37 36 45 38 35 41M36 48 45 45 37 43" fill="#f65b28"/><circle cx="47" cy="40" r="2" fill="#9c2418"/>'),
 rocket:icon('<path d="M5 24 26 25 44 14Q56 22 60 32Q56 42 44 50L26 39 5 40 13 33Z" fill="#ecedff" stroke="#b395ff" stroke-width="3"/><path d="M5 25 2 32 5 39 23 33Z" fill="#ffb93b"/><path d="M14 22 4 11 29 25M14 43 4 54 29 39" fill="#e84b96" stroke="#ff9ecf" stroke-width="2"/><circle cx="41" cy="32" r="9" fill="#395de2" stroke="#c9dbff" stroke-width="2"/><circle cx="43" cy="30" r="3.4" fill="#ffe76a"/>'),
 lollipop:icon('<path d="M6 32H28" stroke="#f6dcb6" stroke-width="9"/><path d="M6 32H26" stroke="#d47f6c" stroke-width="2"/><circle cx="40" cy="32" r="21" fill="#e92c8f" stroke="#ffe2a8" stroke-width="3"/><path d="M38 12Q59 18 55 35Q50 49 32 49Q16 42 25 27Q34 17 45 24Q52 32 43 39Q34 45 30 34" fill="none" stroke="#ffe04e" stroke-width="6"/><path d="M24 18Q36 9 47 16" stroke="#fff4d9" stroke-width="3" fill="none"/>')
};
// Explicitly align artwork originally drawn upright to face the worm's
// forward vector (+X). The SAME transform is used by cards, previews and play.
const headMeta=Object.fromEntries(HEADS.map(id=>[id,{rotation:0,scale:1,lead:.08}]));
Object.assign(headMeta,{
 pizza:{rotation:0,scale:1.07,lead:.14},
 pig:{rotation:0,scale:1.06,lead:.12},
 skull:{rotation:-Math.PI/2,scale:1.08,lead:.1},
 robot:{rotation:-Math.PI/2,scale:1.04,lead:.1},
 mushroom:{rotation:Math.PI/2,scale:1.04,lead:.12},
 crown:{rotation:Math.PI/2,scale:1.08,lead:.12},
 ufo:{rotation:Math.PI/2,scale:1.06,lead:.1},
 flame:{rotation:Math.PI/2,scale:1.05,lead:.12},
 comet:{rotation:0,scale:1.06,lead:.13},
 shark:{rotation:0,scale:1.06,lead:.14},
 dragon:{rotation:0,scale:1.06,lead:.13}
});
const headImages=new Map();
function headImage(id){
 if(!headArt[id])id='classic';
 let entry=headImages.get(id);
 if(!entry){
  const img=new Image();
  entry={img,source:null,bounds:null,callbacks:[]};
  headImages.set(id,entry);
  img.onload=()=>{
   // Rasterize the complete SVG once, then crop that SAME raster. The old
   // code measured pixels in a 128px canvas but cropped the original SVG,
   // which browsers can intrinsically size at 300×150: only a thin strip
   // appeared instead of the head. Never mix source coordinate systems.
   const raster=document.createElement('canvas');
   const side=192;raster.width=side;raster.height=side;
   const g=raster.getContext('2d',{willReadFrequently:true});
   if(g){
    try{
     g.clearRect(0,0,side,side);
     g.drawImage(img,0,0,side,side);
     const bytes=g.getImageData(0,0,side,side).data;
     let x0=side,y0=side,x1=-1,y1=-1;
     for(let y=0;y<side;y++)for(let x=0;x<side;x++)
      if(bytes[(y*side+x)*4+3]>=25){
       x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y);
      }
     if(x1>=x0){
      entry.source=raster;
      entry.bounds={sx:x0,sy:y0,sw:x1-x0+1,sh:y1-y0+1};
     }
    }catch(_){/* Keep full SVG when canvas readback is restricted. */}
   }
   if(!entry.bounds){
    entry.source=img;
    entry.bounds={sx:0,sy:0,sw:img.naturalWidth,sh:img.naturalHeight};
   }
   entry.callbacks.splice(0).forEach(cb=>cb());
  };
  img.onerror=()=>{entry.callbacks.splice(0).forEach(cb=>cb())};
  // A viewBox alone has a browser-defined intrinsic size. Set both axes
  // explicitly to 64 so that all fallback images also preserve their shape.
  img.src='data:image/svg+xml;charset=utf-8,'+
   encodeURIComponent(headArt[id].replace('<svg ',
    '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" '));
 }
 return entry;
}
function headDimensions(id,r){
 const entry=headImage(id),b=entry.bounds;
 if(!b)return null;
 const meta=headMeta[id]||headMeta.classic;
 // Uniform isotropic fit from the rasterized visible bounds: never adjust
 // horizontal and vertical axes independently. A maximum silhouette span
 // keeps wide/long heads balanced instead of looking flattened on the body.
 const long=Math.max(b.sw,b.sh),short=Math.min(b.sw,b.sh);
 const unit=Math.min(r*2.32*meta.scale/short,r*3.05/long);
 const width=b.sw*unit,height=b.sh*unit;
 return {width,height,bounds:b,rotation:meta.rotation,lead:meta.lead};
}
function drawHead(ctx,id,x,y,angle,r){
 const entry=headImage(id),layout=headDimensions(id,r);
 if(!layout||!entry.source||!entry.img.complete||!entry.img.naturalWidth)return false;
 const {width,height,bounds,rotation,lead}=layout;
 ctx.save();
 ctx.translate(x+Math.cos(angle)*r*lead,y+Math.sin(angle)*r*lead);
 ctx.rotate(angle+rotation);
 ctx.drawImage(entry.source,bounds.sx,bounds.sy,bounds.sw,bounds.sh,
  -width/2,-height/2,width,height);
 ctx.restore();
 return true;
}
function drawHeadThumbnail(canvas,id){
 const entry=headImage(id),g=canvas.getContext('2d');
 if(!g)return;
 const paint=()=>{
  g.clearRect(0,0,canvas.width,canvas.height);
  drawHead(g,id,canvas.width/2,canvas.height/2,0,20);
 };
 if(entry.bounds)paint();else entry.callbacks.push(paint);
}
const WormHeadArt={
 ids:HEADS.slice(),markup:id=>headArt[id]||headArt.classic,
 draw:drawHead,drawThumbnail:drawHeadThumbnail,dimensions:headDimensions,
 orientation:id=>(headMeta[id]||headMeta.classic).rotation
};
window.WormHeadArt=WormHeadArt;
for(const id of HEADS)headImage(id);

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
 '<p class="ws-ad-status" role="status" aria-live="polite"></p><div class="ws-section"><h3 class="ws-head-heading"></h3><div class="ws-head-options"></div></div>'+
 '<details class="ws-advanced"><summary class="ws-advanced-summary"></summary>'+
 '<div class="ws-section"><div class="ws-part-head"><h3 class="ws-segments-title"></h3><span class="ws-indicator"></span></div><p class="ws-tip"></p><div class="ws-segments" role="group"></div></div>'+
 '<div class="ws-section"><h3 class="ws-palette-title"></h3><div class="ws-palette"></div><label class="ws-custom-label"><span class="ws-custom-title"></span><input type="color" class="ws-custom" value="#ff1744"></label></div></details>'+
 '</div><footer class="ws-footer"><button class="ws-reset" type="button"></button><button class="ws-stripes" type="button"></button><button class="ws-fill" type="button"></button><button class="ws-done" type="button"></button></footer></section>';
 const $=s=>root.querySelector(s);
 $('.ws-title').textContent=t.title;$('.ws-desc').textContent=t.desc;
 $('.ws-preview-title').textContent=lang==='ru'?'ЖИВОЙ ПРЕДПРОСМОТР':lang==='es'?'VISTA PREVIA ANIMADA':'LIVE IN-GAME PREVIEW';
 $('.ws-preview-hint').textContent=lang==='ru'?'Скин, голова и светящиеся частицы на движущемся черве':lang==='es'?'Diseño y partículas en movimiento':'Animated body, head and cosmic particles';
 $('.ws-x').innerHTML='<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" aria-hidden="true"><path d="M6 6 18 18M18 6 6 18"/></svg>';$('.ws-x').setAttribute('aria-label',t.close);
 $('.ws-presets-title').textContent=t.templates;$('.ws-segments-title').textContent=t.segment;
 $('.ws-tip').textContent=t.tip;$('.ws-palette-title').textContent=t.palette;
 $('.ws-custom-title').textContent=t.custom;
 $('.ws-head-heading').textContent=lang==='ru'?'Форма головы':lang==='es'?'Forma de cabeza':'Head shape';
 $('.ws-advanced-summary').textContent=lang==='ru'?'НАСТРОЙКА ПЕРЕЛИВОВ · 64 ЦВЕТОВЫЕ ТОЧКИ':lang==='es'?'COLORES PERSONALIZADOS · 64 SEGMENTOS':'ADVANCED GRADIENT · 64 COLOR POINTS';

 const headLabels={
 classic:['Космос','Cosmos','Cosmos'],
 pizza:['Пицца','Pizza','Pizza'],
 pig:['Свинка','Piggy','Cerdito'],
 blackhole:['Чёрная дыра','Black Hole','Agujero negro'],
 cat:['Кот','Cat','Gato'],
 dragon:['Дракон','Dragon','Dragón'],
 robot:['Робот','Robot','Robot'],
 alien:['Пришелец','Alien','Alienígena'],
 shark:['Акула','Shark','Tiburón'],
 skull:['Череп','Skull','Calavera'],
 ghost:['Призрак','Ghost','Fantasma'],
 astronaut:['Космонавт','Astronaut','Astronauta'],
 planet:['Сатурн','Saturn','Saturno'],
 sun:['Солнце','Sun','Sol'],
 comet:['Комета','Comet','Cometa'],
 crystal:['Кристалл','Crystal','Cristal'],
 eclipse:['Затмение','Eclipse','Eclipse'],
 pulsar:['Пульсар','Pulsar','Púlsar'],
 mushroom:['Гриб','Mushroom','Hongo'],
 crown:['Корона','Crown','Corona'],
 star:['Звёздочка','Star','Estrella'],
 donut:['Пончик','Donut','Dona'],
 fox:['Лиса','Fox','Zorro'],
 demon:['Демон','Demon','Demonio'],
 octopus:['Осьминог','Octopus','Pulpo'],
 ufo:['НЛО','UFO','OVNI'],
 panda:['Панда','Panda','Panda'],
 cyclops:['Циклоп','Cyclops','Cíclope'],
 frog:['Лягушка','Frog','Rana'],
 flame:['Огонь','Flame','Llama'],
 rocket:['Ракета · реклама','Rocket · Ad','Cohete · Anuncio'],
 lollipop:['Леденец · реклама','Candy · Ad','Caramelo · Anuncio']
};
 let watchingReward=false;
 const adStatus=message=>{$('.ws-ad-status').textContent=message;};
 async function watchUnlock(type,id){
  if(watchingReward)return false;
  if(!window.SpaceCrazyAds?.available){
   adStatus(lang==='ru'?'Реклама доступна в CrazyGames.':lang==='es'?'Anuncios disponibles en CrazyGames.':'Ads are available in CrazyGames.');
   return false;
  }
  watchingReward=true;
  adStatus(lang==='ru'?'Загрузка рекламы…':lang==='es'?'Cargando anuncio…':'Loading ad…');
  root.querySelectorAll('.ad-locked').forEach(el=>el.disabled=true);
  let completed=false;
  try{completed=await window.SpaceCrazyAds.rewarded();}
  finally{watchingReward=false;}
  if(!completed||!grantAdReward(type,id)){
   adStatus(lang==='ru'?'Реклама не завершена. Награда не выдана.':lang==='es'?'Anuncio incompleto.':'Ad not completed. No reward granted.');
   root.querySelectorAll('.ad-locked').forEach(el=>el.disabled=false);
   return false;
  }
  adStatus(lang==='ru'?'Награда открыта навсегда!':lang==='es'?'¡Recompensa desbloqueada!':'Reward permanently unlocked!');
  if(type==='skin'){
   data.skin=id;data.customEnabled=false;
   data.customSegments=Array.from({length:64},(_,i)=>presetColors(id)[i%4]);
  }else data.head=id;
  persist();
  if(root.isConnected){renderPresets();renderHeads();renderSegments();}
  return true;
 }
 function renderHeads(){
  const list=$('.ws-head-options');list.replaceChildren();
  for(const id of HEADS){
   if(AD_ONLY_HEADS.has(id)&&!adRewardsVisible())continue;
   const locked=AD_ONLY_HEADS.has(id)&&!headUnlocked(id);
   const b=document.createElement('button');b.type='button';
   b.className='ws-head-choice'+(locked?' ad-locked':'')+(data.head===id?' selected':'');
   b.dataset.head=id;
   b.innerHTML='<span class="ws-head-symbol" aria-hidden="true"><canvas width="64" height="64"></canvas></span><span class="ws-head-label"></span>';
   b.querySelector('.ws-head-label').textContent=headLabels[id][lang==='ru'?0:lang==='es'?2:1];
   if(locked){
    const tag=document.createElement('small');tag.className='ws-head-unlock';
    tag.textContent=lang==='ru'?'▶ ЗА РЕКЛАМУ':lang==='es'?'▶ VER ANUNCIO':'▶ WATCH AD';
    b.append(tag);
   }
   WormHeadArt.drawThumbnail(b.querySelector('canvas'),id);
   b.onclick=()=>{
    if(locked){watchUnlock('head',id);return}
    data.head=id;persist();
    list.querySelectorAll('.ws-head-choice').forEach(x=>x.classList.toggle('selected',x.dataset.head===id));
   };
   list.append(b);
  }
 }
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
   if(AD_ONLY_SKINS.has(p[0])&&!adRewardsVisible())return;
   const reward=rewardFor(p[0]);
   const item=document.createElement('button');item.type='button';
   item.className='ws-preset'+(data.skin===p[0]&&!data.customEnabled?' selected':'');
   item.dataset.skin=p[0];
   item.disabled=!reward.unlocked&&reward.kind!=='ad';
   item.classList.toggle('locked',!reward.unlocked);
   item.classList.toggle('ad-locked',!reward.unlocked&&reward.kind==='ad');
   item.title=requirementText(p[0],lang);
   item.setAttribute('aria-pressed',String(data.skin===p[0]&&!data.customEnabled));
   const beads=document.createElement('span');
   beads.className='ws-preset-beads ws-preset-worm';
   beads.style.setProperty('--worm-skin-gradient','linear-gradient(90deg,'+
    [p[4][3],p[4][0],p[4][2],p[4][1]].join(',')+')');
   const label=document.createElement('span');label.textContent=p[lang==='ru'?2:lang==='es'?3:1];
   item.append(beads,label);
   const unlock=document.createElement('small');unlock.className='ws-unlock-label';
   unlock.textContent=requirementText(p[0],lang);item.append(unlock);
   item.onclick=()=>{
    const lock=rewardFor(p[0]);
    if(!lock.unlocked){if(lock.kind==='ad')watchUnlock('skin',p[0]);return;}
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
  // 40 fps preserves smooth travelling bends without overworking Canvas.
  if(now-lastPreviewPaint<25){previewFrame=requestAnimationFrame(paintPreview);return;}
  lastPreviewPaint=now;
  const w=preview.width,h=preview.height,t=now*.001;
  pc.clearRect(0,0,w,h);
  pc.fillStyle='#090719';pc.fillRect(0,0,w,h);
  for(let i=0;i<85;i++){
   const parallax=i%3===0?92:58;
   const x=((i*397.71-t*parallax)%w+w)%w,y=(i*181.39)%h;
   const a=.25+.5*(.5+.5*Math.sin(t*1.8+i*1.76));
   pc.fillStyle='rgba(227,220,255,'+a.toFixed(3)+')';
   pc.fillRect(x,y,i%11===0?2:1,i%11===0?2:1);
  }
  const colors=colorsForView(),count=59,body=previewCenterline(t,count);
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
  const head=body[count-1],next=body[count-2];
  const angle=Math.atan2(head.y-next.y,head.x-next.x);
  if(!WormHeadArt.draw(pc,data.head,head.x,head.y,angle,25)){
   pc.fillStyle='#f0dcff';pc.beginPath();pc.arc(head.x,head.y,24,0,Math.PI*2);pc.fill();
  }
  pc.restore();
  previewFrame=requestAnimationFrame(paintPreview);
 }

 active={root,onClose,previewCancel:()=>cancelAnimationFrame(previewFrame)};
 renderHeads();renderPresets();renderPalette();renderSegments();
 previewFrame=requestAnimationFrame(paintPreview);
 return close;
}
window.WormSkinStudio={open,close,read:load,presets:PRESETS,isUnlocked:id=>rewardFor(id).unlocked,isHeadUnlocked:headUnlocked,rewardFor,adOwned,progress:milestones,previewCenterline,headArt:WormHeadArt};
})();