# Yakin Group — Setup Guide

## Prerequisites

- Node.js v22+
- pnpm v9+ (`npm install -g pnpm`)
- PostgreSQL 16
- Git

## Step 1 — Install dependencies

```bash
pnpm install
```

## Step 2 — Configure environment

```bash
cp .env.example .env
```

Edit `.env` and fill in:
- `DATABASE_URL` — your PostgreSQL connection string
- `JWT_ACCESS_SECRET` — generate: `openssl rand -base64 64`
- `JWT_REFRESH_SECRET` — generate: `openssl rand -base64 64`
- `CLOUDINARY_*` — from cloudinary.com (free account)

## Step 3 — Set up database

```bash
# Create and run migrations
pnpm db:migrate

# Seed initial data (roles, admin user, chart of accounts)
pnpm db:seed
```

Default admin credentials (change immediately after login):
- Email: `admin@yakingroup.com`
- Password: `Admin@12345`

## Step 4 — Start development

```bash
# Start all three apps simultaneously
pnpm dev
```

Individual apps:
```bash
# API only (port 3001)
pnpm --filter @yakin/api dev

# Admin panel only (port 3000)
pnpm --filter @yakin/admin dev

# Mobile app
pnpm --filter @yakin/mobile dev
```

## Step 5 — Mobile development

Install Expo Go on your phone (Android/iOS), then scan the QR code shown in the terminal.

## Step 6 — View database

```bash
pnpm db:studio
```
Opens Prisma Studio at http://localhost:5555

## API Endpoints

| Method | Route | Description |
|--------|-------|-------------|
| POST | /api/auth/login | Login |
| POST | /api/auth/refresh | Refresh token |
| POST | /api/auth/logout | Logout |
| GET  | /api/auth/me | Current user |
| GET  | /api/dashboard/stats | Dashboard KPIs |
| GET  | /api/members | List members |
| POST | /api/members | Create member |
| GET  | /api/accounting/accounts | Chart of accounts |
| POST | /api/accounting/journal-entries | Create journal entry |
| GET  | /health | Health check |

## Data Safety

- All records use **soft deletes** — data is NEVER permanently deleted
- Financial journal entries are **immutable** after posting
- All monetary values stored as **integer paisa** (no floating point)
- Every operation writes to **audit_logs** table
- Passwords hashed with **bcrypt** (cost factor 12)
- **2FA** (TOTP) available for all users
