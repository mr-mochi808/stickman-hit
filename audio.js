// Stickman Hit - 8-bit sound effects and music, made live with the Web Audio API.
// From docs/game-design.md: 8-bit effects, and fast 8-bit music that starts chill
// and gets more intense with each place, plus a glitchy track for Glitch Mode.
(() => {
  // ---- Music data -----------------------------------------------------------
  // Each track loops 4 bars of 16 steps. Melodies are scale degrees from the key's
  // root: '0'-'9' then 'a'=10, 'b'=11 ... '.' is a rest and '-' holds the note.
  // Bass: R root, F fifth, O octave. Drums: x = hit.
  const SCALES = {
    major: [0, 2, 4, 5, 7, 9, 11],
    minor: [0, 2, 3, 5, 7, 8, 10],
    dorian: [0, 2, 3, 5, 7, 9, 10],
  };

  const TRACKS = {
    // Menus: slow and chill.
    title: {
      bpm: 92, root: 57, scale: 'minor', prog: [0, 5, 3, 4],
      lead: ['7---9---b---9---', 'c---b---9---7---', 'a---9---7---5---', '4---6---8---6---'],
      leadWave: 'triangle', leadVol: 0.16,
      bass: 'R-------F-------', bassWave: 'triangle',
      kick: 'x.......x.......', snare: '................', hat: '....x.......x...',
    },
    // Place 1: Grassy Fields. Bright and bouncy.
    grassy: {
      bpm: 120, root: 60, scale: 'major', prog: [0, 4, 5, 3],
      lead: ['b-9-7-9-b---c-b-', '8-b-d-b-8---7-8-', 'c-e-c-9-7---9-c-', 'a-c-e-c-a-9-8-7-'],
      leadWave: 'square', leadVol: 0.1,
      bass: 'R.O.R.O.R.O.F.O.', bassWave: 'triangle',
      kick: 'x.......x.......', snare: '....x.......x...', hat: 'x.x.x.x.x.x.x.x.',
    },
    // Place 2: the Dojo. Faster, punchier.
    dojo: {
      bpm: 136, root: 62, scale: 'dorian', prog: [0, 6, 5, 6],
      lead: ['7.7.9.7.b.9.7.6.', '6.6.8.6.a.8.6.4.', '5.5.7.5.9.7.5.4.', '6.8.a.c.a.8.6.4-'],
      leadWave: 'square', leadVol: 0.1,
      bass: 'R.RO..R.R.RO..F.', bassWave: 'square',
      kick: 'x.....x.x.....x.', snare: '....x.......x...', hat: 'x.x.x.x.x.x.x.x.',
    },
    // Place 3: the Cherry Blossom Temple. A rolling arpeggio joins in.
    temple: {
      bpm: 148, root: 64, scale: 'minor', prog: [0, 5, 6, 4],
      lead: ['b-a-9-7-9-b-e---', 'c-b-a-9-a-c-e---', 'd-c-b-a-b-d-f---', 'b-d-f-d-b-a-9-8-'],
      leadWave: 'square', leadVol: 0.09, arp: true,
      bass: 'R.R.O.R.R.R.O.F.', bassWave: 'square',
      kick: 'x...x...x...x...', snare: '....x.......x..x', hat: 'xxxxxxxxxxxxxxxx',
    },
    // Place 4: back to the Fields for Cyborg. Fast and intense.
    finale: {
      bpm: 164, root: 57, scale: 'minor', prog: [0, 0, 5, 6],
      lead: ['7979b97979b9cb97', '7979b97979b9e-c-', '5757957575979c9-', '6868a8686a8ad-b-'],
      leadWave: 'sawtooth', leadVol: 0.07, arp: true,
      bass: 'RRORRRORRRORFFOF', bassWave: 'sawtooth',
      kick: 'x...x...x...x.x.', snare: '....x.......x.xx', hat: 'xxxxxxxxxxxxxxxx',
    },
    // Glitch Mode: the temple tune, but it stutters, jumps octaves and drops out.
    glitch: {
      bpm: 150, root: 61, scale: 'minor', prog: [0, 5, 6, 4], glitchy: true,
      lead: ['b-a-9-7-9-b-e---', 'c-b-a-9-a-c-e---', 'd-c-b-a-b-d-f---', 'b-d-f-d-b-a-9-8-'],
      leadWave: 'square', leadVol: 0.09, arp: true,
      bass: 'R.R.O.R.R.R.O.F.', bassWave: 'sawtooth',
      kick: 'x..x..x.x..x..x.', snare: '....x.......x...', hat: 'x.xxx.xxx.xxx.xx',
    },
    // The ending: everyone wakes up.
    ending: {
      bpm: 112, root: 65, scale: 'major', prog: [0, 3, 4, 0],
      lead: ['7-9-b-e---b-e---', 'a-c-e-h---e-c---', 'b-d-f-i---f-d---', 'e---b---9---7---'],
      leadWave: 'square', leadVol: 0.1, arp: true,
      bass: 'R...F...O...F...', bassWave: 'triangle',
      kick: 'x.......x.......', snare: '....x.......x...', hat: 'x.x.x.x.x.x.x.x.',
    },
  };

  const DEG = (ch) => (ch >= '0' && ch <= '9' ? ch.charCodeAt(0) - 48 : ch.charCodeAt(0) - 87);
  const freq = (midi) => 440 * 2 ** ((midi - 69) / 12);

  function degreeToMidi(track, deg) {
    const sc = SCALES[track.scale];
    const oct = Math.floor(deg / 7);
    const idx = ((deg % 7) + 7) % 7;
    return track.root + oct * 12 + sc[idx];
  }

  // ---- Synth building blocks -----------------------------------------------
  const noiseBuffers = new WeakMap();
  function noiseBuffer(ac) {
    let buf = noiseBuffers.get(ac);
    if (!buf) {
      buf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      noiseBuffers.set(ac, buf);
    }
    return buf;
  }

  function tone(ac, dest, t, f, dur, { wave = 'square', vol = 0.2, slideTo, attack = 0.004, release = 0.04 } = {}) {
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = wave;
    o.frequency.setValueAtTime(f, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + attack);
    g.gain.setValueAtTime(vol, t + Math.max(attack, dur - release));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(dest);
    o.start(t);
    o.stop(t + dur + 0.02);
  }

  function noise(ac, dest, t, dur, { vol = 0.2, hp = 1000, lp = 18000 } = {}) {
    const src = ac.createBufferSource();
    src.buffer = noiseBuffer(ac);
    const hi = ac.createBiquadFilter();
    hi.type = 'highpass';
    hi.frequency.value = hp;
    const lo = ac.createBiquadFilter();
    lo.type = 'lowpass';
    lo.frequency.value = lp;
    const g = ac.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(hi).connect(lo).connect(g).connect(dest);
    src.start(t, Math.random() * 0.5);
    src.stop(t + dur + 0.02);
  }

  const drums = {
    kick: (ac, d, t, v = 1) => tone(ac, d, t, 150, 0.14, { wave: 'sine', vol: 0.55 * v, slideTo: 42, release: 0.1 }),
    snare: (ac, d, t, v = 1) => { noise(ac, d, t, 0.12, { vol: 0.22 * v, hp: 1200 }); tone(ac, d, t, 190, 0.06, { wave: 'triangle', vol: 0.15 * v }); },
    hat: (ac, d, t, v = 1) => noise(ac, d, t, 0.035, { vol: 0.07 * v, hp: 7000 }),
  };

  // Schedule one bar of a track onto any audio context (live or offline).
  function scheduleBar(ac, dest, track, bar, start, boss) {
    const bpm = track.bpm + (boss ? 10 : 0);
    const step = 60 / bpm / 4;
    const b = bar % 4;
    const chord = track.prog[b];
    const glitch = track.glitchy;
    const rnd = (k) => Math.abs(Math.sin((bar * 16 + k) * 12.9898 + 78.233) * 43758.5453) % 1;

    // Lead melody.
    const line = track.lead[b];
    for (let k = 0; k < 16; k++) {
      const ch = line[k];
      if (ch === '.' || ch === '-') continue;
      let len = 1;
      while (k + len < 16 && line[k + len] === '-') len++;
      let midi = degreeToMidi(track, DEG(ch));
      let t = start + k * step;
      if (glitch) {
        if (rnd(k) < 0.12) continue; // dropout
        if (rnd(k + 50) < 0.15) midi += rnd(k + 90) < 0.5 ? 12 : -12; // octave jump
        if (rnd(k + 70) < 0.1) { // stutter
          for (let s = 0; s < 3; s++) tone(ac, dest, t + s * step / 3, freq(midi), step / 3.5, { wave: 'square', vol: track.leadVol });
          continue;
        }
      }
      tone(ac, dest, t, freq(midi), len * step * 0.95, { wave: track.leadWave, vol: track.leadVol, release: 0.05 });
    }

    // Bass.
    for (let k = 0; k < 16; k++) {
      const ch = track.bass[k];
      if (ch === '.' || ch === '-') continue;
      let len = 1;
      while (k + len < 16 && track.bass[k + len] === '-') len++;
      const deg = chord + (ch === 'F' ? 4 : 0);
      const midi = degreeToMidi(track, deg) - 24 + (ch === 'O' ? 12 : 0);
      tone(ac, dest, start + k * step, freq(midi), len * step * 0.9, { wave: track.bassWave, vol: track.bassWave === 'sawtooth' ? 0.08 : 0.16 });
    }

    // Arpeggio of the chord (later places and bosses).
    if (track.arp || boss) {
      const notes = [0, 2, 4, 7].map((d) => degreeToMidi(track, chord + d) + 12);
      for (let k = 0; k < 16; k++) {
        tone(ac, dest, start + k * step, freq(notes[k % 4] + (glitch && rnd(k + 30) < 0.1 ? 1 : 0)), step * 0.7, { wave: 'triangle', vol: 0.05 });
      }
    }

    // Drums. Bosses get busier hats.
    for (let k = 0; k < 16; k++) {
      const t = start + k * step;
      if (track.kick[k] === 'x') drums.kick(ac, dest, t);
      if (track.snare[k] === 'x') drums.snare(ac, dest, t);
      if (track.hat[k] === 'x' || (boss && k % 2 === 1)) drums.hat(ac, dest, t, k % 4 === 0 ? 1.2 : 0.8);
      if (glitch && rnd(k + 110) < 0.05) noise(ac, dest, t, step * 2, { vol: 0.1, hp: 300, lp: 3000 });
    }
    return 16 * step;
  }

  // ---- Sound effects ---------------------------------------------------------
  const SFX = {
    punch: (ac, d, t) => { noise(ac, d, t, 0.06, { vol: 0.3, hp: 800, lp: 6000 }); tone(ac, d, t, 220, 0.07, { wave: 'square', vol: 0.15, slideTo: 90 }); },
    kick: (ac, d, t) => { noise(ac, d, t, 0.1, { vol: 0.35, hp: 300, lp: 4000 }); tone(ac, d, t, 160, 0.14, { wave: 'square', vol: 0.2, slideTo: 50 }); },
    perfect: (ac, d, t) => { tone(ac, d, t, 1319, 0.08, { wave: 'square', vol: 0.12 }); tone(ac, d, t + 0.07, 1976, 0.18, { wave: 'square', vol: 0.12 }); },
    good: (ac, d, t) => tone(ac, d, t, 988, 0.07, { wave: 'square', vol: 0.1 }),
    miss: (ac, d, t) => { tone(ac, d, t, 110, 0.12, { wave: 'sawtooth', vol: 0.15 }); tone(ac, d, t + 0.12, 82, 0.18, { wave: 'sawtooth', vol: 0.15 }); },
    broken: (ac, d, t) => { tone(ac, d, t, 523, 0.08, { wave: 'square', vol: 0.12 }); tone(ac, d, t + 0.08, 392, 0.12, { wave: 'square', vol: 0.12 }); },
    tired: (ac, d, t) => tone(ac, d, t, 200, 0.25, { wave: 'triangle', vol: 0.15, slideTo: 120 }),
    jump: (ac, d, t) => tone(ac, d, t, 300, 0.1, { wave: 'square', vol: 0.06, slideTo: 600 }),
    slam: (ac, d, t) => { drums.kick(ac, d, t, 1.4); noise(ac, d, t, 0.25, { vol: 0.3, hp: 100, lp: 2500 }); },
    // Special charge-up: a quick rising arpeggio.
    special: (ac, d, t) => {
      [392, 523, 659, 784, 1046, 1319].forEach((f, k) => tone(ac, d, t + k * 0.045, f, 0.08, { wave: 'square', vol: 0.1 }));
      tone(ac, d, t, 200, 0.35, { wave: 'sawtooth', vol: 0.06, slideTo: 1200 });
    },
    bigHit: (ac, d, t) => { drums.kick(ac, d, t, 1.6); noise(ac, d, t, 0.3, { vol: 0.35, hp: 200, lp: 5000 }); },
    ko: (ac, d, t) => [523, 440, 349, 262, 196].forEach((f, k) => tone(ac, d, t + k * 0.11, f, 0.16, { wave: 'square', vol: 0.13 })),
    // A bot powering down as it collapses.
    collapse: (ac, d, t) => { tone(ac, d, t, 600, 0.6, { wave: 'sawtooth', vol: 0.06, slideTo: 60 }); noise(ac, d, t + 0.1, 0.4, { vol: 0.08, hp: 2000 }); },
    win: (ac, d, t) => [523, 659, 784, 1046, 784, 1046].forEach((f, k) => tone(ac, d, t + k * 0.1, f, k === 5 ? 0.4 : 0.12, { wave: 'square', vol: 0.12 })),
    lose: (ac, d, t) => [392, 370, 349, 330].forEach((f, k) => tone(ac, d, t + k * 0.2, f, 0.22, { wave: 'triangle', vol: 0.16 })),
    unlock: (ac, d, t) => [523, 659, 784, 1047, 1319].forEach((f, k) => tone(ac, d, t + k * 0.08, f, 0.12, { wave: 'square', vol: 0.11 })),
    glitch: (ac, d, t) => { for (let k = 0; k < 6; k++) tone(ac, d, t + k * 0.03, 200 + Math.random() * 1800, 0.03, { wave: 'square', vol: 0.07 }); },
  };

  // ---- Live playback ------------------------------------------------------------
  let ac = null;
  let master = null;
  let sfxBus = null;
  let musicBus = null;
  let soundOn = true;
  let musicOn = true;
  let wanted = null; // { name, boss }
  let playing = null;
  let timer = null;
  let nextBar = 0;
  let barIndex = 0;
  let ducked = false;

  function ensure() {
    if (!ac) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      try { ac = new AC(); } catch (e) { return null; }
      master = ac.createGain();
      master.gain.value = 0.6;
      master.connect(ac.destination);
      sfxBus = ac.createGain();
      sfxBus.gain.value = 0.9;
      sfxBus.connect(master);
    }
    if (ac.state === 'suspended') ac.resume().catch(() => {});
    return ac;
  }

  // Browsers only allow sound after the player clicks or presses a key.
  function unlock() {
    if (!ensure()) return;
    if (wanted && musicOn && !playing) startMusic();
  }

  function sfx(name) {
    if (!soundOn || !SFX[name] || !ensure() || ac.state !== 'running') return;
    SFX[name](ac, sfxBus, ac.currentTime + 0.005);
  }

  // A plain menu blip at a given pitch.
  function blip(f = 660) {
    if (!soundOn || !ensure() || ac.state !== 'running') return;
    tone(ac, sfxBus, ac.currentTime + 0.005, f, 0.09, { wave: 'square', vol: 0.08 });
  }

  function stopMusic(fade = 0.4) {
    clearInterval(timer);
    timer = null;
    playing = null;
    if (musicBus && ac) {
      const bus = musicBus;
      bus.gain.cancelScheduledValues(ac.currentTime);
      bus.gain.setValueAtTime(bus.gain.value, ac.currentTime);
      bus.gain.linearRampToValueAtTime(0, ac.currentTime + fade);
      setTimeout(() => bus.disconnect(), fade * 1000 + 100);
    }
    musicBus = null;
  }

  function startMusic() {
    if (!wanted || !ensure() || ac.state !== 'running') return;
    stopMusic(0.25);
    const track = TRACKS[wanted.name];
    if (!track) return;
    playing = { ...wanted };
    musicBus = ac.createGain();
    musicBus.gain.value = ducked ? 0.25 : 0.7;
    musicBus.connect(master);
    barIndex = 0;
    nextBar = ac.currentTime + 0.1;
    const tick = () => {
      while (nextBar < ac.currentTime + 0.3) {
        nextBar += scheduleBar(ac, musicBus, track, barIndex, nextBar, playing.boss);
        barIndex++;
      }
    };
    tick();
    timer = setInterval(tick, 60);
  }

  // Ask for a track; it starts now if sound is allowed, or as soon as it is.
  function music(name, { boss = false } = {}) {
    if (playing && playing.name === name && playing.boss === boss) return;
    wanted = { name, boss };
    if (musicOn) startMusic();
  }

  function setSound(on) { soundOn = on; }

  function setMusic(on) {
    musicOn = on;
    if (on) startMusic(); else stopMusic(0.2);
  }

  // Quieter music while paused.
  function duck(on) {
    ducked = on;
    if (musicBus && ac) musicBus.gain.setTargetAtTime(on ? 0.25 : 0.7, ac.currentTime, 0.05);
  }

  // Render a track to an audio buffer (used to make preview files).
  function render(name, seconds, { boss = false, sampleRate = 22050 } = {}) {
    const off = new OfflineAudioContext(1, Math.ceil(seconds * sampleRate), sampleRate);
    const g = off.createGain();
    g.gain.value = 0.42;
    g.connect(off.destination);
    let t = 0;
    let bar = 0;
    while (t < seconds) { t += scheduleBar(off, g, TRACKS[name], bar, t, boss); bar++; }
    return off.startRendering();
  }

  window.SHAudio = {
    TRACKS: Object.keys(TRACKS), unlock, sfx, blip, music, stopMusic, setSound, setMusic, duck, render,
    get playing() { return playing && playing.name; },
    get state() { return ac ? ac.state : 'none'; },
  };
})();
