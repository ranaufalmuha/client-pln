# =====================================================  
# frontend
frontend:
    cd app && npm run dev

# =====================================================  
# backend - start DB first, then run API
backend:
    just db
    just api

# stop containers
down:
    docker compose -f infra/docker/docker-compose.yml down

# run only api
api:
    cargo watch -x "run -p api --bin api"

# run database only
db:
    docker compose -f infra/docker/docker-compose.yml up -d

# format code
fmt:
    cargo fmt

# check
check:
    cargo check

# =====================================================
# Mobile

# Run Android dev (requires Android SDK, API must be accessible from device)
frontend-android:
    cd app && pnpm tauri android dev


