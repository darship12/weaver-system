#!/bin/bash
set -e

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'
log()  { echo -e "${GREEN}[✓]${NC} $1"; }
warn() { echo -e "${YELLOW}[!]${NC} $1"; }
info() { echo -e "${CYAN}[→]${NC} $1"; }

echo ""
echo "███████╗ █████╗ ███████╗ █████╗ ██╗   ██╗███████╗███████╗"
echo "██╔════╝██╔══██╗██╔════╝██╔══██╗██║   ██║██╔════╝██╔════╝"
echo "███████╗███████║█████╗  ███████║██║   ██║█████╗  ███████╗"
echo "╚════██║██╔══██║██╔══╝  ██╔══██║╚██╗ ██╔╝██╔══╝  ╚════██║"
echo "███████║██║  ██║███████╗██║  ██║ ╚████╔╝ ███████╗███████║"
echo "╚══════╝╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝  ╚═══╝  ╚══════╝╚══════╝"
echo "         Weaver Production Tracking System v1.0"
echo ""

# Pre-flight
info "Checking requirements..."
command -v docker   >/dev/null 2>&1 || { echo "Docker not found. Install from https://docker.com"; exit 1; }
command -v docker compose >/dev/null 2>&1 || docker-compose version >/dev/null 2>&1 || { echo "Docker Compose not found."; exit 1; }
log "Docker OK"

# Env file
if [ ! -f .env ]; then
  warn ".env not found — copying from .env.example"
  cp .env.example .env
  SECRET=$(python3 -c "import secrets; print(secrets.token_hex(32))" 2>/dev/null || openssl rand -hex 32)
  if [[ "$OSTYPE" == "darwin"* ]]; then
    sed -i '' "s/django-insecure-CHANGE-THIS.*/$SECRET/" .env
  else
    sed -i "s/django-insecure-CHANGE-THIS.*/$SECRET/" .env
  fi
  warn "Generated new SECRET_KEY. Edit .env before production use."
fi
log ".env ready"

# Build & start
info "Building Docker images (first run may take 3-5 min)..."
docker compose build --parallel

info "Starting all services..."
docker compose up -d

info "Waiting for services to be healthy..."
sleep 10

# Health checks
RETRIES=15
for i in $(seq 1 $RETRIES); do
  if curl -sf http://localhost:8000/api/v1/auth/login/ -o /dev/null -X POST 2>/dev/null; then
    log "Backend healthy"; break
  fi
  [ $i -eq $RETRIES ] && { warn "Backend not responding after ${RETRIES} attempts — check: docker compose logs backend"; }
  sleep 5
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  🎉  Weaver System is running!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "  🌐  Web App      →  http://localhost"
echo "  🔧  Django API   →  http://localhost:8000/api/v1/"
echo "  🛠️   Django Admin →  http://localhost:8000/admin/"
echo "  📊  Grafana      →  http://localhost:3001"
echo ""
echo "  Default login: admin / admin123"
echo "  Grafana login: admin / weaver_grafana_2024"
echo ""
echo "  Stop: docker compose down"
echo "  Logs: docker compose logs -f [service]"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
