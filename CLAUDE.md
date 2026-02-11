# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Rental Manager is a property rental management system (Spanish-language UI) built with **SvelteKit 2.0** and **Supabase** (PostgreSQL + Auth + Storage). It manages properties, rooms, tenants, finances, and contract generation.

**Node version:** 20.x (see `.nvmrc`)

## Commands

```bash
# Development
npm run dev              # Start dev server at localhost:5173
npm run build            # Production build
npm run preview          # Preview production build

# Type checking
npm run check            # svelte-kit sync + svelte-check

# Testing (Vitest + Playwright)
npm run test:run         # Single run of unit/integration tests
npm run test:unit        # Unit tests only (tests/unit/)
npm run test:integration # Integration tests only (tests/integration/)
npm run test:coverage    # Tests with coverage report (thresholds: 80% lines/functions/statements, 75% branches)
npm run test:e2e         # Playwright E2E tests (Chromium + Mobile Chrome)
npm run test:all         # Unit/integration + E2E
vitest run tests/unit/someFile.test.js  # Run a single test file
```

## Architecture

### Layered Structure

```
src/routes/          → SvelteKit file-based routing (pages + layouts)
src/lib/components/  → Svelte components organized by feature domain
src/lib/services/    → All Supabase/backend operations (one service per domain)
src/lib/stores/      → Svelte stores for reactive global state
src/lib/types/       → TypeScript type definitions
src/lib/utils/       → Small utilities (validation, debounce, PWA)
src/lib/styles/      → Design tokens and animations CSS
supabase/migrations/ → PostgreSQL migration files; ALL_MIGRATIONS.sql is the consolidated schema
```

### Service Layer Pattern

All database operations go through `src/lib/services/`. Each service file exports a default object with methods that wrap Supabase client calls. Key services:

- `supabase.js` — Supabase client singleton (reads `PUBLIC_SUPABASE_URL` and `PUBLIC_SUPABASE_ANON_KEY` from env)
- `auth.js` — Authentication (email/password, session refresh)
- `properties.js`, `rooms.js`, `tenants.js`, `finances.js` — CRUD for each domain
- `permissions.js` — Role-based access control (owner/editor/viewer via `property_access` table)
- `contract.js` + `pdf.js` — Contract generation with jsPDF and docxtemplater
- `storage.js` — Supabase Storage operations (room photos in `room-photos` bucket)
- `fonts.js` — Embedded Roboto font data for PDF generation (~458KB)

### State Management

Svelte stores in `src/lib/stores/`:
- `user.js` — Auth state with custom init/refresh
- `properties.js` — Property list + `selectedPropertyId` (persisted to localStorage) + derived stores for stats (totalRooms, occupancyRate, etc.)
- `theme.js` — Dark/light mode toggle (localStorage persisted, also uses `class` strategy on `<html>`)
- `notifications.js`, `toast.js` — Notification and toast queues

### Database

Supabase PostgreSQL with Row Level Security on all tables. Core tables: `properties`, `rooms`, `tenants`, `expenses`, `income`, `property_access`, `invitations`. Schema is in `supabase/migrations/ALL_MIGRATIONS.sql`.

### Styling

- **Tailwind CSS 3** with custom color palette (primary=orange, pink, terracotta, warm-*) defined in `tailwind.config.js`
- **Dark mode** via Tailwind `class` strategy
- **"Liquid Glass" design system** — glassmorphism effects using backdrop-blur, semi-transparent backgrounds, and custom CSS variables in `src/app.css` and `src/lib/styles/design-tokens.css`
- Custom animations defined in both Tailwind config and `src/lib/styles/animations.css`

### Testing Setup

- **Vitest** for unit/integration tests with jsdom environment. Config in `vitest.config.js`. Setup file: `tests/setup.js`. Globals enabled.
- **Playwright** for E2E. Config in `playwright.config.js`. Tests in `tests/e2e/`.
- `$lib` alias resolves to `./src/lib` in test environment.
- Route components are excluded from unit test coverage (tested via E2E instead).

### Environment Variables

Required in `.env.local`:
- `PUBLIC_SUPABASE_URL`
- `PUBLIC_SUPABASE_ANON_KEY`

### Build Optimization

Vite config splits heavy dependencies into separate chunks: `pdf-lib` (jsPDF), `docx-lib` (docxtemplater + pizzip), `supabase` (@supabase/*). See `vite.config.js`.
