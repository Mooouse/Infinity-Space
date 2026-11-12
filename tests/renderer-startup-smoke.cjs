// Fast smoke gate: catch renderer-only ReferenceErrors before the 10-minute UI suite.
// The canvas rAF loop executes even while the first-run guide is displayed.
'use strict';
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const base=process.env.INFINITI_SMOKE_URL||'http://127.0.0.1:8765';
(async()=>{
 const browser=await chromium.launch({headless:true,args:[
  '--no-sandbox','--disable-dev-shm-usage',
  '--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader-webgl'
 ]});
 try{
  const context=await browser.newContext({viewport:{width:390,height:740},deviceScaleFactor:1});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',err=>errors.push(String(err.stack||err)));
  await page.goto(base+'/cosmic-worms.html?tester=1',{waitUntil:'domcontentloaded',timeout:25000});
  await page.waitForFunction(()=>!!window.InfinityWormsQA?.snapshot()?.world,null,{timeout:16000});
  await page.waitForTimeout(1200);
  const state=await page.evaluate(()=>{
   const canvas=document.querySelector('#worm-field');
   return {width:canvas?.width,height:canvas?.height,
    worms:window.InfinityWormsQA.snapshot().worms,
    framesVisible:!!canvas?.getContext('2d')};
  });
  assert.ok(state.framesVisible&&state.width>0&&state.height>0&&state.worms>=30,
   'Worm canvas and game model must initialize: '+JSON.stringify(state));
  assert.equal(errors.length,0,'Worm animation frame threw: '+errors.slice(0,3).join('\n'));
  console.log('PASS: real Worms canvas frames run without runtime ReferenceError');
  await context.close();
 }finally{await browser.close();}
})().catch(err=>{console.error(err.stack||err);process.exitCode=1;});
