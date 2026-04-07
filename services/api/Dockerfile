# Build stage
FROM rust:1.82-bookworm AS builder

WORKDIR /app

# Install dependencies
RUN apt-get update && apt-get install -y pkg-config libssl-dev

# Copy workspace manifests first for better caching
COPY Cargo.toml Cargo.lock ./
COPY packages/database/Cargo.toml packages/database/
COPY packages/types/Cargo.toml packages/types/
COPY packages/utils/Cargo.toml packages/utils/
COPY services/api/Cargo.toml services/api/
COPY app/src-tauri/Cargo.toml app/src-tauri/

# Create dummy main.rs files to cache dependencies
RUN mkdir -p packages/database/src packages/types/src packages/utils/src services/api/src app/src-tauri/src && \
    echo "fn main() {}" > packages/database/src/lib.rs && \
    echo "fn main() {}" > packages/types/src/lib.rs && \
    echo "fn main() {}" > packages/utils/src/lib.rs && \
    echo "fn main() {}" > services/api/src/main.rs && \
    echo "fn main() {}" > app/src-tauri/src/main.rs

# Build dependencies (cached layer)
RUN cargo build --release -p api 2>/dev/null || true

# Copy actual source code
COPY packages/database/src packages/database/src
COPY packages/types/src packages/types/src
COPY packages/utils/src packages/utils/src
COPY services/api/src services/api/src
COPY app/src-tauri/src app/src-tauri/src

# Build the actual application
RUN cargo build --release -p api

# Runtime stage
FROM debian:bookworm-slim

WORKDIR /app

# Install runtime dependencies
RUN apt-get update && apt-get install -y libssl3 ca-certificates && rm -rf /var/lib/apt/lists/*

# Copy the binary
COPY --from=builder /app/target/release/api /usr/local/bin/api

# Expose the port
EXPOSE 10000

# Run the binary
CMD ["api"]