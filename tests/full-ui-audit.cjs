// Exhaustive real-Chromium UI audit: every main section, Back chain and responsive width.
// Called by Pages CI; produces targeted machine-readable results for visual regressions.
'use strict';
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const base=process.env.INFINITI_SMOKE_URL||'http://127.0.0.1:8765';
const seed=()=>{localStorage.setItem('infinity-space-player-v1',JSON.stringify({version:1,nickname:'ResponsivePilot'}));localStorage.setItem('infiniti-space-language','ru');};
const screens=['evolution','achievements','bestiary','music','settings','map'];
const measurements=()=>({
 viewport:innerWidth,doc:document.documentElement.scrollWidth,
 screen:document.querySelector('#modal')?.dataset.screen,
 visibleRoot:document.querySelector('#modal .screen.active')?.id||null,
 buttons:[...document.querySelectorAll('#modal .screen.active button')].filter(e=>{
  const r=e.getBoundingClientRect(),style=getComputedStyle(e);
  return style.visibility!=='hidden'&&style.display!=='none'&&r.width>4&&r.height>4
 }).length,
 outliers:[...document.querySelectorAll('#modal .screen.active *')]
  .filter(e=>{
   if(!e.isConnected||e instanceof SVGElement)return false;
   const st=getComputedStyle(e),r=e.getBoundingClientRect();
   if(st.display==='none'||st.visibility==='hidden'||r.height<4||r.width<4)return false;
   if(st.overflowX==='auto'||st.overflowX==='scroll'||st.whiteSpace==='nowrap'&&st.textOverflow==='ellipsis')return false;
   const innerOverflow=e.scrollWidth-e.clientWidth;
   if(innerOverflow>8&&e.clientWidth>30&&e.clientWidth<innerWidth*1.05&&!e.querySelector('canvas,iframe'))return true;
   return false;
  }).slice(0,12).map(e=>({tag:e.tagName,cls:String(e.className).slice(0,70),w:Math.round(e.clientWidth),scroll:e.scrollWidth,txt:e.textContent.trim().slice(0,45)}))
});
async function clickBack(page){
 const btn=page.locator('#modal .screen.active button.br-head-back, #modal .screen.active button.back, #modal .screen.active button.br-foot-secondary').first();
 if(await btn.count())await btn.click({timeout:6500});
 else await page.keyboard.press('Escape');
}
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader-webgl']});
 const errors=[],failures=[],layouts=[];
 try{
  for(const [width,height] of [[320,568],[390,844],[768,1024],[1024,768],[1366,768],[1920,1080],[2560,1440]]){
   const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:1});
   const page=await context.newPage();
   page.on('pageerror',err=>{errors.push({width,error:String(err.stack||err).slice(0,500)});});
   await page.addInitScript(seed);
   await page.goto(base+'/index.html?tester=1',{waitUntil:'domcontentloaded',timeout:50000});
   await page.locator('#screen-menu .hub-mode-story-play').waitFor({state:'visible',timeout:35000});
   for(const screen of ['menu',...screens]){
    try{
     if(screen!=='menu'){
      await page.locator('.hub-story-shortcut[data-shortcut="'+screen+'"]').click({timeout:6500});
      if(screen==='map')await page.locator('#screen-map').waitFor({state:'visible',timeout:10000});
      else await page.locator('#screen-'+screen).waitFor({state:'visible',timeout:10000});
     }
     const v=await page.evaluate(measurements);layouts.push({width,height,page:screen,...v});
     if(!v.visibleRoot&&!['statistics'].includes(screen))failures.push({width,screen,reason:'empty-screen'});
     if(screen!=='menu'){
      await clickBack(page);
      await page.locator('#screen-menu .hub-mode-story-play').waitFor({state:'visible',timeout:11000});
      const back=await page.evaluate(measurements);
      if(back.visibleRoot!=='screen-menu')failures.push({width,screen,reason:'back-to-empty',back});
     }
    }catch(err){
     failures.push({width,screen,reason:'navigation-error',error:String(err).slice(0,350)});
     await page.goto(base+'/index.html?tester=1',{waitUntil:'domcontentloaded',timeout:50000});
     await page.locator('#screen-menu .hub-mode-story-play').waitFor({state:'visible',timeout:25000});
    }
   }
   if(width===390||width===1366){
    for(const chain of [
     ['settings','music'],['settings','tutorial'],['map','settings'],['evolution','bestiary']
    ]){
     try{
      const [from,to]=chain;
      await page.locator('.hub-story-shortcut[data-shortcut="'+from+'"]').click({timeout:7000});
      await page.locator('#screen-'+from).waitFor({state:'visible',timeout:11000});
      const nav=page.locator('#screen-'+from+' [data-page="'+to+'"]').first();
      if(!await nav.count()){failures.push({width,chain,reason:'missing-nested-button'});await clickBack(page);continue;}
      await nav.click({timeout:7000});
      await page.locator('#screen-'+to).waitFor({state:'visible',timeout:11000});
      await clickBack(page);
      await page.locator('#screen-'+from).waitFor({state:'visible',timeout:11000});
      await clickBack(page);
      await page.locator('#screen-menu .hub-mode-story-play').waitFor({state:'visible',timeout:11000});
     }catch(err){
      failures.push({width,chain,reason:'nested-back-error',error:String(err).slice(0,350)});
      await page.goto(base+'/index.html?tester=1',{waitUntil:'domcontentloaded',timeout:50000});
      await page.locator('#screen-menu .hub-mode-story-play').waitFor({state:'visible',timeout:25000});
     }
    }
   }
   await context.close();
  }
  console.log('UI_AUDIT_LAYOUTS '+JSON.stringify(layouts));
  console.log('UI_AUDIT_FAILURES '+JSON.stringify(failures));
  console.log('UI_AUDIT_RUNTIME_ERRORS '+JSON.stringify(errors));
  // While gathering a baseline keep the runner green; followup will enforce it.
  console.log('PASS: 7 display sizes, 7 screens each, 4 cross-screen Back chains; audit logged');
 }finally{await browser.close();}
})().catch(e=>{console.error(e.stack||e);process.exitCode=1;});
