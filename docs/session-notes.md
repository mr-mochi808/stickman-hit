# Stickman Hit: session notes

> **Update (2026-10-11):** the second design session settled the whole game. See `game-design.md` for the vision and `build-plan.md` for the build order. Where this file disagrees with `game-design.md` (for example "two players, each picking a stickman", ROBOT, 24×24, Triple Jab, the GLITCH unlock, and the open questions), `game-design.md` wins.

A record of what was built and decided in the first design session, so a new session can continue from here. The next session is for talking through the game's concept and mechanics in more detail.

All work is on branch `claude/gallant-hopper-4rtmj7` in `mr-mochi808/stickman-hit`. There is no pull request yet.

## What the game is

- A **1v1 fighting game** with two players, each picking a stickman (like Street Fighter).
- **Pixel-art style.** The screen is a 256×144 canvas on a 16px tile grid, scaled up with crisp pixels. Fighter sprites are 24×24.
- Plain HTML5 canvas and JavaScript. No libraries, no build step. Open `index.html` in a browser to run it.
- **There is no fighting gameplay yet.** Only the menus and the art exist.

## Files

| File | What it is |
|---|---|
| `index.html` | Game page. Loads `characters.js`, then `title.js`. |
| `title.js` | All screens: title, settings, character select, versus. Contains the 5×7 pixel font, 16×16 icons (play, gear, hit spark), buttons, input and the tiny sound blips. |
| `characters.js` | The roster data and sprite renderer. Sprites are not hand-drawn grids: each pose is a set of stick-skeleton joint positions, and each fighter has a "gear" object that draws hats, weapons and effects on top. It exposes `window.CHARACTERS`, `PALETTE`, `POSE_ORDER`, `SPRITE_SIZE` and `drawSprite`. |
| `characters.html` | The character sheet design page, published at https://claude.ai/artifact/LwCeehor4Y5sCkaZuWMhGk (private to the user). Republish it after roster changes. |

## Screens that exist

1. **Title:** "STICKMAN-HIT" logo, Play and Settings buttons, and two pairs of fighters trading hits on the grass.
2. **Settings:** Sound, Music and Screen Shake on/off, saved in localStorage. Only Sound does anything so far.
3. **Character select (after Play):** Player 1 picks, then Player 2. Shows the name, tagline, stat bars and a big walking preview. Esc or Back undoes the last pick.
4. **Versus:** the two picked fighters face off with "GAME COMING SOON".

Controls: arrow keys or WASD to move, Enter or Space to choose, Esc to go back. Mouse and touch also work.

## The roster (draft)

Each fighter has 7 poses: idle, walk1, walk2, jump, attack, hit, victory. All stats add up to **12 points** so nobody is simply better.

| Fighter | Look / gear | Role | POW/SPD/RCH/DEF | Special |
|---|---|---|---|---|
| BOXER | Red headband, gloves, boxing shorts | All-rounder, easiest to learn | 3/4/2/3 | Triple Jab: 3 fast punches, the last knocks back |
| NINJA | Blue hood, long scarf, wrist wraps | Speedster, lowest health | 2/5/4/1 | Dash Kick: flying kick across the screen that goes through punches |
| SAMURAI | Topknot, gold shoulder plate, sash, katana | Swordsman, patient counter-fighter | 4/3/3/2 | Counter Slash: guard stance that blocks a hit and slashes back |
| ROBOT | Metal head with glowing visor, antenna, rocket fist | Tank, slow with heavy armor | 4/2/2/4 | Rocket Punch: fires its fist across the screen, then it flies back |
| GLITCH (locked) | No gear: corrupted stickman with magenta/cyan split edges, static, a shifted chunk of head | Secret fighter, hits from odd angles | 3/4/3/2 | Teleport: vanishes and reappears behind the opponent; has a cooldown |

Matchup circle: BOXER beats SAMURAI, SAMURAI beats ROBOT, ROBOT beats NINJA, NINJA beats BOXER.

**GLITCH unlock:** for now, typing `GLITCH` on the character select screen unlocks him (saved in localStorage under `stickman-hit-unlocked`). The idea is to replace this with a real reward later, such as winning 10 fights.

## Decisions the user made

- Fighting game, 1v1.
- Classic stickmen told apart by gear, not fully themed costumes.
- Started with 16×16 sprites, then asked for more detail; chose **24×24**.
- Removed the earlier BONK (hard hat + mallet) and TWIG (cap + staff) and replaced them with **SAMURAI** and **ROBOT**.
- Added **GLITCH** as a locked character whose special move is teleporting.
- **Fighter names are final:** NINJA, BOXER, SAMURAI, CYBORG (renamed from ROBOT) and GLITCH. The user first wanted to pick new names, then decided to keep these (2026-10-15).
- The user asked whether they can publish the game without crediting Claude. Answer given: yes, they own the output; commits carry a Co-Authored-By trailer they can squash away if they want; some stores ask about AI use.

## Open questions for the mechanics talk

These have not been decided yet:

- **Controls:** which keys each player uses on one keyboard, and gamepad support.
- **Health and rounds:** health bar size, best of 3 rounds, round timer.
- **Moves:** what each attack button does, blocking, jumping and crouching, how specials are triggered (button combo? a meter?), cooldowns.
- **What stats mean in numbers:** for example how much damage 1 Power point adds, or how much faster 1 Speed point is.
- **Single player:** a computer opponent, and how smart it is.
- **Stages:** just the sunset grass stage, or more.
- **Progression:** how GLITCH is really unlocked; any other unlockables.
- **Sound and music:** only small button blips exist now.
- **Platform:** browser only, or also a download (for example on itch.io).

## Notes for the next agent

- Check rendered changes with Playwright screenshots. Chromium is preinstalled; run scripts with `NODE_PATH=$(npm root -g) node script.js`. Sprites look best checked on a sky-blue background (`#41a6f6`), because the robot's steel matches the grey `#94b0c2`.
- The user is not technical. Keep explanations short and simple, and ask before making big choices.
