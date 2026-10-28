# Deployment

Target: Ubuntu 24.04, Nginx, Docker Compose, PostgreSQL, Redis, MinIO.

1. Clone repositori.
2. `cd infrastructure && docker compose up --build -d`
3. Jalankan migrasi: `docker compose exec backend php artisan migrate --seed`
4. Set `APP_KEY`, `FRONTEND_URL`, dan kredensial object storage.
5. Queue worker: `php artisan queue:work redis`
6. Backup PostgreSQL harian, retensi 30 hari.
7. HTTPS di reverse proxy. Jangan expose MinIO tanpa kredensial.

Staging mengikuti pipeline CI: lint/test/build sebelum deploy.
