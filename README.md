# 🧵 Weaver — Tracking System

## 📐 Architecture

```
Browser (React + Tailwind)
      │
      ▼
  Nginx (Port 80)           ← Reverse proxy + static files
      │
   ┌──┴──────────────┐
   │                 │
   ▼                 ▼
Django REST API    Static/Media
(Port 8000)
   │
   ├─── JWT Auth (SimpleJWT)
   ├─── PostgreSQL  ← Primary data store
   ├─── Redis       ← Cache + Celery broker
   ├─── Kafka       ← Event streaming
   │       └──── Kafka Consumer Service
   └─── Celery      ← Background jobs (salary, reports)
         └─── Celery Beat ← Scheduler

## 🚀 Quick Start (Docker — Recommended)

### Prerequisites
- Docker 24+ and Docker Compose V2
- 4 GB RAM minimum

### 1. Clone / Extract
```bash
cd weaver-system
```

### 2. One-command setup
```bash
bash scripts/setup.sh
```

This will:
- Generate a secure SECRET_KEY automatically
- Build all Docker images
- Start all 9 services
- Run Django migrations
- Seed default pricing data and admin user

### 3. Open the app
| Service | URL |
|---------|-----|
| 🌐 Web App | http://localhost |
| 🔧 API | http://localhost:8000/api/v1/ |
| 🛠️ Django Admin | http://localhost:8000/admin/ |
| 📊 Grafana | http://localhost:3001 |

**Default credentials:**
- App: `admin` / `admin123`
- Grafana: `admin` / `weaver_grafana_2024`

> ⚠️ **Change both passwords immediately after first login.**

---

## 🛠️ Manual Setup (Development)

### Backend

```bash
cd backend

# Create virtualenv
python3 -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set environment variables
cp ../.env.example .env
# Edit .env — set DB_HOST=localhost, REDIS_URL=redis://localhost:6379/0

# Migrate
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Seed data
python manage.py create_superuser_if_none

# Run
python manage.py runserver
```

### Frontend

```bash
cd frontend
npm install
npm run dev        # Dev server → http://localhost:3000
npm run build      # Production build
npm run test       # Unit tests (Vitest)
npm run test:e2e   # E2E tests (Playwright)
```

### Redis & Celery (local)

```bash
# Terminal 1 — Redis
redis-server

# Terminal 2 — Celery worker
cd backend && celery -A config worker --loglevel=info

# Terminal 3 — Celery Beat (scheduler)
cd backend && celery -A config beat --loglevel=info --scheduler django_celery_beat.schedulers:DatabaseScheduler
```

### Kafka (local — optional)

```bash
# Using docker just for Kafka
docker run -d --name zookeeper -p 2181:2181 confluentinc/cp-zookeeper:7.5.0 \
  -e ZOOKEEPER_CLIENT_PORT=2181

docker run -d --name kafka -p 9092:9092 confluentinc/cp-kafka:7.5.0 \
  -e KAFKA_ZOOKEEPER_CONNECT=localhost:2181 \
  -e KAFKA_ADVERTISED_LISTENERS=PLAINTEXT://localhost:9092

# Run consumer
cd backend && python kafka_consumer/consumer.py
```

---

## 📁 Project Structure

```
weaver-system/
├── backend/                    # Django project
│   ├── apps/
│   │   ├── authentication/     # JWT auth, user profiles
│   │   ├── employee/           # Employee CRUD
│   │   ├── attendance/         # Daily attendance
│   │   ├── production/         # Production entries, pricing
│   │   ├── salary/             # Salary calculation
│   │   └── reports/            # Dashboard & reports
│   ├── config/
│   │   ├── settings.py         # Django settings
│   │   ├── urls.py             # Root URL config
│   │   ├── celery.py           # Celery + Beat schedules
│   │   ├── kafka_producer.py   # Kafka event publisher
│   │   └── permissions.py      # Custom RBAC permissions
│   ├── kafka_consumer/
│   │   └── consumer.py         # Standalone Kafka consumer
│   ├── requirements.txt
│   ├── manage.py
│   └── Dockerfile
│
├── frontend/                   # React + TypeScript
│   ├── src/
│   │   ├── pages/              # Route-level pages
│   │   │   ├── auth/           # Login
│   │   │   ├── dashboard/      # Main dashboard
│   │   │   ├── employee/       # Employee management
│   │   │   ├── attendance/     # Attendance marking
│   │   │   ├── production/     # Production tracking
│   │   │   ├── salary/         # Salary summary
│   │   │   └── reports/        # Analytics & reports
│   │   ├── components/
│   │   │   ├── layout/         # AppLayout, sidebar, mobile nav
│   │   │   └── common/         # KpiCard, Modal, EmptyState, etc.
│   │   ├── services/api.ts     # Axios client + all API calls
│   │   ├── store/authStore.ts  # Zustand auth state
│   │   └── types/index.ts      # TypeScript interfaces
│   ├── e2e/                    # Playwright tests
│   ├── public/
│   ├── Dockerfile
│   ├── vite.config.ts
│   └── tailwind.config.js
│
├── nginx/
│   └── nginx.conf              # Reverse proxy config
│
├── grafana/
│   ├── datasources.yml         # PostgreSQL datasource
│   └── dashboards/             # Auto-provisioned dashboards
│
├── scripts/
│   ├── setup.sh                # One-command Docker start
│   ├── dev.sh                  # Local dev start
│   └── init.sql                # DB views and extensions
│
├── docker-compose.yml          # Full stack orchestration
├── .env.example                # Environment template
└── README.md
```

---

## 🔌 API Reference

Base URL: `http://localhost:8000/api/v1/`

All endpoints (except login) require: `Authorization: Bearer <access_token>`

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/login/` | Get JWT tokens |
| POST | `/auth/logout/` | Blacklist refresh token |
| POST | `/auth/token/refresh/` | Refresh access token |
| GET | `/auth/me/` | Current user info |
| GET/POST | `/employees/` | List / create employees |
| GET/PATCH/DELETE | `/employees/{id}/` | Employee detail |
| GET | `/employees/{id}/stats/` | Employee performance stats |
| GET | `/employees/dropdown/` | Compact list for forms |
| GET/POST | `/attendance/` | List / create attendance |
| POST | `/attendance/bulk/` | Bulk mark attendance |
| GET | `/attendance/monthly-summary/` | Monthly attendance summary |
| GET/POST | `/production/` | List / create production entries |
| GET | `/production/summary/` | Aggregated stats (`?period=today/week/month`) |
| GET | `/production/defects/` | Weekly defect report |
| GET | `/production/top-performers/` | Top producers this week |
| GET | `/production/daily-chart/` | Chart data |
| GET/POST | `/production/pricing/` | Saree pricing table |
| GET/POST | `/production/designs/` | Design types |
| GET | `/salary/` | Salary records |
| GET | `/salary/weekly-summary/` | Current week salary |
| POST | `/salary/calculate/` | Trigger calculation (async) |
| PATCH | `/salary/{id}/mark-paid/` | Mark salary as paid |
| GET | `/dashboard/summary/` | Full dashboard data |

---

## 📱 Mobile Support

The frontend is **fully mobile-responsive**:
- Bottom navigation bar on mobile
- Swipeable sidebar drawer
- Card-based layouts replace tables on small screens
- PWA manifest — installable on Android/iOS
- Touch-optimized attendance marking (tap to cycle status)

---

## 🔒 Security

| Feature | Implementation |
|---------|----------------|
| Authentication | JWT with automatic refresh, token blacklist on logout |
| Password hashing | Django's PBKDF2 (default) |
| CORS | Whitelisted origins only |
| CSRF | Enabled for browser clients |
| Security headers | X-Frame-Options, X-Content-Type-Options, XSS protection |
| SQL injection | ORM only, no raw queries |
| Role enforcement | Custom DRF permission classes |
| HTTPS | Nginx TLS termination (configure certs in `nginx/certs/`) |

---

## ⚙️ Environment Variables

See `.env.example` for full list. Key variables:

```bash
SECRET_KEY=<generate with: openssl rand -hex 32>
DEBUG=False                        # Never True in production
DB_PASSWORD=<strong-password>
KAFKA_BOOTSTRAP_SERVERS=kafka:9092
CORS_ALLOWED_ORIGINS=https://yourdomain.com
```

---

## 🌩️ Production Deployment (AWS)

Recommended stack:
- **App**: EC2 t3.medium or ECS
- **Database**: RDS PostgreSQL 15
- **Cache**: ElastiCache Redis
- **Storage**: S3 (for PDF/Excel exports)
- **CDN**: CloudFront (for frontend assets)
- **SSL**: ACM certificate → ALB

```bash
# Build and push images
docker build -t weaver-backend ./backend
docker build -t weaver-frontend ./frontend

# Push to ECR
aws ecr get-login-password | docker login --username AWS --password-stdin <ecr-url>
docker tag weaver-backend <ecr-url>/weaver-backend:latest
docker push <ecr-url>/weaver-backend:latest
```

---

## 📊 Grafana Dashboards

After starting, open http://localhost:3001 (admin / weaver_grafana_2024).

Dashboards are auto-provisioned:
- **Production Dashboard** — Daily counts, weekly trends, top performers
- **Defect Analysis** — Employee-level defect rates
- **Salary Summary** — Weekly wages, paid/unpaid status
- **Attendance Heatmap** — Monthly presence overview

---

## 🔄 Kafka Event Topics

| Topic | Producer | Consumer | Payload |
|-------|---------|----------|---------|
| `attendance.created` | Django API | Consumer Service | `{employee_id, date, status}` |
| `production.created` | Django API | Consumer Service | `{employee_id, date, quantity, wage}` |
| `salary.calculated` | Celery | Consumer Service | `{employee_id, total_wage}` |

---

## 🧪 Testing

```bash
# Backend (Django)
cd backend
python manage.py test

# Frontend unit tests (Vitest)
cd frontend
npm run test

# Frontend E2E (Playwright)
npm run test:e2e

# Type check
npm run type-check

# Lint
npm run lint
```

---

## 🛠️ Useful Commands

```bash
# View logs
docker compose logs -f backend
docker compose logs -f kafka_consumer
docker compose logs -f celery_worker

# Django shell
docker compose exec backend python manage.py shell

# Run migrations
docker compose exec backend python manage.py migrate

# Trigger salary calculation manually
docker compose exec backend python manage.py shell -c \
  "from apps.salary.tasks import calculate_daily_salary; calculate_daily_salary.delay()"

# Reset all data (caution!)
docker compose exec backend python manage.py flush --no-input

# Backup database
docker compose exec postgres pg_dump -U weaver_user weaver_db > backup.sql
```

---

## 📞 Support

- Admin Panel: http://localhost:8000/admin/ (full data management)
- API Docs: http://localhost:8000/api/v1/ (browsable DRF interface)

---

*Built with ❤️ — Weaver Production Tracking System v1.0*
