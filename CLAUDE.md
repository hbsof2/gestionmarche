# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A web platform for managing Algerian public procurement deals (Marchés Publics) — tracking raw materials, contracting authorities, their branches, contractors, deals, delivery receipts, invoices, users, and database backups.

## Tech Stack

| Layer    | Technology              | Local port | Hosting  |
|----------|-------------------------|------------|----------|
| Frontend | Next.js 16 + Tailwind 4 (CSS-first config, no `tailwind.config.js`) | 3000       | Netlify  |
| Backend  | Node.js + Express       | 5000       | Railway  |
| Database | PostgreSQL (Supabase)   | —          | Supabase |
| Storage  | Supabase Storage        | —          | Supabase |

## Dev Commands

```bash
# Frontend
cd frontend && npm run dev       # Turbopack dev server → http://localhost:3000
cd frontend && npm run build
cd frontend && npm run lint

# Backend
cd backend && npm run dev        # nodemon → http://localhost:5000
cd backend && npm start          # node (production)

# Run a specific migration (reads DATABASE_URL from frontend/.env.local)
node database/scripts/run_migration.js 001_raw_materials.sql
node database/scripts/run_migration.js 002_storage_policies.sql
node database/scripts/run_migration.js 003_material_categories.sql
node database/scripts/run_migration.js 004_contracting_authority.sql
node database/scripts/run_migration.js 005_authority_branches.sql
node database/scripts/run_migration.js 006_alter_authority_branches.sql
node database/scripts/run_migration.js 007_contractors.sql
node database/scripts/run_migration.js 008_deals.sql
node database/scripts/run_migration.js 009_deal_branches.sql
node database/scripts/run_migration.js 010_fix_deal_branches_cascade.sql
node database/scripts/run_migration.js 011_deal_items.sql
# defaults to 001_raw_materials.sql if no argument given
```

There is no test suite in this repo (no `test` script in either `package.json`).

Verify both layers are running:
- `GET http://localhost:3000/api/test-connection` — Supabase connectivity check
- `GET http://localhost:5000/api/health` — backend heartbeat

## Architecture

### Frontend (`frontend/src/`)

**Navigation model** — `app/page.js` is the single-page shell. A `sections[]` array drives both the right sidebar and the top service bar. Two state values control what renders in the main content area: `activeSection` (which section) and `activeService` (which sub-action within the section).

**Section integration pattern** — implemented sections bypass the generic placeholder and render a self-contained `*Page` component. The parent passes `activeService` and `onServiceChange` as props so the top bar stays in sync. Example: when `activeSection === "raw-materials"`, `<RawMaterialsPage activeService={activeService} onServiceChange={setActiveService} />` renders directly. The `*Page` component watches `activeService` via `useEffect` to react (e.g. `"add"` opens the form modal, `"search"` focuses the search input).

**Data flow for each section:**
```
*Page (state: list, pagination, form open, delete modal, toast)
  ├── *List (pure display: table, search bar, pagination)
  ├── *Form (modal: field state + validation, calls uploadImage then create/update)
  └── *DeleteModal (confirmation dialog)
```

**API client** — `src/lib/api.js` is an axios instance pointed at `NEXT_PUBLIC_API_URL`. The response interceptor attaches `error.arabicMessage` so components can display Arabic errors without extra parsing.

**Service layer** — `src/services/<section>Service.js` wraps the axios calls. Components import from the service, never from `api.js` directly.

Key files:
- `app/layout.js` — sets `lang="ar" dir="rtl"`, loads Tajawal font, wraps `children` in `ThemeProvider`, and inlines an anti-flash-of-wrong-theme script in `<head>` that reads `localStorage.theme` and adds the `dark` class to `<html>` before hydration (`<html>` carries `suppressHydrationWarning` because of this intentional pre-hydration mutation — don't remove it)
- `src/lib/supabase.js` — anon-key Supabase client + `testConnection()` utility
- `src/lib/api.js` — axios instance with Arabic error interceptor
- `app/api/test-connection/route.js` — Next.js API route for connection health check
- `src/data/` — static reference datasets bundled with the frontend (e.g. `algeria-wilayas.js`: all 58 wilayas with their communes in Arabic, keyed by `code`). Import directly; these are not fetched from the API.

**Date fields** — every date input (`ContractorForm.jsx`: `birth_date`/`rc_date`, `ContractingAuthorityForm.jsx`: `rc_date`, `AuthorityBranchForm.jsx`: `rc_date`, `DealForm.jsx`: `start_date`/`end_date`) uses the same pattern instead of `<input type="date">`: three `<select>`s (day 1–31, Arabic month names, year range) backed by local `useState`, a `pad()` helper, and a `parseDate(isoDate)` helper that does `isoDate.split("T")[0].split("-")` to prefill from an existing record. On submit the date is built as a plain template-literal string (`` `${year}-${pad(month)}-${pad(day)}` ``) — **never** via `new Date(...).toISOString()`, which reintroduces the timezone-shift bug described in the `db.js` quirk above. List components display dates the same defensive way (`DealsList.jsx`'s `formatDate`: split on `"T"` then `"-"`, never `new Date(x).toLocaleDateString()`). Follow this exact pattern for any new date field.

**Searchable select** — `DealForm.jsx` has a local `SearchableSelect` component (type-to-filter dropdown over a fetched list, e.g. contractors/authorities) used for FK fields instead of a plain `<select>` with hundreds of options. Reuse or copy this pattern for future FK pickers rather than a native `<select>`.

**Deal detail / branches** — clicking a deal in `DealsList.jsx` opens `DealDetail.jsx` (full-page view, not a modal) showing the deal's linked `authority_branches` via the `deal_branches` join table. It has its own `BranchSearchableSelect` (same type-to-filter pattern as above) to add a branch, and calls `getDealBranches`/`addBranchToDeal`/`removeBranchFromDeal` from `dealsService.js`. A deal must always keep at least one branch — `removeBranchFromDeal` on the backend rejects removing the last one.

**Deal items (materials)** — `DealDetail.jsx` renders `DealItems.jsx` below the branches section (separated by a divider). Unlike the other sections, its add-form is **always visible** rather than opened via a modal/`activeService`, and stays open after a successful add (only the material/category selects are cleared — TVA and quantities are left as-is since the next line item often reuses them). It has its own local `SearchableSelect` for material/category pickers and inline-edit rows (click edit → the TVA/quantity/price cells become inputs with save/cancel, no modal) rather than a separate edit form. Fetches the full material list via `rawMaterialsService.getAll(1, "", 1000)` and the full category list via `materialCategoriesService.getAll()` (categories have no pagination at all — `getAllCategories` always returns the full array).

### Backend (`backend/src/`)

`server.js` imports all route files and mounts them under `/api/<section>`. Logic lives in `controllers/` — routes are thin and only wire up multer and call the controller.

- `config/db.js` — exports a `pg.Pool`. **Critical quirk #1:** Supabase wraps passwords that contain special characters in `[...]` in the connection string — `db.js` strips those brackets before passing credentials to pg. **Critical quirk #2:** `pg` parses `DATE` columns (OID `1082`) into local-timezone JS `Date` objects by default, which then serialize to a UTC ISO string shifted back a day (e.g. `2026-01-01` → `2025-12-31T23:00:00.000Z`) whenever the server's local timezone is ahead of UTC. `db.js` overrides that type parser to keep `DATE` values as the raw `"YYYY-MM-DD"` string — don't remove this, and don't reintroduce `new Date(...)`/`.toISOString()` round-trips for date fields anywhere in the stack (controllers or frontend forms should build/parse date strings manually, see the date-picker pattern below).
- `controllers/rawMaterialsController.js` — the reference implementation for all future controllers: pagination+search on GET, input validation returning Arabic error messages, Supabase Storage upload via service-role client. `materialCategoriesController.js`, `contractingAuthorityController.js`, `authorityBranchesController.js`, and `contractorsController.js` follow the same shape (list with `page`/`search` query params + pagination envelope, `getById`, `create`/`update` with shared field validation, `remove`) — none of them use Storage upload, only `rawMaterialsController.js` does.
- `controllers/contractorsController.js`, `contractingAuthorityController.js`, and `rawMaterialsController.js` additionally accept an optional `limit` query param (default `10`, capped at `1000`) on `getAll` — used by `DealForm.jsx`/`DealItems.jsx` to pull the full list for their searchable-select dropdowns instead of just one paginated page.
- `controllers/dealsController.js` — first controller to `JOIN` across tables: `getAll`/`getById` join `contractors` and `contracting_authorities` to return `contractor_name`/`authority_name` alongside the deal row. `create`/`update` validate that `end_date` is strictly after `start_date` and translate the `23505` unique-violation Postgres error code (duplicate `reference`) into an Arabic message. It also owns two join-table sub-resources, both mounted in `routes/deals.js` **before** the `/:id` routes:
  - `getDealBranches`/`addBranchToDeal`/`removeBranchFromDeal` (`/api/deals/:id/branches`) — `removeBranchFromDeal` refuses to remove a deal's last remaining branch.
  - `getDealItems`/`addDealItem`/`updateDealItem`/`removeDealItem` (`/api/deals/:id/items`) — the deal's material/pricing lines (`deal_items` table). `addDealItem` validates required fields, `min_quantity < max_quantity`, `0 ≤ tva ≤ 100`, `unit_price > 0`, and translates the `23505` unique-violation (duplicate `material_id` per deal) into an Arabic message; `updateDealItem` only updates `tva`/`min_quantity`/`max_quantity`/`unit_price` (material/category aren't editable after creation).
  Use this controller as the reference for any future section with FK relationships (`receipts`, `invoices`).
- `middleware/auth.js` — validates Supabase JWT via `supabase.auth.getUser(token)` (service role key). **Not currently applied to any route** — routes are unprotected until a section wires it in.
- `middleware/validation.js` — a generic Joi-schema `validate()` wrapper. Scaffolded but unused; controllers currently do validation inline instead (see `rawMaterialsController.js`).
- `routes/users.js` — uses Supabase Admin API instead of pg (no `users` table).
- `routes/rawMaterials.js` — declares `/upload-image` **before** `/:id` to prevent route conflict; uses multer memory storage (5 MB limit, images only).
- `routes/receipts.js`, `invoices.js`, `backup.js` — **stub routes**, not yet backed by a controller or migration. They query pg tables that don't exist yet, or return `{ message: "... — to be implemented" }` placeholders. Follow the "Adding a New Section" pattern below to flesh one out.
- `utils/email.js` — `sendEmail()` stub used by `routes/backup.js`; only logs to console, no provider (nodemailer/Resend/SendGrid) configured yet.
- `utils/tableExists.js` — `tableExists(client, tableName)` checks `information_schema.tables` before querying a table that may not exist yet (e.g. `receipts`, `receipt_items`); used by controllers' `remove`/`delete*` functions to guard forward-looking relationship checks. `deal_items` is a real table now (migration `011`) — controllers query it directly without this guard. See [Deletion Protection Rules](#deletion-protection-rules).

### Database

Migrations are plain SQL in `database/migrations/`, numbered `001_`, `002_`, …. The runner at `database/scripts/run_migration.js` reads `DATABASE_URL` from `frontend/.env.local`, parses the password bracket-stripping itself, and accepts the filename as a CLI argument.

**Table conventions:**
- `id SERIAL PRIMARY KEY` (sequential integer, never UUID)
- `created_at` / `updated_at` as `TIMESTAMPTZ NOT NULL DEFAULT now()`
- `updated_at` kept current by the shared `set_updated_at()` trigger function (defined once in `001_`)
- RLS enabled; policy name `authenticated_full_access` grants full access to the `authenticated` role

**Migrations applied:**
| File | What it creates |
|------|----------------|
| `001_raw_materials.sql` | `material_unit` enum, `raw_materials` table, index, trigger, RLS |
| `002_storage_policies.sql` | `materials` Storage bucket (public, 5 MB, images only), SELECT/INSERT/DELETE policies |
| `003_material_categories.sql` | `material_categories` table, index, trigger, RLS |
| `004_contracting_authority.sql` | `contracting_authorities` table, indexes on `name`/`wilaya`, trigger, RLS |
| `005_authority_branches.sql` | `authority_branches` table, indexes on `name`/`wilaya`, trigger, RLS — no FK to `contracting_authorities` (linked later in deals) |
| `006_alter_authority_branches.sql` | drops `NOT NULL` on `authority_branches.nis`/`nif`/`rc_number`/`rc_date` — those fields are optional |
| `007_contractors.sql` | `contractors` table, indexes on `full_name`/`wilaya`, trigger, RLS |
| `008_deals.sql` | `deals` table (`reference` UNIQUE, FKs to `contractors`/`contracting_authorities`), indexes on `reference`/`contractor_id`/`authority_id`, trigger, RLS |
| `009_deal_branches.sql` | `deal_branches` join table (`deal_id`+`branch_id` FKs, `UNIQUE(deal_id, branch_id)`), indexes on both FK columns, RLS — originally `deal_id` was `ON DELETE CASCADE` |
| `010_fix_deal_branches_cascade.sql` | drops and recreates the `deal_branches.deal_id` FK as `ON DELETE RESTRICT`, so the DB itself blocks deleting a deal that still has branches (backstops the application-level check in `dealsController.js`) |
| `011_deal_items.sql` | `deal_items` table (the materials/pricing lines of a deal: FKs to `deals`/`raw_materials`/`material_categories`, all `ON DELETE RESTRICT`; `tva`, `min_quantity`, `max_quantity`, `unit_price`), indexes on all three FK columns, `UNIQUE(deal_id, material_id)`, trigger, RLS |

Note the numbering gap in section names vs files: `contracting-authority` is section 2 in the UI/route table below but its migration is `004` (`003` was already taken by `material_categories`). Don't assume section order matches migration number. Similarly `006` was consumed by an *alter* migration on `authority_branches`, not a new table — `contractors` is `007`, `deals` is `008`. `deal_items` is `011`, not `010` — `010` was already taken by the cascade-fix migration when `deal_items` was added; always check the highest existing number in `database/migrations/` before naming a new one rather than assuming the next round number is free.

## Environment Variables

**`frontend/.env.local`** (gitignored):
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
DATABASE_URL=          # used by database/scripts/ too
NEXT_PUBLIC_API_URL=http://localhost:5000
```

**`backend/.env`** (gitignored — see `backend/.env.example`):
```
PORT=5000
DATABASE_URL=
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
FRONTEND_URL=http://localhost:3000
```

## UI Rules

- **Arabic UI, English code** — all visible text in Arabic, all identifiers/variables in English.
- **RTL throughout** — `dir="rtl"` on `<html>`. Sidebar is on the **right**; flex row order is reversed from LTR conventions.
- **Tailwind + inline style for dynamic colors** — use Tailwind for all static styles; use `style={{ backgroundColor: color + "18" }}` only when the color comes from the `sections[]` array at runtime. No CSS modules.  Every new component must use responsive prefixes (`sm:`, `md:`, `lg:`).
- **Font** — Tajawal via Google Fonts in `layout.js`. No other font should be introduced.
- **Section color** — each section has a hex color defined in the `sections[]` array in `page.js`. Use it (with opacity suffix like `+ "18"`) for icon backgrounds in that section's components.
- **Toast notifications** — implemented as local state in `*Page` components (`setTimeout` dismiss after 3.5 s), positioned with `fixed bottom-6 left-1/2 -translate-x-1/2`. Green for success, red for error.

## Dark Mode

Class-based dark mode (not OS `prefers-color-scheme`), toggled manually and persisted in `localStorage`.

- **No `tailwind.config.js`** — this is Tailwind v4, configured entirely in CSS. Dark mode is enabled via `@custom-variant dark (&:where(.dark, .dark *));` in `src/app/globals.css`, which makes every `dark:` utility apply based on a `.dark` class on `<html>` instead of the OS theme.
- **`ThemeProvider`** (`src/components/layout/ThemeProvider.jsx`) — client-side context wrapping the whole app from `layout.js`. Exposes `useTheme()` → `{ theme, toggleTheme }`. `toggleTheme` flips the class on `document.documentElement`, updates state, and writes `localStorage.setItem('theme', ...)`.
- **`ThemeToggle`** (`src/components/layout/ThemeToggle.jsx`) — Sun/Moon icon button (lucide-react) in the header next to the user avatar; consumes `useTheme()`. Copy this component's pattern (context consumer, not prop-drilled) for any other theme-aware control.
- **Anti-flash script** — see the `layout.js` bullet above; this is why `<html>` needs `suppressHydrationWarning`.
- **Styling convention for new/edited components** — every `bg-white`/`bg-slate-*`/`text-slate-*`/`border-slate-*` utility must have a matching `dark:` variant alongside it. The established shade mapping (light → dark) used across every section:
  - `bg-white` → `dark:bg-slate-800` (cards, modals, forms) · `bg-slate-50` → `dark:bg-slate-900` (page background) or `dark:bg-slate-700` (nested surfaces, inputs, secondary buttons)
  - `border-slate-200` → `dark:border-slate-700` · `border-slate-100` → `dark:border-slate-700`
  - `text-slate-800` → `dark:text-slate-100` · `text-slate-600`/`700` → `dark:text-slate-300` · `text-slate-400` → `dark:text-slate-500` · `text-slate-300` → `dark:text-slate-600`
  - `hover:bg-slate-50`/`100` → `dark:hover:bg-slate-700`/`600`
  - `placeholder:text-slate-400` → `dark:placeholder:text-slate-500`
  - Modal overlays `bg-black/30` → also add `dark:bg-black/50`
- **Never** add a `dark:` variant to a section's accent-color inline `style={{ backgroundColor: section.color }}` (or `+ "18"` opacity suffix) — accent colors are identical in both themes; only slate-based Tailwind utility classes get dark variants.

## UI Table Standards

Applies to every table component (existing and future) across all sections.

### Table Layout:
- Always use `table-fixed` and `w-full` on the table element
- Always wrap the table in a div with `overflow-x-auto` and `w-full`

### Table Header `<th>`:
- `font-bold text-base tracking-wide`
- `px-3 py-3 text-right whitespace-nowrap`
- Keep section color for background

### Table Data `<td>`:
- `font-medium text-sm text-slate-800`
- `px-3 py-3 text-right`
- `whitespace-nowrap overflow-hidden text-ellipsis`

### Table Rows `<tr>` in `tbody`:
- `border-b border-slate-100`

### General:
- Every table must have an empty state message in Arabic
- Every table must have a loading spinner during API calls
- Every table must have a search bar
- Action buttons: edit (blue), delete (red)
- Every color utility class (backgrounds, borders, text) needs its `dark:` counterpart — see [Dark Mode](#dark-mode)
- Full RTL support at all times
- Make sure all new UI components are fully responsive for mobile screens using Tailwind CSS responsive prefixes (`sm:`, `md:`, `lg:`). Full RTL support must be maintained.

## Adding a New Section (pattern to follow)

1. **Backend:** create `controllers/<section>Controller.js` mirroring `rawMaterialsController.js`; update `routes/<section>.js` to import from it.
2. **Frontend:** create `src/services/<section>Service.js`; create `src/components/<section>/` with `*Page`, `*List`, `*Form`, `*DeleteModal`.
3. **`page.js`:** add an `activeSection === "<section-id>"` branch in the main content area rendering `<*Page activeService={activeService} onServiceChange={setActiveService} />`.
4. **Database:** add `database/migrations/00N_<section>.sql` following the table conventions above; run it with the migration script.

**Adding a sub-section within an existing section** (e.g. material categories inside raw materials):
- Create a `categories/` subfolder under the section's component directory with its own `*Page`, `*List`, `*Form`, `*DeleteModal`.
- Add `showCategories` state to the parent `*Page`; render `<SubPage />` when true with a breadcrumb back button (no changes to `page.js` needed).
- The sub-section's `*Page` is self-contained: it owns its own fetch/toast/modal state and does not receive `activeService` props.

## Deletion Protection Rules

- NEVER delete a record that is linked to another table
- Always check relationships before deleting in the controller
- Return HTTP 400 with Arabic error message if record is linked
- Frontend delete modals must handle HTTP 400 and show Arabic error
- Use `tableExists()` helper (`backend/src/utils/tableExists.js`) before querying future tables
- This rule applies to ALL tables in the project
- `raw_materials` has no `category_id` column — a material's category only exists per deal line, on `deal_items.category_id`. `materialCategoriesController.js`'s `deleteCategory` check queries `deal_items.category_id` directly; don't reintroduce a join through `raw_materials` for this (an earlier version tried that and could never actually match anything).

## API Route Conventions

| Section              | Base path                     |
|----------------------|-------------------------------|
| Raw Materials        | `/api/raw-materials`          |
| Material Categories  | `/api/material-categories`    |
| Contracting Auth.    | `/api/contracting-authority`  |
| Authority Branches   | `/api/authority-branches`     |
| Contractor           | `/api/contractors`            |
| Deals                | `/api/deals`                  |
| Receipts             | `/api/receipts`               |
| Invoices             | `/api/invoices`               |
| Users                | `/api/users`                  |
| Backup               | `/api/backup`                 |

CORS is locked to `FRONTEND_URL` (defaults to `http://localhost:3000`).
