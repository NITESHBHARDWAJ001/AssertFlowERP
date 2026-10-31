# AssetFlow / AssertERP Project Details

## 1. Product Summary

AssetFlow is a multi-tenant enterprise asset and resource management platform. It helps organizations register and track physical assets, assign assets to employees, control requests and transfers, schedule shared resources, manage maintenance, run audits, and understand utilization through reports and analytics.

The repository contains:

- A React and TypeScript web application for daily operations.
- An Express and TypeScript API for authentication, authorization, workflows, reporting, and file handling.
- A PostgreSQL database managed through Prisma migrations.
- A demo-data seed that creates a complete organization with realistic records across the modules.

The product is designed for organizations that need a single source of truth for equipment, facilities, shared resources, ownership, approvals, maintenance history, and audit evidence.

## 2. Intended Users and Business Outcomes

### Primary users

- Platform operators who manage multiple customer organizations.
- Organization administrators who configure one organization and its users.
- Asset managers who operate the inventory and approval workflows.
- Department heads who approve requests and oversee department assets.
- Employees who request, use, return, and report issues with assets or shared resources.
- Auditors who verify physical assets and record discrepancies.

### Business outcomes

- Know where every asset is, who holds it, and what condition it is in.
- Reduce manual approval and email-based tracking.
- Prevent double-booking of shared rooms, vehicles, and equipment.
- Keep maintenance and audit evidence attached to the relevant records.
- Provide role-appropriate dashboards, reports, analytics, notifications, and activity history.
- Keep each organization isolated from every other organization at the database-query boundary.

## 3. System Architecture

### Frontend

- React 19 with TypeScript.
- Vite development and production build tooling.
- React Router for public and protected routes.
- TanStack React Query for server state and cache invalidation.
- React Hook Form and Zod for form state and validation.
- Tailwind CSS for styling.
- Recharts for analytics visualizations.
- Axios for API calls.

The frontend is organized by feature under `frontend/src/features`. The sidebar is role-aware and is defined centrally in `frontend/src/lib/navConfig.ts`. Protected routes are enforced through `ProtectedRoute`.

### Backend

- Node.js with Express and TypeScript.
- Prisma ORM with PostgreSQL.
- Layered module structure: routes, controllers, services, validators, and Prisma queries.
- JWT access tokens with rotating refresh tokens.
- bcrypt password hashing.
- Helmet, CORS, JSON parsing, request logging, validation, and centralized error handling.
- Local disk uploads in development, with optional Cloudinary storage for production.

The API is mounted below `/api`. The health endpoint is `GET /health`.

### Data isolation

Every organization-owned business record is scoped using the organization ID from the authenticated JWT. The API does not trust a client-supplied organization ID for tenant-scoped operations. `requireOrganization` rejects requests that do not have an organization context, which keeps the platform-level Super Admin separate from tenant data.

## 4. Roles and Permission Model

The role hierarchy is:

`SUPER_ADMIN -> ORG_ADMIN -> ASSET_MANAGER / DEPARTMENT_HEAD -> EMPLOYEE`

Permissions are enforced on the server with `authenticate` and `authorize` middleware. The frontend mirrors the same access model in route guards and navigation, but the backend remains the source of truth.

| Role | Scope | Main responsibilities |
| --- | --- | --- |
| Super Admin | Platform-wide | Create, suspend, and activate organizations; view the platform organization list; create the first organization administrator. |
| Organization Admin | One organization | Manage departments and users, assign roles, manage categories, register assets, manage audits, view reports and analytics, configure organization rules. |
| Asset Manager | One organization | Operate inventory, allocate assets, decide asset-manager approvals, manage resources and bookings, approve transfers and maintenance, track lifecycle status. |
| Department Head | Assigned department and permitted organization views | Review department asset requests, approve transfers, view department assets and reports, book shared resources, participate in audits. |
| Employee | Own organization and assigned assets | Sign up or use an assigned account, request assets, view assigned assets, return assets, raise maintenance requests, book resources, and submit transfer requests. |

### Important role rules

- Public signup always creates an `EMPLOYEE` in an existing organization identified by its slug.
- A user cannot self-select an elevated role through signup.
- Organization-admin user creation is the supported path for elevated tenant roles.
- Super Admin has no organization ID and therefore cannot use tenant-scoped operations as an organization user.
- Suspended organizations cannot authenticate successfully.

## 5. Feature and Module Map

### 5.1 Authentication and account access

**Frontend:** Login, signup, forgot-password, and reset-password pages.

**Backend API:** `/api/auth`

**Capabilities:**

- Email and password login.
- Self-service employee signup by organization slug.
- Access-token and refresh-token session management.
- Refresh-token rotation and revocation on logout.
- Current-user lookup.
- Password reset tokens with expiry and one-time use.
- Development mail fallback that logs email content when SMTP is not configured.

**Use case:** An employee joins an existing organization using its public slug, while administrators create users who need elevated roles.

### 5.2 Organization administration

**Frontend:** Organizations page.

**Backend API:** `/api/organizations`

**Capabilities:**

- Create an organization and its first Organization Admin in one operation.
- List organizations with user and department counts.
- Suspend or activate an organization.
- Keep organization plan, status, branding, asset tag settings, and workflow rules.

**Use case:** A platform operator onboards a new customer, gives it an admin account, and suspends access when necessary.

### 5.3 Departments and employees

**Frontend:** Departments and Employees pages.

**Backend API:** `/api/departments`, `/api/users`

**Capabilities:**

- Create, update, and deactivate organization employees.
- Assign roles and departments.
- Create department hierarchy with optional parent departments.
- Assign department heads.
- Use department membership for request approvals and asset visibility.

**Use case:** An organization admin models the company structure, creates users, promotes selected users to operational roles, and assigns them to departments.

### 5.4 Asset categories

**Frontend:** Asset Categories page.

**Backend API:** `/api/asset-categories`

**Capabilities:**

- Create and edit organization-owned categories.
- Add optional custom fields with `text`, `number`, `date`, or `boolean` types.
- Show category-level asset counts.
- Prevent category configuration from crossing organization boundaries.

**Use case:** An asset manager creates an IT Equipment category with fields such as CPU and RAM before registering laptops.

### 5.5 Asset inventory and lifecycle

**Frontend:** Assets list and asset detail pages.

**Backend API:** `/api/assets`

**Capabilities:**

- Register assets against categories.
- Generate organization-specific asset tags atomically, such as `MF-00001`.
- Store serial number, vendor, purchase date, purchase cost, warranty expiry, location, condition, notes, department, and current holder.
- Search by name, asset tag, or serial number.
- Filter by status, category, and location.
- View lifecycle history and asset details.
- Generate and store QR codes.
- Upload asset images and documents.
- Update lifecycle status using server-side transition rules.
- Allocate assets to holders and return them with condition notes.
- Track asset transfers through approval requests.

**Asset statuses:**

`REGISTERED`, `AVAILABLE`, `ALLOCATED`, `TRANSFERRED`, `RESERVED`, `MAINTENANCE`, `RETURNED`, `LOST`, `RETIRED`, `DISPOSED`

**Use case:** An asset manager registers a laptop, assigns it to an employee, records a transfer to another employee, receives it back, sends it for maintenance, and eventually retires or disposes of it.

### 5.6 Asset request and allocation workflow

**Frontend:** Asset Requests page.

**Backend API:** `/api/asset-requests`

**Workflow:**

1. An employee requests an asset category and optionally gives a reason and expected return date.
2. The request enters `PENDING_DEPT_HEAD`.
3. The department head or organization admin approves or rejects it.
4. An approved request enters `PENDING_ASSET_MANAGER`.
5. The asset manager or organization admin selects a specific available asset.
6. The request becomes `ALLOCATED`, and the selected asset is assigned to the employee.
7. The employee or an authorized manager returns the asset when finished.

**Request statuses:** `PENDING_DEPT_HEAD`, `PENDING_ASSET_MANAGER`, `ALLOCATED`, `REJECTED`, `CANCELLED`

This workflow separates business approval from physical inventory assignment, which prevents an approval from implying that a particular asset has already been issued.

### 5.7 Asset transfer workflow

**Frontend:** Asset detail page.

**Backend API:** `/api/asset-transfers`

**Capabilities:**

- Request transfer of an allocated asset to another holder.
- Add a transfer reason.
- Approve or reject a transfer.
- Cancel pending requests.
- Record the deciding user and decision note.
- Update the asset holder after approval.

**Transfer statuses:** `PENDING`, `APPROVED`, `REJECTED`, `CANCELLED`

### 5.8 Resource management and booking

**Frontend:** Resources and Bookings pages.

**Backend API:** `/api/resources`, `/api/bookings`

**Resource types:** `MEETING_ROOM`, `VEHICLE`, `PROJECTOR`, `EQUIPMENT`

**Capabilities:**

- Create bookable resources with type, location, capacity, and description.
- Submit bookings with a purpose and time window.
- Detect overlapping bookings for the same resource.
- Approve or reject bookings according to organization settings.
- Reschedule and cancel eligible bookings.
- Display workflow status plus temporal state: upcoming, ongoing, or completed.

**Use case:** An employee books a conference room for a meeting; an authorized manager approves it unless automatic approval is enabled.

### 5.9 Maintenance management

**Frontend:** Maintenance page.

**Backend API:** `/api/maintenance`

**Workflow:**

1. A user raises a maintenance request for an asset.
2. The request is approved or rejected when approval is required.
3. An authorized manager assigns a technician.
4. The technician or manager starts the work.
5. The request is resolved with a resolution note.
6. Photos can be attached during the process.
7. The asset status is synchronized with the maintenance workflow where applicable.

**Priorities:** `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`

**Statuses:** `PENDING`, `APPROVED`, `TECHNICIAN_ASSIGNED`, `IN_PROGRESS`, `RESOLVED`, `REJECTED`

### 5.10 Audit management

**Frontend:** Audit Cycles and Audit Cycle Detail pages.

**Backend API:** `/api/audits`

**Capabilities:**

- Create an audit cycle and assign an auditor.
- Automatically include active assets in the cycle.
- Verify individual assets.
- Mark assets as verified, missing, or damaged with notes.
- View discrepancy totals for verified, missing, damaged, and pending items.
- Close the audit cycle.
- Notify relevant users about assignments and discrepancies.

**Audit statuses:** `DRAFT`, `IN_PROGRESS`, `CLOSED`

**Use case:** An organization admin starts a quarterly inventory audit, an auditor checks each asset physically, and management reviews discrepancies before closing the cycle.

### 5.11 Notifications

**Frontend/API support:** Notification data is generated by workflows and exposed through `/api/notifications`; the navigation and shell provide the notification experience.

Notification types include asset assignment, transfer decisions, booking decisions, maintenance events, audit assignments and discrepancies, overdue returns, return reminders, warranty expiry, and asset-request decisions.

### 5.12 Reports and analytics

**Frontend:** Reports and Analytics pages.

**Backend API:** `/api/reports`, `/api/analytics`

**Capabilities:**

- Export operational data as CSV, Excel, and PDF where supported by the report type.
- View asset utilization and allocation metrics.
- View assets by category, department, and status.
- View booking activity by day of week.
- View maintenance trends over six months.
- View monthly allocation trends.
- Compare department asset and maintenance activity.

Reports are available to Organization Admins, Asset Managers, and Department Heads. Analytics use organization-scoped data.

### 5.13 Organization settings

**Frontend:** Settings page.

**Backend API:** `/api/settings`

**Capabilities:**

- Update organization name.
- Change the asset tag prefix for future assets.
- Turn booking approval on or off.
- Turn maintenance approval on or off.
- Display the role permission summary.

When booking approval is disabled, new bookings can be approved automatically. When maintenance approval is disabled, new maintenance requests can move directly into the active workflow according to backend rules.

### 5.14 Activity log and audit history

**Frontend:** Activity Log page.

**Backend API:** `/api/activity-logs`

The application records important mutations with the actor, action, entity type, entity ID, timestamp, IP address, and optional metadata. This gives administrators an operational trail for authentication, user changes, asset changes, approvals, and other business events.

## 6. Role-to-Feature Mapping

| Feature | Super Admin | Org Admin | Asset Manager | Department Head | Employee |
| --- | --- | --- | --- | --- | --- |
| Dashboard | Yes | Yes | Yes | Yes | Yes |
| Organizations | Full | No | No | No | No |
| Departments | No | Full | No | No | No |
| Employees and roles | No | Full | No | No | No |
| Asset categories | No | Full | View/use | View/use | View/use |
| Register assets | No | Yes | Yes | No | No |
| View assets | Platform context only | Organization | Organization | Department-oriented | Assigned/allowed assets |
| Asset requests | No | Review | Review/allocate | Approve department requests | Create/cancel own requests |
| Asset transfers | No | Decide | Decide | Decide where permitted | Request/cancel own transfer |
| Resources | No | Full | Full | Use shared resources | Use shared resources |
| Bookings | No | Decide/manage | Decide/manage | Create/manage own | Create/manage own |
| Maintenance | No | Decide/manage | Decide/manage | Raise/use workflow | Raise/use workflow |
| Audits | No | Create/manage/close | Verify/manage | Participate where assigned | View/use where allowed |
| Reports | No | Yes | Yes | Yes | No |
| Analytics | No | Yes | Yes | Yes | No |
| Settings | No | Full | No | No | No |
| Activity log | No | Yes | Yes | Yes | No |

The exact action-level permission is implemented by backend route middleware and service-level ownership checks. The table describes the intended product surface; a user may see a module but still have only the actions allowed for their role and relationship to the record.

## 7. End-to-End Use Cases

### Use case A: Onboard an organization

1. Seed or log in as the Super Admin.
2. Open Organizations.
3. Create the organization, slug, plan, and first admin account.
4. The organization starts active and receives default asset and approval settings.
5. The first admin signs in and configures departments, categories, resources, and users.

### Use case B: Build the organization structure

1. The Org Admin creates departments and optional parent-child relationships.
2. The Org Admin assigns department heads.
3. The Org Admin creates employees and assigns roles and departments.
4. Employees can then use the organization slug for self-service signup if enabled by the deployment process.

### Use case C: Issue an asset to an employee

1. The Org Admin creates a category and its custom metadata fields.
2. The Asset Manager registers the physical asset.
3. An Employee submits an asset request.
4. The Department Head approves the business need.
5. The Asset Manager selects a specific available asset.
6. The platform records the holder, asset history, activity log, and notifications.

### Use case D: Transfer and return an asset

1. The current holder requests a transfer from the asset detail screen.
2. An authorized manager reviews the reason and destination holder.
3. On approval, the holder and asset history are updated.
4. The new holder or a manager returns the asset with condition notes.
5. The asset becomes available or enters the next valid lifecycle state.

### Use case E: Maintain an asset

1. A user raises a maintenance request and selects priority.
2. A manager approves it, unless automatic approval is configured.
3. A technician is assigned and starts work.
4. Photos and resolution notes are attached.
5. The request is resolved and the asset is returned to the appropriate operational state.

### Use case F: Run a physical audit

1. The Org Admin creates an audit cycle and assigns an auditor.
2. Active assets are copied into audit items.
3. The auditor marks each item verified, missing, or damaged and adds notes.
4. Managers review discrepancy totals and notifications.
5. The cycle is closed after follow-up.

### Use case G: Manage shared resources

1. An Org Admin or Asset Manager creates meeting rooms, vehicles, projectors, or equipment.
2. A user submits a time-bounded booking.
3. The API rejects conflicts and applies the organization's approval setting.
4. An authorized manager approves or rejects the booking, or the booking is automatically approved.
5. The requester can reschedule or cancel while the booking remains eligible.

## 8. Demo Data and Login Accounts

The normal seed creates only the platform Super Admin using `SUPER_ADMIN_EMAIL` and `SUPER_ADMIN_PASSWORD` from `backend/.env`.

The demo seed creates the `Meridian Facilities` organization with slug `meridian-facilities`, departments, users, categories, assets, requests, bookings, maintenance records, audit data, notifications, and activity history.

Run it from the repository root with:

```bash
cd backend
npx tsx prisma/seedDemo.ts
```

All demo accounts use this password:

```text
Demo1234!
```

Demo accounts include:

- Org Admin: `priya.nair@meridian.demo`
- Asset Managers: `rahul.sharma@meridian.demo`, `emma.bennett@meridian.demo`
- Department Heads: `liam.okafor@meridian.demo`, `sofia.rossi@meridian.demo`, `noah.kim@meridian.demo`, `aisha.khan@meridian.demo`
- Employees: `carlos.silva@meridian.demo`, `mei.chen@meridian.demo`, `ivan.petrov@meridian.demo`, `grace.walsh@meridian.demo`, `oliver.novak@meridian.demo`, `fatima.haddad@meridian.demo`, `lucas.moreau@meridian.demo`, `nadia.ivanova@meridian.demo`

The demo script is additive and skips creation when the demo organization already exists. It requires the same `DATABASE_URL` used by the backend.

## 9. Local Setup and Daily Use

### Prerequisites

- Node.js 20 or newer.
- PostgreSQL.
- npm.

### Backend

```bash
cd backend
cp .env.example .env
npm install
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
npm run dev
```

The API runs at `http://localhost:4000` by default.

### Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

The web application runs at `http://localhost:5173` by default and calls `http://localhost:4000/api`.

### Environment responsibilities

- `backend/.env` contains the PostgreSQL URL, JWT secrets, frontend/backend URLs, optional SMTP settings, optional Cloudinary settings, and Super Admin seed credentials.
- `frontend/.env` contains `VITE_API_URL`.
- The root `.env` is used by Docker Compose for local container verification.

### Database commands

```bash
cd backend
npm run prisma:migrate       # Development migration workflow
npm run prisma:deploy        # Apply committed migrations in deployment environments
npm run prisma:studio        # Browse the database with Prisma Studio
npm run prisma:seed          # Create the configured Super Admin
npx tsx prisma/seedDemo.ts   # Create the full Meridian demo tenant
```

## 10. Production and Deployment

The backend includes a multi-stage Debian-slim Dockerfile. The container entrypoint applies committed Prisma migrations before starting the API. The container does not seed the Super Admin automatically; production seeding is a deliberate manual operation against the target database.

Example production seed command:

```bash
cd backend
DATABASE_URL="postgresql://user:password@host:5432/database?schema=public" npm run prisma:seed
```

For production file storage, configure Cloudinary. Without Cloudinary settings, the development fallback writes files below `backend/uploads` and exposes them through `/uploads`.

## 11. Security and Reliability Controls

- JWT access-token authentication on protected routes.
- Refresh-token rotation and revocation.
- Passwords stored as bcrypt hashes.
- Password reset tokens stored hashed and time-limited.
- Active and soft-deleted user status rechecked during authentication.
- Suspended organizations rejected during login.
- Server-side role authorization.
- Server-derived organization scoping for tenant isolation.
- Request validation with Zod.
- Centralized API error handling.
- Helmet and configured CORS.
- Activity logging with IP metadata.
- Atomic asset-tag sequence increments.
- Booking conflict detection.
- Workflow status transitions controlled by backend services.

## 12. Repository Map

```text
backend/
  prisma/schema.prisma       Database models and enums
  prisma/migrations/         Versioned PostgreSQL schema changes
  prisma/seed.ts             Super Admin seed
  prisma/seedDemo.ts         Full Meridian demo tenant seed
  src/app.ts                 Express middleware and route registration
  src/modules/               Business modules
  src/middleware/            Auth, authorization, validation, uploads, errors
  src/utils/                 JWT, hashing, storage, QR, mail, responses

frontend/
  src/app/                   Router, protected routes, query client
  src/api/                   Typed API client functions
  src/features/              User-facing pages grouped by capability
  src/components/            Layout, icons, and reusable UI components
  src/lib/                   Auth state, navigation, and shared helpers
  src/types/                 Frontend domain types and role labels
```

## 13. Current Boundaries and Operational Notes

- The normal Prisma seed and demo seed are separate scripts. Running `npm run prisma:seed` does not create demo data.
- The demo seed skips the entire demo organization when its slug already exists; it does not refresh or merge an existing demo tenant.
- Email delivery requires SMTP configuration. In development, mail is logged when SMTP is absent.
- Cloudinary is optional for local development but should be configured for durable production uploads.
- The UI and API are separate processes during local development.
- The backend Docker entrypoint runs migrations, but production Super Admin creation remains manual.
- The application uses soft deletion in several domain models, so deletion generally means deactivation or removal from active views rather than physical database removal.

## 14. Definition of a Successful Demo Walkthrough

A complete walkthrough should be able to demonstrate:

1. Login as the demo Org Admin.
2. Review the populated dashboard, assets, reports, analytics, notifications, and activity log.
3. Login as an Employee and submit or cancel an asset request.
4. Login as a Department Head and approve the request.
5. Login as an Asset Manager and allocate a specific asset.
6. Open the asset detail, submit a transfer, and record a decision.
7. Create or review a resource booking.
8. Raise a maintenance request, assign work, upload a photo, and resolve it.
9. Create an audit cycle, verify assets, review discrepancies, and close it.
10. Change organization settings and confirm that future workflow behavior follows the selected approval rules.
