const {chromium}=require('playwright');
const fs=require('fs');const {spawn}=require('child_process');
const root=process.cwd();
const hooks={
 'game.js':`window.capture={prepare(tier){g.sound=false;g.music=false;g.autoQuality=false;g.quality=1;g.tutorialDone=true;testerSetTier(tier);resumeGame();},pilot(){let target=null,best=Infinity;for(const e of entities.concat(macroEntities)){if(e.dead||e.absorbing||!canAbsorbBody(e))continue;let d=Math.hypot(e.x-player.x,e.y-player.y);if(d<best){best=d;target=e;}}let a=target?Math.atan2(target.y-player.y,target.x-player.x):.3;g.controlMode='follow';pointer.active=true;pointer.x=W/2+Math.cos(a)*W*.35;pointer.y=H/2+Math.sin(a)*H*.35;},state(){return {tier:g.tier,running,collects:g.collects,time:g.time}}};`,
 'cosmic-worms.js':`window.capture={prepare(){closeGuide();options.names=true;options.controlMode='mouse';},pilot(){input.mouseMoved=true;const a=-.3+Math.sin(game.time*.6)*.75;input.mx=vw/2+Math.cos(a)*300;input.my=vh/2+Math.sin(a)*300;input.boostKey=game.time%5>2&&game.time%5<3.3;},state(){return {state:game.state,time:game.time,mass:game.player.mass,alive:game.player.alive}}};`
};
async function main(){
 const name=process.argv[2]||'landscape',portrait=name==='portrait';const w=portrait?1080:1920,h=portrait?1620:1080;
 const browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader-webgl']});
 const context=await browser.newContext({viewport:{width:w,height:h},deviceScaleFactor:1});
 await context.addInitScript(()=>{
  localStorage.setItem('infinity-space-player-v1',JSON.stringify({version:1,nickname:'Voyager'}));localStorage.setItem('infiniti-space-language','en');
  let now=1000,queue=[];performance.now=()=>now;
  window.requestAnimationFrame=fn=>{queue.push(fn);return queue.length;};window.cancelAnimationFrame=()=>{};
  window.tick=()=>{now+=1000/60;const q=queue;queue=[];q.forEach(fn=>fn(now));};
 });
 await context.route('**/*',async route=>{
  const u=new URL(route.request().url());const f=u.pathname.split('/').pop();
  if(u.hostname!=='127.0.0.1')return route.abort();
  if(hooks[f]){let body=fs.readFileSync(root+'/'+f,'utf8');body=body.replace(/\}\)\(\);\s*$/,hooks[f]+'\n})();');return route.fulfill({contentType:'application/javascript',body});}return route.continue();
 });
 const page=await context.newPage();let errors=[];page.on('pageerror',e=>{errors.push(e.message);console.log('ERROR',e.message)});
 fs.mkdirSync('recording',{recursive:true});
 for(const [scene,path,tier,seconds] of [['planet','index.html',9,5],['blackhole','index.html',27,5],['worms','cosmic-worms.html',null,8]]){
  await page.goto('http://127.0.0.1:8765/'+path+'?tester=1',{waitUntil:'load'});await page.waitForFunction(()=>!!window.capture,null,{polling:100});
  await page.addStyleTag({content:'*{cursor:none!important} .v15-tester,#btn-tester,#tester-panel{display:none!important}'});
  await page.evaluate(t=>capture.prepare(t),tier);
  for(let i=0;i<90;i++)await page.evaluate(()=>{capture.pilot();tick()});
  await page.screenshot({path:`recording/${name}-${scene}.jpg`,type:'jpeg',quality:90});
  console.log(name,scene,'START',await page.evaluate(()=>capture.state()));
  if(process.env.PREVIEW)continue;
  const out=`recording/${name}-${scene}.mp4`;
  const ff=spawn('ffmpeg',['-y','-loglevel','error','-f','image2pipe','-framerate','60','-vcodec','mjpeg','-i','pipe:0','-an','-c:v','libx264','-preset','fast','-crf','19','-pix_fmt','yuv420p','-movflags','+faststart',out]);
  ff.stderr.on('data',d=>process.stderr.write(d));
  for(let i=0;i<seconds*60;i++){
   await page.evaluate(()=>{capture.pilot();tick()});
   const b=await page.screenshot({type:'jpeg',quality:93});
   if(!ff.stdin.write(b))await new Promise(r=>ff.stdin.once('drain',r));
   if(i%120===0)console.log(name,scene,i+'/'+seconds*60);
  }
  ff.stdin.end();await new Promise((r,j)=>ff.on('close',c=>c===0?r():j(Error('ffmpeg '+c))));
  console.log(name,scene,'END',await page.evaluate(()=>capture.state()));
 }
 fs.writeFileSync(`recording/${name}-errors.json`,JSON.stringify(errors));await browser.close();
}
main().catch(e=>{console.error(e);process.exit(1)});
