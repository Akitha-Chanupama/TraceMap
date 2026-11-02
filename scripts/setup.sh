#!/usr/bin/env bash
set -e

echo "=== TraceMap Setup (Unix) ==="

# 1. Backend venv
cd "$(dirname "$0")/../backend"
if [ ! -d ".venv" ]; then
    python3 -m venv .venv
fi
source .venv/bin/activate
pip install --upgrade pip --quiet
pip install -r requirements.txt --quiet
python3 -c "from app.database import init_db; init_db(); print('Database initialized.')"

# 2. Frontend
cd "../frontend"
npm install

echo "=== Setup Complete. Run ./scripts/start.sh ==="

