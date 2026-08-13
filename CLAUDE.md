# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Little Eater** — a baby food planner PWA built with React + Vite + Tailwind CSS. It helps parents track baby food recipes, plan weekly meals, and log feeding history with allergy/reaction tracking.

## Development Commands

```bash
npm run dev        # Start dev server (Vite, default port 5173)
npm run build      # Production build to dist/
npm run preview    # Preview production build locally
npm run lint       # Lint with oxlint (react + oxc plugins)
```

## Architecture

### Tech Stack
- **React 19** with functional components and hooks (no Redux/Context — state is local per component, synced to localStorage)
- **React Router v7** (`BrowserRouter`) for client-side routing
- **Tailwind CSS v4** via `@tailwindcss/vite` plugin
- **Oxlint** for linting
- **localStorage** as the sole data persistence layer

### Data Layer: Repository Pattern (`src/lib/repository.js`)
All data access goes through repository objects — no component reads localStorage directly:

| Repository | Methods | Notes |
|---|---|---|
| `recipesRepo` | `list({limit, offset})`, `get(id)`, `create()`, `update()`, `delete()` | Pagination support; descending by default |
| `mealSlotsRepo` | `list()`, `get(id)`, `create()`, `update()`, `delete()` | Returns all; UI slices by week |
| `feedingLogsRepo` | `list({limit, offset})`, `get(id)`, `create()`, `update()`, `delete()` | Pagination support; descending by default |

Seed data is auto-populated via `seedIfEmpty()` when localStorage is empty (10 demo recipes + demo meal slots + demo feeding logs).

> **Note:** `src/lib/storage.js` is a legacy/duplicate file with the same data as `repository.js` but with a different (non-repository) function export style. Use `repository.js` for all new code.

### Routing & Pages

| Route | Component | Purpose |
|---|---|---|
| `/` | `Dashboard` | Stats overview (foods tried, allergens, favorites), weekly meal preview, latest recipes |
| `/recipes` | `Recipes` | Searchable/filterable recipe list with add form |
| `/recipes/:id` | `RecipeDetail` | Full recipe view, prep notes, plan usage |
| `/plan` | `MealPlan` | Weekly meal planning with day-by-day slot management |
| `/diary` | `Diary` | Feeding log history grouped by date, with reaction filtering |

### Shared Components (`src/components/`)
- **BottomNav** — Fixed bottom tab bar (Home, Recipes, Plan, Diary)
- **ConfirmModal** — Reusable confirmation dialog (title, message, cancel/delete)
- **Modal** — Generic modal wrapper with backdrop and scroll handling

### Styling
- Global `@layer components` defines a `.card` utility class (white bg, rounded-2xl, shadow, border)
- Body background: `#f8f7f4`
- Primary action color: `blue-600`
- All pages use `max-w-lg mx-auto` for mobile-first layout
- BottomNav has `safe-area-pb` for iOS safe areas

### Key Data Models

**Recipe**: `{ id, name, emoji, ingredients[], ageMin, texture, allergens[], prepNotes, safe, createdAt }`

**MealSlot**: `{ id, day (YYYY-MM-DD), time (HH:MM), recipeId, notes }`

**FeedingLog**: `{ id, date (YYYY-MM-DD), time (HH:MM), recipeId, amount, reaction, notes, favorite }`
- `amount`: "Tasted" | "Ate some" | "Ate most" | "Ate all" | "Refused"
- `reaction`: "None" | "Mild rash" | "Vomiting" | "Diarrhea" | "Gas" | "Other"
