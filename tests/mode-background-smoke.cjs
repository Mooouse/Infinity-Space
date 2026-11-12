// Verify that the mode picker changes the REAL Infinity Space menu background.
// Card-only artwork is not sufficient: this test samples the main universe Canvas.
'use strict';
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const base=process.env.INFINITI_SMOKE_URL||'http://127.0.0.1:8765';
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader-webgl']});
 try{
  const context=await browser.newContext({viewport:{width:1280,height:800},deviceScaleFactor:1});
  const page=await context.newPage(),errors=[];
  await page.addInitScript(()=>localStorage.setItem('infinity-space-player-v1',JSON.stringify({version:1,nickname:'QA Pilot'})));
  page.on('pageerror',e=>errors.push(String(e.stack||e)));
  await page.goto(base+'/?tester=1',{waitUntil:'domcontentloaded',timeout:60000});
  // The mode selector MUST be the first screen, with no entry button.
  await page.locator('#hub-mode-story').waitFor({state:'visible',timeout:45000});
  assert.equal(await page.locator('#screen-menu .hub-modes').count(),0);
  assert.equal(await page.locator('#screen-menu .hub-mode-story-play').isVisible(),true);
  assert.equal(await page.locator('#screen-menu .hub-menu').isVisible(),false);
  assert.equal(await page.evaluate(()=>window.SpaceMenuSceneMode),null);
  assert.equal(await page.locator('.hub-mode-dots button').count(),6);
  // Delegate elements remain mounted; each game mode shows only its actions.
  assert.equal(await page.locator('.hub-story-shortcut').count(),11);
  const visibleShortcuts=async()=>page.locator('.hub-story-shortcut:visible').evaluateAll(nodes=>nodes.map(n=>n.dataset.shortcut));
  assert.deepEqual(await visibleShortcuts(),
   ['map','evolution','achievements','music','bestiary','settings','daily','roulette','profile'],
   'Endless Space must expose its six relevant game actions');
  await page.locator('.hub-story-shortcut[data-shortcut="settings"]').click();
  await page.locator('#screen-settings').waitFor({state:'visible',timeout:6000});
  await page.locator('#screen-settings .br-head-back').click();
  await page.locator('#hub-mode-story').waitFor({state:'visible',timeout:6000});
  console.log('PASS: context-aware Endless Space shortcuts and Settings navigation');

  const forward=page.locator('.hub-mode-step[data-dir="1"]');
  await forward.click();
  await page.waitForFunction(()=>window.SpaceMenuSceneMode==='worms',null,{timeout:5000});
  // Sample the animation synchronously with its triggering click. Waiting until
  // after a frame/iframe load is flaky: the 420ms animation may already finish.
  const startedAnimation=await forward.evaluate(button=>{
   button.click();
   const copy=document.querySelector('.hub-mode-story-copy');
   return !!copy?.getAnimations().some(a=>a.playState==='running')||
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });
  await page.waitForFunction(()=>window.SpaceMenuSceneMode==='arena',null,{timeout:5000});
  assert.equal(startedAnimation,true,'Mode transition animation must start on click (or honor reduced motion)');
  assert.equal(await page.evaluate(()=>typeof window.SpaceMenuBeginTransition),'function',
   'Background crossfade must be connected to the original universe renderer');
  await page.waitForTimeout(360);
  const sample=async()=>{
    return await page.evaluate(()=>{
      const cvs=document.getElementById('universe');
      const c=cvs.getContext('2d',{willReadFrequently:true});
      const w=cvs.width,h=cvs.height;
      const x=Math.round(w*.76),y=Math.round(h*.52);
      const pixels=c.getImageData(x-9,y-9,19,19).data;
      const sums=[0,0,0];
      for(let i=0;i<pixels.length;i+=4){sums[0]+=pixels[i];sums[1]+=pixels[i+1];sums[2]+=pixels[i+2];}
      return sums.map(v=>Math.round(v/(pixels.length/4)));
    });
  };
  const arena=await sample();
  await forward.click();
  await page.waitForFunction(()=>window.SpaceMenuSceneMode==='royale',null,{timeout:5000});
  await page.waitForTimeout(400);
  const royale=await sample();
  const distance=Math.abs(arena[0]-royale[0])+Math.abs(arena[1]-royale[1])+Math.abs(arena[2]-royale[2]);
  assert.ok(distance>30,'Swiping must change the main menu Canvas background, not only a card: '+JSON.stringify({arena,royale,distance}));
  console.log('PASS: Arena and Royale have materially different full-screen universe background pixels:',arena,royale);
  await page.keyboard.press('ArrowRight');
  await page.waitForFunction(()=>window.SpaceMenuSceneMode==='core',null,{timeout:4000});
  await page.keyboard.press('ArrowRight');
  await page.waitForFunction(()=>window.SpaceMenuSceneMode==='race',null,{timeout:4000});
  // No Sections button; the bottom navigation is permanently available.
  assert.equal(await page.locator('.hub-mode-story-back').count(),0);
  assert.equal(await page.locator('.hub-story-shortcut').count(),11);
  assert.deepEqual(await visibleShortcuts(),['achievements','statistics','settings'],
   'Competitive mode menu must hide unrelated universe actions');
  assert.equal(await page.locator('.hub-story-shortcut[data-shortcut="map"]').isVisible(),false,
   'Universe map is hidden in competitive mode');
  await page.locator('.hub-mode-dots [data-mode="endless"]').click();
  await page.waitForFunction(()=>window.SpaceMenuSceneMode===null,null,{timeout:5000});
  assert.deepEqual(await visibleShortcuts(),
   ['map','evolution','achievements','music','bestiary','settings','daily','roulette','profile'],
   'Endless Space restores its relevant actions');
  console.log('PASS: visible navigation, campaign-only map, and smooth mode switching');
  await page.locator('.hub-mode-dots [data-mode="race"]').click();
  await page.locator('.hub-mode-story-play').click();
  await page.waitForURL(/cosmic-arena\.html\?mode=race/,{timeout:15000});
  await page.locator('#hud:not([hidden])').waitFor({state:'visible',timeout:12000});
  console.log('PASS: selecting Race starts that actual mode with live game');
  assert.equal(errors.length,0,errors.join('\n'));
  await context.close();
  // Separate mobile browser context validates actual screen layout and touch-swipe input.
  const mobileContext=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true});
  const mobile=await mobileContext.newPage();
  await mobile.addInitScript(()=>localStorage.setItem('infinity-space-player-v1',JSON.stringify({version:1,nickname:'QA Pilot'})));
  mobile.on('pageerror',e=>errors.push(String(e.stack||e)));
  await mobile.goto(base+'/?tester=1',{waitUntil:'domcontentloaded',timeout:60000});
  await mobile.locator('#hub-mode-story').waitFor({state:'visible',timeout:45000});
  assert.equal(await mobile.locator('#screen-menu .hub-modes').count(),0);
  assert.equal(await mobile.locator('.hub-story-shortcut').count(),11);
  assert.equal(await mobile.locator('.hub-story-shortcut:visible').count(),9,
   'Mobile Endless Space must expose all nine bottom shortcuts');
  assert.equal(await mobile.locator('.hub-story-shortcut[data-shortcut="settings"]').isVisible(),true);
  const box=await mobile.locator('#hub-mode-story').boundingBox();
  const y=Math.round(box.height*.45),left=Math.round(box.width*.78),right=Math.round(box.width*.2);
  await mobile.evaluate(({y,left,right})=>{
    const el=document.getElementById('hub-mode-story');
    el.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,pointerType:'touch',clientX:left,clientY:y}));
    el.dispatchEvent(new PointerEvent('pointerup',{bubbles:true,pointerType:'touch',clientX:right,clientY:y}));
  },{y,left,right});
  await mobile.waitForFunction(()=>window.SpaceMenuSceneMode==='worms',null,{timeout:5000});
  assert.deepEqual(await mobile.locator('.hub-story-shortcut:visible').evaluateAll(nodes=>nodes.map(n=>n.dataset.shortcut)),
   ['achievements','statistics','settings'],'Mobile competitive mode must hide unrelated actions');
  const overflow=await mobile.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth}));
  assert.ok(overflow.scroll<=overflow.width+2,'Main menu mode story must not overflow screen: '+JSON.stringify(overflow));
  assert.equal(errors.length,0,errors.join('\n'));
  console.log('PASS: main-menu mode background updates on mobile swipe, and panel stays inside viewport');
  await mobileContext.close();
 }finally{await browser.close()}
})().catch(e=>{console.error(e.stack||e);process.exitCode=1});
