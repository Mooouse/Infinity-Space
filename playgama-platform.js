/* Playgama Bridge v2 adapter for Infinity Space.
 * The existing CrazyGames adapter remains the default everywhere else.
 * This module runs before game.js, allowing cloud saves to load first.
 */
(() => {
  'use strict';
  const platform = window.SpacePlatform;
  if (!platform) return;

  const host = location.hostname.toLowerCase();
  const referrer = document.referrer.toLowerCase();
  const params = new URLSearchParams(location.search);
  const onPlaygama = /(^|\.)playgama\.(com|io)$/.test(host) ||
    /(^|\.)playgama\.(com|io)(\/|:)/.test(referrer.replace(/^https?:\/\//, '')) ||
    params.get('playgama') === '1';
  const tester = params.get('tester') === '1';
  platform.isPlaygama = onPlaygama;
  platform.adBlockDetected = false;
  platform.paused = false;

  if (!onPlaygama) {
    platform.startup = Promise.resolve();
    return;
  }

  const SAVE_KEY = 'cosmic-evolution-save-v1';
  const CLOUD_KEY = 'infinity-space-save-v1';
  let bridge = null;
  let active = false;
  let busy = false;
  let loaded = false;
  let playing = false;
  let mutedByAd = false;
  let audioEnabled = true;
  let saveTimer = 0;
  let queuedSave = null;
  let saveActive = false;
  let hasSentReady = false;
  const oldMuted = Object.getOwnPropertyDescriptor(platform, 'muted')?.get;
  function notifyAudio() {
    window.dispatchEvent(new Event('space-platform-audio'));
  }
  function notifyAdState() {
    window.dispatchEvent(new Event('space-platform-ads'));
  }
  function sendMessage(name) {
    if (!active) return;
    try { Promise.resolve(bridge.platform.sendMessage(name)).catch(() => {}); } catch (_) {}
  }
  Object.defineProperty(platform, 'muted', {
    configurable: true,
    get() { return !audioEnabled || mutedByAd || !!(oldMuted && oldMuted.call(platform)); }
  });
  Object.defineProperty(platform, 'adsAvailable', {
    configurable: true,
    get() {
      return active && !busy && !platform.adBlockDetected &&
        !!bridge?.advertisement?.isRewardedSupported;
    }
  });
  Object.defineProperty(platform, 'adBusy', {
    configurable: true,
    get() { return busy; }
  });
  platform.playing = value => {
    const next = !!value;
    if (playing === next) return;
    playing = next;
    if (loaded) sendMessage(next ? 'level_started' : 'level_paused');
  };
  platform.loaded = () => {
    loaded = true;
    if (!hasSentReady) {
      hasSentReady = true;
      sendMessage('game_ready');
    }
    if (playing) sendMessage('level_started');
  };
  platform.happy = () => {};
  platform.persist = json => {
    if (!active || tester || typeof json !== 'string') return;
    queuedSave = json;
    clearTimeout(saveTimer);
    saveTimer = setTimeout(flushSave, 2400);
  };
  async function flushSave() {
    if (!active || saveActive || queuedSave === null) return;
    const data = queuedSave;
    queuedSave = null;
    saveActive = true;
    try {
      await bridge.storage.set([CLOUD_KEY], [data]);
    } catch (error) {
      console.warn('Playgama cloud save unavailable; local save retained.', error);
    } finally {
      saveActive = false;
      if (queuedSave !== null) {
        clearTimeout(saveTimer);
        saveTimer = setTimeout(flushSave, 700);
      }
    }
  }
  addEventListener('pagehide', () => {
    if (queuedSave !== null) {
      clearTimeout(saveTimer);
      void flushSave();
    }
  });

  platform.requestAd = async type => {
    if (!active || busy || platform.adBlockDetected) return false;
    const rewarded = type === 'rewarded';
    if (rewarded ? !bridge.advertisement.isRewardedSupported :
      type !== 'midgame' || !bridge.advertisement.isInterstitialSupported) return false;
    busy = true;
    notifyAdState();
    let rewardedOk = false;
    return new Promise(resolve => {
      let settled = false;
      const name = rewarded ?
        bridge.EVENT_NAME.REWARDED_STATE_CHANGED :
        bridge.EVENT_NAME.INTERSTITIAL_STATE_CHANGED;
      const timeout = setTimeout(() => finish(false), 120000);
      function finish(ok) {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);
        try { bridge.advertisement.off(name, onState); } catch (_) {}
        busy = false;
        mutedByAd = false;
        notifyAudio();
        notifyAdState();
        resolve(!!ok);
      }
      function onState(state) {
        if (settled) return;
        if (state === 'opened') {
          mutedByAd = true;
          notifyAudio();
        }
        if (rewarded && state === 'rewarded') {
          rewardedOk = true;
          finish(true);
        } else if (state === 'failed') {
          finish(false);
        } else if (state === 'closed') {
          finish(rewarded ? rewardedOk : true);
        }
      }
      try {
        bridge.advertisement.on(name, onState);
        const placement = rewarded ? 'infinity_rewarded' : 'infinity_menu';
        const promise = rewarded ?
          bridge.advertisement.showRewarded(placement) :
          bridge.advertisement.showInterstitial(placement);
        Promise.resolve(promise).catch(() => finish(false));
      } catch (_) {
        finish(false);
      }
    });
  };

  async function startup() {
    try {
      bridge = window.bridge;
      if (!bridge || typeof bridge.initialize !== 'function') {
        throw new Error('Playgama Bridge script could not load');
      }
      await Promise.race([
        bridge.initialize(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('SDK init timed out')), 8000))
      ]);
      if (bridge.platform?.id !== 'playgama' && params.get('playgama') !== '1') {
        throw new Error('Host is not Playgama');
      }
      active = true;
      platform.status = 'ready';
      try {
        const requestedLanguage = bridge.platform.language;
        if (['ru', 'en', 'es'].includes(requestedLanguage)) {
          window.SpaceI18n?.setLanguage?.(requestedLanguage);
        }
      } catch (_) {}
      try {
        audioEnabled = bridge.platform.isAudioEnabled !== false;
        platform.paused = !!bridge.platform.isPaused;
        bridge.platform.on(bridge.EVENT_NAME.AUDIO_STATE_CHANGED, value => {
          audioEnabled = !!value;
          notifyAudio();
        });
        bridge.platform.on(bridge.EVENT_NAME.PAUSE_STATE_CHANGED, value => {
          platform.paused = !!value;
          window.dispatchEvent(new Event('space-platform-pause'));
        });
      } catch (_) {}
      notifyAudio();

      // False means "not detected"; failure means "unknown", not "blocked".
      try {
        platform.adBlockDetected = (await bridge.advertisement.checkAdBlock()) === true;
      } catch (_) {
        platform.adBlockDetected = false;
      }
      notifyAdState();

      // Existing game loader reads localStorage synchronously. Import a validated
      // Playgama cloud save BEFORE the game executes to preserve game semantics.
      if (!tester) {
        try {
          const saved = await bridge.storage.get([CLOUD_KEY]);
          const json = Array.isArray(saved) ? saved[0] : null;
          if (typeof json === 'string' && json.length > 0) {
            const value = JSON.parse(json);
            if (value && value.version === 1 && Number.isFinite(value.tier)) {
              localStorage.setItem(SAVE_KEY, json);
            }
          }
        } catch (error) {
          console.warn('Playgama cloud load unavailable; using local game save.', error);
        }
      }
    } catch (error) {
      active = false;
      platform.status = 'standalone';
      console.warn('Playgama SDK unavailable; game starts normally.', error);
    }
  }
  platform.startup = startup();
})();
