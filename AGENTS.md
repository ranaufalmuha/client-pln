# AGENTS.md

## Project Overview

PLN Client - Desktop application for PLN (Indonesian electricity utility) built with:
- **Frontend**: Tauri + React + TypeScript + Vite + Tailwind CSS v4
- **Backend**: Rust (Axum) + GraphQL (async-graphql) + PostgreSQL
- **Package Manager**: pnpm (frontend), Cargo (Rust)

## Workspace Structure

```
.
├── app/                    # Tauri desktop app (React + TS frontend)
│   ├── src/               # React app source
│   └── src-tauri/         # Tauri Rust shell
├── services/api/          # GraphQL API server
├── packages/
│   ├── database/          # sqlx connection pool
│   ├── types/             # Shared Rust types
│   └── utils/             # Shared utilities
└── infra/docker/          # PostgreSQL compose
```

## Development Commands

Use `just` (not Make) for task running:

```bash
# Full stack dev (runs API + DB)
just backend

# Frontend only (Vite dev server on port 1420)
just frontend

# Mobile dev
just frontend-android   # Run on Android device (requires API on local network)

# Individual services
just api        # cargo watch -x "run -p api --bin api" (port 4000)
just db         # Docker PostgreSQL (port 5432)
just down       # Stop Docker containers

# Rust maintenance
just fmt        # cargo fmt
just check      # cargo check
```

## Environment Setup

Two separate `.env` files required:

**Root `.env`** (backend):
```bash
API_HOST=0.0.0.0
API_PORT=4000
DATABASE_URL=postgres://app:password@localhost:5432/pln_db
JWT_SECRET=change-this-to-a-long-random-secret
```

**`app/.env`** (frontend):
```bash
VITE_GRAPHQL_URL=http://localhost:4000/graphql
VITE_APP_BRAND_NAME=PLN Dashboard
VITE_REPORT_WHATSAPP_PHONE=6280000000000
VITE_REPORT_TIMEZONE_LABEL=WIB
```

Copy from `.env.example` files in each location.

## Architecture Notes

### Frontend (app/)
- **Custom router** at `shared/lib/app-router.tsx` (NOT React Router)
- **Auth persistence**: localStorage keys `pln-client:jwt`, `pln-client:user`
- **API client**: `shared/lib/graphql-client.ts` - plain fetch to localhost:4000
- **Vite port**: 1420 (strict, required by Tauri)
- **Path alias**: `@/` maps to `./src/`
- **Styling**: Tailwind CSS v4 with `@tailwindcss/vite` plugin

### Backend (services/api/)
- **Entry**: `main.rs` - creates PgPool, bootstraps schema, starts Axum server
- **GraphQL endpoint**: `POST /graphql` (CORS enabled for localhost:1420)
- **Auth**: JWT tokens with Argon2 password hashing
- **Schema**: defined in `graphql/query.rs` and `graphql/mutation.rs`

### Database
- **Bootstrap**: `bootstrap.rs` runs programmatic migrations on startup (NOT sqlx-cli)
- **Pool**: `packages/database/src/lib.rs` configures 10 max connections, 5s timeout
- **Retry logic**: API retries DB connection 4 times with 3s delays
- **Default data**: Seeded unit categories (GITET, GI types) and placeholder units

## Critical Implementation Details

1. **Frontend-Backend Communication**: Uses HTTP fetch to `VITE_GRAPHQL_URL`, NOT Tauri commands. The Tauri shell is essentially a browser wrapper.

2. **Schema Migrations**: Do NOT use `sqlx migrate`. Schema is managed programmatically in `bootstrap.rs` with idempotent `CREATE TABLE IF NOT EXISTS` and `ALTER TABLE ADD COLUMN IF NOT EXISTS` statements.

3. **Required Startup Order**: Database → API → Frontend
   - API will retry DB connection but fail after 4 attempts
   - Frontend requires API to be available for GraphQL queries

4. **Auth Flow**:
   - Login mutation returns `{ token, user }`
   - Token stored in localStorage (`JWT_STORAGE_KEY`)
   - Subsequent requests include `Authorization: Bearer <token>` header
   - Admin routes check `isAdmin` flag on user

5. **Type Safety**:
   - Rust: sqlx compile-time checked queries (requires DATABASE_URL set)
   - Frontend: GraphQL types manually defined in `shared/lib/api.ts`

## Common Tasks

### Add a new GraphQL query
1. Add field to `QueryRoot` in `services/api/src/graphql/query.rs`
2. Add TypeScript types and query to `app/src/shared/lib/api.ts`
3. Create/use React component consuming the API function

### Database changes
1. Add idempotent SQL to `bootstrap.rs` (NOT a migration file)
2. Add corresponding repository function in `services/api/src/repositories/`
3. Wire to GraphQL schema

### Run frontend dev server only
```bash
cd app && pnpm dev
```

### Check Rust code without running
```bash
cargo check
# or
just check
```

## Testing

No test suite currently configured. For manual verification:
1. Start DB: `just db`
2. Start API: `just api` (wait for "API running" message)
3. Start frontend: `just frontend`
4. Verify: Open Tauri window, sign in with seeded admin or create account

## Android Development

### Prerequisites
1. **Android Studio** installed with SDK and NDK
2. **Environment variables** set:
   ```bash
   export ANDROID_HOME=$HOME/Library/Android/sdk
   export NDK_HOME=$ANDROID_HOME/ndk/25.2.9519653  # or your NDK version
   export PATH=$PATH:$ANDROID_HOME/platform-tools
   ```
3. **Device**: Android phone with USB debugging enabled, or emulator

### Running on Android

**Step 1**: Find your host machine's local IP address:
```bash
# macOS
ifconfig | grep "inet " | grep -v 127.0.0.1

# Linux
ip addr show | grep "inet " | grep -v 127.0.0.1
```

**Step 2**: Update `app/.env` to use your host IP (not localhost):
```bash
# Replace 192.168.x.x with your actual local IP
VITE_GRAPHQL_URL=http://192.168.x.x:4000/graphql
```

**Step 3**: Start backend (DB + API):
```bash
just backend
# Or separately:
just db
just api
```

**Step 4**: Connect device and run:
```bash
# Option A: Use just command
just frontend-android

# Option B: Manual
pnpm tauri android dev
```

### Important Notes
- **API must bind to 0.0.0.0** (already set in `.env.example`) so the Android device can reach it
- **Firewall**: Ensure port 4000 is not blocked on your host machine
- **Same network**: Phone and computer must be on the same WiFi network
- **USB debugging**: Enable on phone: Settings → Developer options → USB debugging

## Constraints & Gotchas

- **pnpm only**: Frontend uses pnpm (lockfile present), not npm/yarn
- **Port 1420**: Hardcoded in Vite config and Tauri conf - do not change
- **CORS**: API allows all origins in dev; production config not yet implemented
- **JWT_SECRET**: Must be set, but no minimum length enforced (use strong secret)
- **No sqlx prepare**: sqlx uses runtime query checking; ensure DB is running for compilation
