// Real-Chromium coverage for the Cosmic Worms mode and its six-mode integration.
'use strict';
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
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
    assert.equal(a.world.w,22400);assert.equal(a.world.h,22400);
    assert.equal(a.world.rx,a.world.ry,'Arena boundary must be a circle');
    assert.ok(a.worms>=50&&a.food>=27500,'Circular arena must keep rich food density and bots');
    assert.ok(a.food/(Math.PI*a.world.rx*a.world.ry)>720/(Math.PI*2630*1970),'Food density must increase, not fall with map growth');
    const clearance=await page.evaluate(()=>window.InfinityWormsQA.spawnProbe());
    assert.equal(clearance.safe,true,'No bot can appear inside an existing worm body: '+JSON.stringify(clearance));
    assert.equal((await page.evaluate(()=>window.InfinityWormsQA.skins())).length,8);
    assert.equal(a.guideOpen,true,'First launch must explain mechanics');
    assert.equal(await page.locator('#worm-guide-counter').textContent(),'01 / 03');
    await page.locator('#worm-guide-next').click();
    await page.locator('#worm-guide-next').click();
    await page.locator('#worm-guide-next').click();
    await page.waitForFunction(()=>window.InfinityWormsQA.snapshot().state==='playing');
    const styles=await page.evaluate(()=>window.InfinityWormsQA.botStyles());
    for(const role of ['afk','newcomer','casual','cautious','hunter','veteran','pro','reckless']){
     assert.ok(styles[role]>=2,'Missing realistic bot behavior: '+role);
    }
    const botsBefore=await page.evaluate(()=>window.InfinityWormsQA.bots());
    await page.waitForTimeout(550);
    const botsAfter=await page.evaluate(()=>window.InfinityWormsQA.bots());
    const beforeById=new Map(botsBefore.map(b=>[b.id,b]));
    const afkBots=botsAfter.filter(b=>b.persona==='afk'&&b.alive&&beforeById.get(b.id)?.alive);
    const activeBots=botsAfter.filter(b=>b.persona==='pro'&&b.alive&&beforeById.get(b.id)?.alive);
    assert.ok(afkBots.length>=2&&activeBots.length>=2,'Need both AFK and active pro bots');
    for(const b of afkBots){
     const before=beforeById.get(b.id);
     assert.ok(Math.hypot(b.x-before.x,b.y-before.y)<.0001,'AFK bot must stand still');
    }
    assert.ok(activeBots.some(b=>{
     const before=beforeById.get(b.id);
     return Math.hypot(b.x-before.x,b.y-before.y)>20;
    }),'Professional bots should actively move while AFK players stand still');
    assert.ok(new Set(botsAfter.filter(b=>b.alive).map(b=>Math.round(b.reaction*100))).size>=8,
     'Different rivals must have different reaction times');
    a=await page.evaluate(()=>window.InfinityWormsQA.snapshot());
    const targetAngle=a.angle+Math.PI;
    await page.evaluate(v=>window.InfinityWormsQA.setHeading(v),targetAngle);
    await page.waitForTimeout(75);
    const turning=await page.evaluate(()=>window.InfinityWormsQA.snapshot());
    const distanceToTarget=v=>Math.abs(Math.atan2(Math.sin(targetAngle-v.angle),Math.cos(targetAngle-v.angle)));
    assert.ok(distanceToTarget(turning)>.20,'Turn radius should prevent instantaneous 180-degree snapping');
    assert.ok(distanceToTarget(turning)<Math.PI-.15,'Worm must begin turning promptly');
    await page.waitForTimeout(330);
    const completed=await page.evaluate(()=>window.InfinityWormsQA.snapshot());
    assert.ok(distanceToTarget(completed)<.14,'Small turn radius should finish the turn quickly');
    assert.ok(a.length>=18,'Worm begins with an actual segmented body');
    await page.evaluate(()=>window.InfinityWormsQA.giveFood(60));
    await page.waitForTimeout(160);
    const growth=await page.evaluate(()=>window.InfinityWormsQA.snapshot());
    assert.ok(growth.mass>a.mass+50&&growth.length>a.length,'Mass pickup must grow tail');
    await page.evaluate(()=>window.InfinityWormsQA.setMass(1000));
    await page.waitForTimeout(700);
    const large=await page.evaluate(()=>window.InfinityWormsQA.snapshot().zoom);
    await page.evaluate(()=>window.InfinityWormsQA.setMass(60));
    await page.waitForTimeout(700);
    const small=await page.evaluate(()=>window.InfinityWormsQA.snapshot().zoom);
    assert.ok(small>large,'Growing must zoom camera out');
    await page.keyboard.down('Space');
    await page.waitForTimeout(170);
    assert.equal(await page.evaluate(()=>window.InfinityWormsQA.snapshot().boosting),true,'Space enables boosting');
    await page.keyboard.up('Space');
    const corpse=await page.evaluate(()=>window.InfinityWormsQA.forceBotDeath());
    assert.ok(corpse&&corpse.dropped>=corpse.segments*2,'Food must drop all along a defeated worm body');
    await page.locator('#worm-pause').click();
    assert.equal(await page.locator('#worm-pause-overlay').isVisible(),true);
    assert.equal(await page.locator('#worm-exit').textContent(),'ВЫХОД В МЕНЮ');
    await page.locator('#worm-settings-open').click();
    assert.equal(await page.locator('#worm-settings').isVisible(),true);
    assert.equal(await page.locator('#worm-skin-grid button').count(),8);
    assert.equal(await page.locator('.worm-skin-preview .worm-preview-stars').count(),8);
    assert.equal(await page.locator('.worm-skin-preview .worm-preview-comet').count(),8);
    assert.equal(await page.locator('.worm-preview-comet').first().evaluate(el=>
     getComputedStyle(el).animationName.includes('worm-preview-comet')),true,
     'All cosmic skin previews must show moving comets');
    await page.locator('#worm-skin-grid [data-skin="aurora"]').click();
    assert.equal(await page.evaluate(()=>window.InfinityWormsQA.snapshot().skin),'aurora');
    await page.locator('#worm-setting-glow').uncheck({force:true});
    await page.locator('#worm-setting-names').uncheck({force:true});
    await page.locator('#worm-setting-zoom').evaluate(el=>{el.value='120';el.dispatchEvent(new Event('input',{bubbles:true}));});
    assert.equal(await page.locator('#worm-zoom-value').textContent(),'120%');
    await page.locator('#worm-settings-back').click();
    assert.equal(await page.locator('#worm-pause-overlay').isVisible(),true,'Settings Back must return to pause');
    await page.locator('#worm-open-guide').click();
    assert.equal(await page.locator('#worm-guide').isVisible(),true);
    await page.locator('#worm-guide-skip').click();
    assert.equal(await page.locator('#worm-pause-overlay').isVisible(),true,'Guide returns to pause');
    await page.locator('#worm-resume').click();
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
    await page.locator('#worm-result').waitFor({state:'visible',timeout:6000});
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
    await page.waitForFunction(()=>window.InfinityWormsQA.snapshot().state==='playing');
    const res=await page.evaluate(()=>{
     const canv=document.getElementById('worm-field'),r=canv.getBoundingClientRect();
     return {width:canv.width,height:canv.height,rect:[r.left,r.top,r.right,r.bottom],doc:document.documentElement.scrollWidth};
    });
    assert.ok(res.width>0&&res.height>0,'Canvas must render');
    assert.ok(res.doc<=width+2,'Document must not overflow viewport');
    await page.locator('#worm-pause').click();
    await page.locator('#worm-exit').click();
    await page.waitForURL(/index\.html\?select=worms/,{timeout:9000});
    await page.locator('#hub-mode-story').waitFor({state:'visible',timeout:20000});
    assert.equal(await page.locator('.hub-mode-dots button').count(),6);
    assert.match(await page.locator('.hub-mode-story-title').textContent(),/Космические черви/);
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
