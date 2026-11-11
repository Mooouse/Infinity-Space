/* Infinity Space — Cosmic Worms: original single-player .io serpent arena.
   Slither-style growth/boost/body-collision mechanics; all rivals are local AI.
   No external game logic, assets, account or network requests. */
(()=>{'use strict';
const QUERY=new URLSearchParams(location.search);
const DEMO=QUERY.has('demo');
if(DEMO)document.documentElement.classList.add('worm-demo');
const storedLang=(()=>{try{return localStorage.getItem('infiniti-space-language')||''}catch(_){return ''}})();
const language=/^(ru|en|es)$/.test(storedLang)?storedLang:(/^ru/i.test(navigator.language)?'ru':/^es/i.test(navigator.language)?'es':'en');
document.documentElement.lang=language;
const WORDS={
 en:{length:'LENGTH',rank:'RANK',time:'TIME',leaders:'LEADERBOARD',radar:'GALAXY RADAR',pause:'PAUSE',
 boost:'BOOST',paused:'PAUSED',pauseDesc:'Resume the flight, review the controls or return to mode selection.',
 resume:'CONTINUE',help:'HOW TO PLAY',menu:'CHANGE MODE',guideTitle:'COSMIC WORMS',skip:'SKIP',next:'NEXT',start:'START',
 runOver:'FLIGHT COMPLETE',destroyed:'WORM DESTROYED',kills:'ELIMINATIONS',again:'PLAY AGAIN',
 hint:'MOUSE / WASD — TURN  ·  SPACE / CLICK — BOOST',bot:'AI RIVALS · OFFLINE',danger:'THE EDGE OF SPACE!',
 eliminated:'A rival cut off your route.',wall:'You reached the outer boundary.',self:'A head-on collision.',
 lead:'YOU ARE #1',mass:'ORBS COLLECTED',guide:[
 ['GROW A COSMIC TAIL','Move toward glowing stardust. Each orb adds mass and segments to your cosmic serpent.','✦'],
 ['OUTMANEUVER RIVALS','Your head must not touch another worm’s body. Cut opponents off with your own tail; defeated worms drop valuable matter.','◌'],
 ['BOOST WHEN NEEDED','Hold Space or the mouse button to accelerate. Boosting slowly burns mass and drops energy behind you. On phones, steer with the joystick and hold BOOST.','➤']
 ]},
 ru:{length:'ДЛИНА',rank:'МЕСТО',time:'ВРЕМЯ',leaders:'ТАБЛИЦА ЛИДЕРОВ',radar:'РАДАР ГАЛАКТИКИ',pause:'ПАУЗА',
 boost:'РЫВОК',paused:'ПАУЗА',pauseDesc:'Продолжи полёт, посмотри обучение или вернись к выбору режима.',
 resume:'ПРОДОЛЖИТЬ',help:'КАК ИГРАТЬ',menu:'СМЕНИТЬ РЕЖИМ',guideTitle:'КОСМИЧЕСКИЕ ЧЕРВИ',skip:'ПРОПУСТИТЬ',next:'ДАЛЕЕ',start:'ИГРАТЬ',
 runOver:'ПОЛЁТ ЗАВЕРШЁН',destroyed:'ЧЕРВЬ ПОГИБ',kills:'ПОГЛОЩЕНО',again:'СЫГРАТЬ СНОВА',
 hint:'МЫШЬ / WASD — ПОВОРОТ  ·  ПРОБЕЛ / КЛИК — РЫВОК',bot:'СОПЕРНИКИ ИИ · ОФЛАЙН',danger:'КРАЙ КОСМОСА!',
 eliminated:'Соперник перекрыл тебе путь.',wall:'Ты достиг границы арены.',self:'Столкновение головами.',
 lead:'ТЫ НА ПЕРВОМ МЕСТЕ',mass:'СОБРАНО ЧАСТИЦ',guide:[
 ['РАСТИ И УДЛИНЯЙСЯ','Собирай светящиеся звёздные частицы. От них космический червь растёт и становится длиннее.','✦'],
 ['ПЕРЕХИТРИ СОПЕРНИКОВ','Не касайся головой тела другого червя. Перекрывай противникам путь собственным хвостом. После их гибели остаётся ценная материя.','◌'],
 ['ИСПОЛЬЗУЙ РЫВОК','Удерживай Пробел или левую кнопку мыши для ускорения. Рывок расходует массу. На телефоне управляй стиком и удерживай кнопку «Рывок».','➤']
 ]},
 es:{length:'LONGITUD',rank:'PUESTO',time:'TIEMPO',leaders:'CLASIFICACIÓN',radar:'RADAR GALÁCTICO',pause:'PAUSA',
 boost:'IMPULSO',paused:'PAUSA',pauseDesc:'Continúa, revisa los controles o elige otro modo.',
 resume:'CONTINUAR',help:'CÓMO JUGAR',menu:'CAMBIAR MODO',guideTitle:'GUSANOS CÓSMICOS',skip:'SALTAR',next:'SIGUIENTE',start:'JUGAR',
 runOver:'VUELO TERMINADO',destroyed:'GUSANO DESTRUIDO',kills:'ELIMINACIONES',again:'JUGAR DE NUEVO',
 hint:'RATÓN / WASD — GIRAR · ESPACIO / CLIC — IMPULSO',bot:'RIVALES IA · SIN CONEXIÓN',danger:'¡LÍMITE ESPACIAL!',
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
const WORLD={w:5600,h:4300,cx:2800,cy:2150,rx:2630,ry:1970};
const PALETTE=[
 ['#bc9bff','#5b2acc'],['#8bebed','#15799f'],['#ffb7db','#b83d8a'],
 ['#ffe0a6','#ae6b26'],['#a5f9c2','#2d9c78'],['#afb8ff','#4b58ac'],
 ['#e8a6ff','#8040b1'],['#ff9baf','#b14259']
];
const FOOD_COLORS=['#ad96ff','#8bdefa','#f5bb87','#ffc0de','#a1edca'];
const NAMES=['Astra','Orbit','Nova','Pulsar','Quasar','Mira','Voidling','Zenith','Vega',
 'Nebula','Kepler','Comet','Krypton','Lumen','Solaris','Aether','Cosmo','Rift','Ion','Rigel','Helix','Antares','Nix','Altair'];
let vw=0,vh=0,dpr=1,last=0,uiClock=0,starTime=0,foodTimer=0,toastTimer=0,guideStep=0,guideReturn='playing';
let game={state:'playing',time:0,food:[],worms:[],fx:[],player:null,reported:false};
const input={mx:0,my:0,mouseMoved:false,mouseDown:false,boostKey:false,boostTouch:false,keys:new Set(),stickAngle:0,stickPower:0,stickPointer:-1,touchAngle:null};
const camera={x:WORLD.cx,y:WORLD.cy,zoom:1};
const stars=Array.from({length:470},(_,i)=>({x:Math.random(),y:Math.random(),r:i%7===0?1.5:rand(.4,1),a:rand(.3,.95),phase:rand(0,TAU),depth:rand(.04,.17),c:['#e1ecff','#c8a6ff','#a4dfff','#ffffff'][i%4]}));
const nebula=Array.from({length:4},(_,i)=>({x:rand(.1,.94),y:rand(.1,.88),r:rand(.2,.42),c:['#582a9a','#214b88','#5e247b','#185e69'][i]}));
function resize(){
 vw=window.innerWidth;vh=window.innerHeight;dpr=Math.min(2,window.devicePixelRatio||1);
 canvas.width=Math.round(vw*dpr);canvas.height=Math.round(vh*dpr);
 canvas.style.width=vw+'px';canvas.style.height=vh+'px';
}
window.addEventListener('resize',resize);resize();
function randomPos(radius=.86){
 const a=rand(0,TAU),r=Math.sqrt(Math.random())*radius;
 return {x:WORLD.cx+Math.cos(a)*r*WORLD.rx,y:WORLD.cy+Math.sin(a)*r*WORLD.ry};
}
function wormRadius(w){return clamp(10+Math.sqrt(w.mass)*.76,14,24)}
function segmentCount(w){return clamp(Math.round(12+w.mass*.31),18,190)}
function createWorm(name,human,index){
 let pos=randomPos(human?.14:.80);
 if(human)pos={x:WORLD.cx,y:WORLD.cy};
 const w={name,human,id:index,x:pos.x,y:pos.y,angle:rand(0,TAU),target:0,
  mass:human?61:rand(56,180),bestMass:0,alive:true,invulnerable:human?2.3:2,
  segments:[],color:PALETTE[index%PALETTE.length],boost:false,dropClock:0,
  think:0,targetFood:null,kills:0,foodEaten:0,bestRank:99,leadTime:0,deathDelay:0,
  aiStyle:index%4,wiggle:rand(0,TAU),speed:0};
 w.bestMass=w.mass;w.target=w.angle;
 const gap=11.5;
 for(let i=0;i<segmentCount(w);i++){
  w.segments.push({x:w.x-Math.cos(w.angle)*gap*(i+1),
   y:w.y-Math.sin(w.angle)*gap*(i+1)});
 }
 return w;
}
function makeFood(x,y,color,value,r){
 return {x,y,color:color||FOOD_COLORS[Math.floor(Math.random()*FOOD_COLORS.length)],
 value:value||rand(1.5,3.2),r:r||rand(2.6,5.4),phase:rand(0,TAU)};
}
function fillFood(amount){
 for(let i=0;i<amount;i++){const p=randomPos(.96);game.food.push(makeFood(p.x,p.y));}
}
function notify(text){
 if(DEMO)return;
 const el=$('worm-toast');el.textContent=text;el.classList.add('show');toastTimer=1.8;
}
function init(){
 game={state:'playing',time:0,food:[],worms:[],fx:[],player:null,reported:false};
 const human=!DEMO;
 const p=createWorm(DEMO?'Astra':(window.InfinityProfile?.getName()||'PILOT'),human,0);
 p.angle=-.28;p.target=p.angle;
 game.player=p;game.worms.push(p);
 for(let i=1;i<=(DEMO?14:22);i++){
  const b=createWorm(NAMES[(i-1)%NAMES.length],false,i);b.mass=rand(48,175);b.bestMass=b.mass;
  if(dist(b.x-p.x,b.y-p.y)<450){const pos=randomPos(.83);b.x=pos.x;b.y=pos.y;
   b.segments.forEach((n,j)=>{n.x=b.x-Math.cos(b.angle)*(j+1)*11.5;n.y=b.y-Math.sin(b.angle)*(j+1)*11.5;});}
  game.worms.push(b);
 }
 fillFood(DEMO?370:720);
 camera.x=p.x;camera.y=p.y;camera.zoom=1;
 input.mouseDown=input.boostKey=input.boostTouch=false;
 input.stickPower=0;input.touchAngle=null;input.keys.clear();
 $('worm-result').hidden=true;$('worm-pause-overlay').hidden=true;$('worm-guide').hidden=true;
 if(!DEMO){
  if(!window.InfinityProfile?.getName())window.InfinityProfile?.promptName?.(true,name=>{p.name=name;});
  let visited=false;try{visited=localStorage.getItem('infinity-space-mode-guide-v2:worms')==='1'}catch(_){}
  if(!visited)showGuide('playing');
 }
 updateUI();
}
function sortedWorms(){return game.worms.filter(w=>w.alive).sort((a,b)=>b.mass-a.mass)}
function ranking(w){return 1+game.worms.reduce((n,b)=>n+(b.alive&&b!==w&&b.mass>w.mass?1:0),0)}
function steerBot(w,dt){
 w.think-=dt;w.wiggle+=dt*.54;
 if(w.think>0)return;
 w.think=rand(.20,.42);
 let near=null,score=Infinity;
 const sample=game.food.length;
 // A rotating partial scan prevents all bots from converging on one orb.
 const offset=(w.id*17+Math.floor(game.time*17))%Math.max(1,sample);
 for(let j=0;j<Math.min(sample,150);j++){
  const f=game.food[(offset+j*3)%sample],dx=f.x-w.x,dy=f.y-w.y,d=dx*dx+dy*dy;
  if(d<score){score=d;near=f;}
 }
 if(near)w.target=Math.atan2(near.y-w.y,near.x-w.x)+Math.sin(w.wiggle)*.12;
 const wall=Math.hypot((w.x-WORLD.cx)/WORLD.rx,(w.y-WORLD.cy)/WORLD.ry);
 if(wall>.81)w.target=Math.atan2(WORLD.cy-w.y,WORLD.cx-w.x);
 // Threat avoidance: aim away from incoming heads and dangerous body segments.
 let avoidX=0,avoidY=0;
 for(const other of game.worms){
  if(other===w||!other.alive)continue;
  const dx=w.x-other.x,dy=w.y-other.y,d2=dx*dx+dy*dy;
  if(d2<220*220&&d2>1){const fac=1/(d2+1800);avoidX+=dx*fac*24000;avoidY+=dy*fac*24000;}
  if(d2>450*450)continue;
  for(let i=6;i<other.segments.length;i+=5){
   const s=other.segments[i],x=w.x-s.x,y=w.y-s.y,ds=x*x+y*y;
   if(ds<155*155&&ds>1){const fac=1/(ds+420);avoidX+=x*fac*1600;avoidY+=y*fac*1600;}
  }
 }
 if(avoidX*avoidX+avoidY*avoidY>90)w.target=Math.atan2(avoidY,avoidX);
 w.boost=wall<.84&&w.mass>53&&w.aiStyle===1&&Math.random()<.15;
}
function kill(w,killer,reason){
 if(!w.alive||w.invulnerable>0)return;
 const place=ranking(w);
 w.alive=false;w.boost=false;w.deathDelay=DEMO?2.2:rand(1.2,2.0);
 if(killer&&killer!==w){killer.kills++;killer.mass+=Math.min(18,w.mass*.12);}
 // Remains become food immediately. Opponents can fight over the debris.
 const body=[{x:w.x,y:w.y},...w.segments];
 for(let i=0;i<body.length;i+=2){
  if(game.food.length>1550)break;
  const n=body[i];
  game.food.push(makeFood(n.x+rand(-13,13),n.y+rand(-13,13),
   w.color[0],rand(2.5,6),rand(3.2,6.7)));
 }
 for(let i=0;i<24;i++)game.fx.push({x:w.x,y:w.y,vx:rand(-190,190),vy:rand(-190,190),
  t:rand(.3,.85),max:.85,c:w.color[0],r:rand(1.7,4)});
 if(w.human){
  game.state='finished';
  const won=w.leadTime>=20;
  if(!game.reported){
   game.reported=true;
   window.InfinityProfile?.recordMatch?.('worms',{
    win:won,place:Math.max(1,w.bestRank),kills:w.kills,objects:w.foodEaten,
    mass:w.bestMass,time:game.time
   });
  }
  $('worm-result-length').textContent=Math.round(w.bestMass);
  $('worm-result-place').textContent='#'+Math.min(place,w.bestRank);
  $('worm-result-kills').textContent=w.kills;
  $('worm-result-info').textContent=reason==='wall'?T.wall:reason==='head'?T.self:T.eliminated;
  $('worm-result').hidden=false;
  window.SpacePlatform?.playing?.(false);
 }
}
function updateWorm(w,dt){
 if(!w.alive)return;
 w.invulnerable=Math.max(0,w.invulnerable-dt);
 if(!w.human)steerBot(w,dt);
 else {
  const keys=input.keys;
  let dx=(keys.has('KeyD')||keys.has('ArrowRight')?1:0)-(keys.has('KeyA')||keys.has('ArrowLeft')?1:0);
  let dy=(keys.has('KeyS')||keys.has('ArrowDown')?1:0)-(keys.has('KeyW')||keys.has('ArrowUp')?1:0);
  if(dx||dy)w.target=Math.atan2(dy,dx);
  else if(input.stickPower>.18)w.target=input.stickAngle;
  else if(input.touchAngle!==null)w.target=input.touchAngle;
  else if(input.mouseMoved){
   dx=input.mx-vw/2;dy=input.my-vh/2;
   if(dx*dx+dy*dy>20*20)w.target=Math.atan2(dy,dx);
  }
  w.boost=(input.mouseDown||input.boostKey||input.boostTouch)&&w.mass>38;
 }
 const boosting=w.boost&&w.mass>38;
 const targetSpeed=boosting?295:171;
 const scaled=targetSpeed*Math.max(.76,1-Math.log(Math.max(1,w.mass)/60)*.05);
 w.speed+=(scaled-w.speed)*Math.min(1,dt*9);
 const turnRate=boosting?2.65:3.35;
 const delta=normAngle(w.target-w.angle);
 w.angle+=clamp(delta,-turnRate*dt,turnRate*dt);
 const advance=w.speed*dt;
 w.x+=Math.cos(w.angle)*advance;
 w.y+=Math.sin(w.angle)*advance;
 const gap=11.8;
 let px=w.x,py=w.y;
 for(const node of w.segments){
  const dx=px-node.x,dy=py-node.y,d=Math.hypot(dx,dy);
  if(d>gap){const factor=1-gap/d;node.x+=dx*factor;node.y+=dy*factor;}
  px=node.x;py=node.y;
 }
 if(boosting){
  w.mass=Math.max(38,w.mass-dt*6.3);
  w.dropClock+=dt;
  if(w.dropClock>.12){w.dropClock=0;
   const tail=w.segments[w.segments.length-1]||w;
   if(game.food.length<1400)game.food.push(makeFood(tail.x,tail.y,w.color[0],1.3,2.7));
  }
 }else w.dropClock=0;
 let target=segmentCount(w);
 if(w.segments.length<target){
  const last=w.segments[w.segments.length-1]||w,prev=w.segments[w.segments.length-2]||w;
  w.segments.push({x:last.x+(last.x-prev.x),y:last.y+(last.y-prev.y)});
 }else if(w.segments.length>target)w.segments.length=target;
 w.bestMass=Math.max(w.bestMass,w.mass);
 const border=((w.x-WORLD.cx)/WORLD.rx)**2+((w.y-WORLD.cy)/WORLD.ry)**2;
 if(border>1){w.invulnerable=0;kill(w,null,'wall');return;}
 if(w.human&&border>.91&&Math.random()<dt*.6)notify(T.danger);
}
function collectFood(dt){
 const p=game.player;
 for(let k=game.food.length-1;k>=0;k--){
  const f=game.food[k];
  let ate=false;
  for(const w of game.worms){
   if(!w.alive)continue;
   const dx=w.x-f.x,dy=w.y-f.y,ds=dx*dx+dy*dy,r=wormRadius(w);
   if(ds<(r+f.r+5)**2){
    w.mass+=f.value;w.foodEaten++;
    if(w.human)game.fx.push({x:f.x,y:f.y,vx:rand(-35,35),vy:rand(-60,-5),t:.32,max:.32,c:f.color,r:3});
    game.food.splice(k,1);ate=true;break;
   }
   // Only the player's closer food is magnetized; keeps gathering satisfying.
   if(w===p&&ds<45*45&&ds>5){
    const d=Math.sqrt(ds),speed=(45-d)*dt*5;
    f.x+=dx/d*speed;f.y+=dy/d*speed;
   }
  }
  if(ate)continue;
 }
}
function collisions(){
 const worms=game.worms;
 for(let a=0;a<worms.length;a++){
  const w=worms[a];if(!w.alive||w.invulnerable>0)continue;
  const wr=wormRadius(w);
  for(let b=0;b<worms.length;b++){
   const other=worms[b];if(other===w||!other.alive)continue;
   const or=wormRadius(other);
   const dx=w.x-other.x,dy=w.y-other.y,headDist2=dx*dx+dy*dy;
   if(headDist2<(wr+or*.86)**2){
    w.invulnerable=0;other.invulnerable=0;
    kill(w,other,'head');kill(other,w,'head');break;
   }
   // A worm's own body is safe, but rivals' trails are deadly. Spatial
   // coarse rejection first; then skip every other closely spaced segment.
   if(headDist2>750*750){
    let nearby=false;
    for(let i=12;i<other.segments.length;i+=16){
     const s=other.segments[i];
     if((w.x-s.x)**2+(w.y-s.y)**2<650*650){nearby=true;break;}
    }
    if(!nearby)continue;
   }
   const hitR=wr+or*.68,hitR2=hitR*hitR;
   for(let i=5;i<other.segments.length;i+=2){
    const seg=other.segments[i],sx=w.x-seg.x,sy=w.y-seg.y;
    if(sx*sx+sy*sy<hitR2){w.invulnerable=0;kill(w,other,'body');break;}
   }
   if(!w.alive)break;
  }
 }
}
function respawnBots(){
 for(const w of game.worms){
  if(w.human||w.alive)continue;
  w.deathDelay-=.016;
  if(w.deathDelay>0)continue;
  const fresh=createWorm(w.name,false,w.id);
  // Keep the bot field populated without teleporting the same corpse.
  Object.assign(w,fresh);
  if(dist(w.x-game.player.x,w.y-game.player.y)<300){
   const pos=randomPos(.79);w.x=pos.x;w.y=pos.y;
   w.segments.forEach((n,i)=>{n.x=w.x-Math.cos(w.angle)*(i+1)*11.5;n.y=w.y-Math.sin(w.angle)*(i+1)*11.5;});
  }
 }
}
function simulate(dt){
 game.time+=dt;
 for(const w of game.worms)updateWorm(w,dt);
 collectFood(dt);collisions();
 for(let i=game.fx.length-1;i>=0;i--){
  const p=game.fx[i];p.t-=dt;if(p.t<=0){game.fx.splice(i,1);continue;}
  p.x+=p.vx*dt;p.y+=p.vy*dt;p.vx*=.97;p.vy*=.97;
 }
 for(const w of game.worms)if(!w.alive&&!w.human)w.deathDelay-=dt;
 for(const w of game.worms){
  if(w.human||w.alive||w.deathDelay>0)continue;
  const fresh=createWorm(w.name,false,w.id);Object.assign(w,fresh);
  if(dist(w.x-game.player.x,w.y-game.player.y)<400){
   const pos=randomPos(.85);w.x=pos.x;w.y=pos.y;
   w.segments.forEach((n,i)=>{n.x=w.x-Math.cos(w.angle)*(i+1)*11.5;n.y=w.y-Math.sin(w.angle)*(i+1)*11.5;});
  }
 }
 foodTimer+=dt;
 if(foodTimer>.2){foodTimer=0;if(game.food.length<(DEMO?370:720))fillFood(Math.min(8,(DEMO?370:720)-game.food.length));}
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
 $('worm-length').textContent=Math.round(p.mass).toLocaleString(language);
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
 mc.strokeStyle='#5e438c';mc.lineWidth=1;mc.beginPath();mc.ellipse(0,0,w*.43,h*.44,0,0,TAU);mc.stroke();
 for(const a of game.worms){
  if(!a.alive)continue;
  const x=(a.x-WORLD.cx)/WORLD.rx*w*.43,y=(a.y-WORLD.cy)/WORLD.ry*h*.44;
  mc.fillStyle=a===game.player?'#fff1ff':a.color[0];mc.beginPath();
  mc.arc(x,y,a===game.player?3:1.5,0,TAU);mc.fill();
 }
 mc.restore();
}
function backdrop(t){
 ctx.fillStyle='#03050d';ctx.fillRect(0,0,vw,vh);
 for(const n of nebula){
  const x=((n.x*vw-camera.x*.013)%vw+vw)%vw,y=((n.y*vh-camera.y*.009)%vh+vh)%vh;
  const r=Math.max(vw,vh)*n.r;
  const gr=ctx.createRadialGradient(x,y,1,x,y,r);gr.addColorStop(0,n.c+'26');gr.addColorStop(1,n.c+'00');
  ctx.fillStyle=gr;ctx.fillRect(x-r,y-r,r*2,r*2);
 }
 for(const s of stars){
  const x=((s.x*vw-camera.x*s.depth*.1)%vw+vw)%vw;
  const y=((s.y*vh-camera.y*s.depth*.1)%vh+vh)%vh;
  ctx.globalAlpha=s.a*(.8+Math.sin(t*.8+s.phase)*.2);
  ctx.fillStyle=s.c;ctx.fillRect(x,y,s.r,s.r);
 }
 ctx.globalAlpha=1;
}
function drawFood(t){
 const margin=90,z=camera.zoom;
 const left=camera.x-vw/z/2-margin,right=camera.x+vw/z/2+margin;
 const top=camera.y-vh/z/2-margin,bottom=camera.y+vh/z/2+margin;
 for(const f of game.food){
  if(f.x<left||f.x>right||f.y<top||f.y>bottom)continue;
  const r=f.r*(1+Math.sin(t*3+f.phase)*.08);
  ctx.globalAlpha=.14;ctx.fillStyle=f.color;ctx.beginPath();ctx.arc(f.x,f.y,r*2.9,0,TAU);ctx.fill();
  ctx.globalAlpha=.93;ctx.beginPath();ctx.arc(f.x,f.y,r,0,TAU);ctx.fill();
  ctx.fillStyle='#ffffffd8';ctx.globalAlpha=.68;ctx.beginPath();ctx.arc(f.x-r*.2,f.y-r*.2,Math.max(.8,r*.3),0,TAU);ctx.fill();
 }
 ctx.globalAlpha=1;
}
function drawWorm(w,t){
 if(!w.alive)return;
 const z=camera.zoom;
 if(Math.abs(w.x-camera.x)>vw/z*.8+1500||Math.abs(w.y-camera.y)>vh/z*.8+1500)return;
 const r=wormRadius(w),n=w.segments.length;
 if(!n)return;
 const tip=w.segments[n-1],dark=w.color[1],light=w.color[0];
 ctx.save();ctx.lineCap='round';ctx.lineJoin='round';
 ctx.beginPath();ctx.moveTo(tip.x,tip.y);
 for(let i=n-2;i>=0;i--)ctx.lineTo(w.segments[i].x,w.segments[i].y);
 ctx.lineTo(w.x,w.y);
 ctx.strokeStyle=dark;ctx.lineWidth=r*2.2;ctx.globalAlpha=w.invulnerable>0?.64:1;ctx.stroke();
 ctx.strokeStyle=light;ctx.lineWidth=r*1.65;ctx.globalAlpha=w.invulnerable>0?.6:.89;ctx.stroke();
 ctx.globalAlpha=1;
 // Iridescent segmented dorsal plates, spaced for a clean readable silhouette.
 for(let i=n-1;i>=1;i-=4){
  const node=w.segments[i],fraction=(n-i)/n;
  ctx.globalAlpha=.25+fraction*.36;ctx.fillStyle='#f6efff';
  ctx.beginPath();ctx.arc(node.x,node.y,Math.max(1.8,r*.29),0,TAU);ctx.fill();
 }
 ctx.globalAlpha=1;
 const fx=Math.cos(w.angle),fy=Math.sin(w.angle),nx=-fy,ny=fx;
 ctx.shadowColor=light;ctx.shadowBlur=14;ctx.fillStyle=light;
 ctx.beginPath();ctx.arc(w.x,w.y,r*1.13,0,TAU);ctx.fill();
 ctx.shadowBlur=0;ctx.strokeStyle='#eee4ff9e';ctx.lineWidth=1.5;
 ctx.stroke();
 for(const sign of [-1,1]){
  const ex=w.x+fx*r*.52+nx*sign*r*.57;
  const ey=w.y+fy*r*.52+ny*sign*r*.57;
  ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(ex,ey,r*.28,0,TAU);ctx.fill();
  ctx.fillStyle='#241034';ctx.beginPath();ctx.arc(ex+fx*r*.10,ey+fy*r*.10,r*.14,0,TAU);ctx.fill();
 }
 ctx.font='900 12px Inter,system-ui,sans-serif';ctx.textAlign='center';
 ctx.fillStyle=w.human?'#ffffff':'#d3c1f4';
 ctx.shadowColor='#03020b';ctx.shadowBlur=8;
 ctx.fillText(w.name,w.x,w.y-r*2.2);
 ctx.shadowBlur=0;
 if(w.boost){ctx.strokeStyle=light+'8a';ctx.lineWidth=1.3;
  const tail=w.segments[n-1];ctx.beginPath();ctx.moveTo(tail.x,tail.y);
  ctx.lineTo(tail.x-fx*22,tail.y-fy*22);ctx.stroke();}
 ctx.restore();
}
function paint(t){
 ctx.setTransform(dpr,0,0,dpr,0,0);
 backdrop(t);
 const p=game.player;if(!p)return;
 const targetZoom=clamp((vw<700?.87:1.04)-Math.log(Math.max(1,p.mass)/60)*.115,.48,1.08);
 camera.zoom+=(targetZoom-camera.zoom)*.045;
 camera.x+=(p.x-camera.x)*.09;camera.y+=(p.y-camera.y)*.09;
 ctx.save();ctx.translate(vw*.5,vh*.5);ctx.scale(camera.zoom,camera.zoom);ctx.translate(-camera.x,-camera.y);
 ctx.strokeStyle='#8555d492';ctx.lineWidth=6;ctx.shadowColor='#8a4eea';ctx.shadowBlur=19;
 ctx.beginPath();ctx.ellipse(WORLD.cx,WORLD.cy,WORLD.rx,WORLD.ry,0,0,TAU);ctx.stroke();
 ctx.shadowBlur=0;
 drawFood(t);
 const sorted=game.worms.filter(w=>w.alive).sort((a,b)=>a===p?1:b===p?-1:a.mass-b.mass);
 for(const w of sorted)drawWorm(w,t);
 for(const f of game.fx){ctx.globalAlpha=clamp(f.t/f.max,0,1);ctx.fillStyle=f.c;ctx.fillRect(f.x,f.y,f.r,f.r);}
 ctx.globalAlpha=1;ctx.restore();
 // Soft screen-space vignette leaves HUD labels legible over bright worms.
 const vignette=ctx.createRadialGradient(vw/2,vh/2,Math.min(vw,vh)*.3,
  vw/2,vh/2,Math.max(vw,vh)*.81);
 vignette.addColorStop(0,'#07041100');vignette.addColorStop(1,'#03020ab0');
 ctx.fillStyle=vignette;ctx.fillRect(0,0,vw,vh);
}
function pause(){
 if(DEMO)return;
 if(game.state==='playing'){
  game.state='paused';$('worm-pause-overlay').hidden=false;
  window.SpacePlatform?.playing?.(false);
 }else if(game.state==='paused'){
  game.state='playing';$('worm-pause-overlay').hidden=true;
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
canvas.addEventListener('pointermove',e=>{
 if(e.pointerType==='touch'){if(input.touchAngle!==null)input.touchAngle=Math.atan2(e.clientY-vh/2,e.clientX-vw/2);}
 else{input.mx=e.clientX;input.my=e.clientY;input.mouseMoved=true;}
});
canvas.addEventListener('pointerdown',e=>{
 if(game.state!=='playing')return;
 if(e.pointerType==='mouse'&&e.button===0)input.mouseDown=true;
 if(e.pointerType==='touch')input.touchAngle=Math.atan2(e.clientY-vh/2,e.clientX-vw/2);
});
window.addEventListener('pointerup',e=>{if(e.pointerType==='mouse')input.mouseDown=false;if(e.pointerType==='touch')input.touchAngle=null;});
window.addEventListener('pointercancel',()=>{input.mouseDown=false;input.touchAngle=null;});
window.addEventListener('contextmenu',e=>e.preventDefault());
window.addEventListener('keydown',e=>{
 if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','KeyW','KeyA','KeyS','KeyD','ShiftLeft','ShiftRight'].includes(e.code))e.preventDefault();
 if(e.code==='Escape'||e.code==='KeyP'){
  if(game.state==='guide')closeGuide();else pause();return;
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
 let dt=last?clamp((now-last)/1000,0,.047):.016;last=now;
 starTime=now*.001;
 if(game.state==='playing'){
  simulate(dt);
  if(DEMO&&(!game.player.alive||game.time>80))init();
  uiClock+=dt;
  if(uiClock>.15){uiClock=0;if(!DEMO)updateUI();}
 }
 if(toastTimer>0){toastTimer-=dt;if(toastTimer<=0)$('worm-toast').classList.remove('show');}
 paint(starTime);
}
init();requestAnimationFrame(frame);
if(QUERY.has('tester')||DEMO){
 window.InfinityWormsQA={
  snapshot:()=>({state:game.state,mode:'worms',demo:DEMO,time:game.time,mass:game.player.mass,
    bestMass:game.player.bestMass,length:game.player.segments.length,
    x:game.player.x,y:game.player.y,zoom:camera.zoom,rank:ranking(game.player),
    worms:game.worms.length,alive:game.worms.filter(w=>w.alive).length,food:game.food.length,
    guideOpen:!$('worm-guide').hidden,boosting:game.player.boost}),
  setMass:v=>{game.player.mass=Math.max(35,Math.min(1900,Number(v)||60));game.player.bestMass=Math.max(game.player.bestMass,game.player.mass);updateUI();},
  giveFood:v=>{game.player.mass+=Math.max(1,Number(v)||10);game.player.foodEaten++;updateUI();},
  forceDeath:()=>{game.player.invulnerable=0;kill(game.player,null,'body');},
  pause:()=>pause()
 };
}
document.addEventListener('DOMContentLoaded',()=>{
 Promise.resolve(window.SpacePlatform?.startup).catch(()=>{}).then(()=>{
  if(!DEMO){window.SpacePlatform?.loaded?.();window.SpacePlatform?.playing?.(game.state==='playing');}
 });
});
})();
