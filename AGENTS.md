<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

# AGENTS.md — Protein Palace Quest (Protein World MMORPG)

Welcome AI Coding Assistants! This document provides essential project context, architectural guidelines, and deployment workflows for maintaining and enhancing **Protein Palace Quest (Protein World MMORPG)**.

---

## 📌 Project Overview
**Protein Palace Quest** is an interactive, educational MMORPG built for High School Grade 10 Biology students. Players explore an overworld map, interact with biology NPCs, open quiz treasure chests, and enter 4 specialized biology minigame zones:
1. **สถาบันโครงสร้างชีวะ (Structural Biology Institute)**: Peptide bonds, amino acids, primary structure.
2. **โรงงานพับม้วนโปรตีน (Protein Folding Factory)**: Secondary & Tertiary structure ($\alpha$-helix, $\beta$-sheet, denaturation).
3. **ห้องปฏิบัติการเอนไซม์ (Enzyme Laboratory)**: Active sites, Lock & Key model, Ea reduction, competitive inhibitors.
4. **โรงพยาบาลภูมิคุ้มกัน (Immune Hospital)**: Antibodies, Y-shaped immunoglobulins, antigens, collagen, hormones.

---

## 🛠️ Technology Stack
- **Framework**: [TanStack Start](https://tanstack.com/router) with React 18 & Vite
- **Styling**: TailwindCSS (v4) with custom RPG design system tokens
- **Real-Time Multiplayer**: Cloudflare Durable Objects (`GameRoomDO` class) + WebSockets
- **State Management**: `zustand` / React Hooks + `localStorage` persistence
- **Server & Hosting**: Cloudflare Workers (`protein-world.wishreb0rn.workers.dev`)

---

## 📂 Codebase Map & Key Files

| Path | Description |
| :--- | :--- |
| [src/routes/map.tsx](file:///c:/งาน/protein-palace-quest/src/routes/map.tsx) | Overworld map page (~1400 lines) with rAF 60 FPS canvas loop, D-pad controls, chest collisions, and Kahoot quiz modals. |
| [src/routes/index.tsx](file:///c:/งาน/protein-palace-quest/src/routes/index.tsx) | Landing / Character creation & collection gallery page. |
| [src/routes/game/](file:///c:/งาน/protein-palace-quest/src/routes/game) | Minigame routes (`structural.tsx`, `folding.tsx`, `enzyme.tsx`, `immune.tsx`). |
| [src/lib/game-data.ts](file:///c:/งาน/protein-palace-quest/src/lib/game-data.ts) | Game data, building zones, preset avatars, and quiz question pools. |
| [src/lib/game-store.ts](file:///c:/งาน/protein-palace-quest/src/lib/game-store.ts) | Local progress storage (`pw_progress`, `pw_playerName`, `pw_playerAvatar`). |
| [src/hooks/use-multiplayer.ts](file:///c:/งาน/protein-palace-quest/src/hooks/use-multiplayer.ts) | Real-time WebSocket hook connecting players to `GameRoomDO`. |
| [server/do/GameRoomDO.ts](file:///c:/งาน/protein-palace-quest/server/do/GameRoomDO.ts) | Cloudflare Durable Object for multiplayer positioning & live map chat. |
| [scripts/export-do.js](file:///c:/งาน/protein-palace-quest/scripts/export-do.js) | Nitro build post-processor injecting `GameRoomDO` into `.output/server/index.mjs`. |

---

## ⚙️ Core Mechanics & Architecture Rules

### 1. Movement & Collision Detection (60 FPS rAF Loop)
- Player movement is driven by a `requestAnimationFrame` loop in `src/routes/map.tsx`.
- Collision checks (`checkChestCollision`, `checkBuildingCollision`) MUST be called **synchronously on every frame** inside the rAF loop rather than relying solely on asynchronous React state updates.

### 2. Treasure Chest Modal Hysteresis & Dismissal Cooldown
To prevent modals from re-opening unexpectedly when players walk away or close quiz windows:
- **Trigger Distance**: `dist <= 55px` from chest center `(chest.x, chest.y)`.
- **Reset Distance**: `lastClosedChestRef` is reset ONLY when player walks out beyond `dist > 85px`.
- **15-Second Dismissal Cooldown (`dismissedCooldowns`)**: Closing a chest without answering sets a temporary 15s cooldown (`Date.now() + 15000`) so players can walk away freely without popups.
- **Non-Duplicate Questions**: When opening a chest, exclude questions currently held by other chests (`assignedChestQuestions`).

### 3. Responsive Layout Rules
- **Header HUD Bar**: Keep compact (`text-[10px] sm:text-xs`) with `flex-wrap` and responsive text labels for narrow screens.
- **Mobile D-pad & Chat Bar**: Ensure touch D-pad overlay (`bottom-4 left-4`) sits separately from the live chat input (`bottom-24 left-4 lg:bottom-4 lg:left-4`) on mobile devices.
- **Modals**: All modals MUST include vertical scrolling constraints (`max-h-[85vh]` / `max-h-[90vh]` with `overflow-y-auto`) to support mobile landscape mode.

---

## 🚀 Build & Deployment Commands

```bash
# Build production bundle (client + SSR + Nitro DO injection)
npm run build

# Deploy directly to Cloudflare Workers
npx wrangler deploy --name protein-world
```
