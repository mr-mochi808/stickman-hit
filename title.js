// Stickman Hit - pixel-art title screen.
// Everything is drawn on a 16px tile grid: 256x144 canvas = 16x9 tiles.
(() => {
  const TILE = 16;
  const W = 256;
  const H = 144;

  const canvas = document.getElementById('screen');
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  const C = {
    night: '#1a1c2c',
    purple: '#5d275d',
    red: '#b13e53',
    orange: '#ef7d57',
    yellow: '#ffcd75',
    green: '#38b764',
    darkGreen: '#257179',
    navy: '#29366f',
    blue: '#3b5dc9',
    sky: '#41a6f6',
    cyan: '#73eff7',
    white: '#f4f4f4',
    grey: '#94b0c2',
    slate: '#566c86',
    dark: '#333c57',
  };

  // ---- 5x7 pixel font -------------------------------------------------
  const FONT = {
    A: ['01110', '10001', '10001', '11111', '10001', '10001', '10001'],
    B: ['11110', '10001', '10001', '11110', '10001', '10001', '11110'],
    C: ['01110', '10001', '10000', '10000', '10000', '10001', '01110'],
    D: ['11110', '10001', '10001', '10001', '10001', '10001', '11110'],
    E: ['11111', '10000', '10000', '11110', '10000', '10000', '11111'],
    F: ['11111', '10000', '10000', '11110', '10000', '10000', '10000'],
    G: ['01110', '10001', '10000', '10111', '10001', '10001', '01111'],
    H: ['10001', '10001', '10001', '11111', '10001', '10001', '10001'],
    I: ['11111', '00100', '00100', '00100', '00100', '00100', '11111'],
    J: ['00111', '00010', '00010', '00010', '00010', '10010', '01100'],
    K: ['10001', '10010', '10100', '11000', '10100', '10010', '10001'],
    L: ['10000', '10000', '10000', '10000', '10000', '10000', '11111'],
    M: ['10001', '11011', '10101', '10101', '10001', '10001', '10001'],
    N: ['10001', '11001', '10101', '10011', '10001', '10001', '10001'],
    O: ['01110', '10001', '10001', '10001', '10001', '10001', '01110'],
    P: ['11110', '10001', '10001', '11110', '10000', '10000', '10000'],
    Q: ['01110', '10001', '10001', '10001', '10101', '10010', '01101'],
    R: ['11110', '10001', '10001', '11110', '10100', '10010', '10001'],
    S: ['01111', '10000', '10000', '01110', '00001', '00001', '11110'],
    T: ['11111', '00100', '00100', '00100', '00100', '00100', '00100'],
    U: ['10001', '10001', '10001', '10001', '10001', '10001', '01110'],
    V: ['10001', '10001', '10001', '10001', '10001', '01010', '00100'],
    W: ['10001', '10001', '10001', '10101', '10101', '10101', '01010'],
    X: ['10001', '10001', '01010', '00100', '01010', '10001', '10001'],
    Y: ['10001', '10001', '01010', '00100', '00100', '00100', '00100'],
    Z: ['11111', '00001', '00010', '00100', '01000', '10000', '11111'],
    0: ['01110', '10001', '10011', '10101', '11001', '10001', '01110'],
    1: ['00100', '01100', '00100', '00100', '00100', '00100', '01110'],
    2: ['01110', '10001', '00001', '00010', '00100', '01000', '11111'],
    3: ['11110', '00001', '00001', '01110', '00001', '00001', '11110'],
    4: ['00010', '00110', '01010', '10010', '11111', '00010', '00010'],
    5: ['11111', '10000', '11110', '00001', '00001', '10001', '01110'],
    6: ['00110', '01000', '10000', '11110', '10001', '10001', '01110'],
    7: ['11111', '00001', '00010', '00100', '01000', '01000', '01000'],
    8: ['01110', '10001', '10001', '01110', '10001', '10001', '01110'],
    9: ['01110', '10001', '10001', '01111', '00001', '00010', '01100'],
    '-': ['00000', '00000', '00000', '11111', '00000', '00000', '00000'],
    ':': ['00000', '01100', '01100', '00000', '01100', '01100', '00000'],
    '!': ['00100', '00100', '00100', '00100', '00100', '00000', '00100'],
    '.': ['00000', '00000', '00000', '00000', '00000', '01100', '01100'],
    ',': ['00000', '00000', '00000', '00000', '01100', '00100', '01000'],
    '?': ['01110', '10001', '00001', '00110', '00100', '00000', '00100'],
    '+': ['00000', '00100', '00100', '11111', '00100', '00100', '00000'],
    '>': ['01000', '00100', '00010', '00001', '00010', '00100', '01000'],
    '<': ['00010', '00100', '01000', '10000', '01000', '00100', '00010'],
    '/': ['00001', '00001', '00010', '00100', '01000', '10000', '10000'],
    ' ': ['00000', '00000', '00000', '00000', '00000', '00000', '00000'],
  };

  function textWidth(str, scale = 1) {
    return str.length ? (str.length * 6 - 1) * scale : 0;
  }

  function drawText(str, x, y, color, scale = 1) {
    ctx.fillStyle = color;
    for (let i = 0; i < str.length; i++) {
      const glyph = FONT[str[i].toUpperCase()] || FONT[' '];
      for (let row = 0; row < 7; row++) {
        for (let col = 0; col < 5; col++) {
          if (glyph[row][col] === '1') {
            ctx.fillRect(x + (i * 6 + col) * scale, y + row * scale, scale, scale);
          }
        }
      }
    }
  }

  function drawTextCentered(str, y, color, scale = 1, shadow) {
    const x = Math.round((W - textWidth(str, scale)) / 2);
    if (shadow) drawText(str, x + scale, y + scale, shadow, scale);
    drawText(str, x, y, color, scale);
  }

  // ---- 16x16 icons ----------------------------------------------------
  // '.' transparent, other chars map to palette entries.
  const SPRITE_COLORS = { k: C.night, w: C.white, r: C.red, y: C.yellow, o: C.orange };

  const HIT_SPARK = [
    '................',
    '.......y........',
    '...y...y...y....',
    '....y..o..y.....',
    '.....yoooy......',
    '..yyoowwwooyy...',
    '.....yoooy......',
    '....y..o..y.....',
    '...y...y...y....',
    '.......y........',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
  ];

  const GEAR = [
    '................',
    '.......kk.......',
    '...kk.kwwk.kk...',
    '..kwwkwwwwkwwk..',
    '..kwwwwwwwwwwk..',
    '...kwwwkkwwwk...',
    '..kwwwk..kwwwk..',
    '.kwwwk....kwwwk.',
    '.kwwwk....kwwwk.',
    '..kwwwk..kwwwk..',
    '...kwwwkkwwwk...',
    '..kwwwwwwwwwwk..',
    '..kwwkwwwwkwwk..',
    '...kk.kwwk.kk...',
    '.......kk.......',
    '................',
  ];

  const BOLT_ICON = [
    '................',
    '................',
    '.........kk.....',
    '........kyk.....',
    '.......kyyk.....',
    '......kyyk......',
    '.....kyyyykk....',
    '....kyyyyyyk....',
    '....kkkyyyk.....',
    '......kyyk......',
    '.....kyyk.......',
    '.....kyk........',
    '.....kk.........',
    '................',
    '................',
    '................',
  ];

  const LOCK_ICON = [
    '................',
    '................',
    '......kkkk......',
    '.....kwkkwk.....',
    '.....kk..kk.....',
    '.....kk..kk.....',
    '....kkkkkkkk....',
    '....kyyyyyyk....',
    '....kyyookyk....',
    '....kyyookyk....',
    '....kyyyyyyk....',
    '....kyyyyyyk....',
    '....kkkkkkkk....',
    '................',
    '................',
    '................',
  ];

  const PLAY_ICON = [
    '................',
    '................',
    '....kk..........',
    '....kwk.........',
    '....kwwk........',
    '....kwwwk.......',
    '....kwwwwk......',
    '....kwwwwwk.....',
    '....kwwwwwk.....',
    '....kwwwwk......',
    '....kwwwk.......',
    '....kwwk........',
    '....kwk.........',
    '....kk..........',
    '................',
    '................',
  ];

  function drawIcon(sprite, x, y, flip = false) {
    for (let row = 0; row < 16; row++) {
      for (let col = 0; col < 16; col++) {
        const ch = sprite[row][flip ? 15 - col : col];
        if (ch === '.') continue;
        ctx.fillStyle = SPRITE_COLORS[ch];
        ctx.fillRect(x + col, y + row, 1, 1);
      }
    }
  }

  // ---- Settings (per-browser, best effort) ----------------------------
  const settings = { sound: true, music: true, shake: true };
  try {
    Object.assign(settings, JSON.parse(localStorage.getItem('stickman-hit-settings')) || {});
  } catch (e) { /* storage unavailable: keep defaults */ }

  let progress = { cleared: 0 };
  try {
    Object.assign(progress, JSON.parse(localStorage.getItem('stickman-hit-progress')) || {});
  } catch (e) { /* storage unavailable: start fresh */ }

  function saveProgress() {
    try {
      localStorage.setItem('stickman-hit-progress', JSON.stringify(progress));
    } catch (e) { /* ignore */ }
  }

  function saveSettings() {
    try {
      localStorage.setItem('stickman-hit-settings', JSON.stringify(settings));
    } catch (e) { /* ignore */ }
  }

  // Tiny square-wave blip so the buttons feel clicky.
  let audio;
  function blip(freq = 660) {
    if (!settings.sound) return;
    try {
      audio = audio || new (window.AudioContext || window.webkitAudioContext)();
      const osc = audio.createOscillator();
      const gain = audio.createGain();
      osc.type = 'square';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.06, audio.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + 0.1);
      osc.connect(gain).connect(audio.destination);
      osc.start();
      osc.stop(audio.currentTime + 0.1);
    } catch (e) { /* no audio */ }
  }

  // ---- Screens & buttons ----------------------------------------------
  // Buttons snap to the 16px grid: 6 tiles wide, 1 tile tall.
  const BTN_W = TILE * 6;
  const BTN_H = TILE;
  const BTN_X = (W - BTN_W) / 2;

  const screens = {
    title: [
      { label: 'PLAY', icon: PLAY_ICON, y: 58, action: () => go('difficulty') },
      { label: 'QUICK FIGHT', icon: BOLT_ICON, y: 77, quick: true, action: () => {
        if (progress.cleared < 1) {
          blip(160);
          toast = { text: 'BEAT LEVEL 1 TO UNLOCK QUICK FIGHT', until: frame + 120 };
          return;
        }
        go('quick');
      } },
      { label: 'SETTINGS', icon: GEAR, y: 96, action: () => go('settings') },
    ],
    settings: [
      { key: 'sound', label: 'SOUND', y: TILE * 3 },
      { key: 'music', label: 'MUSIC', y: TILE * 4 + 4 },
      { key: 'shake', label: 'SHAKE', y: TILE * 5 + 8 },
      { label: 'BACK', y: TILE * 6 + 16, action: () => go('title') },
    ],
    difficulty: [
      { label: 'EASY', y: TILE * 2 + 8, action: () => pickDifficulty('easy') },
      { label: 'NORMAL', y: TILE * 3 + 12, action: () => pickDifficulty('normal') },
      { label: 'HARD', y: TILE * 4 + 16, action: () => pickDifficulty('hard') },
      { label: 'BACK', y: TILE * 6 + 8, action: () => go('title') },
    ],
    // Main Mode map: 5 levels and the boss, filled in below.
    map: [],
    fight: [],
    // Quick Fight setup (from docs/game-design.md): mode, stage, difficulty and timer.
    quick: [
      { opt: 'mode', label: 'MODE', values: ['VS COMPUTER', '2 PLAYERS'], x: 40, w: 176, y: 26 },
      { opt: 'stage', label: 'STAGE', values: ['GRASSY FIELDS'], x: 40, w: 176, y: 45 },
      { opt: 'difficulty', label: 'DIFFICULTY', values: ['EASY', 'NORMAL', 'HARD'], x: 40, w: 176, y: 64 },
      { opt: 'timer', label: 'TIMER', values: ['60 SEC', '2 MIN', 'NO LIMIT'], x: 40, w: 176, y: 83 },
      { label: 'PICK FIGHTERS', y: 106, action: () => openSelect() },
      { label: 'BACK', small: true, x: 4, y: H - 15, w: 40, h: 11, action: () => go('title') },
    ],
    // Character select: portrait boxes plus a back button, rebuilt for each pick.
    select: [],
    versus: [
      { label: 'FIGHT!', y: 120, action: () => startQuickFight() },
      { label: 'BACK', small: true, x: 4, y: H - 15, w: 40, h: 11, action: () => { picks.pop(); buildSelect(); screen = 'select'; selected = 0; } },
    ],
  };

  // ---- Character select -------------------------------------------------
  const FIGHTERS = window.CHARACTERS;
  // Computer-only opponents for Quick Fight.
  const BOTS = [
    { id: 'bot', name: 'BOT', team: C.grey, tagline: 'A gray bot made by Cyborg', cpuOnly: true, sprites: window.Rig.BOT_SPRITES.bot },
    { id: 'brute', name: 'BOT BRUTE', team: C.grey, tagline: 'The Grassy Fields boss', cpuOnly: true, sprites: window.Rig.BOT_SPRITES.brute },
  ];
  const PLAYER_COLORS = [C.red, C.sky];
  const quickOpts = { mode: 0, stage: 0, difficulty: 1, timer: 0 };
  const TIMER_SECONDS = [60, 120, 0];
  const DIFFICULTIES = ['easy', 'normal', 'hard'];
  const twoPlayers = () => quickOpts.mode === 1;

  // picks[0] is player 1's fighter, picks[1] is player 2's (or the computer's).
  let picks = [];

  // Fighters unlock by beating them in Main Mode (Glitch: the secret code, until Glitch Mode exists).
  const UNLOCK_CODE = 'GLITCH';
  let typed = '';
  let unlocked = [];
  try {
    unlocked = JSON.parse(localStorage.getItem('stickman-hit-unlocked')) || [];
  } catch (e) { /* storage unavailable */ }

  function isLocked(f) {
    if (f.id === 'brute') return progress.cleared < 6;
    return !!f.locked && !unlocked.includes(f.id);
  }

  function unlock(f) {
    unlocked.push(f.id);
    try {
      localStorage.setItem('stickman-hit-unlocked', JSON.stringify(unlocked));
    } catch (e) { /* ignore */ }
    flash = { text: `${f.name} UNLOCKED!`, until: frame + 120 };
    [523, 659, 784, 1047].forEach((n, i) => setTimeout(() => blip(n), i * 90));
  }

  let flash = null;

  // Who can be picked right now: fighters for players, fighters plus bots for the computer.
  function pickList() {
    return picks.length === 1 && !twoPlayers() ? [...BOTS, ...FIGHTERS] : FIGHTERS;
  }

  function buildSelect() {
    const list = pickList();
    const size = list.length > 5 ? 28 : 32;
    const gap = list.length > 5 ? 4 : 6;
    const x0 = (W - (list.length * size + (list.length - 1) * gap)) / 2;
    screens.select = list.map((f, i) => ({
      portrait: f,
      x: x0 + i * (size + gap),
      y: 36,
      w: size,
      h: size,
      action: () => {
        if (isLocked(f)) {
          blip(160);
          flash = { text: f.id === 'brute' ? 'BEAT THE BOT BRUTE TO UNLOCK' : 'BEAT HIM IN MAIN MODE TO UNLOCK', until: frame + 70 };
          return;
        }
        picks.push(f);
        if (picks.length === 2) { screen = 'versus'; selected = 0; } else { buildSelect(); selected = 0; }
      },
    }));
    screens.select.push({ label: 'BACK', small: true, x: 4, y: H - 15, w: 40, h: 11, action: backFromSelect });
  }

  function openSelect() {
    picks = [];
    buildSelect();
    screen = 'select';
    selected = 0;
  }

  function backFromSelect() {
    if (picks.length) {
      const f = picks.pop();
      buildSelect();
      selected = Math.max(0, screens.select.findIndex((b) => b.portrait === f));
    } else {
      go('quick');
    }
  }

  function startQuickFight() {
    startFight(DIFFICULTIES[quickOpts.difficulty], {
      kind: 'quick',
      p1: picks[0].id,
      p2: picks[1].id,
      twoPlayer: twoPlayers(),
      timer: TIMER_SECONDS[quickOpts.timer],
    });
  }

  function optLabel(btn) {
    if (btn.opt === 'difficulty' && twoPlayers()) return 'DIFFICULTY: --';
    return `${btn.label}: ${btn.values[quickOpts[btn.opt]]}`;
  }

  function cycleOpt(btn, dir) {
    quickOpts[btn.opt] = (quickOpts[btn.opt] + dir + btn.values.length) % btn.values.length;
    blip(dir > 0 ? 660 : 520);
  }

  let screen = 'title';
  let selected = 0;
  let pressed = -1;
  let toast = null;

  function go(next) {
    toast = null;
    if (next !== 'fight') { fight = null; window.stickFight = null; }
    screen = next;
    selected = next === 'difficulty' ? 1 : next === 'map' ? Math.min(progress.cleared, MAP_NODES - 1) : 0;
  }

  // ---- Main Mode map -------------------------------------------------------
  const MAP_NODES = 6; // levels 1-5, then the Bot Brute
  const NODE = 24;
  const NODE_GAP = 12;
  const NODE_Y = 62;
  const NODE_X = (W - (MAP_NODES * NODE + (MAP_NODES - 1) * NODE_GAP)) / 2;
  let mainDifficulty = 'normal';

  for (let k = 0; k < MAP_NODES; k++) {
    screens.map.push({
      node: k,
      x: NODE_X + k * (NODE + NODE_GAP),
      y: NODE_Y,
      w: NODE,
      h: NODE,
      action: () => {
        if (k > progress.cleared) {
          blip(160);
          toast = { text: `BEAT LEVEL ${k} FIRST`, until: frame + 90 };
          return;
        }
        startNode(k);
      },
    });
  }
  screens.map.push({ label: 'BACK', small: true, x: 4, y: H - 15, w: 40, h: 11, action: () => go('title') });

  function startNode(k) {
    startFight(mainDifficulty, k < 5 ? { kind: 'level', level: k + 1 } : { kind: 'boss' });
  }

  function pickDifficulty(d) {
    mainDifficulty = d;
    go('map');
  }

  // ---- The fight ---------------------------------------------------------
  let fight = null;

  function startFight(difficulty, mode) {
    fight = window.StickFight.create({
      ui: { drawText, textWidth, C, blip, settings },
      difficulty,
      mode,
      // Progress saves automatically the moment a level is cleared.
      onLevelClear: (n) => {
        if (n > progress.cleared) {
          progress.cleared = n;
          saveProgress();
        }
      },
      onExit: (action) => {
        if (action === 'again') {
          startFight(difficulty, mode);
        } else if (action === 'select') {
          fight = null;
          window.stickFight = null;
          openSelect();
        } else if (action === 'next' || action === 'map') {
          go('map');
          if (action === 'next') selected = Math.min(progress.cleared, MAP_NODES - 1);
          else if (mode.kind !== 'quick') selected = mode.kind === 'boss' ? 5 : mode.level - 1;
        } else {
          go('title');
        }
      },
    });
    screen = 'fight';
    window.stickFight = fight;
  }

  function drawNode(btn, i) {
    const k = btn.node;
    const hot = i === selected;
    const cleared = k < progress.cleared;
    const open = k <= progress.cleared;
    const boss = k === MAP_NODES - 1;
    const { x, y } = btn;
    ctx.fillStyle = hot ? C.yellow : C.night;
    ctx.fillRect(x - 2, y - 2, NODE + 4, NODE + 4);
    ctx.fillStyle = !open ? C.dark : cleared ? C.green : boss ? C.red : C.blue;
    ctx.fillRect(x, y, NODE, NODE);
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.fillRect(x, y, NODE, 2);
    if (!open) {
      drawIcon(LOCK_ICON, x + 4, y + 4);
    } else if (boss) {
      drawText('B', x + 9, y + 5, C.white);
      drawText('OSS', x + 3, y + 14, C.white);
    } else {
      drawText(String(k + 1), x + 6, y + 6, C.night, 2);
      drawText(String(k + 1), x + 5, y + 5, C.white, 2);
    }
    if (cleared) {
      // Check mark.
      ctx.fillStyle = C.yellow;
      [[17, 3], [18, 2], [19, 1], [16, 4], [15, 5], [14, 4], [13, 3]].forEach(([dx, dy]) => ctx.fillRect(x + dx, y + dy + 1, 2, 2));
    }
  }

  function drawMap() {
    drawTextCentered('GRASSY FIELDS', 6, C.yellow, 2, C.night);
    drawTextCentered(`MAIN MODE  ${mainDifficulty.toUpperCase()}`, 22, C.grey, 1, C.night);
    // The path between levels.
    ctx.fillStyle = C.yellow;
    for (let x = NODE_X + NODE; x < NODE_X + (MAP_NODES - 1) * (NODE + NODE_GAP); x += 4) {
      ctx.fillRect(x, NODE_Y + NODE / 2 - 1, 2, 2);
    }
    // The Ninja stands on the chosen level.
    const btn = screens.map[selected];
    if (btn && btn.node != null) {
      const ninja = FIGHTERS.find((f) => f.id === 'ninja');
      const bob = Math.floor(frame / 20) % 2;
      window.drawSprite(ctx, ninja.sprites[Math.floor(frame / 12) % 2 ? 'walk1' : 'idle'], btn.x - 2, NODE_Y - 30 + bob);
      const k = btn.node;
      const info = k < 5
        ? [`LEVEL ${k + 1}: 3 BOTS IN A ROW, 60 SECONDS EACH`, 'HEALTH CARRIES OVER BETWEEN BOTS']
        : ['BOSS: THE BOT BRUTE', 'BEST OF 3 ROUNDS, 90 SECONDS EACH'];
      drawTextCentered(info[0], 94, C.white, 1, C.night);
      drawTextCentered(info[1], 104, C.grey, 1, C.night);
    }
    if (progress.cleared >= MAP_NODES) {
      drawTextCentered('CLEARED! THE DOJO IS NEXT (COMING SOON)', 116, C.green, 1, C.night);
    }
    drawText('ENTER: START  ESC: BACK', W - textWidth('ENTER: START  ESC: BACK') - 4, H - 13, C.grey);
  }

  function activate(i) {
    const btn = screens[screen][i];
    if (!btn) return;
    if (btn.opt) {
      cycleOpt(btn, 1);
    } else if (btn.key) {
      settings[btn.key] = !settings[btn.key];
      saveSettings();
      blip(settings[btn.key] ? 880 : 440);
    } else {
      blip(btn.label === 'BACK' ? 440 : 660);
      btn.action();
    }
  }

  function buttonLabel(btn) {
    if (btn.opt) return optLabel(btn);
    return btn.key ? `${btn.label}: ${settings[btn.key] ? 'ON' : 'OFF'}` : btn.label;
  }

  function drawPortrait(btn, i) {
    const hot = i === selected;
    const picker = picks.length;
    const lift = hot ? -2 : 0;
    const x = btn.x;
    const y = btn.y + lift;
    const takenBy = picks.indexOf(btn.portrait);
    const pad = (btn.w - 28) / 2;

    ctx.fillStyle = C.night;
    ctx.fillRect(x - 2, y - 2, btn.w + 4, btn.h + 4);
    if (hot) {
      ctx.fillStyle = PLAYER_COLORS[picker];
      ctx.fillRect(x - 2, y - 2, btn.w + 4, btn.h + 4);
    }
    ctx.fillStyle = C.sky;
    ctx.fillRect(x, y, btn.w, btn.h);
    ctx.fillStyle = C.cyan;
    ctx.fillRect(x, y, btn.w, 2);
    const f = btn.portrait;
    if (isLocked(f)) {
      // Dark silhouette with a padlock.
      ctx.fillStyle = C.dark;
      ctx.fillRect(x, y, btn.w, btn.h);
      const sprite = f.sprites.idle.map((row) => row.replace(/[^.]/g, 'k'));
      window.drawSprite(ctx, sprite, x + pad, y + pad + 1);
      const lx = x + btn.w / 2 - 4;
      const ly = y + btn.h / 2 - 2;
      ctx.fillStyle = C.yellow;
      ctx.fillRect(lx, ly + 4, 8, 6);
      ctx.fillRect(lx + 1, ly, 1, 4);
      ctx.fillRect(lx + 6, ly, 1, 4);
      ctx.fillRect(lx + 1, ly, 6, 1);
      ctx.fillStyle = C.night;
      ctx.fillRect(lx + 3, ly + 6, 2, 2);
      return;
    }
    window.drawSprite(ctx, f.sprites[hot ? 'victory' : 'idle'], x + pad, y + pad + 1, 1, picks.length === 1);
    // Team color stripe along the bottom.
    ctx.fillStyle = f.team;
    ctx.fillRect(x, y + btn.h - 2, btn.w, 2);

    if (takenBy >= 0) drawText('P1', x + 1, y + 1, PLAYER_COLORS[0]);
  }

  function drawSmallButton(btn, i) {
    const hot = i === selected;
    ctx.fillStyle = C.night;
    ctx.fillRect(btn.x - 1, btn.y - 1, btn.w + 2, btn.h + 2);
    ctx.fillStyle = hot ? C.orange : C.blue;
    ctx.fillRect(btn.x, btn.y, btn.w, btn.h);
    const tx = Math.round(btn.x + (btn.w - textWidth(btn.label)) / 2);
    drawText(btn.label, tx, btn.y + 2, C.white);
  }

  function drawButton(btn, i) {
    if (btn.node != null) return drawNode(btn, i);
    if (btn.portrait != null) return drawPortrait(btn, i);
    if (btn.small) return drawSmallButton(btn, i);
    const hot = i === selected;
    const down = i === pressed;
    const y = btn.y + (down ? 1 : 0);
    const bx = btn.x ?? BTN_X;
    const bw = btn.w ?? BTN_W;

    // Drop shadow, border, face, top highlight.
    ctx.fillStyle = C.night;
    if (!down) ctx.fillRect(bx + 1, btn.y + BTN_H, bw, 2);
    ctx.fillRect(bx - 1, y - 1, bw + 2, BTN_H + 2);
    ctx.fillStyle = hot ? C.orange : C.blue;
    ctx.fillRect(bx, y, bw, BTN_H);
    ctx.fillStyle = hot ? C.yellow : C.sky;
    ctx.fillRect(bx, y, bw, 2);
    ctx.fillStyle = hot ? C.red : C.navy;
    ctx.fillRect(bx, y + BTN_H - 2, bw, 2);

    const locked = btn.quick && progress.cleared < 1;
    if (btn.icon) drawIcon(locked ? LOCK_ICON : btn.icon, bx, y);

    const label = buttonLabel(btn);
    const tx = Math.round(bx + (bw - textWidth(label)) / 2 + (btn.icon ? 6 : 0));
    drawText(label, tx + 1, y + 5, C.night);
    drawText(label, tx, y + 4, C.white);

    if (hot && Math.floor(frame / 20) % 2 === 0) {
      // Options show arrows you can press left and right.
      drawText(btn.opt ? '<' : '>', bx - 10, y + 4, C.yellow);
      drawText(btn.opt ? '>' : '<', bx + bw + 5, y + 4, C.yellow);
    }
  }

  // ---- Background -----------------------------------------------------
  const stars = Array.from({ length: 24 }, (_, i) => ({
    x: (i * 53 + 17) % W,
    y: (i * 29 + 5) % (TILE * 5),
    phase: i * 7,
  }));

  function drawBackground(ground = true) {
    // Sky in 16px bands.
    const bands = [C.night, C.night, C.navy, C.navy, C.purple, C.red, C.orange];
    bands.forEach((color, i) => {
      ctx.fillStyle = color;
      ctx.fillRect(0, i * TILE, W, TILE);
    });
    // Dithered seams between bands.
    for (let i = 1; i < bands.length; i++) {
      ctx.fillStyle = bands[i];
      for (let x = 0; x < W; x += 2) ctx.fillRect(x + (i % 2), i * TILE - 1, 1, 1);
    }

    for (const s of stars) {
      if ((frame + s.phase) % 90 < 70) {
        ctx.fillStyle = C.white;
        ctx.fillRect(s.x, s.y, 1, 1);
      }
    }

    if (!ground) {
      ctx.fillStyle = C.night;
      ctx.fillRect(0, H - TILE * 2, W, TILE * 2);
      return;
    }

    // Ground: one row of 16x16 grass/dirt tiles plus a dirt row below.
    const groundY = H - TILE * 2;
    for (let tx = 0; tx < W; tx += TILE) {
      ctx.fillStyle = C.darkGreen;
      ctx.fillRect(tx, groundY, TILE, TILE);
      ctx.fillStyle = C.green;
      ctx.fillRect(tx, groundY, TILE, 4);
      ctx.fillRect(tx + 3, groundY + 4, 2, 2);
      ctx.fillRect(tx + 10, groundY + 4, 2, 1);
      ctx.fillStyle = C.dark;
      ctx.fillRect(tx, groundY + TILE, TILE, TILE);
      ctx.fillStyle = C.slate;
      ctx.fillRect(tx + 4, groundY + TILE + 5, 2, 2);
      ctx.fillRect(tx + 11, groundY + TILE + 10, 2, 2);
    }
  }

  // ---- Title scene ----------------------------------------------------
  const GROUND_Y = H - TILE * 2;

  // A short fight loop: each beat is one pose for the attacker and defender.
  function fightPose(beat, attacking) {
    if (beat === 1) return attacking ? 'attack' : 'hit';
    if (beat === 3) return attacking ? 'hit' : 'attack';
    return 'idle';
  }

  function drawPair(a, b, x, offset, scale = 1) {
    const beat = Math.floor((frame + offset) / 40) % 4;
    const bob = beat % 2 === 0 && Math.floor(frame / 15) % 2 ? scale : 0;
    const size = window.SPRITE_SIZE * scale;
    const y = GROUND_Y - size + scale;
    const gap = 24 * scale;
    window.drawSprite(ctx, a.sprites[fightPose(beat, true)], x, y + bob, scale);
    window.drawSprite(ctx, b.sprites[fightPose(beat, false)], x + gap, y + bob, scale, true);
    if (beat === 1) drawIcon(HIT_SPARK, x + gap - 2, y + 4 * scale);
    if (beat === 3) drawIcon(HIT_SPARK, x + 6, y + 4 * scale, true);
  }

  function drawFighters() {
    const by = (id) => FIGHTERS.find((f) => f.id === id);
    drawPair(by('ninja'), by('boxer'), TILE - 2, 0);
    drawPair(by('samurai'), by('cyborg'), TILE * 11 - 4, 40);
  }

  function drawTitle() {
    const wobble = Math.round(Math.sin(frame / 20));
    const y = TILE + 2 + wobble;
    const text = 'STICKMAN-HIT';
    const x = Math.round((W - textWidth(text, 2)) / 2);
    // Thick outline, then shadow, then face.
    for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, -1], [-1, 1], [1, 1]]) {
      drawText(text, x + dx * 2, y + dy * 2, C.night, 2);
    }
    drawText(text, x, y + 2, C.red, 2);
    drawText(text, x, y, C.yellow, 2);
    if (toast && frame < toast.until) drawTextCentered(toast.text, TILE * 3 - 1, frame % 12 < 6 ? C.yellow : C.white);
    else drawTextCentered('PRESS ENTER OR CLICK', TILE * 3 - 1, C.grey);
  }

  // ---- Main loop ------------------------------------------------------
  let frame = 0;

  function drawStatBars(f, y) {
    const rows = [['POW', 'power'], ['SPD', 'speed'], ['RCH', 'reach'], ['DEF', 'defense']];
    rows.forEach(([label, key], r) => {
      const ry = y + r * 9;
      drawText(label, 84, ry, C.grey);
      for (let p = 0; p < 5; p++) {
        ctx.fillStyle = p < f.stats[key] ? f.team : C.dark;
        ctx.fillRect(108 + p * 13, ry, 11, 7);
      }
    });
  }

  function drawSelect() {
    const picker = picks.length;
    const who = picker === 0 ? 'PLAYER 1' : twoPlayers() ? 'PLAYER 2' : 'COMPUTER';
    drawTextCentered(picker === 1 && !twoPlayers() ? 'PICK YOUR OPPONENT' : 'PICK YOUR FIGHTER', 6, C.yellow, 1, C.night);
    drawTextCentered(who, 18, PLAYER_COLORS[picker], 1, C.night);

    const hover = screens.select[selected];
    const hovered = hover && hover.portrait ? hover.portrait : null;
    const shown = hovered && !isLocked(hovered) ? hovered : picks[0] || FIGHTERS[0];
    if (hovered && isLocked(hovered)) {
      drawTextCentered('???', 72, C.grey, 2, C.night);
      drawTextCentered('LOCKED', 88, C.white, 1, C.night);
      const how = hovered.id === 'brute' ? 'BEAT THE BOT BRUTE IN MAIN MODE' : hovered.unlock ? hovered.unlock.toUpperCase() : '';
      drawTextCentered(how, 100, C.grey, 1, C.night);
    } else {
      drawTextCentered(shown.name, 72, shown.team, 2, C.night);
      drawTextCentered(shown.tagline.toUpperCase(), 88, C.white, 1, C.night);
      if (shown.stats) drawStatBars(shown, 98);
      else drawTextCentered('COMPUTER ONLY', 100, C.grey, 1, C.night);
    }
    if (flash && frame < flash.until) {
      ctx.fillStyle = C.night;
      ctx.fillRect(0, 26, W, 9);
      drawTextCentered(flash.text, 27, Math.floor(frame / 6) % 2 ? C.yellow : C.white);
    }

    // Big previews: player 1 on the left, player 2 on the right.
    const walk = Math.floor(frame / 12) % 2 ? 'walk1' : 'walk2';
    const p1 = picks[0] || shown;
    window.drawSprite(ctx, p1.sprites[picks[0] ? 'victory' : walk], 4, 68, 2);
    if (picker === 1) window.drawSprite(ctx, shown.sprites[walk], W - 60, 68, 2, true);

    drawText('ENTER: PICK  ESC: BACK', W - textWidth('ENTER: PICK  ESC: BACK') - 4, H - 13, C.grey);
  }

  function drawVersus() {
    const [a, b] = picks;
    drawText(a.name, 8, 10, C.night, 2);
    drawText(a.name, 7, 9, PLAYER_COLORS[0], 2);
    const bx = W - 8 - textWidth(b.name, 2);
    drawText(b.name, bx + 1, 10, C.night, 2);
    drawText(b.name, bx, 9, PLAYER_COLORS[1], 2);
    drawTextCentered('VS', 30, C.yellow, 2, C.red);
    const timer = ['60 SEC', '2 MIN', 'NO LIMIT'][quickOpts.timer];
    const info = twoPlayers() ? `2 PLAYERS  ${timer}` : `VS COMPUTER  ${DIFFICULTIES[quickOpts.difficulty].toUpperCase()}  ${timer}`;
    drawTextCentered(info, 50, C.white, 1, C.night);
    drawPair(a, b, 76, 0, 2);
  }

  function render() {
    drawBackground(!['select', 'map', 'quick'].includes(screen));
    if (screen === 'title') {
      drawTitle();
      drawFighters();
    } else if (screen === 'settings') {
      drawTextCentered('SETTINGS', TILE + 2, C.yellow, 2, C.night);
    } else if (screen === 'quick') {
      drawTextCentered('QUICK FIGHT', 6, C.yellow, 2, C.night);
      drawText('LEFT / RIGHT CHANGES AN OPTION', W - textWidth('LEFT / RIGHT CHANGES AN OPTION') - 4, H - 13, C.grey);
    } else if (screen === 'select') {
      drawSelect();
    } else if (screen === 'versus') {
      drawVersus();
    } else if (screen === 'map') {
      drawMap();
      if (toast && frame < toast.until) drawTextCentered(toast.text, 34, C.yellow, 1, C.night);
    } else if (screen === 'difficulty') {
      drawTextCentered('CHOOSE DIFFICULTY', 10, C.yellow, 1, C.night);
      drawTextCentered('MAIN MODE: THE GRASSY FIELDS', 22, C.white, 1, C.night);
    }
    screens[screen].forEach(drawButton);
  }

  function loop() {
    frame++;
    if (fight) {
      fight.update();
      fight.draw(ctx);
    } else {
      render();
    }
    requestAnimationFrame(loop);
  }

  // ---- Scaling & input ------------------------------------------------
  // Scale to fit whatever holds the canvas (the whole window on index.html).
  function resize() {
    const host = canvas.parentElement;
    const scale = Math.max(1, Math.floor(Math.min(host.clientWidth / W, host.clientHeight / H)));
    canvas.style.width = `${W * scale}px`;
    canvas.style.height = `${H * scale}px`;
  }
  window.addEventListener('resize', resize);
  resize();

  function toCanvas(e) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * W,
      y: ((e.clientY - rect.top) / rect.height) * H,
    };
  }

  function hitTest(e) {
    const { x, y } = toCanvas(e);
    return screens[screen].findIndex((b) => {
      const bx = b.x ?? BTN_X;
      return x >= bx && x < bx + (b.w ?? BTN_W) && y >= b.y && y < b.y + (b.h ?? BTN_H);
    });
  }

  canvas.addEventListener('pointermove', (e) => {
    if (fight) {
      const { x, y } = toCanvas(e);
      canvas.style.cursor = fight.pointer('move', x, y) ? 'pointer' : 'default';
      return;
    }
    const i = hitTest(e);
    if (i >= 0 && i !== selected) {
      selected = i;
      blip(520);
    }
    canvas.style.cursor = i >= 0 ? 'pointer' : 'default';
  });
  canvas.addEventListener('pointerdown', (e) => {
    if (fight) return;
    pressed = hitTest(e);
  });
  window.addEventListener('pointerup', (e) => {
    if (fight) {
      const { x, y } = toCanvas(e);
      fight.pointer('up', x, y);
      return;
    }
    const i = hitTest(e);
    if (i >= 0 && i === pressed) activate(i);
    pressed = -1;
  });

  const GAME_KEYS = [' ', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
  window.addEventListener('keyup', (e) => {
    if (fight) fight.keyup(e);
  });

  window.addEventListener('keydown', (e) => {
    if (GAME_KEYS.includes(e.key)) e.preventDefault();
    if (fight) {
      if (!e.repeat) fight.keydown(e);
      return;
    }
    if (screen === 'select' && /^[a-z]$/i.test(e.key)) {
      typed = (typed + e.key.toUpperCase()).slice(-UNLOCK_CODE.length);
      const secret = FIGHTERS.find((f) => f.id === 'glitch');
      if (typed === UNLOCK_CODE && isLocked(secret)) unlock(secret);
    }
    const count = screens[screen].length;
    const cur = screens[screen][selected];
    if (cur?.opt && (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'ArrowRight' || e.key === 'd')) {
      cycleOpt(cur, e.key === 'ArrowLeft' || e.key === 'a' ? -1 : 1);
      return;
    }
    if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'ArrowRight' || e.key === 'd') {
      selected = (selected + 1) % count;
      blip(520);
    } else if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'ArrowLeft' || e.key === 'a') {
      selected = (selected - 1 + count) % count;
      blip(520);
    } else if (e.key === 'Enter' || e.key === ' ') {
      activate(selected);
      e.preventDefault();
    } else if (e.key === 'Escape' && screen !== 'title') {
      blip(440);
      if (screen === 'select') backFromSelect();
      else if (screen === 'versus') screens.versus[1].action();
      else go('title');
    }
  });

  loop();
})();
