// Real Chromium check for the four cosmic .io modes and shared Infinity Space artwork.
// Prevents shipping blank canvases, missing controls or runtime errors.
'use strict';
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const base=process.env.INFINITI_SMOKE_URL||'http://127.0.0.1:8765';
const modeNames=['arena','royale','core','race'];
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader-webgl']});
 const context=await browser.newContext({viewport:{width:1280,height:720},deviceScaleFactor:1});
 const page=await context.newPage();
 const errors=[];
 page.on('pageerror',e=>errors.push(String(e.stack||e)));
 try{
  await page.goto(base+'/cosmic-arena.html',{waitUntil:'domcontentloaded',timeout:45000});
  await page.locator('#menu .mode[data-mode="arena"]').waitFor({state:'visible',timeout:15000});
  assert.equal(await page.locator('#menu .mode[data-mode]').count(),4);
  assert.equal(await page.locator('#menu .mode-gallery-endless').count(),1);
  await page.waitForFunction(()=>{
   const c=document.querySelector('.mode-preview-art');
   if(!c)return false;
   const d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;
   let pixels=0;
   for(let i=0;i<d.length;i+=1812)if(d[i]+d[i+1]+d[i+2]>70)pixels++;
   return pixels>55;
  },null,{timeout:12000});
  await page.locator('#mode-next').click();
  await page.waitForFunction(()=>document.getElementById('menu')?.dataset.selection==='royale',null,{timeout:7000});
  assert.equal(await page.locator('#mode-page-indicator').innerText().then(x=>x.includes('02')),true);
  await page.locator('#mode-carousel-viewport').focus();
  await page.keyboard.press('ArrowRight');
  await page.waitForFunction(()=>document.getElementById('menu')?.dataset.selection==='core',null,{timeout:7000});
  await page.locator('#mode-prev').click();
  await page.waitForFunction(()=>document.getElementById('menu')?.dataset.selection==='royale',null,{timeout:7000});
  console.log('PASS: illustrated carousel changes mode backgrounds and supports arrow navigation');
  console.log('PASS: selection screen includes all competitive modes and endless universe');
  for(const mode of modeNames){
   await page.goto(base+'/cosmic-arena.html?mode='+mode,{waitUntil:'domcontentloaded',timeout:45000});
   await page.waitForFunction(()=>document.querySelector('#hud:not([hidden])')&&Number(document.querySelector('#mass')?.textContent)>0,null,{timeout:18000});
   await page.waitForTimeout(900);
   const stage=await page.locator('#arena-stage-name').textContent();
   assert.equal(stage==='Cosmic Dust'||stage==='Космическая пыль',true,mode+' must not skip its initial evolution stage');
   assert.equal(await page.locator('#arena-stage-bar').count(),1);
   const sample=await page.evaluate(()=>{
    const cvs=document.getElementById('arena'),c=cvs.getContext('2d');
    const w=cvs.width,h=cvs.height,arr=c.getImageData(0,0,w,h).data;
    let bright=0,dark=0,nonblack=0;
    for(let y=0;y<h;y+=17)for(let x=0;x<w;x+=17){
     const i=(y*w+x)*4,r=arr[i],g=arr[i+1],b=arr[i+2];
     if(r+g+b>90)bright++;if(r+g+b<50)dark++;
     if(r+g+b>15)nonblack++;
    }
    return {bright,dark,nonblack,width:w,height:h};
   });
   assert.ok(sample.bright>15&&sample.dark>80&&sample.nonblack>50,
    mode+' must render a detailed space scene rather than a blank or white canvas: '+JSON.stringify(sample));
   await page.keyboard.press('KeyE');await page.keyboard.press('Space');await page.keyboard.press('KeyQ');
   await page.locator('#pause').click();
   assert.equal(await page.locator('#paused').isVisible(),true,mode+' pause opens');
   await page.locator('#resume').click();
   assert.equal(await page.locator('#paused').isVisible(),false,mode+' pause closes');
   assert.equal(errors.length,0,mode+' page errors: '+errors.join('\n'));
   console.log('PASS: '+mode+' black-space artwork, visible matter, ability input, pause and resume');
  }
  const mobileContext=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:1});
  const mobile=await mobileContext.newPage();
  mobile.on('pageerror',e=>errors.push(String(e.stack||e)));
  await mobile.goto(base+'/cosmic-arena.html',{waitUntil:'domcontentloaded'});
  await mobile.locator('.mode[data-mode="race"]').waitFor({state:'visible'});
  assert.equal(await mobile.locator('.mode[data-mode="race"]').isVisible(),true);
  const layout=await mobile.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth}));
  assert.ok(layout.scroll<=layout.width+2,'No mobile horizontal overflow: '+JSON.stringify(layout));
  await mobile.locator('.mode[data-mode="arena"]').click();
  await mobile.locator('#hud:not([hidden])').waitFor({state:'visible'});
  assert.equal(await mobile.locator('#touch-stick').isVisible(),true);
  await mobileContext.close();
  assert.equal(errors.length,0,'No page errors: '+errors.join('\n'));
  console.log('PASS: mobile mode selector and touch joystick');
 }finally{await browser.close()}
})().catch(error=>{console.error(error.stack||error);process.exitCode=1});
