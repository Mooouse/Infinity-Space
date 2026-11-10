// Smoke-test generated single index.html with real Chromium and a mocked
// Playgama SDK, without needing credentials or making real ad requests.
const assert = require('node:assert/strict');
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless:true,args:[
    '--no-sandbox','--disable-dev-shm-usage',
    '--use-gl=angle','--use-angle=swiftshader-webgl'
  ]});
  const errors = [];
  try {
    const page = await browser.newPage({viewport:{width:1100,height:760}});
    page.on('pageerror', error => errors.push(error.stack || String(error)));
    await page.route('https://bridge.playgama.com/**', route => route.fulfill({
      status:200, contentType:'application/javascript', body: [
        'window.bridge = {',
        ' EVENT_NAME: { AUDIO_STATE_CHANGED:"audio", PAUSE_STATE_CHANGED:"pause",',
        '  REWARDED_STATE_CHANGED:"rewarded", INTERSTITIAL_STATE_CHANGED:"interstitial" },',
        ' initialize: async function(opts) { window.__bridgeInitOptions = opts; },',
        ' platform: { id:"playgama_sandbox", language:"en", isPaused:false,',
        '  isAudioEnabled:true, sendMessage:()=>Promise.resolve(), on:()=>{}, off:()=>{} },',
        ' advertisement: { isRewardedSupported:true, isInterstitialSupported:true,',
        '  checkAdBlock:async ()=>false, on:()=>{}, off:()=>{},',
        '  showRewarded:async ()=>{}, showInterstitial:async ()=>{} },',
        ' storage: { get:async (keys, parse) => { window.__cloudGet = {keys,parse}; return []; }, set:async ()=>{} }',
        '};'
      ].join('\n')
    }));
    await page.goto('http://127.0.0.1:8766/',
      {waitUntil:'domcontentloaded',timeout:90000});
    await page.locator('#screen-menu [data-reward-page="roulette"]')
      .waitFor({state:'visible',timeout:30000});

    const state = await page.evaluate(() => {
      const opts = window.__bridgeInitOptions;
      const path = opts && opts.configFilePath;
      let parsedConfig = null;
      if (path?.startsWith('data:application/json;')) {
        parsedConfig = JSON.parse(decodeURIComponent(path.slice(path.indexOf(',') + 1)));
      }
      return {
        playgama:window.SpacePlatform?.isPlaygama,
        dedicated:window.SpacePlaygamaBuild===true,
        platformId:window.bridge?.platform?.id,
        cloudRaw:window.__cloudGet?.parse===false,
        crazyScript:!!document.querySelector('script[src*=\"crazygames-sdk\"]'),
        ready:window.SpacePlatform?.status,
        inlineConfig:!!parsedConfig?.advertisement?.rewarded?.preloadOnStart,
        tracks:window.SpaceMusicTracks?.length,
        cover:window.SpaceMusicTracks?.[0]?.cover?.startsWith('data:image/jpeg;base64,'),
        audio:window.SpaceMusicTracks?.[0]?.src?.startsWith('data:audio/mp4;base64,'),
        audioLength:window.SpaceMusicTracks?.[0]?.src?.length,
        lastAudio:!!document.getElementById('inline-audio-12'),
        density:document.querySelector('[data-test="density"]')?.value,
        description:JSON.parse(document.getElementById('playgama-submission-info').textContent)
      };
    });
    assert.equal(state.playgama,true);
    assert.equal(state.dedicated,true,'Dedicated build must enable SDK without URL flags');
    assert.equal(state.platformId,'playgama_sandbox');
    assert.equal(state.cloudRaw,true,'Cloud save must read original JSON text');
    assert.equal(state.crazyScript,false,'Do not load CrazyGames SDK in Playgama ZIP');
    assert.equal(state.ready,'ready');
    assert.equal(state.inlineConfig,true,'Bridge config must use inline data URL');
    assert.equal(state.tracks,12,'All 12 musical tracks must remain');
    assert.equal(state.cover,true);
    assert.equal(state.audio,true);
    assert.ok(state.audioLength>300_000,'Music bytes must be embedded');
    assert.equal(state.lastAudio,true);
    assert.equal(state.density,'32');
    assert.equal(state.description.title,'Infinity Space');
    assert.ok(state.description.how_to_play_ru.includes('колесо'));
    console.log('PASS: plain URL activates Bridge even on unrecognized CDN host, with sandbox platform and 12 AAC songs');

    await page.locator('#screen-menu [data-reward-page="roulette"]').click({timeout:12000});
    await page.waitForFunction(() => document.querySelector('#modal')?.dataset.screen==='roulette',
      null,{timeout:12000});
    assert.equal(await page.locator('#rewards-tab-daily').isVisible(),true);
    console.log('PASS: embedded game opens roulette');

    await page.locator('#rewards-tab-daily').click();
    await page.waitForFunction(() => document.querySelector('#modal')?.dataset.screen==='daily',
      null,{timeout:12000});
    assert.equal(await page.locator('#rewards-tab-roulette').isVisible(),true);
    console.log('PASS: embedded game switches rewards screens');

    assert.deepEqual(errors,[],'Uncaught errors: '+errors.join('\n').slice(0,2000));
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode=1; });
