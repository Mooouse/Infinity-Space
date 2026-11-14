// Real-Chromium coverage for the Cosmic Worms mode and its six-mode integration.
'use strict';
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path');
function rejectTurquoise(){
 const dir=path.resolve(__dirname,'..');
 const names=fs.readdirSync(dir).filter(n=>/\.(css|js|html)$/.test(n));
 const issues=[];
 function check(name,color){
  if(color.some(v=>v<0||v>255||!Number.isFinite(v)))return;
  const [R,G,B]=color.map(v=>v/255),max=Math.max(R,G,B),min=Math.min(R,G,B);
  const delta=max-min;
  if(delta===0)return;
  let hue=max===R?((G-B)/delta)%6:max===G?(B-R)/delta+2:(R-G)/delta+4;
  hue=(hue*60+360)%360;
  const saturation=delta/(max||1);
  // A brightly saturated blue-green shade is explicitly disallowed in the
  // user's five-color game theme; dark neutral backgrounds are unaffected.
  if(hue>=155&&hue<200&&saturation>.30&&max>.20)
   issues.push({file:name,color:color.join(','),hue:Math.round(hue)});
 }
 for(const name of names){
  const src=fs.readFileSync(path.join(dir,name),'utf8');
  for(const m of src.matchAll(/#([0-9a-fA-F]{3,8})\b/g)){
   const val=m[1],r=val.length===3||val.length===4?
    val.slice(0,3).split('').map(ch=>parseInt(ch+ch,16)):
    val.length===6||val.length===8?
    [0,2,4].map(i=>parseInt(val.slice(i,i+2),16)):null;
   if(r)check(name,r);
  }
  for(const m of src.matchAll(/rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})/g))
   check(name,[Number(m[1]),Number(m[2]),Number(m[3])]);
 }
 assert.deepEqual(issues,[],'Turquoise is disallowed in the saturated cosmic palette');
 const palette=fs.readFileSync(path.join(dir,'ui-app.css'),'utf8');
 for(const color of ['#ff1744','#27ff40','#ffe500','#9922ff','#2860ff'])
  assert.ok(palette.includes(color),'Missing vivid palette color '+color);
}
rejectTurquoise();
// Boost is a continuous, whole-body treatment. Detached particles and
// screen/head streaks must not creep back into the renderer.
const wormSource=fs.readFileSync(path.resolve(__dirname,'../cosmic-worms.js'),'utf8');
assert.ok(wormSource.includes('function drawBoostBody(w,t,r,path,overBody=false)'),
 'Boost must render on the worm body, not through detached effects');
assert.ok(wormSource.includes('if(boosting)drawBoostBody(w,t,r,path);'),
 'Boost illumination must cover the full worm path before the skin');
assert.ok(wormSource.includes('if(boosting)drawBoostBody(w,t,r,path,true);'),
 'The body must brighten end-to-end immediately, not propagate from the head');
for(const absent of ['drawBoostWake(', 'game.fx.push(', 'Hyperdrive speed lines']){
 assert.ok(!wormSource.includes(absent),'Unwanted flying boost streak or particle effect: '+absent);
}
const base=process.env.INFINITI_SMOKE_URL||'http://127.0.0.1:8765';
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader-webgl']});
 const failures=[],errors=[];
 try{
  for(const [width,height] of [[390,844],[1280,720],[1920,1080]]){
   const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:1,isMobile:width===390,hasTouch:width===390});
   const page=await context.newPage();
   page.on('pageerror',err=>errors.push({width,error:String(err.stack||err).slice(0,450)}));
   await page.addInitScript(()=>{
    localStorage.setItem('infinity-space-player-v1',JSON.stringify({version:1,nickname:'Cosmic QA'}));
    localStorage.setItem('infiniti-space-language','ru');
   });
   try{
    await page.goto(base+'/cosmic-worms.html?tester=1',{waitUntil:'domcontentloaded',timeout:60000});
    await page.waitForFunction(()=>!!window.InfinityWormsQA,{timeout:12000});
    let a=await page.evaluate(()=>window.InfinityWormsQA.snapshot());
    assert.equal(a.mode,'worms');
    await page.locator('#mode-music-open').waitFor({state:'visible',timeout:10000});
    assert.equal(await page.locator('#mode-music-open').count(),1,
      'The music collection must exist during Worms gameplay');
    // All three HUD instruments must have one visual geometry, including
    // the music button which is created by the shared mode-music module.
    const hudControls=await page.evaluate(()=>{
     const ids=['mode-music-open','worm-pause','worm-boost'];
     return ids.map(id=>{
      const e=document.getElementById(id),r=e.getBoundingClientRect(),css=getComputedStyle(e);
      const label=e.querySelector('span,b');
      return {id,w:r.width,h:r.height,left:r.left,right:r.right,top:r.top,bottom:r.bottom,
       radius:css.borderTopLeftRadius,background:css.backgroundImage,
       label:label?.textContent?.trim(),labelVisible:label?getComputedStyle(label).display!=='none':false};
     });
    });
    assert.ok(hudControls.every(c=>c.w>=58&&c.h>=58&&c.labelVisible&&c.label),
      'All music/pause/boost controls need icons and readable labels: '+JSON.stringify(hudControls));
    assert.equal(new Set(hudControls.map(c=>c.w+'x'+c.h)).size,1,
      'Music, pause and boost must use identical dimensions: '+JSON.stringify(hudControls));
    assert.equal(new Set(hudControls.map(c=>c.radius)).size,1,
      'The three HUD buttons must have the same corners');
    assert.equal(new Set(hudControls.map(c=>c.background)).size,1,
      'The buttons must share the same base gradient, with only accent differences');
    for(let i=0;i<hudControls.length;i++)for(let j=i+1;j<hudControls.length;j++){
     const a=hudControls[i],b=hudControls[j];
     assert.ok(a.right<=b.left||b.right<=a.left||a.bottom<=b.top||b.bottom<=a.top,
      'Gameplay controls must never overlap: '+JSON.stringify([a,b]));
    }
    assert.equal(await page.evaluate(()=>window.SpaceModeMusic?.current()),1,
      'The free first soundtrack must be selected by default');
    if(width===390){
     const controls=await page.evaluate(()=>{
      const bounds=id=>{const r=document.getElementById(id).getBoundingClientRect();
       return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height};};
      return {stick:bounds('worm-stick'),boost:bounds('worm-boost'),pause:bounds('worm-pause'),viewport:innerWidth};
     });
     assert.ok(controls.stick.left>controls.viewport*.52,
      'Mobile Worms joystick belongs on the right: '+JSON.stringify(controls));
     assert.ok(controls.boost.width>=70&&controls.boost.height>=70&&
      controls.pause.width>=50&&controls.pause.height>=50,
      'Phone controls must never be flattened: '+JSON.stringify(controls));
     assert.ok(controls.boost.right<controls.stick.left,
      'Joystick and boost should not overlap: '+JSON.stringify(controls));
    }

    assert.equal(await page.locator('#worm-length').count(),0,
      'The HUD must not display worm length');
    assert.equal(await page.locator('#worm-mass').count(),1);
    assert.equal(await page.locator('#worm-mass').textContent(),Math.round(a.mass).toLocaleString('ru'));
    assert.equal((await page.locator('#worm-mass').locator('xpath=..').locator('small').textContent()).trim(),
      'МАССА','Mass must match the leaderboard unit');
    const saturated=await page.evaluate(()=>{
     const rgb=selector=>getComputedStyle(document.querySelector(selector)).color;
     const root=getComputedStyle(document.documentElement);
     return {
      brand:rgb('.worm-brand em'),
      mass:rgb('.worm-metric:nth-child(1) strong'),
      rank:rgb('.worm-metric:nth-child(2) strong'),
      timer:rgb('.worm-metric:nth-child(3) strong'),
      blue:root.getPropertyValue('--space-blue').trim(),
      purple:root.getPropertyValue('--space-purple').trim()
     };
    });
    assert.equal(saturated.brand,'rgb(255, 229, 0)','Bright yellow accent required');
    assert.equal(saturated.mass,'rgb(255, 248, 255)','Neutral HUD numbers should not create a rainbow');
    assert.equal(saturated.rank,'rgb(255, 214, 63)','Leaderboard rank should be highlighted in gold');
    assert.equal(saturated.timer,'rgb(255, 248, 255)');
    assert.equal(saturated.blue,'#2860ff');
    assert.equal(saturated.purple,'#9922ff');
    assert.equal(a.world.w,22400);assert.equal(a.world.h,22400);
    assert.equal(a.world.rx,a.world.ry,'Arena boundary must be a circle');
    const orbit=await page.evaluate(()=>window.InfinityWormsQA.orbitTrailProbe());
    assert.equal(orbit.segmentCount,28,'Tight orbit must preserve body length');
    assert.ok(orbit.tailMoved>70,'Tail must coil instead of freezing: '+JSON.stringify(orbit));
    assert.ok(Math.abs(orbit.tailRadius-orbit.radius)<4,'Tail must trace the circular head path: '+JSON.stringify(orbit));
    assert.ok(orbit.history<250,'Arc history must stay memory-bounded: '+JSON.stringify(orbit));
    assert.ok(a.worms>=50&&a.food>=27500,'Circular arena must keep rich food density and bots');
    assert.ok(a.food/(Math.PI*a.world.rx*a.world.ry)>720/(Math.PI*2630*1970),'Food density must increase, not fall with map growth');
    const giants=await page.evaluate(()=>window.InfinityWormsQA.giantRivalsProbe());
    assert.ok(giants.massive>=2&&giants.largest>10000,
      'Several heavyweight rivals must be established before the player joins: '+JSON.stringify(giants));
    const spread=await page.evaluate(()=>window.InfinityWormsQA.spawnDistributionProbe());
    assert.ok(spread.total>=50,'Opening must populate the complete arena: '+JSON.stringify(spread));
    assert.ok(spread.nearbyWithin3100<=14,
      'Too many rivals spawned in the same small radius around the player: '+JSON.stringify(spread));
    assert.ok(spread.farBeyond6500>=18,
      'Rivals should populate the entire arena rather than one central hotspot: '+JSON.stringify(spread));
    assert.ok(spread.minHeadDistance>600,
      'Starting worms need physical separation to avoid immediate mass deaths: '+JSON.stringify(spread));
    assert.ok(spread.giantCount>=2&&spread.giantsFar>=2&&spread.giantBodiesOnOuterArc,
      'Long established rivals must begin on separated curved outer lanes: '+JSON.stringify(spread));
    const wreckScope=await page.evaluate(()=>window.InfinityWormsQA.wreckScopeProbe());
    assert.deepEqual(wreckScope,{near:true,distant:false,committed:true},
      'A corpse must attract nearby scavengers, not all rivals across the whole map');
    // At 8000+ mass camera zoom must not downgrade ANY cosmic skin,
    // including small rivals seen beside the giant player.
    const visual=await page.evaluate(()=>window.InfinityWormsQA.visualMassProbe());
    assert.equal(visual.palettes,16,'All original cosmic palettes remain');
    assert.equal(visual.transparentCenters,0,
      'Coiled bodies must have no holes in the nebula mask: '+JSON.stringify(visual));
    assert.ok(visual.samples.every(m=>m.detailAtMinZoom),
      'All worms must retain original stars and comets at minimum zoom: '+
      JSON.stringify(visual.samples));
    assert.ok(visual.samples.find(m=>m.mass===8000).segments>350,
      'Visual regression covers a 350+ segment giant');
    const corpseScale=await page.evaluate(()=>window.InfinityWormsQA.corpseSizeProbe());
    assert.ok(corpseScale.small<corpseScale.medium&&
      corpseScale.medium<corpseScale.giant&&corpseScale.giant<corpseScale.huge,
      'Resource orb size must grow with defeated worm mass: '+JSON.stringify(corpseScale));
    const course=await page.evaluate(()=>window.InfinityWormsQA.foodCourseProbe());
    assert.ok(course[0].heading>.35&&course[1].heading<-.35&&Math.abs(course[2].heading)<.25,
      'Experienced rivals should navigate toward rich food lanes: '+JSON.stringify(course));
    const regrowth=await page.evaluate(()=>window.InfinityWormsQA.foodRegenerationProbe());
    assert.ok(regrowth.valid&&regrowth.nearby&&regrowth.after===regrowth.before&&regrowth.queued===1,
      'Ordinary food must regenerate near its depleted region: '+JSON.stringify(regrowth));
    const clearance=await page.evaluate(()=>window.InfinityWormsQA.spawnProbe());
    assert.equal(clearance.safe,true,'No bot can appear inside an existing worm body: '+JSON.stringify(clearance));
    assert.equal((await page.evaluate(()=>window.InfinityWormsQA.skins())).length,16,'All 16 distinct skins must be selectable');
    assert.equal(a.guideOpen,true,'First launch must explain mechanics');
    assert.equal(await page.locator('#worm-guide-counter').textContent(),'01 / 03');
    await page.locator('#worm-guide-next').click();
    await page.locator('#worm-guide-next').click();
    await page.locator('#worm-guide-next').click();
    await page.waitForFunction(()=>window.InfinityWormsQA.snapshot().state==='playing');
    if(width>=1280){
     await page.locator('#worm-pause').hover();
     await page.waitForTimeout(220); // Allow the hover transition to settle.
     const pauseStyle=await page.locator('#worm-pause').evaluate(el=>{
      const css=getComputedStyle(el);
      return {border:css.borderTopColor,shadow:css.boxShadow};
     });
     const pauseComponents=pauseStyle.border.match(/[0-9.]+/g)?.map(Number)||[];
     assert.ok(pauseComponents.length>=3&&
      pauseComponents[2]>pauseComponents[0]*1.25&&pauseComponents[2]>pauseComponents[1]*1.35&&
      pauseStyle.shadow!=='none',
      'The restrained pause hover accent must remain visibly violet: '+JSON.stringify(pauseStyle));
     await page.locator('#worm-boost').hover();
     await page.waitForTimeout(220);
     const boostStyle=await page.locator('#worm-boost').evaluate(el=>{
      const css=getComputedStyle(el);
      return {border:css.borderTopColor,shadow:css.boxShadow};
     });
     const boostComponents=boostStyle.border.match(/[0-9.]+/g)?.map(Number)||[];
     assert.ok(boostComponents.length>=3&&boostComponents[0]>=190&&
      boostComponents[0]>boostComponents[1]*1.45&&boostComponents[0]>boostComponents[2]*1.35&&
      boostStyle.shadow!=='none',
      'The restrained boost hover accent must remain visibly pink: '+JSON.stringify(boostStyle));
    }
    await page.evaluate(()=>{window.InfinityWormsQA.testProtection(90);window.InfinityWormsQA.freezeRealtime(true);});
    const skillMix=await page.evaluate(()=>window.InfinityWormsQA.botSkillBalanceProbe());
    assert.ok(skillMix.experienced>=10&&skillMix.passive>=2,
      'The lobby must contain numerous experienced rivals, not mostly beginners and idle pilots: '+
      JSON.stringify(skillMix));
    const evasion=await page.evaluate(()=>window.InfinityWormsQA.botEvasionProbe());
    assert.ok(evasion.alert&&evasion.straight>evasion.turn*1.25,
      'Advanced rivals must detect and evade a body across their forward path: '+
      JSON.stringify(evasion));
    const styles=await page.evaluate(()=>window.InfinityWormsQA.botStyles());
    for(const role of ['afk','newcomer','casual','cautious','hunter','veteran','pro','reckless']){
     assert.ok(styles[role]>=2,'Missing realistic bot behavior: '+role);
    }
    const roleProbe=await page.evaluate(()=>window.InfinityWormsQA.botReshuffleProbe());
    assert.ok(roleProbe?.independent,
      'A respawn must reshuffle role, skin, head and name instead of reusing the same AFK/color: '+JSON.stringify(roleProbe));
    const uniqueRoster=await page.evaluate(()=>window.InfinityWormsQA.bots());
    for(const role of ['afk','pro','casual','newcomer']){
     const roleSkins=uniqueRoster.filter(b=>b.persona===role).map(b=>b.skin);
     assert.ok(new Set(roleSkins).size>=2,
       'The '+role+' archetype must not own one fixed worm color across the lobby');
    }
    assert.ok(new Set(uniqueRoster.map(b=>b.head)).size>=4,
      'AI characters should use multiple cosmic head shapes');
    console.log('WORMS_QA_PHYSICS '+width+'x'+height);
    const botsBefore=await page.evaluate(()=>window.InfinityWormsQA.bots());
    await page.evaluate(()=>window.InfinityWormsQA.advancePhysics(.55));
    const botsAfter=await page.evaluate(()=>window.InfinityWormsQA.bots());
    const beforeById=new Map(botsBefore.map(b=>[b.id,b]));
    const afkBots=botsAfter.filter(b=>b.persona==='afk'&&b.alive&&beforeById.get(b.id)?.alive);
    const activeBots=botsAfter.filter(b=>b.persona==='pro'&&b.alive&&beforeById.get(b.id)?.alive);
    assert.ok(afkBots.length>=2&&activeBots.length>=2,'Need both AFK and active pro bots');
    for(const b of afkBots){
     const before=beforeById.get(b.id);
     assert.ok(Math.hypot(b.x-before.x,b.y-before.y)>5,'Idle rivals must keep gliding forward');
    }
    assert.ok(activeBots.some(b=>{
     const before=beforeById.get(b.id);
     return Math.hypot(b.x-before.x,b.y-before.y)>20;
    }),'Professional rivals should move and react even while idle rivals coast');
    assert.ok(new Set(botsAfter.filter(b=>b.alive).map(b=>Math.round(b.reaction*100))).size>=8,
     'Different rivals must have different reaction times');
    a=await page.evaluate(()=>window.InfinityWormsQA.snapshot());
    const targetAngle=a.angle+Math.PI;
    await page.evaluate(v=>window.InfinityWormsQA.setHeading(v),targetAngle);
    await page.evaluate(()=>window.InfinityWormsQA.advancePhysics(.08));
    const turning=await page.evaluate(()=>window.InfinityWormsQA.snapshot());
    const distanceToTarget=v=>Math.abs(Math.atan2(Math.sin(targetAngle-v.angle),Math.cos(targetAngle-v.angle)));
    assert.ok(distanceToTarget(turning)>2.55,'180-degree turn must follow a real curved path rather than snapping: '+JSON.stringify({start:a.angle,turning:turning.angle,targetAngle}));
    assert.ok(distanceToTarget(turning)<Math.PI-.08,'Worm must start following the steering input');
    await page.evaluate(()=>window.InfinityWormsQA.advancePhysics(.47));
    const halfway=await page.evaluate(()=>window.InfinityWormsQA.snapshot());
    assert.ok(distanceToTarget(halfway)>.55 && distanceToTarget(halfway)<2.5,
     'Turn must progress smoothly through a substantial radius');
    await page.evaluate(()=>window.InfinityWormsQA.advancePhysics(.8));
    const completed=await page.evaluate(()=>window.InfinityWormsQA.snapshot());
    assert.ok(distanceToTarget(completed)<.16,'Worm must finish its turn instead of drifting endlessly');
    assert.ok(a.length>=18,'Worm begins with an actual segmented body');
    await page.evaluate(()=>{window.InfinityWormsQA.giveFood(60);window.InfinityWormsQA.advancePhysics(.2);});
    const growth=await page.evaluate(()=>window.InfinityWormsQA.snapshot());
    assert.ok(growth.mass>a.mass+50&&growth.length>a.length,'Mass pickup must grow tail');
    const narrowRadius=(await page.evaluate(()=>window.InfinityWormsQA.snapshot())).radius;
    await page.evaluate(()=>window.InfinityWormsQA.setMass(6000));
    assert.ok((await page.evaluate(()=>window.InfinityWormsQA.snapshot())).radius>narrowRadius*1.5,'Worm must grow substantially in width, not only length');
    assert.ok(await page.evaluate(()=>window.InfinityWormsQA.desiredLength())>190,'No fixed 190-segment growth limit');
    assert.equal(await page.evaluate(()=>window.InfinityWormsQA.headOnWinner({massA:500,massB:60})),'a');
    assert.equal(await page.evaluate(()=>window.InfinityWormsQA.headOnWinner({massA:60,massB:500})),'b');
    const large=await page.evaluate(()=>{
     window.InfinityWormsQA.setMass(1000);
     return window.InfinityWormsQA.advanceCamera(60);
    });
    const small=await page.evaluate(()=>{
     window.InfinityWormsQA.setMass(60);
     return window.InfinityWormsQA.advanceCamera(60);
    });
    assert.ok(small>large,'Growing must zoom camera out');
    await page.evaluate(()=>window.InfinityWormsQA.freezeRealtime(false));
    await page.keyboard.down('Space');
    await page.waitForTimeout(170);
    assert.equal(await page.evaluate(()=>window.InfinityWormsQA.snapshot().boosting),true,'Space enables boosting');
    await page.keyboard.up('Space');
    const corpse=await page.evaluate(()=>window.InfinityWormsQA.forceBotDeath());
    assert.ok(corpse&&corpse.dropped>=corpse.segments*2,'Food must drop all along a defeated worm body');
    assert.ok(corpse.meanRadius>3.3&&
      corpse.meanRadius>4.1*Math.min(2.5,corpse.lastDeath.dropScale*.82),
      'Large defeated worms should drop visibly larger resources: '+JSON.stringify(corpse));
    // All three behaviors are exercised using the exact production
    // steering algorithm, not only by checking the declared objective.
    const routes=await page.evaluate(()=>window.InfinityWormsQA.navigationProbe());
    assert.equal(routes.salvage.collected,routes.salvage.total,
      'Rival must finish the whole defeated worm, not quit at half: '+JSON.stringify(routes.salvage));
    assert.equal(routes.salvage.remaining,0,'No wreck pieces left after the harvesting route');
    assert.ok(routes.salvage.displacementRatio>.75&&routes.salvage.flips===0,
      'Corpse scavenging should be a moving sweep, not repeated tight U-turns: '+JSON.stringify(routes.salvage));
    assert.ok(routes.ambient.displacementRatio>.88&&routes.ambient.meanTurn<.55,
      'Rivals gathering normal food should travel steadily rather than repeatedly circling: '+
      JSON.stringify(routes.ambient));
    assert.ok(routes.empty.displacementRatio>.94&&routes.empty.meanTurn<.35,
      'With no targets a rival must cruise straight, not orbit indefinitely: '+JSON.stringify(routes.empty));
        const salvage=await page.evaluate(()=>window.InfinityWormsQA.salvageProbe());
    assert.equal(salvage.available,true,'Defeated bodies must broadcast salvage');
    assert.ok(salvage.total>=40,'There should be a full competitive lobby');
    assert.equal(salvage.prioritizing,salvage.eligible,
      'Every rival near fallen worm resources should harvest them; distant rivals must not converge into one fatal cluster: '+
      JSON.stringify(salvage));
    assert.ok(salvage.eligible<salvage.total,
      'Corpse announcements must not redirect the whole map at once: '+JSON.stringify(salvage));
    const combat=await page.evaluate(()=>window.InfinityWormsQA.combatProbe());
    assert.equal(combat.locked,true,
      'Experienced opponents must seek distant living prey without waiting for corpse loot: '+JSON.stringify(combat));
    assert.equal(combat.boosted,true,
      'Experienced opponents must use sustained acceleration while intercepting prey: '+JSON.stringify(combat));
    const coil=await page.evaluate(()=>window.InfinityWormsQA.encircleProbe());
    assert.ok(coil.canClose&&coil.availableLength>coil.requiredLength,
      'A sufficiently long rival must be able to commit to a real encircling loop');
    assert.ok(coil.loop>Math.PI*1.7&&coil.radiusError<25,
      'The attacker must actually curl around its prey and nearly close its body loop: '+
      JSON.stringify(coil));
    const relaxation=await page.evaluate(()=>window.InfinityWormsQA.relaxationProbe());
    assert.ok(relaxation.maxShift>1.5&&relaxation.maxShift<25,
      'Sharp turns must contract physically over time, without snapping: '+JSON.stringify(relaxation));
    const pausePosition=await page.locator('#worm-pause').evaluate(el=>el.getBoundingClientRect().top);
    assert.ok(pausePosition>height*.58,'Pause should be with bottom gameplay buttons instead of at the top');
    await page.locator('#worm-pause').click();
    assert.equal(await page.locator('#worm-pause-overlay').isVisible(),true);
    assert.equal(await page.locator('#worm-pause-preview').count(),0,
      'Pause must not show a duplicate fake worm preview');
    assert.equal(await page.locator('#worm-exit').textContent(),'ВЫХОД В МЕНЮ');
    // Pause is now a live-world overlay: rival worms and match time keep moving
    // while the player remains protected and the UI is interactive.
    const pausedStart=await page.evaluate(()=>window.InfinityWormsQA.snapshot());
    await page.waitForTimeout(350);
    const pausedEnd=await page.evaluate(()=>window.InfinityWormsQA.snapshot());
    assert.equal(pausedEnd.state,'paused');
    assert.ok(pausedEnd.time>pausedStart.time,
      'Opening pause must not freeze the surrounding universe');
    assert.ok(Math.hypot(pausedEnd.x-pausedStart.x,pausedEnd.y-pausedStart.y)>8,
      'The player must continue coasting during pause, not freeze in place: '+
      JSON.stringify({from:pausedStart,to:pausedEnd}));
    assert.equal(await page.locator('#worm-pause-length').count(),0);
    // HUD and pause use the same throttled UI refresh. Physics advances
    // independently, so a snapshot can be one pickup ahead of both labels.
    // Assert the two displayed values match, and that both track live mass
    // within the UI's normal 150 ms refresh interval.
    const displayedPauseMass=await page.locator('#worm-pause-mass').textContent();
    const displayedHudMass=await page.locator('#worm-mass').textContent();
    assert.equal(displayedPauseMass,displayedHudMass,
      'Pause must display the same mass as the HUD');
    assert.ok(Math.abs(Number(displayedPauseMass.replace(/[^0-9]/g,''))-Math.round(pausedEnd.mass))<=10,
      'Mass labels must remain close to the live simulation during pause');
    assert.equal(pausedEnd.resultVisible,false);
    assert.equal(await page.locator('#worm-pause-sound').count(),1);
    await page.locator('#worm-skins-open').click();
    assert.equal(await page.locator('.ws-overlay').isVisible(),true,'Separate skin editor must open from pause');
    const previewMotion=await page.evaluate(()=>{
     const a=window.WormSkinStudio.previewCenterline(0);
     const b=window.WormSkinStudio.previewCenterline(1.5);
     const end=a.length-1;
     return {head0:a[end],head1:b[end],
      tailMotion:Math.hypot(b[0].x-a[0].x,b[0].y-a[0].y),
      bodyMotion:Math.hypot(b[25].x-a[25].x,b[25].y-a[25].y),
      length:a.length};
    });
    assert.equal(previewMotion.length,59);
    assert.ok(Math.hypot(previewMotion.head1.x-previewMotion.head0.x,
      previewMotion.head1.y-previewMotion.head0.y)<.01,
      'Preview head must stay camera-locked while the world moves: '+JSON.stringify(previewMotion));
    const previewBounds=await page.evaluate(()=>{
      const result=[];
      for(let t=0;t<12;t+=.2){
       const body=window.WormSkinStudio.previewCenterline(t);
       result.push(...body.map(p=>({x:p.x,y:p.y})));
      }
      const xs=result.map(p=>p.x),ys=result.map(p=>p.y);
      return {minX:Math.min(...xs),maxX:Math.max(...xs),minY:Math.min(...ys),maxY:Math.max(...ys)};
    });
    assert.ok(previewBounds.minX>=40&&previewBounds.maxX<=880&&
      previewBounds.minY>=40&&previewBounds.maxY<=180,
      'Preview worm and glow must remain inside the 920x220 canvas: '+JSON.stringify(previewBounds));
    assert.ok(previewMotion.tailMotion>2&&previewMotion.bodyMotion>2,
      'Worm preview must flow along its previous trajectory, not hang motionless: '+JSON.stringify(previewMotion));
    assert.equal(await page.locator('.ws-preset').count(),16);
    assert.equal(await page.locator('.ws-preset[data-skin="nebula"]').isEnabled(),true);
    assert.equal(await page.locator('.ws-preset[data-skin="aurora"]').isEnabled(),true);
    assert.equal(await page.locator('.ws-preset[data-skin="pulsar"]').isEnabled(),false,
      'Rare skins must require kills, top-1 finishes or mass records');
    assert.ok((await page.locator('.ws-preset[data-skin="pulsar"] .ws-unlock-label').textContent()).includes('5'),
      'Locked cards must display an exact earned progress objective');

    assert.equal(await page.locator('.ws-preset-worm i').count(),0,
      'Premade cosmic skins must be seamless silhouettes, not circles');
    assert.ok(await page.locator('.ws-preset-worm').first().evaluate(el=>
      getComputedStyle(el).backgroundImage.includes('linear-gradient')),
      'Preset preview must show a continuous skin gradient');
    assert.equal(await page.locator('.ws-bead').count(),64,'All 64 segment colors can be customized');
    assert.equal(await page.locator('.ws-preview-canvas').isVisible(),true,'Live moving worm preview should be visible');
    assert.equal(await page.locator('.ws-preview-canvas').evaluate(el=>getComputedStyle(el).objectFit),'contain',
      'Mobile workshop previews must show the complete worm, never crop its head or tail');
    await page.waitForFunction(()=>{const c=document.querySelector('.ws-preview-canvas');if(!c)return false;const p=c.getContext('2d').getImageData(700,80,80,70).data;return p.some((v,i)=>i%4!==3&&v>150)},null,{timeout:5000});
    assert.equal(await page.locator('.ws-advanced-summary').isVisible(),true,'Advanced body painter toggle exists');
    assert.equal(await page.locator('.ws-head-choice').count(),30,'All 30 illustrated head designs must be available');
    assert.equal(await page.evaluate(()=>window.WormHeadArt===window.WormSkinStudio.headArt),true,
      'Gameplay and workshop must share exactly one source of artwork');
    const headReady=await page.evaluate(async()=>{
      const art=window.WormHeadArt,canvas=document.createElement('canvas');
      canvas.width=100;canvas.height=100;
      const g=canvas.getContext('2d');
      for(const head of art.ids){
       let drawn=false;
       for(let i=0;i<30&&!drawn;i++){
        drawn=art.draw(g,head,50,50,0,24);
        if(!drawn)await new Promise(resolve=>setTimeout(resolve,30));
       }
       if(!drawn)return false;
      }
      return true;
    });
    assert.ok(headReady,'All 30 canonical workshop SVGs must paint on gameplay Canvas');
    const iconMetrics=await page.locator('.ws-head-choice').evaluateAll(buttons=>buttons.map(button=>{
      const el=button.querySelector('.ws-head-symbol'),svg=el?.querySelector('svg'),rect=el?.getBoundingClientRect();
      const close=document.querySelector('.ws-x'),closeSvg=close?.querySelector('svg');
      const c=close?.getBoundingClientRect(),s=closeSvg?.getBoundingClientRect();
      return {shape:button.dataset.head,hasSvg:!!svg,visible:el&&getComputedStyle(el).display!=='none',
       iconWidth:rect?.width,closeCentered:!!(c&&s&&Math.abs((c.left+c.width/2)-(s.left+s.width/2))<2&&
        Math.abs((c.top+c.height/2)-(s.top+s.height/2))<2),
       closeColor:close&&getComputedStyle(close).color};
    }));
    assert.ok(iconMetrics.length===30&&iconMetrics.every(v=>v.hasSvg&&v.visible&&v.iconWidth>=35),
      'All 30 head selectors need visible illustrated previews: '+JSON.stringify(iconMetrics));
    assert.ok(await page.locator('.ws-head-choice[data-head="pizza"] svg').isVisible(),
      'Pizza head is a genuine preview illustration');
    assert.ok(await page.locator('.ws-head-choice[data-head="pig"] svg').isVisible(),
      'Pig head is a genuine preview illustration');
    assert.ok(iconMetrics.some(v=>v.shape==='blackhole'&&v.hasSvg));
        assert.ok(iconMetrics.every(v=>v.closeCentered),'Workshop close icon must be physically centered');
    assert.ok(iconMetrics.every(v=>v.closeColor==='rgb(243, 231, 255)'),
      'Close icon must match the violet workshop palette: '+JSON.stringify(iconMetrics));
    const curvature=await page.evaluate(()=>{
      const scan=t=>{
       const body=window.WormSkinStudio.previewCenterline(t),start=body[0],end=body.at(-1);
       return Math.max(...body.map(p=>Math.abs(p.y-(start.y+(p.x-start.x)/(end.x-start.x)*(end.y-start.y)))));
      };
      return [scan(0),scan(1.5),scan(3)];
    });
    assert.ok(curvature.every(v=>v>28),'Travelling body curves must be visible, not a straight rod: '+JSON.stringify(curvature));
    const motionRanges=await page.evaluate(()=>{
      const samples=Array.from({length:85},(_,i)=>window.WormSkinStudio.previewCenterline(i*.25));
      const y=samples.flatMap(b=>b.map(p=>p.y));
      return {minY:Math.min(...y),maxY:Math.max(...y),
       travel:Math.max(...samples.map(b=>b[12].y))-Math.min(...samples.map(b=>b[12].y))};
    });
    assert.ok(motionRanges.travel>60&&motionRanges.minY>=40&&motionRanges.maxY<=180,
     'The worm must visibly undulate while staying within the preview frame: '+JSON.stringify(motionRanges));
    await page.locator('.ws-head-choice[data-head="blackhole"]').click();
    assert.equal(await page.evaluate(()=>window.InfinityWormsQA.snapshot().head),'blackhole','Black hole head must be persisted and applied');
    await page.locator('.ws-preset').nth(1).click();
    assert.equal(await page.evaluate(()=>window.InfinityWormsQA.snapshot().skin),'aurora');
    await page.locator('.ws-advanced-summary').click();
    await page.locator('.ws-color').first().click();
    await page.locator('.ws-bead').nth(3).click();
    const chosen=await page.evaluate(()=>JSON.parse(localStorage.getItem('infinity-space-worms-settings-v2')));
    assert.equal(chosen.customEnabled,true);
    assert.equal(chosen.customSegments[3],'#ff1744');
    await page.locator('.ws-done').click();
    assert.equal(await page.locator('#worm-pause-overlay').isVisible(),true,'Skin editor returns to pause');
    await page.locator('#worm-settings-open').click();
    assert.equal(await page.locator('#worm-settings').isVisible(),true);
    // The original Infinity Space settings page is hosted in a frame, NOT
    // an independently designed duplicate in the Worms document.
    assert.equal(await page.locator('#worm-settings [data-settings-tab]').count(),0,
      'Remove the duplicate mode-specific settings screen');
    assert.equal(await page.locator('#worm-settings-frame').count(),1);
    await page.waitForFunction(()=>
      document.getElementById('worm-settings-frame')?.src.includes('worm-settings-embed=1'),
      null,{timeout:15000});
    const mainSettings=page.frameLocator('#worm-settings-frame');
    await mainSettings.locator('#set-worm-control').waitFor({state:'visible',timeout:30000});
    await mainSettings.locator('#set-worm-control').selectOption('keys');
    assert.equal(await mainSettings.locator('#set-worm-control').evaluate(el=>el.value),'keys',
      'The main Settings page must allow separate controls for Worms');
    await mainSettings.locator('#set-worm-control').selectOption('auto');

    // Regression: Settings from PAUSE uses an iframe whose modal is z-index:999.
    // The real, portaled dropdown must render above it and accept pointer clicks.
    const wormTrigger=mainSettings.locator('#set-worm-control + .game-select .game-select-trigger');
    await wormTrigger.click();
    const wormPopup=mainSettings.locator('.game-select-pop:not([hidden])');
    await wormPopup.waitFor({state:'visible',timeout:6000});
    assert.equal(await wormPopup.evaluate(menu=>Number(getComputedStyle(menu).zIndex)>Number(getComputedStyle(document.querySelector('#modal')).zIndex)),
      true,'Dropdown must stack above the fullscreen embedded Settings modal');
    // Wheel scrolling inside a menu must leave that menu open.
    await wormPopup.evaluate(menu=>menu.dispatchEvent(new Event('scroll')));
    assert.equal(await wormPopup.isVisible(),true,'Scrolling dropdown options must not close the menu');
    const keyOption=wormPopup.locator('.game-select-item').nth(2);
    assert.equal(await keyOption.evaluate(item=>{
      const r=item.getBoundingClientRect(),top=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);
      return top===item||item.contains(top);
    }),true,'Dropdown option must be the physically topmost clickable element');
    await keyOption.click();
    assert.equal(await mainSettings.locator('#set-worm-control').inputValue(),'keys',
      'Selecting a dropdown item through the UI must update the real settings control');
    assert.equal(await wormPopup.isVisible(),false,'Selected dropdown must close after choosing an option');
    await wormTrigger.click();
    await wormPopup.locator('.game-select-item').first().click();
    assert.equal(await mainSettings.locator('#set-worm-control').inputValue(),'auto');

    await mainSettings.locator('#screen-settings').waitFor({state:'visible',timeout:30000});
    assert.equal(await mainSettings.locator('#screen-settings [data-settings-tab]').count(),4,
      'Pause opens the actual primary settings screen with all four main sections');
    assert.equal(await mainSettings.locator('#screen-settings [data-settings-pane].active').count(),1);
    assert.equal(await mainSettings.locator('#screen-settings [data-save-settings]').count(),1);
    await mainSettings.locator('#screen-settings [data-settings-tab="audio"]').click();
    assert.equal(await mainSettings.locator('#screen-settings [data-settings-pane="audio"].active').count(),1);
    await mainSettings.locator('#screen-settings [data-settings-tab="graphics"]').click();
    assert.equal(await mainSettings.locator('#screen-settings [data-settings-pane="graphics"].active').count(),1);
    const qualityTrigger=mainSettings.locator('#set-quality + .game-select .game-select-trigger');
    // Quality may be locked when automatic quality reduction is disabled.
    if(await qualityTrigger.isEnabled()){
      await qualityTrigger.click();
      const qualityPopup=mainSettings.locator('.game-select-pop:not([hidden])');
      await qualityPopup.waitFor({state:'visible'});
      await qualityPopup.locator('.game-select-item').last().click();
      assert.equal(await mainSettings.locator('#set-quality').inputValue(),'0.5',
        'Graphics dropdown must update the actual quality setting');
    }
    assert.match((await mainSettings.locator('#screen-settings [data-save-settings]').textContent()).toUpperCase(),
      /СОХРАНИТЬ И ВЫЙТИ/,'The primary settings button must say Save and Exit');
    await mainSettings.locator('#screen-settings [data-save-settings]').click();
    // postMessage from the real settings iframe to the live Worms page is
    // delivered asynchronously. Wait for navigation instead of asserting
    // visibility in the same event-loop turn as the click.
    await page.locator('#worm-settings').waitFor({state:'hidden',timeout:8000});
    await page.locator('#worm-pause-overlay').waitFor({state:'visible',timeout:8000});
    assert.equal(await page.evaluate(()=>window.InfinityWormsQA.snapshot().state),'paused',
      'Back must return to the existing live Worms match, not restart it');
    await page.locator('#worm-open-guide').click();
    assert.equal(await page.locator('#worm-guide').isVisible(),true);
    await page.locator('#worm-guide-skip').click();
    assert.equal(await page.locator('#worm-pause-overlay').isVisible(),true,'Guide returns to pause');
    await page.locator('#worm-resume').click();
    const cameraBefore=await page.evaluate(()=>window.InfinityWormsQA.snapshot().zoomSetting);
    if(width>=1280){
     await page.mouse.move(width*.48,height*.49);
     await page.mouse.wheel(0,-240);
    }else{
     // Two active canvas touches must pinch without engaging single-finger steer.
     await page.evaluate(()=>{
      const canvas=document.querySelector('#worm-field');
      for(const [type,id,x,y] of [['pointerdown',11,90,380],['pointerdown',12,260,380],
        ['pointermove',12,280,380],['pointerup',11,90,380],['pointerup',12,280,380]])
       canvas.dispatchEvent(new PointerEvent(type,{
        bubbles:true,pointerId:id,pointerType:'touch',clientX:x,clientY:y,isPrimary:id===11
       }));
     });
    }
    const cameraAfter=await page.evaluate(()=>window.InfinityWormsQA.snapshot().zoomSetting);
    assert.ok(cameraAfter>cameraBefore&&cameraAfter<=116,
      'Wheel/pinch should zoom in slightly and stay inside the 16% limit');
    // The game still runs during pause: a real rival head-on collision
    // must kill the player (rather than granting permanent immunity).
    await page.locator('#worm-pause').click();
    assert.equal(await page.evaluate(()=>window.InfinityWormsQA.snapshot().state),'paused');
    const pauseCollision=await page.evaluate(()=>window.InfinityWormsQA.forcePausedCollision());
    assert.equal(pauseCollision.state,'death-replay',
      'Player must be able to die while the pause menu is open: '+JSON.stringify(pauseCollision));
    assert.equal(pauseCollision.playerAlive,false);
    assert.equal(pauseCollision.pauseVisible,false,
      'Death must close the pause overlay to reveal the aftermath');
    assert.equal(pauseCollision.settingsVisible,false);
    let aftermath=await page.evaluate(()=>window.InfinityWormsQA.snapshot());
    assert.equal(aftermath.state,'death-replay','Death should enter live aftermath, not results');
    assert.equal(aftermath.resultVisible,false,'Result modal must remain hidden at impact');
    assert.ok(aftermath.deathDelay>=2.5);
    const observing=await page.evaluate(()=>window.InfinityWormsQA.bots());
    await page.waitForTimeout(800);
    aftermath=await page.evaluate(()=>window.InfinityWormsQA.snapshot());
    assert.equal(aftermath.state,'death-replay','Arena should stay visible for a few seconds');
    assert.equal(aftermath.resultVisible,false,'Death overlay cannot pop up instantly');
    const later=await page.evaluate(()=>window.InfinityWormsQA.bots());
    assert.ok(later.some(bot=>{
     const old=observing.find(x=>x.id===bot.id);
     return old&&old.alive&&bot.alive&&bot.persona!=='afk'&&
      Math.hypot(bot.x-old.x,bot.y-old.y)>12;
    }),'Rivals must continue moving and collecting food during death replay');
    await page.locator('#worm-result').waitFor({state:'visible',timeout:8500});
    assert.equal(await page.locator('#worm-result-length').count(),0,
      'The results screen must report mass, never length');
    assert.equal((await page.locator('#worm-result-mass').locator('xpath=..').locator('small').textContent()).trim(),
      'МАССА');
    assert.equal(await page.evaluate(()=>window.InfinityWormsQA.snapshot().state),'finished');
    assert.equal(await page.locator('#worm-result').evaluate(
     el=>getComputedStyle(el).animationName.includes('worm-cinematic-curtain')),true,
     'Results must fade in smoothly instead of opening abruptly');
    await page.waitForTimeout(950);
    const rec=await page.evaluate(()=>{
     const all=JSON.parse(localStorage.getItem('infinity-space-stats-v1')||'{}');
     return all.worms;
    });
    assert.ok(rec&&rec.matches===1&&rec.objects>=1,'Worms statistics must be persisted separately');
    await page.locator('#worm-restart').click();
    assert.equal(await page.evaluate(()=>window.InfinityWormsQA.snapshot().skin),'aurora','Selected skin should survive death/restart');
    assert.equal(await page.evaluate(()=>window.InfinityWormsQA.snapshot().head),'blackhole','Cosmic head selection must survive death/restart');
    assert.equal(await page.evaluate(()=>window.InfinityWormsQA.snapshot().customEnabled),true,'Custom colors should survive death/restart');
    await page.waitForFunction(()=>window.InfinityWormsQA.snapshot().state==='playing');
    const res=await page.evaluate(()=>{
     const canv=document.getElementById('worm-field'),r=canv.getBoundingClientRect();
     return {width:canv.width,height:canv.height,rect:[r.left,r.top,r.right,r.bottom],doc:document.documentElement.scrollWidth};
    });
    assert.ok(res.width>0&&res.height>0,'Canvas must render');
    assert.ok(res.doc<=width+2,'Document must not overflow viewport');
    await page.locator('#worm-pause').click();
    // Observe the navigation before clicking: 2K rendering can let the click
    // finish after the navigation starts.
    try{
     await Promise.all([
      page.waitForURL(url=>url.pathname.endsWith('/index.html')&&
       url.searchParams.get('select')==='worms',
       {waitUntil:'domcontentloaded',timeout:30000}),
      page.locator('#worm-exit').click({timeout:20000,noWaitAfter:true})
     ]);
    }catch(err){
     throw Error('Worm exit failed to return to selected mode; URL='+page.url()+
      '; cause='+String(err).slice(0,450));
    }
    await page.locator('#hub-mode-story').waitFor({state:'visible',timeout:30000});
    assert.equal(await page.locator('.hub-mode-dots button').count(),6);
    assert.match(await page.locator('.hub-mode-story-title').textContent(),/Космические черви/);
    assert.equal(await page.locator('.hub-mode-story-skins').isVisible(),true,'Main menu should expose worm skins');
    await page.locator('.hub-mode-story-skins').click();
    assert.equal(await page.locator('.ws-overlay').isVisible(),true);
    await page.locator('.ws-done').click();
    await page.locator('.hub-story-shortcut[data-shortcut="statistics"]').click();
    await page.locator('.infinity-stats-panel').waitFor({state:'visible',timeout:5000});
    assert.equal(await page.locator('.infinity-stats-tabs button').count(),7);
    assert.equal(await page.locator('.infinity-stats-tabs [data-mode="worms"]').count(),1);
    await page.locator('.infinity-stats-tabs [data-mode="worms"]').click();
    assert.equal(await page.locator('.infinity-stats-tabs [data-mode="worms"]').getAttribute('aria-selected'),'true');
    console.log('PASS: circular arena, compact turn radius, animated comet/star skins, multi-hue UI, cinematic death and AI archetypes at '+width+'x'+height);
   }catch(err){failures.push({width,height,error:String(err.stack||err).slice(0,750)});}
   await context.close();
  }
  // The menu background is an AI-only live match with no visible HUD.
  const ctx=await browser.newContext({viewport:{width:960,height:540}});
  const demo=await ctx.newPage();
  demo.on('pageerror',e=>errors.push({demo:true,error:String(e.stack||e).slice(0,450)}));
  await demo.goto(base+'/cosmic-worms.html?demo=1',{waitUntil:'domcontentloaded',timeout:45000});
  await demo.waitForFunction(()=>!!window.InfinityWormsQA,{timeout:12000});
  const snap=await demo.evaluate(()=>window.InfinityWormsQA.snapshot());
  assert.ok(snap.demo&&snap.alive>0&&snap.food>200&&!snap.guideOpen);
  assert.equal(await demo.locator('#worm-hud').isVisible(),false);
  await ctx.close();
  console.log('WORMS_SMOKE_FAILURES '+JSON.stringify(failures));
  console.log('WORMS_SMOKE_ERRORS '+JSON.stringify(errors));
  assert.equal(failures.length,0,'Cosmic Worms errors: '+JSON.stringify(failures));
  assert.equal(errors.length,0,'Runtime errors: '+JSON.stringify(errors));
 }finally{await browser.close();}
})().catch(e=>{console.error(e.stack||e);process.exitCode=1;});
