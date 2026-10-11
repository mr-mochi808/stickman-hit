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

  // ---- 16x16 sprites --------------------------------------------------
  // '.' transparent, other chars map to palette entries.
  const SPRITE_COLORS = { k: C.night, w: C.white, r: C.red, y: C.yellow, o: C.orange };

  const STICK_IDLE = [
    '................',
    '......kkkk......',
    '.....kwwwwk.....',
    '.....kwkwkk.....',
    '.....kwwwwk.....',
    '......kkkk......',
    '.......kk.......',
    '.....kkkkkk.....',
    '....k..kk..k....',
    '.......kk.......',
    '.......kk.......',
    '......k..k......',
    '.....k....k.....',
    '.....k....k.....',
    '....kk....kk....',
    '................',
  ];

  const STICK_PUNCH = [
    '................',
    '......kkkk......',
    '.....kwwwwk.....',
    '.....kwkwkk.....',
    '.....kwwwwk.....',
    '......kkkk......',
    '.......kk.......',
    '.......kkkkkkkrr',
    '.....k.kk.....rr',
    '......kkk.......',
    '.......kk.......',
    '......k..k......',
    '.....k.....k....',
    '....k.......k...',
    '...kk.......kk..',
    '................',
  ];

  const STICK_HURT = [
    '................',
    '........kkkk....',
    '.......kwwwwk...',
    '.......kkwkwk...',
    '.......kwwwwk...',
    '........kkkk....',
    '.......kk.......',
    '...k..kkk..k....',
    '....kkkk.kk.....',
    '......kk........',
    '......kk........',
    '.....k..k.......',
    '.....k...k......',
    '....k....k......',
    '...kk....kk.....',
    '................',
  ];

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

  function drawSprite(sprite, x, y, flip = false) {
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
      { label: 'PLAY', icon: PLAY_ICON, y: TILE * 4 + 8, action: () => go('play') },
      { label: 'SETTINGS', icon: GEAR, y: TILE * 5 + 16, action: () => go('settings') },
    ],
    settings: [
      { key: 'sound', label: 'SOUND', y: TILE * 3 },
      { key: 'music', label: 'MUSIC', y: TILE * 4 + 4 },
      { key: 'shake', label: 'SHAKE', y: TILE * 5 + 8 },
      { label: 'BACK', y: TILE * 6 + 16, action: () => go('title') },
    ],
    play: [
      { label: 'BACK', y: TILE * 6 + 16, action: () => go('title') },
    ],
  };

  let screen = 'title';
  let selected = 0;
  let pressed = -1;

  function go(next) {
    screen = next;
    selected = 0;
  }

  function activate(i) {
    const btn = screens[screen][i];
    if (!btn) return;
    if (btn.key) {
      settings[btn.key] = !settings[btn.key];
      saveSettings();
      blip(settings[btn.key] ? 880 : 440);
    } else {
      blip(btn.label === 'BACK' ? 440 : 660);
      btn.action();
    }
  }

  function buttonLabel(btn) {
    return btn.key ? `${btn.label}: ${settings[btn.key] ? 'ON' : 'OFF'}` : btn.label;
  }

  function drawButton(btn, i) {
    const hot = i === selected;
    const down = i === pressed;
    const y = btn.y + (down ? 1 : 0);

    // Drop shadow, border, face, top highlight.
    ctx.fillStyle = C.night;
    if (!down) ctx.fillRect(BTN_X + 1, btn.y + BTN_H, BTN_W, 2);
    ctx.fillRect(BTN_X - 1, y - 1, BTN_W + 2, BTN_H + 2);
    ctx.fillStyle = hot ? C.orange : C.blue;
    ctx.fillRect(BTN_X, y, BTN_W, BTN_H);
    ctx.fillStyle = hot ? C.yellow : C.sky;
    ctx.fillRect(BTN_X, y, BTN_W, 2);
    ctx.fillStyle = hot ? C.red : C.navy;
    ctx.fillRect(BTN_X, y + BTN_H - 2, BTN_W, 2);

    if (btn.icon) drawSprite(btn.icon, BTN_X, y);

    const label = buttonLabel(btn);
    const tx = Math.round(BTN_X + (BTN_W - textWidth(label)) / 2 + (btn.icon ? 6 : 0));
    drawText(label, tx + 1, y + 5, C.night);
    drawText(label, tx, y + 4, C.white);

    if (hot && Math.floor(frame / 20) % 2 === 0) {
      drawText('>', BTN_X - 10, y + 4, C.yellow);
      drawText('<', BTN_X + BTN_W + 5, y + 4, C.yellow);
    }
  }

  // ---- Background -----------------------------------------------------
  const stars = Array.from({ length: 24 }, (_, i) => ({
    x: (i * 53 + 17) % W,
    y: (i * 29 + 5) % (TILE * 5),
    phase: i * 7,
  }));

  function drawBackground() {
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
  function drawFighters() {
    const groundY = H - TILE * 2 - TILE;
    const cycle = frame % 80;
    const punching = cycle >= 50 && cycle < 64;
    const bob = Math.floor(frame / 15) % 2;

    // Left fighter attacks, right fighter gets hit.
    drawSprite(punching ? STICK_PUNCH : STICK_IDLE, TILE * 2, groundY + (punching ? 0 : bob));
    drawSprite(punching ? STICK_HURT : STICK_IDLE, TILE * 3 + 2, groundY + (punching ? 0 : 1 - bob), true);
    if (punching) drawSprite(HIT_SPARK, TILE * 3 - 2, groundY + 2);

    // A second pair on the right, out of phase.
    const punching2 = (cycle + 40) % 80 >= 50 && (cycle + 40) % 80 < 64;
    drawSprite(punching2 ? STICK_HURT : STICK_IDLE, TILE * 12 - 2, groundY + (punching2 ? 0 : bob));
    drawSprite(punching2 ? STICK_PUNCH : STICK_IDLE, TILE * 13, groundY + (punching2 ? 0 : 1 - bob), true);
    if (punching2) drawSprite(HIT_SPARK, TILE * 12 + 2, groundY + 2, true);
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
    drawTextCentered('PRESS ENTER OR CLICK', TILE * 3 - 1, C.grey);
  }

  // ---- Main loop ------------------------------------------------------
  let frame = 0;

  function render() {
    drawBackground();
    if (screen === 'title') {
      drawTitle();
      drawFighters();
    } else if (screen === 'settings') {
      drawTextCentered('SETTINGS', TILE + 2, C.yellow, 2, C.night);
    } else if (screen === 'play') {
      drawTextCentered('GET READY!', TILE + 2, C.yellow, 2, C.night);
      drawTextCentered('GAME COMING SOON', TILE * 3 + 8, C.white, 1, C.night);
      drawFighters();
    }
    screens[screen].forEach(drawButton);
  }

  function loop() {
    frame++;
    render();
    requestAnimationFrame(loop);
  }

  // ---- Scaling & input ------------------------------------------------
  function resize() {
    const scale = Math.max(1, Math.floor(Math.min(window.innerWidth / W, window.innerHeight / H)));
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
    return screens[screen].findIndex(
      (b) => x >= BTN_X && x < BTN_X + BTN_W && y >= b.y && y < b.y + BTN_H,
    );
  }

  canvas.addEventListener('pointermove', (e) => {
    const i = hitTest(e);
    if (i >= 0 && i !== selected) {
      selected = i;
      blip(520);
    }
    canvas.style.cursor = i >= 0 ? 'pointer' : 'default';
  });
  canvas.addEventListener('pointerdown', (e) => {
    pressed = hitTest(e);
  });
  window.addEventListener('pointerup', (e) => {
    const i = hitTest(e);
    if (i >= 0 && i === pressed) activate(i);
    pressed = -1;
  });

  window.addEventListener('keydown', (e) => {
    const count = screens[screen].length;
    if (e.key === 'ArrowDown' || e.key === 's') {
      selected = (selected + 1) % count;
      blip(520);
    } else if (e.key === 'ArrowUp' || e.key === 'w') {
      selected = (selected - 1 + count) % count;
      blip(520);
    } else if (e.key === 'Enter' || e.key === ' ') {
      activate(selected);
      e.preventDefault();
    } else if (e.key === 'Escape' && screen !== 'title') {
      blip(440);
      go('title');
    }
  });

  loop();
})();
