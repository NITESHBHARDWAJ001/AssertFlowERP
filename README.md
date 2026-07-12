# AssetFlow — Enterprise Asset & Resource Management Platform

Multi-tenant SaaS ERP foundation: multi-tenant auth/RBAC, organizations, departments, and
employees. This is the base layer — every future module (Assets, Bookings, Maintenance,
Audits, Reports, Notifications, Analytics) plugs into the same tenant-scoping and RBAC
middleware established here.

## Architecture

- **Backend**: Node.js, Express, TypeScript, Prisma ORM, PostgreSQL. Layered as
  routes → controllers → services (Prisma is the repository layer). See
  [backend/src](backend/src).
- **Frontend**: React, TypeScript, Vite, Tailwind CSS, React Router, React Query,
  React Hook Form + Zod, TanStack Table, Axios, React Hot Toast. Feature-based folder
  structure under [frontend/src/features](frontend/src/features).
- **Multi-tenancy**: every business record belongs to one `Organization`. The backend
  never trusts an `organizationId` supplied by the client — it is always derived from
  the authenticated user's JWT (`req.user.organizationId`, set by the `authenticate`
  middleware) and injected into every Prisma query. See
  [backend/src/middleware/authorize.ts](backend/src/middleware/authorize.ts)
  (`requireOrganization`).

## Roles

`SUPER_ADMIN` → `ORG_ADMIN` → `ASSET_MANAGER` / `DEPARTMENT_HEAD` → `EMPLOYEE`.
Route access is gated server-side via the `authorize(...roles)` middleware and
mirrored client-side via a data-driven nav config
([frontend/src/lib/navConfig.ts](frontend/src/lib/navConfig.ts)) and `ProtectedRoute`.

## Prerequisites

- Node.js 20+ (repo tested on Node 22.9)
- A running PostgreSQL instance

## Setup

### 1. Backend

```bash
cd backend
cp .env.example .env   # then edit DATABASE_URL, JWT secrets, SUPER_ADMIN_EMAIL/PASSWORD
npm install
npm run prisma:migrate   # creates the schema
npm run prisma:seed      # creates the one platform Super Admin
npm run dev               # http://localhost:4000
```

### 2. Frontend

```bash
cd frontend
cp .env.example .env   # VITE_API_URL defaults to http://localhost:4000/api
npm install
npm run dev              # http://localhost:5173
```

Log in with the `SUPER_ADMIN_EMAIL` / `SUPER_ADMIN_PASSWORD` from `backend/.env`. As
Super Admin, create an Organization (this also creates that org's first Org Admin) from
the Organizations page. Log in as that Org Admin to manage Departments and Employees.

## What's implemented

- JWT auth: login, silent refresh-token rotation, logout, forgot/reset password
  (Nodemailer — logs to console in dev if `SMTP_HOST` is unset).
- RBAC middleware (`authorize`) and tenant-scoping helper (`requireOrganization`).
- Organizations (Super Admin): create (with first Org Admin), list, suspend, activate.
- Departments & Employees (Org Admin): CRUD, scoped to the caller's organization.
- **Asset Categories**: org-defined categories with custom metadata field schemas.
- **Asset Management**: register, auto-generated asset tags, QR code generation, 9-status
  lifecycle state machine (Registered → Available → Allocated/Reserved/Maintenance →
  Returned → Retired → Disposed), role-scoped visibility, search/filter, image and
  document uploads (Cloudinary in production, local disk fallback under
  `backend/uploads` in dev — see `backend/src/utils/storage.ts`).
- **Asset Allocation workflow**: Employee request → Department Head approval → Asset
  Manager approval (picks the specific asset) → Allocated, plus self-service Return with
  condition notes.
- Activity log: every mutation across every module is recorded with who/what/when/IP,
  scoped per-organization.
- Frontend shell: protected/role-gated routing, dark mode toggle, mobile responsive nav
  (hamburger drawer), sidebar/topbar/breadcrumbs, reusable UI primitives (Button, Card,
  Modal, DataTable, FormField, Badge, StatCard, AssetStatusBadge), per-role dashboard KPI
  placeholders.

Also implemented: Resource Booking (conflict detection), Maintenance (raise → approve →
assign → resolve), Audit Management (cycles, discrepancy reports), Notifications,
Reports (CSV/Excel/PDF export), Analytics (charts), and Settings (asset prefix, booking
and maintenance approval rules).

## Deploying the backend (Docker)

`backend/Dockerfile` builds a production image in three stages (install → build →
runtime) and ships a small Debian-slim image, not Alpine — `bcrypt` is a native module
and Prisma's query engine needs `libssl`, both more reliable there than chasing
musl/Alpine prebuilt-binary mismatches.

**The container always migrates before it serves traffic.** `docker-entrypoint.sh` runs
`prisma migrate deploy` (applies whatever migrations are already committed under
`backend/prisma/migrations` — it never generates new ones or prompts) and only then
starts `node dist/server.js`, using `exec` so the process receives shutdown signals
directly. This runs on every container start, not just the first one, so a redeploy
always reconciles the schema first.

```bash
cd backend
docker build -t assetflow-backend .
docker run -p 4000:4000 \
  -e DATABASE_URL="postgresql://user:pass@host:5432/db?schema=public" \
  -e JWT_ACCESS_SECRET="…" \
  -e JWT_REFRESH_SECRET="…" \
  -e CORS_ORIGIN="https://your-frontend.example.com" \
  -e FRONTEND_URL="https://your-frontend.example.com" \
  assetflow-backend
```

Required env vars: `DATABASE_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`. See
`backend/.env.example` for the full list (SMTP, Cloudinary, asset tag prefix are all
optional with sane dev-mode fallbacks). On Railway/Render: point the service at
`backend/Dockerfile`, set the same env vars in their dashboard, and each deploy will run
migrations automatically via the entrypoint above — no separate "run migration" build
step needed.

**Local verification before you push:** `docker compose up --build` from the repo root
builds the same image, starts a throwaway Postgres, and runs the backend against it —
copy `.env.example` to `.env` first (repo root) for the JWT secrets. Watch the logs for
`AssetFlow API: applying database migrations` followed by `AssetFlow API: starting
server`; `curl http://localhost:4000/health` should return `{"status":"ok"}` once it's
up. The image also carries a `HEALTHCHECK` hitting the same endpoint.

The Super Admin still needs seeding once — that's a manual step, not part of the
container's automatic startup (seeding on every restart would be unnecessary DB calls,
even though the script itself is idempotent): run
`DATABASE_URL="<production-url>" npm run prisma:seed` from `backend/` on your machine,
pointed at the production database.

## File uploads

Set `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` in
`backend/.env` to upload to Cloudinary. Leave them blank and uploads are written to
`backend/uploads/` and served from `/uploads/...` — no external account needed for
local development.

## Verifying tenant isolation

Two organizations, each with their own Org Admin, are isolated from each other purely
by server-side JWT-derived scoping — no client input can cross tenant boundaries. To
verify: create two orgs as Super Admin, log in as each org's admin in turn, and confirm
neither can see the other's departments/employees/activity log.
 . 
