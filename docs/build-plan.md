# Stickman Hit: build plan

Build order for the game described in `game-design.md`. Each step ends with something you can play and check before moving on. Numbers (damage, speeds, timers) are starting points to tune by play-testing.

## Progress

**Steps 1 to 5 are built** and waiting for play-testing. Play → Easy / Normal / Hard → the Grassy Fields map → levels 1-5 (3 bots each) → the Bot Brute boss (best of 3). Quick Fight (one bot) unlocks after level 1.

- Step 5 details: health carries over between the 3 bots and refills each level; bots get a little tougher each level; beaten bots stay on the field asleep; lose = restart that level; progress saves in the browser (`stickman-hit-progress`) the moment a level is cleared. The Bot Brute is a bulky gray bot that hits 35% harder and walks slower.
- After the first session's feedback ("the combo bar only shows sometimes"): the bar only appears when the first Space punch lands. The first punch now reaches a little further, a popup says why it missed (TOO FAR / DUCKED! / JUMPED!), only your own timing bar is shown (the bot's combos show as its hit counter), and the first few bars are labelled "SPACE ON YELLOW".

- All five fighters, plus the gray bot and the sleeping person a bot turns back into, are drawn at 28×28. The fight blends smoothly between poses. ROBOT is renamed CYBORG and the Boxer's special is now Haymaker (in the data; only the Ninja is playable so far).
- Code: `characters.js` (sprites, poses, animations), `fight.js` (the fight, HUD, computer opponent), `title.js` (menus; Play now opens the difficulty screen).
- Extras pulled in early: a beaten bot collapses and fades into a sleeping person (from Step 5), and there's a pause menu (Esc or P).
- Not wired up yet: the character select screen still exists for Quick Fight (Step 9) but Play no longer opens it, and the "type GLITCH" unlock still works there.
- Tuning numbers live at the top of `fight.js` (damage, timing-bar zones and speed, duck limit, meter fill, computer opponent settings per difficulty).

## Step 1: First real fight (built)

The goal is the Ninja fighting one bot on the Grassy Fields.

- Redraw the **Ninja** and a gray **bot** at **28×28**, with idle, walk, jump, duck, and hit frames.
- Moving, jumping, and ducking (ducking runs out after a few seconds).
- **K strong attack** with its own animation.
- HUD: names at the top, health bars and timer at the bottom.
- 1,000 health, 60-second timer, KO, and win / lose screens.
- A very simple computer bot that walks up and attacks.
- Both control layouts (WASD + Space/K/M, arrows + Z/X/C).

## Step 2: Combos (built)

- The **Space combo**, up to 7 hits, with the **timing bar** (Perfect 30 / green 12 / red ends it). The bar gets faster each hit.
- The combo counter on the side, and "PERFECT!" pop-ups.
- Hit 3 launches or knocks back. The final hit has a small animation.
- **Ducking during hit 1 or 2 breaks a combo.**
- The **low kick** (duck + Space/K): trip, launch, slam.
- Effects: hit sparks, dust, and screen shake.

## Step 3: Special moves (built)

- A special meter under each health bar that fills from combos and damage.
- The **freeze effect**: everything stops except the fighter doing the special.
- The Ninja's **Dash Kick**, fast and Fang-like.

## Step 4: A smarter computer (built)

- **Easy / Normal / Hard.**
- Random high and low attacks. Combos on Normal and Hard, and mostly combos on Hard.

## Step 5: Main Mode, Grassy Fields (built)

- The level structure: **3 bots per level**, health carries over between bots and refills between levels.
- **5 levels, then the Bot Brute** (best of 3, 90-second rounds).
- Beaten bots **collapse and fade into sleeping people** who stay on the field.
- A progress screen between levels, a lose screen with "restart level", and automatic saving.
- **Quick Fight unlocks** after level 1.

## Step 6: Dojo and Boxer

- The Dojo stage, Boxer redrawn at 28×28, and the **Haymaker** special.
- Boxer is a bot boss; beating him **unlocks** him.

## Step 7: Cherry Blossom Temple and Samurai

- The Temple stage, Samurai redrawn at 28×28, and **Counter Slash**.
- Samurai is a bot boss; beating him **unlocks** him.

## Step 8: The finale

- Back to the Grassy Fields: 5 levels of tougher bots, then **Cyborg** (rename ROBOT to CYBORG, keep him fully metal, redraw him at 28×28, **Rocket Punch**).
- Ending: everyone wakes up, then the **Glitch teaser** glitches the screen.
- Cyborg unlocks.

## Step 9: Quick Fight and 2 players

- Pick a fighter, stage, difficulty, and timer (60s / 2 min / ∞).
- **2-player mode** on one keyboard (P1: WASD + F/G/H, P2: arrows + , . /).

## Step 10: Sound and music

- 8-bit effects: punch, kick, Perfect ding, miss buzz, special charge-up, KO, bot collapse, menu clicks.
- Music for each place that gets more intense as you go, plus a glitchy track.
- Hook up the Music setting, which does nothing yet.

## Step 11: Glitch Mode

- Glitched versions of the places (flicker, screen tearing, teleporting enemies).
- **Glitch** as the final boss (commander of the bots, **Teleport** special), drawn at 28×28.
- Beating him unlocks Glitch. This replaces the "type GLITCH" cheat.

## Step 12: Release

- Story text between places (design this together first).
- Package for **itch.io**.

## Later

- Online play and 2 players on separate devices.
- Phones and tablets with touch buttons.
