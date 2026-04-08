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

# Build Android release APK (signed and ready to share)
android-build:
    cd app && pnpm tauri android build

# Build Android APK for specific architectures
android-build-apk:
    cd app && pnpm tauri android build --apk

# Install the release APK to connected device
android-install:
    adb install -r app/src-tauri/gen/android/app/build/outputs/apk/universal/release/app-universal-release.apk

