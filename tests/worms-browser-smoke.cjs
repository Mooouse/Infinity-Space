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
    const saturated=await page.evaluate(()=>{
     const rgb=selector=>getComputedStyle(document.querySelector(selector)).color;
     const root=getComputedStyle(document.documentElement);
     return {
      brand:rgb('.worm-brand em'),
      length:rgb('.worm-metric:nth-child(1) strong'),
      rank:rgb('.worm-metric:nth-child(2) strong'),
      timer:rgb('.worm-metric:nth-child(3) strong'),
      blue:root.getPropertyValue('--space-blue').trim(),
      purple:root.getPropertyValue('--space-purple').trim()
     };
    });
    assert.equal(saturated.brand,'rgb(255, 229, 0)','Bright yellow accent required');
    assert.equal(saturated.length,'rgb(247, 248, 255)','Neutral HUD numbers should not create a rainbow');
    assert.equal(saturated.rank,'rgb(255, 229, 0)','Leaderboard rank should be highlighted in gold');
    assert.equal(saturated.timer,'rgb(224, 229, 248)');
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
     assert.equal(await page.locator('#worm-pause').evaluate(el=>getComputedStyle(el).borderTopColor),
      'rgb(40, 96, 255)','Blue pause button must glow blue');
     await page.locator('#worm-boost').hover();
     assert.equal(await page.locator('#worm-boost').evaluate(el=>getComputedStyle(el).borderTopColor),
      'rgb(255, 23, 68)','Red boost button must glow red, not purple');
    }
    await page.evaluate(()=>{window.InfinityWormsQA.testProtection(90);window.InfinityWormsQA.freezeRealtime(true);});
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
    const pausePosition=await page.locator('#worm-pause').evaluate(el=>el.getBoundingClientRect().top);
    assert.ok(pausePosition>height*.58,'Pause should be with bottom gameplay buttons instead of at the top');
    await page.locator('#worm-pause').click();
    assert.equal(await page.locator('#worm-pause-overlay').isVisible(),true);
    assert.equal(await page.locator('#worm-exit').textContent(),'ВЫХОД В МЕНЮ');
    // Pause is now a live-world overlay: rival worms and match time keep moving
    // while the player remains protected and the UI is interactive.
    const pausedStart=await page.evaluate(()=>window.InfinityWormsQA.snapshot());
    await page.waitForTimeout(350);
    const pausedEnd=await page.evaluate(()=>window.InfinityWormsQA.snapshot());
    assert.equal(pausedEnd.state,'paused');
    assert.ok(pausedEnd.time>pausedStart.time,
      'Opening pause must not freeze the surrounding universe');
    assert.equal(pausedEnd.resultVisible,false);
    assert.equal(await page.locator('#worm-pause-sound').count(),1);
    await page.locator('#worm-skins-open').click();
    assert.equal(await page.locator('.ws-overlay').isVisible(),true,'Separate skin editor must open from pause');
    assert.equal(await page.locator('.ws-preset').count(),16);
    assert.equal(await page.locator('.ws-preset-worm i').count(),0,
      'Premade cosmic skins must be seamless silhouettes, not circles');
    assert.ok(await page.locator('.ws-preset-worm').first().evaluate(el=>
      getComputedStyle(el).backgroundImage.includes('linear-gradient')),
      'Preset preview must show a continuous skin gradient');
    assert.equal(await page.locator('.ws-bead').count(),64,'All 64 segment colors can be customized');
    assert.equal(await page.locator('.ws-preview-canvas').isVisible(),true,'Live moving worm preview should be visible');
    await page.waitForFunction(()=>{const c=document.querySelector('.ws-preview-canvas');if(!c)return false;const p=c.getContext('2d').getImageData(700,80,80,70).data;return p.some((v,i)=>i%4!==3&&v>150)},null,{timeout:5000});
    assert.equal(await page.locator('.ws-advanced-summary').isVisible(),true,'Advanced body painter toggle exists');
    assert.equal(await page.locator('.ws-head-choice').count(),6,'All six cosmic head designs must be available');
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
    // The camera-distance slider was deliberately removed: camera changes
    // are now small gestures directly on the live playfield.
    assert.equal(await page.locator('#worm-setting-zoom').count(),0);
    assert.equal(await page.locator('#worm-zoom-value').count(),0);
    assert.equal(await page.locator('#worm-settings-sound').count(),1);
    assert.equal(await page.locator('#worm-settings-skins').count(),1);
    if(width>=1280){
     await page.locator('#worm-settings-back').hover();
     await page.waitForTimeout(220);
     const style=await page.locator('#worm-settings-back').evaluate(el=>{
      const cs=getComputedStyle(el);return {border:cs.borderTopColor,glow:cs.boxShadow};
     });
     assert.equal(style.border,'rgb(197, 165, 255)',
      'Settings save button must use the new purple accent, not old amber');
     assert.ok(style.glow!=='none'&&style.glow.includes('rgb('),
      'Settings save button must retain a visible hover glow');
    }
    await page.locator('#worm-setting-glow').uncheck({force:true});
    await page.locator('#worm-setting-names').uncheck({force:true});
    const audioBefore=await page.locator('#worm-settings-sound').getAttribute('aria-pressed');
    await page.locator('#worm-settings-sound').click();
    assert.notEqual(await page.locator('#worm-settings-sound').getAttribute('aria-pressed'),audioBefore,
      'Settings sound button toggles the persisted audio setting');
    assert.equal(await page.locator('#worm-pause-sound').getAttribute('aria-pressed'),
      await page.locator('#worm-settings-sound').getAttribute('aria-pressed'),
      'Settings and pause must share a single audio toggle');
    await page.locator('#worm-settings-back').click();
    assert.equal(await page.locator('#worm-pause-overlay').isVisible(),true,'Settings Back must return to pause');
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
    await page.evaluate(()=>window.InfinityWormsQA.forceDeath());
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
