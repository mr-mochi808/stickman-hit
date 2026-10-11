// Stickman Hit - fighter roster.
// Sprites are 24x24 pixel grids built from a stick skeleton: each pose is a set of
// joint positions, and each fighter draws its own gear on top. Sprites face right;
// flip them horizontally for player 2. '.' is transparent; other letters map to PALETTE.
(() => {
  const SIZE = 24;

  const PALETTE = {
    k: '#1a1c2c', // body / outline
    D: '#333c57', // back limbs (further from camera)
    w: '#f4f4f4', // face
    s: '#94b0c2', // face shade / steel
    S: '#566c86', // dark steel
    r: '#b13e53',
    R: '#5d275d',
    o: '#ef7d57',
    y: '#ffcd75',
    b: '#3b5dc9',
    B: '#29366f',
    c: '#73eff7',
    a: '#a7f070', // robot glow
    g: '#38b764',
  };

  // ---- Poses ------------------------------------------------------------
  // head = center of the 9px head; b* = back limb, f* = front limb.
  // E elbow, H hand, K knee, F foot. Feet rest on row 22.
  const POSES = {
    idle: {
      head: [12, 6], neck: [12, 11], hip: [12, 16],
      bE: [10, 13], bH: [13, 10], fE: [15, 13], fH: [17, 10],
      bK: [10, 19], bF: [8, 22], fK: [14, 19], fF: [16, 22],
      face: 'normal', sword: [1, -1],
    },
    walk1: {
      head: [12, 6], neck: [12, 11], hip: [12, 16],
      bE: [10, 13], bH: [12, 11], fE: [15, 13], fH: [17, 11],
      bK: [10, 19], bF: [7, 22], fK: [15, 19], fF: [17, 22],
      face: 'normal', sword: [1, -1],
    },
    walk2: {
      head: [12, 7], neck: [12, 12], hip: [12, 17],
      bE: [10, 14], bH: [13, 12], fE: [15, 14], fH: [17, 12],
      bK: [13, 19], bF: [12, 22], fK: [12, 20], fF: [11, 22],
      face: 'normal', sword: [1, -1],
    },
    jump: {
      head: [12, 5], neck: [12, 10], hip: [12, 15],
      bE: [9, 9], bH: [7, 6], fE: [15, 8], fH: [17, 5],
      bK: [10, 18], bF: [8, 20], fK: [15, 17], fF: [13, 20],
      face: 'normal', sword: [1, -0.4],
    },
    attack: {
      head: [13, 7], neck: [13, 11], hip: [12, 16],
      bE: [10, 13], bH: [12, 10], fE: [17, 11], fH: [21, 11],
      bK: [10, 19], bF: [7, 22], fK: [15, 19], fF: [18, 22],
      face: 'angry', sword: [1, -0.15],
    },
    hit: {
      head: [9, 7], neck: [10, 11], hip: [12, 16],
      bE: [7, 12], bH: [5, 9], fE: [13, 10], fH: [15, 7],
      bK: [11, 19], bF: [9, 22], fK: [14, 19], fF: [15, 22],
      face: 'hit', sword: [-0.4, -1],
    },
    victory: {
      head: [12, 6], neck: [12, 11], hip: [12, 16],
      bE: [9, 13], bH: [11, 15], fE: [15, 8], fH: [16, 4],
      bK: [11, 19], bF: [9, 22], fK: [13, 19], fF: [15, 22],
      face: 'happy', sword: [0.15, -1],
    },
  };
  const POSE_ORDER = ['idle', 'walk1', 'walk2', 'jump', 'attack', 'hit', 'victory'];

  // ---- Pixel helpers ------------------------------------------------------
  function grid() {
    return Array.from({ length: SIZE }, () => Array(SIZE).fill('.'));
  }

  function px(g, x, y, c) {
    x = Math.round(x);
    y = Math.round(y);
    if (x >= 0 && x < SIZE && y >= 0 && y < SIZE) g[y][x] = c;
  }

  function rect(g, x, y, w, h, c) {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) px(g, x + i, y + j, c);
  }

  // Bresenham line with a square brush of size w.
  function line(g, [x0, y0], [x1, y1], c, w = 1) {
    x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
    const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;
    for (;;) {
      rect(g, x0, y0, w, w, c);
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * err;
      if (e2 >= dy) { err += dy; x0 += sx; }
      if (e2 <= dx) { err += dx; y0 += sy; }
    }
  }

  // Filled 9px head with outline and a shaded lower-left crescent.
  function inHead(x, y, cx, cy) {
    return (x - cx) ** 2 + (y - cy) ** 2 <= 19;
  }

  function head(g, [cx, cy], fill, shade) {
    for (let y = cy - 5; y <= cy + 5; y++) {
      for (let x = cx - 5; x <= cx + 5; x++) {
        if (!inHead(x, y, cx, cy)) continue;
        const edge = !inHead(x + 1, y, cx, cy) || !inHead(x - 1, y, cx, cy)
          || !inHead(x, y + 1, cx, cy) || !inHead(x, y - 1, cx, cy);
        const shaded = (x - cx - 1.5) ** 2 + (y - cy + 1.5) ** 2 > 22;
        px(g, x, y, edge ? 'k' : shaded ? shade : fill);
      }
    }
  }

  // Eyes look right. Front eye at cx+3, back eye at cx+1.
  function face(g, [cx, cy], kind, eye = 'k') {
    const eyes = [cx + 1, cx + 3];
    if (kind === 'normal') {
      eyes.forEach((ex) => { px(g, ex, cy - 1, eye); px(g, ex, cy, eye); });
      px(g, cx + 2, cy + 2, 'k');
    } else if (kind === 'angry') {
      eyes.forEach((ex) => { px(g, ex, cy, eye); px(g, ex - 1, cy - 2, 'k'); px(g, ex, cy - 1, 'k'); });
      rect(g, cx + 1, cy + 2, 3, 1, 'k');
    } else if (kind === 'hit') {
      // Squeezed shut: > <
      px(g, cx, cy - 1, eye); px(g, cx + 1, cy, eye); px(g, cx, cy + 1, eye);
      px(g, cx + 3, cy - 1, eye); px(g, cx + 2, cy, eye); px(g, cx + 3, cy + 1, eye);
      px(g, cx + 2, cy + 2, 'k'); px(g, cx + 2, cy + 3, 'k');
    } else if (kind === 'happy') {
      eyes.forEach((ex) => { px(g, ex, cy - 1, eye); px(g, ex, cy, eye); });
      px(g, cx, cy + 1, 'k'); px(g, cx + 1, cy + 2, 'k'); px(g, cx + 2, cy + 2, 'k'); px(g, cx + 3, cy + 1, 'k');
    }
  }

  function fist(g, [x, y], c) {
    rect(g, x, y, 2, 2, c);
  }

  // 3x3 shaded blob used for gloves and robot fists.
  function ball(g, [x, y], fill, light, dark) {
    rect(g, x - 1, y - 1, 3, 3, fill);
    px(g, x - 1, y - 1, light);
    px(g, x + 1, y + 1, dark);
  }

  function shoe(g, [x, y], c) {
    rect(g, x, y, 3, 2, c);
  }

  function add([x, y], [dx, dy], n = 1) {
    return [x + dx * n, y + dy * n];
  }

  // ---- Shared body ---------------------------------------------------------
  // Hooks let each fighter add gear between layers.
  function body(p, gear) {
    const g = grid();
    gear.back?.(g, p);
    // Back limbs in a lighter tone so they read as further away.
    line(g, p.hip, p.bK, 'D', 2); line(g, p.bK, p.bF, 'D', 2);
    shoe(g, p.bF, gear.shoeBack || 'D');
    line(g, p.neck, p.bE, 'D', 2); line(g, p.bE, p.bH, 'D', 2);
    line(g, p.neck, p.hip, 'k', 2);
    line(g, p.hip, p.fK, 'k', 2); line(g, p.fK, p.fF, 'k', 2);
    shoe(g, p.fF, gear.shoe || 'k');
    gear.torso?.(g, p);
    if (gear.head) gear.head(g, p); else { head(g, p.head, 'w', 's'); face(g, p.head, p.face); }
    gear.hat?.(g, p);
    if (gear.frontArm) gear.frontArm(g, p); else { line(g, p.neck, p.fE, 'k', 2); line(g, p.fE, p.fH, 'k', 2); }
    if (gear.hands) gear.hands(g, p); else { fist(g, p.bH, 'D'); fist(g, p.fH, 'k'); }
    gear.front?.(g, p);
    return g;
  }

  // ---- Fighters --------------------------------------------------------------
  const BOXER = {
    hat(g, { head: [cx, cy] }) {
      for (let x = cx - 4; x <= cx + 4; x++) {
        if (!inHead(x, cy - 2, cx, cy)) continue;
        px(g, x, cy - 3, inHead(x, cy - 4, cx, cy) ? 'o' : 'r');
        px(g, x, cy - 2, 'r');
      }
      // Knot tails flowing behind the head.
      px(g, cx - 5, cy - 2, 'r'); px(g, cx - 6, cy - 1, 'r'); px(g, cx - 7, cy - 1, 'R');
      px(g, cx - 5, cy - 1, 'R'); px(g, cx - 6, cy, 'r');
    },
    torso(g, { hip: [x, y] }) {
      rect(g, x - 1, y - 1, 4, 3, 'r');
      rect(g, x - 1, y - 1, 4, 1, 'w');
      px(g, x + 2, y + 1, 'R');
    },
    hands(g, p) {
      ball(g, add(p.bH, [0.5, 0.5]), 'R', 'r', 'k');
      ball(g, add(p.fH, [0.5, 0.5]), 'r', 'o', 'R');
    },
    shoe: 'k',
  };

  const NINJA = {
    back(g, p) {
      // Scarf trailing behind; longer and wavier when moving.
      const [nx, ny] = p.neck;
      const len = p.face === 'normal' && p.fF[0] - p.bF[0] < 7 ? 5 : 8;
      for (let i = 1; i <= len; i++) {
        const y = ny - 1 + Math.round(Math.sin(i * 0.9) * 1) + Math.floor(i / 4);
        px(g, nx - 1 - i, y, 'b');
        px(g, nx - 1 - i, y + 1, 'B');
      }
    },
    head(g, p) {
      const [cx, cy] = p.head;
      head(g, p.head, 'b', 'B');
      for (let x = cx - 1; x <= cx + 4; x++) {
        for (const y of [cy - 1, cy]) {
          if (g[y]?.[x] && g[y][x] !== 'k') px(g, x, y, 'w');
        }
      }
      const eyes = [cx + 1, cx + 3];
      if (p.face === 'hit') { px(g, cx, cy - 1, 'k'); px(g, cx + 1, cy, 'k'); px(g, cx + 3, cy - 1, 'k'); px(g, cx + 2, cy, 'k'); }
      else if (p.face === 'happy') eyes.forEach((ex) => { px(g, ex - 1, cy, 'k'); px(g, ex, cy - 1, 'k'); px(g, ex + 1, cy, 'k'); });
      else if (p.face === 'angry') eyes.forEach((ex) => { px(g, ex, cy, 'k'); px(g, ex - 1, cy - 1, 'k'); });
      else eyes.forEach((ex) => { px(g, ex, cy - 1, 'k'); px(g, ex, cy, 'k'); });
      // Knot on the back of the hood.
      px(g, cx - 5, cy - 1, 'B'); px(g, cx - 5, cy - 2, 'b');
    },
    torso(g, { hip: [x, y] }) {
      rect(g, x - 1, y - 1, 4, 1, 'c');
      px(g, x - 2, y, 'c');
    },
    hands(g, p) {
      fist(g, p.bH, 'D');
      fist(g, p.fH, 'k');
      px(g, p.fH[0], p.fH[1], 'c');
    },
    shoe: 'B',
  };

  const SAMURAI = {
    back(g, { hip: [x, y] }) {
      // Sheath worn at the back hip.
      line(g, [x + 1, y], [x - 7, y + 3], 'R');
      px(g, x + 2, y - 1, 'y');
    },
    hat(g, { head: [cx, cy] }) {
      // Hair on top of the head and a topknot.
      for (let y = cy - 4; y <= cy - 2; y++) {
        for (let x = cx - 4; x <= cx + 4; x++) {
          if (inHead(x, y, cx, cy) && (y < cy - 2 || x < cx)) px(g, x, y, 'k');
        }
      }
      rect(g, cx - 2, cy - 6, 2, 2, 'k');
      px(g, cx - 1, cy - 4, 'y');
    },
    torso(g, { neck: [nx, ny], hip: [hx, hy] }) {
      // Shoulder plate and sash.
      rect(g, nx, ny, 3, 2, 'y');
      px(g, nx + 2, ny + 1, 'o');
      rect(g, hx - 1, hy - 1, 4, 2, 'o');
      rect(g, hx - 1, hy - 1, 4, 1, 'y');
    },
    front(g, p) {
      const [dx, dy] = p.sword;
      const len = Math.hypot(dx, dy);
      const d = [dx / len, dy / len];
      const perp = [-d[1], d[0]];
      const h = add(p.fH, [0.5, 0.5]);
      line(g, add(h, d, -2), h, 'r');
      px(g, ...add(add(h, d, 1), perp, 1), 'y');
      px(g, ...add(add(h, d, 1), perp, -1), 'y');
      line(g, add(h, d, 2), add(h, d, 11), 's');
      line(g, add(add(h, d, 2), perp, -1), add(add(h, d, 10), perp, -1), 'w');
      if (p.face === 'angry') {
        // Slash trail.
        for (let i = -3; i <= 3; i++) px(g, 20 + Math.round(Math.cos(i / 3) * 2), 11 + i, 'c');
      }
    },
    shoe: 'k',
  };

  const ROBOT = {
    head(g, p) {
      const [cx, cy] = p.head;
      rect(g, cx - 4, cy - 4, 9, 8, 'k');
      rect(g, cx - 3, cy - 3, 7, 6, 's');
      rect(g, cx - 3, cy + 2, 7, 1, 'S');
      rect(g, cx - 1, cy - 1, 5, 2, 'k');
      const eye = p.face === 'hit' ? 'o' : 'a';
      if (p.face === 'happy') { px(g, cx + 1, cy - 1, eye); px(g, cx + 3, cy - 1, eye); }
      else if (p.face === 'hit') { px(g, cx + 1, cy, eye); px(g, cx + 3, cy - 1, eye); }
      else { px(g, cx + 2, cy - 1, eye); px(g, cx + 3, cy - 1, eye); px(g, cx + 3, cy, eye); }
      for (let x = cx; x <= cx + 3; x += 2) px(g, x, cy + 2, 'k');
      // Antenna.
      px(g, cx - 1, cy - 5, 'k'); px(g, cx - 1, cy - 6, 'a');
    },
    torso(g, { neck: [nx, ny] }) {
      rect(g, nx - 1, ny + 1, 4, 3, 'S');
      px(g, nx + 1, ny + 2, 'a');
    },
    frontArm(g, p) {
      if (p.face === 'angry') {
        // Rocket punch: the forearm stays, the fist flies.
        line(g, p.neck, p.fE, 'S', 2);
        rect(g, p.fE[0] + 1, p.fE[1], 2, 2, 'k');
        return;
      }
      line(g, p.neck, p.fE, 'S', 2);
      line(g, p.fE, p.fH, 'S', 2);
      px(g, p.fE[0], p.fE[1], 's');
    },
    hands(g, p) {
      fist(g, p.bH, 'D');
      if (p.face === 'angry') {
        ball(g, [21, 11], 's', 'w', 'S');
        px(g, 19, 11, 'y'); px(g, 18, 11, 'o'); px(g, 18, 12, 'o'); px(g, 17, 11, 'r');
      } else {
        ball(g, add(p.fH, [0.5, 0.5]), 's', 'w', 'S');
      }
    },
    shoe: 'S',
    shoeBack: 'S',
  };

  const GEAR = { boxer: BOXER, ninja: NINJA, samurai: SAMURAI, robot: ROBOT };

  // ---- Roster --------------------------------------------------------------
  // Names are placeholders until the final names are picked.
  const CHARACTERS = [
    {
      id: 'boxer',
      name: 'BOXER',
      team: '#b13e53',
      tagline: 'The all-rounder',
      gear: 'Red headband, boxing gloves and boxing shorts',
      style: 'Quick punches and good at everything, without being the best at anything. The easiest fighter to learn.',
      special: { name: 'Triple Jab', text: 'Three fast punches in a row. The last one knocks the opponent back.' },
      stats: { power: 3, speed: 4, reach: 2, defense: 3 },
      colors: ['r', 'o', 'w'],
      bio: 'Trained by punching the same lamppost every morning for ten years. The lamppost has never recovered.',
    },
    {
      id: 'ninja',
      name: 'NINJA',
      team: '#3b5dc9',
      tagline: 'The speedster',
      gear: 'Blue hood, long scarf and wrist wraps',
      style: 'The fastest fighter, with the lowest health. Hits and gets away before the opponent can hit back.',
      special: { name: 'Dash Kick', text: 'Flies across the screen feet first. It can go through an opponent\'s punch.' },
      stats: { power: 2, speed: 5, reach: 4, defense: 1 },
      colors: ['b', 'B', 'c'],
      bio: 'Nobody has ever seen this ninja\'s face. Nobody has ever seen them standing still, either.',
    },
    {
      id: 'samurai',
      name: 'SAMURAI',
      team: '#ffcd75',
      tagline: 'The swordsman',
      gear: 'Topknot, gold shoulder plate, sash and a katana',
      style: 'Clean, strong sword slashes with good reach. Rewards patience: wait for the opponent to swing, then strike.',
      special: { name: 'Counter Slash', text: 'Holds a guard stance. If the opponent attacks during it, blocks the hit and slashes back.' },
      stats: { power: 4, speed: 3, reach: 3, defense: 2 },
      colors: ['y', 'o', 's'],
      bio: 'Has polished the same sword every night for twenty years and still thinks it could be shinier.',
    },
    {
      id: 'robot',
      name: 'ROBOT',
      team: '#38b764',
      tagline: 'The tank',
      gear: 'Metal head with a glowing visor, antenna and a rocket fist',
      style: 'Heavy armor and big hits, but slow to move. Takes hits that would knock others down.',
      special: { name: 'Rocket Punch', text: 'Fires its fist across the screen. It flies back after the hit.' },
      stats: { power: 4, speed: 2, reach: 2, defense: 4 },
      colors: ['s', 'S', 'a'],
      bio: 'Built to fold laundry. Discovered fighting. Has not folded laundry since.',
    },
  ];

  // Per-fighter pose tweaks layered on the shared skeleton.
  const POSE_OVERRIDES = {
    ninja: {
      // Flying kick.
      attack: {
        head: [9, 7], neck: [10, 11], hip: [12, 15],
        bE: [7, 12], bH: [5, 14], fE: [13, 12], fH: [15, 10],
        bK: [11, 18], bF: [8, 19], fK: [17, 15], fF: [20, 15],
      },
    },
    samurai: {
      // Two-handed slash.
      attack: { bE: [12, 13], bH: [16, 11], fE: [15, 13], fH: [17, 11] },
    },
    robot: {
      attack: { fE: [16, 12], fH: [17, 12] },
    },
  };

  function render(id, poseName) {
    const pose = { ...POSES[poseName], ...(POSE_OVERRIDES[id]?.[poseName] || {}) };
    return body(pose, GEAR[id]).map((row) => row.join(''));
  }

  CHARACTERS.forEach((ch) => {
    ch.sprites = Object.fromEntries(POSE_ORDER.map((p) => [p, render(ch.id, p)]));
  });

  function drawSprite(ctx, sprite, x, y, scale = 1, flip = false) {
    const n = sprite.length;
    for (let row = 0; row < n; row++) {
      for (let col = 0; col < n; col++) {
        const ch = sprite[row][flip ? n - 1 - col : col];
        if (ch === '.') continue;
        ctx.fillStyle = PALETTE[ch];
        ctx.fillRect(x + col * scale, y + row * scale, scale, scale);
      }
    }
  }

  window.SPRITE_SIZE = SIZE;
  window.PALETTE = PALETTE;
  window.POSE_ORDER = POSE_ORDER;
  window.CHARACTERS = CHARACTERS;
  window.drawSprite = drawSprite;
})();
