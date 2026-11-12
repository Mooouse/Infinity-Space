// Visual regression gate for the six-mode main menu in a real browser.
'use strict';
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const base=process.env.INFINITI_SMOKE_URL||'http://127.0.0.1:8765';
const cases=[
 {w:320,h:568,lang:'ru'}, {w:375,h:667,lang:'ru'},
 {w:390,h:844,lang:'ru'}, {w:700,h:715,lang:'ru'},
 {w:723,h:715,lang:'ru'}, {w:768,h:1024,lang:'ru'},
 {w:1024,h:768,lang:'ru'}, {w:1366,h:768,lang:'ru'},
 {w:1920,h:1080,lang:'ru'}, {w:2560,h:1440,lang:'ru'},
 {w:723,h:715,lang:'en'}, {w:723,h:715,lang:'es'}
];
const inspect=()=>{
 const $=s=>document.querySelector(s);
 const rect=el=>{
  const r=el.getBoundingClientRect();
  return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,
   cx:r.left+r.width/2,width:r.width,height:r.height};
 };
 const title=$('.hub-mode-story-title'),footer=$('.hub-mode-story-footer'),
  nav=$('.hub-mode-nav-controls'),dock=$('.hub-story-nav'),
  button=$('.hub-mode-story-play'),subtitle=$('.hub-mode-gesture');
 const chars=[];
 const node=[...title.childNodes].find(n=>n.nodeType===Node.TEXT_NODE);
 if(node){
  const range=document.createRange();
  for(let i=0;i<node.textContent.length;i++){
   if(/\s/.test(node.textContent[i]))continue;
   range.setStart(node,i);range.setEnd(node,i+1);
   const r=range.getBoundingClientRect();
   chars.push({y:Math.round(r.top),char:node.textContent[i]});
  }
 }
 const lines=new Map();
 for(const {y,char} of chars)lines.set(y,(lines.get(y)||'')+char);
 const lineLengths=[...lines.values()].map(s=>s.length);
 const clickable=el=>{
  const r=el.getBoundingClientRect(),x=r.left+r.width/2,y=r.top+r.height/2;
  if(x<0||y<0||x>=innerWidth||y>=innerHeight)return false;
  const top=document.elementFromPoint(x,y);
  return top===el||el.contains(top);
 };
 const rnav=rect(nav),rdock=rect(dock),rfoot=rect(footer),rtitle=rect(title);
 return {
  viewport:[innerWidth,innerHeight],doc:document.documentElement.scrollWidth,
  mode:document.querySelector('.hub-mode-dots .current')?.getAttribute('aria-label')||'',
  title:title.textContent,lines:[...lines.values()],lineLengths,
  navDelta:Math.round(rnav.cx-rfoot.cx),
  footer:rfoot,dock:rdock,titleRect:rtitle,subtitle:rect(subtitle),
   collision:rfoot.left<rdock.right-2&&rfoot.right>rdock.left+2&&rfoot.top<rdock.bottom-2&&rfoot.bottom>rdock.top+2,
  navVisible:getComputedStyle(nav).display!=='none',
  dockVisible:getComputedStyle(dock).display!=='none',
  playSvg:!!button.querySelector('svg'),
  prevHit:clickable($('.hub-mode-step[data-dir="-1"]')),
  nextHit:clickable($('.hub-mode-step[data-dir="1"]')),
  playHit:clickable(button),
  titleScroll:title.scrollWidth-title.clientWidth,
  heroCenter:rect($('.hub-mode-story-copy')).cx,
  shortcuts:[...dock.querySelectorAll('.hub-story-shortcut')]
    .filter(el=>!el.hidden&&getComputedStyle(el).display!=='none')
    .map(el=>el.dataset.shortcut),
  rewardsVisible:!!$('.hub-story-quick')&&!$('.hub-story-quick').hidden,
  heroBrandSize:parseFloat(getComputedStyle($('.hub-reference-brand')).fontSize),
  brandRect:rect($('.hub-reference-brand')),
  brandInHero:!!document.querySelector('.hub-mode-story-copy .hub-reference-brand'),
  titleFontSize:parseFloat(getComputedStyle(title).fontSize),
  nicknameVisible:!$('.hub-mode-nickname').hidden,
  nicknameValue:$('.hub-mode-nickname input').value,
  nicknameCenter:rect($('.hub-mode-nickname')).cx,
  actionHeight:rect(button).height,
  shortcutFontSize:parseFloat(getComputedStyle(dock.querySelector('.hub-story-shortcut-label')).fontSize)
 
 };
};
(async()=>{
 const browser=await chromium.launch({headless:true,args:[
  '--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader',
  '--use-gl=angle','--use-angle=swiftshader-webgl']});
 const failures=[];
 try{
  for(const {w,h,lang} of cases){
   const context=await browser.newContext({viewport:{width:w,height:h},deviceScaleFactor:1});
   const page=await context.newPage();
   await page.addInitScript((lang)=>{
    localStorage.setItem('infinity-space-player-v1',JSON.stringify({version:1,nickname:'UI Tester'}));
    localStorage.setItem('infiniti-space-language',lang);
   },lang);
   await page.goto(base+'/index.html?tester=1',{waitUntil:'domcontentloaded',timeout:60000});
   await page.locator('#screen-menu .hub-mode-story-play').waitFor({state:'visible',timeout:40000});
   for(let n=0;n<6;n++){
    try{
     await page.locator('.hub-mode-dots button').nth(n).click({timeout:7000});
     await page.waitForTimeout(350);
     const m=await page.evaluate(inspect),issues=[];
     if(m.doc>w+2)issues.push('horizontal-document-overflow');
     if(!m.navVisible||Math.abs(m.navDelta)>3)issues.push('carousel-not-centered');
     if(!m.dockVisible||m.dock.bottom>h+2||m.dock.top<0)issues.push('bottom-navigation-outside-viewport');
     if(m.collision)issues.push('footer-overlaps-navigation');
     if(m.titleRect.right>w+2||m.titleRect.left<0||m.titleScroll>4)issues.push('title-overflows');
     if(m.lineLengths.length&&m.lineLengths.at(-1)===1)issues.push('title-orphan-letter');
     if(!m.playSvg)issues.push('legacy-cta-arrow');
     if(!m.prevHit||!m.nextHit||!m.playHit)issues.push('button-not-hittable');
     if(Math.abs(m.heroCenter-w/2)>5)issues.push('main-hero-not-centered');
     if(Math.abs(m.titleRect.cx-w/2)>5)issues.push('mode-title-not-centered');
     if(m.brandInHero||m.brandRect.left>w*.16||m.brandRect.right>=w*.5)
      issues.push('product-brand-not-in-left-corner');
     if(m.nicknameVisible!==(n>0))issues.push('nickname-visible-in-wrong-mode');
     if(n>0&&(m.nicknameValue!=='UI Tester'||Math.abs(m.nicknameCenter-w/2)>5))
      issues.push('competitive-nickname-not-persistent-and-centered');
     if(Math.abs(m.dock.cx-w/2)>5)issues.push('context-dock-not-centered');
     const allowed=n===0
      ? ['map','evolution','achievements','music','bestiary','settings']
      : ['achievements','statistics','settings'];
     if(m.shortcuts.join(',')!==allowed.join(','))
      issues.push('unrelated-shortcuts-'+m.shortcuts.join(','));
     if(m.rewardsVisible!==(n===0))issues.push('rewards-on-wrong-mode');
     if(w===2560&&h===1440&&(m.heroBrandSize<37||m.heroBrandSize>64||
         m.titleFontSize<68||m.actionHeight<70||m.shortcutFontSize<15))
      issues.push('2k-menu-too-small-'+JSON.stringify({
       brand:m.heroBrandSize,title:m.titleFontSize,
       button:m.actionHeight,shortcut:m.shortcutFontSize
      }));
     if(w===1920&&h===1080&&n>0){
      const trigger=page.locator('.hub-story-shortcut[data-shortcut="achievements"]');
      await trigger.click();
      const popup=page.locator('.infinity-mode-achievements-overlay');
      await popup.waitFor({state:'visible',timeout:5000});
      if((await popup.locator('.infinity-mode-achievement').count())<18)
       issues.push('mode-achievements-not-expanded');
      await popup.locator('.infinity-overlay-close').click();
     }
     // The supplied original design uses one violet control language;
     // test a visible hover glow and consistent palette, not a rainbow hue.
     if(w===1920&&h===1080){
      const play=page.locator('.hub-mode-story-play');
      await play.hover();await page.waitForTimeout(220);
      const state=await play.evaluate(el=>({border:getComputedStyle(el).borderTopColor,shadow:getComputedStyle(el).boxShadow}));
      if(state.border!=='rgb(209, 184, 255)'||state.shadow==='none')
       issues.push('reference-play-glow-'+JSON.stringify(state));
      for(const id of ['new','music','map']){
       const el=page.locator('.hub-story-shortcut[data-shortcut="'+id+'"]');
       if(await el.count()&&await el.isVisible()){
        await el.hover();await page.waitForTimeout(220);
        const state=await el.evaluate(node=>({border:getComputedStyle(node).borderTopColor,shadow:getComputedStyle(node).boxShadow}));
        if(state.border!=='rgb(185, 150, 255)'||state.shadow==='none')
         issues.push('reference-shortcut-glow-'+id+'-'+JSON.stringify(state));
       }
      }
     }
     if(issues.length)failures.push({w,h,lang,n,issues,layout:m});
    }catch(e){
     // Make click-interception failures diagnosable on the first run.
     const hit=await page.evaluate(index=>{
      const el=document.querySelectorAll('.hub-mode-dots button')[index];
      if(!el)return {missing:true};
      const r=el.getBoundingClientRect(),x=r.left+r.width/2,y=r.top+r.height/2;
      const top=document.elementFromPoint(x,y),parent=el.closest('.hub-mode-story-footer');
      return {x:Math.round(x),y:Math.round(y),viewport:[innerWidth,innerHeight],
       target:top?.tagName+'#'+(top?.id||'')+'.'+(typeof top?.className==='string'?top.className:''),
       footerZ:parent?getComputedStyle(parent).zIndex:null,
       footerRect:parent?.getBoundingClientRect().toJSON(),
       dotRect:r.toJSON(),overlap:top!==el&&!el.contains(top)};
     },n).catch(()=>null);
     failures.push({w,h,lang,n,error:String(e).slice(0,1000),hit});
    }
   }
   await context.close();
  }
  console.log('MAIN_MENU_LAYOUT_FAILURES '+JSON.stringify(failures));
  assert.equal(failures.length,0,'Main menu visual regressions');
  console.log('PASS: 12 viewport/language combinations × 6 modes; text, icon, centering, navigation and hit testing');
 }finally{await browser.close();}
})().catch(e=>{console.error(e.stack||e);process.exitCode=1;});
