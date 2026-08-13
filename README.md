# Little Eater — Baby Food Planner

A progressive web app (PWA) that helps parents track baby food recipes, plan weekly meals, and log feeding history with allergy/reaction tracking.

## Features

- **Dashboard** — Stats overview (foods tried, allergens, favorites), weekly meal preview, latest recipes
- **Recipe Library** — Searchable, filterable recipe list with add/edit/delete support. Each recipe includes emoji icon, ingredient, minimum age, texture type, allergen warnings, and prep notes
- **Meal Planner** — Week-by-week meal planning with day-by-day slot management. Add, edit, remove, and reschedule meals
- **Feeding Diary** — Log every feeding with amount eaten, reactions, notes, and photos. Filter by reaction type. Favorite and expand photos inline
- **Allergen Tracking** — Automatic allergen warnings on recipes and feeding logs
- **Photo Support** — Attach photos to feeding logs with client-side compression and IndexedDB storage
- **Offline-First PWA** — Works offline with cached assets via Workbox
- **Seed Data** — 10 demo recipes, meal slots, and feeding logs auto-populated on first load

## Tech Stack

- **React 19** — Functional components with hooks
- **React Router v7** — Client-side routing
- **Tailwind CSS v4** — Utility-first styling via `@tailwindcss/vite`
- **IndexedDB** — Photo storage via `idb` (via `openDB`)
- **localStorage** — Recipe, meal slot, and feeding log persistence
- **Vite PWA Plugin** — Service worker and manifest generation
- **Oxlint** — Linting
- **sharp** — Image compression (dev dependency)

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Available Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start dev server (Vite, port 5173) |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Lint with oxlint (react + oxc plugins) |

## Project Structure

```
src/
├── components/
│   ├── BottomNav.jsx      # Fixed bottom tab bar (Home, Recipes, Plan, Diary)
│   ├── ConfirmModal.jsx   # Reusable confirmation dialog
│   └── Modal.jsx          # Generic modal wrapper
├── lib/
│   └── repository.js      # Data layer (recipes, meal slots, feeding logs, image store)
├── pages/
│   ├── Dashboard.jsx      # Stats, weekly preview, latest recipes
│   ├── Recipes.jsx        # Recipe list with search, filter, and add form
│   ├── RecipeDetail.jsx   # Full recipe view, prep notes, plan usage
│   ├── MealPlan.jsx       # Weekly meal planning with slot management
│   └── Diary.jsx          # Feeding log history with reaction filtering
├── App.jsx                # Router setup
├── main.jsx               # Entry point
└── index.css              # Tailwind + global styles
```

## Data Models

| Model | Fields |
|---|---|
| **Recipe** | `id`, `name`, `emoji`, `ingredients[]`, `ageMin`, `texture`, `allergens[]`, `prepNotes`, `safe`, `createdAt` |
| **MealSlot** | `id`, `day` (YYYY-MM-DD), `time` (HH:MM), `recipeId`, `notes` |
| **FeedingLog** | `id`, `date` (YYYY-MM-DD), `time` (HH:MM), `recipeId`, `amount`, `reaction`, `notes`, `favorite`, `photo` |

Amounts: `Tasted` | `Ate some` | `Ate most` | `Ate all` | `Refused`

Reactions: `None` | `Mild rash` | `Vomiting` | `Diarrhea` | `Gas` | `Other`

## Architecture

All data access goes through repository objects in `src/lib/repository.js` — no component reads storage directly.

| Repository | Methods | Notes |
|---|---|---|
| `recipesRepo` | `list({limit, offset})`, `get(id)`, `create()`, `update()`, `delete()` | Pagination support; descending by default |
| `mealSlotsRepo` | `list()`, `get(id)`, `create()`, `update()`, `delete()` | Returns all; UI slices by week |
| `feedingLogsRepo` | `list({limit, offset})`, `get(id)`, `create()`, `update()`, `delete()` | Pagination support; descending by default |
| `imageStore` | `put()`, `get()`, `delete()`, `has()` | IndexedDB photo store keyed by entity ID |

Seed data is auto-populated via `seedIfEmpty()` when localStorage is empty (10 demo recipes + demo meal slots + demo feeding logs).
