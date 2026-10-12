// Stickman Hit - fighter roster and sprite rig.
// Sprites are 28x28 pixel grids built from a stick skeleton: each pose is a set of
// joint positions, and each fighter draws its own gear on top. The fight blends
// smoothly between poses by moving the joints, then redraws the pixels.
// Sprites face right; flip them horizontally to face left.
// '.' is transparent; other letters map to PALETTE.
(() => {
  const SIZE = 28;

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
    a: '#a7f070', // cyborg glow
    g: '#38b764',
    m: '#ff4fd8', // glitch magenta
  };

  // ---- Poses ------------------------------------------------------------
  // head = center of the 11px head; b* = back limb, f* = front limb.
  // E elbow, H hand, K knee, F foot. Standing feet rest on row 26.
  const STANCE = {
    head: [14, 6], neck: [14, 12], hip: [14, 19],
    bE: [11, 15], bH: [14, 12], fE: [17, 15], fH: [19, 12],
    bK: [12, 23], bF: [10, 26], fK: [16, 23], fF: [18, 26],
    face: 'normal', sword: [1, -1],
  };
  const pose = (over) => ({ ...STANCE, ...over });

  const POSES = {
    idle1: STANCE,
    idle2: pose({ head: [14, 7], neck: [14, 13], bE: [11, 16], bH: [14, 13], fE: [17, 16], fH: [19, 13] }),
    walkA: pose({ bK: [11, 23], bF: [8, 26], fK: [17, 23], fF: [20, 26] }),
    walkP1: pose({ head: [14, 5], neck: [14, 11], hip: [14, 18], bK: [13, 22], bF: [13, 26], fK: [16, 21], fF: [15, 24] }),
    walkB: pose({ bK: [16, 23], bF: [19, 26], fK: [12, 23], fF: [9, 26] }),
    walkP2: pose({ head: [14, 5], neck: [14, 11], hip: [14, 18], fK: [15, 22], fF: [15, 26], bK: [12, 21], bF: [11, 24] }),
    rise: pose({
      head: [14, 4], neck: [14, 10], hip: [14, 17],
      bE: [10, 8], bH: [8, 5], fE: [18, 8], fH: [20, 5],
      bK: [12, 21], bF: [11, 25], fK: [16, 20], fF: [17, 24],
    }),
    tuck: pose({
      head: [14, 5], neck: [14, 11], hip: [14, 17],
      bE: [11, 13], bH: [13, 10], fE: [17, 13], fH: [19, 10],
      bK: [11, 20], bF: [9, 23], fK: [18, 19], fF: [16, 23],
    }),
    duck: pose({
      head: [15, 15], neck: [14, 20], hip: [12, 23],
      bE: [12, 22], bH: [15, 19], fE: [18, 21], fH: [20, 18],
      bK: [9, 24], bF: [9, 26], fK: [17, 23], fF: [18, 26],
    }),
    hit: pose({
      head: [11, 7], neck: [12, 12], hip: [14, 19],
      bE: [9, 13], bH: [7, 10], fE: [15, 10], fH: [17, 7],
      bK: [12, 23], bF: [10, 26], fK: [16, 23], fF: [17, 26],
      face: 'hit', sword: [-0.4, -1],
    }),
    launched: pose({
      head: [7, 13], neck: [11, 14], hip: [18, 15],
      bE: [9, 18], bH: [6, 20], fE: [12, 10], fH: [9, 8],
      bK: [21, 18], bF: [24, 20], fK: [22, 12], fF: [25, 10],
      face: 'hit', sword: [-1, -0.3],
    }),
    down: pose({
      head: [6, 22], neck: [11, 24], hip: [18, 25],
      bE: [13, 26], bH: [15, 26], fE: [9, 26], fH: [7, 26],
      bK: [21, 23], bF: [25, 26], fK: [22, 25], fF: [26, 25],
      face: 'hit', sword: [-1, 0.1],
    }),
    victory: pose({
      bE: [11, 16], bH: [13, 18], fE: [17, 9], fH: [18, 3],
      bK: [13, 23], bF: [11, 26], fK: [15, 23], fF: [17, 26],
      face: 'happy', sword: [0.15, -1],
    }),

    // Punches (shared by every fighter unless they override them).
    jab: pose({
      head: [15, 6], neck: [15, 12], fE: [20, 12], fH: [25, 12],
      bK: [11, 23], bF: [9, 26], fK: [17, 23], fF: [20, 26],
      face: 'angry', sword: [1, -0.15],
    }),
    cross: pose({
      head: [16, 7], neck: [15, 12], bE: [19, 13], bH: [24, 12], fE: [16, 15], fH: [17, 13],
      bK: [11, 23], bF: [8, 26], fK: [17, 23], fF: [20, 26],
      face: 'angry', sword: [1, 0.2],
    }),
    upper: pose({
      head: [15, 5], neck: [15, 11], hip: [14, 18], fE: [19, 12], fH: [20, 6],
      bK: [12, 22], bF: [11, 26], fK: [16, 22], fF: [18, 26],
      face: 'angry', sword: [0.4, -1],
    }),
    hook: pose({
      head: [15, 6], neck: [15, 12], fE: [20, 10], fH: [24, 12],
      bK: [11, 23], bF: [9, 26], fK: [17, 23], fF: [20, 26],
      face: 'angry', sword: [1, 0.4],
    }),
    heavyWind: pose({
      head: [12, 7], neck: [13, 12], fE: [10, 13], fH: [8, 11], bE: [16, 14], bH: [18, 12],
      face: 'angry', sword: [-0.6, -1],
    }),
    heavy: pose({
      head: [17, 7], neck: [16, 12], hip: [14, 19],
      fE: [21, 12], fH: [26, 11], bE: [12, 15], bH: [10, 17],
      bK: [10, 23], bF: [7, 26], fK: [18, 23], fF: [21, 26],
      face: 'angry', sword: [1, 0],
    }),
    lowKick: pose({
      head: [11, 16], neck: [12, 20], hip: [14, 23],
      bE: [10, 22], bH: [8, 25], fE: [14, 24], fH: [12, 26],
      bK: [11, 24], bF: [9, 26], fK: [19, 25], fF: [25, 26],
      face: 'angry', sword: [1, 0.3],
    }),
    slam: pose({
      head: [13, 6], neck: [13, 11], hip: [13, 17],
      fK: [18, 14], fF: [22, 19], bK: [11, 21], bF: [9, 24],
      bE: [10, 9], bH: [8, 6], fE: [17, 9], fH: [19, 6],
      face: 'angry', sword: [1, 1],
    }),

    // Kicks (the Ninja fights mostly with these).
    frontKick: pose({
      head: [12, 6], neck: [13, 12], fK: [19, 17], fF: [25, 15],
      bK: [13, 23], bF: [12, 26], fE: [16, 14], fH: [18, 12],
      face: 'angry',
    }),
    risingKick: pose({
      head: [11, 8], neck: [12, 13], fK: [18, 13], fF: [21, 5],
      bK: [14, 23], bF: [13, 26], bE: [9, 15], bH: [7, 17], fE: [15, 15], fH: [17, 13],
      face: 'angry',
    }),
    spinKick: pose({
      head: [11, 7], neck: [12, 12], hip: [14, 18], fK: [20, 15], fF: [26, 12],
      bK: [13, 23], bF: [11, 26], bE: [9, 14], bH: [7, 16],
      face: 'angry',
    }),
    knee: pose({
      head: [15, 6], neck: [15, 12], fK: [19, 16], fF: [18, 21],
      bK: [13, 23], bF: [12, 26], bE: [18, 11], bH: [21, 9], fE: [19, 13], fH: [21, 10],
      face: 'angry',
    }),
    chamber: pose({
      head: [12, 6], neck: [12, 12], fK: [18, 16], fF: [15, 20],
      bK: [13, 23], bF: [12, 26], face: 'angry',
    }),
    sideKick: pose({
      head: [9, 8], neck: [10, 13], hip: [14, 18], fK: [20, 17], fF: [26, 16],
      bK: [12, 23], bF: [10, 26], bE: [8, 15], bH: [6, 17], fE: [12, 10], fH: [14, 8],
      face: 'angry',
    }),
    // Samurai guard stance for Counter Slash: blade held level above the head.
    guard: pose({
      head: [13, 7], neck: [13, 12], fE: [17, 11], fH: [19, 8], bE: [11, 12], bH: [15, 8],
      bK: [10, 23], bF: [8, 26], fK: [17, 23], fF: [19, 26],
      face: 'angry', sword: [1, -0.05],
    }),
    slash: pose({
      head: [16, 7], neck: [15, 12], bE: [16, 15], bH: [20, 13], fE: [19, 14], fH: [22, 13],
      bK: [10, 23], bF: [7, 26], fK: [18, 23], fF: [21, 26],
      face: 'angry', sword: [1, 0.15], slash: true,
    }),
    // Cyborg with his fist fired off.
    rocket: pose({
      head: [15, 6], neck: [15, 12], fE: [20, 12], fH: [22, 12],
      bK: [11, 23], bF: [9, 26], fK: [17, 23], fF: [20, 26],
      face: 'angry', fistGone: true,
    }),
    flyKick: pose({
      head: [9, 9], neck: [11, 13], hip: [15, 16], fK: [20, 16], fF: [26, 16],
      bK: [14, 20], bF: [10, 21], bE: [8, 13], bH: [6, 15], fE: [14, 11], fH: [16, 9],
      face: 'angry',
    }),
  };

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

  // Filled 11px head with outline and a shaded lower-left crescent.
  function inHead(x, y, cx, cy, r2 = 26) {
    return (x - cx) ** 2 + (y - cy) ** 2 <= r2;
  }

  function head(g, [cx, cy], fill, shade, outline = 'k', r2 = 26) {
    const inside = (x, y) => inHead(x, y, cx, cy, r2);
    for (let y = cy - 6; y <= cy + 6; y++) {
      for (let x = cx - 6; x <= cx + 6; x++) {
        if (!inside(x, y)) continue;
        const edge = !inside(x + 1, y) || !inside(x - 1, y) || !inside(x, y + 1) || !inside(x, y - 1);
        const shaded = (x - cx - 1.5) ** 2 + (y - cy + 1.5) ** 2 > 32;
        px(g, x, y, edge ? outline : shaded ? shade : fill);
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
    } else if (kind === 'sleep') {
      eyes.forEach((ex) => { px(g, ex - 1, cy, eye); px(g, ex, cy, eye); });
    }
  }

  function fist(g, [x, y], c) {
    rect(g, x, y, 2, 2, c);
  }

  // 3x3 shaded blob used for gloves and metal fists.
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
    const front = gear.bodyFront || 'k';
    const back = gear.bodyBack || 'D';
    const lw = gear.limb || 2;
    gear.back?.(g, p);
    // Back limbs in a lighter tone so they read as further away.
    line(g, p.hip, p.bK, back, lw); line(g, p.bK, p.bF, back, lw);
    shoe(g, p.bF, gear.shoeBack || back);
    line(g, p.neck, p.bE, back, lw); line(g, p.bE, p.bH, back, lw);
    line(g, p.neck, p.hip, front, 2);
    line(g, p.hip, p.fK, front, lw); line(g, p.fK, p.fF, front, lw);
    shoe(g, p.fF, gear.shoe || front);
    gear.torso?.(g, p);
    if (gear.head) gear.head(g, p); else { head(g, p.head, 'w', 's'); face(g, p.head, p.face); }
    gear.hat?.(g, p);
    if (gear.frontArm) gear.frontArm(g, p); else { line(g, p.neck, p.fE, front, lw); line(g, p.fE, p.fH, front, lw); }
    if (gear.hands) gear.hands(g, p); else { fist(g, p.bH, back); fist(g, p.fH, front); }
    gear.front?.(g, p);
    gear.post?.(g, p);
    return g;
  }

  // ---- Fighters --------------------------------------------------------------
  const BOXER = {
    hat(g, { head: [cx, cy] }) {
      for (let x = cx - 5; x <= cx + 5; x++) {
        if (!inHead(x, cy - 2, cx, cy)) continue;
        px(g, x, cy - 3, inHead(x, cy - 4, cx, cy) ? 'o' : 'r');
        px(g, x, cy - 2, 'r');
      }
      // Knot tails flowing behind the head.
      px(g, cx - 6, cy - 2, 'r'); px(g, cx - 7, cy - 1, 'r'); px(g, cx - 8, cy - 1, 'R');
      px(g, cx - 6, cy - 1, 'R'); px(g, cx - 7, cy, 'r');
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
  };

  const NINJA = {
    back(g, p) {
      // Scarf trailing behind; longer and wavier when moving.
      const [nx, ny] = p.neck;
      const len = p.face === 'normal' && p.fF[0] - p.bF[0] < 9 ? 6 : 9;
      for (let i = 1; i <= len; i++) {
        const y = ny - 1 + Math.round(Math.sin(i * 0.9) * 1) + Math.floor(i / 4);
        px(g, nx - 1 - i, y, 'b');
        px(g, nx - 1 - i, y + 1, 'B');
      }
    },
    head(g, p) {
      const [cx, cy] = p.head;
      head(g, p.head, 'b', 'B');
      for (let x = cx - 1; x <= cx + 5; x++) {
        for (const y of [cy - 1, cy]) {
          if (g[y]?.[x] && g[y][x] !== 'k') px(g, x, y, 'w');
        }
      }
      const eyes = [cx + 1, cx + 3];
      if (p.face === 'hit') { px(g, cx, cy - 1, 'k'); px(g, cx + 1, cy, 'k'); px(g, cx + 3, cy - 1, 'k'); px(g, cx + 2, cy, 'k'); }
      else if (p.face === 'happy') eyes.forEach((ex) => { px(g, ex - 1, cy, 'k'); px(g, ex, cy - 1, 'k'); px(g, ex + 1, cy, 'k'); });
      else if (p.face === 'angry') eyes.forEach((ex) => { px(g, ex, cy, 'k'); px(g, ex - 1, cy - 1, 'k'); });
      else if (p.face === 'sleep') eyes.forEach((ex) => { px(g, ex - 1, cy, 'k'); px(g, ex, cy, 'k'); });
      else eyes.forEach((ex) => { px(g, ex, cy - 1, 'k'); px(g, ex, cy, 'k'); });
      // Knot on the back of the hood.
      px(g, cx - 6, cy - 1, 'B'); px(g, cx - 6, cy - 2, 'b');
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
      line(g, [x + 1, y], [x - 8, y + 3], 'R');
      px(g, x + 2, y - 1, 'y');
    },
    hat(g, { head: [cx, cy] }) {
      // Hair on top of the head and a topknot.
      for (let y = cy - 5; y <= cy - 2; y++) {
        for (let x = cx - 5; x <= cx + 5; x++) {
          if (inHead(x, y, cx, cy) && (y < cy - 2 || x < cx)) px(g, x, y, 'k');
        }
      }
      rect(g, cx - 2, cy - 7, 2, 2, 'k');
      px(g, cx - 1, cy - 5, 'y');
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
      const len = Math.hypot(dx, dy) || 1;
      const d = [dx / len, dy / len];
      const perp = [-d[1], d[0]];
      const h = add(p.fH, [0.5, 0.5]);
      line(g, add(h, d, -2), h, 'r');
      px(g, ...add(add(h, d, 1), perp, 1), 'y');
      px(g, ...add(add(h, d, 1), perp, -1), 'y');
      line(g, add(h, d, 2), add(h, d, 12), 's');
      line(g, add(add(h, d, 2), perp, -1), add(add(h, d, 11), perp, -1), 'w');
      if (p.slash) {
        // Slash trail in front of the blade.
        for (let i = -4; i <= 4; i++) px(g, h[0] + 3 + Math.round(Math.cos(i / 4) * 3), h[1] + i, 'c');
      }
    },
  };

  const CYBORG = {
    head(g, p) {
      const [cx, cy] = p.head;
      rect(g, cx - 5, cy - 5, 11, 10, 'k');
      rect(g, cx - 4, cy - 4, 9, 8, 's');
      rect(g, cx - 4, cy + 3, 9, 1, 'S');
      rect(g, cx - 1, cy - 1, 6, 2, 'k');
      const eye = p.face === 'hit' ? 'o' : 'a';
      if (p.face === 'happy') { px(g, cx + 1, cy - 1, eye); px(g, cx + 3, cy - 1, eye); }
      else if (p.face === 'hit') { px(g, cx + 1, cy, eye); px(g, cx + 3, cy - 1, eye); }
      else if (p.face === 'sleep') { rect(g, cx, cy, 4, 1, 'S'); }
      else { px(g, cx + 2, cy - 1, eye); px(g, cx + 3, cy - 1, eye); px(g, cx + 3, cy, eye); }
      for (let x = cx; x <= cx + 4; x += 2) px(g, x, cy + 2, 'k');
      // Antenna.
      px(g, cx - 1, cy - 6, 'a');
    },
    torso(g, { neck: [nx, ny] }) {
      rect(g, nx - 1, ny + 1, 4, 4, 'S');
      px(g, nx + 1, ny + 2, 'a');
    },
    frontArm(g, p) {
      line(g, p.neck, p.fE, 'S', 2);
      if (p.rocket || p.fistGone) {
        // Rocket Punch: the forearm stays, the fist flies.
        rect(g, p.fE[0] + 1, p.fE[1], 2, 2, 'k');
        return;
      }
      line(g, p.fE, p.fH, 'S', 2);
      px(g, p.fE[0], p.fE[1], 's');
    },
    hands(g, p) {
      fist(g, p.bH, 'D');
      if (p.fistGone) return;
      if (p.rocket) {
        const [x, y] = [Math.min(SIZE - 2, p.fH[0] + 2), p.fH[1]];
        ball(g, [x, y], 's', 'w', 'S');
        px(g, x - 2, y, 'y'); px(g, x - 3, y, 'o'); px(g, x - 3, y + 1, 'o'); px(g, x - 4, y, 'r');
      } else {
        ball(g, add(p.fH, [0.5, 0.5]), 's', 'w', 'S');
      }
    },
    shoe: 'S',
    shoeBack: 'S',
  };

  // Small seeded random so glitch noise is the same every time a pose renders.
  function rng(seed) {
    let x = Math.abs(Math.round(seed)) + 1;
    return () => {
      x = (x * 1103515245 + 12345) % 2147483648;
      return x / 2147483648;
    };
  }

  const GLITCH = {
    head(g, p) {
      const [cx, cy] = p.head;
      head(g, p.head, 'w', 's');
      // Mismatched eyes: one magenta, one cyan.
      if (p.face === 'hit') {
        rect(g, cx, cy - 1, 2, 1, 'm'); rect(g, cx + 2, cy, 2, 1, 'c');
      } else {
        rect(g, cx + 1, cy - 1, 1, 2, 'm');
        rect(g, cx + 3, cy - 1, 1, 2, 'c');
      }
      if (p.face === 'happy') rect(g, cx + 1, cy + 2, 3, 1, 'k');
      else px(g, cx + 2, cy + 2, 'k');
      // A chunk of the head is missing and drawn shifted to the right.
      for (let y = cy - 5; y <= cy - 3; y++) {
        for (let x = cx + 1; x <= cx + 5; x++) {
          if (!inHead(x, y, cx, cy)) continue;
          px(g, x + 2, y, g[y]?.[x] === 'k' ? 'm' : 'w');
          px(g, x, y, '.');
        }
      }
    },
    torso(g, { neck: [nx, ny] }) {
      px(g, nx, ny + 2, 'a'); px(g, nx + 1, ny + 3, 'm');
    },
    post(g, p) {
      const rand = rng(p.head[0] * 31 + p.head[1] * 17 + p.fH[0] * 7 + p.fF[0]);
      const heavy = p.face === 'hit' || p.face === 'angry';
      const src = g.map((row) => row.slice());
      // Color-split edges: magenta bleeds left, cyan bleeds right.
      for (let y = 0; y < SIZE; y++) {
        if (!heavy && rand() < 0.45) continue;
        for (let x = 0; x < SIZE; x++) {
          if (src[y][x] === '.') continue;
          if (src[y][x - 1] === '.' && x > 0) g[y][x - 1] = 'm';
          if (src[y][x + 1] === '.' && x < SIZE - 1) g[y][x + 1] = 'c';
        }
      }
      if (p.teleport) {
        // Teleporting: the body splits into bands that slide apart.
        const frozen = g.map((row) => row.slice());
        for (let y = 0; y < SIZE; y++) {
          const band = Math.floor(y / 3) % 3;
          const shift = band === 1 ? 4 : band === 2 ? -3 : 0;
          if (!shift) continue;
          for (let x = 0; x < SIZE; x++) g[y][x] = frozen[y][x - shift] ?? '.';
        }
      }
      // Static around the body.
      const count = heavy ? 16 : 7;
      for (let i = 0; i < count; i++) {
        const x = Math.floor(rand() * SIZE);
        const y = Math.floor(rand() * SIZE);
        if (g[y][x] === '.') g[y][x] = ['m', 'c', 'a', 'w'][Math.floor(rand() * 4)];
      }
    },
  };

  // Bots: people Cyborg has turned gray and lifeless.
  const BOT = {
    bodyFront: 'S',
    bodyBack: 'D',
    head(g, p) {
      const [cx, cy] = p.head;
      head(g, p.head, 's', 'S', 'D');
      // Blank, lifeless eyes and the little red chip Cyborg plants on them.
      if (p.face === 'hit') {
        px(g, cx, cy - 1, 'D'); px(g, cx + 1, cy, 'D'); px(g, cx + 3, cy - 1, 'D'); px(g, cx + 2, cy, 'D');
      } else {
        rect(g, cx, cy, 2, 1, 'D'); rect(g, cx + 3, cy, 2, 1, 'D');
      }
      px(g, cx - 2, cy - 3, 'r');
    },
  };

  // The Bot Brute: the first boss. A muscle-man bot, only a little bigger than the player.
  const BRUTE = {
    bodyFront: 'S',
    bodyBack: 'D',
    limb: 3,
    torso(g, { neck: [nx, ny], hip: [hx, hy] }) {
      // Broad chest that narrows to the waist.
      for (let k = 0; k <= 6; k++) {
        const t = k / 6;
        const x = Math.round(nx + (hx - nx) * t);
        const y = Math.round(ny + (hy - ny) * t);
        const half = Math.round(4 - 2 * t);
        rect(g, x - half, y, half * 2 + 2, 1, 'S');
      }
      // Pecs and a belt.
      px(g, nx - 1, ny + 2, 's'); px(g, nx + 2, ny + 2, 's');
      rect(g, hx - 2, hy - 1, 6, 1, 'D');
      px(g, hx + 1, hy - 1, 'r');
    },
    head(g, p) {
      const [cx, cy] = p.head;
      head(g, [cx, cy + 1], 's', 'S', 'D', 19);
      const y = cy + 1;
      // Heavy brow over blank eyes, and Cyborg's red chip.
      if (p.face === 'hit') {
        px(g, cx, y - 1, 'D'); px(g, cx + 1, y, 'D'); px(g, cx + 3, y - 1, 'D'); px(g, cx + 2, y, 'D');
      } else {
        rect(g, cx - 1, y - 2, 6, 1, 'D');
        rect(g, cx, y, 2, 1, 'D'); rect(g, cx + 3, y, 2, 1, 'D');
      }
      rect(g, cx + 1, y + 2, 3, 1, 'D');
      px(g, cx - 2, y - 3, 'r');
    },
    hands(g, p) {
      ball(g, add(p.bH, [0.5, 0.5]), 'D', 'S', 'k');
      ball(g, add(p.fH, [0.5, 0.5]), 'S', 's', 'D');
    },
    shoe: 'D',
  };

  // The person a bot turns back into after it is beaten (shirt color varies).
  function personGear(shirt) {
    return {
      torso(g, { neck: [nx, ny], hip: [hx, hy] }) {
        line(g, [nx, ny + 1], [hx, hy - 1], shirt, 2);
      },
    };
  }

  const GEAR = { boxer: BOXER, ninja: NINJA, samurai: SAMURAI, cyborg: CYBORG, glitch: GLITCH, bot: BOT, brute: BRUTE };
  const SHIRTS = ['r', 'o', 'y', 'g', 'c', 'b', 'm'];
  SHIRTS.forEach((c) => { GEAR[`person-${c}`] = personGear(c); });

  // ---- Animations --------------------------------------------------------
  // Each animation is a list of [poseName, frames]. The fight blends from the
  // current pose into the first key, so every move eases in smoothly.
  const K = (name, frames, extra) => [name, frames, extra];
  const ANIMS = {
    idle: { loop: true, keys: [K('idle1', 28), K('idle2', 28)] },
    walk: { loop: true, keys: [K('walkA', 6), K('walkP1', 6), K('walkB', 6), K('walkP2', 6)] },
    rise: { keys: [K('rise', 5)] },
    fall: { keys: [K('tuck', 8)] },
    duck: { keys: [K('duck', 4)] },
    hit: { keys: [K('hit', 3)] },
    launched: { keys: [K('launched', 6)] },
    down: { keys: [K('down', 6)] },
    sleep: { keys: [K('down', 1, { face: 'sleep' })] },
    getup: { keys: [K('duck', 10), K('idle1', 8)] },
    victory: { keys: [K('victory', 10)] },
    strong: { keys: [K('heavyWind', 9), K('heavy', 4), K('heavy', 10), K('idle1', 8)] },
    lowKick: { keys: [K('duck', 3), K('lowKick', 4), K('lowKick', 10), K('duck', 6)] },
    slam: { keys: [K('rise', 5), K('slam', 6), K('slam', 8)] },
    // Combo hits 1-7: wind into the strike, then hold it while the timing bar runs.
    combo: [
      null,
      { keys: [K('jab', 4)] },
      { keys: [K('cross', 4)] },
      { keys: [K('duck', 2), K('upper', 4)] },
      { keys: [K('hook', 4)] },
      { keys: [K('jab', 3)] },
      { keys: [K('cross', 3)] },
      { keys: [K('heavyWind', 3), K('heavy', 4)] },
    ],
    special: { keys: [K('duck', 10), K('flyKick', 3), K('flyKick', 18), K('tuck', 6), K('idle1', 6)] },
  };

  // The Ninja fights with fast kicks, like Fang from Brawl Stars.
  const ANIM_OVERRIDES = {
    // Glitch: break apart, reappear behind the enemy, strike.
    // Boxer: Haymaker, a huge charged punch.
    boxer: {
      special: { keys: [K('heavyWind', 6), K('heavyWind', 14, { face: 'angry' }), K('heavy', 3), K('heavy', 14), K('idle1', 8)] },
    },
    // Samurai: hold the guard; if hit, Counter Slash.
    samurai: {
      special: { keys: [K('guard', 5), K('guard', 55)] },
      counter: { keys: [K('guard', 2), K('slash', 4), K('slash', 14), K('idle1', 8)] },
    },
    // Cyborg: fire the fist and wait for it to come back.
    cyborg: {
      special: { keys: [K('heavyWind', 8), K('rocket', 4), K('rocket', 400)] },
    },
    glitch: {
      special: { keys: [K('duck', 4), K('idle1', 8, { teleport: true, face: 'angry' }), K('idle1', 4, { teleport: true, face: 'angry' }), K('heavyWind', 6), K('heavy', 4), K('heavy', 8), K('idle1', 6)] },
    },
    ninja: {
      strong: { keys: [K('chamber', 8), K('sideKick', 4), K('sideKick', 10), K('idle1', 8)] },
      combo: [
        null,
        { keys: [K('jab', 4)] },
        { keys: [K('frontKick', 4)] },
        { keys: [K('duck', 2), K('risingKick', 4)] },
        { keys: [K('chamber', 2), K('spinKick', 4)] },
        { keys: [K('knee', 3)] },
        { keys: [K('chamber', 2), K('frontKick', 3)] },
        { keys: [K('tuck', 3), K('flyKick', 4)] },
      ],
    },
  };

  function anim(id, name, hit) {
    const own = ANIM_OVERRIDES[id]?.[name];
    const base = own || ANIMS[name];
    return hit != null ? base[hit] : base;
  }

  function poseFor(name, extra) {
    return extra ? { ...POSES[name], ...extra } : POSES[name];
  }

  const JOINTS = ['head', 'neck', 'hip', 'bE', 'bH', 'fE', 'fH', 'bK', 'bF', 'fK', 'fF', 'sword'];

  function lerpPose(a, b, t) {
    const out = { ...(t < 0.5 ? a : b) };
    for (const j of JOINTS) {
      out[j] = [a[j][0] + (b[j][0] - a[j][0]) * t, a[j][1] + (b[j][1] - a[j][1]) * t];
    }
    return out;
  }

  // Smoothstep easing makes strikes snap and settle instead of sliding.
  const ease = (t) => t * t * (3 - 2 * t);

  // ---- Rendering & cache --------------------------------------------------
  // Bot form: same fighter, drained to Cyborg's gray, with red eyes.
  const BOT_TINT = {
    k: 'S', D: 'D', w: 's', s: 'S', S: 'D', r: 'S', R: 'D', o: 's', y: 's',
    b: 'S', B: 'D', c: 's', a: 'r', g: 'S', m: 's',
  };

  function renderGrid(id, p) {
    const rounded = { ...p };
    for (const j of JOINTS) {
      if (j === 'sword') continue;
      rounded[j] = [Math.round(p[j][0]), Math.round(p[j][1])];
    }
    if (id.endsWith('-bot')) {
      const g = body(rounded, GEAR[id.slice(0, -4)]);
      const [cx, cy] = rounded.head;
      for (const row of g) for (let x = 0; x < row.length; x++) if (row[x] !== '.') row[x] = BOT_TINT[row[x]] || row[x];
      // Cyborg's red chip.
      if (g[cy - 3]) g[cy - 3][cx - 2] = 'r';
      return g;
    }
    return body(rounded, GEAR[id]);
  }

  const cache = new Map();
  function poseCanvas(id, p) {
    const key = id + JSON.stringify(JOINTS.map((j) => (j === 'sword'
      ? [Math.round(p[j][0] * 4), Math.round(p[j][1] * 4)]
      : [Math.round(p[j][0]), Math.round(p[j][1])])))
      + p.face + (p.slash ? 's' : '') + (p.rocket ? 'r' : '') + (p.teleport ? 't' : '') + (p.fistGone ? 'f' : '');
    let c = cache.get(key);
    if (c) return c;
    // Keep the cache small: drop the oldest drawings when it fills up.
    if (cache.size > 1200) {
      let n = 0;
      for (const k of cache.keys()) { cache.delete(k); if (++n >= 400) break; }
    }
    const g = renderGrid(id, p);
    c = document.createElement('canvas');
    c.width = SIZE; c.height = SIZE;
    // willReadFrequently keeps these small canvases in normal memory, so the browser
    // never wipes them when graphics memory runs low.
    const cx = c.getContext('2d', { willReadFrequently: true });
    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        if (g[y][x] === '.') continue;
        cx.fillStyle = PALETTE[g[y][x]];
        cx.fillRect(x, y, 1, 1);
      }
    }
    cache.set(key, c);
    return c;
  }

  // Draw a pose with its feet-center (14, 27) at (x, y).
  function drawPose(ctx, id, p, x, y, { scale = 1, flip = false, alpha = 1 } = {}) {
    const c = poseCanvas(id, p);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.imageSmoothingEnabled = false;
    const left = Math.round(x - 14 * scale);
    const top = Math.round(y - 27 * scale);
    if (flip) {
      ctx.translate(left + SIZE * scale, top);
      ctx.scale(-1, 1);
      ctx.drawImage(c, 0, 0, SIZE * scale, SIZE * scale);
    } else {
      ctx.drawImage(c, left, top, SIZE * scale, SIZE * scale);
    }
    ctx.restore();
  }

  // ---- Roster --------------------------------------------------------------
  // Names are placeholders until the creator picks the final names.
  const CHARACTERS = [
    {
      id: 'ninja',
      name: 'NINJA',
      team: '#3b5dc9',
      tagline: 'The main hero',
      unlock: 'You start with him',
      gear: 'Blue hood, long scarf and wrist wraps',
      style: 'Lives at a small temple in the Grassy Fields. Fights with fast kicks and a dashing special, like Fang from Brawl Stars.',
      special: { name: 'Dash Kick', text: 'A flying kick that shoots across the screen and sends the enemy flying.' },
      stats: { power: 2, speed: 5, reach: 4, defense: 1 },
      colors: ['b', 'B', 'c'],
      bio: 'Got a warning from the Samurai about Cyborg, then set out to fix everything.',
    },
    {
      id: 'boxer',
      locked: true,
      name: 'BOXER',
      team: '#b13e53',
      tagline: 'The Dojo boss',
      unlock: 'Beat him at the Dojo',
      gear: 'Red headband, boxing gloves and boxing shorts',
      style: 'Quick punches and good at everything, without being the best at anything.',
      special: { name: 'Haymaker', text: 'A huge charged punch that sends the enemy flying.' },
      stats: { power: 3, speed: 4, reach: 2, defense: 3 },
      colors: ['r', 'o', 'w'],
      bio: 'Turned into a bot by Cyborg. Beat him and he joins your team.',
    },
    {
      id: 'samurai',
      locked: true,
      name: 'SAMURAI',
      team: '#ffcd75',
      tagline: 'The Temple boss',
      unlock: 'Beat him at the Cherry Blossom Temple',
      gear: 'Topknot, gold shoulder plate, sash and a katana',
      style: 'Clean, strong sword slashes with good reach. Wait for the enemy to swing, then strike.',
      special: { name: 'Counter Slash', text: 'Holds a guard stance. If the enemy attacks during it, he slashes back.' },
      stats: { power: 4, speed: 3, reach: 3, defense: 2 },
      colors: ['y', 'o', 's'],
      bio: 'Lived at the Cherry Blossom Temple. Warned the Ninja about Cyborg, then got turned into a bot.',
    },
    {
      id: 'cyborg',
      locked: true,
      name: 'CYBORG',
      team: '#38b764',
      tagline: 'The supervillain',
      unlock: 'Beat him at the end of Main Mode',
      gear: 'Fully metal: steel head, glowing visor, antenna and a rocket fist',
      style: 'Heavy armor and big hits, but slow to move.',
      special: { name: 'Rocket Punch', text: 'Fires his fist across the screen. It flies back after the hit.' },
      stats: { power: 4, speed: 2, reach: 2, defense: 4 },
      colors: ['s', 'S', 'a'],
      bio: 'Terrorizing the universe and turning people into bots.',
    },
    {
      id: 'glitch',
      name: 'GLITCH',
      locked: true,
      team: '#ff4fd8',
      tagline: 'The broken bot',
      unlock: 'Beat Glitch Mode',
      gear: 'No gear. A corrupted stickman with split colors, a missing piece of his head and static all around him',
      style: 'Hard to pin down. Flickers around the stage and hits from angles nobody expects.',
      special: { name: 'Teleport', text: 'Vanishes in a burst of static and reappears behind the enemy, ready to hit.' },
      stats: { power: 3, speed: 4, reach: 3, defense: 2 },
      colors: ['m', 'c', 'a'],
      bio: 'One of Cyborg\'s bots that broke. Now he commands the whole bot army.',
    },
  ];

  // Menu poses (string grids) used by the title screen, select screen and sheet.
  const POSE_ORDER = ['idle', 'walk1', 'walk2', 'jump', 'attack', 'hit', 'victory'];
  const MENU_POSES = { idle: 'idle1', walk1: 'walkA', walk2: 'walkB', jump: 'rise', attack: 'jab', hit: 'hit', victory: 'victory' };
  const SIGNATURE = {
    ninja: poseFor('flyKick'),
    boxer: poseFor('heavy'),
    samurai: poseFor('jab', { bE: [16, 15], bH: [19, 13], fE: [18, 15], fH: [20, 13], slash: true }),
    cyborg: poseFor('jab', { fE: [19, 13], fH: [22, 12], rocket: true }),
    glitch: poseFor('jab', { teleport: true }),
  };

  function menuSprite(id, name) {
    const p = name === 'attack' ? SIGNATURE[id] : poseFor(MENU_POSES[name]);
    return renderGrid(id, p).map((row) => row.join(''));
  }

  CHARACTERS.forEach((ch) => {
    ch.sprites = Object.fromEntries(POSE_ORDER.map((n) => [n, menuSprite(ch.id, n)]));
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
  // Menu sprites for the computer-only fighters, used on the select screen.
  const BOT_SPRITES = Object.fromEntries(['bot', 'brute'].map((id) => [id,
    Object.fromEntries(POSE_ORDER.map((n) => [n, renderGrid(id, n === 'attack' ? poseFor('heavy') : poseFor(MENU_POSES[n])).map((row) => row.join(''))]))]));

  // Forget every saved drawing (they are redrawn the next time they are needed).
  const clearCache = () => cache.clear();

  window.Rig = { POSES, SHIRTS, BOT_SPRITES, anim, poseFor, lerpPose, ease, drawPose, clearCache };
})();
