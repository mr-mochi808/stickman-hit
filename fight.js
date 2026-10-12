// Stickman Hit - the fight.
// Ninja vs bots on the Grassy Fields, following docs/game-design.md:
// 1,000 health, combos with a timing bar, strong attack, low kick and slam,
// ducking with a time limit, a special meter with a freeze-frame Dash Kick,
// a 60-second timer, KO, and a computer opponent on Easy / Normal / Hard.
// Modes: a single Quick Fight, a Main Mode level (3 bots in a row, health carries
// over), or the Bot Brute boss (best of 3 rounds, 90 seconds each).
// All numbers are starting points to tune by play-testing.
(() => {
  const W = 256;
  const H = 144;
  const GROUND = 110;
  const WALL_L = 12;
  const WALL_R = 244;
  const GRAVITY = 0.22;
  const JUMP_V = 4.3;
  const FPS = 60;

  const HP = 1000;
  const ROUND_SECONDS = 60;
  const BOSS_SECONDS = 90;
  const LEVEL_ENEMIES = 3;
  const BOSS_ROUNDS_TO_WIN = 2;
  const COMBO_MAX = 7;
  const DMG = {
    first: 20, perfect: 30, good: 12, strong: 50, low: 30,
    slamPerfect: 50, slamGood: 30, special: 150,
  };
  // Timing bar zones, as a fraction of the bar from left to right.
  const ZONE = { greenFrom: 0.5, perfectFrom: 0.68, perfectTo: 0.76, greenTo: 0.92 };
  const barFrames = (hit) => Math.max(16, Math.round(48 * 0.86 ** (hit - 1)));
  const DUCK_MAX = 4 * FPS;
  const DUCK_LOCK = FPS;
  const METER_DEAL = 0.22;
  const METER_TAKE = 0.12;

  // Computer opponent settings per difficulty.
  const AI_LEVELS = {
    easy: { cooldown: [70, 120], low: 0.35, combo: 0, success: 0, perfect: 0, duckBreak: 0, jumpLow: 0, duckHigh: 0, speed: 0.8 },
    normal: { cooldown: [40, 80], low: 0.35, combo: 0.55, success: 0.6, perfect: 0.25, duckBreak: 0.15, jumpLow: 0.1, duckHigh: 0.1, speed: 1 },
    hard: { cooldown: [18, 42], low: 0.2, combo: 0.9, success: 0.85, perfect: 0.5, duckBreak: 0.35, jumpLow: 0.3, duckHigh: 0.25, speed: 1.1 },
  };

  // Both 1-player layouts work at the same time.
  // 2 players on one keyboard (from docs/game-design.md).
  const KEYMAP_2P = {
    a: [0, 'left'], d: [0, 'right'], w: [0, 'up'], s: [0, 'down'], f: [0, 'combo'], g: [0, 'strong'], h: [0, 'special'],
    arrowleft: [1, 'left'], arrowright: [1, 'right'], arrowup: [1, 'up'], arrowdown: [1, 'down'],
    ',': [1, 'combo'], '.': [1, 'strong'], '/': [1, 'special'],
  };

  // Specials that are built so far. The others arrive with their bosses.
  const SPECIALS = { ninja: 'DASH KICK!', glitch: 'TELEPORT!', boxer: 'HAYMAKER!', samurai: 'COUNTER SLASH!', cyborg: 'ROCKET PUNCH!' };

  const KEYMAP = {
    a: 'left', arrowleft: 'left',
    d: 'right', arrowright: 'right',
    w: 'up', arrowup: 'up',
    s: 'down', arrowdown: 'down',
    ' ': 'combo', z: 'combo',
    k: 'strong', x: 'strong',
    m: 'special', c: 'special',
  };

  const { poseFor, anim: rigAnim, lerpPose, ease, drawPose, SHIRTS } = window.Rig;
  const rand = Math.random;
  const pick = ([a, b]) => a + Math.floor(rand() * (b - a + 1));
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  function blankInput() {
    return { left: false, right: false, up: false, down: false, pUp: false, pCombo: false, pStrong: false, pSpecial: false };
  }

  // Bots get a little tougher with each level of the Grassy Fields.
  function tunedAI(difficulty, tier, boss) {
    const base = AI_LEVELS[difficulty];
    const step = Math.max(0, tier - 1);
    const scale = Math.max(0.45, 1 - 0.035 * step - (boss ? 0.1 : 0));
    return {
      ...base,
      cooldown: base.cooldown.map((v) => Math.round(v * scale)),
      success: base.combo ? Math.min(0.95, base.success + 0.03 * step) : 0,
      duckBreak: Math.min(0.6, base.duckBreak + 0.03 * step),
      speed: base.speed + Math.min(0.35, 0.02 * step),
    };
  }

  function create({ ui, difficulty = 'normal', mode = { kind: 'quick' }, onExit, onLevelClear }) {
    const { drawText, textWidth, C, blip, settings } = ui;
    const isBoss = mode.kind === 'boss';
    const isLevel = mode.kind === 'level';
    const isQuick = mode.kind === 'quick';
    const twoPlayer = isQuick && !!mode.twoPlayer;
    const tier = mode.tier ?? (isLevel ? mode.level : isBoss ? 6 : 1);
    const enemiesTotal = mode.enemies || LEVEL_ENEMIES;
    const glitchy = !!mode.glitch;
    const label = mode.label || (isLevel ? `LEVEL ${mode.level}` : 'BOSS');
    // Quick Fight timer: 60, 120 or 0 for no limit.
    const roundSeconds = isBoss ? BOSS_SECONDS : mode.timer != null ? mode.timer : ROUND_SECONDS;
    const noLimit = roundSeconds === 0;
    const fullTime = () => (noLimit ? Infinity : roundSeconds * FPS);
    let ctx = null;
    let uid = 0;

    // ---- Fighters ---------------------------------------------------------
    function makeFighter(id, side, botForm = false) {
      const ch = window.CHARACTERS.find((c) => c.id === id);
      const isBot = id === 'bot' || id === 'brute' || botForm;
      const aiCfg = tunedAI(difficulty, tier, id === 'brute');
      return {
        id,
        side,
        isBot,
        aiCfg,
        name: id === 'brute' ? 'BOT BRUTE' : botForm ? `BOT ${ch.name}` : isBot ? 'BOT' : ch.name,
        team: isBot ? C.grey : ch.team,
        botForm,
        // Which sprite to draw: bosses that are still bots are drawn gray.
        rid: botForm ? `${id}-bot` : id,
        hasSpecial: !!SPECIALS[id],
        human: side === 0 || twoPlayer,
        // Fighters walk at a speed set by their Speed stat.
        walk: id === 'brute' ? 0.75 * aiCfg.speed : isBot ? 0.9 * aiCfg.speed : (0.9 + 0.12 * ch.stats.speed) * (side === 1 && !twoPlayer ? aiCfg.speed : 1),
        // The Bot Brute hits harder and is a bit wider.
        dmgMul: id === 'brute' ? 1.35 : 1,
        wide: id === 'brute' ? 6 : 5,
        x: side === 0 ? 84 : 172,
        y: 0, vx: 0, vy: 0,
        facing: side === 0 ? 1 : -1,
        hp: HP, trailHp: HP, meter: 0,
        state: 'idle', st: 0,
        pose: poseFor('idle1'), anim: null, animName: '', animT: 0, animFrom: null,
        duckTime: 0, duckLock: 0, invuln: 0, stun: 0,
        combo: null, slam: null, soft: false, juggle: false,
        comboCount: 0, comboShowT: 0,
        input: blankInput(),
        ai: { cool: 60, duckT: 0, waitT: 0 },
        attackId: 0,
        shirt: SHIRTS[Math.floor(rand() * SHIRTS.length)],
      };
    }

    const player = makeFighter(isQuick && mode.p1 ? mode.p1 : 'ninja', 0);
    let bot = makeFighter(isBoss ? mode.boss || 'brute' : isQuick && mode.p2 ? mode.p2 : 'bot', 1, isBoss && !!mode.botForm);
    let fighters = [player, bot];
    // Beaten bots stay on the field, asleep.
    const sleepers = [];
    const other = (f) => (f === player ? bot : player);

    // ---- Animation player ---------------------------------------------------
    const keyPose = (k) => poseFor(k[0], k[2]);
    const animTotal = (f) => f.anim.keys.reduce((s, k) => s + k[1], 0);

    function setAnim(f, name, hit, force = false) {
      const key = name + (hit ?? '');
      if (!force && f.animName === key) return;
      f.animName = key;
      f.anim = rigAnim(f.id, name, hit);
      f.animT = 0;
      f.animFrom = f.pose;
    }

    function stepAnim(f) {
      const a = f.anim;
      if (!a) return;
      f.animT++;
      const total = animTotal(f);
      if (a.loop && f.animT > total) {
        f.animT -= total;
        f.animFrom = keyPose(a.keys[a.keys.length - 1]);
      }
      let t = f.animT;
      let from = f.animFrom;
      for (const k of a.keys) {
        const to = keyPose(k);
        if (t <= k[1]) {
          f.pose = lerpPose(from, to, ease(Math.min(1, t / k[1])));
          return;
        }
        t -= k[1];
        from = to;
      }
      f.pose = from;
    }

    function setState(f, state) {
      f.state = state;
      f.st = 0;
    }

    // ---- Effects ------------------------------------------------------------
    const particles = [];
    const popups = [];
    const ghosts = [];
    let shakeT = 0;
    let shakeMag = 0;
    let hitstop = 0;

    function shake(mag, frames) {
      if (!settings.shake) return;
      shakeMag = Math.max(shakeMag, mag);
      shakeT = Math.max(shakeT, frames);
    }

    function sparks(x, y, n = 7, colors = [C.yellow, C.white, C.orange]) {
      for (let i = 0; i < n; i++) {
        const a = rand() * Math.PI * 2;
        const s = 0.8 + rand() * 1.8;
        particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 10 + pick([0, 8]), color: colors[i % colors.length], g: 0.05 });
      }
    }

    function dust(x, n = 5) {
      for (let i = 0; i < n; i++) {
        particles.push({ x: x + (rand() - 0.5) * 10, y: GROUND - 1, vx: (rand() - 0.5) * 1.2, vy: -rand() * 0.6, life: 14 + pick([0, 10]), color: C.grey, g: 0.01 });
      }
    }

    function popup(text, x, y, color, life = 50) {
      popups.push({ text, x, y, color, t: 0, life });
    }

    // 8-bit sound effects (audio.js). Names from the fight map to the effects there.
    const SFX_NAMES = { hit: 'punch', strong: 'kick', low: 'kick', big: 'bigHit' };
    function sound(kind) {
      if (window.SHAudio) window.SHAudio.sfx(SFX_NAMES[kind] || kind);
      else blip(440);
    }

    // Music for this place: chill in the Fields, more intense each place, glitchy in Glitch Mode.
    const TRACK_FOR_STAGE = { grassy: 'grassy', dojo: 'dojo', temple: 'temple', dusk: 'finale' };
    function startTrack() {
      window.SHAudio?.music(mode.glitch ? 'glitch' : TRACK_FOR_STAGE[mode.stage || 'grassy'] || 'grassy', { boss: mode.kind === 'boss' });
    }

    // ---- Boxes --------------------------------------------------------------
    function hurtbox(f) {
      const h = f.state === 'duck' || f.state === 'lowkick' ? 15 : 26;
      return { x0: f.x - f.wide, x1: f.x + f.wide, y0: f.y, y1: f.y + h };
    }

    function hitbox(f, [f0, f1], [h0, h1]) {
      const a = f.x + f.facing * f0;
      const b = f.x + f.facing * f1;
      return { x0: Math.min(a, b), x1: Math.max(a, b), y0: f.y + h0, y1: f.y + h1 };
    }

    const overlap = (a, b) => a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1;

    function hittable(t) {
      if (t.state === 'special') return !!t.guarding;
      return t.invuln <= 0 && !['launched', 'down', 'getup', 'ko', 'convert', 'sleep', 'victory', 'counter'].includes(t.state);
    }

    // ---- Damage ---------------------------------------------------------------
    function applyDamage(t, dmg, a, fromSpecial = false) {
      dmg = Math.round(dmg * (a.dmgMul || 1));
      t.hp = Math.max(0, t.hp - dmg);
      if (a.hasSpecial && !fromSpecial) a.meter = Math.min(100, a.meter + dmg * METER_DEAL);
      if (t.hasSpecial) t.meter = Math.min(100, t.meter + dmg * METER_TAKE);
      // Getting hit mid-combo cancels your own combo.
      if (t.combo) { t.combo = null; }
      t.slam = null;
      return t.hp <= 0;
    }

    function launch(t, a, vx, vy) {
      setState(t, 'launched');
      t.vx = a.facing * vx;
      t.vy = vy;
      t.y = Math.max(t.y, 1);
      t.soft = false;
      t.juggle = false;
      setAnim(t, 'launched', null, true);
    }

    function stagger(t, a, stun, kb) {
      setState(t, 'hitstun');
      t.stun = stun;
      t.vx = a.facing * kb;
      setAnim(t, 'hit', null, true);
    }

    function contactPoint(a, t) {
      return [t.x - a.facing * 4, GROUND - t.y - 18];
    }

    // ---- Moves --------------------------------------------------------------
    function startStrong(f) {
      setState(f, 'strong');
      f.vx = 0;
      f.hitDone = false;
      f.attackId = ++uid;
      setAnim(f, 'strong', null, true);
    }

    function updateStrong(f, o) {
      const keys = f.anim.keys;
      const from = keys[0][1] + 1;
      const to = keys[0][1] + keys[1][1] + 4;
      if (f.st >= from && f.st <= to) {
        f.x += f.facing * 0.5;
        if (!f.hitDone && hittable(o) && overlap(hitbox(f, [4, 21], [16, 25]), hurtbox(o))) {
          f.hitDone = true;
          if (countered(o, f)) return;
          const ko = applyDamage(o, DMG.strong, f);
          if (ko) launch(o, f, 2.4, 3); else stagger(o, f, 26, 2.4);
          sparks(...contactPoint(f, o), 10);
          shake(3, 10);
          hitstop = 6;
          sound('strong');
        }
      }
      if (f.animT >= animTotal(f)) toIdle(f);
    }

    function startCombo(f) {
      setState(f, 'combo');
      f.vx = 0;
      f.attackId = ++uid;
      f.combo = { n: 1, phase: 'strike', t: 0, quality: null };
      setAnim(f, 'combo', 1, true);
    }

    function zoneOf(m) {
      if (m < ZONE.greenFrom || m >= ZONE.greenTo) return 'red';
      if (m >= ZONE.perfectFrom && m < ZONE.perfectTo) return 'perfect';
      return 'good';
    }

    function updateCombo(f, o) {
      const c = f.combo;
      if (!c) { toIdle(f); return; }
      c.t++;
      if (c.phase === 'strike') {
        if (c.n === 1) f.x += f.facing * 0.9;
        if (c.t >= animTotal(f)) resolveComboHit(f, o, c);
        return;
      }
      // Timing bar: press on the line for a Perfect.
      if (o.juggle) o.y = Math.max(4, o.y - 0.12);
      if (f.input.pCombo) {
        const zone = zoneOf(c.t / c.D);
        if (zone === 'red') {
          popup('MISS', f.x, GROUND - f.y - 46, C.red);
          sound('miss');
          endCombo(f, o, false);
          return;
        }
        c.quality = zone;
        if (zone === 'perfect') {
          popup('PERFECT!', f.x, GROUND - f.y - 46, C.yellow);
          sound('perfect');
        } else {
          sound('good');
        }
        c.n++;
        c.phase = 'strike';
        c.t = 0;
        setAnim(f, 'combo', c.n, true);
        return;
      }
      if (c.t >= c.D) endCombo(f, o, false);
    }

    function resolveComboHit(f, o, c) {
      if (c.n === 1) {
        if (!hittable(o) || !overlap(hitbox(f, [4, 22], [16, 25]), hurtbox(o))) {
          // No bar unless the first punch lands; tell the player why.
          if (f.human && hittable(o)) {
            const why = o.state === 'duck' ? 'DUCKED!' : o.y > 8 ? 'JUMPED!' : 'TOO FAR';
            popup(why, f.x, GROUND - f.y - 34, C.grey, 40);
          }
          endCombo(f, o, false);
          return;
        }
      } else if (c.n === 2 && o.state === 'duck') {
        // Ducking between hit 1 and hit 2 breaks the combo.
        popup('BROKEN!', o.x, GROUND - o.y - 34, C.cyan);
        sound('broken');
        endCombo(f, o, false);
        return;
      } else if (o.state !== 'comboStun') {
        endCombo(f, o, false);
        return;
      }

      if (c.n === 1 && countered(o, f)) { f.combo = null; toRecover(f, 10); return; }
      const dmg = c.n === 1 ? DMG.first : c.quality === 'perfect' ? DMG.perfect : DMG.good;
      const ko = applyDamage(o, dmg, f);
      setState(o, 'comboStun');
      o.soft = c.n === 1;
      o.stun = 120;
      o.vx = 0;
      o.x = clamp(f.x + f.facing * 15, WALL_L, WALL_R);
      f.x = clamp(o.x - f.facing * 15, WALL_L, WALL_R);
      if (c.n >= 3) {
        // Hit 3 launches the enemy up; later hits keep them in the air.
        o.juggle = true;
        o.y = c.n === 3 ? 12 : Math.min(18, o.y + 5);
        o.vy = 0;
      }
      setAnim(o, o.juggle ? 'launched' : 'hit', null, true);
      f.comboCount = c.n;
      f.comboShowT = 90;
      sparks(...contactPoint(f, o), c.quality === 'perfect' ? 10 : 6);
      hitstop = c.quality === 'perfect' ? 6 : 4;
      shake(c.n >= 3 ? 2 : 1, 6);
      sound('hit');

      if (ko || c.n === COMBO_MAX) {
        endCombo(f, o, true);
        return;
      }
      c.phase = 'bar';
      c.t = 0;
      c.D = barFrames(c.n);
      c.aiPress = null;
    }

    // The final hit of a combo always knocks the enemy away a little.
    function endCombo(f, o, finished) {
      f.combo = null;
      setState(f, 'recover');
      f.recoverT = finished ? 16 : 12;
      setAnim(f, 'idle');
      if (o.state !== 'comboStun') return;
      const wasJuggled = o.juggle;
      o.soft = false;
      o.juggle = false;
      if (finished || o.hp <= 0) {
        launch(o, f, 2.6, 3.2);
        shake(4, 12);
      } else if (wasJuggled) {
        launch(o, f, 1.2, 1);
      } else {
        stagger(o, f, 16, 1.6);
      }
    }

    function startLowKick(f) {
      setState(f, 'lowkick');
      f.vx = 0;
      f.hitDone = false;
      f.attackId = ++uid;
      f.slam = null;
      setAnim(f, 'lowKick', null, true);
    }

    function updateLowKick(f, o) {
      if (!f.hitDone && f.st >= 4 && f.st <= 10 && hittable(o) && overlap(hitbox(f, [4, 22], [0, 7]), hurtbox(o))) {
        f.hitDone = true;
        if (countered(o, f)) return;
        const ko = applyDamage(o, DMG.low, f);
        launch(o, f, 0.5, ko ? 3 : 4);
        o.tripped = true;
        sparks(o.x - f.facing * 3, GROUND - 3, 6);
        hitstop = 5;
        sound('low');
        // A quick timing bar for the slam that follows the trip.
        if (!ko) f.slam = { t: 0, D: 26 };
      }
      if (f.slam) {
        const s = f.slam;
        s.t++;
        if (o.state !== 'launched') {
          f.slam = null;
        } else if (f.input.pCombo || f.input.pStrong) {
          const zone = zoneOf(s.t / s.D);
          if (zone === 'red') {
            popup('MISS', f.x, GROUND - f.y - 46, C.red);
            sound('miss');
            f.slam = null;
          } else {
            if (zone === 'perfect') { popup('PERFECT!', f.x, GROUND - 46, C.yellow); sound('perfect'); }
            startSlam(f, o, zone);
            return;
          }
        } else if (s.t >= s.D) {
          f.slam = null;
        }
      }
      if (f.animT >= animTotal(f) && !f.slam) toIdle(f);
    }

    function startSlam(f, o, quality) {
      f.slam = null;
      setState(f, 'slam');
      f.slamQuality = quality;
      f.vy = 2.6;
      f.y = Math.max(f.y, 1);
      f.vx = clamp((o.x - f.facing * 6 - f.x) / 14, -2.5, 2.5);
      setAnim(f, 'slam', null, true);
    }

    function updateSlam(f, o) {
      physics(f);
      if (f.st === 9 && o.state === 'launched') {
        const ko = applyDamage(o, f.slamQuality === 'perfect' ? DMG.slamPerfect : DMG.slamGood, f);
        o.vy = -4.5;
        o.vx = f.facing * 0.6;
        o.slammed = true;
        if (ko) o.hp = 0;
        sparks(o.x, GROUND - o.y - 8, 10);
        hitstop = 6;
        shake(4, 12);
        sound('slam');
      }
      if (f.y <= 0 && f.st > 4) {
        dust(f.x);
        toRecover(f, 10);
      }
    }

    // The Samurai's guard: if the enemy attacks during it, he slashes back.
    function countered(t, a) {
      if (t.state !== 'special' || !t.guarding) return false;
      t.guarding = false;
      setState(t, 'counter');
      t.counterTarget = a;
      setAnim(t, 'counter', null, true);
      freeze = t;
      popup('COUNTER!', t.x, GROUND - 50, C.yellow, 50);
      sound('perfect');
      return true;
    }

    function updateCounter(t, o) {
      if (t.st === 6) { sparks(o.x, GROUND - o.y - 16, 14, [C.white, C.cyan, C.yellow]); shake(4, 10); }
      if (t.animT >= animTotal(t)) {
        freeze = null;
        toIdle(t);
        landSpecial(t, o);
      }
    }

    // A special that connected: 150 damage and the enemy goes flying.
    function landSpecial(f, o) {
      if (o.hp <= 0 || countered(o, f)) return;
      applyDamage(o, DMG.special, f, true);
      launch(o, f, 3.2, 3.6);
      hitstop = 8;
      shake(6, 18);
      sound('big');
    }

    // Boxer's Haymaker: a long charge, then a huge punch.
    function updateHaymaker(f, o) {
      if (f.st < 20) {
        if (f.st % 2 === 0) sparks(f.x - f.facing * 4, GROUND - 16, 2, [C.red, C.orange, C.yellow]);
        if (f.st % 6 === 0) shake(1, 4);
      } else if (f.st < 26) {
        f.x = clamp(f.x + f.facing * 3, WALL_L, WALL_R);
        if (!f.specialHit && Math.abs(f.x - o.x) < 28 && Math.sign(o.x - f.x) === f.facing) {
          f.specialHit = true;
          sparks(o.x, GROUND - o.y - 18, 16, [C.red, C.orange, C.yellow, C.white]);
        }
      }
      if (f.animT >= animTotal(f)) {
        freeze = null;
        toIdle(f);
        if (f.specialHit) landSpecial(f, o);
      }
    }

    // Cyborg's Rocket Punch: the fist flies across the screen and comes back.
    function updateRocket(f, o) {
      if (f.st === 12) f.fist = { x: f.x + f.facing * 10, y: 15, dir: f.facing, out: true, dist: 0 };
      const fist = f.fist;
      if (fist) {
        if (fist.out) {
          fist.x += fist.dir * 5;
          fist.dist += 5;
          if (frame % 2 === 0) particles.push({ x: fist.x - fist.dir * 3, y: GROUND - fist.y, vx: -fist.dir * 0.5, vy: (rand() - 0.5) * 0.4, life: 10, color: rand() < 0.5 ? C.orange : C.yellow, g: 0 });
          if (!f.specialHit && Math.abs(fist.x - o.x) < 8 && o.y < 28) {
            f.specialHit = true;
            fist.out = false;
            sparks(o.x, GROUND - o.y - 15, 14, [C.orange, C.yellow, C.white]);
            shake(3, 8);
          } else if (fist.dist >= 180 || fist.x <= WALL_L || fist.x >= WALL_R) {
            fist.out = false;
          }
        } else {
          fist.x += Math.sign(f.x - fist.x) * 6;
          if (Math.abs(fist.x - f.x) < 8) f.fist = null;
        }
      }
      if ((f.st > 16 && !f.fist) || f.st > 300) {
        f.fist = null;
        freeze = null;
        toIdle(f);
        if (f.specialHit) landSpecial(f, o);
      }
    }

    function startSpecial(f, o) {
      setState(f, 'special');
      f.meter = 0;
      f.vx = 0;
      f.specialHit = false;
      f.attackId = ++uid;
      if (f.id === 'samurai') {
        // The guard doesn't freeze the game: it waits for the enemy to attack.
        f.guarding = true;
        setAnim(f, 'special', null, true);
        popup('GUARD!', f.x, GROUND - 50, C.cyan, 40);
        return;
      }
      freeze = f;
      setAnim(f, 'special', null, true);
      popup(SPECIALS[f.id] || 'SPECIAL!', f.x, GROUND - 50, C.cyan, 60);
      sound('special');
    }

    // Glitch's Teleport: vanish, reappear behind the enemy, strike.
    function updateTeleport(f, o) {
      if (f.st === 1) { sparks(f.x, GROUND - 14, 12, [C.purple, C.cyan, C.white]); sound('glitch'); }
      if (f.st === 12) {
        f.x = clamp(o.x - o.facing * 16, WALL_L, WALL_R);
        if (Math.abs(f.x - o.x) < 10) f.x = clamp(o.x + o.facing * 16, WALL_L, WALL_R);
        f.facing = o.x > f.x ? 1 : -1;
        sparks(f.x, GROUND - 14, 12, [C.purple, C.cyan, C.white]);
        shake(2, 8);
      }
      f.hidden = f.st > 4 && f.st < 12 && f.st % 2 === 0;
      if (f.st === 26 && Math.abs(f.x - o.x) < 26) {
        f.specialHit = true;
        sparks(o.x, GROUND - o.y - 16, 14, [C.purple, C.cyan, C.yellow]);
      }
      if (f.animT >= animTotal(f)) {
        freeze = null;
        f.hidden = false;
        toIdle(f);
        if (f.specialHit) landSpecial(f, o);
      }
    }

    // The Dash Kick: everything else freezes while the Ninja flies across the screen.
    function updateSpecial(f, o) {
      if (f.id === 'glitch') { updateTeleport(f, o); return; }
      if (f.id === 'boxer') { updateHaymaker(f, o); return; }
      if (f.id === 'cyborg') { updateRocket(f, o); return; }
      if (f.id === 'samurai') {
        if (f.animT >= animTotal(f)) { f.guarding = false; toIdle(f); }
        return;
      }
      const charge = 10;
      const dashEnd = charge + 21;
      if (f.st < charge) {
        if (f.st % 3 === 0) sparks(f.x, GROUND - 10, 2, [C.cyan, C.white]);
      } else if (f.st < dashEnd) {
        f.x = clamp(f.x + f.facing * 7, WALL_L, WALL_R);
        f.y = 5;
        if (f.st % 2 === 0) ghosts.push({ id: f.rid, pose: f.pose, x: f.x, y: f.y, facing: f.facing, life: 12 });
        if (f.st % 4 === 0) dust(f.x, 2);
        if (!f.specialHit && Math.abs(f.x - o.x) < 14) {
          f.specialHit = true;
          sparks(o.x, GROUND - o.y - 16, 14, [C.cyan, C.white, C.yellow]);
        }
      } else {
        f.y = Math.max(0, f.y - 1);
      }
      if (f.animT >= animTotal(f)) {
        freeze = null;
        f.y = 0;
        toIdle(f);
        if (f.specialHit) landSpecial(f, o);
      }
    }

    function toIdle(f) {
      setState(f, 'idle');
      f.vx = 0;
      setAnim(f, 'idle');
    }

    function toRecover(f, frames) {
      setState(f, 'recover');
      f.recoverT = frames;
      f.vx = 0;
      setAnim(f, 'idle');
    }

    // ---- Movement -----------------------------------------------------------
    function physics(f) {
      f.x += f.vx;
      if (f.y > 0 || f.vy > 0) {
        f.vy -= GRAVITY;
        f.y += f.vy;
        if (f.y <= 0) {
          f.y = 0;
          f.vy = 0;
          return true;
        }
      }
      return false;
    }

    function control(f, o) {
      const i = f.input;
      if (f.duckLock > 0) f.duckLock--;
      const dir = (i.right ? 1 : 0) - (i.left ? 1 : 0);
      const wantDuck = i.down && f.duckLock === 0;

      if (i.pSpecial && f.hasSpecial && f.meter >= 100) { startSpecial(f, o); return; }
      if (wantDuck && (i.pCombo || i.pStrong)) { startLowKick(f); return; }
      if (i.pCombo) { startCombo(f); return; }
      if (i.pStrong) { startStrong(f); return; }
      if (i.up && f.state !== 'duck') {
        setState(f, 'air');
        f.vy = JUMP_V;
        f.y = 1;
        f.vx = dir * f.walk * 1.1;
        setAnim(f, 'rise', null, true);
        if (f.human) sound('jump');
        return;
      }
      if (wantDuck) {
        if (f.state !== 'duck') setState(f, 'duck');
        f.vx = 0;
        f.duckTime++;
        setAnim(f, 'duck');
        if (f.duckTime > DUCK_MAX) {
          // You can only stay ducked for a few seconds.
          f.duckLock = DUCK_LOCK;
          popup('TIRED', f.x, GROUND - 34, C.grey, 40);
          sound('tired');
          toIdle(f);
        }
        return;
      }
      f.duckTime = Math.max(0, f.duckTime - 2);
      if (dir) {
        if (f.state !== 'walk') setState(f, 'walk');
        f.vx = dir * f.walk;
        setAnim(f, 'walk');
      } else {
        if (f.state !== 'idle') setState(f, 'idle');
        f.vx = 0;
        setAnim(f, 'idle');
      }
    }

    function updateFighter(f, o) {
      f.st++;
      if (f.invuln > 0) f.invuln--;
      if (f.comboShowT > 0) f.comboShowT--;
      const i = f.input;

      switch (f.state) {
        case 'idle':
        case 'walk':
        case 'duck':
          control(f, o);
          f.x += f.vx;
          break;
        case 'air': {
          const dir = (i.right ? 1 : 0) - (i.left ? 1 : 0);
          f.vx += (dir * f.walk - f.vx) * 0.05;
          setAnim(f, f.vy > 0 ? 'rise' : 'fall');
          if (physics(f)) { dust(f.x, 4); toIdle(f); }
          break;
        }
        case 'strong': updateStrong(f, o); break;
        case 'combo': updateCombo(f, o); break;
        case 'lowkick': updateLowKick(f, o); break;
        case 'slam': updateSlam(f, o); break;
        case 'special': updateSpecial(f, o); break;
        case 'counter': updateCounter(f, o); break;
        case 'recover':
          if (--f.recoverT <= 0) toIdle(f);
          break;
        case 'hitstun':
          f.x += f.vx;
          f.vx *= 0.82;
          if (--f.stun <= 0) toIdle(f);
          break;
        case 'comboStun':
          // The defender can only escape by ducking between hit 1 and hit 2.
          if (f.soft && i.down && f.duckLock === 0) {
            f.soft = false;
            f.juggle = false;
            setState(f, 'duck');
            setAnim(f, 'duck', null, true);
          } else if (--f.stun <= 0) {
            f.juggle = false;
            if (f.y > 0) launch(f, o, 0.5, 0.5); else toIdle(f);
          }
          break;
        case 'launched':
          if (physics(f)) {
            dust(f.x, 6);
            if (f.slammed) {
              f.slammed = false;
              f.vy = 1.6;
              f.y = 1;
              shake(3, 8);
            } else {
              f.tripped = false;
              setState(f, f.hp <= 0 ? 'ko' : 'down');
              f.vx = 0;
              setAnim(f, 'down', null, true);
            }
          }
          break;
        case 'down':
          if (f.st > 40) {
            setState(f, 'getup');
            setAnim(f, 'getup', null, true);
          }
          break;
        case 'getup':
          if (f.animT >= animTotal(f)) { f.invuln = 20; toIdle(f); }
          break;
        case 'convert':
          if (f.st > 90) setState(f, 'sleep');
          break;
        case 'sleep':
          if (f.st % 50 === 1) popup('z', f.x + 6, GROUND - 14, C.white, 70);
          break;
        default:
          break;
      }
      f.x = clamp(f.x, WALL_L, WALL_R);
      stepAnim(f);
    }

    // Fighters can't walk through each other.
    function pushApart() {
      if (player.y > 2 || bot.y > 2) return;
      if ([player, bot].some((f) => ['special', 'launched', 'down', 'ko', 'sleep', 'convert'].includes(f.state))) return;
      const dx = bot.x - player.x;
      const min = 12;
      if (Math.abs(dx) < min) {
        const push = (min - Math.abs(dx)) / 2;
        const s = dx >= 0 ? 1 : -1;
        player.x = clamp(player.x - s * push, WALL_L, WALL_R);
        bot.x = clamp(bot.x + s * push, WALL_L, WALL_R);
      }
    }

    function faceEachOther() {
      for (const f of fighters) {
        if (['idle', 'walk', 'duck'].includes(f.state) && f.y === 0) {
          const o = other(f);
          if (Math.abs(o.x - f.x) > 1) f.facing = o.x > f.x ? 1 : -1;
        }
      }
    }

    // ---- Computer opponent ----------------------------------------------------
    function think(b, p) {
      const level = b.aiCfg;
      const i = blankInput();
      const ai = b.ai;
      const dist = Math.abs(p.x - b.x);
      const toward = p.x > b.x ? 'right' : 'left';
      const away = p.x > b.x ? 'left' : 'right';

      // Pressing on its own combo timing bar.
      const bar = b.combo?.phase === 'bar' ? b.combo : b.slam;
      if (bar) {
        if (bar.aiPress == null) {
          let at;
          if (rand() < level.success) at = rand() < level.perfect ? 0.72 : rand() < 0.5 ? 0.58 : 0.86;
          else at = rand() < 0.5 ? 0.3 : 2;
          bar.aiPress = Math.round(at * bar.D);
        }
        if (bar.t === bar.aiPress) i.pCombo = true;
        return i;
      }

      // Breaking the player's combo by ducking after hit 1.
      if (b.state === 'comboStun') {
        if (b.soft) {
          if (ai.breakFor !== p.attackId) { ai.breakFor = p.attackId; ai.willBreak = rand() < level.duckBreak; }
          if (ai.willBreak && p.combo?.t > 6) i.down = true;
        }
        return i;
      }

      if (!['idle', 'walk', 'duck'].includes(b.state)) return i;

      // Dodges: jump over low kicks, duck under high attacks.
      if (ai.reactFor !== p.attackId && dist < 34 && p.st < 3) {
        if (p.state === 'lowkick') {
          ai.reactFor = p.attackId;
          if (rand() < level.jumpLow) { i.up = true; return i; }
        } else if (p.state === 'strong' || (p.state === 'combo' && p.combo?.n === 1)) {
          ai.reactFor = p.attackId;
          if (rand() < level.duckHigh) ai.duckT = 26;
        }
      }
      if (ai.duckT > 0) { ai.duckT--; i.down = true; return i; }
      if (ai.waitT > 0) { ai.waitT--; return i; }

      ai.cool--;
      if (dist > 19) {
        i[toward] = true;
        if (difficulty === 'easy' && rand() < 0.01) ai.waitT = 40;
        return i;
      }
      if (b.hasSpecial && b.meter >= 100 && hittable(p)) {
        const attacking = ['strong', 'combo', 'lowkick'].includes(p.state) && p.st < 4;
        const use = b.id === 'samurai' ? attacking && dist < 40
          : b.id === 'boxer' ? dist < 36 && rand() < 0.05
            : b.id === 'cyborg' ? dist > 30 && rand() < 0.03
              : dist < 90 && rand() < 0.03;
        if (use) { i.pSpecial = true; return i; }
      }
      if (ai.cool <= 0 && hittable(p)) {
        if (rand() < level.low) { i.down = true; i.pCombo = true; }
        else if (rand() < level.combo) i.pCombo = true;
        else i.pStrong = true;
        ai.cool = pick(level.cooldown);
        return i;
      }
      if (dist < 13 && rand() < 0.3) i[away] = true;
      return i;
    }

    // ---- Player input ---------------------------------------------------------
    const held = new Set();
    const pressed = new Set();

    function readPlayer(side = 0) {
      const i = blankInput();
      const k = (a) => `${side}:${a}`;
      i.left = held.has(k('left'));
      i.right = held.has(k('right'));
      i.up = held.has(k('up'));
      i.down = held.has(k('down'));
      i.pCombo = pressed.has(k('combo'));
      i.pStrong = pressed.has(k('strong'));
      i.pSpecial = pressed.has(k('special'));
      return i;
    }

    function keyAction(key) {
      if (twoPlayer) {
        const m = KEYMAP_2P[key];
        return m ? `${m[0]}:${m[1]}` : null;
      }
      return KEYMAP[key] ? `0:${KEYMAP[key]}` : null;
    }

    // ---- Round flow -----------------------------------------------------------
    // Phases: enter (next bot walks in), intro, fight, ko, time, result.
    let phase = 'intro';
    let phaseT = 0;
    let timeLeft = fullTime();
    let freeze = null;
    let paused = false;
    let winner = null;
    let menu = null; // { items: [...], selected }
    let frame = 0;
    let aiOn = true;
    let enemyIndex = 0;
    let round = 1;
    const wins = { player: 0, bot: 0 };
    let decisive = true; // does this KO end the match (so the bot turns back into a person)?
    let firstIntro = true;
    let barsSeen = 0;

    function setPhase(p) {
      phase = p;
      phaseT = 0;
    }

    function openMenu(items) {
      menu = { items, selected: 0 };
    }

    function result(title, color, lines, items) {
      setPhase('result');
      sound(winner === player || (twoPlayer && winner) ? 'win' : 'lose');
      resultInfo = { title, color, lines };
      openMenu(items);
    }
    let resultInfo = null;

    function resetFighter(f, x, facing) {
      Object.assign(f, {
        x, y: 0, vx: 0, vy: 0, facing, state: 'idle', st: 0, combo: null, slam: null,
        soft: false, juggle: false, stun: 0, invuln: 0, duckTime: 0, duckLock: 0, comboShowT: 0,
      });
      setAnim(f, 'idle', null, true);
    }

    // The round is over: decide what happens next for each mode.
    function endOfRound() {
      const won = winner === player;
      if (isQuick) {
        const items = [
          { label: 'FIGHT AGAIN', action: () => onExit('again') },
          { label: 'NEW FIGHTERS', action: () => onExit('select') },
          { label: 'MENU', action: () => onExit('menu') },
        ];
        if (twoPlayer) {
          result(!winner ? 'DRAW' : `PLAYER ${winner === player ? 1 : 2} WINS!`, C.yellow,
            [!winner ? 'NOBODY WON THIS ONE.' : `${winner.name} TAKES IT.`], items);
        } else {
          const lines = !winner ? ['NOBODY WON THIS ONE.']
            : won ? (bot.isBot ? ['THE BOT TURNED BACK INTO A PERSON.', 'THEY ARE FAST ASLEEP.'] : [`YOU BEAT ${bot.name}.`])
            : [`${bot.name} GOT YOU THIS TIME.`];
          result(!winner ? 'DRAW' : won ? 'YOU WIN!' : 'YOU LOSE', won ? C.yellow : C.white, lines, items);
        }
        return;
      }
      if (isLevel) {
        if (!won) {
          result('YOU LOSE', C.white, [`THE BOTS STOPPED YOU ON ${label}.`, 'RESTART THE LEVEL TO TRY AGAIN.'],
            [{ label: 'RESTART LEVEL', action: () => onExit('again') }, { label: 'MAP', action: () => onExit('map') }]);
        } else if (enemyIndex < enemiesTotal - 1) {
          nextEnemy();
        } else {
          onLevelClear?.(mode.node ?? mode.level);
          const lines = mode.clearLines || [`ALL ${enemiesTotal} BOTS ARE PEOPLE AGAIN.`, 'YOUR HEALTH REFILLS FOR THE NEXT LEVEL.'];
          result(`${label} CLEAR!`, C.yellow, lines,
            [{ label: 'CONTINUE', action: () => onExit('next') }, { label: 'MAP', action: () => onExit('map') }]);
        }
        return;
      }
      // Boss: best of 3 rounds.
      if (won) wins.player++; else if (winner) wins.bot++;
      if (wins.player >= BOSS_ROUNDS_TO_WIN) {
        onLevelClear?.(mode.node ?? 6);
        result(mode.clearTitle || 'BOSS BEATEN!', C.yellow, mode.clearLines || ['THE BOT BRUTE IS A PERSON AGAIN.', 'THE GRASSY FIELDS ARE CLEAR!'],
          mode.finale ? [{ label: 'CONTINUE', action: () => onExit('ending') }]
            : [{ label: 'CONTINUE', action: () => onExit('next') }, { label: 'MAP', action: () => onExit('map') }]);
      } else if (wins.bot >= BOSS_ROUNDS_TO_WIN) {
        result('YOU LOSE', C.white, [`${bot.name} WON 2 ROUNDS.`, 'TRY THE BOSS AGAIN.'],
          [{ label: 'TRY AGAIN', action: () => onExit('again') }, { label: 'MAP', action: () => onExit('map') }]);
      } else {
        nextRound();
      }
    }

    // Main Mode: the next bot walks in. Your health carries over.
    function nextEnemy() {
      sleepers.push({ x: bot.x, facing: bot.facing, shirt: bot.shirt });
      enemyIndex++;
      const fromRight = player.x < W / 2;
      bot = makeFighter('bot', 1);
      bot.x = fromRight ? WALL_R : WALL_L;
      bot.facing = fromRight ? -1 : 1;
      fighters = [player, bot];
      resetFighter(player, player.x, fromRight ? 1 : -1);
      player.comboCount = 0;
      timeLeft = fullTime();
      winner = null;
      decisive = true;
      setPhase('enter');
      startTrack();
    }

    // Boss: refill both health bars and start the next round.
    function nextRound() {
      round++;
      for (const f of fighters) { f.hp = HP; f.trailHp = HP; }
      resetFighter(player, 84, 1);
      resetFighter(bot, 172, -1);
      timeLeft = fullTime();
      winner = null;
      setPhase('intro');
      startTrack();
    }

    function update() {
      frame++;
      if (paused) { pressed.clear(); return; }

      // Effects keep moving even during hitstop and freeze.
      for (const p of particles) { p.x += p.vx; p.y += p.vy; p.vy += p.g; p.life--; }
      for (let k = particles.length - 1; k >= 0; k--) if (particles[k].life <= 0) particles.splice(k, 1);
      for (const p of popups) p.t++;
      for (let k = popups.length - 1; k >= 0; k--) if (popups[k].t >= popups[k].life) popups.splice(k, 1);
      for (const g of ghosts) g.life--;
      for (let k = ghosts.length - 1; k >= 0; k--) if (ghosts[k].life <= 0) ghosts.splice(k, 1);
      if (shakeT > 0) shakeT--; else shakeMag = 0;
      for (const f of fighters) if (f.trailHp > f.hp) f.trailHp = Math.max(f.hp, f.trailHp - 4);
      if (frame % 60 === 0) sleepers.forEach((z, k) => { if ((frame / 60 + k) % 2 === 0) popup('z', z.x + 6 * (z.facing === -1 ? -1 : 1), GROUND - 12, C.white, 70); });

      if (hitstop > 0) { hitstop--; pressed.clear(); return; }

      phaseT++;
      const live = phase === 'fight';
      player.input = live ? readPlayer(0) : blankInput();
      bot.input = !live ? blankInput() : twoPlayer ? readPlayer(1) : aiOn ? think(bot, player) : blankInput();
      if (phase === 'enter') {
        // The next bot walks in from the edge of the field.
        bot.input[player.x > bot.x ? 'right' : 'left'] = Math.abs(player.x - bot.x) > 60;
      }
      pressed.clear();

      if (freeze) {
        // Only the fighter doing the special moves.
        updateFighter(freeze, other(freeze));
        return;
      }

      updateFighter(player, bot);
      updateFighter(bot, player);
      if (glitchy && live && bot.isBot) bot.tpT = (bot.tpT ?? 200) - 1;
      if (glitchy && live && bot.isBot && ['idle', 'walk'].includes(bot.state) && hittable(player)) {
        if (bot.tpT <= 0) {
          bot.teleports = (bot.teleports || 0) + 1;
          sparks(bot.x, GROUND - 14, 10, [C.purple, C.cyan, C.white]);
          bot.x = clamp(player.x - player.facing * 16, WALL_L, WALL_R);
          bot.facing = player.x > bot.x ? 1 : -1;
          sparks(bot.x, GROUND - 14, 10, [C.purple, C.cyan, C.white]);
          glitchBurst = 10;
          sound('glitch');
          bot.tpT = 200 + Math.floor(rand() * 220);
        }
      }
      pushApart();
      faceEachOther();

      if (phase === 'enter' && (Math.abs(player.x - bot.x) <= 62 || phaseT > 150)) setPhase('intro');
      if (phase === 'intro' && phaseT > (firstIntro ? 100 : 70)) { firstIntro = false; setPhase('fight'); }
      if (phase === 'fight') {
        timeLeft--;
        if (player.hp <= 0 || bot.hp <= 0) {
          winner = player.hp > 0 ? player : bot.hp > 0 ? bot : null;
          decisive = !isBoss || (winner === player && wins.player + 1 >= BOSS_ROUNDS_TO_WIN);
          setPhase('ko');
          window.SHAudio?.stopMusic(1.2);
          sound('ko');
        } else if (timeLeft <= 0) {
          winner = player.hp > bot.hp ? player : bot.hp > player.hp ? bot : null;
          decisive = !isBoss || (winner === player && wins.player + 1 >= BOSS_ROUNDS_TO_WIN);
          setPhase('time');
          window.SHAudio?.stopMusic(1.2);
        }
      }
      if (phase === 'ko' || phase === 'time') {
        if (phaseT === 70 && winner) {
          const w = winner;
          if (w.y === 0 && !['launched', 'down', 'ko'].includes(w.state)) {
            w.combo = null;
            setState(w, 'victory');
            setAnim(w, w.isBot ? 'idle' : 'victory', null, true);
          }
        }
        // A beaten bot slowly turns back into a person, asleep.
        if (decisive && bot.isBot && phaseT >= 80 && winner === player && bot.state === 'ko') { setState(bot, 'convert'); sound('collapse'); }
        if (decisive && bot.isBot && phase === 'time' && phaseT === 80 && winner === player && bot.state !== 'ko') {
          setState(bot, 'convert');
          sound('collapse');
          bot.pose = poseFor('down');
          bot.anim = null;
        }
        if (phaseT === 180) endOfRound();
      }
    }

    // ---- Drawing ----------------------------------------------------------------
    const stage = document.createElement('canvas');
    stage.width = W;
    stage.height = H;
    const stageId = mode.stage || 'grassy';
    buildStage(stage.getContext('2d'), stageId);

    function buildStage(g, id) {
      if (id === 'dojo') buildDojo(g);
      else if (id === 'temple') buildTemple(g);
      else buildFields(g, id === 'dusk');
    }

    // The Grassy Fields, with the Ninja's small temple on the hill.
    // The finale's "dusk" version has a red evening sky and darker grass.
    function buildFields(g, dusk) {
      const bands = dusk ? ['#1a1c2c', '#29366f', '#5d275d', '#b13e53', '#ef7d57', '#ffcd75']
        : ['#41a6f6', '#41a6f6', '#52b6f6', '#63c6f6', '#73d6f6', '#73eff7'];
      bands.forEach((col, k) => { g.fillStyle = col; g.fillRect(0, k * 14, W, 14); });
      if (dusk) {
        // A big red moon over the fields.
        g.fillStyle = '#ef7d57';
        for (let y = -9; y <= 9; y++) for (let x = -9; x <= 9; x++) if (x * x + y * y <= 81) g.fillRect(60 + x, 30 + y, 1, 1);
        g.fillStyle = '#b13e53'; g.fillRect(55, 27, 3, 2); g.fillRect(63, 33, 2, 2);
      }
      // Far hills.
      g.fillStyle = dusk ? '#29366f' : C.darkGreen;
      for (let x = 0; x < W; x++) {
        const h = 22 + Math.round(Math.sin(x / 23) * 6 + Math.sin(x / 9) * 2);
        g.fillRect(x, 84 - h + 22, 1, h + 10);
      }
      // The temple on the right hill.
      const tx = 188;
      const ty = 66;
      g.fillStyle = C.night; g.fillRect(tx - 1, ty + 6, 30, 2);
      g.fillStyle = C.white; g.fillRect(tx + 2, ty + 8, 24, 14);
      g.fillStyle = C.red;
      [tx + 2, tx + 10, tx + 17, tx + 24].forEach((px) => g.fillRect(px, ty + 8, 2, 14));
      g.fillStyle = C.night; g.fillRect(tx + 12, ty + 14, 4, 8);
      g.fillStyle = C.dark;
      g.fillRect(tx - 3, ty + 4, 34, 3);
      g.fillRect(tx + 1, ty + 1, 26, 3);
      g.fillRect(tx + 6, ty - 2, 16, 3);
      g.fillStyle = C.night;
      g.fillRect(tx - 4, ty + 3, 2, 2); g.fillRect(tx + 30, ty + 3, 2, 2);
      g.fillRect(tx + 13, ty - 4, 2, 2);
      g.fillStyle = C.dark; g.fillRect(tx - 2, ty + 22, 32, 2);
      // Near hills.
      g.fillStyle = dusk ? C.darkGreen : C.green;
      for (let x = 0; x < W; x++) {
        const h = 14 + Math.round(Math.sin(x / 31 + 1) * 5);
        g.fillRect(x, GROUND - h, 1, h);
      }
      // Ground: grass on top of dirt.
      g.fillStyle = dusk ? C.darkGreen : C.green; g.fillRect(0, GROUND, W, 4);
      g.fillStyle = dusk ? C.green : '#a7f070';
      for (let x = 0; x < W; x += 7) g.fillRect(x + (x % 3), GROUND, 2, 1);
      g.fillStyle = dusk ? C.dark : C.darkGreen; g.fillRect(0, GROUND + 4, W, 6);
      g.fillStyle = C.dark;
      for (let x = 3; x < W; x += 11) g.fillRect(x, GROUND + 6 + (x % 3), 2, 2);
      // Flowers in the grass.
      [[30, C.yellow], [70, C.white], [140, C.yellow], [214, C.white], [238, C.red]].forEach(([x, col]) => {
        g.fillStyle = col; g.fillRect(x, GROUND - 2, 2, 2);
      });
    }

    // The Dojo: wooden walls, paper screens, a red banner and a plank floor.
    function buildDojo(g) {
      g.fillStyle = '#5a3a26'; g.fillRect(0, 0, W, GROUND);
      // Paper screens between wooden posts.
      for (let x = 6; x < W; x += 50) {
        g.fillStyle = '#f4e4c1'; g.fillRect(x, 22, 40, 66);
        g.fillStyle = '#c9b48e';
        for (let k = 1; k < 4; k++) g.fillRect(x + k * 10, 22, 1, 66);
        for (let k = 1; k < 6; k++) g.fillRect(x, 22 + k * 11, 40, 1);
        g.fillStyle = '#3b2416'; g.fillRect(x - 3, 16, 3, GROUND - 16); g.fillRect(x + 40, 16, 3, GROUND - 16);
      }
      // Ceiling beam and a red banner with a white circle.
      g.fillStyle = '#3b2416'; g.fillRect(0, 12, W, 6);
      g.fillStyle = C.red; g.fillRect(114, 18, 28, 40);
      g.fillStyle = '#5d275d'; g.fillRect(114, 56, 28, 2);
      g.fillStyle = C.white;
      for (let y = -6; y <= 6; y++) for (let x = -6; x <= 6; x++) if (x * x + y * y <= 36 && x * x + y * y >= 12) g.fillRect(128 + x, 36 + y, 1, 1);
      // Weapon rack and a low wall rail.
      g.fillStyle = '#3b2416'; g.fillRect(0, 92, W, 3);
      g.fillStyle = '#a0632c'; g.fillRect(0, 95, W, GROUND - 95);
      // Plank floor.
      g.fillStyle = '#a0632c'; g.fillRect(0, GROUND, W, 10);
      g.fillStyle = '#7a4a2a';
      g.fillRect(0, GROUND, W, 1); g.fillRect(0, GROUND + 5, W, 1);
      for (let x = 0; x < W; x += 24) { g.fillRect(x, GROUND + 1, 1, 4); g.fillRect(x + 12, GROUND + 6, 1, 4); }
    }

    // The Cherry Blossom Temple: a pink sunset, blossom trees and a red gate.
    function buildTemple(g) {
      const bands = ['#5d275d', '#b13e53', '#ef7d57', '#f4a0a0', '#ffcd75', '#ffe6b0'];
      bands.forEach((col, k) => { g.fillStyle = col; g.fillRect(0, k * 14, W, 14); });
      // Purple mountains.
      g.fillStyle = '#5d275d';
      for (let x = 0; x < W; x++) {
        const h = 26 + Math.round(Math.abs(Math.sin(x / 40)) * 22);
        g.fillRect(x, 92 - h, 1, h + 20);
      }
      // The temple roof up on the hill.
      const tx = 150;
      g.fillStyle = C.night; g.fillRect(tx - 6, 54, 56, 4); g.fillRect(tx, 48, 44, 4); g.fillRect(tx + 10, 43, 24, 4);
      g.fillStyle = C.red; [tx + 2, tx + 14, tx + 28, tx + 40].forEach((px) => g.fillRect(px, 58, 3, 30));
      g.fillStyle = '#f4e4c1'; g.fillRect(tx + 5, 60, 9, 26); g.fillRect(tx + 17, 60, 11, 26); g.fillRect(tx + 31, 60, 9, 26);
      // Red torii gate on the left.
      g.fillStyle = C.red; g.fillRect(14, 50, 52, 4); g.fillRect(20, 58, 40, 3); g.fillRect(24, 54, 4, GROUND - 54); g.fillRect(52, 54, 4, GROUND - 54);
      g.fillStyle = C.night; g.fillRect(12, 48, 56, 2);
      // Blossom trees.
      [[96, 70], [222, 66], [6, 80]].forEach(([x, y]) => {
        g.fillStyle = '#5a3a26'; g.fillRect(x + 8, y, 4, GROUND - y);
        for (const [dx, dy, r] of [[0, 0, 9], [12, -4, 10], [22, 2, 8], [8, -12, 8]]) {
          for (let yy = -r; yy <= r; yy++) for (let xx = -r; xx <= r; xx++) {
            if (xx * xx + yy * yy > r * r) continue;
            // Speckled blossoms: a little hash picks white, light pink or pink.
            const h = ((x + dx + xx) * 73 + (y + dy + yy) * 151) % 11;
            g.fillStyle = h === 0 ? '#ffffff' : h < 4 ? '#f4a0c8' : yy > r / 2 ? '#e070a8' : '#ff8fc0';
            g.fillRect(x + dx + xx, y - 6 + dy + yy, 1, 1);
          }
        }
      });
      // Stone path.
      g.fillStyle = '#94b0c2'; g.fillRect(0, GROUND, W, 10);
      g.fillStyle = '#566c86';
      g.fillRect(0, GROUND, W, 1);
      for (let x = 0; x < W; x += 18) { g.fillRect(x, GROUND + 1, 1, 9); g.fillRect(x + 9, GROUND + 5, 1, 1); }
    }

    const clouds = [[20, 14, 26], [110, 24, 18], [180, 10, 30]];
    const petals = Array.from({ length: 22 }, (_, k) => ({ x: (k * 47) % W, y: (k * 29) % GROUND, s: 0.2 + (k % 5) * 0.08 }));

    // Moving things in the background of each stage.
    function drawAmbient() {
      if (stageId === 'grassy' || stageId === 'dusk') {
        ctx.fillStyle = stageId === 'dusk' ? '#5d275d' : C.white;
        for (const c of clouds) {
          const x = ((c[0] + frame * 0.05) % (W + 40)) - 40;
          ctx.fillRect(Math.round(x), c[1], c[2], 4);
          ctx.fillRect(Math.round(x) + 4, c[1] - 3, c[2] - 10, 3);
        }
      }
      if (stageId === 'dusk') {
        // Embers drifting up.
        ctx.fillStyle = C.orange;
        for (const p of petals) ctx.fillRect(Math.round((p.x + Math.sin(frame / 40 + p.y) * 6 + W) % W), Math.round(GROUND - ((p.y + frame * p.s) % GROUND)), 1, 1);
      }
      if (stageId === 'temple') {
        // Petals falling.
        for (const p of petals) {
          const x = Math.round((p.x + frame * p.s * 0.6 + Math.sin(frame / 30 + p.y) * 4) % W);
          const y = Math.round((p.y + frame * p.s) % GROUND);
          ctx.fillStyle = (p.x + p.y) % 2 ? '#ff8fc0' : C.white;
          ctx.fillRect(x, y, 2, 1);
        }
      }
      if (stageId === 'dojo') {
        // Hanging lanterns that flicker a little.
        [[40, 26], [216, 26]].forEach(([x, y], k) => {
          const on = (frame + k * 17) % 90 > 3;
          ctx.fillStyle = C.night; ctx.fillRect(x + 2, 18, 1, y - 18);
          ctx.fillStyle = on ? C.orange : C.red; ctx.fillRect(x, y, 6, 8);
          ctx.fillStyle = on ? C.yellow : C.orange; ctx.fillRect(x + 1, y + 2, 4, 4);
        });
      }
    }

    // Glitch Mode: flickering colors and screen tearing.
    let glitchBurst = 0;
    function drawGlitch() {
      if (!glitchy) return;
      if (frame % 150 === 0) glitchBurst = 16;
      if (glitchBurst > 0) glitchBurst--;
      glitchFx(ctx, glitchBurst > 0 ? 0.8 : 0.12);
    }

    function drawFighter(f) {
      const sx = f.x;
      const sy = GROUND - f.y;
      // Shadow.
      const sw = Math.max(4, 12 - f.y / 4);
      ctx.fillStyle = 'rgba(26, 28, 44, 0.35)';
      ctx.fillRect(Math.round(f.x - sw / 2), GROUND - 1, Math.round(sw), 2);
      const flip = f.facing === -1;
      if (f.isBot && (f.state === 'convert' || f.state === 'sleep')) {
        const t = f.state === 'sleep' ? 1 : Math.min(1, f.st / 90);
        const lying = { ...poseFor('down'), face: 'sleep' };
        if (t < 1) drawPose(ctx, f.rid, poseFor('down'), sx, sy, { flip, alpha: 1 - t });
        // Bosses turn back into themselves; ordinary bots into a person.
        drawPose(ctx, f.botForm ? f.id : `person-${f.shirt}`, lying, sx, sy, { flip, alpha: t });
        return;
      }
      if (f.hidden) return;
      const blink = f.invuln > 0 && Math.floor(f.invuln / 3) % 2;
      drawPose(ctx, f.rid, f.pose, sx, sy, { flip, alpha: blink ? 0.5 : 1 });
      if (f.fist) {
        // The flying rocket fist.
        const fx = Math.round(f.fist.x);
        const fy = Math.round(GROUND - f.fist.y);
        ctx.fillStyle = C.night; ctx.fillRect(fx - 3, fy - 3, 6, 6);
        ctx.fillStyle = C.grey; ctx.fillRect(fx - 2, fy - 2, 4, 4);
        ctx.fillStyle = C.white; ctx.fillRect(fx - 2, fy - 2, 2, 1);
        ctx.fillStyle = frame % 4 < 2 ? C.orange : C.yellow;
        ctx.fillRect(fx - f.fist.dir * 5 - 1, fy - 1, 3, 2);
      }
    }

    function drawBar(f, bar, label) {
      const bw = 42;
      const bx = clamp(Math.round(f.x - bw / 2), 2, W - bw - 2);
      const by = Math.max(24, Math.round(GROUND - f.y - 42));
      if (bar.t === 1 && bar.counted !== true) { bar.counted = true; barsSeen++; }
      if (label) textC(label, bx + bw / 2, by - 10, C.white);
      ctx.fillStyle = C.night;
      ctx.fillRect(bx - 1, by - 1, bw + 2, 7);
      ctx.fillStyle = C.red; ctx.fillRect(bx, by, bw, 5);
      ctx.fillStyle = C.green;
      ctx.fillRect(bx + Math.round(bw * ZONE.greenFrom), by, Math.round(bw * (ZONE.greenTo - ZONE.greenFrom)), 5);
      ctx.fillStyle = C.yellow;
      ctx.fillRect(bx + Math.round(bw * ZONE.perfectFrom), by, Math.max(2, Math.round(bw * (ZONE.perfectTo - ZONE.perfectFrom))), 5);
      const mx = bx + Math.round(Math.min(1, bar.t / bar.D) * (bw - 1));
      ctx.fillStyle = C.night; ctx.fillRect(mx - 1, by - 3, 3, 11);
      ctx.fillStyle = C.white; ctx.fillRect(mx, by - 2, 1, 9);
    }

    function textC(str, cx, y, color, scale = 1, shadow = C.night) {
      const x = Math.round(cx - textWidth(str, scale) / 2);
      if (shadow) drawText(str, x + scale, y + scale, shadow, scale);
      drawText(str, x, y, color, scale);
    }

    function drawHud() {
      // Top: names and where you are.
      ctx.fillStyle = C.night;
      ctx.fillRect(0, 0, W, 12);
      drawText(player.name, 5, 4, C.night); drawText(player.name, 4, 3, player.team);
      const bn = !isQuick ? bot.name : twoPlayer ? `P2 ${bot.name}` : `CPU ${bot.name}`;
      drawText(bn, W - 4 - textWidth(bn) + 1, 4, C.night); drawText(bn, W - 4 - textWidth(bn), 3, C.white);
      const where = isLevel ? `${label}  ENEMY ${enemyIndex + 1}/${enemiesTotal}` : isBoss ? `${label}  ROUND ${round}`
        : twoPlayer ? 'QUICK FIGHT' : `QUICK  ${difficulty.toUpperCase()}`;
      textC(where, W / 2, 3, C.yellow);
      if (isBoss) {
        // Round wins: one pip per round won.
        for (let k = 0; k < BOSS_ROUNDS_TO_WIN; k++) {
          ctx.fillStyle = k < wins.player ? C.yellow : C.dark;
          ctx.fillRect(4 + textWidth(player.name) + 4 + k * 6, 4, 4, 4);
          ctx.fillStyle = k < wins.bot ? C.yellow : C.dark;
          ctx.fillRect(W - 4 - textWidth(bn) - 8 - k * 6, 4, 4, 4);
        }
      }

      // Bottom panel: health, special meter and timer.
      ctx.fillStyle = C.night;
      ctx.fillRect(0, GROUND + 10, W, H - GROUND - 10);
      drawHealth(player, 6, false);
      drawHealth(bot, W - 6 - 104, true);
      ctx.fillStyle = C.dark; ctx.fillRect(W / 2 - 14, 123, 28, 17);
      const secs = noLimit ? '--' : Math.max(0, Math.ceil(timeLeft / FPS));
      if (noLimit) drawInfinity(W / 2, 131);
      else textC(String(secs), W / 2, 125, secs <= 10 && frame % 30 < 15 ? C.red : C.white, 2, null);

      // Combo counter on the attacker's side.
      for (const f of fighters) {
        if (f.comboShowT > 0 && f.comboCount >= 2) {
          const label = `${f.comboCount} HITS!`;
          const x = f.side === 0 ? 6 : W - 6 - textWidth(label, 2);
          drawText(label, x + 1, 31, C.night, 2);
          drawText(label, x, 30, f.comboCount >= COMBO_MAX ? C.yellow : C.white, 2);
        }
      }
    }

    function drawInfinity(cx, cy) {
      ctx.fillStyle = C.white;
      for (let a = 0; a < Math.PI * 2; a += 0.08) {
        const x = Math.sin(a) * 9;
        const y = Math.sin(a * 2) * 3.5;
        ctx.fillRect(Math.round(cx + x - 1), Math.round(cy + y - 1), 2, 2);
      }
    }

    function drawHealth(f, x, mirror) {
      const w = 104;
      const y = 123;
      ctx.fillStyle = C.black || C.night; ctx.fillRect(x - 1, y - 1, w + 2, 8);
      ctx.fillStyle = C.purple; ctx.fillRect(x, y, w, 6);
      const trail = Math.round((f.trailHp / HP) * w);
      const fill = Math.round((f.hp / HP) * w);
      const pct = f.hp / HP;
      ctx.fillStyle = C.white;
      ctx.fillRect(mirror ? x + w - trail : x, y, trail, 6);
      ctx.fillStyle = pct > 0.5 ? C.green : pct > 0.25 ? C.yellow : C.red;
      ctx.fillRect(mirror ? x + w - fill : x, y, fill, 6);
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.fillRect(mirror ? x + w - fill : x, y, fill, 1);
      if (!f.hasSpecial) return;
      // Special meter under the health bar.
      const my = 131;
      const full = f.meter >= 100;
      ctx.fillStyle = C.dark; ctx.fillRect(x, my, w, 4);
      ctx.fillStyle = full ? (frame % 20 < 10 ? C.yellow : C.cyan) : C.cyan;
      const mw = Math.round((f.meter / 100) * w);
      ctx.fillRect(mirror ? x + w - mw : x, my, mw, 4);
      if (full && f.human && frame % 40 < 28) {
        const key = twoPlayer ? (f.side === 0 ? 'H' : '/') : 'M';
        const label = `SPECIAL READY: ${key}`;
        drawText(label, mirror ? x + w - textWidth(label) : x, 137, C.yellow);
      }
    }

    function drawMenu(title, titleColor, lines) {
      ctx.fillStyle = 'rgba(26, 28, 44, 0.82)';
      ctx.fillRect(0, 0, W, H);
      textC(title, W / 2, 22, titleColor, 2, C.red);
      lines.forEach((l, k) => textC(l, W / 2, 44 + k * 10, C.grey, 1, null));
      const by = 44 + lines.length * 10 + 8;
      menu.items.forEach((it, k) => {
        const bw = 80;
        const bx = W / 2 - bw / 2;
        const y = by + k * 18;
        it.box = { x: bx, y, w: bw, h: 14 };
        const hot = k === menu.selected;
        ctx.fillStyle = C.night; ctx.fillRect(bx - 1, y - 1, bw + 2, 16);
        ctx.fillStyle = hot ? C.orange : C.blue; ctx.fillRect(bx, y, bw, 14);
        ctx.fillStyle = hot ? C.yellow : C.sky; ctx.fillRect(bx, y, bw, 2);
        textC(it.label, W / 2, y + 4, C.white);
      });
    }

    const CONTROL_LINES = twoPlayer ? [
      'P1: WASD  F COMBO  G STRONG  H SPECIAL',
      'P2: ARROWS  , COMBO  . STRONG  / SPECIAL',
      'ESC: PAUSE',
    ] : [
      'A D: MOVE   W: JUMP   S: DUCK',
      'SPACE: COMBO  K: STRONG  M: SPECIAL',
      'OR ARROWS + Z X C',
    ];

    function draw(c) {
      ctx = c;
      ctx.save();
      if (shakeT > 0 && shakeMag > 0) {
        ctx.translate(Math.round((rand() - 0.5) * shakeMag * 2), Math.round((rand() - 0.5) * shakeMag * 2));
      }
      ctx.drawImage(stage, 0, 0);
      drawAmbient();

      for (const z of sleepers) drawPose(ctx, `person-${z.shirt}`, { ...poseFor('down'), face: 'sleep' }, z.x, GROUND, { flip: z.facing === -1 });
      for (const g of ghosts) drawPose(ctx, g.id, g.pose, g.x, GROUND - g.y, { flip: g.facing === -1, alpha: g.life / 24 });
      const order = fighters.slice().sort((a, b) => (['combo', 'strong', 'lowkick', 'slam', 'special'].includes(a.state) ? 1 : 0)
        - (['combo', 'strong', 'lowkick', 'slam', 'special'].includes(b.state) ? 1 : 0));
      order.forEach(drawFighter);

      for (const p of particles) {
        ctx.fillStyle = p.color;
        ctx.fillRect(Math.round(p.x), Math.round(p.y), 1, 1);
      }
      for (const f of fighters) {
        // Only your own timing bar shows; the bot's combo shows as its hit counter.
        const comboKey = twoPlayer ? (f.side === 0 ? 'F' : ',') : 'SPACE';
        if (f.human && f.combo?.phase === 'bar') drawBar(f, f.combo, barsSeen < 6 ? `${comboKey} ON YELLOW` : null);
        if (f.human && f.slam) drawBar(f, f.slam, `SLAM! ${comboKey}`);
        // Duck stamina, only while ducking.
        if (f.state === 'duck' && f.duckTime > 30) {
          const left = 1 - f.duckTime / DUCK_MAX;
          ctx.fillStyle = C.night; ctx.fillRect(Math.round(f.x - 8), GROUND + 3, 16, 3);
          ctx.fillStyle = left > 0.3 ? C.cyan : C.red; ctx.fillRect(Math.round(f.x - 7), GROUND + 4, Math.round(14 * left), 1);
        }
      }
      for (const p of popups) {
        const y = Math.round(p.y - p.t * 0.4);
        if (p.t < p.life - 8 || p.t % 4 < 2) textC(p.text, p.x, y, p.color);
      }
      ctx.restore();

      drawGlitch();
      drawHud();

      if (phase === 'enter') {
        textC(`ENEMY ${enemyIndex + 1} / ${enemiesTotal}`, W / 2, 44, C.white, 2, C.red);
      } else if (phase === 'intro') {
        let top;
        if (isBoss) top = round === 1 ? `BOSS: ${bot.name}` : `ROUND ${round}`;
        else if (isLevel) top = `${label}  ENEMY ${enemyIndex + 1}/${enemiesTotal}`;
        if (firstIntro) {
          ctx.fillStyle = 'rgba(26, 28, 44, 0.7)';
          ctx.fillRect(20, 26, W - 40, 80);
          CONTROL_LINES.forEach((l, k) => textC(l, W / 2, 76 + k * 9, C.white));
        }
        if (top) textC(top, W / 2, 32, C.yellow);
        const big = phaseT < (firstIntro ? 60 : 40);
        textC(big ? 'READY?' : 'FIGHT!', W / 2, 46, big ? C.white : C.yellow, 3, C.red);
      } else if (phase === 'ko' && phaseT < 120) {
        textC('K.O.!', W / 2, 44, C.yellow, 3, C.red);
      } else if (phase === 'time' && phaseT < 120) {
        textC('TIME!', W / 2, 44, C.yellow, 3, C.red);
      } else if (phase === 'result' && resultInfo) {
        drawMenu(resultInfo.title, resultInfo.color, resultInfo.lines);
      }
      if (paused) drawMenu('PAUSED', C.white, CONTROL_LINES);
    }

    // ---- Events from the page ------------------------------------------------
    function menuKey(key) {
      if (!menu) return false;
      if (['arrowdown', 's', 'arrowright', 'd'].includes(key)) { menu.selected = (menu.selected + 1) % menu.items.length; blip(520); }
      else if (['arrowup', 'w', 'arrowleft', 'a'].includes(key)) { menu.selected = (menu.selected - 1 + menu.items.length) % menu.items.length; blip(520); }
      else if (key === 'enter' || key === ' ') { blip(660); menu.items[menu.selected].action(); }
      return true;
    }

    function togglePause() {
      if (phase === 'result') return;
      paused = !paused;
      window.SHAudio?.duck(paused);
      if (paused) {
        openMenu([
          { label: 'RESUME', action: () => { paused = false; menu = null; window.SHAudio?.duck(false); } },
          { label: 'QUIT', action: () => onExit('menu') },
        ]);
      } else {
        menu = null;
      }
      held.clear();
    }

    function keydown(e) {
      const key = e.key.toLowerCase();
      if (key === 'escape' || key === 'p') { togglePause(); return; }
      if ((paused || phase === 'result') && menuKey(key)) return;
      const action = keyAction(key);
      if (!action) return;
      if (!held.has(action)) pressed.add(action);
      held.add(action);
    }

    function keyup(e) {
      const action = keyAction(e.key.toLowerCase());
      if (action) held.delete(action);
    }

    function pointer(type, x, y) {
      if (!menu || (!paused && phase !== 'result')) return false;
      const k = menu.items.findIndex((it) => it.box && x >= it.box.x && x < it.box.x + it.box.w && y >= it.box.y && y < it.box.y + it.box.h);
      if (k >= 0) {
        menu.selected = k;
        if (type === 'up') { blip(660); menu.items[k].action(); }
      }
      return k >= 0;
    }

    // Test hooks: lets automated checks read the fight state.
    const debug = {
      get player() { return player; },
      get bot() { return bot; },
      get phase() { return phase; },
      get timeLeft() { return timeLeft; },
      get freeze() { return freeze; },
      skipIntro() { setPhase('fight'); },
      setTime(s) { timeLeft = s * FPS; },
      setAI(on) { aiOn = on; },
      get enemyIndex() { return enemyIndex; },
      get round() { return round; },
      get wins() { return wins; },
      get sleepers() { return sleepers; },
    };

    startTrack();
    return { update, draw, keydown, keyup, pointer, debug };
  }

  // Screen-tearing glitch effect drawn over whatever is on the canvas.
  function glitchFx(ctx, amount) {
    const cv = ctx.canvas;
    const n = Math.ceil(amount * 8);
    for (let i = 0; i < n; i++) {
      const y = Math.floor(rand() * H);
      const h = 1 + Math.floor(rand() * 8);
      const dx = Math.round((rand() - 0.5) * amount * 36);
      ctx.drawImage(cv, 0, y, W, h, dx, y, W, h);
    }
    if (rand() < amount * 0.6) {
      ctx.fillStyle = rand() < 0.5 ? 'rgba(255, 79, 216, 0.28)' : 'rgba(115, 239, 247, 0.28)';
      ctx.fillRect(0, Math.floor(rand() * H), W, 2 + Math.floor(rand() * 18));
    }
    const blocks = Math.floor(amount * 10);
    for (let i = 0; i < blocks; i++) {
      ctx.fillStyle = ['#ff4fd8', '#73eff7', '#f4f4f4', '#a7f070'][Math.floor(rand() * 4)];
      ctx.fillRect(Math.floor(rand() * W), Math.floor(rand() * H), 2 + Math.floor(rand() * 6), 1 + Math.floor(rand() * 2));
    }
  }

  window.StickFight = { create, AI_LEVELS, glitchFx };
})();
