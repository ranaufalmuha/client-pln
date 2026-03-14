# =====================================================  
# frontend
frontend:
    cd app && npm run dev

# =====================================================  
# frontend
backend:
    just api
    just db

# stop containers
down:
    docker compose -f infra/docker/docker-compose.yml down

# run only api
api:
    cargo watch -x run -p api

# run database only
db:
    docker compose -f infra/docker/docker-compose.yml up -d

# format code
fmt:
    cargo fmt

# check
check:
    cargo check


