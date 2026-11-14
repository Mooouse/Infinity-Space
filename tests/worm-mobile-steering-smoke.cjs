// Mobile release QA: fixed/floating/touch steering, compact controls, dialog layering,
// and independent desktop/mobile settings in the shipped one-file build.
'use strict';
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const base=process.env.INFINITI_SMOKE_URL||'http://127.0.0.1:8767';
(async()=>{
 const browser=await chromium.launch({headless:true,args:[
  '--no-sandbox','--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader-webgl'
 ]});
 try{
  for(const dimensions of [{width:390,height:844},{width:844,height:390}]){
   const page=await browser.newPage({viewport:dimensions,isMobile:true,hasTouch:true});
   const errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   await page.addInitScript(()=>{
    localStorage.setItem('infiniti-space-language','ru');
    localStorage.setItem('infinity-space-player-v1',JSON.stringify({version:1,nickname:'Worm Mobile QA'}));
    localStorage.setItem('infinity-space-worms-settings-v2',
      JSON.stringify({controlMode:'keys',mobileControlMode:'floating'}));
   });
   await page.goto(base+'/index.html',{waitUntil:'domcontentloaded',timeout:60000});
   await page.waitForFunction(()=>typeof window.SpaceOpenMode==='function',{timeout:30000});
   await page.evaluate(()=>window.SpaceOpenMode('worms'));
   await page.waitForURL(url=>url.protocol==='blob:',{timeout:30000});
   await page.locator('#worm-guide-skip').waitFor({state:'visible',timeout:35000});
   assert.equal(await page.locator('#mode-music-open').evaluate(el=>getComputedStyle(el).visibility),'hidden',
      'Music must not sit above the initial guide');

   await page.locator('#worm-guide-skip').click();
   await page.waitForFunction(()=>document.querySelector('#worm-guide')?.hidden===true,
      null,{timeout:15000});
   assert.equal(await page.locator('#mode-music-open').evaluate(el=>getComputedStyle(el).visibility),'visible',
      'Music button should show only in active gameplay');
   const geometry=await page.evaluate(()=>{
    const ids=['mode-music-open','worm-pause','worm-boost'];
    return ids.map(id=>{const r=document.getElementById(id).getBoundingClientRect();
     return {id,width:r.width,height:r.height,x:r.x,y:r.y,right:r.right,bottom:r.bottom};});
   });
   assert.ok(geometry.every(g=>g.width<=49&&g.height<=49&&Math.abs(g.width-g.height)<1),
    'Every touch button should be compact and square: '+JSON.stringify(geometry));
   for(let i=0;i<geometry.length;i++)for(let j=i+1;j<geometry.length;j++){
    const a=geometry[i],b=geometry[j];
    assert.ok(a.right<=b.x||b.right<=a.x||a.bottom<=b.y||b.bottom<=a.y,
      'Touch buttons overlap: '+JSON.stringify([a,b]));
   }

   assert.equal(await page.evaluate(()=>document.documentElement.dataset.wormControl),'floating');
   const canvas=page.locator('#worm-field');
   await page.evaluate(()=>{
    const e=document.querySelector('#worm-field');
    const opts={bubbles:true,pointerType:'touch',pointerId:71,isPrimary:true};
    e.dispatchEvent(new PointerEvent('pointerdown',{...opts,clientX:innerWidth*.72,clientY:innerHeight*.57}));
    e.dispatchEvent(new PointerEvent('pointermove',{...opts,clientX:innerWidth*.72+32,clientY:innerHeight*.57+14}));
   });
   assert.equal(await page.locator('#worm-stick').evaluate(el=>el.classList.contains('floating-active')),true,
      'Floating joystick must appear under a touch');
   assert.equal(await page.locator('#worm-stick').evaluate(el=>getComputedStyle(el).visibility),'visible');
   assert.notEqual(await page.locator('#worm-thumb').evaluate(el=>el.style.transform),'translate(0,0)',
      'Floating stick must respond to dragging');
   await page.evaluate(()=>{
    document.querySelector('#worm-field').dispatchEvent(new PointerEvent('pointerup',{
     bubbles:true,pointerType:'touch',pointerId:71,clientX:innerWidth*.72+32,clientY:innerHeight*.57+14
    }));
   });
   assert.equal(await page.locator('#worm-stick').evaluate(el=>el.classList.contains('floating-active')),false,
      'Floating joystick must disappear after release');

   await page.locator('#worm-pause').click();
   await page.locator('#worm-pause-overlay').waitFor({state:'visible',timeout:10000});
   assert.equal(await page.locator('#mode-music-open').evaluate(el=>getComputedStyle(el).visibility),'hidden',
    'Music must not sit above the pause screen');
   await page.locator('#worm-settings-open').click();
   await page.locator('#worm-settings').waitFor({state:'visible',timeout:10000});
   const settings=page.frameLocator('#worm-settings-frame');
   await settings.locator('#set-worm-mobile-control').waitFor({state:'attached',timeout:30000});
   assert.equal(await settings.locator('#set-worm-mobile-control').inputValue(),'floating',
     'Phone preference must be loaded independently');
   assert.equal(await settings.locator('#set-worm-control').inputValue(),'keys',
     'Desktop preference must remain unchanged');
   await settings.locator('#set-worm-mobile-control').selectOption('fixed');
   await page.waitForFunction(()=>document.documentElement.dataset.wormControl==='fixed',
     null,{timeout:10000});
   assert.equal(await settings.locator('#set-worm-control').inputValue(),'keys');
   assert.equal(await page.locator('#worm-stick').evaluate(el=>getComputedStyle(el).visibility),'visible',
     'Fixed joystick must remain visible on the right');
   await settings.locator('#set-worm-mobile-control').selectOption('touch');
   await page.waitForFunction(()=>document.documentElement.dataset.wormControl==='touch',
     null,{timeout:10000});
   assert.equal(await page.locator('#worm-stick').evaluate(el=>getComputedStyle(el).display),'none',
     'Touch-direction mode should hide the joystick');
   await settings.locator('#set-worm-mobile-control').selectOption('floating');
   await page.waitForFunction(()=>document.documentElement.dataset.wormControl==='floating',
     null,{timeout:10000});
   assert.equal(await page.locator('#mode-music-open').evaluate(el=>getComputedStyle(el).visibility),'hidden',
     'Music must not sit above Settings');
   assert.deepEqual(errors,[],errors.join('\n'));
   console.log('PASS mobile Worms '+dimensions.width+'x'+dimensions.height+
    ': controls, floating stick, independent preferences and modal layering');
   await page.close();
  }
 }finally{await browser.close()}
})().catch(e=>{console.error(e.stack||e);process.exitCode=1;});
