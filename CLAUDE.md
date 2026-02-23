# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.
## Project: Travel Ravers Survival OS
The 2026 Festival Season presents a hostile network environment ("Ravers Paradox"). This app is a mission-critical survival tool, not just a checklist.

## Core Architecture Rules
### The "Ravers Paradox" Constraint
- **Offline-First**: All persistent data lives in a local WatermelonDB. [cite_start]The phone is the BOSS[cite: 12, 34].
- **No Spinners**: Explicitly forbidden. [cite_start]If the app hangs or shows a network loader for user-initiated actions, the architecture has failed[cite: 12, 35, 49].
- [cite_start]**Airplane Mode Test**: Every feature must work 100% offline before completion[cite: 49, 384].

### Specialized "Survival" Protocols
- [cite_start]**SneakerNet**: Use LZString for high-density QR code data transfer between offline devices[cite: 53, 420, 421].
- **Raster Maps**: No streaming map tiles (Google/Apple Maps). [cite_start]Use Georeferenced Raster Overlays for artistic maps[cite: 285, 414].
- [cite_start]**Local AI**: Use react-native-executorch for on-device safety advice without internet[cite: 70, 91, 109].

## Project

**travel_ravers** is a React Native mobile app built with Expo.

## Core Architecture Rules

### Offline-First
All persistent data lives in a local **WatermelonDB + SQLite** database. The local DB is always the source of truth. Any remote backend is secondary and should sync asynchronously without blocking the UI.

### The Phone is the Boss
Every user action must read/write to the local DB **instantly**. Network loading spinners are forbidden for user-initiated interactions. If a sync to a remote server is needed, do it silently in the background.

### On-Device AI
All AI/ML features use **react-native-executorch** and run entirely on-device. Do not call external AI APIs for features that should run locally.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React Native + Expo |
| Local Database | WatermelonDB + SQLite |
| On-Device AI | react-native-executorch |

## Development Commands

> **Note:** WatermelonDB and react-native-executorch both use native modules, so **Expo Go will not work**. Use a custom dev client.

```bash
# Install dependencies
npm install

# Start Expo dev server (custom dev client)
npx expo start --dev-client

# Build and run on device/emulator (first time or after native changes)
npx expo run:android
npx expo run:ios

# Run tests
npm test

# Run a single test file
npm test -- path/to/test.ts

# Lint
npm run lint

# Type check
npx tsc --noEmit
```

## WatermelonDB Conventions

- **Schema** is defined in `src/db/schema.ts`. Increment `schemaVersion` for every change.
- **Migrations** live in `src/db/migrations/`. Every schema change needs a corresponding migration — never mutate existing migrations.
- **Models** extend `Model` from `@nozbe/watermelondb` and live in `src/models/`.
- Use `@lazy` for relations and `@children` for has-many associations.
- All DB writes must go through a `database.write(() => { ... })` transaction.

## react-native-executorch Conventions

- Model files (`.pte`) are bundled as assets and loaded at runtime — do not fetch them from a remote URL.
- Initialize the ExecutorchModule once at app startup; reuse the instance.
- Run inference off the JS thread using the provided async API to avoid blocking the UI.

