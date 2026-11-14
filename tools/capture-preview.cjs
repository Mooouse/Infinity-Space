const {chromium}=require('playwright');
const fs=require('fs');const {spawn}=require('child_process');
const root=process.cwd();
const hooks={
 'game.js':`window.capture={prepare(tier){g.sound=false;g.music=false;g.autoQuality=false;g.quality=1;g.tutorialDone=true;testerSetTier(tier);resumeGame();},boost(){activateBoost();},pilot(){g.controlMode='keys';keys.clear();keys.add('d');keys.add(g.time<2.5?'w':'s');},state(){return {tier:g.tier,running,collects:g.collects,time:g.time,x:player.x,y:player.y,zoom:camera.zoom,vx:player.vx,vy:player.vy}}};`,
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
 for(const [scene,path,tier,seconds] of [['planet','index.html',9,2]]){
  await page.goto('http://127.0.0.1:8765/'+path+'?tester=1',{waitUntil:'load'});await page.waitForFunction(()=>!!window.capture,null,{polling:100});
  await page.addStyleTag({content:'*{cursor:none!important} .v15-tester,#btn-tester,#tester-panel{display:none!important}'});
  await page.evaluate(t=>capture.prepare(t),tier);
  for(let i=0;i<90;i++)await page.evaluate(()=>{capture.pilot();tick()});
  await page.screenshot({path:`recording/${name}-${scene}.jpg`,type:'jpeg',quality:90});
  const startState=await page.evaluate(()=>capture.state());console.log(name,scene,'START',startState);
  if(process.env.PREVIEW)continue;
  await page.evaluate(()=>capture.boost());
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
  const endState=await page.evaluate(()=>capture.state());console.log(name,scene,'END',endState);const distance=Math.hypot(endState.x-startState.x,endState.y-startState.y)*endState.zoom;if(distance<100)throw Error('Planet must travel visibly: '+distance);console.log('VERIFIED_WORLD_TRAVEL_PIXELS',distance);
 }
 fs.writeFileSync(`recording/${name}-errors.json`,JSON.stringify(errors));await browser.close();
}
main().catch(e=>{console.error(e);process.exit(1)});
