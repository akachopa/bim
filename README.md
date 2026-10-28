# BIM Training & Modeling Platform

Platform web untuk pembelajaran BIM, praktik modeling di browser, simulasi proyek, asesmen, review trainer, dan sertifikasi digital.

Fokus produk: **training-first BIM modeler**. Data BIM adalah sumber kebenaran. Geometry dan Babylon.js hanya renderer.

```
Belajar → BIM Lab → BIM Studio → Validate → Submit → Review → Revision → Assessment → Certificate
```

## Struktur monorepo

```
backend/          Laravel 13 API (Sanctum, PostgreSQL)
frontend/         React + TypeScript + Vite + BIM Studio
ifc-service/      FastAPI sidecar (export/import/validate IFC)
infrastructure/   Docker Compose
docs/             Panduan API, skema BIM, user, trainer, deploy
PLAN.md           Spesifikasi produk
```

## Akun demo

Kata sandi semua akun: `password`

| Peran | Email |
| --- | --- |
| Peserta | peserta@bim.test |
| Trainer | trainer@bim.test |
| Admin lembaga | admin@bim.test |
| Super admin | super@bim.test |

## Menjalankan lokal

Prasyarat: PHP 8.4, Composer, Node 22, PostgreSQL 16, Redis.

```bash
# database
sudo -u postgres psql -c "CREATE USER bim WITH PASSWORD 'bimsecret' SUPERUSER;"
sudo -u postgres psql -c "CREATE DATABASE bim OWNER bim;"

# backend
cd backend
cp .env.example .env   # sesuaikan kredensial
php artisan key:generate
php artisan migrate --seed
php artisan serve --host=0.0.0.0 --port=8000

# frontend
cd frontend
npm install
npm run dev

# IFC service (opsional)
cd ifc-service
pip install -r requirements.txt
uvicorn app.main:app --port 8001
```

Frontend: http://localhost:5173  
API: http://localhost:8000/api/v1

## Tes

```bash
cd backend && php artisan test
cd frontend && npm test && npm run build
cd ifc-service && pytest
```

## Docker

```bash
cd infrastructure
docker compose up --build
```

## Modeling MVP

Level, Grid, Wall, Column, Beam, Slab, Door, Window.

Studio mendukung denah 2D, viewport 3D, snap, undo/redo, properties, validasi, autosave, IndexedDB draft, dan submit untuk review.
