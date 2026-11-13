/* Infinity Space — Cosmic Worms: original single-player .io serpent arena.
   Slither-style growth/boost/body-collision mechanics; all rivals are local AI.
   No external game logic, assets, account or network requests. */
(()=>{'use strict';
const QUERY=new URLSearchParams(location.search);
const HASH_QUERY=new URLSearchParams(location.hash.slice(1));
const DEMO=QUERY.has('demo')||HASH_QUERY.has('demo');
if(DEMO)document.documentElement.classList.add('worm-demo');
const storedLang=(()=>{try{return localStorage.getItem('infiniti-space-language')||''}catch(_){return ''}})();
const language=/^(ru|en|es)$/.test(storedLang)?storedLang:(/^ru/i.test(navigator.language)?'ru':/^es/i.test(navigator.language)?'es':'en');
document.documentElement.lang=language;
const WORDS={
 en:{settings:'SETTINGS',config:'CONFIGURATION',back:'BACK',controlTab:'CONTROLS',audioTab:'AUDIO',graphicsTab:'GRAPHICS',generalTab:'GENERAL',controlHeading:'MOVEMENT & CAMERA',controlDetails:'Continuous flight with fluid steering and modest zoom.',controlMouse:'MOUSE / KEYBOARD',controlMouseDesc:'Move the cursor or use WASD and arrows to turn',controlBoost:'ACCELERATION',controlBoostDesc:'Hold Space, mouse click or Boost to accelerate',graphicsDetails:'Adjust the cosmic visual effects in this mode.',generalHeading:'PROFILE & HELP',generalDetails:'Preferences are saved automatically.',guideDescription:'Review movement and survival rules',settingsAutoSave:'SETTINGS SAVED AUTOMATICALLY',settingsIntro:'Customize your flight without leaving the match.',glowDesc:'Brighter cosmic trails and highlights',namesDesc:'Names above other worms',appearance:'Cosmic appearance',appearanceDesc:'Choose a skin with live preview',chooseSkin:'SKINS',settingsSound:'SOUND & CONTROLS',settingsSoundName:'Game audio',settingsSoundDesc:'One switch for all sounds',settingsCameraTitle:'CAMERA',settingsCameraHint:'Mouse wheel or pinch with two fingers. Gentle smooth zoom.',skins:'COSMIC SKINS',skinDesc:'Choose a space-inspired appearance. All skins are free.',visuals:'VISUALS',glow:'Enhanced body glow',names:'Show rival names',zoom:'Camera distance',backPause:'SAVE AND EXIT',length:'LENGTH',rank:'RANK',time:'TIME',leaders:'LEADERBOARD',radar:'GALAXY RADAR',pause:'PAUSE',
 pauseTagline:'The universe waits. Your journey continues.',pauseRun:'CURRENT FLIGHT',pauseLook:'YOUR COSMIC WORM',pauseSkinLabel:'CURRENT SKIN',pauseActions:'WHAT NEXT',soundOn:'SOUND ON',soundOff:'SOUND OFF',
  boost:'BOOST',paused:'PAUSED',pauseDesc:'Resume the flight, review the controls or return to mode selection.',
 resume:'CONTINUE',help:'HOW TO PLAY',menu:'EXIT TO MENU',guideTitle:'COSMIC WORMS',skip:'SKIP',next:'NEXT',start:'START',
 runOver:'FLIGHT COMPLETE',destroyed:'WORM DESTROYED',kills:'ELIMINATIONS',again:'PLAY AGAIN',
 hint:'MOUSE / WASD — TURN  ·  SPACE / CLICK — BOOST',bot:'COSMIC WORMS · SURVIVAL',danger:'THE EDGE OF SPACE!',
 eliminated:'A rival cut off your route.',wall:'You reached the outer boundary.',self:'A head-on collision.',
 lead:'YOU ARE #1',mass:'ORBS COLLECTED',guide:[
 ['GROW A COSMIC TAIL','Move toward glowing stardust. Each orb adds mass and segments to your cosmic serpent.','✦'],
 ['OUTMANEUVER RIVALS','Your head must not touch another worm’s body. Cut opponents off with your own tail; defeated worms drop valuable matter.','◌'],
 ['BOOST WHEN NEEDED','Hold Space or the mouse button to accelerate. Boosting slowly burns mass and drops energy behind you. On phones, steer with the joystick and hold BOOST.','➤']
 ]},
 ru:{settings:'НАСТРОЙКИ',config:'КОНФИГУРАЦИЯ',back:'НАЗАД',controlTab:'УПРАВЛЕНИЕ',audioTab:'АУДИО',graphicsTab:'ГРАФИКА',generalTab:'ПРОЧЕЕ',controlHeading:'ДВИЖЕНИЕ И КАМЕРА',controlDetails:'Непрерывное движение, плавный поворот и небольшая настройка масштаба.',controlMouse:'МЫШЬ / КЛАВИАТУРА',controlMouseDesc:'Направляй курсор или используй WASD и стрелки',controlBoost:'УСКОРЕНИЕ',controlBoostDesc:'Удерживай пробел, кнопку мыши или «Рывок»',graphicsDetails:'Настрой космические визуальные эффекты режима.',generalHeading:'ПРОФИЛЬ И ПОМОЩЬ',generalDetails:'Настройки сохраняются автоматически.',guideDescription:'Повтори управление и правила выживания',settingsAutoSave:'НАСТРОЙКИ СОХРАНЯЮТСЯ АВТОМАТИЧЕСКИ',settingsIntro:'Измени параметры, не покидая матч.',glowDesc:'Яркость космического свечения и шлейфов',namesDesc:'Имена над другими червями',appearance:'Космический облик',appearanceDesc:'Выбрать скин с живым предпросмотром',chooseSkin:'СКИНЫ',settingsSound:'ЗВУК И УПРАВЛЕНИЕ',settingsSoundName:'Звуки игры',settingsSoundDesc:'Одно отключение для всех звуков',settingsCameraTitle:'КАМЕРА',settingsCameraHint:'Колесо мыши или два пальца на телефоне. Небольшое плавное приближение.',skins:'КОСМИЧЕСКИЕ СКИНЫ',skinDesc:'Выбери космический облик червя. Все скины бесплатны.',visuals:'ГРАФИКА',glow:'Усиленное свечение тела',names:'Показывать имена соперников',zoom:'Дистанция камеры',backPause:'СОХРАНИТЬ И ВЫЙТИ',length:'ДЛИНА',rank:'МЕСТО',time:'ВРЕМЯ',leaders:'ТАБЛИЦА ЛИДЕРОВ',radar:'РАДАР ГАЛАКТИКИ',pause:'ПАУЗА',
 pauseTagline:'Космос подождёт. Твой полёт ещё не окончен.',pauseRun:'ТЕКУЩИЙ ЗАБЕГ',pauseLook:'ТВОЙ КОСМИЧЕСКИЙ ЧЕРВЬ',pauseSkinLabel:'ВЫБРАННЫЙ СКИН',pauseActions:'ДЕЙСТВИЯ',soundOn:'ЗВУК ВКЛ',soundOff:'ЗВУК ВЫКЛ',
  boost:'РЫВОК',paused:'ПАУЗА',pauseDesc:'Продолжи полёт, посмотри обучение или вернись к выбору режима.',
 resume:'ПРОДОЛЖИТЬ',help:'КАК ИГРАТЬ',menu:'ВЫХОД В МЕНЮ',guideTitle:'КОСМИЧЕСКИЕ ЧЕРВИ',skip:'ПРОПУСТИТЬ',next:'ДАЛЕЕ',start:'ИГРАТЬ',
 runOver:'ПОЛЁТ ЗАВЕРШЁН',destroyed:'ЧЕРВЬ ПОГИБ',kills:'ПОГЛОЩЕНО',again:'СЫГРАТЬ СНОВА',
 hint:'МЫШЬ / WASD — ПОВОРОТ  ·  ПРОБЕЛ / КЛИК — РЫВОК',bot:'КОСМИЧЕСКИЕ ЧЕРВИ · ВЫЖИВАНИЕ',danger:'КРАЙ КОСМОСА!',
 eliminated:'Соперник перекрыл тебе путь.',wall:'Ты достиг границы арены.',self:'Столкновение головами.',
 lead:'ТЫ НА ПЕРВОМ МЕСТЕ',mass:'СОБРАНО ЧАСТИЦ',guide:[
 ['РАСТИ И УДЛИНЯЙСЯ','Собирай светящиеся звёздные частицы. От них космический червь растёт и становится длиннее.','✦'],
 ['ПЕРЕХИТРИ СОПЕРНИКОВ','Не касайся головой тела другого червя. Перекрывай противникам путь собственным хвостом. После их гибели остаётся ценная материя.','◌'],
 ['ИСПОЛЬЗУЙ РЫВОК','Удерживай Пробел или левую кнопку мыши для ускорения. Рывок расходует массу. На телефоне управляй стиком и удерживай кнопку «Рывок».','➤']
 ]},
 es:{settings:'AJUSTES',config:'CONFIGURACIÓN',back:'ATRÁS',controlTab:'CONTROLES',audioTab:'AUDIO',graphicsTab:'GRÁFICOS',generalTab:'GENERAL',controlHeading:'MOVIMIENTO Y CÁMARA',controlDetails:'Movimiento continuo, giro fluido y zoom limitado.',controlMouse:'RATÓN / TECLADO',controlMouseDesc:'Dirige el cursor o usa WASD y las flechas',controlBoost:'ACELERACIÓN',controlBoostDesc:'Mantén Espacio, clic o Impulso',graphicsDetails:'Personaliza los efectos cósmicos del modo.',generalHeading:'PERFIL Y AYUDA',generalDetails:'Las preferencias se guardan automáticamente.',guideDescription:'Repasa los controles y las reglas',settingsAutoSave:'AJUSTES GUARDADOS AUTOMÁTICAMENTE',settingsIntro:'Personaliza tu vuelo sin salir de la partida.',glowDesc:'Estelas cósmicas y reflejos más brillantes',namesDesc:'Nombres de otros gusanos',appearance:'Apariencia cósmica',appearanceDesc:'Elige un aspecto con vista previa',chooseSkin:'ASPECTOS',settingsSound:'SONIDO Y CONTROLES',settingsSoundName:'Audio del juego',settingsSoundDesc:'Un botón para todos los sonidos',settingsCameraTitle:'CÁMARA',settingsCameraHint:'Rueda del ratón o gesto de dos dedos. Zoom suave y limitado.',skins:'ASPECTOS CÓSMICOS',skinDesc:'Elige un aspecto cósmico. Todos son gratuitos.',visuals:'GRÁFICOS',glow:'Brillo y estelas mejorados',names:'Mostrar nombres de rivales',zoom:'Distancia de cámara',backPause:'GUARDAR Y SALIR',length:'LONGITUD',rank:'PUESTO',time:'TIEMPO',leaders:'CLASIFICACIÓN',radar:'RADAR GALÁCTICO',pause:'PAUSA',
 pauseTagline:'El universo espera. Tu viaje continúa.',pauseRun:'PARTIDA ACTUAL',pauseLook:'TU GUSANO CÓSMICO',pauseSkinLabel:'ASPECTO ACTUAL',pauseActions:'ACCIONES',soundOn:'SONIDO SÍ',soundOff:'SONIDO NO',
  boost:'IMPULSO',paused:'PAUSA',pauseDesc:'Continúa, revisa los controles o elige otro modo.',
 resume:'CONTINUAR',help:'CÓMO JUGAR',menu:'SALIR AL MENÚ',guideTitle:'GUSANOS CÓSMICOS',skip:'SALTAR',next:'SIGUIENTE',start:'JUGAR',
 runOver:'VUELO TERMINADO',destroyed:'GUSANO DESTRUIDO',kills:'ELIMINACIONES',again:'JUGAR DE NUEVO',
 hint:'RATÓN / WASD — GIRAR · ESPACIO / CLIC — IMPULSO',bot:'GUSANOS CÓSMICOS · SUPERVIVENCIA',danger:'¡LÍMITE ESPACIAL!',
 eliminated:'Un rival bloqueó tu camino.',wall:'Alcanzaste el borde de la arena.',self:'Choque frontal.',
 lead:'¡VAS PRIMERO!',mass:'PARTÍCULAS RECOGIDAS',guide:[
 ['CRECE TU COLA','Recoge partículas luminosas. Cada esfera añade masa y alarga tu gusano cósmico.','✦'],
 ['ESQUIVA A LOS RIVALES','Tu cabeza no debe tocar el cuerpo de otros gusanos. Bloquea su ruta con tu cola; los derrotados sueltan materia.','◌'],
 ['ACELERA CON CUIDADO','Mantén Espacio o el botón del ratón para acelerar. El impulso consume masa. En el móvil usa el joystick y mantén IMPULSO.','➤']
 ]}
};
const T=WORDS[language],$=id=>document.getElementById(id),canvas=$('worm-field'),ctx=canvas.getContext('2d',{alpha:false}),mini=$('worm-mini'),mc=mini.getContext('2d');
document.querySelectorAll('[data-word]').forEach(e=>{if(T[e.dataset.word])e.textContent=T[e.dataset.word]});
$('worm-mode-label').textContent=T.bot;
$('worm-hint').textContent=T.hint;
const PI=Math.PI,TAU=PI*2;
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const rand=(a,b)=>a+Math.random()*(b-a);
const dist=(x,y)=>Math.hypot(x,y);
const normAngle=a=>Math.atan2(Math.sin(a),Math.cos(a));
// Four times wider and taller than the original arena (16× playable area).
const WORLD={w:22400,h:22400,cx:11200,cy:11200,rx:10520,ry:10520};
const FOOD_TARGET=DEMO?9800:28000, BOT_COUNT=DEMO?28:58;
const FOOD_CELL=230,BODY_CELL=180; // broadphase grid: no O(food × bots) scans.
const gridKey=(x,y,size)=>Math.floor(x/size)+Math.floor(y/size)*256;
const SKINS=[
 {id:'nebula',en:'Nebula',ru:'Туманность',es:'Nebulosa',light:'#9922ff',dark:'#39006b',accent:'#ff1744',pattern:'nebula'},
 {id:'aurora',en:'Aurora',ru:'Сияние',es:'Aurora',light:'#27ff40',dark:'#0b5e1e',accent:'#ffe500',pattern:'aurora'},
 {id:'pulsar',en:'Pulsar',ru:'Пульсар',es:'Púlsar',light:'#2860ff',dark:'#071d83',accent:'#ffe500',pattern:'pulsar'},
 {id:'flare',en:'Solar Flare',ru:'Вспышка',es:'Llamarada',light:'#ffe500',dark:'#7d2300',accent:'#ff1744',pattern:'flare'},
 {id:'horizon',en:'Event Horizon',ru:'Горизонт',es:'Horizonte',light:'#9922ff',dark:'#150034',accent:'#2860ff',pattern:'horizon'},
 {id:'supernova',en:'Supernova',ru:'Сверхновая',es:'Supernova',light:'#ff1744',dark:'#75041d',accent:'#ffe500',pattern:'supernova'},
 {id:'comet',en:'Comet Ice',ru:'Лёд кометы',es:'Hielo de cometa',light:'#2860ff',dark:'#081260',accent:'#27ff40',pattern:'comet'},
 {id:'stardust',en:'Stardust',ru:'Звёздная пыль',es:'Polvo estelar',light:'#ffe500',dark:'#695009',accent:'#ff1744',pattern:'stardust'},
 {id:'eclipse',en:'Eclipse',ru:'Затмение',es:'Eclipse',light:'#a928ff',dark:'#05050e',accent:'#ff1744',pattern:'eclipse'},
 {id:'meteor',en:'Meteor',ru:'Метеор',es:'Meteoro',light:'#ff1744',dark:'#601017',accent:'#ffe500',pattern:'meteor'},
 {id:'galaxy',en:'Spiral Galaxy',ru:'Спиральная галактика',es:'Galaxia espiral',light:'#2860ff',dark:'#1c0a6b',accent:'#a928ff',pattern:'galaxy'},
 {id:'crystal',en:'Crystal',ru:'Кристалл',es:'Cristal',light:'#27ff40',dark:'#10255c',accent:'#2860ff',pattern:'crystal'},
 {id:'rift',en:'Riftwalker',ru:'Разлом',es:'Fractura',light:'#b832ff',dark:'#270050',accent:'#ff4bb7',pattern:'rift'},
 {id:'dragon',en:'Cosmic Dragon',ru:'Космический дракон',es:'Dragón cósmico',light:'#fc244c',dark:'#570a2e',accent:'#ffdf47',pattern:'dragon'},
 {id:'royal',en:'Royal Nebula',ru:'Королевская туманность',es:'Nebulosa real',light:'#ffd24e',dark:'#231461',accent:'#a86cff',pattern:'royal'},
 {id:'voidbloom',en:'Void Bloom',ru:'Цветок пустоты',es:'Flor del vacío',light:'#9c2ce7',dark:'#080413',accent:'#ff6cb9',pattern:'voidbloom'}
];
const SETTINGS_KEY='infinity-space-worms-settings-v2';
function loadSettings(){
 try{const s=JSON.parse(localStorage.getItem(SETTINGS_KEY));if(s&&typeof s==='object')
  return {skin:SKINS.some(v=>v.id===s.skin)?s.skin:'nebula',glow:s.glow!==false,names:s.names!==false,viewZoom:clamp(Number(s.viewZoom)||1,.84,1.16),head:['classic','blackhole','pulsar','comet','crystal','eclipse'].includes(s.head)?s.head:'classic',muted:s.muted===true,customEnabled:s.customEnabled===true,customSegments:Array.isArray(s.customSegments)?s.customSegments.filter(c=>/^#[0-9a-f]{6}$/i.test(c)).slice(0,64):[]};}catch(_){}
 return {skin:'nebula',glow:true,names:true,viewZoom:1,head:'classic',muted:false,customEnabled:false,customSegments:[]};
}
const options=loadSettings();
function saveOptions(){try{localStorage.setItem(SETTINGS_KEY,JSON.stringify(options));}catch(_){}}

let wormAudioContext=null,wormAudioMaster=null,lastWormPickupSound=0;
// Tiny synthesised feedback uses the same sound switch as the pause screen.
function playWormSound(kind='ui'){
 if(DEMO||options.muted||window.SpacePlatform?.muted)return;
 try{
  const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)return;
  if(!wormAudioContext){
   wormAudioContext=new Audio();wormAudioMaster=wormAudioContext.createGain();
   wormAudioMaster.gain.value=1;wormAudioMaster.connect(wormAudioContext.destination);
  }
  if(wormAudioContext.state==='suspended')wormAudioContext.resume().catch(()=>{});
  const t=wormAudioContext.currentTime;
  if(kind==='pickup'){
   const now=performance.now();if(now-lastWormPickupSound<265)return;lastWormPickupSound=now;
  }
  const [freq,duration,volume,type]=kind==='pickup'?[520,.07,.016,'sine']:
   kind==='death'?[145,.32,.035,'triangle']:kind==='resume'?[420,.095,.019,'sine']:[345,.075,.012,'sine'];
  const oscillator=wormAudioContext.createOscillator(),gain=wormAudioContext.createGain();
  oscillator.type=type;oscillator.frequency.setValueAtTime(freq,t);
  oscillator.frequency.exponentialRampToValueAtTime(Math.max(40,freq*(kind==='death'?.55:1.22)),t+duration);
  gain.gain.setValueAtTime(.0001,t);gain.gain.linearRampToValueAtTime(volume,t+.012);
  gain.gain.exponentialRampToValueAtTime(.0001,t+duration);
  oscillator.connect(gain);gain.connect(wormAudioMaster);
  oscillator.start(t);oscillator.stop(t+duration+.015);
 }catch(_){/* Sound is optional on devices without WebAudio. */}
}
function syncPauseSound(){
 const b=$('worm-pause-sound');if(!b)return;
 b.dataset.muted=String(options.muted);
 b.setAttribute('aria-pressed',String(options.muted));
 const label=T[options.muted?'soundOff':'soundOn'];
 b.querySelector('.worm-pause-sound-label').textContent=label;
 b.setAttribute('aria-label',label);b.title=label;
 const settingsButton=$('worm-settings-sound');
 if(settingsButton){settingsButton.dataset.muted=String(options.muted);settingsButton.setAttribute('aria-pressed',String(options.muted));settingsButton.textContent=label;settingsButton.setAttribute('aria-label',label);}
 if(wormAudioContext&&wormAudioMaster)
  wormAudioMaster.gain.setTargetAtTime(options.muted?0:1,wormAudioContext.currentTime,.025);
}
function syncPauseAppearance(){
 const preview=$('worm-pause-preview');if(!preview)return;
 const skin=SKINS.find(item=>item.id===options.skin)||SKINS[0];
 const colors=options.customEnabled&&options.customSegments?.length?options.customSegments:null;
 preview.style.setProperty('--pause-skin-dark',skin.dark);
 preview.style.setProperty('--pause-skin-light',colors?.[0]||skin.light);
 preview.style.setProperty('--pause-skin-accent',colors?.[1]||skin.accent);
 $('worm-pause-skin-name').textContent=colors?({ru:'СВОЙ ДИЗАЙН',es:'DISEÑO PROPIO',en:'CUSTOM SKIN'})[language]:skin[language].toUpperCase();
 $('worm-pause-player').textContent=game.player?.name||'PILOT';
}
function applySkin(w,id){
 const skin=SKINS.find(s=>s.id===id)||SKINS[0];
 w.skin=skin.id;w.pattern=skin.pattern;
 const custom=w.human&&options.customEnabled&&options.customSegments?.length;
 w.color=[custom?options.customSegments[0]:skin.light,skin.dark];
 w.accent=custom?(options.customSegments[1]||skin.accent):skin.accent;
}

const FOOD_COLORS=['#ff1744','#27ff40','#ffe500','#9922ff','#2860ff'];
const NAMES=['Astra','Orbit','Nova','Pulsar','Quasar','Mira','Voidling','Zenith','Vega',
 'Nebula','Kepler','Comet','Krypton','Lumen','Solaris','Aether','Cosmo','Rift','Ion','Rigel','Helix','Antares','Nix','Altair'];
// The lobby has a stable mixture of player archetypes rather than one global AI
// difficulty. Timing, awareness, aim, aggression, speed and AFK habits vary.
const BOT_ROSTER=['newcomer','casual','cautious','hunter','afk','veteran','pro','reckless'];
const ROLE_POOL=['newcomer','newcomer','casual','casual','casual','casual','cautious','cautious','hunter','hunter','veteran','pro','reckless','afk'];
const BOT_HEADS=['classic','blackhole','pulsar','comet','crystal','eclipse'];
const BOT_SUFFIX=['','','','','_x','77','_tv','_io','_2','_sun','_star'];
function shuffleList(list){
 for(let i=list.length-1;i>0;i--){
  const j=Math.floor(Math.random()*(i+1));
  [list[i],list[j]]=[list[j],list[i]];
 }
 return list;
}
function chooseBotRole(previous){
 let next,tries=0;
 do{next=ROLE_POOL[Math.floor(Math.random()*ROLE_POOL.length)];}
 while(next===previous&&tries++<22);
 return next===previous?BOT_ROSTER[(BOT_ROSTER.indexOf(previous)+1)%BOT_ROSTER.length]:next;
}
function botIdentity(previous=null,role=null){
 const persona=role||chooseBotRole(previous?.persona);
 const candidates=SKINS.filter(v=>v.id!==previous?.skin);
 const skin=candidates[Math.floor(Math.random()*candidates.length)];
 const heads=BOT_HEADS.filter(x=>x!==previous?.head);
 const head=heads[Math.floor(Math.random()*heads.length)];
 let name;
 for(let tries=0;tries<24;tries++){
  name=NAMES[Math.floor(Math.random()*NAMES.length)]+BOT_SUFFIX[Math.floor(Math.random()*BOT_SUFFIX.length)];
  if(name!==previous?.name)break;
 }
 return {persona,skin:skin.id,head,name};
}
function lobbyBotIdentities(count){
 const roles=[];
 for(const role of BOT_ROSTER)roles.push(role,role);
 while(roles.length<count)roles.push(ROLE_POOL[Math.floor(Math.random()*ROLE_POOL.length)]);
 shuffleList(roles);
 const used=new Set(),roleSkins=new Map();
 return roles.slice(0,count).map(role=>{
  const identity=botIdentity(null,role);
  // Within a match, AI level does not predict visual appearance: an AFK
  // pilot and a top pro can be equally bright, without fixed role colors.
  const assigned=roleSkins.get(role)||new Set();
  if(assigned.has(identity.skin)&&assigned.size<SKINS.length){
   const available=SKINS.filter(v=>!assigned.has(v.id));
   identity.skin=available[Math.floor(Math.random()*available.length)].id;
  }
  assigned.add(identity.skin);roleSkins.set(role,assigned);
  for(let tries=0;tries<24&&used.has(identity.name);tries++)
   identity.name=NAMES[Math.floor(Math.random()*NAMES.length)]+(100+Math.floor(Math.random()*900));
  used.add(identity.name);
  return identity;
 });
}
const BOT_PERSONAS={
 afk:      {reaction:[1.6,3],    sight:0,   samples:0,  look:[90],            awareness:0,   error:0,    hunt:0,   boost:0,    speed:1},
 newcomer: {reaction:[.55,.95],  sight:360, samples:4,  look:[100],           awareness:.14, error:.65,  hunt:0,   boost:.07,  speed:.83},
 casual:   {reaction:[.25,.44],  sight:680, samples:8,  look:[100,200],       awareness:.48, error:.26,  hunt:.13, boost:.24,  speed:.98},
 cautious: {reaction:[.17,.28],  sight:960, samples:15, look:[90,190,320],    awareness:1.2, error:.09,  hunt:0,   boost:.06,  speed:.91},
 hunter:   {reaction:[.13,.23],  sight:1040,samples:16, look:[85,180,300,440],awareness:.83,error:.10, hunt:.75, boost:.70,  speed:1.04},
 veteran:  {reaction:[.095,.15], sight:1150,samples:22, look:[80,160,280,440],awareness:1.25,error:.035,hunt:.55,boost:.62, speed:1.07},
 pro:      {reaction:[.06,.105], sight:1350,samples:26, look:[80,160,280,440,600],awareness:1.6,error:.012,hunt:.83,boost:.82,speed:1.11},
 reckless: {reaction:[.23,.43],  sight:720, samples:7,  look:[90,200],       awareness:.28,error:.41, hunt:.90, boost:.87, speed:1.08}
};
const DEATH_REPLAY_SECONDS=3.25;
let vw=0,vh=0,dpr=1,last=0,uiClock=0,starTime=0,foodTimer=0,toastTimer=0,guideStep=0,guideReturn='playing';
let game={state:'playing',time:0,food:[],foodGrid:new Map(),bodyGrid:new Map(),wrecks:[],nextWreckId:1,ambientCount:0,foodRespawnQueue:[],worms:[],fx:[],player:null,reported:false,deathElapsed:0,deathPosition:null,deathGhost:null};
let qaManualPhysics=false; // tester-only: stop rAF simulation while deterministic QA advances physics
let lastIdlePaint=0;
const input={mx:0,my:0,mouseMoved:false,mouseDown:false,boostKey:false,boostTouch:false,keys:new Set(),stickAngle:0,stickPower:0,stickPointer:-1,touchAngle:null};
const camera={x:WORLD.cx,y:WORLD.cy,zoom:1};
const stars=Array.from({length:680},(_,i)=>({x:Math.random(),y:Math.random(),r:i%8===0?1.6:rand(.35,1.05),a:rand(.42,1),phase:rand(0,TAU),depth:rand(.04,.17),c:['#ff1744','#27ff40','#ffe500','#ffffff','#9922ff','#2860ff'][i%6]}));
const nebula=Array.from({length:8},(_,i)=>({x:rand(.1,.94),y:rand(.1,.88),r:rand(.18,.40),c:['#9922ff','#2860ff','#ff1744','#27ff40','#ffe500','#2860ff','#9922ff','#ff1744'][i]}));
const skyComets=Array.from({length:10},(_,i)=>({x:rand(0,1),y:rand(0,1),speed:rand(13,37),len:rand(21,51),phase:i*.97,color:['#2860ff','#ff1744','#ffe500','#27ff40','#9922ff'][i%5]}));
function resize(){
 vw=window.innerWidth;vh=window.innerHeight;dpr=Math.min(2,window.devicePixelRatio||1);
 canvas.width=Math.round(vw*dpr);canvas.height=Math.round(vh*dpr);
 canvas.style.width=vw+'px';canvas.style.height=vh+'px';
}
window.addEventListener('resize',resize);resize();
function randomPos(radius=.88){
 const a=rand(0,TAU),r=Math.sqrt(Math.random())*radius;
 return {x:WORLD.cx+Math.cos(a)*r*WORLD.rx,y:WORLD.cy+Math.sin(a)*r*WORLD.ry};
}
// Radius changes mildly. Every food reward feeds an uncapped number of body segments.
function wormRadius(w){return clamp(8+Math.pow(Math.max(1,w.mass)/60,.27)*12,13,64)}
function segmentCount(w){const mass=Math.max(1,w.mass);return Math.max(19,Math.floor(12+2.5*Math.sqrt(mass)+.02*mass))}
// Spawn clearance is checked along the entire proposed body — not just the head.
// Also reserve space in front of the new head so it cannot appear on someone's path.
function spawnPosition(angle,count,nearPlayer=false){
 const cx=game.player?.x??WORLD.cx,cy=game.player?.y??WORLD.cy;
 for(let attempt=0;attempt<180;attempt++){
  let pos;
  if(nearPlayer&&attempt<95){
   const a=rand(0,TAU),r=rand(850,3100);
   pos={x:cx+Math.cos(a)*r,y:cy+Math.sin(a)*r};
  }else pos=randomPos(.87);
  let safe=true;
  const total=(count+1)*11.8;
  for(let i=0;i<=Math.ceil((total+190)/48);i++){
   // Trace the complete spawn body, from 190px ahead of its head to its tip.
   const offset=i*48-190;
   const x=pos.x-Math.cos(angle)*offset,y=pos.y-Math.sin(angle)*offset;
   const edge=((x-WORLD.cx)/WORLD.rx)**2+((y-WORLD.cy)/WORLD.ry)**2;
   if(edge>.88*.88){safe=false;break;}
   for(const other of game.worms){
    if(!other.alive)continue;
    const headD=Math.hypot(x-other.x,y-other.y);
    if(headD<450){safe=false;break;}
    if(headD>other.segments.length*12+500)continue;
    for(let j=0;j<other.segments.length;j+=2){
     const s=other.segments[j];
     if((x-s.x)**2+(y-s.y)**2<350*350){safe=false;break;}
    }
    if(!safe)break;
   }
   if(!safe)break;
  }
  if(safe)return pos;
 }
 return null; // No unsafe fallback: retry after other worms have moved.
}
function createWorm(name,human,index,preferEncounter=false,identity=null){
 const angle=human?-.28:rand(0,TAU);
 // Established opponents: several genuinely enormous rivals already exist.
 const initial=!human&&game.time<.5;
 const mass=human?61:initial&&index<=3?
   [0,14500,11200,8600][index]*rand(.91,1.09):
   initial&&index<=8?rand(3400,6700):
   initial&&index<=18?rand(1050,3300):
   rand(54,250);
 const count=segmentCount({mass});
 const pos=human?{x:WORLD.cx,y:WORLD.cy}:spawnPosition(angle,count,preferEncounter);
 if(!pos)return null;
 const w={name,human,id:index,x:pos.x,y:pos.y,angle,target:angle,
  mass,bestMass:mass,bestLength:count,alive:true,invulnerable:human?2.3:2.0,
  segments:[],boost:false,dropClock:0,think:rand(.1,.2),targetFood:null,targetWreckId:null,coil:null,coilCooldown:0,objective:'food',kills:0,
  foodEaten:0,bestRank:99,leadTime:0,deathDelay:0,
  persona:human?'human':(identity?.persona||chooseBotRole()),
  head:human?options.head:(identity?.head||BOT_HEADS[Math.floor(Math.random()*BOT_HEADS.length)]),
  wiggle:rand(0,TAU),speed:172,boostFlash:0,afkTimer:0,goalUntil:0};
 if(!human){
  const type=BOT_PERSONAS[w.persona];
  w.reaction=rand(type.reaction[0],type.reaction[1])*rand(.86,1.14);
  w.think=rand(0,w.reaction);
  // AFK rivals coast forward without steering; they never stand still.
  w.afkTimer=w.persona==='afk'?Infinity:0;
 }
 applySkin(w,human?options.skin:(identity?.skin||SKINS[Math.floor(Math.random()*SKINS.length)].id));
 for(let i=0;i<count;i++){
  w.segments.push({x:w.x-Math.cos(angle)*11.8*(i+1),
   y:w.y-Math.sin(angle)*11.8*(i+1)});
 }
 seedWormTrail(w);
 return w;
}

function seedWormTrail(w){
 const gap=11.8,points=w.segments.length+6;
 w.traveled=0;w.trailStart=0;w.relaxPhase=0;w.trail=[];
 for(let i=points;i>0;i--)w.trail.push({
  x:w.x-Math.cos(w.angle)*i*gap,
  y:w.y-Math.sin(w.angle)*i*gap,s:-i*gap
 });
 w.trail.push({x:w.x,y:w.y,s:0});
}
// Gradual relaxation changes the physical body path, not merely its paint.
// Straight sections stay straight; sharp corners slowly pull toward the chord.
function trailPointAt(history,distance,start,end){
 let low=start,high=end;
 while(low+1<high){const mid=(low+high)>>1;
  if(history[mid].s<=distance)low=mid;else high=mid;}
 const a=history[low],b=history[Math.min(end,low+1)];
 const t=clamp((distance-a.s)/Math.max(1e-8,b.s-a.s),0,1);
 return {x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t};
}
function relaxWormTrail(w,dt){
 const nodes=w.trail,start=w.trailStart+1,end=nodes.length-2,n=end-start+1;
 if(n<10||dt<=0)return;
 const count=Math.min(72,n),phase=w.relaxPhase=(w.relaxPhase||0)+1;
 // Cycle bounded samples through the entire body; long tails stay cheap.
 const offset=(phase%7)/7;
 for(let k=0;k<count;k++){
  const idx=start+Math.min(n-1,Math.floor((k+offset)*n/count));
  const node=nodes[idx],span=36;
  if(node.s-span<=nodes[w.trailStart].s||node.s+span>=nodes[nodes.length-1].s)continue;
  const before=trailPointAt(nodes,node.s-span,w.trailStart,nodes.length-1);
  const after=trailPointAt(nodes,node.s+span,w.trailStart,nodes.length-1);
  const ax=node.x-before.x,ay=node.y-before.y,bx=after.x-node.x,by=after.y-node.y;
  const first=Math.hypot(ax,ay),second=Math.hypot(bx,by);
  if(first<2||second<2)continue;
  const bend=Math.acos(clamp((ax*bx+ay*by)/(first*second),-1,1));
  const curvature=clamp((bend-.57)/.18,0,1);
  if(curvature<=0)continue;
  const mix=Math.min(.055,dt*7.0*curvature);
  node.x+=((before.x+after.x)*.5-node.x)*mix;
  node.y+=((before.y+after.y)*.5-node.y)*mix;
 }
}

function followWormTrail(w,advance,gap=11.8,dt=advance/Math.max(90,w.speed||172)){
 // The actual distance traveled controls each ring's position on the path.
 w.traveled+=advance;
 const history=w.trail;
 history.push({x:w.x,y:w.y,s:w.traveled});
 let start=w.trailStart;
 const oldestNeeded=w.traveled-gap*(w.segments.length+2);
 // Rapid pickups can extend the tail before there is enough path history.
 if(history[start].s>oldestNeeded){
  const first=history[start],next=history[start+1];
  const dx=first.x-next.x,dy=first.y-next.y,mag=Math.hypot(dx,dy)||1;
  const count=Math.ceil((first.s-oldestNeeded)/gap)+2;
  const extension=[];
  for(let n=count;n>=1;n--)extension.push({
   x:first.x+dx/mag*n*gap,y:first.y+dy/mag*n*gap,s:first.s-n*gap
  });
  history.splice(start,0,...extension);
 }
 // Relax already-traveled bends before sampling the real body points.
 relaxWormTrail(w,dt);
 // Linear sweep interpolates every segment along the curved head trajectory.
 let j=history.length-2;
 for(let i=0;i<w.segments.length;i++){
  const at=w.traveled-gap*(i+1);
  while(j>start&&history[j].s>at)j--;
  const a=history[j],b=history[j+1];
  const t=clamp((at-a.s)/Math.max(1e-8,b.s-a.s),0,1);
  w.segments[i].x=a.x+(b.x-a.x)*t;
  w.segments[i].y=a.y+(b.y-a.y)*t;
 }
 // Amortized trimming keeps trail memory proportional to worm length.
 const keepAfter=w.traveled-gap*(w.segments.length+7);
 while(start+1<history.length-2&&history[start+1].s<keepAfter)start++;
 if(start>48){history.splice(0,start);start=0;}
 w.trailStart=start;
}

function foodBucket(k){
 let bucket=game.foodGrid.get(k);
 if(!bucket){bucket=new Set();game.foodGrid.set(k,bucket);}
 return bucket;
}
function addFood(food){
 const k=gridKey(food.x,food.y,FOOD_CELL);
 food._cell=k;food._index=game.food.length;
 game.food.push(food);foodBucket(k).add(food);
 if(food.ambient)game.ambientCount++;
 return food;
}
function removeFood(food){
 const index=food._index;
 if(index===undefined||index<0||game.food[index]!==food)return;
 const bucket=game.foodGrid.get(food._cell);
 if(bucket){bucket.delete(food);if(!bucket.size)game.foodGrid.delete(food._cell);}
 if(food.ambient){
  game.ambientCount=Math.max(0,game.ambientCount-1);
  if(game.foodRespawnQueue.length<6000)
   game.foodRespawnQueue.push({x:food.x,y:food.y});
 }
 if(food.wreckId!==undefined){
  const wreck=game.wrecks.find(item=>item.id===food.wreckId);
  if(wreck)wreck.remaining=Math.max(0,wreck.remaining-1);
 }
 const last=game.food.pop();
 if(last!==food){game.food[index]=last;last._index=index;}
 food._index=-1;
}
function moveFood(food,x,y){
 const next=gridKey(x,y,FOOD_CELL);
 if(next!==food._cell){
  const old=game.foodGrid.get(food._cell);
  if(old){old.delete(food);if(!old.size)game.foodGrid.delete(food._cell);}
  foodBucket(next).add(food);food._cell=next;
 }
 food.x=x;food.y=y;
}
function foodNearby(x,y,r,callback){
 const sx=Math.floor((x-r)/FOOD_CELL),ex=Math.floor((x+r)/FOOD_CELL);
 const sy=Math.floor((y-r)/FOOD_CELL),ey=Math.floor((y+r)/FOOD_CELL);
 for(let iy=sy;iy<=ey;iy++)for(let ix=sx;ix<=ex;ix++){
  const bucket=game.foodGrid.get(ix+iy*256);
  if(bucket)for(const f of bucket)callback(f);
 }
}
function addBodyGrid(){
 const grid=game.bodyGrid;grid.clear();
 for(const w of game.worms){
  if(!w.alive)continue;
  const count=w.segments.length;
  for(let i=-1;i<count;i+=2){
   const p=i<0?w:w.segments[i],key=gridKey(p.x,p.y,BODY_CELL);
   let bucket=grid.get(key);if(!bucket){bucket=[];grid.set(key,bucket);}
   bucket.push({w,x:p.x,y:p.y,head:i<0});
  }
 }
}
function bodiesNearby(x,y,r,callback){
 const sx=Math.floor((x-r)/BODY_CELL),ex=Math.floor((x+r)/BODY_CELL);
 const sy=Math.floor((y-r)/BODY_CELL),ey=Math.floor((y+r)/BODY_CELL);
 for(let iy=sy;iy<=ey;iy++)for(let ix=sx;ix<=ex;ix++){
  const b=game.bodyGrid.get(ix+iy*256);
  if(b)for(const obj of b)callback(obj);
 }
}
function makeFood(x,y,color,value,r){
 return {x,y,color:color||FOOD_COLORS[Math.floor(Math.random()*FOOD_COLORS.length)],
 value:value??rand(1.5,3.2),r:r??rand(2.6,5.4),phase:rand(0,TAU)};
}
function spawnAmbientFood(x,y){
 const f=makeFood(x,y);f.ambient=true;addFood(f);return f;
}
function fillFood(amount){
 for(let i=0;i<amount;i++){const p=randomPos(.965);spawnAmbientFood(p.x,p.y);}
}
function regenerateAmbientFood(){
 const missing=FOOD_TARGET-game.ambientCount;
 if(missing<=0)return;
 const amount=Math.min(190,missing);
 for(let i=0;i<amount;i++){
  const old=game.foodRespawnQueue.length&&i%4!==3?
   game.foodRespawnQueue.shift():null;
  let p=old?{x:old.x+rand(-235,235),y:old.y+rand(-235,235)}:
   randomPos(.94);
  const dist=((p.x-WORLD.cx)/WORLD.rx)**2+((p.y-WORLD.cy)/WORLD.ry)**2;
  if(dist>.965*.965)p=randomPos(.93);
  spawnAmbientFood(p.x,p.y);
 }
 if(game.ambientCount>=FOOD_TARGET)game.foodRespawnQueue.length=0;
}

function notify(text){
 if(DEMO)return;
 const el=$('worm-toast');el.textContent=text;el.classList.add('show');toastTimer=1.8;
}
function init(){
 game={state:'playing',time:0,food:[],foodGrid:new Map(),bodyGrid:new Map(),wrecks:[],nextWreckId:1,ambientCount:0,foodRespawnQueue:[],worms:[],fx:[],player:null,reported:false,deathElapsed:0,deathPosition:null,deathGhost:null};
 const human=!DEMO;
 const p=createWorm(DEMO?'Astra':(window.InfinityProfile?.getName()||'PILOT'),human,0);
 game.player=p;game.worms.push(p);
 const identities=lobbyBotIdentities(BOT_COUNT);
 // Assign the established giant sizes to experienced pilots, while keeping
 // the overall roster and visual identities varied for every match.
 for(const [slot,persona] of ['pro','veteran','hunter'].entries()){
  const match=identities.findIndex((id,i)=>i>=slot&&id.persona===persona);
  if(match>=0)[identities[slot],identities[match]]=[identities[match],identities[slot]];
 }
 for(let i=1;i<=BOT_COUNT;i++){
  const identity=identities[i-1];
  const b=createWorm(identity.name,false,i,i<=32,identity);
  if(b)game.worms.push(b);
 }
 fillFood(FOOD_TARGET);
 addBodyGrid();
 camera.x=p.x;camera.y=p.y;camera.zoom=1;
 input.mouseDown=input.boostKey=input.boostTouch=false;
 input.stickPower=0;input.touchAngle=null;input.mouseMoved=false;input.keys.clear();
 document.body.classList.remove('worm-death-replay');
 $('worm-result').classList.remove('is-revealing');
 $('worm-result').hidden=true;$('worm-pause-overlay').hidden=true;
 $('worm-guide').hidden=true;$('worm-settings').hidden=true;
 if(!DEMO){
  if(!window.InfinityProfile?.getName())window.InfinityProfile?.promptName?.(true,name=>{p.name=name;});
  let visited=false;try{visited=localStorage.getItem('infinity-space-mode-guide-v2:worms')==='1'}catch(_){}
  if(!visited)showGuide('playing');
 }
 updateUI();
}
function sortedWorms(){return game.worms.filter(w=>w.alive).sort((a,b)=>b.mass-a.mass)}
function ranking(w){return 1+game.worms.reduce((n,b)=>n+(b.alive&&b!==w&&b.mass>w.mass?1:0),0)}
// Recently defeated worms broadcast their entire salvage trail. The corpse
// is everyone's priority; ordinary ambient food and combat are secondary.
function collectWreckTarget(w){
 let selected=null,selectedWreck=null,best=Infinity;
 const now=game.time;
 // Keep harvesting the same fallen body until its last resource is gone.
 const locked=game.wrecks.find(item=>item.id===w.targetWreckId&&item.remaining>0);
 const candidates=locked?[locked]:game.wrecks;
 for(const wreck of candidates){
  if(wreck.remaining<=0)continue;
  const items=wreck.items,stride=Math.max(1,Math.ceil(items.length/42));
  // Each rival surveys a different set of points along the whole corpse.
  const start=(w.id*7)%stride;
  for(let i=start;i<items.length;i+=stride){
   const f=items[i];if(f._index<0)continue;
   const distance=Math.hypot(f.x-w.x,f.y-w.y);
   const score=distance+(now-wreck.created)*2.2-Math.min(160,wreck.remaining*.18)-f.value*5;
   if(score<best){best=score;selected=f;selectedWreck=wreck;}
  }
 }
 // If the sparse beacons were consumed first, fall back to live remnants
 // anywhere along the corpse rather than abandoning food that's still there.
 if(!selected)for(const wreck of candidates){
  if(wreck.remaining<=0)continue;
  for(const f of wreck.items){
   if(f._index<0)continue;
   const score=Math.hypot(f.x-w.x,f.y-w.y)+(now-wreck.created)*2.2-
     Math.min(160,wreck.remaining*.18)-f.value*5;
   if(score<best){best=score;selected=f;selectedWreck=wreck;}
  }
 }
 if(!selected)return null;
 // Once close, sweep up actual nearby pieces, not just sampled beacons.
 foodNearby(w.x,w.y,Math.min(750,Math.max(260,BOT_PERSONAS[w.persona]?.sight||440)),f=>{
  if(f._index<0||f.wreckId===undefined)return;
  const wreck=game.wrecks.find(item=>item.id===f.wreckId);
  if(!wreck||wreck.remaining<=0||(locked&&wreck.id!==locked.id))return;
  const distance=Math.hypot(f.x-w.x,f.y-w.y);
  const score=distance+(now-wreck.created)*2.2-Math.min(160,wreck.remaining*.18)-f.value*5;
  if(score<best){best=score;selected=f;selectedWreck=wreck;}
 });
 return {food:selected,wreck:selectedWreck,score:best};
}
// Advanced opponents sometimes attempt to trap a rival inside a continuous
// body loop. They need enough length to close it: this is a physical tactic,
// not an artificial kill outside the game's normal body collisions.
const COIL_AGGRESSION={afk:0,newcomer:.015,casual:.045,cautious:.035,hunter:.36,veteran:.45,pro:.60,reckless:.22};
function encircleRadius(victim){
 return clamp(56+wormRadius(victim)*1.3+Math.min(38,victim.segments.length*.2),100,195);
}
function canEncircle(w,victim){
 if(!w.alive||!victim.alive||victim===w||w.mass<victim.mass*.78)return false;
 const radius=encircleRadius(victim);
 return w.segments.length*11.8>=TAU*radius*1.08&&
  w.segments.length>victim.segments.length*.86;
}
function findCoilVictim(w,persona){
 const range=Math.min(620,persona.sight*.74);
 let victim=null,closest=range;
 for(const other of game.worms){
  if(!canEncircle(w,other))continue;
  const distance=Math.hypot(other.x-w.x,other.y-w.y);
  if(distance<closest&&distance>75){victim=other;closest=distance;}
 }
 return victim;
}
function guideCoil(w,dt,persona){
 let coil=w.coil;
 const existing=coil&&game.worms.find(other=>other.id===coil.id&&other.alive);
 if(coil&&(!existing||!canEncircle(w,existing)||game.time>coil.until)){
  w.coil=null;w.coilCooldown=game.time+rand(2,5);coil=null;
 }
 if(!coil&&game.time>=(w.coilCooldown||0)&&COIL_AGGRESSION[w.persona]>0&&
    Math.random()<COIL_AGGRESSION[w.persona]){
  const victim=findCoilVictim(w,persona);
  if(victim){
   const radius=encircleRadius(victim);
   const direction=normAngle(victim.angle-Math.atan2(victim.y-w.y,victim.x-w.x))>=0?1:-1;
   const lead=Math.min(radius*.54,victim.speed*.33);
   coil={id:victim.id,x:victim.x+Math.cos(victim.angle)*lead,
    y:victim.y+Math.sin(victim.angle)*lead,radius,dir:direction,
    progress:0,lastBearing:null,until:game.time+13,escaped:0};
   w.coil=coil;
  }
 }
 if(!coil)return null;
 const victim=game.worms.find(other=>other.id===coil.id&&other.alive);
 if(!victim){w.coil=null;return null;}
 const dx=w.x-coil.x,dy=w.y-coil.y;
 const distance=Math.hypot(dx,dy)||1,bearing=Math.atan2(dy,dx);
 if(coil.lastBearing!==null)
  coil.progress+=Math.max(0,normAngle(bearing-coil.lastBearing)*coil.dir);
 coil.lastBearing=bearing;
 const preyDistance=Math.hypot(victim.x-coil.x,victim.y-coil.y);
 if(preyDistance>coil.radius*1.3)coil.escaped+=dt;
 else coil.escaped=Math.max(0,coil.escaped-dt*.7);
 if(coil.escaped>1.45||coil.progress>TAU*2.8){
  w.coil=null;w.coilCooldown=game.time+rand(2,4);return null;
 }
 // Follow an orbit around the prey. Radial correction tightens the loop
 // smoothly while the head still obeys the normal turning-radius limit.
 const tangent=bearing+coil.dir*Math.PI/2;
 const radialError=clamp((distance-coil.radius)/coil.radius*1.45,-.82,.82);
 let desired=tangent+coil.dir*radialError;
 if(distance>coil.radius*1.75){
  const a=bearing+coil.dir*.60;
  desired=Math.atan2(coil.y+Math.sin(a)*coil.radius-w.y,
   coil.x+Math.cos(a)*coil.radius-w.x);
 }
 return desired;
}

function steerBot(w,dt){
 const persona=BOT_PERSONAS[w.persona]||BOT_PERSONAS.casual;
 w.think-=dt;w.wiggle+=dt*.7;
 if(w.think>0)return;
 w.think=w.reaction*rand(.83,1.18);
 const sight=persona.sight;
 const salvage=collectWreckTarget(w);
 w.targetWreckId=salvage?.wreck.id??null;
 w.objective=salvage?'salvage':'food';
 if(salvage){w.coil=null;w.targetFood=salvage.food;w.boost=false;w.think=Math.min(w.think,.15);}
 let goal=salvage?.food||null,goalScore=salvage?Infinity:-Infinity;
 // A human would keep chasing a worthwhile target instead of picking a
 // completely different nearest dot every frame. Advanced bots hold a plan
 // longer; newcomers are easily distracted.
 const old=w.targetFood;
 if(!salvage&&old&&old._index>=0){
  const dx=old.x-w.x,dy=old.y-w.y,d=Math.hypot(dx,dy);
  if(d>22&&d<sight){
   goal=old;
   goalScore=(old.value*145+95)/(d+65)+(.08+.32*persona.awareness);
  }
 }
 if(!salvage)foodNearby(w.x,w.y,sight,f=>{
  if(f._index<0)return;
  const dx=f.x-w.x,dy=f.y-w.y,d=Math.hypot(dx,dy);
  if(d<18||d>sight)return;
  const dot=(dx*Math.cos(w.angle)+dy*Math.sin(w.angle))/(d||1);
  const score=(f.value*145+95)/(d+65)+(dot>0?.14:0)+(f===old?.2:0);
  if(score>goalScore){goal=f;goalScore=score;}
 });
 w.targetFood=goal;
 let desired=goal?Math.atan2(goal.y-w.y,goal.x-w.x):
  w.angle+Math.sin(w.wiggle*.7+w.id)*.32;
 let chasing=false;
 // Hunters/experts anticipate where a target will be, not where it is now.
 // Reckless players may even challenge larger opponents and lose.
 if(!salvage&&persona.hunt>0&&w.mass>64&&Math.random()<persona.hunt){
  let prey=null,range=Math.min(sight*.80,900),closest=range;
  for(const other of game.worms){
   if(!other.alive||other===w)continue;
   if(other.mass>w.mass*(w.persona==='reckless'?1.38:.94))continue;
   const d=Math.hypot(other.x-w.x,other.y-w.y);
   if(d<closest&&d>125){prey=other;closest=d;}
  }
  if(prey){
   const predictive=(w.persona==='pro'||w.persona==='veteran'||w.persona==='hunter');
   const intercept=predictive?Math.min(310,closest*(w.persona==='pro'?.54:.37)):0;
   desired=Math.atan2(prey.y+Math.sin(prey.angle)*intercept-w.y,
    prey.x+Math.cos(prey.angle)*intercept-w.x);
   chasing=true;
  }
 }
 if(!salvage){
  const coilHeading=guideCoil(w,dt,persona);
  if(coilHeading!==null){desired=coilHeading;chasing=true;w.objective='encircle';}
 }
 const edge=Math.hypot((w.x-WORLD.cx)/WORLD.rx,(w.y-WORLD.cy)/WORLD.ry);
 if(edge>.86)desired=Math.atan2(WORLD.cy-w.y,WORLD.cx-w.x);
 // Imperfect human aiming. Rookie reactions are noisy and delayed; experts
 // compute more trajectories and future rival-head positions.
 desired+=rand(-persona.error,persona.error);
 let best=-Infinity,bestAngle=desired,bestClearance=Infinity;
 for(let k=0;k<persona.samples;k++){
  const angle=k===0?desired:k===1?w.angle:(k-2)*TAU/Math.max(1,persona.samples-2);
  const cx=Math.cos(angle),cy=Math.sin(angle);
  let score=Math.cos(angle-desired)*12+Math.cos(angle-w.angle)*(.4+persona.awareness*.35);
  let clearance=Infinity;
  for(const step of persona.look){
   const x=w.x+cx*step,y=w.y+cy*step;
   const border=((x-WORLD.cx)/WORLD.rx)**2+((y-WORLD.cy)/WORLD.ry)**2;
   if(border>.95*.95)score-=(border>1?320:65)*Math.max(.4,persona.awareness);
   bodiesNearby(x,y,130,entry=>{
    if(entry.w===w||!entry.w.alive)return;
    let ox=entry.x,oy=entry.y;
    if(entry.head&&(w.persona==='pro'||w.persona==='veteran'||w.persona==='hunter')){
     const future=Math.min(.75,step/Math.max(150,w.speed));
     ox+=Math.cos(entry.w.angle)*entry.w.speed*future*.54;
     oy+=Math.sin(entry.w.angle)*entry.w.speed*future*.54;
    }
    const d=Math.hypot(x-ox,y-oy);
    const danger=wormRadius(w)+wormRadius(entry.w)+40;
    clearance=Math.min(clearance,d-danger);
    // A committed coil may fly near its prey, but never through it.
    const orbitPrey=!!(w.coil&&entry.w.id===w.coil.id&&d>=danger+8);
    if(d<danger+53)score-=(danger+53-d)*(1+(420-step)/500)*persona.awareness*(orbitPrey?.16:1);
    if(d<danger)score-=(220+(danger-d)*2.8)*persona.awareness;
   });
  }
  if(score>best){best=score;bestAngle=angle;bestClearance=clearance;}
 }
 w.target=bestAngle;
 // Players differ in boost discipline: the pro spends mass only with room
 // ahead, while the reckless sprinter often commits to unsafe speed.
 const safe=bestClearance>(w.persona==='reckless'?25:65);
 const urgent=chasing||goalScore>(w.persona==='pro'?1.6:2.2);
 const bias=w.persona==='reckless'? .65:.19;
 w.boost=!salvage&&!w.coil&&w.mass>78&&edge<.86&&safe&&urgent&&
  Math.random()<Math.min(.98,persona.boost*(chasing?1.3:1)+bias);
}

function kill(w,killer,reason){
 if(!w.alive||w.invulnerable>0)return;
 const place=ranking(w);
 w.alive=false;w.boost=false;w.deathDelay=DEMO?2.5:rand(4.5,6.5);
 if(killer&&killer!==w){killer.kills++;killer.mass+=Math.min(18,w.mass*.12);}
 // Materialize the ENTIRE corpse before any bot respawns, from head to tip.
 const wreck={id:game.nextWreckId++,created:game.time,remaining:0,items:[]};
 // Never impose a global food cap here: it previously discarded most of a
 // long worm's remains as soon as the ambient field became dense.
 const body=[{x:w.x,y:w.y},...w.segments];
 let dropped=0;
 for(let i=0;i<body.length;i++){
  const node=body[i],before=body[Math.max(i-1,0)],after=body[Math.min(i+1,body.length-1)];
  let dx=after.x-before.x,dy=after.y-before.y,d=Math.hypot(dx,dy)||1;
  const sideX=-dy/d,sideY=dx/d;
  for(let side of [-1,1]){
   const size=rand(3.4,6.3),offset=rand(3,9);
   const resource=makeFood(node.x+sideX*offset+rand(-2,2),
    node.y+sideY*offset+rand(-2,2),i%6===0?w.accent:w.color[0],
    rand(2.8,6),size);
   resource.wreckId=wreck.id;
   addFood(resource);wreck.items.push(resource);wreck.remaining++;
   dropped++;
  }
 }
 game.wrecks.unshift(wreck);
 // Keep every active corpse in the objective registry until its last piece is eaten.
 // Every rival hears the salvage signal, including those normally idling.
 for(const other of game.worms)if(!other.human&&other.alive)other.think=Math.min(other.think,.06);
 game.lastDeath={name:w.name,segments:body.length,dropped,head:{x:body[0].x,y:body[0].y},
  tip:{x:body[body.length-1].x,y:body[body.length-1].y}};
 if(w.human){
  // Keep the arena fully alive while the player watches rivals collect
  // the wreckage. The results only fade in after the replay window.
  game.state='death-replay';
  playWormSound('death');
  game.deathElapsed=0;
  game.deathStartedAt=performance.now();
  // Real-world deadline: a slow graphics renderer must not freeze the death
  // sequence for minutes. Ignore stale timers after a restart/new match.
  const replayGame=game;
  setTimeout(()=>{
   if(game===replayGame&&game.state==='death-replay')revealDeathResult();
  },DEATH_REPLAY_SECONDS*1000);
  game.deathPosition={x:w.x,y:w.y};
  game.deathGhost={
   x:w.x,y:w.y,r:wormRadius(w),color:w.color[0],accent:w.accent,
   segments:w.segments.map(p=>({x:p.x,y:p.y})),
   life:0,angle:w.angle
  };
  document.body.classList.add('worm-death-replay');
  const won=w.leadTime>=20;
  if(!game.reported){
   game.reported=true;
   // Background AI demonstrations must never unlock player achievements.
   if(!DEMO)window.InfinityProfile?.recordMatch?.('worms',{
    win:won,place:Math.max(1,w.bestRank),kills:w.kills,objects:w.foodEaten,
    mass:w.bestMass,time:game.time
   });
  }
  $('worm-result-length').textContent=Math.round(w.bestLength||w.segments.length);
  $('worm-result-place').textContent='#'+Math.min(place,w.bestRank);
  $('worm-result-kills').textContent=w.kills;
  $('worm-result-info').textContent=reason==='wall'?T.wall:reason==='head'?T.self:T.eliminated;
  $('worm-result').hidden=true;
 }
}

function backgroundFlightActive(){return game.state==='paused'||game.state==='settings'||game.state==='skins'||(game.state==='guide'&&guideReturn==='paused');}
function updateWorm(w,dt){
 if(!w.alive)return;
 w.invulnerable=Math.max(0,w.invulnerable-dt);
 if(w.human&&backgroundFlightActive())w.invulnerable=Math.max(w.invulnerable,2.5);
 if(!w.human){
  // Worms always glide forward. AFK only disables steering and boosting.
  if(w.afkTimer>0){
   if(Number.isFinite(w.afkTimer))w.afkTimer=Math.max(0,w.afkTimer-dt);
   // Death salvage interrupts even an idle opponent; its usual behaviour
   // resumes once there is no nearby or announced corpse to scavenge.
   if(game.wrecks.some(item=>item.remaining>0))steerBot(w,dt);
   else{w.objective='idle';w.targetWreckId=null;w.target=w.angle;w.boost=false;}
  }else{
   const awayRate=w.persona==='newcomer'?.012:w.persona==='casual'?.004:.0008;
   if(Math.random()<dt*awayRate){
    w.afkTimer=rand(w.persona==='newcomer'?3:1,w.persona==='newcomer'?11:4);
    w.target=w.angle;w.boost=false;
   }else steerBot(w,dt);
  }
 }else if(backgroundFlightActive()){
  // Leave the world alive behind menus, but glide safely instead of dying while navigating UI.
  const rx=(w.x-WORLD.cx)/WORLD.rx,ry=(w.y-WORLD.cy)/WORLD.ry;
  if(rx*rx+ry*ry>.72)w.target=Math.atan2(WORLD.cy-w.y,WORLD.cx-w.x);
  w.boost=false;
 }else{
  const keys=input.keys;
  let dx=(keys.has('KeyD')||keys.has('ArrowRight')?1:0)-(keys.has('KeyA')||keys.has('ArrowLeft')?1:0);
  let dy=(keys.has('KeyS')||keys.has('ArrowDown')?1:0)-(keys.has('KeyW')||keys.has('ArrowUp')?1:0);
  if(dx||dy)w.target=Math.atan2(dy,dx);
  else if(input.stickPower>.18)w.target=input.stickAngle;
  else if(input.touchAngle!==null)w.target=input.touchAngle;
  else if(input.mouseMoved){
   // Pointer steering is relative to the ACTUAL projected head, not the
   // screen center: smoothing/zoom no longer makes steering feel offset.
   const sx=vw*.5+(w.x-camera.x)*camera.zoom;
   const sy=vh*.5+(w.y-camera.y)*camera.zoom;
   dx=input.mx-sx;dy=input.my-sy;
   if(dx*dx+dy*dy>15*15)w.target=Math.atan2(dy,dx);
  }
  w.boost=(input.mouseDown||input.boostKey||input.boostTouch)&&w.mass>38;
 }
 const boosting=w.boost&&w.mass>38;
 const targetSpeed=boosting?375:172;
 const scaled=targetSpeed*Math.max(.73,1-Math.log(Math.max(1,w.mass)/60)*.05)*
  (w.human?1:BOT_PERSONAS[w.persona].speed);
 w.speed+=(scaled-w.speed)*Math.min(1,dt*12);
 // Compact but tangible turn radius. A full U-turn takes roughly .23 s;
 // even during boosting the head cannot teleport into a new heading.
 // Noticeable Slither-style turning arc: approximately 50px at cruising speed,
 // widening naturally to approximately 140px while boosting.
 const turnRate=boosting?2.65:3.35;
 w.angle+=clamp(normAngle(w.target-w.angle),-turnRate*dt,turnRate*dt);
 w.boostFlash=(w.boostFlash||0)+dt*(boosting?12:4);
 const advance=w.speed*dt;
 w.x+=Math.cos(w.angle)*advance;
 w.y+=Math.sin(w.angle)*advance;
 const gap=11.8;
 if(boosting){
  w.mass=Math.max(38,w.mass-dt*7.2);
  w.dropClock+=dt;
  if(w.dropClock>.085){w.dropClock=0;
   const tail=w.segments[w.segments.length-1]||w;
   if(game.food.length<FOOD_TARGET+8500)
    addFood(makeFood(tail.x+rand(-2,2),tail.y+rand(-2,2),w.color[0],1.2,2.9));
  }
 }else w.dropClock=0;
 const target=segmentCount(w);
 // Large pickups feed the tail progressively rather than scaling the whole worm.
 if(w.segments.length<target){
  const count=Math.min(target-w.segments.length,Math.max(1,Math.floor(dt*120)));
  for(let n=0;n<count;n++){
   const last=w.segments[w.segments.length-1]||w,prev=w.segments[w.segments.length-2]||w;
   const dx=last.x-prev.x,dy=last.y-prev.y,d=Math.hypot(dx,dy)||1;
   w.segments.push({x:last.x+dx/d*gap,y:last.y+dy/d*gap});
  }
 }else if(w.segments.length>target){
  w.segments.length=Math.max(target,w.segments.length-Math.max(1,Math.floor(dt*120)));
 }
 followWormTrail(w,advance,gap,dt);
 w.bestLength=Math.max(w.bestLength||0,w.segments.length);
 w.bestMass=Math.max(w.bestMass,w.mass);
 const border=((w.x-WORLD.cx)/WORLD.rx)**2+((w.y-WORLD.cy)/WORLD.ry)**2;
 if(border>1){w.invulnerable=0;kill(w,null,'wall');return;}
 if(w.human&&border>.91&&Math.random()<dt*.6)notify(T.danger);
}
function collectFood(dt){
 for(const w of game.worms){
  if(!w.alive)continue;
  const radius=wormRadius(w);
  foodNearby(w.x,w.y,75,f=>{
   if(f._index<0)return;
   const dx=w.x-f.x,dy=w.y-f.y,ds=dx*dx+dy*dy;
   if(ds<(radius+f.r+(w.human?5:13))**2){
    w.mass+=f.value;w.foodEaten++;if(w.human)playWormSound('pickup');
    removeFood(f);
   }else if(ds<68*68&&ds>5){
    const d=Math.sqrt(ds),speed=(68-d)*dt*(w.human?5:10);
    moveFood(f,f.x+dx/d*speed,f.y+dy/d*speed);
   }
  });
 }
}
function headOnWinner(a,b){
 return a.mass>b.mass?a:b.mass>a.mass?b:
  a.speed>b.speed?a:b.speed>a.speed?b:(a.id<b.id?a:b);
}
function collisions(){
 // Broadphase includes both huge bodies and head-to-head collisions.
 // Glancing contact with the glow or outside edge is not a fatal hit.
 for(const w of game.worms){
  if(!w.alive||w.human&&backgroundFlightActive())continue;
  const pausedPlayer=backgroundFlightActive()&&game.player?.alive;
  // Spawn immunity never turns the player into a ghost while menus are open.
  if(w.invulnerable>0&&!(pausedPlayer&&!w.human))continue;
  const wr=wormRadius(w);
  bodiesNearby(w.x,w.y,Math.max(112,wr+76),entry=>{
   const other=entry.w;
   const solidPausedPlayer=pausedPlayer&&other===game.player;
   if(!w.alive||other===w||!other.alive||other.invulnerable>0&&!solidPausedPlayer)return;
   const radius=wormRadius(other),dx=w.x-entry.x,dy=w.y-entry.y;
   // The head can enter the edge of another body a little before impact.
   const hit=entry.head?wr*.82+radius*.72:wr*.72+radius*.65;
   if(dx*dx+dy*dy>=hit*hit)return;
   if(solidPausedPlayer){
    // Opponents cannot pass through the paused player. Do not award mass.
    w.invulnerable=0;kill(w,null,'body');return;
   }
   if(w.invulnerable>0)return;
   if(entry.head){
    const winner=headOnWinner(w,other);
    kill(winner===w?other:w,winner,'head');
   }else kill(w,other,'body');
  });
 }
}
function recycleBots(dt){
 for(const w of game.worms){
  if(w.human||w.alive)continue;
  w.deathDelay-=dt;
  if(w.deathDelay>0)continue;
  const identity=botIdentity(w);
  const fresh=createWorm(identity.name,false,w.id,w.id%3===0,identity);
  if(fresh)Object.assign(w,fresh);
  else w.deathDelay=1.3; // Never force a bot into the player if no safe zone exists.
 }
}
function simulate(dt){
 game.time+=dt;
 for(const w of game.worms)updateWorm(w,dt);
 addBodyGrid();
 collectFood(dt);
 collisions();
 recycleBots(dt);
 foodTimer+=dt;
 if(foodTimer>.18){
  if(game.wrecks.length)game.wrecks=game.wrecks.filter(wreck=>wreck.remaining>0);
  foodTimer=0;
  regenerateAmbientFood();
 }
 const p=game.player;
 if(p.alive){
  const place=ranking(p);
  p.bestRank=Math.min(p.bestRank,place);
  if(place===1)p.leadTime+=dt;
  if(place===1&&p.leadTime>2&&p.leadTime-dt<=2)notify(T.lead);
 }
}

function updateUI(){
 const p=game.player;if(!p)return;
 $('worm-length').textContent=p.segments.length.toLocaleString(language);
 $('worm-place').textContent=p.alive?('#'+ranking(p)):'—';
 const sec=Math.floor(game.time);$('worm-time').textContent=String(Math.floor(sec/60)).padStart(2,'0')+':'+String(sec%60).padStart(2,'0');
 $('worm-boost').disabled=p.mass<=38||game.state!=='playing';
 $('worm-boost').classList.toggle('is-boosting',!!p.boost);
 const rank=sortedWorms().slice(0,6);
 const host=$('worm-ranking');host.replaceChildren();
 for(let i=0;i<rank.length;i++){
  const w=rank[i],el=document.createElement('div');el.className='worm-rank'+(w===p?' mine':'');
  const left=document.createElement('span'),right=document.createElement('b');
  left.textContent=(i+1)+'. '+w.name;right.textContent=Math.round(w.mass);
  el.append(left,right);host.append(el);
 }
 drawRadar();
}
function drawRadar(){
 const w=mini.width,h=mini.height;
 mc.clearRect(0,0,w,h);mc.fillStyle='#08091b';mc.fillRect(0,0,w,h);
 mc.save();mc.translate(w/2,h/2);
 const circle=Math.min(w,h)*.43;
 mc.strokeStyle='#ffe500';mc.globalAlpha=.78;mc.lineWidth=1.3;
 mc.beginPath();mc.arc(0,0,circle,0,TAU);mc.stroke();mc.globalAlpha=1;
 for(const a of game.worms){
  if(!a.alive)continue;
  const x=(a.x-WORLD.cx)/WORLD.rx*circle,y=(a.y-WORLD.cy)/WORLD.ry*circle;
  mc.fillStyle=a===game.player?'#fff1ff':a.color[0];mc.beginPath();
  mc.arc(x,y,a===game.player?3:1.5,0,TAU);mc.fill();
 }
 mc.restore();
}
function backdrop(t){
 ctx.fillStyle='#03050d';ctx.fillRect(0,0,vw,vh);
 for(const n of []){
  const x=((n.x*vw-camera.x*.013)%vw+vw)%vw,y=((n.y*vh-camera.y*.009)%vh+vh)%vh;
  const r=Math.max(vw,vh)*n.r;
  const gr=ctx.createRadialGradient(x,y,1,x,y,r);gr.addColorStop(0,n.c+'42');gr.addColorStop(1,n.c+'00');
  ctx.fillStyle=gr;ctx.fillRect(x-r,y-r,r*2,r*2);
 }
 for(const s of stars){
  const x=((s.x*vw-camera.x*s.depth*.1)%vw+vw)%vw;
  const y=((s.y*vh-camera.y*s.depth*.1)%vh+vh)%vh;
  ctx.globalAlpha=s.a*(.8+Math.sin(t*.8+s.phase)*.2);
  ctx.fillStyle=s.c;ctx.fillRect(x,y,s.r,s.r);
 }
 ctx.globalAlpha=1;
 // Sparse, hairline comet streaks reinforce the colourful deep-space field.
 for(const comet of skyComets){
  const x=((comet.x*vw+(t*comet.speed*3)-camera.x*.013)%(vw+160)+vw+160)%(vw+160)-80;
  const y=((comet.y*vh+t*comet.speed*.37-camera.y*.012)%(vh+100)+vh+100)%(vh+100)-50;
  const trail=ctx.createLinearGradient(x-comet.len,y+comet.len*.32,x,y);
  trail.addColorStop(0,comet.color+'00');trail.addColorStop(1,comet.color+'cc');
  ctx.strokeStyle=trail;ctx.lineWidth=.8;
  ctx.beginPath();ctx.moveTo(x-comet.len,y+comet.len*.32);ctx.lineTo(x,y);ctx.stroke();
  ctx.fillStyle=comet.color;ctx.fillRect(x-.7,y-.7,1.5,1.5);
 }
}
function drawFood(t){
 const margin=100,z=camera.zoom;
 const left=camera.x-vw/z/2-margin,right=camera.x+vw/z/2+margin;
 const top=camera.y-vh/z/2-margin,bottom=camera.y+vh/z/2+margin;
 const x1=Math.floor(left/FOOD_CELL),x2=Math.floor(right/FOOD_CELL);
 const y1=Math.floor(top/FOOD_CELL),y2=Math.floor(bottom/FOOD_CELL);
 // Draw ONLY visible grid cells instead of iterating 20,000 world particles.
 for(let iy=y1;iy<=y2;iy++)for(let ix=x1;ix<=x2;ix++){
  const bucket=game.foodGrid.get(ix+iy*256);
  if(!bucket)continue;
  for(const f of bucket){
   if(f.x<left||f.x>right||f.y<top||f.y>bottom)continue;
   const r=f.r*(1+Math.sin(t*3+f.phase)*.08);
   ctx.globalAlpha=.16;ctx.fillStyle=f.color;ctx.beginPath();ctx.arc(f.x,f.y,r*2.9,0,TAU);ctx.fill();
   ctx.globalAlpha=.94;ctx.beginPath();ctx.arc(f.x,f.y,r,0,TAU);ctx.fill();
   ctx.fillStyle='#ffffffd8';ctx.globalAlpha=.7;ctx.beginPath();
   ctx.arc(f.x-r*.2,f.y-r*.2,Math.max(.8,r*.32),0,TAU);ctx.fill();
  }
 }
 ctx.globalAlpha=1;
}
const SKIN_NEBULAE={
 nebula:['#9922ff','#ff1744','#2860ff'],
 aurora:['#27ff40','#ffe500','#2860ff'],
 pulsar:['#2860ff','#9922ff','#ffe500'],
 flare:['#ffe500','#ff1744','#9922ff'],
 horizon:['#9922ff','#2860ff','#ff1744'],
 supernova:['#ff1744','#ffe500','#9922ff'],
 comet:['#2860ff','#27ff40','#9922ff'],
 stardust:['#ffe500','#9922ff','#ff1744'],
 eclipse:['#a928ff','#ff1744','#ffe500'],
 meteor:['#ff1744','#ffe500','#ff1744'],
 galaxy:['#2860ff','#a928ff','#ffe500'],
 crystal:['#27ff40','#2860ff','#ffe500'],
 rift:['#ae45ff','#ff41a8','#375aff'],
 dragon:['#ff234a','#ffd34f','#9d27ff'],
 royal:['#ffe25a','#8b5cff','#ff76d1'],
 voidbloom:['#a72dff','#ff56b5','#4b21b6']
};
/* Seamless illuminated worm body: no bead/ring segments, even when a
   custom multi-color gradient is selected. All 16 cosmic skins use this. */
function wormBodyPath(w){
 const nodes=[w,...w.segments],length=nodes.length;
 const stride=Math.max(1,Math.ceil(length/440));
 const points=[nodes[0]];
 for(let i=stride;i<length-1;i+=stride)points.push(nodes[i]);
 points.push(nodes[length-1]);
 const path=new Path2D();
 path.moveTo(points[0].x,points[0].y);
 for(let i=1;i<points.length-1;i++){
  const p=points[i],q=points[i+1];
  path.quadraticCurveTo(p.x,p.y,(p.x+q.x)*.5,(p.y+q.y)*.5);
 }
 path.lineTo(points[points.length-1].x,points[points.length-1].y);
 return {path,points};
}
// Render all cosmic skins as seamless strokes along the centerline. A filled
// offset polygon self-intersects on long coiled worms and turns into jagged
// triangles. Local gradients avoid the head-to-tail zero-length gradient too.
function drawCosmicInterior(w,t,r,detail){
 const nodes=[w,...w.segments],n=nodes.length;
 if(n<4)return;
 const theme=SKIN_NEBULAE[w.skin]||SKIN_NEBULAE.nebula;
 const stride=Math.max(1,Math.ceil(n/(w.human?360:235)));
 const sampled=[];for(let i=0;i<n;i+=stride)sampled.push(nodes[i]);
 if(sampled[sampled.length-1]!==nodes[n-1])sampled.push(nodes[n-1]);
 const count=sampled.length,normal=new Array(count);
 for(let i=0;i<count;i++){
  const a=sampled[Math.max(0,i-1)],b=sampled[Math.min(count-1,i+1)];
  const dx=a.x-b.x,dy=a.y-b.y,l=Math.hypot(dx,dy)||1;
  normal[i]={x:-dy/l,y:dx/l};
 }
 ctx.save();ctx.lineCap='round';ctx.lineJoin='round';
 // Color is painted continuously *inside* the body. No polygon clipping,
 // seams, geometric slices, repeated disks or cosmetic ring sections.
 const chunk=Math.max(5,Math.min(22,Math.ceil(count/23)));
 for(let i=0;i<count-1;i+=chunk){
  const end=Math.min(count-1,i+chunk);
  const p=sampled[i],q=sampled[end],grad=ctx.createLinearGradient(
   p.x,p.y,q.x+.1,q.y+.1);
  const c0=theme[Math.floor(i/chunk)%theme.length],
   c1=theme[(Math.floor(i/chunk)+1)%theme.length];
  grad.addColorStop(0,c0);grad.addColorStop(.50,c1);grad.addColorStop(1,c1);
  const trace=new Path2D();trace.moveTo(p.x,p.y);
  for(let j=i+1;j<=end;j++)trace.lineTo(sampled[j].x,sampled[j].y);
  ctx.globalAlpha=.85;ctx.lineWidth=r*1.66;ctx.strokeStyle=grad;ctx.stroke(trace);
 }
 ctx.globalAlpha=1;
 if(detail){
  const starStep=Math.max(1,Math.floor(count/(w.human?200:110)));
  for(let i=2;i<count-2;i+=starStep){
   const p=sampled[i],q=normal[i],seed=i*13.73+w.id*27.19;
   const side=Math.sin(seed*1.71+t*(.32+(w.id%3)*.08))*.54*r;
   const x=p.x+side*q.x,y=p.y+side*q.y;
   const twinkle=.55+.45*Math.sin(t*3.1+seed);
   const size=(i%11===0?1.8:.98)+twinkle*.7;
   ctx.fillStyle=i%7===0?theme[2]:'#fff8f0';
   ctx.globalAlpha=.45+twinkle*.48;
   ctx.beginPath();ctx.arc(x,y,size,0,TAU);ctx.fill();
   if(i%13===0){
    ctx.strokeStyle='#fff3df';ctx.lineWidth=.85;
    ctx.beginPath();ctx.moveTo(x-size*3,y);ctx.lineTo(x+size*3,y);
    ctx.moveTo(x,y-size*3);ctx.lineTo(x,y+size*3);ctx.stroke();
   }
  }
  ctx.globalAlpha=1;
  const cometCount=w.human?4:2;
  for(let j=0;j<cometCount;j++){
   const span=Math.max(2,count-9);
   const progress=(t*(6+j*1.12)+(j*.28)*count+w.id*7.4)%span;
   const index=Math.max(2,Math.min(count-3,Math.floor(count-2-progress)));
   const head=sampled[index],tail=sampled[Math.min(count-1,index+7)];
   const gradient=ctx.createLinearGradient(tail.x,tail.y,head.x+.1,head.y+.1);
   gradient.addColorStop(0,'#ffffff00');
   gradient.addColorStop(.5,theme[j%3]+'99');
   gradient.addColorStop(1,'#ffffff');
   ctx.strokeStyle=gradient;ctx.lineWidth=Math.max(1,r*.11);
   ctx.lineCap='round';ctx.beginPath();ctx.moveTo(tail.x,tail.y);
   for(let k=Math.min(count-1,index+6);k>=index;k--)
    ctx.lineTo(sampled[k].x,sampled[k].y);
   ctx.stroke();
   ctx.fillStyle='#fffdf2';ctx.shadowBlur=options.glow?8:0;ctx.shadowColor=theme[j%3];
   ctx.beginPath();ctx.arc(head.x,head.y,Math.max(1.3,r*.115),0,TAU);ctx.fill();
   ctx.shadowBlur=0;
  }
 }
 ctx.restore();
}
function drawSkinHead(w,r){
 const p=w.pattern,head=w.human?options.head:(w.head||'classic');
 if(head==='blackhole'){
  ctx.save();ctx.translate(w.x,w.y);ctx.rotate(w.angle);
  const pulse=performance.now()*.0015;
  ctx.shadowColor='#a54bff';ctx.shadowBlur=options.glow?r*1.2:0;
  const halo=ctx.createRadialGradient(0,0,r*.18,0,0,r*1.72);
  halo.addColorStop(0,'#03020a');halo.addColorStop(.39,'#080513');
  halo.addColorStop(.5,'#ffca42');halo.addColorStop(.59,'#f23b7d');
  halo.addColorStop(.73,'#7d37ff88');halo.addColorStop(1,'#7d37ff00');
  ctx.fillStyle=halo;ctx.beginPath();ctx.arc(0,0,r*1.72,0,TAU);ctx.fill();
  ctx.shadowBlur=0;
  for(let i=0;i<10;i++){
   const a=pulse*2.5+i*TAU/10,rr=r*(.77+Math.sin(pulse*2+i)*.17);
   ctx.fillStyle=i%2?'#ffc75e':'#e76bff';ctx.beginPath();ctx.arc(Math.cos(a)*rr,Math.sin(a)*rr*.55,r*.048,0,TAU);ctx.fill();
  }
  ctx.fillStyle='#000005';ctx.beginPath();ctx.arc(0,0,r*.71,0,TAU);ctx.fill();
  ctx.strokeStyle='#ffe4a3';ctx.lineWidth=r*.10;ctx.beginPath();ctx.ellipse(0,0,r*1.19,r*.44,-.28,0,TAU);ctx.stroke();
  ctx.restore();return;
 }
 if(head!=='classic'){
  ctx.save();ctx.translate(w.x,w.y);ctx.rotate(w.angle);
  ctx.shadowColor=w.accent;ctx.shadowBlur=options.glow?r*.8:0;
  ctx.fillStyle=head==='eclipse'?'#05030b':head==='crystal'?'#8680ff':head==='comet'?'#fff3bb':'#fefcff';
  ctx.strokeStyle=w.accent;ctx.lineWidth=r*.13;ctx.beginPath();
  if(head==='crystal'){for(let i=0;i<6;i++){const a=i*TAU/6,px=Math.cos(a)*r*1.15,py=Math.sin(a)*r*1.15;i?ctx.lineTo(px,py):ctx.moveTo(px,py)}ctx.closePath()}
  else ctx.arc(0,0,r*1.05,0,TAU);
  ctx.fill();ctx.stroke();ctx.shadowBlur=0;
  if(head==='pulsar'||head==='eclipse'){ctx.strokeStyle=head==='pulsar'?'#ffe500':'#ff4a7a';ctx.lineWidth=r*.2;ctx.beginPath();ctx.ellipse(0,0,r*1.45,r*.48,-.35,0,TAU);ctx.stroke()}
  if(head==='comet'){ctx.fillStyle='#ff8b38';ctx.beginPath();ctx.moveTo(-r*.7,-r*.55);ctx.lineTo(-r*2.3,-r*.15);ctx.lineTo(-r*.7,r*.55);ctx.fill()}
  ctx.restore();return;
 }
ctx.save();ctx.translate(w.x,w.y);ctx.rotate(w.angle);
 ctx.fillStyle=p==='eclipse'||p==='horizon'?'#05050d':w.color[0];
 ctx.strokeStyle=w.accent;ctx.lineWidth=r*.14;
 ctx.shadowColor=w.color[0];ctx.shadowBlur=options.glow?16:0;
 ctx.beginPath();
 if(p==='meteor'||p==='crystal'){
  ctx.moveTo(r*1.35,0);ctx.lineTo(r*.33,-r*1.1);ctx.lineTo(-r*1.02,-r*.7);
  ctx.lineTo(-r*1.12,r*.61);ctx.lineTo(r*.4,r*1.08);ctx.closePath();
 }else ctx.arc(0,0,r*1.12,0,TAU);
 ctx.fill();ctx.stroke();ctx.shadowBlur=0;
 if(['horizon','eclipse','pulsar','galaxy'].includes(p)){
  ctx.strokeStyle=p==='eclipse'?'#ffe500':p==='horizon'?'#2860ff':p==='pulsar'?'#ffe500':'#a928ff';
  ctx.lineWidth=r*.13;ctx.beginPath();ctx.ellipse(-r*.18,0,r*1.3,r*.65,p==='galaxy'?-.42:.35,0,TAU);ctx.stroke();
 }
 if(['aurora','flare','supernova','comet','stardust'].includes(p)){
  for(const side of [-1,1]){
   ctx.fillStyle=p==='comet'?'#2860ff':p==='aurora'?'#27ff40':'#ffe500';
   ctx.beginPath();ctx.moveTo(-r*.2,side*r*.72);
   ctx.lineTo(p==='aurora'?-r*.5:r*.27,side*r*(p==='flare'?1.8:1.5));
   ctx.lineTo(r*.5,side*r*.65);ctx.closePath();ctx.fill();
  }
 }
 for(const side of [-1,1]){
  ctx.fillStyle=p==='eclipse'||p==='horizon'?'#ffe500':'#fff';
  ctx.beginPath();
  if(p==='meteor'||p==='crystal')ctx.ellipse(r*.48,side*r*.53,r*.23,r*.13,side*.2,0,TAU);
  else ctx.arc(r*.48,side*r*.53,r*.27,0,TAU);
  ctx.fill();
  ctx.fillStyle='#11162d';ctx.beginPath();ctx.arc(r*.59,side*r*.53,r*.115,0,TAU);ctx.fill();
 }
 ctx.restore();
}

/* Acceleration is communicated only by the worm itself: the ENTIRE
   continuous body illuminates on the first boosted frame. No detached
   particles, side jets, shock rings or screen-space speed streaks. */
function drawBoostBody(w,t,r,path,overBody=false){
 if(!w.boost||w.mass<=38)return;
 const pulse=.86+.14*Math.sin(t*11);
 ctx.save();
 ctx.globalCompositeOperation='lighter';
 ctx.strokeStyle=w.accent;
 if(!overBody){
  // Broad aura behind the skin, visible all the way to the tail.
  ctx.globalAlpha=.79*pulse;
  ctx.lineWidth=r*2.72;
  ctx.shadowColor=w.accent;
  ctx.shadowBlur=options.glow?Math.min(28,r*.82):0;
  ctx.stroke(path);
  ctx.shadowBlur=0;
  ctx.globalAlpha=.32*pulse;
  ctx.strokeStyle='#fff8f0';
  ctx.lineWidth=r*2.47;
  ctx.stroke(path);
 }else{
  // A soft full-width light wash makes every bend react together while
  // leaving the stars, comets and selected cosmic skin visible beneath it.
  ctx.globalAlpha=.22*pulse;
  ctx.lineWidth=r*1.72;
  ctx.stroke(path);
  ctx.globalAlpha=.10*pulse;
  ctx.strokeStyle='#fff';
  ctx.lineWidth=r*1.50;
  ctx.stroke(path);
 }
 ctx.restore();
}

function drawWorm(w,t){
 if(!w.alive)return;
 const z=camera.zoom;
 if(Math.abs(w.x-camera.x)>vw/z*.8+1700||Math.abs(w.y-camera.y)>vh/z*.8+1700)return;
 const r=wormRadius(w),n=w.segments.length;
 if(!n)return;
 const {path,points}=wormBodyPath(w);
 const detail=z>.56;
 const custom=!!(w.human&&options.customEnabled&&options.customSegments?.length);
 const theme=SKIN_NEBULAE[w.skin]||SKIN_NEBULAE.nebula;
 const head=points[0],tail=points[points.length-1];
 ctx.save();ctx.lineCap='round';ctx.lineJoin='round';
 ctx.globalAlpha=w.invulnerable>0?.78:1;
 const boosting=w.boost&&w.mass>38;
 if(boosting)drawBoostBody(w,t,r,path);
 // One continuous stroke replaces hundreds of separate opaque circles.
 // Rounded edges and soft shadows preserve smooth curves during tight turns.
 ctx.strokeStyle=w.color[1];
 ctx.lineWidth=r*2.12;
 ctx.shadowBlur=options.glow&&z>.39?Math.min(r*.46,22):0;
 ctx.shadowColor=w.accent;
 ctx.stroke(path);ctx.shadowBlur=0;
// Use a stable axis when a very long snake curls its head near its tail:
 // a degenerate head-to-tail gradient used to muddy all cosmic skins.
 const axisX=head.x-tail.x,axisY=head.y-tail.y;
 const folded=axisX*axisX+axisY*axisY<(r*6)**2;
 const gradient=folded?
  ctx.createLinearGradient(head.x-r*4,head.y-r*2,head.x+r*4,head.y+r*2):
  ctx.createLinearGradient(tail.x,tail.y,head.x+.1,head.y+.1);
 if(custom){
  const colors=options.customSegments;
  const stops=Math.max(2,Math.min(colors.length,16));
  for(let i=0;i<stops;i++){
   const index=Math.floor(i*(colors.length-1)/(stops-1));
   gradient.addColorStop(i/(stops-1),colors[index]||w.color[0]);
  }
 }else{
  gradient.addColorStop(0,w.color[1]);
  gradient.addColorStop(.44,theme[0]);
  gradient.addColorStop(.77,theme[1]);
  gradient.addColorStop(1,w.color[0]);
 }
 ctx.strokeStyle=gradient;ctx.lineWidth=r*1.88;ctx.stroke(path);
 if(detail){
  // All cosmic presets are animated for both bots and the player. There
  // are no decorative circles, rings, plates, or artificial segment joins.
  drawCosmicInterior(w,t,r,true);
 }else if(z>.26)drawCosmicInterior(w,t,r,false);
 if(boosting)drawBoostBody(w,t,r,path,true);
 drawSkinHead(w,r);
 if(options.names||w.human){
  ctx.globalAlpha=1;ctx.font='800 12px Inter,system-ui,sans-serif';
  ctx.textAlign='center';ctx.fillStyle='#fff';
  ctx.shadowColor='#03020b';ctx.shadowBlur=8;
  ctx.fillText(w.name,w.x,w.y-r*2.5);ctx.shadowBlur=0;
 }
 ctx.restore();
}
function paintDeathGhost(){
 const ghost=game.deathGhost;
 if(!ghost||game.state!=='death-replay')return;
 const p=clamp(game.deathElapsed/1.65,0,1),a=Math.pow(1-p,2);
 if(a<.005)return;
 const r=ghost.r;
 ctx.save();ctx.lineCap='round';ctx.lineJoin='round';ctx.globalAlpha=a*.76;
 ctx.beginPath();
 const tail=ghost.segments[ghost.segments.length-1];
 ctx.moveTo(tail.x,tail.y);
 for(let i=ghost.segments.length-2;i>=0;i--){
  const node=ghost.segments[i];ctx.lineTo(node.x,node.y);
 }
 ctx.lineTo(ghost.x,ghost.y);
 ctx.strokeStyle=ghost.color;ctx.lineWidth=r*1.8;
 ctx.shadowColor=ghost.accent;ctx.shadowBlur=26+p*23;ctx.stroke();
 ctx.globalAlpha=a*.55;ctx.strokeStyle='#fff4ff';ctx.lineWidth=r*.72;ctx.stroke();
 ctx.globalAlpha=a;ctx.strokeStyle=ghost.accent;ctx.shadowBlur=10;ctx.lineWidth=2.5;
 for(let j=0;j<2;j++){
  const expansion=(p*.75+j*.33)*r*8;
  ctx.beginPath();ctx.arc(ghost.x,ghost.y,r+expansion,0,TAU);
  ctx.globalAlpha=a*.47*(1-j*.55);ctx.stroke();
 }
 ctx.restore();
}
function paintDeathVignette(){
 if(game.state!=='death-replay')return;
 const elapsed=game.deathElapsed;
 const progress=clamp((elapsed-.2)/(DEATH_REPLAY_SECONDS-.2),0,1);
 const soft=progress*progress*(3-2*progress);
 ctx.save();
 const shade=ctx.createRadialGradient(vw*.5,vh*.5,Math.min(vw,vh)*.13,
  vw*.5,vh*.5,Math.max(vw,vh)*.72);
 shade.addColorStop(0,'rgba(4,9,21,0)');
 shade.addColorStop(1,'rgba(4,8,22,'+(soft*.48).toFixed(3)+')');
 ctx.fillStyle=shade;ctx.fillRect(0,0,vw,vh);
 ctx.restore();
}
// Shared smoothing for the live renderer and deterministic camera tests.
function updateCamera(){
 const p=game.player;if(!p)return;
 const replay=game.state==='death-replay'||game.state==='finished';
 const targetZoom=clamp(((vw<700?.87:1.04)-Math.log(Math.max(1,p.mass)/60)*.115)*
  options.viewZoom*(replay?.89:1),.35,1.45);
 camera.zoom+=(targetZoom-camera.zoom)*.045;
 const focus=replay&&game.deathPosition?game.deathPosition:p;
 camera.x+=(focus.x-camera.x)*.09;camera.y+=(focus.y-camera.y)*.09;
}
function paint(t){
 ctx.setTransform(dpr,0,0,dpr,0,0);
 backdrop(t);
 const p=game.player;if(!p)return;
 updateCamera();
 ctx.save();ctx.translate(vw*.5,vh*.5);ctx.scale(camera.zoom,camera.zoom);ctx.translate(-camera.x,-camera.y);
 ctx.strokeStyle='#8555d492';ctx.lineWidth=6;ctx.shadowColor='#8a4eea';ctx.shadowBlur=19;
 ctx.beginPath();ctx.arc(WORLD.cx,WORLD.cy,WORLD.rx,0,TAU);ctx.stroke();
 ctx.shadowBlur=0;
 drawFood(t);
 paintDeathGhost();
 const sorted=game.worms.filter(w=>w.alive).sort((a,b)=>a===p?1:b===p?-1:a.mass-b.mass);
 for(const w of sorted)drawWorm(w,t);
 ctx.globalAlpha=1;ctx.restore();
 // Soft screen-space vignette leaves HUD labels legible over bright worms.
 const vignette=ctx.createRadialGradient(vw/2,vh/2,Math.min(vw,vh)*.3,
  vw/2,vh/2,Math.max(vw,vh)*.81);
 vignette.addColorStop(0,'#07041100');vignette.addColorStop(1,'#03020ab0');
 ctx.fillStyle=vignette;ctx.fillRect(0,0,vw,vh);
 paintDeathVignette();
}
function showSkinWorkshop(){
 if(DEMO||game.state!=='paused'||!window.WormSkinStudio)return;
 game.state='skins';$('worm-pause-overlay').hidden=true;
 window.WormSkinStudio.open({
  onChange:()=>{Object.assign(options,loadSettings());applySkin(game.player,options.skin)},
  onClose:()=>{
   Object.assign(options,loadSettings());applySkin(game.player,options.skin);
   if(game.state==='skins'){game.state='paused';$('worm-pause-overlay').hidden=false;syncPauseAppearance();syncPauseSound()}
  }
 });
}
function showSettings(){
 if(DEMO||game.state!=='paused')return;
 game.state='settings';
 $('worm-pause-overlay').hidden=true;
 $('worm-settings').hidden=false;
 $('worm-setting-glow').checked=options.glow;
 $('worm-setting-names').checked=options.names;
 activateSettingsTab('control');
 syncPauseSound();
}
function activateSettingsTab(name){
 for(const tab of document.querySelectorAll('#worm-settings [data-settings-tab]')){
  const active=tab.dataset.settingsTab===name;
  tab.classList.toggle('active',active);tab.setAttribute('aria-selected',String(active));
 }
 for(const pane of document.querySelectorAll('#worm-settings [data-settings-pane]')){
  pane.classList.toggle('active',pane.dataset.settingsPane===name);
 }
}
function closeSettings(){
 if(game.state!=='settings')return;
 game.state='paused';
 $('worm-settings').hidden=true;
 $('worm-pause-overlay').hidden=false;
 syncPauseAppearance();syncPauseSound();
}

function revealDeathResult(){
 if(game.state!=='death-replay')return;
 game.state='finished';
 const overlay=$('worm-result');
 overlay.hidden=false;
 overlay.classList.add('is-revealing');
 window.SpacePlatform?.playing?.(false);
 if(!DEMO)updateUI();
}

function pause(){
 if(DEMO)return;
 if(game.state==='settings'){closeSettings();return;}
 if(game.state==='skins'){window.WormSkinStudio?.close();return;}
 if(game.state==='playing'){
  game.state='paused';$('worm-pause-overlay').hidden=false;
  syncPauseAppearance();syncPauseSound();playWormSound('ui');
  $('worm-pause-length').textContent=$('worm-length').textContent;
  $('worm-pause-rank').textContent=$('worm-place').textContent;
  $('worm-pause-time').textContent=$('worm-time').textContent;
  window.SpacePlatform?.playing?.(false);
 }else if(game.state==='paused'){
  game.state='playing';$('worm-pause-overlay').hidden=true;playWormSound('resume');
  window.SpacePlatform?.playing?.(true);
 }
}
function showGuide(returnTo='playing'){
 if(DEMO)return;
 guideReturn=returnTo;guideStep=0;game.state='guide';
 $('worm-pause-overlay').hidden=true;
 $('worm-guide').hidden=false;
 paintGuide();
 window.SpacePlatform?.playing?.(false);
}
function paintGuide(){
 const step=T.guide[guideStep];
 $('worm-guide-step-title').textContent=step[0];
 $('worm-guide-step-copy').textContent=step[1];
 $('worm-guide-counter').textContent=String(guideStep+1).padStart(2,'0')+' / 03';
 $('worm-guide-next').textContent=guideStep===2?T.start:T.next;
 [...$('worm-guide-dots').children].forEach((e,i)=>e.classList.toggle('current',i===guideStep));
}
function closeGuide(){
 try{localStorage.setItem('infinity-space-mode-guide-v2:worms','1')}catch(_){}
 $('worm-guide').hidden=true;game.state=guideReturn;
 if(guideReturn==='paused')$('worm-pause-overlay').hidden=false;
 else window.SpacePlatform?.playing?.(true);
}
function exit(){
 let previous=null;try{previous=sessionStorage.getItem('infinity-space-embedded-return')}catch(_){}
 if(location.protocol==='blob:'){
  if(previous){try{const url=new URL(previous);url.searchParams.set('select','worms');location.assign(url.href);return;}catch(_){}}
  history.back();return;
 }
 location.assign('index.html?select=worms');
}
$('worm-pause').onclick=pause;$('worm-resume').onclick=pause;
function toggleWormAudio(){options.muted=!options.muted;saveOptions();syncPauseSound();if(!options.muted)playWormSound('resume');}
$('worm-pause-sound').onclick=toggleWormAudio;
$('worm-settings-sound').onclick=toggleWormAudio;
syncPauseSound();
$('worm-settings-open').onclick=showSettings;
$('worm-skins-open').onclick=showSkinWorkshop;
$('worm-settings-back').onclick=closeSettings;
$('worm-settings-close').onclick=closeSettings;
document.querySelectorAll('#worm-settings [data-settings-tab]').forEach(tab=>{
 tab.onclick=()=>activateSettingsTab(tab.dataset.settingsTab);
});
$('worm-settings-guide').onclick=()=>{closeSettings();showGuide('paused');};
$('worm-settings-skins').onclick=()=>{closeSettings();showSkinWorkshop();};
$('worm-setting-glow').onchange=e=>{options.glow=e.target.checked;saveOptions();};
$('worm-setting-names').onchange=e=>{options.names=e.target.checked;saveOptions();};
// Camera distance is adjusted during flight, not with a settings slider.
$('worm-open-guide').onclick=()=>showGuide('paused');$('worm-exit').onclick=exit;
$('worm-guide-skip').onclick=closeGuide;
$('worm-guide-next').onclick=()=>{if(guideStep<2){guideStep++;paintGuide();}else closeGuide();};
$('worm-restart').onclick=()=>{init();window.SpacePlatform?.playing?.(game.state==='playing');};
$('worm-result-menu').onclick=exit;
const boost=$('worm-boost');
boost.addEventListener('pointerdown',e=>{if(game.state!=='playing')return;e.preventDefault();boost.setPointerCapture(e.pointerId);input.boostTouch=true;});
for(const evt of ['pointerup','pointercancel','lostpointercapture'])boost.addEventListener(evt,()=>{input.boostTouch=false;});
const stick=$('worm-stick'),thumb=$('worm-thumb');
function updateStick(e){
 const rect=stick.getBoundingClientRect(),cx=rect.left+rect.width/2,cy=rect.top+rect.height/2;
 const dx=e.clientX-cx,dy=e.clientY-cy,d=Math.hypot(dx,dy),max=rect.width*.33;
 const amt=Math.min(max,d);thumb.style.transform='translate('+((dx/(d||1))*amt)+'px,'+((dy/(d||1))*amt)+'px)';
 input.stickPower=clamp(d/(max||1),0,1);if(d>4)input.stickAngle=Math.atan2(dy,dx);
}
stick.addEventListener('pointerdown',e=>{e.preventDefault();input.stickPointer=e.pointerId;stick.setPointerCapture(e.pointerId);updateStick(e);});
stick.addEventListener('pointermove',e=>{if(input.stickPointer===e.pointerId)updateStick(e);});
const stopStick=e=>{if(e.pointerId!==input.stickPointer)return;input.stickPointer=-1;input.stickPower=0;thumb.style.transform='translate(0,0)';};
stick.addEventListener('pointerup',stopStick);stick.addEventListener('pointercancel',stopStick);stick.addEventListener('lostpointercapture',stopStick);
// Small camera adjustment only: ±16%, with smooth camera easing.
function changeViewZoom(ratio){
 if(!Number.isFinite(ratio)||ratio<=0)return;
 const next=clamp(options.viewZoom*ratio,.84,1.16);
 if(Math.abs(next-options.viewZoom)<.0001)return;
 options.viewZoom=next;saveOptions();
}
canvas.addEventListener('wheel',e=>{
 if(game.state!=='playing'||e.ctrlKey)return;
 e.preventDefault();
 const pixels=e.deltaY*(e.deltaMode===1?16:e.deltaMode===2?vh:1);
 changeViewZoom(Math.exp(-clamp(pixels,-240,240)*.00027));
},{passive:false});
const canvasTouches=new Map();let pinchDistance=0;
function touchDistance(){
 const a=[...canvasTouches.values()];
 return a.length<2?0:Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y);
}
canvas.addEventListener('pointermove',e=>{
 if(e.pointerType==='touch'){
  if(!canvasTouches.has(e.pointerId))return;
  canvasTouches.set(e.pointerId,{x:e.clientX,y:e.clientY});
  if(canvasTouches.size>=2){
   const next=touchDistance();
   if(pinchDistance>0&&next>0)changeViewZoom(next/pinchDistance);
   pinchDistance=next;input.touchAngle=null;
  }else input.touchAngle=Math.atan2(e.clientY-vh/2,e.clientX-vw/2);
 }else{input.mx=e.clientX;input.my=e.clientY;input.mouseMoved=true;}
});
canvas.addEventListener('pointerdown',e=>{
 if(game.state!=='playing')return;
 if(e.pointerType==='mouse'&&e.button===0)input.mouseDown=true;
 if(e.pointerType==='touch'){
  canvasTouches.set(e.pointerId,{x:e.clientX,y:e.clientY});
  if(canvasTouches.size>=2){input.touchAngle=null;pinchDistance=touchDistance();}
  else input.touchAngle=Math.atan2(e.clientY-vh/2,e.clientX-vw/2);
 }
});
function endCanvasTouch(pointerId){
 canvasTouches.delete(pointerId);pinchDistance=canvasTouches.size>=2?touchDistance():0;
 const remaining=canvasTouches.values().next().value;
 input.touchAngle=canvasTouches.size===1&&remaining?
  Math.atan2(remaining.y-vh/2,remaining.x-vw/2):null;
}
window.addEventListener('pointerup',e=>{
 if(e.pointerType==='mouse')input.mouseDown=false;
 if(e.pointerType==='touch')endCanvasTouch(e.pointerId);
});
window.addEventListener('pointercancel',e=>{
 input.mouseDown=false;
 if(e.pointerType==='touch')endCanvasTouch(e.pointerId);
});

window.addEventListener('contextmenu',e=>e.preventDefault());
window.addEventListener('keydown',e=>{
 if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','KeyW','KeyA','KeyS','KeyD','ShiftLeft','ShiftRight'].includes(e.code))e.preventDefault();
 if(e.code==='Escape'||e.code==='KeyP'){
  if(game.state==='guide')closeGuide();else if(game.state==='skins')window.WormSkinStudio?.close();else if(game.state==='settings')closeSettings();else pause();return;
 }
 if(e.code==='Space'||e.code==='ShiftLeft'||e.code==='ShiftRight')input.boostKey=true;
 input.keys.add(e.code);
});
window.addEventListener('keyup',e=>{
 if(['Space','ShiftLeft','ShiftRight'].includes(e.code))input.boostKey=false;
 input.keys.delete(e.code);
});
window.addEventListener('blur',()=>{input.mouseDown=false;input.boostKey=false;input.boostTouch=false;input.keys.clear();if(game.state==='playing'&&!DEMO)pause();});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&game.state==='playing'&&!DEMO)pause();});
function frame(now){
 requestAnimationFrame(frame);
 if(document.hidden){last=now;return;}
 const background=backgroundFlightActive();
 if(background&&now-lastIdlePaint<34)return;
 if(qaManualPhysics&&now-lastIdlePaint<120)return;
 if(background||qaManualPhysics)lastIdlePaint=now;
 let dt=last?clamp((now-last)/1000,0,.047):.016;last=now;
 starTime=now*.001;
 if(game.state==='playing'||game.state==='death-replay'||background){
  if(!qaManualPhysics)simulate(dt);
  if(DEMO&&(!game.player.alive||game.time>80))init();
  if(game.state==='death-replay'){
   // Render cadence can be much slower than wall time (software WebGL,
   // high-DPI screens). Keep cinematic progress tied to a monotonic clock.
   game.deathElapsed=Math.max(game.deathElapsed+dt,
    Math.max(0,(now-game.deathStartedAt)/1000));
   if(game.deathElapsed>=DEATH_REPLAY_SECONDS)revealDeathResult();
  }
  uiClock+=dt;
  if(uiClock>.15){uiClock=0;if(!DEMO){updateUI();if(background){$('worm-pause-length').textContent=$('worm-length').textContent;$('worm-pause-rank').textContent=$('worm-place').textContent;$('worm-pause-time').textContent=$('worm-time').textContent;}}}
 }
 if(toastTimer>0){toastTimer-=dt;if(toastTimer<=0)$('worm-toast').classList.remove('show');}
 // Menus show the active universe at a moderate frame rate; initial guide/results stay static.
 if(!background&&['guide','finished'].includes(game.state)){
  if(now-lastIdlePaint<120)return;
  lastIdlePaint=now;
 }
 paint(starTime);
}
init();requestAnimationFrame(frame);
if(QUERY.has('tester')||HASH_QUERY.has('tester')||DEMO){
 window.InfinityWormsQA={
  snapshot:()=>({state:game.state,mode:'worms',demo:DEMO,time:game.time,mass:game.player.mass,
    bestMass:game.player.bestMass,length:game.player.segments.length,radius:wormRadius(game.player),head:options.head,angle:game.player.angle,
    targetAngle:game.player.target,x:game.player.x,y:game.player.y,zoom:camera.zoom,
    rank:ranking(game.player),worms:game.worms.length,
    alive:game.worms.filter(w=>w.alive).length,food:game.food.length,
    world:{w:WORLD.w,h:WORLD.h,rx:WORLD.rx,ry:WORLD.ry},
    targetFood:FOOD_TARGET,botCount:BOT_COUNT,gridCells:game.foodGrid.size,
    skin:options.skin,customEnabled:options.customEnabled,customColors:options.customSegments?.length||0,glow:options.glow,names:options.names,zoomSetting:Math.round(options.viewZoom*100),
    lastDeath:game.lastDeath||null,guideOpen:!$('worm-guide').hidden,
    settingsOpen:!$('worm-settings').hidden,boosting:game.player.boost,
    deathElapsed:game.deathElapsed,deathDelay:DEATH_REPLAY_SECONDS,
    deathFocus:game.deathPosition,
    resultVisible:!$('worm-result').hidden,
    resultAnimating:$('worm-result').classList.contains('is-revealing')}),
  bots:()=>game.worms.filter(w=>!w.human).map(w=>({
    id:w.id,name:w.name,persona:w.persona,skin:w.skin,head:w.head,x:w.x,y:w.y,alive:w.alive,
    speed:w.speed,reaction:w.reaction,afk:w.afkTimer>0,mass:w.mass,objective:w.objective,
    targetWreckId:w.targetWreckId,coilTargetId:w.coil?.id??null
  })),
  wrecks:()=>game.wrecks.map(w=>({id:w.id,remaining:w.remaining,total:w.items.length,
    age:game.time-w.created})),
  salvageProbe:()=>{
   const active=game.wrecks.find(w=>w.remaining>0&&game.time<w.expires);
   if(!active)return {available:false,total:0,prioritizing:0};
   const bots=game.worms.filter(w=>!w.human&&w.alive);
   for(const b of bots){b.think=0;steerBot(b,1/60);}
   return {available:true,id:active.id,total:bots.length,
    prioritizing:bots.filter(b=>b.objective==='salvage'&&b.targetWreckId!==null).length,
    types:[...new Set(bots.map(b=>b.persona))]};
  },
  encircleProbe:()=>{
   const victim={id:-999,alive:true,mass:80,segments:Array.from({length:35},()=>({x:0,y:0})),
    x:1000,y:1000,angle:0,speed:0};
   const attacker={id:-998,alive:true,mass:900,segments:Array.from({length:150},()=>({x:0,y:0})),
    x:1180,y:1000,angle:Math.PI/2,speed:172,persona:'pro',coilCooldown:game.time+100};
   const radius=encircleRadius(victim),canClose=canEncircle(attacker,victim);
   attacker.coil={id:victim.id,x:victim.x,y:victim.y,radius,dir:1,
    progress:0,lastBearing:null,until:game.time+13,escaped:0};
   game.worms.push(victim);
   try{
    for(let tick=0;tick<330;tick++){
     const heading=guideCoil(attacker,1/60,BOT_PERSONAS.pro);
     if(heading===null)break;
     attacker.angle+=clamp(normAngle(heading-attacker.angle),-3.35/60,3.35/60);
     attacker.x+=Math.cos(attacker.angle)*attacker.speed/60;
     attacker.y+=Math.sin(attacker.angle)*attacker.speed/60;
    }
    return {canClose,radius,availableLength:attacker.segments.length*11.8,
     requiredLength:TAU*radius*1.08,loop:attacker.coil?.progress||0,
     radiusError:Math.abs(Math.hypot(attacker.x-victim.x,attacker.y-victim.y)-radius)};
   }finally{game.worms.pop();}
  },
  relaxationProbe:()=>{
   const simulateCurve=smoothing=>{
    const w={x:500,y:500,angle:0,
     segments:Array.from({length:110},(_,i)=>({x:500-11.8*(i+1),y:500}))};
    seedWormTrail(w);
    for(let i=0;i<180;i++){
     const dt=1/60,heading=i<30?0:Math.min(Math.PI*.75,(i-30)*dt*3.35),advance=172*dt;
     w.x+=Math.cos(heading)*advance;w.y+=Math.sin(heading)*advance;
     followWormTrail(w,advance,11.8,smoothing?dt:0);
    }
    return w;
   };
   const relaxed=simulateCurve(true),rigid=simulateCurve(false);
   return {maxShift:Math.max(...relaxed.segments.map((p,i)=>
     Math.hypot(p.x-rigid.segments[i].x,p.y-rigid.segments[i].y))),
    samples:relaxed.trail.length,segmentCount:relaxed.segments.length};
  },
  botReshuffleProbe:()=>{
   const b=game.worms.find(w=>!w.human&&w.alive);
   if(!b)return null;
   const after=botIdentity(b);
   return {before:{persona:b.persona,skin:b.skin,head:b.head,name:b.name},
     after,independent:after.persona!==b.persona&&after.skin!==b.skin&&after.head!==b.head&&after.name!==b.name};
  },
  botStyles:()=>Object.fromEntries(
    Object.keys(BOT_PERSONAS).map(id=>[id,
      game.worms.filter(w=>!w.human&&w.persona===id).length])),
  setMass:value=>{game.player.mass=Math.max(35,Number(value)||60);
    game.player.bestMass=Math.max(game.player.bestMass,game.player.mass);updateUI();},
  giveFood:value=>{game.player.mass+=Math.max(1,Number(value)||10);
    game.player.foodEaten++;updateUI();},
  setHeading:angle=>{input.mouseMoved=false;input.keys.clear();input.touchAngle=null;
    input.stickPower=0;game.player.target=Number(angle);},
  // Fixed-step simulation for deterministic movement assertions in slow CI.
  // This verifies actual bot/player physics independently of paint FPS.
  freezeRealtime:enabled=>{qaManualPhysics=!!enabled;return qaManualPhysics;},
  advancePhysics:seconds=>{
   const ticks=Math.max(0,Math.min(240,Math.round(Number(seconds)*60)));
   if(game.state!=='playing')return {ticks:0,time:game.time};
   for(let i=0;i<ticks&&game.state==='playing';i++)simulate(1/60);
   return {ticks,time:game.time};
  },
  // Stable UI smoke tests must not randomly die while inspecting controls.
  testProtection:seconds=>{game.player.invulnerable=clamp(Number(seconds)||30,0,120);},
  forceDeath:()=>{game.player.invulnerable=0;kill(game.player,null,'body');},
  forceBotDeath:()=>{
   const b=game.worms.find(w=>!w.human&&w.alive);
   if(!b)return null;
   b.invulnerable=0;const before=game.food.length;
   kill(b,null,'body');
   return {name:b.name,segments:b.segments.length,dropped:game.food.length-before,
    lastDeath:game.lastDeath};
  },
  spawnProbe:()=>{
   const w=createWorm('SPAWN_QA',false,777,true);
   if(!w)return {safe:false,reason:'no safe candidate'};
   let minimum=Infinity;
   for(const other of game.worms){
    if(!other.alive)continue;
    const otherNodes=[other,...other.segments];
    for(const n of [w,...w.segments]){
     for(const m of otherNodes){
      const d=Math.hypot(n.x-m.x,n.y-m.y);minimum=Math.min(minimum,d);
     }
    }
   }
   return {safe:minimum>=250,minimum,segments:w.segments.length};
  },
  desiredLength:()=>segmentCount(game.player),
  // Use the SAME smoothing path as paint(), without depending on rAF/CI GPU.
  advanceCamera:steps=>{
   const count=Math.max(0,Math.min(150,Math.floor(Number(steps)||0)));
   for(let i=0;i<count;i++)updateCamera();
   return camera.zoom;
  },
  orbitTrailProbe:()=>{
   const cx=1200,cy=1400,r=62,gap=11.8,count=28;
   const test={x:cx+r,y:cy,angle:Math.PI/2,
    segments:Array.from({length:count},(_,i)=>({x:cx+r,y:cy-(i+1)*gap}))};
   seedWormTrail(test);
   const origin={...test.segments[count-1]};
   let previous={x:test.x,y:test.y};
   for(let i=1;i<=520;i++){
    const angle=i*.036;
    test.x=cx+r*Math.cos(angle);test.y=cy+r*Math.sin(angle);
    const moved=Math.hypot(test.x-previous.x,test.y-previous.y);
    followWormTrail(test,moved,gap);
    previous={x:test.x,y:test.y};
   }
   const tail=test.segments[count-1];
   return {tailMoved:Math.hypot(tail.x-origin.x,tail.y-origin.y),
    tailRadius:Math.hypot(tail.x-cx,tail.y-cy),radius:r,
    segmentCount:test.segments.length,history:test.trail.length};
  },
  headOnWinner:({massA,massB,speedA=172,speedB=172})=>{
   const a={id:1,mass:massA,speed:speedA},b={id:2,mass:massB,speed:speedB};
   return headOnWinner(a,b)===a?'a':'b';
  },
  skins:()=>SKINS.map(x=>({id:x.id,ru:x.ru,en:x.en,pattern:x.pattern})),
  pause:()=>pause()
 };
}
document.addEventListener('DOMContentLoaded',()=>{
 Promise.resolve(window.SpacePlatform?.startup).catch(()=>{}).then(()=>{
  if(!DEMO){window.SpacePlatform?.loaded?.();window.SpacePlatform?.playing?.(game.state==='playing');}
 });
});
})();
