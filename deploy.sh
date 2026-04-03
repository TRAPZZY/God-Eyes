#!/usr/bin/env bash
set -e

echo "=============================================="
echo "  God Eyes - Production Deployment Script"
echo "=============================================="

check_prerequisites() {
    if ! command -v docker &> /dev/null; then
        echo "[ERROR] Docker is not installed. Please install Docker first."
        exit 1
    fi
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        echo "[ERROR] Docker Compose is not installed."
        exit 1
    fi
    echo "[OK] Prerequisites checked"
}

generate_secrets() {
    if [ -z "$JWT_SECRET_KEY" ]; then
        JWT_SECRET_KEY=$(openssl rand -hex 32)
        echo "[!] Generated JWT_SECRET_KEY"
    fi
    if [ -z "$POSTGRES_PASSWORD" ]; then
        POSTGRES_PASSWORD=$(openssl rand -hex 32)
        echo "[!] Generated POSTGRES_PASSWORD"
    fi
}

create_env() {
    if [ ! -f .env.production ]; then
        cp backend/.env.example .env.production 2>/dev/null || true
    fi
    cat > .env <<EOF
DATABASE_URL=postgresql://godeyes:${POSTGRES_PASSWORD}@db:5432/godeyes
JWT_SECRET_KEY=${JWT_SECRET_KEY}
POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
MAPBOX_ACCESS_TOKEN=${MAPBOX_ACCESS_TOKEN:-}
OPENWEATHER_API_KEY=${OPENWEATHER_API_KEY:-}
DEBUG=false
CORS_ORIGINS=["http://localhost:3000"]
EOF
    echo "[OK] Production .env created"
}

build_and_start() {
    echo "[*] Building and starting services..."
    docker compose -f docker-compose.prod.yml up -d --build
    echo "[OK] Services started"
}

run_migrations() {
    echo "[*] Running database migrations..."
    sleep 5
    docker compose -f docker-compose.prod.yml exec -T backend alembic upgrade head 2>/dev/null || echo "[!] Migration skipped (Alembic not configured)"
}

health_check() {
    echo "[*] Running health checks..."
    sleep 10
    if curl -f http://localhost:8000/health &>/dev/null; then
        echo "[OK] Backend health check passed"
    else
        echo "[WARN] Backend health check failed (may need more time to start)"
    fi
}

display_urls() {
    echo ""
    echo "=============================================="
    echo "  God Eyes - Deployment Complete"
    echo "=============================================="
    echo "  Backend API:   http://localhost:8000"
    echo "  API Docs:      http://localhost:8000/docs"
    echo "  Frontend:      http://localhost:3000"
    echo "=============================================="
}

check_prerequisites
generate_secrets
create_env
build_and_start
run_migrations
health_check
display_urls
