#!/bin/bash
# Quick local dev startup (requires Python 3.11+, Node 20+, PostgreSQL, Redis running locally)
set -e

echo "Starting Weaver dev environment..."

# Backend
cd backend
pip install -r requirements.txt -q
python manage.py migrate
python manage.py create_superuser_if_none
echo "Starting Django..."
python manage.py runserver 0.0.0.0:8000 &
DJANGO_PID=$!

# Celery worker
echo "Starting Celery..."
celery -A config worker --loglevel=warning &
CELERY_PID=$!

# Frontend
cd ../frontend
npm install --silent
echo "Starting Vite..."
npm run dev &
VITE_PID=$!

echo ""
echo "Dev servers running:"
echo "  Backend  → http://localhost:8000"
echo "  Frontend → http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop all"

cleanup() { kill $DJANGO_PID $CELERY_PID $VITE_PID 2>/dev/null; }
trap cleanup EXIT
wait
