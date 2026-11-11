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
    assert.equal(a.world.w,22400);assert.equal(a.world.h,17200);
    assert.ok(a.worms>=50&&a.food>=19500,'Expanded universe needs plentiful food and smart rivals');
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
    a=await page.evaluate(()=>window.InfinityWormsQA.snapshot());
    await page.evaluate(()=>window.InfinityWormsQA.setHeading(2.2));
    await page.waitForTimeout(75);
    const instant=await page.evaluate(()=>window.InfinityWormsQA.snapshot());
    assert.ok(Math.abs(instant.angle-2.2)<.00001,'Worm heading should change instantly without a turn radius');
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
    await page.locator('#worm-result').waitFor({state:'visible',timeout:5000});
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
    console.log('PASS: expanded Cosmic Worms world, food density, no-overlap respawn, instant turns, full corpse drops, eight skins, visual settings, game flow at '+width+'x'+height);
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
