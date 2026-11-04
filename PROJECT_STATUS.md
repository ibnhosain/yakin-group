# Yakin Group — Project Status & Handoff

> এই ফাইল প্রতিটি কাজের শেষে আপডেট করতে হবে।  
> Last updated: 2026-11-04 (session 2)

---

## Stack

| Layer | Tech |
|---|---|
| Mobile | Expo SDK 52 (React Native) — `apps/mobile/` |
| Admin UI | Next.js 15 App Router (Bengali) — `apps/admin/` |
| API | Fastify v4 + Zod + Prisma ORM — `apps/api/` |
| Database | PostgreSQL (embedded-postgres locally, Render DB in prod) |
| Auth | JWT access+refresh, bcrypt, TOTP 2FA |
| Monorepo | Turborepo + pnpm workspaces |
| Shared packages | `@yakin/types`, `@yakin/utils` |

---

## Local Setup

```bash
# Terminal 1 — DB (keep running)
pnpm db:start

# Terminal 2 — first time only
pnpm db:migrate && pnpm db:seed

# Terminal 3 — API (port 3001)
pnpm --filter @yakin/api dev

# Terminal 4 — Admin (port 3000)
pnpm --filter @yakin/admin dev
```

Admin login: `admin@yakingroup.com` / `Admin@12345`

---

## Deployment

- Platform: **Render.com**
- Config: `render.yaml` (root)
- Auto-deploy: ✅ চালু — `git push` করলেই Render নিজে deploy করবে
- API URL: `https://yakin-api-owex.onrender.com`
- Admin URL: `https://yakin-admin.onrender.com`

> **Note:** `render.yaml` পরিবর্তনের পর Render dashboard থেকে একবার Blueprint sync করতে হবে।

---

## ✅ সম্পন্ন কাজ

### Phase 1 — Foundation
- [x] Turborepo monorepo setup (pnpm workspaces)
- [x] `@yakin/types` shared TypeScript types
- [x] `@yakin/utils` shared utilities (formatTaka, formatDate, toBengaliNumber)
- [x] Prisma schema — সব model (User, Member, Investor, Employee, Business, Project, Property, Meeting, Document, Account, JournalEntry, etc.)
- [x] embedded-postgres local dev setup (`scripts/start-db.mjs`)
- [x] Database seed (`prisma/seed.ts`) — roles, accounts, admin user

### Phase 2 — API (Fastify)
- [x] JWT auth middleware (`preHandler`)
- [x] `POST /api/auth/login` — email+password, returns access+refresh token
- [x] `GET /api/dashboard/stats`
- [x] `GET/POST /api/members` — member CRUD
- [x] `GET/:id /api/members/:id`
- [x] `GET/PATCH /api/approvals`
- [x] `GET/POST /api/investors` — User+Investor transaction
- [x] `GET/:id /api/investors/:id`
- [x] `GET/POST /api/hr/employees` — User+Employee transaction
- [x] `GET/:id /api/hr/employees/:id`
- [x] `GET /api/hr/departments`
- [x] `GET /api/hr/designations`
- [x] `GET/POST /api/businesses`
- [x] `GET/:id /api/businesses/:id`
- [x] `GET /api/businesses/categories`
- [x] `GET/POST /api/projects`
- [x] `GET/:id /api/projects/:id`
- [x] `PATCH/:id /api/projects/:id`
- [x] `GET/POST /api/properties`
- [x] `GET/:id /api/properties/:id`
- [x] `GET/POST /api/meetings`
- [x] `GET/:id /api/meetings/:id`
- [x] `PATCH/:id/status /api/meetings/:id/status`
- [x] `GET/POST /api/documents`
- [x] `GET /api/documents/categories`
- [x] `DELETE/:id /api/documents/:id`
- [x] `GET /api/accounting/accounts`
- [x] `GET /api/accounting/trial-balance`
- [x] `GET/POST /api/accounting/journal-entries`
- [x] `GET /api/dashboard/monthly-financials`
- [x] `GET/PATCH /api/notifications`
- [x] `GET/PATCH /api/settings`

### Phase 3 — Admin UI (Next.js)
- [x] Layout — sidebar, top nav, Bengali font (Hind Siliguri)
- [x] `/dashboard` — KPI cards, monthly income/expense bar chart
- [x] `/members` — list, new form, detail page
- [x] `/approvals` — list with approve/reject
- [x] `/investors` — list, new form, detail page
- [x] `/hr` — list, new form, detail page
- [x] `/businesses` — list, new form, detail page (projects + employees)
- [x] `/projects` — list, new form, detail page (progress bar, tasks, milestones)
- [x] `/properties` — list, new form, detail page
- [x] `/meetings` — list, new form, detail page (status change modal)
- [x] `/documents` — list, new form, detail page (delete confirm)
- [x] `/accounting` — overview chart, chart of accounts table, journal entry form
- [x] `/notifications` — notification list
- [x] `/settings` — 4 tabs (general, security, notifications, roles)

### Phase 4 — DevOps
- [x] `render.yaml` — API + Admin + PostgreSQL on Render.com
- [x] Auto-deploy চালু (`autoDeploy: true`)

---

## ❌ বাকি কাজ

### High Priority

#### 1. API — Missing routes
- [x] `GET /api/documents/:id` — ✅ done
- [x] `PATCH /api/investors/:id` — ✅ done
- [x] `PATCH /api/hr/employees/:id` — ✅ done
- [x] `PATCH /api/businesses/:id` — ✅ done (includes status change)
- [ ] `GET /api/accounting/journal-entries/:id` — single entry detail
- [ ] `POST /api/members/:id` — member update route missing

#### 2. Admin UI — Missing pages/features
- [x] `/investors/[id]` — field names fixed, edit modal added, bank info section ✅
- [x] `/hr/[id]` — field names fixed (user.*, attendance, emergencyPhone), edit modal + status change ✅
- [x] `/businesses/[id]` — status toggle + edit modal ✅
- [x] `/documents/[id]` — now uses GET /api/documents/:id directly ✅
- [x] `/accounting` — journal Post button added ✅
- [ ] `/projects/[id]` — task add/edit, milestone add/edit
- [ ] `/properties/[id]` — transaction (buy/sell) যোগ করা
- [ ] `/members/[id]` — edit form নেই

#### 3. Mobile App (Expo)
- [ ] `apps/mobile/` — সব screen বাকি (শুধু boilerplate আছে)
- [ ] Login screen
- [ ] Dashboard screen
- [ ] Member/Investor portal screens
- [ ] Push notifications

### Medium Priority

#### 4. Reports & Export
- [ ] PDF export — member list, investor statement, employee payslip
- [ ] Excel export — accounting ledger, trial balance
- [ ] Print-friendly views

#### 5. Advanced Accounting
- [ ] Ledger view per account (account-wise transaction history)
- [ ] Profit & Loss statement page
- [ ] Balance Sheet page
- [ ] Cash Flow statement

#### 6. HR Module
- [ ] Monthly payroll processing (salary sheet)
- [ ] Leave management (apply/approve)
- [ ] Attendance bulk import

#### 7. Notifications
- [ ] Email notifications (nodemailer/Resend)
- [ ] Real-time notifications (WebSocket বা SSE)

---

## গুরুত্বপূর্ণ নিয়ম (ভুলবেন না)

| বিষয় | নিয়ম |
|---|---|
| টাকা | সব amount **paisa** (integer) হিসেবে store — 1 BDT = 100 paisa |
| নতুন Investor তৈরি | User + Investor `$transaction` — আগে User, তারপর Investor (userId FK) |
| নতুন Employee তৈরি | User + Employee `$transaction` — আগে User, তারপর Employee (userId FK) |
| Soft delete | `deletedAt` field ব্যবহার — রেকর্ড delete নয়, hide |
| Business model | `investments` relation নেই — `projects` ও `employees` আছে |
| Employee relation | `attendance` (singular) — `attendances` নয় |
| Role names | `'member'`, `'investor'`, `'employee'`, `'admin'`, `'super_admin'` |
| Default password | নতুন investor/employee-এ password না দিলে `Yakin@2024` |
| Bengali UI | সব label ও message বাংলায়, font: Hind Siliguri |

---

## File Structure (মূল ফাইল)

```
apps/
  api/src/routes/          ← Fastify route files
  admin/src/app/(dashboard)/   ← Next.js page files
  mobile/                  ← Expo (খালি)
packages/
  types/src/index.ts       ← Shared TypeScript types
  utils/src/index.ts       ← formatTaka, formatDate, etc.
prisma/
  schema.prisma            ← Database schema
  seed.ts                  ← Seed data
render.yaml                ← Render.com deployment config
PROJECT_STATUS.md          ← এই ফাইল — আপডেট রাখুন
```

---

## Update Log

| তারিখ | কাজ |
|---|---|
| 2026-11-03 | Foundation, auth, all list pages, approval/notification/settings |
| 2026-11-03 | Members, investors, HR, businesses create+detail pages |
| 2026-11-04 | Projects, properties, meetings, documents CRUD pages + API |
| 2026-11-04 | Schema mismatch fix (businesses/investors/employees), journal entry form |
| 2026-11-04 | Auto-deploy চালু (render.yaml), PROJECT_STATUS.md তৈরি |
| 2026-11-04 | PATCH routes (investors/employees/businesses), GET documents/:id, edit modals on detail pages, journal Post button |
