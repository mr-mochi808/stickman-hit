# Stickman Hit: build plan

Build order for the game described in `game-design.md`. Each step ends with something you can play and check before moving on. Numbers (damage, speeds, timers) are starting points to tune by play-testing.

## Step 1: First real fight

The goal is the Ninja fighting one bot on the Grassy Fields.

- Redraw the **Ninja** and a gray **bot** at **28×28**, with idle, walk, jump, duck, and hit frames.
- Moving, jumping, and ducking (ducking runs out after a few seconds).
- **K strong attack** with its own animation.
- HUD: names at the top, health bars and timer at the bottom.
- 1,000 health, 60-second timer, KO, and win / lose screens.
- A very simple computer bot that walks up and attacks.
- Both control layouts (WASD + Space/K/M, arrows + Z/X/C).

## Step 2: Combos

- The **Space combo**, up to 7 hits, with the **timing bar** (Perfect 30 / green 12 / red ends it). The bar gets faster each hit.
- The combo counter on the side, and "PERFECT!" pop-ups.
- Hit 3 launches or knocks back. The final hit has a small animation.
- **Ducking during hit 1 or 2 breaks a combo.**
- The **low kick** (duck + Space/K): trip, launch, slam.
- Effects: hit sparks, dust, and screen shake.

## Step 3: Special moves

- A special meter under each health bar that fills from combos and damage.
- The **freeze effect**: everything stops except the fighter doing the special.
- The Ninja's **Dash Kick**, fast and Fang-like.

## Step 4: A smarter computer

- **Easy / Normal / Hard.**
- Random high and low attacks. Combos on Normal and Hard, and mostly combos on Hard.

## Step 5: Main Mode, Grassy Fields

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
