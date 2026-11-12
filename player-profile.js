/* Infinity Space: persistent nickname and unified, per-mode statistics.
   Shared by the endless world, four arcade modes and Cosmic Worms. */
(function(){
'use strict';
const PROFILE_KEY='infinity-space-player-v1', STATS_KEY='infinity-space-stats-v1';
const MODE_IDS=['endless','arena','royale','core','race','worms'];
const NAMES={ru:['Общая','Бесконечный космос','Космическая арена','Последняя сингулярность','Захват ядра','Гонка эволюции','Космические черви'],en:['Overall','Endless Space','Cosmic Arena','Last Singularity','Core Conquest','Evolution Rush','Cosmic Worms'],es:['General','Espacio infinito','Arena Cósmica','Última singularidad','Conquista del núcleo','Carrera evolutiva','Gusanos cósmicos']};
const dict={
 ru:{nickname:'ТВОЙ ПОЗЫВНОЙ',prompt:'Введи никнейм — он будет виден в матчах и результатах.',placeholder:'Никнейм',save:'СОХРАНИТЬ',edit:'Сменить никнейм',error:'От 2 до 18 символов.',stats:'СТАТИСТИКА',close:'ЗАКРЫТЬ',matches:'Матчей',wins:'Побед',winrate:'Побед, %',kills:'Поглощено соперников',objects:'Поглощено объектов',mass:'Максимальная масса',time:'Время в игре',best:'Лучшее место',top3:'Топ-3',points:'Очки ядра',finish:'Лучшее время',stage:'Максимальная стадия',matter:'Всего материи',rare:'Реликвии',blackholes:'Поглощено чёрных дыр',deaths:'Поражений',forms:'Достигнуто форм',empty:'Пока нет матчей',profile:'ПРОФИЛЬ'},
 en:{nickname:'YOUR CALLSIGN',prompt:'Choose your nickname. It appears in matches, results and statistics.',placeholder:'Nickname',save:'SAVE',edit:'Change nickname',error:'Use 2–18 characters.',stats:'STATISTICS',close:'CLOSE',matches:'Matches',wins:'Wins',winrate:'Win rate',kills:'Rivals absorbed',objects:'Objects absorbed',mass:'Highest mass',time:'Time played',best:'Best rank',top3:'Top-3 finishes',points:'Core points',finish:'Best finish',stage:'Highest stage',matter:'Matter collected',rare:'Relics',blackholes:'Black holes absorbed',deaths:'Defeats',forms:'Forms reached',empty:'No matches recorded',profile:'PROFILE'},
 es:{nickname:'TU ALIAS',prompt:'Escribe tu apodo para partidas, resultados y estadísticas.',placeholder:'Apodo',save:'GUARDAR',edit:'Cambiar apodo',error:'Entre 2 y 18 caracteres.',stats:'ESTADÍSTICAS',close:'CERRAR',matches:'Partidas',wins:'Victorias',winrate:'Victorias, %',kills:'Rivales absorbidos',objects:'Objetos absorbidos',mass:'Masa máxima',time:'Tiempo jugado',best:'Mejor puesto',top3:'Top-3',points:'Puntos del núcleo',finish:'Mejor tiempo',stage:'Fase máxima',matter:'Materia recogida',rare:'Reliquias',blackholes:'Agujeros negros absorbidos',deaths:'Derrotas',forms:'Formas alcanzadas',empty:'Sin partidas',profile:'PERFIL'}
};
function language(){
 const s=window.SpaceI18n?.language || document.documentElement.lang || navigator.language || 'en';
 return /^ru\b/i.test(s)?'ru':/^es\b/i.test(s)?'es':'en';
}
const text=(key)=>dict[language()][key]||dict.en[key]||key;
function read(key,fallback){try{const v=JSON.parse(localStorage.getItem(key));return v&&typeof v==='object'?v:fallback;}catch(_){return fallback;}}
function write(key,value){try{localStorage.setItem(key,JSON.stringify(value));}catch(_){}}
function safeCount(x){const n=Number(x);return Number.isFinite(n)?Math.max(0,n):0;}
function basic(){return {matches:0,wins:0,kills:0,objects:0,maxMass:0,time:0,bestPlace:null,placeSum:0,top3:0,points:0,bestPoints:0,bestFinish:null,maxStage:0,forms:[0,0,0,0,0],matter:0,rare:0,blackholes:0,deaths:0};}
function empty(){const s={version:2,order:MODE_IDS.slice()};for(const mode of MODE_IDS)s[mode]=basic();s.endless._last=null;return s;}
function getStats(){const s=read(STATS_KEY,empty());for(const mode of MODE_IDS)s[mode]=Object.assign(basic(),s[mode]||{});return s;}
function saveStats(s){write(STATS_KEY,s);window.dispatchEvent(new Event('infinity-stats-updated'));}
function getName(){const o=read(PROFILE_KEY,{});return typeof o.nickname==='string'?o.nickname.trim().slice(0,18):'';}
function setName(value){
 const name=String(value||'').trim().replace(/[<>]/g,'').replace(/\s{2,}/g,' ').slice(0,18);
 if([...name].length<2)return false;
 write(PROFILE_KEY,{version:1,nickname:name});
 window.dispatchEvent(new CustomEvent('infinity-profile-updated',{detail:{nickname:name}}));
 return true;
}
function recordMatch(mode,result){
 if(!MODE_IDS.includes(mode)||mode==='endless')return;
 const s=getStats(),b=s[mode],r=result||{};
 b.matches++;if(r.win)b.wins++;
 b.kills+=safeCount(r.kills);b.objects+=safeCount(r.objects);
 b.maxMass=Math.max(b.maxMass,safeCount(r.mass));
 b.time+=safeCount(r.time);
 const place=Math.max(1,Math.round(safeCount(r.place)||99));
 b.bestPlace=b.bestPlace===null?place:Math.min(b.bestPlace,place);
 b.placeSum+=place;if(place<=3)b.top3++;
 b.points+=safeCount(r.points);
 b.bestPoints=Math.max(b.bestPoints,safeCount(r.points));
 if(r.win && mode==='race'&&safeCount(r.time)>0)
  b.bestFinish=b.bestFinish===null?r.time:Math.min(b.bestFinish,r.time);
 b.maxStage=Math.max(b.maxStage,safeCount(r.stage));
 for(let stage=0;stage<5;stage++)if(safeCount(r.stage)>=stage)b.forms[stage]=(b.forms[stage]||0)+1;
 b.deaths+=r.win?0:1;
 saveStats(s);
 achievementStats(mode,s);
}
function syncEndless(snapshot){
 if(!snapshot||typeof snapshot!=='object')return;
 const s=getStats(),b=s.endless;
 const now={
  time:safeCount(snapshot.time),objects:safeCount(snapshot.objects),matter:safeCount(snapshot.matter),
  rare:safeCount(snapshot.rare),blackholes:safeCount(snapshot.blackholes),
  deaths:safeCount(snapshot.deaths),stage:safeCount(snapshot.stage)
 };
 const before=b._last||{time:0,objects:0,matter:0,rare:0,blackholes:0,deaths:0,stage:0};
 if(now.time<before.time || now.objects<before.objects){
  // A new saved universe started; keep lifetime totals, reset the baseline.
  b._last={time:0,objects:0,matter:0,rare:0,blackholes:0,deaths:0,stage:0};
 }
 const prev=b._last||before;
 if(!prev.time && now.time>0)b.matches++;
 b.time+=Math.max(0,now.time-prev.time);
 b.objects+=Math.max(0,now.objects-prev.objects);
 b.matter+=Math.max(0,now.matter-prev.matter);
 b.rare+=Math.max(0,now.rare-prev.rare);
 b.blackholes+=Math.max(0,now.blackholes-prev.blackholes);
 b.deaths+=Math.max(0,now.deaths-prev.deaths);
 b.maxMass=Math.max(b.maxMass,now.matter,safeCount(snapshot.mass));
 b.maxStage=Math.max(b.maxStage,now.stage);
 b._last=now;
 saveStats(s);
}
function total(s){
 const r=basic();
 for(const mode of MODE_IDS){
  const b=s[mode]||basic();
  for(const k of ['matches','wins','kills','objects','time','placeSum','top3','points','matter','rare','blackholes','deaths'])r[k]+=safeCount(b[k]);
  r.maxMass=Math.max(r.maxMass,safeCount(b.maxMass));
  r.maxStage=Math.max(r.maxStage,safeCount(b.maxStage));
  r.bestPlace=b.bestPlace===null?r.bestPlace:r.bestPlace===null?b.bestPlace:Math.min(r.bestPlace,b.bestPlace);
  r.bestFinish=b.bestFinish===null?r.bestFinish:r.bestFinish===null?b.bestFinish:Math.min(r.bestFinish,b.bestFinish);
 }
 return r;
}
const num=v=>new Intl.NumberFormat(language()==='ru'?'ru-RU':'en-US',{maximumFractionDigits:0}).format(safeCount(v));
function clock(s){
 s=Math.floor(safeCount(s));const h=Math.floor(s/3600),m=Math.floor(s/60)%60,sec=s%60;
 return h?String(h)+'h '+String(m).padStart(2,'0')+'m':String(m).padStart(2,'0')+':'+String(sec).padStart(2,'0');
}
let statsNode=null,statsMode='overall';
function showStats(selected){
 statsMode=(selected&&MODE_IDS.includes(selected))?selected:'overall';
 if(statsNode)statsNode.remove();
 const node=document.createElement('div');statsNode=node;
 node.className='infinity-profile-overlay';node.setAttribute('role','dialog');
 node.setAttribute('aria-modal','true');node.setAttribute('aria-label',text('stats'));
 node.innerHTML='<section class="infinity-profile-panel infinity-stats-panel">'+
  '<div class="infinity-panel-top"><div><small>INFINITY SPACE / '+text('profile')+'</small><h2>'+text('stats')+'</h2></div>'+
  '<button class="infinity-overlay-close" type="button" aria-label="'+text('close')+'">×</button></div>'+
  '<div class="infinity-stats-player"><span class="infinity-profile-avatar">✧</span>'+
  '<strong class="infinity-stats-player-name"></strong><button class="infinity-stats-change-name" type="button">'+text('edit')+'</button></div>'+
  '<div class="infinity-stats-tabs" role="tablist"></div><div class="infinity-stats-detail"></div></section>';
 document.body.appendChild(node);
 node.querySelector('.infinity-stats-player-name').textContent=getName()||'PLAYER';
 const tabs=node.querySelector('.infinity-stats-tabs'),labels=NAMES[language()];
 ['overall',...MODE_IDS].forEach((id,i)=>{
  const b=document.createElement('button');b.type='button';b.dataset.mode=id;
  b.textContent=labels[i];b.setAttribute('role','tab');
  b.onclick=()=>{statsMode=id;paint();};
  tabs.appendChild(b);
 });
 node.querySelector('.infinity-overlay-close').onclick=()=>{node.remove();if(statsNode===node)statsNode=null;};
 node.querySelector('.infinity-stats-change-name').onclick=()=>promptName(false,()=>{node.querySelector('.infinity-stats-player-name').textContent=getName();});
 node.addEventListener('pointerdown',ev=>{if(ev.target===node)node.querySelector('.infinity-overlay-close').click();});
 const key=e=>{if(!node.isConnected){document.removeEventListener('keydown',key,true);return;}
  if(e.code==='Escape'){e.preventDefault();e.stopImmediatePropagation();node.querySelector('.infinity-overlay-close').click();document.removeEventListener('keydown',key,true);}};
 document.addEventListener('keydown',key,true);
 function paint(){
  const s=getStats(),b=statsMode==='overall'?total(s):s[statsMode];
  [...tabs.children].forEach(button=>{const active=button.dataset.mode===statsMode;button.classList.toggle('active',active);button.setAttribute('aria-selected',String(active));});
  const list=[
   ['matches',b.matches],['wins',b.wins],['winrate',(statsMode==='overall'?MODE_IDS.slice(1).reduce((sum,id)=>sum+s[id].matches,0):b.matches)?Math.round(b.wins/(statsMode==='overall'?MODE_IDS.slice(1).reduce((sum,id)=>sum+s[id].matches,0):b.matches)*100)+'%':'0%'],
   ['kills',b.kills],['objects',b.objects],['mass',b.maxMass],['time',clock(b.time)]
  ];
  if(statsMode==='endless'||statsMode==='overall')list.push(['stage',b.maxStage+1],['matter',b.matter],['rare',b.rare],['blackholes',b.blackholes]);
  if(['arena','royale','worms','overall'].includes(statsMode))list.push(['best',b.bestPlace===null?'—':'#'+b.bestPlace],['top3',b.top3]);
  if(statsMode==='core'||statsMode==='overall')list.push(['points',b.points]);
  if(statsMode==='race'||statsMode==='overall')list.push(['finish',b.bestFinish===null?'—':clock(b.bestFinish)]);
  if(statsMode==='race')list.push(['forms',b.forms.slice(1).join(' / ')]);
  const detail=node.querySelector('.infinity-stats-detail');detail.replaceChildren();
  for(const [key,value] of list){
   const card=document.createElement('div');card.className='infinity-stats-card';
   const label=document.createElement('small');label.textContent=text(key);
   const strong=document.createElement('strong');strong.textContent=typeof value==='number'?num(value):String(value);
   card.append(label,strong);detail.append(card);
  }
 }
 paint();
 return node;
}
function promptName(required=true,onSave){
 const current=document.querySelector('.infinity-nickname-prompt');if(current){current.querySelector('input')?.focus();return current;}
 const node=document.createElement('div');node.className='infinity-profile-overlay infinity-nickname-prompt';
 node.setAttribute('role','dialog');node.setAttribute('aria-modal','true');
 node.innerHTML='<section class="infinity-profile-panel infinity-nickname-panel">'+
  '<div class="infinity-panel-top"><div><small>INFINITY SPACE / '+text('profile')+'</small><h2>'+text('nickname')+'</h2></div>'+
  (required?'':'<button class="infinity-overlay-close" type="button" aria-label="'+text('close')+'">×</button>')+
  '</div><p>'+text('prompt')+'</p><form><label for="infinity-nick-input">'+text('nickname')+'</label>'+
  '<input id="infinity-nick-input" name="nickname" type="text" maxlength="18" minlength="2" spellcheck="false" required autocomplete="nickname" placeholder="'+text('placeholder')+'">'+
  '<div class="infinity-nickname-error" aria-live="polite"></div>'+
  '<button class="infinity-nickname-save" type="submit">'+text('save')+'</button></form></section>';
 document.body.append(node);
 const input=node.querySelector('input');input.value=getName();
 const close=()=>node.remove();
 if(!required)node.querySelector('.infinity-overlay-close').onclick=close;
 node.querySelector('form').onsubmit=e=>{
  e.preventDefault();
  if(!setName(input.value)){node.querySelector('.infinity-nickname-error').textContent=text('error');input.focus();return;}
  close();if(typeof onSave==='function')onSave(getName());
 };
 const key=e=>{if(!node.isConnected){document.removeEventListener('keydown',key,true);return;}
  if(e.code==='Escape'){e.stopImmediatePropagation();e.preventDefault();if(!required){close();document.removeEventListener('keydown',key,true);}}
 };
 document.addEventListener('keydown',key,true);
 input.focus();
 return node;
}

/* Independent competitive-mode achievements. Unlike the sandbox's original
   evolution achievements, these derive from actual persisted match statistics.
   Never overwrite the existing g.achievements or restart-universe progress. */
const ACHIEVEMENT_KEY='infinity-space-mode-achievements-v1';
const ACHIEVEMENT_RARITY=[
 ['common','#b6a7d9'],['uncommon','#47df86'],['rare','#4a9eff'],
 ['epic','#bb83ff'],['legendary','#ffc76f'],['mythic','#f58ac8']
];
// [id, rarity, title EN/RU/ES, milestone hint EN/RU/ES, stat, target]
const MODE_ACHIEVEMENTS={
 arena:[
  ['first',0,['First Encounter','Первая встреча','Primer encuentro'],['Finish one Arena match','Заверши один матч арены','Termina una partida'],'matches',1],
  ['harvester',1,['Cosmic Harvester','Космический сборщик','Recolector cósmico'],['Absorb 250 objects','Поглоти 250 объектов','Absorbe 250 objetos'],'objects',250],
  ['predator',2,['Gravity Predator','Гравитационный хищник','Depredador gravitacional'],['Defeat 10 opponents','Победи 10 соперников','Derrota a 10 rivales'],'kills',10],
  ['podium',3,['Arena Master','Мастер арены','Maestro de la arena'],['Finish in the top 3 three times','Трижды войди в топ-3','Termina tres veces entre los 3 primeros'],'top3',3],
  ['champion',4,['Cosmic Champion','Космический чемпион','Campeón cósmico'],['Win 5 Arena matches','Победи в пяти матчах арены','Gana cinco partidas'],'wins',5],
  ['veteran',5,['Living Legend','Живая легенда','Leyenda viviente'],['Complete 30 Arena matches','Заверши 30 матчей арены','Completa 30 partidas'],'matches',30]
 ],
 royale:[
  ['first',0,['Into the Storm','Навстречу шторму','Hacia la tormenta'],['Survive your first Royale match','Сыграй первый матч на выживание','Juega tu primera partida'],'matches',1],
  ['podium',1,['Storm Survivor','Выживший в шторме','Superviviente'],['Reach the top 3','Войди в топ-3','Llega entre los 3 mejores'],'top3',1],
  ['hunter',2,['Shadow Hunter','Охотник из тени','Cazador de sombras'],['Defeat 15 rivals','Уничтожь 15 соперников','Derrota a 15 rivales'],'kills',15],
  ['winner',3,['Last Singularity','Последняя сингулярность','Última singularidad'],['Win your first match','Одержи первую победу','Consigue tu primera victoria'],'wins',1],
  ['marathon',4,['Against the Void','Вопреки пустоте','Contra el vacío'],['Play for 60 minutes total','Продержись суммарно 60 минут','Juega durante 60 minutos'],'time',3600],
  ['legend',5,['The Last One','Последний','El último'],['Win 10 Royale matches','Выиграй 10 матчей на выживание','Gana 10 partidas'],'wins',10]
 ],
 core:[
  ['first',0,['First Capture','Первый захват','Primera captura'],['Complete a Core match','Заверши матч за ядро','Completa una partida'],'matches',1],
  ['guardian',1,['Core Guardian','Хранитель ядра','Guardián del núcleo'],['Earn 100 control points','Набери 100 очков контроля','Gana 100 puntos de control'],'points',100],
  ['defender',2,['Hold the Line','Держать оборону','Mantén la línea'],['Earn 300 control points','Набери 300 очков контроля','Gana 300 puntos de control'],'points',300],
  ['warrior',3,['Team Vanguard','Авангард команды','Vanguardia del equipo'],['Defeat 12 rivals','Победи 12 соперников','Derrota a 12 rivales'],'kills',12],
  ['captain',4,['Core Commander','Командир ядра','Comandante del núcleo'],['Win 5 team matches','Выиграй 5 командных матчей','Gana 5 partidas por equipos'],'wins',5],
  ['veteran',5,['Unbreakable Team','Несокрушимая команда','Equipo invencible'],['Complete 25 Core matches','Заверши 25 матчей за ядро','Completa 25 partidas'],'matches',25]
 ],
 race:[
  ['first',0,['Starting Line','Стартовая линия','Línea de salida'],['Complete your first race','Заверши первую гонку','Completa tu primera carrera'],'matches',1],
  ['asteroid',1,['Evolution Engine','Двигатель эволюции','Motor evolutivo'],['Reach evolution stage 3','Достигни третьей стадии','Alcanza la tercera fase'],'maxStage',3],
  ['singularity',2,['Final Form','Финальная форма','Forma final'],['Reach evolution stage 4','Достигни четвёртой стадии','Alcanza la cuarta fase'],'maxStage',4],
  ['podium',3,['Rising Star','Восходящая звезда','Estrella naciente'],['Finish in the top 3','Финишируй в топ-3','Termina entre los 3 primeros'],'top3',1],
  ['winner',4,['Evolution Champion','Чемпион эволюции','Campeón evolutivo'],['Win 3 evolution races','Победи в трёх гонках','Gana tres carreras'],'wins',3],
  ['speed',5,['Faster than Light','Быстрее света','Más rápido que la luz'],['Win a race in under 3 minutes','Победи быстрее чем за 3 минуты','Gana en menos de tres minutos'],'bestFinish',180]
 ],
 worms:[
  ['first',0,['First Orbit','Первый виток','Primera órbita'],['Finish your first worm run','Заверши первую игру за червя','Completa tu primera partida'],'matches',1],
  ['stardust',1,['Stardust Collector','Собиратель звёзд','Recolector estelar'],['Collect 200 glowing orbs','Собери 200 светящихся сфер','Recoge 200 orbes brillantes'],'objects',200],
  ['hunter',2,['Serpent Hunter','Охотник на червей','Cazador de gusanos'],['Defeat 15 enemy worms','Уничтожь 15 червей','Derrota a 15 gusanos'],'kills',15],
  ['top3',3,['Cosmic Serpent','Космический змей','Serpiente cósmica'],['Reach the top 3 three times','Трижды войди в топ-3','Termina tres veces entre los 3 primeros'],'top3',3],
  ['mass',4,['Stellar Colossus','Звёздный колосс','Coloso estelar'],['Reach 500 maximum mass','Достигни массы 500','Alcanza una masa de 500'],'maxMass',500],
  ['eternal',5,['Endless Tail','Бесконечный хвост','Cola infinita'],['Spend 60 minutes surviving','Проведи в игре 60 минут','Juega durante 60 minutos'],'time',3600]
 ]
};
// Extra long-term milestones per mode; appended without changing existing unlock IDs.
const EXTRA_MILESTONES=[
 ['matches',5,0,['Getting Started','Первый опыт','Primeros pasos']],
 ['matches',15,1,['Regular Visitor','Завсегдатай','Habitual']],
 ['matches',50,3,['Space Veteran','Ветеран космоса','Veterano espacial']],
 ['matches',150,5,['Eternal Explorer','Вечный исследователь','Explorador eterno']],
 ['kills',1,0,['First Elimination','Первое устранение','Primera eliminación']],
 ['kills',30,3,['Dangerous Rival','Опасный соперник','Rival peligroso']],
 ['kills',100,5,['Galaxy Terror','Гроза галактики','Terror galáctico']],
 ['wins',1,1,['First Victory','Первая победа','Primera victoria']],
 ['wins',15,4,['Born Champion','Прирождённый чемпион','Campeón nato']],
 ['wins',50,5,['Unstoppable','Неостановимый','Imparable']],
 ['time',600,0,['Ten Minutes','Десять минут','Diez minutos']],
 ['time',7200,4,['Two-Hour Voyage','Двухчасовой полёт','Viaje de dos horas']]
];
for(const [mode,defs] of Object.entries(MODE_ACHIEVEMENTS)){
 for(const [field,target,rarity,title] of EXTRA_MILESTONES){
  defs.push(['extra-'+field+'-'+target,rarity,title,
   [field+' · '+target,field+' · '+target,field+' · '+target],field,target]);
 }
 if(mode==='worms')for(const target of [100,250,750,1500,3000,7500])
  defs.push(['mass-'+target,target>=3000?5:target>=750?3:1,
   ['Cosmic Giant '+target,'Космический гигант '+target,'Gigante cósmico '+target],
   ['Reach '+target+' mass','Достигни массы '+target,'Alcanza masa '+target],'maxMass',target]);
 if(mode==='core')for(const target of [500,1000,2500])
  defs.push(['control-'+target,target===2500?5:3,
   ['Core Dominion '+target,'Власть над ядром '+target,'Dominio del núcleo '+target],
   ['Earn '+target+' points','Набери '+target+' очков','Consigue '+target+' puntos'],'points',target]);
}
const localeTriple=triple=>triple[({en:0,ru:1,es:2})[language()]||0];
function achievementStats(mode,stats){
 if(!MODE_ACHIEVEMENTS[mode])return null;
 const s=stats||getStats(),b=s[mode]||basic(),defs=MODE_ACHIEVEMENTS[mode];
 const saved=read(ACHIEVEMENT_KEY,{version:1}),had=saved[mode]||{};
 let changed=false;
 const items=defs.map(([key,rarity,title,hint,field,target])=>{
  const raw=field==='bestFinish'?(b.bestFinish===null?0:safeCount(b.bestFinish)):safeCount(b[field]);
  const progress=field==='bestFinish'
    ?raw>0?Math.min(100,target/raw*100):0
    :Math.min(100,raw/target*100);
  const reached=field==='bestFinish'?raw>0&&raw<=target:raw>=target;
  if(reached&&!had[key]){had[key]=true;changed=true;}
  const unlocked=!!had[key];
  return {id:key,rarity,color:ACHIEVEMENT_RARITY[rarity][1],
   title:localeTriple(title),hint:localeTriple(hint),field,target,value:raw,
   percent:unlocked?100:Math.max(0,progress),unlocked};
 });
 if(changed){
  saved.version=1;saved[mode]=had;write(ACHIEVEMENT_KEY,saved);
  window.dispatchEvent(new CustomEvent('infinity-achievements-updated',{detail:{mode}}));
 }
 return {mode,earned:items.filter(a=>a.unlocked).length,total:items.length,items};
}
function showModeAchievements(mode){
 const state=achievementStats(mode);
 if(!state)return null;
 document.querySelector('.infinity-mode-achievements-overlay')?.remove();
 const node=document.createElement('div');
 node.className='infinity-profile-overlay infinity-mode-achievements-overlay';
 node.setAttribute('role','dialog');node.setAttribute('aria-modal','true');
 const panel=document.createElement('section');
 panel.className='infinity-profile-panel infinity-mode-achievements-panel';
 const top=document.createElement('div');top.className='infinity-panel-top';
 const heading=document.createElement('div');
 const subtitle=document.createElement('small');
 subtitle.textContent='INFINITY SPACE / '+NAMES[language()][MODE_IDS.indexOf(mode)+1];
 const title=document.createElement('h2');title.textContent=localeTriple(['ACHIEVEMENTS','ДОСТИЖЕНИЯ','LOGROS']);
 heading.append(subtitle,title);
 const closeBtn=document.createElement('button');
 closeBtn.type='button';closeBtn.className='infinity-overlay-close';
 closeBtn.setAttribute('aria-label',text('close'));closeBtn.textContent=localeTriple(['← BACK','← НАЗАД','← VOLVER']);
 top.append(heading,closeBtn);
 const summary=document.createElement('div');summary.className='infinity-mode-achievements-summary';
 const total=document.createElement('strong');total.textContent=state.earned+' / '+state.total;
 const explanation=document.createElement('span');
 explanation.textContent=localeTriple(['Unlocked in this mode','Открыто в этом режиме','Desbloqueados en este modo']);
 summary.append(total,explanation);
 const filters=document.createElement('nav');filters.className='infinity-mode-achievements-filters br-ach-filters';
 filters.setAttribute('aria-label',localeTriple(['Achievement rarity','Редкость достижений','Rareza de logros']));
 const filterDefs=[
  ['all',['ALL','ВСЕ','TODOS']],
  ['common',['COMMON','ОБЫЧНЫЕ','COMUNES']],
  ['uncommon',['UNCOMMON','НЕОБЫЧНЫЕ','POCO COMUNES']],
  ['rare',['RARE','РЕДКИЕ','RAROS']],
  ['epic',['EPIC','ЭПИЧЕСКИЕ','ÉPICOS']],
  ['legendary',['LEGENDARY','ЛЕГЕНДАРНЫЕ','LEGENDARIOS']],
  ['mythic',['MYTHIC','МИФИЧЕСКИЕ','MÍTICOS']]
 ];
 const list=document.createElement('div');list.className='infinity-mode-achievements-list br-ach-list';
 const cards=[];
 for(const a of state.items){
  const rarity=ACHIEVEMENT_RARITY.find(row=>row[1]===a.color)?.[0]||'common';
  const card=document.createElement('article');
  card.className='infinity-mode-achievement br-ach-row'+(a.unlocked?' unlocked':'');
  card.dataset.rarity=rarity;
  card.style.setProperty('--rarity',a.color);
  const insignia=document.createElement('span');insignia.className='infinity-mode-achievement-insignia br-ach-symbol '+rarity;
  insignia.textContent=a.unlocked?'✓':'✧';
  const content=document.createElement('div');content.className='infinity-mode-achievement-copy br-ach-copy';
  const label=document.createElement('span');label.className='br-ach-rarity '+rarity;
  const rarityRow=filterDefs.find(row=>row[0]===rarity);
  label.textContent=localeTriple(rarityRow?.[1]||filterDefs[1][1]);
  const name=document.createElement('strong');name.textContent=a.title;
  const description=document.createElement('small');description.textContent=a.hint;
  const track=document.createElement('div');track.className='infinity-mode-achievement-track br-ach-prog';
  track.setAttribute('role','progressbar');track.setAttribute('aria-label',a.title);
  track.setAttribute('aria-valuemin','0');track.setAttribute('aria-valuemax','100');
  track.setAttribute('aria-valuenow',String(Math.round(a.percent)));
  const fill=document.createElement('i');fill.style.width=a.percent+'%';track.append(fill);
  content.append(label,name,description,track);
  const percent=document.createElement('b');percent.textContent=Math.round(a.percent)+'%';
  card.append(insignia,content,percent);
  cards.push(card);list.append(card);
 }
 const setFilter=(filter)=>{
  for(const card of cards)card.hidden=filter!=='all'&&card.dataset.rarity!==filter;
  for(const button of filters.querySelectorAll('button')){
   const selected=button.dataset.achFilter===filter;
   button.classList.toggle('active',selected);
   button.setAttribute('aria-pressed',String(selected));
  }
 };
 for(const [key,label] of filterDefs){
  const button=document.createElement('button');
  button.type='button';button.className='br-filter'+(key==='all'?' active':'');
  button.dataset.achFilter=key;button.textContent=localeTriple(label);
  button.onclick=()=>setFilter(key);filters.append(button);
 }
 panel.append(top,summary,filters,list);node.append(panel);document.body.append(node);
 const onKey=e=>{if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();close();}};
 const close=()=>{document.removeEventListener('keydown',onKey,true);node.remove();};
 document.addEventListener('keydown',onKey,true);
 closeBtn.addEventListener('click',close);
 node.addEventListener('pointerdown',e=>{if(e.target===node)close();});
 return node;
}

window.InfinityProfile={getName,setName,promptName,showStats,getStats,recordMatch,syncEndless,total,language,text,showModeAchievements,achievementStats};
})();