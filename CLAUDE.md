# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A web platform for managing Algerian public procurement deals (Marchés Publics) — tracking raw materials, contracting authorities, their branches, contractors, deals, delivery receipts, invoices, users, and database backups.

## Tech Stack

| Layer    | Technology              | Local port | Hosting  |
|----------|-------------------------|------------|----------|
| Frontend | Next.js 16 + Tailwind 4 | 3000       | Netlify  |
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
- `app/layout.js` — sets `lang="ar" dir="rtl"`, loads Tajawal font
- `src/lib/supabase.js` — anon-key Supabase client + `testConnection()` utility
- `src/lib/api.js` — axios instance with Arabic error interceptor
- `app/api/test-connection/route.js` — Next.js API route for connection health check
- `src/data/` — static reference datasets bundled with the frontend (e.g. `algeria-wilayas.js`: all 58 wilayas with their communes in Arabic, keyed by `code`). Import directly; these are not fetched from the API.

### Backend (`backend/src/`)

`server.js` imports all route files and mounts them under `/api/<section>`. Logic lives in `controllers/` — routes are thin and only wire up multer and call the controller.

- `config/db.js` — exports a `pg.Pool`. **Critical quirk:** Supabase wraps passwords that contain special characters in `[...]` in the connection string — `db.js` strips those brackets before passing credentials to pg.
- `controllers/rawMaterialsController.js` — the reference implementation for all future controllers: pagination+search on GET, input validation returning Arabic error messages, Supabase Storage upload via service-role client. `materialCategoriesController.js`, `contractingAuthorityController.js`, and `authorityBranchesController.js` follow the same shape (list with `page`/`search` query params + pagination envelope, `getById`, `create`/`update` with shared field validation, `remove`).
- `middleware/auth.js` — validates Supabase JWT via `supabase.auth.getUser(token)` (service role key). **Not currently applied to any route** — routes are unprotected until a section wires it in.
- `middleware/validation.js` — a generic Joi-schema `validate()` wrapper. Scaffolded but unused; controllers currently do validation inline instead (see `rawMaterialsController.js`).
- `routes/users.js` — uses Supabase Admin API instead of pg (no `users` table).
- `routes/rawMaterials.js` — declares `/upload-image` **before** `/:id` to prevent route conflict; uses multer memory storage (5 MB limit, images only).
- `routes/contractor.js`, `deals.js`, `receipts.js`, `invoices.js`, `backup.js` — **stub routes**, not yet backed by a controller or migration. They query pg tables (`deals`, …) that don't exist yet, or return `{ message: "... — to be implemented" }` placeholders. Follow the "Adding a New Section" pattern below to flesh one out.
- `utils/email.js` — `sendEmail()` stub used by `routes/backup.js`; only logs to console, no provider (nodemailer/Resend/SendGrid) configured yet.

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

Note the numbering gap in section names vs files: `contracting-authority` is section 2 in the UI/route table below but its migration is `004` (`003` was already taken by `material_categories`). Don't assume section order matches migration number.

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

## API Route Conventions

| Section              | Base path                     |
|----------------------|-------------------------------|
| Raw Materials        | `/api/raw-materials`          |
| Material Categories  | `/api/material-categories`    |
| Contracting Auth.    | `/api/contracting-authority`  |
| Authority Branches   | `/api/authority-branches`     |
| Contractor           | `/api/contractor`             |
| Deals                | `/api/deals`                  |
| Receipts             | `/api/receipts`               |
| Invoices             | `/api/invoices`               |
| Users                | `/api/users`                  |
| Backup               | `/api/backup`                 |

CORS is locked to `FRONTEND_URL` (defaults to `http://localhost:3000`).
