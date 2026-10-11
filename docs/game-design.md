# Stickman Hit: game design

The full vision for the game, agreed with the creator in the second design session (2026-10-11). This replaces the "open questions" in `session-notes.md`. The build order is in `build-plan.md`.

## The game

- A pixel-art **Street Fighter-style** fighting game: flat ground, health bars, knock the other fighter's health to zero. **Not** Smash Bros style (no platforms, no knock-off-the-stage).
- **1 player against a computer fighter**, one enemy at a time. A 2-player mode lives in Quick Fight.
- Fighters are **28×28 pixels** (up from 24×24), with smooth animation and more frames. **Every button has its own animation.**
- Plays in a **web browser** and on **itch.io**. Phones and tablets are undecided.

## Story

- **Cyborg** is the supervillain. He is terrorizing the universe and turning people into **bots**: lifeless, doing random NPC stuff.
- The **Ninja** lives at a small temple in the **Grassy Fields**. The **Samurai** lived at the **Cherry Blossom Temple**, warned the Ninja about Cyborg, and then got turned into a bot. The Ninja sets out to fix everything.
- When you beat a bot, it **collapses and slowly turns back into a person**, who lies there **asleep**. They do not say thanks.
- **All the bosses are bots too** (Bot Brute, Boxer, Samurai). Beating one turns them back to normal and they **join your team**, which unlocks them as a playable fighter.
- When **Cyborg** is beaten, **everyone wakes up**.
- **Glitch** is one of Cyborg's bots that broke. He is the **commander of the bot army**. His powers make glitch effects on screen (visual effects only, the game doesn't really break).

## Fighters

| Fighter | How you get them | Special (M) | Notes |
|---|---|---|---|
| **Ninja** | You start with him (main character) | Dash Kick: a flying kick across the screen | Keeps his hood and scarf look, but **fights like Fang from Brawl Stars**: fast kicks, a dashing super |
| **Boxer** | Beat the Dojo boss | **Haymaker**: a huge charged punch that sends them flying | Replaces Triple Jab, which felt too much like a normal combo |
| **Samurai** | Beat the Cherry Blossom Temple boss | Counter Slash: guard stance that slashes back when hit | |
| **Cyborg** | Beat him at the end of Main Mode | Rocket Punch: fires his fist across the screen | Renamed from ROBOT. Stays **fully metal**. |
| **Glitch** | Beat Glitch Mode | Teleport: appears behind the enemy | Replaces the current "type GLITCH" unlock |

Non-playable: **bots** (gray stickmen) and the **Bot Brute** (first boss: a muscle man, only a little bigger than the player).

## Controls

**1 player** (either layout works)

| Action | WASD layout | Arrow layout |
|---|---|---|
| Move | A / D | ← / → |
| Jump | W | ↑ |
| Duck | S | ↓ |
| Combo | Space | Z |
| Strong attack | K | X |
| Special | M | C |

**2 players on one keyboard**

| Action | Player 1 | Player 2 |
|---|---|---|
| Move / jump / duck | WASD | Arrow keys |
| Combo | F | , |
| Strong attack | G | . |
| Special | H | / |

There is **no block button.**

## Fighting rules

- Everyone has **1,000 health**.
- **Combos (Space):** after each hit a **timing bar** appears with a sliding marker. Press Space again on time to keep the combo going. The bar gets faster each hit, up to **7 hits** (the most).
  - **Perfect** (right on the line): **30 damage** and "PERFECT!"
  - **Green zone:** **12 damage**
  - **Red zone:** miss, the combo ends
  - A full perfect combo does about **200 damage** (1/5 of health).
  - A **"3 HITS!"**-style counter shows the combo count. Hit 3 launches the enemy up or knocks them back, with a small animation. The final hit of a combo always has a small animation.
- **Strong attack (K):** one hit, different animation from Space, **50 damage**.
- **Special (M):** **150 damage**. Only usable when the **special meter** is full. The meter fills from combos and damage. When used, **the game freezes except your fighter**, who plays the special's animation. No darkening or zooming.
- **Ducking** dodges **every attack except the low kick**. You can only stay ducked for about **3 to 5 seconds**. Ducking during **hit 1 or 2** of an enemy's combo **breaks the combo**. Once hits 1 and 2 land, the combo can go all the way.
- **Low kick:** duck + Space or K. It trips the enemy, kicks them into the air, then slams them down if timed properly.
- **Jumping** also gets you over attacks.
- These numbers are starting points, to be tuned by play-testing.

## Computer opponent

- Choose **Easy / Normal / Hard** before playing.
- The computer attacks **high or low at random**.
- It does combos on **Normal and Hard**. On **Hard** it **mostly** uses combos.

## Main Mode

1. **Grassy Fields:** 5 levels of bots, then the **Bot Brute** boss
2. **Dojo:** 5 levels, then the **Boxer** boss
3. **Cherry Blossom Temple:** 5 levels, then the **Samurai** boss
4. **Back to the Grassy Fields:** 5 levels of tougher bots, then **Cyborg**, the final boss

- **Each level = 3 bots, one at a time.** Your health **carries over** between the 3 bots and **refills between levels**.
- **Bot fights: 60 seconds. Boss fights: best of 3 rounds, 90 seconds each.** Health refills before the boss.
- When the timer runs out, **whoever has more health wins**.
- **Lose:** a lose screen, then **restart just that level**. Progress saves automatically after each level.
- **Ending:** Cyborg falls, everyone wakes up, then **Glitch appears for a moment and the screen glitches out**. This opens Glitch Mode.

## Glitch Mode

- Opens after beating Cyborg.
- Short **glitched-out versions of the places**: flickering colors, screen tearing, teleporting enemies.
- **Glitch** is the final boss. Beat him to unlock him.

## Menus

- **Play → Main Mode.**
- **Quick Fight** unlocks after beating **level 1**. Pick any unlocked fighter, a stage, a difficulty, and a timer (**60s / 2 min / ∞**). Fight the computer, or a friend in **2-player mode** (same rules, no CPU).
- **Glitch Mode** shows up after beating Cyborg.
- **Settings** (already exists): sound, music, screen shake.

## Fight screen (HUD)

- **Top:** fighter names and enemy progress (for example "Enemy 2 / 3").
- **Bottom:** health bars, with the **special meter under each one**. **Timer** in the bottom middle.
- **Side:** combo counter. The timing bar appears during combos.

## Look and effects

- Fighters get **more frames** and separate animations for: walk, jump, duck, each combo hit, strong attack, low kick, special, getting hit, launched, knocked down, KO, victory.
- Effects: hit sparks, dust, screen shake (respects the existing Screen Shake setting).
- Stages: Grassy Fields (with the Ninja's small temple), Dojo, Cherry Blossom Temple, plus glitched versions for Glitch Mode.
- Bots: gray stickmen. When beaten they collapse and fade back into a colored, sleeping person.

## Sound and music

- **8-bit sound effects:** punch, kick, Perfect "ding", miss "buzz", special charge-up, KO, bot collapse, menu clicks.
- **Fast 8-bit music** that starts chill and gets **more intense with each place**. A glitchy track for Glitch Mode.

## Saved for later

- Online play, and 2-player on two separate devices
- Phones and tablets (touch buttons)
- More story scenes (how the story is told between places is not designed yet)
