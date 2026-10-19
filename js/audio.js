/* ============================================================
   KARANLIK BOĞAZ — audio.js
   Fully procedural WebAudio soundscape (no audio files).
   ============================================================ */
(function (global) {
  'use strict';

  const AUD = {
    ctx: null,
    master: null,
    sfx: null,
    music: null,
    noiseBuf: null,
    muted: U.store.get('kb_muted', false),
    started: false,
    speechEnabled: true,
    speechReady: false,
    speechVoices: [],
    speechToken: 0,
    ambientNodes: [],
    musicTimer: null,
    mode: 'street',
    lastDist: 0
  };

  function now() { return AUD.ctx.currentTime; }

  function makeNoise(ctx, sec = 2) {
    const len = Math.floor(ctx.sampleRate * sec);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    let b = 0;
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1;
      b = (b + w * 0.02) * 0.998;
      d[i] = w * 0.7 + b * 3;
    }
    return buf;
  }

  AUD.init = function () {
    if (AUD.ctx) {
      if (AUD.ctx.state === 'suspended') AUD.ctx.resume();
      return;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    const ctx = new AC();
    AUD.ctx = ctx;
    AUD.master = ctx.createGain();
    AUD.master.gain.value = AUD.muted ? 0 : 0.62;
    AUD.compressor = ctx.createDynamicsCompressor();
    AUD.compressor.threshold.value = -18;
    AUD.compressor.knee.value = 14;
    AUD.compressor.ratio.value = 3;
    AUD.compressor.attack.value = 0.004;
    AUD.compressor.release.value = 0.24;
    AUD.master.connect(AUD.compressor);
    AUD.compressor.connect(ctx.destination);
    AUD.sfx = ctx.createGain(); AUD.sfx.gain.value = 0.85; AUD.sfx.connect(AUD.master);
    AUD.music = ctx.createGain(); AUD.music.gain.value = 0.5; AUD.music.connect(AUD.master);
    AUD.noiseBuf = makeNoise(ctx, 2);
  };

  AUD.setMuted = function (m) {
    AUD.muted = m;
    if (m) AUD.stopSpeech();
    U.store.set('kb_muted', m);
    if (AUD.master) {
      AUD.master.gain.cancelScheduledValues(now());
      AUD.master.gain.linearRampToValueAtTime(m ? 0 : 0.62, now() + 0.2);
    }
    return m;
  };

  // Use the browser's Turkish speech voice for voiced character lines; narration remains text-only.
  AUD.refreshSpeechVoices = function () {
    if (!('speechSynthesis' in window)) return;
    AUD.speechVoices = window.speechSynthesis.getVoices() || [];
    AUD.speechReady = true;
  };

  AUD.stopSpeech = function () {
    AUD.speechToken++;
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  };

  AUD.speak = function (node) {
    if (!node || !node.who || !node.text || !AUD.speechEnabled || AUD.muted || !('speechSynthesis' in window)) return;
    const synth = window.speechSynthesis;
    if (!AUD.speechReady) AUD.refreshSpeechVoices();
    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(String(node.text).replace(/[*\\[\\]]/g, ''));
    utterance.lang = 'tr-TR';
    const voices = AUD.speechVoices;
    const turkish = voices.filter(v => /^tr([-_]|$)/i.test(v.lang || ''));
    const isWoman = /ANNEM|ADA|LEYLA|SELİN|KIZIL ANA|NURTEN/i.test(node.who || '');
    const voice = turkish.find(v => isWoman ? /female|kadın|woman|女/i.test(v.name) : /male|erkek|man/i.test(v.name)) || turkish[0];
    if (voice) utterance.voice = voice;
    utterance.rate = /RADYO|TELSİZ|SUNUCU/i.test(node.role || '') ? 0.94 : 1.0;
    utterance.pitch = isWoman ? 1.08 : (/KIZIL ANA/i.test(node.who || '') ? 0.72 : 0.92);
    utterance.volume = 0.92;
    const token = ++AUD.speechToken;
    utterance.onerror = () => { if (token === AUD.speechToken) AUD.speechToken++; };
    try { synth.speak(utterance); } catch (e) { /* keep dialogue playable if device TTS is unavailable */ }
  };

  if ('speechSynthesis' in window) {
    AUD.refreshSpeechVoices();
    window.speechSynthesis.addEventListener && window.speechSynthesis.addEventListener('voiceschanged', AUD.refreshSpeechVoices);
  }

  function env(gain, t, a, d, peak = 1) {
    gain.gain.cancelScheduledValues(t);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), t + a);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + a + d);
  }

  function noiseSrc(dur) {
    const s = AUD.ctx.createBufferSource();
    s.buffer = AUD.noiseBuf;
    s.loop = true;
    s.start(now());
    s.stop(now() + dur + .05);
    return s;
  }

  function distCurve() { return 1200; }

  /* ---------------- SFX ---------------- */
  AUD.shot = function (kind) {
    if (!AUD.ctx || AUD.muted) return;
    const ctx = AUD.ctx, t = now();
    const dur = kind === 'shotgun' ? 0.42 : kind === 'rifle' ? 0.26 : 0.20;
    const n = noiseSrc(dur);
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.setValueAtTime(kind === 'shotgun' ? 3600 : 5200, t);
    f.frequency.exponentialRampToValueAtTime(380, t + dur);
    f.Q.value = 0.7;
    const g = ctx.createGain();
    env(g, t, 0.002, dur, kind === 'shotgun' ? 0.75 : 0.5);
    n.connect(f); f.connect(g); g.connect(AUD.sfx);
    // thump
    const o = ctx.createOscillator();
    o.type = 'triangle';
    o.frequency.setValueAtTime(kind === 'shotgun' ? 110 : 160, t);
    o.frequency.exponentialRampToValueAtTime(40, t + 0.14);
    const og = ctx.createGain(); env(og, t, 0.002, 0.15, kind === 'shotgun' ? .65 : .4);
    o.connect(og); og.connect(AUD.sfx);
    o.start(t); o.stop(t + 0.2);
    // tail echo (street)
    const d = ctx.createDelay(); d.delayTime.value = 0.12;
    const fb = ctx.createGain(); fb.gain.value = 0.22;
    const lg = ctx.createGain(); lg.gain.value = 0.16;
    g.connect(d); d.connect(fb); fb.connect(d); d.connect(lg); lg.connect(AUD.sfx);
  };

  AUD.click = function () {
    if (!AUD.ctx || AUD.muted) return;
    const ctx = AUD.ctx, t = now();
    const o = ctx.createOscillator(); o.type = 'square';
    o.frequency.setValueAtTime(1500, t); o.frequency.exponentialRampToValueAtTime(500, t + 0.04);
    const g = ctx.createGain(); env(g, t, 0.001, 0.05, .18);
    o.connect(g); g.connect(AUD.sfx); o.start(t); o.stop(t + 0.07);
    const n = noiseSrc(0.05);
    const nf = ctx.createBiquadFilter(); nf.type = 'highpass'; nf.frequency.value = 2500;
    const ng = ctx.createGain(); env(ng, t, 0.001, 0.04, .18);
    n.connect(nf); nf.connect(ng); ng.connect(AUD.sfx);
  };

  AUD.reload = function () {
    if (!AUD.ctx || AUD.muted) return;
    const ctx = AUD.ctx;
    const seq = [[0, 1200], [0.16, 700], [0.44, 950], [0.62, 1400]];
    seq.forEach(([dt, fr]) => {
      const t = now() + dt;
      const n = noiseSrc(0.08);
      const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = fr; f.Q.value = 4;
      const g = ctx.createGain(); env(g, t, 0.001, 0.07, .22);
      n.connect(f); f.connect(g); g.connect(AUD.sfx);
    });
  };

  AUD.empty = function () {
    if (!AUD.ctx || AUD.muted) return;
    const ctx = AUD.ctx, t = now();
    const o = ctx.createOscillator(); o.type = 'square'; o.frequency.value = 190;
    const g = ctx.createGain(); env(g, t, 0.001, 0.05, .16);
    o.connect(g); g.connect(AUD.sfx); o.start(t); o.stop(t + 0.07);
  };

  AUD.swing = function () {
    if (!AUD.ctx || AUD.muted) return;
    const ctx = AUD.ctx, t = now();
    const dur = 0.2;
    const n = noiseSrc(dur);
    const f = ctx.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.setValueAtTime(760, t);
    f.frequency.exponentialRampToValueAtTime(2800, t + dur);
    f.Q.value = 1.2;
    const g = ctx.createGain();
    env(g, t, 0.03, dur, 0.3);
    n.connect(f); f.connect(g); g.connect(AUD.sfx);
  };

  AUD.hit = function (headshot) {
    if (!AUD.ctx || AUD.muted) return;
    const ctx = AUD.ctx, t = now();
    const o = ctx.createOscillator(); o.type = 'triangle';
    o.frequency.setValueAtTime(headshot ? 900 : 520, t);
    o.frequency.exponentialRampToValueAtTime(headshot ? 1500 : 260, t + 0.08);
    const g = ctx.createGain(); env(g, t, 0.001, headshot ? 0.14 : 0.07, .3);
    o.connect(g); g.connect(AUD.sfx); o.start(t); o.stop(t + 0.2);
  };

  AUD.hurt = function () {
    if (!AUD.ctx || AUD.muted) return;
    const ctx = AUD.ctx, t = now();
    const n = noiseSrc(0.3);
    const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 700;
    const g = ctx.createGain(); env(g, t, 0.002, 0.26, .5);
    n.connect(f); f.connect(g); g.connect(AUD.sfx);
    const o = ctx.createOscillator(); o.type = 'sawtooth';
    o.frequency.setValueAtTime(160, t); o.frequency.exponentialRampToValueAtTime(60, t + 0.25);
    const og = ctx.createGain(); env(og, t, 0.004, 0.22, .18);
    o.connect(og); og.connect(AUD.sfx); o.start(t); o.stop(t + 0.32);
  };

  AUD.growl = function (vol = 0.3, pitch = 1) {
    if (!AUD.ctx || AUD.muted) return;
    const ctx = AUD.ctx, t = now();
    const o = ctx.createOscillator(); o.type = 'sawtooth';
    o.frequency.setValueAtTime(70 * pitch, t);
    o.frequency.linearRampToValueAtTime(48 * pitch, t + 0.5);
    const lfo = ctx.createOscillator(); lfo.frequency.value = 18;
    const lg = ctx.createGain(); lg.gain.value = 16 * pitch;
    lfo.connect(lg); lg.connect(o.frequency);
    const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 420; f.Q.value = 3;
    const g = ctx.createGain(); env(g, t, 0.08, 0.55, vol);
    o.connect(f); f.connect(g); g.connect(AUD.sfx);
    o.start(t); lfo.start(t); o.stop(t + 0.7); lfo.stop(t + 0.7);
  };

  AUD.death = function () {
    if (!AUD.ctx || AUD.muted) return;
    const ctx = AUD.ctx, t = now();
    const o = ctx.createOscillator(); o.type = 'sawtooth';
    o.frequency.setValueAtTime(120, t); o.frequency.exponentialRampToValueAtTime(32, t + 0.7);
    const g = ctx.createGain(); env(g, t, 0.01, 0.7, .22);
    const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 500;
    o.connect(f); f.connect(g); g.connect(AUD.sfx); o.start(t); o.stop(t + 0.8);
    AUD.growl(0.18, 0.6);
  };

  AUD.pickup = function (kind) {
    if (!AUD.ctx || AUD.muted) return;
    const ctx = AUD.ctx, t = now();
    const notes = kind === 'health' ? [520, 780] : kind === 'ammo' ? [360, 480] : kind === 'charm' ? [660, 990, 1320] : [740, 1100];
    notes.forEach((fr, i) => {
      const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = fr;
      const g = ctx.createGain(); env(g, t + i * 0.07, 0.004, 0.16, .22);
      o.connect(g); g.connect(AUD.sfx); o.start(t + i * 0.07); o.stop(t + i * 0.07 + 0.2);
    });
  };

  AUD.door = function (open) {
    if (!AUD.ctx || AUD.muted) return;
    const ctx = AUD.ctx, t = now();
    const o = ctx.createOscillator(); o.type = 'sawtooth';
    o.frequency.setValueAtTime(open ? 90 : 140, t);
    o.frequency.linearRampToValueAtTime(open ? 220 : 80, t + 0.5);
    const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = open ? 900 : 600; f.Q.value = 9;
    const g = ctx.createGain(); env(g, t, 0.05, 0.5, .12);
    o.connect(f); f.connect(g); g.connect(AUD.sfx); o.start(t); o.stop(t + 0.6);
    const n = noiseSrc(0.2);
    const nf = ctx.createBiquadFilter(); nf.type = 'bandpass'; nf.frequency.value = 300;
    const ng = ctx.createGain(); env(ng, t, 0.01, 0.18, .16);
    n.connect(nf); nf.connect(ng); ng.connect(AUD.sfx);
  };

  AUD.step = function (run) {
    if (!AUD.ctx || AUD.muted) return;
    const ctx = AUD.ctx, t = now();
    const n = noiseSrc(0.12);
    const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = run ? 900 : 600;
    const g = ctx.createGain(); env(g, t, 0.002, run ? 0.09 : 0.07, run ? .3 : .18);
    n.connect(f); f.connect(g); g.connect(AUD.sfx);
    const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = 70;
    const og = ctx.createGain(); env(og, t, 0.002, 0.06, .12);
    o.connect(og); og.connect(AUD.sfx); o.start(t); o.stop(t + 0.1);
  };

  AUD.ui = function (up = true) {
    if (!AUD.ctx || AUD.muted) return;
    const ctx = AUD.ctx, t = now();
    const o = ctx.createOscillator(); o.type = 'sine';
    o.frequency.setValueAtTime(up ? 620 : 440, t);
    o.frequency.exponentialRampToValueAtTime(up ? 880 : 300, t + 0.06);
    const g = ctx.createGain(); env(g, t, 0.002, 0.06, .12);
    o.connect(g); g.connect(AUD.sfx); o.start(t); o.stop(t + 0.1);
  };

  AUD.choice = function () {
    if (!AUD.ctx || AUD.muted) return;
    const ctx = AUD.ctx, t = now();
    [440, 660, 880].forEach((fr, i) => {
      const o = ctx.createOscillator(); o.type = 'triangle'; o.frequency.value = fr;
      const g = ctx.createGain(); env(g, t + i * 0.06, 0.005, 0.35, .09);
      o.connect(g); g.connect(AUD.sfx); o.start(t + i * 0.06); o.stop(t + i * 0.06 + 0.45);
    });
  };

  AUD.radio = function (dur = 1.2) {
    if (!AUD.ctx || AUD.muted) return;
    const ctx = AUD.ctx, t = now();
    const n = noiseSrc(dur);
    const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 1400; f.Q.value = 2;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(.12, t + 0.05);
    g.gain.setValueAtTime(.12, t + dur - 0.1);
    g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    n.connect(f); f.connect(g); g.connect(AUD.sfx);
    // warble
    const lfo = ctx.createOscillator(); lfo.frequency.value = 7;
    const lg = ctx.createGain(); lg.gain.value = 300;
    lfo.connect(lg); lg.connect(f.frequency);
    lfo.start(t); lfo.stop(t + dur);
  };

  AUD.alarm = function () {
    if (!AUD.ctx || AUD.muted) return;
    const ctx = AUD.ctx, t = now();
    for (let i = 0; i < 4; i++) {
      const o = ctx.createOscillator(); o.type = 'sine';
      o.frequency.setValueAtTime(380 + i * 40, t + i * 0.28);
      o.frequency.linearRampToValueAtTime(720 + i * 30, t + i * 0.28 + 0.2);
      const g = ctx.createGain(); env(g, t + i * 0.28, 0.02, 0.24, .07);
      o.connect(g); g.connect(AUD.sfx); o.start(t + i * 0.28); o.stop(t + i * 0.28 + 0.3);
    }
  };

  AUD.explosion = function () {
    if (!AUD.ctx || AUD.muted) return;
    const ctx = AUD.ctx, t = now();
    const n = noiseSrc(1.1);
    const f = ctx.createBiquadFilter(); f.type = 'lowpass';
    f.frequency.setValueAtTime(2200, t); f.frequency.exponentialRampToValueAtTime(90, t + 1);
    const g = ctx.createGain(); env(g, t, 0.004, 1.0, .7);
    n.connect(f); f.connect(g); g.connect(AUD.sfx);
    const o = ctx.createOscillator(); o.type = 'sine';
    o.frequency.setValueAtTime(90, t); o.frequency.exponentialRampToValueAtTime(24, t + 0.8);
    const og = ctx.createGain(); env(og, t, 0.004, 0.8, .5);
    o.connect(og); og.connect(AUD.sfx); o.start(t); o.stop(t + 0.9);
  };

  /* ---------------- AMBIENCE ---------------- */
  function stopAmbient() {
    for (const n of AUD.ambientNodes) {
      try { if (n.stop) n.stop(); else if (n.disconnect) n.disconnect(); } catch (e) { }
    }
    AUD.ambientNodes = [];
  }

  AUD.ambience = function (mode) {
    if (!AUD.ctx || AUD.muted) return;
    stopAmbient();
    AUD.mode = mode;
    const ctx = AUD.ctx;
    const g = ctx.createGain(); g.gain.value = 0.0001;
    g.gain.exponentialRampToValueAtTime(mode === 'indoor' ? .10 : .14, now() + 2.5);
    g.connect(AUD.music);
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = mode === 'indoor' ? 320 : 520;
    lp.connect(g);
    // drone
    const freqs = mode === 'red' ? [36, 54.5, 73] : mode === 'title' ? [48, 72, 96] : [41, 61.5, 82];
    freqs.forEach((f, i) => {
      const o = ctx.createOscillator();
      o.type = i === 0 ? 'sine' : 'triangle';
      o.frequency.value = f;
      const og = ctx.createGain(); og.gain.value = i === 0 ? .5 : .16;
      o.connect(og); og.connect(lp); o.start();
      // slow detune movement
      const lfo = ctx.createOscillator(); lfo.frequency.value = 0.05 + i * 0.017;
      const lg = ctx.createGain(); lg.gain.value = 0.6 + i * 0.3;
      lfo.connect(lg); lg.connect(o.frequency); lfo.start();
      AUD.ambientNodes.push(o, lfo);
    });
    // wind / room tone
    const wind = ctx.createBufferSource(); wind.buffer = AUD.noiseBuf; wind.loop = true;
    const wf = ctx.createBiquadFilter(); wf.type = 'bandpass'; wf.frequency.value = mode === 'indoor' ? 220 : 480; wf.Q.value = .6;
    const wg = ctx.createGain(); wg.gain.value = mode === 'indoor' ? .05 : .11;
    wind.connect(wf); wf.connect(wg); wg.connect(g); wind.start();
    // rain (street) - high filtered noise
    if (mode === 'street') {
      const rain = ctx.createBufferSource(); rain.buffer = AUD.noiseBuf; rain.loop = true;
      const rf = ctx.createBiquadFilter(); rf.type = 'highpass'; rf.frequency.value = 3200;
      const rg = ctx.createGain(); rg.gain.value = .045;
      rain.connect(rf); rf.connect(rg); rg.connect(g); rain.start();
      AUD.ambientNodes.push(rain);
    }
    /*** low pulsing heartbeat for red mode ***/
    if (mode === 'red') {
      const pulse = ctx.createOscillator(); pulse.type = 'sine'; pulse.frequency.value = 55;
      const pg = ctx.createGain(); pg.gain.value = 0;
      const lfo = ctx.createOscillator(); lfo.type = 'sine'; lfo.frequency.value = 0.55;
      const lg = ctx.createGain(); lg.gain.value = .12;
      lfo.connect(lg); lg.connect(pg.gain); pulse.connect(pg); pg.connect(g);
      pulse.start(); lfo.start();
      AUD.ambientNodes.push(pulse, lfo);
    }
    AUD.ambientNodes.push(wind, g, lp);
  };

  AUD.stopAmbient = stopAmbient;

  /* ---------------- MUSIC (title / cues) ---------------- */
  AUD.stopMusic = function () {
    if (AUD.musicTimer) { clearInterval(AUD.musicTimer); AUD.musicTimer = null; }
  };

  AUD.titleTheme = function () {
    if (!AUD.ctx || AUD.muted) return;
    AUD.stopMusic();
    AUD.ambience('title');
    const ctx = AUD.ctx;
    const prog = [
      [146.83, 174.61, 220.00], // Dm
      [130.81, 164.81, 196.00], // Cm-ish
      [110.00, 146.83, 174.61], // Am
      [98.00, 123.47, 146.83]   // G
    ];
    let step = 0;
    const playChord = () => {
      if (!AUD.ctx || AUD.muted) return;
      const t = now() + 0.05;
      const chord = prog[step % prog.length];
      step++;
      chord.forEach((fr, i) => {
        [1, 2.005, 3.01].forEach((mult, k) => {
          const o = ctx.createOscillator();
          o.type = k === 0 ? 'sine' : 'triangle';
          o.frequency.value = fr * mult * (i === 0 ? .5 : i === 1 ? 1 : 1.5);
          const g = ctx.createGain();
          g.gain.setValueAtTime(0.0001, t);
          g.gain.exponentialRampToValueAtTime(.035 / (k + 1), t + 3.2);
          g.gain.exponentialRampToValueAtTime(.0001, t + 10);
          const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 900;
          o.connect(f); f.connect(g);
          const d = ctx.createDelay(); d.delayTime.value = .38;
          const fb = ctx.createGain(); fb.gain.value = .3;
          g.connect(AUD.music); g.connect(d); d.connect(fb); fb.connect(d); d.connect(AUD.music);
          o.start(t); o.stop(t + 10.5);
        });
      });
      // sparse melody note
      if (step % 2 === 0) {
        const o = ctx.createOscillator(); o.type = 'sine';
        const notes = [440, 392, 523.25, 349.23];
        o.frequency.value = notes[step % notes.length];
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.0001, t + 1.2);
        g.gain.exponentialRampToValueAtTime(.045, t + 1.4);
        g.gain.exponentialRampToValueAtTime(.0001, t + 5);
        o.connect(g); g.connect(AUD.music);
        o.start(t + 1.2); o.stop(t + 5.2);
      }
    };
    playChord();
    AUD.musicTimer = setInterval(playChord, 8200);
  };

  AUD.update = function (dt, mode) {
    if (!AUD.ctx || AUD.muted) return;
    AUD.lastDist -= dt;
    if (AUD.lastDist <= 0) {
      AUD.lastDist = U.lerp(7, 22, Math.random());
      if (Math.random() < .5) {
        if (mode === 'street') {
          // distant siren / gull / rumble
          const r = Math.random();
          if (r < .4) {
            const ctx = AUD.ctx, t = now();
            const o = ctx.createOscillator(); o.type = 'sine';
            const base = 300 + Math.random() * 180;
            o.frequency.setValueAtTime(base, t);
            o.frequency.linearRampToValueAtTime(base * 1.4, t + 1.2);
            const g = ctx.createGain();
            g.gain.setValueAtTime(0.0001, t);
            g.gain.exponentialRampToValueAtTime(.014, t + .4);
            g.gain.exponentialRampToValueAtTime(.0001, t + 2.4);
            o.connect(g); g.connect(AUD.sfx); o.start(t); o.stop(t + 2.6);
          } else if (r < .7) {
            AUD.growl(.035, .8 + Math.random() * .6);
          }
        } else if (mode === 'red') {
          AUD.growl(.05, .5 + Math.random() * .4);
        } else {
          // indoor creaks
          const ctx = AUD.ctx, t = now();
          const o = ctx.createOscillator(); o.type = 'sawtooth';
          o.frequency.setValueAtTime(60 + Math.random() * 80, t);
          o.frequency.linearRampToValueAtTime(40, t + .4);
          const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 350; f.Q.value = 6;
          const g = ctx.createGain();
          g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(.02, t + .05);
          g.gain.exponentialRampToValueAtTime(.0001, t + .6);
          o.connect(f); f.connect(g); g.connect(AUD.sfx); o.start(t); o.stop(t + .7);
        }
      }
    }
  };

  global.AUD = AUD;
})(window);
