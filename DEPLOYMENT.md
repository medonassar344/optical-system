# Deployment Guide

This repository contains two apps:
- **backend/**: Laravel (PHP)
- **frontend/**: Vite (Node)

Below is a production-friendly deployment outline for a typical Linux server (Ubuntu 22.04) using **Nginx + PHP-FPM** for the backend and **static hosting** for the frontend build. The recommended setup uses **two domains** (or subdomains):
- `app.example.com` → frontend (static)
- `api.example.com` → backend (Laravel)

This keeps routing simple and avoids tricky `alias`/`root` mixing in Nginx.

## 1) Server prerequisites

Install required packages:

```bash
sudo apt update
sudo apt install -y nginx php8.2-fpm php8.2-cli php8.2-mbstring php8.2-xml php8.2-curl php8.2-mysql unzip git
```

Install Node (for building the frontend):

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

## 2) Clone the repo

```bash
git clone <YOUR_REPO_URL> /var/www/optical-system
cd /var/www/optical-system
```

## 3) Backend (Laravel) setup

```bash
cd /var/www/optical-system/backend
cp .env.example .env
composer install --no-dev --optimize-autoloader
php artisan key:generate
```

Update your `.env` with production values (APP_URL, DB_*). Then migrate:

```bash
php artisan migrate --force
```

Optional but recommended optimizations:

```bash
php artisan storage:link
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

Set correct permissions:

```bash
sudo chown -R www-data:www-data storage bootstrap/cache
sudo chmod -R 775 storage bootstrap/cache
```

## 4) Frontend (Vite) build

```bash
cd /var/www/optical-system/frontend
npm ci
npm run build
```

This generates a production build in `frontend/dist`.

> **Note:** Configure your frontend API base URL (for example via a `.env` like `VITE_API_URL=https://api.example.com`) if the app expects it.

## 5) Nginx configuration

Create two Nginx sites: one for the frontend static app, and one for the Laravel API.

### Frontend site

```bash
sudo tee /etc/nginx/sites-available/optical-frontend <<'NGINX'
server {
    listen 80;
    server_name app.example.com;

    root /var/www/optical-system/frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
NGINX
```

### Backend API site

```bash
sudo tee /etc/nginx/sites-available/optical-api <<'NGINX'
server {
    listen 80;
    server_name api.example.com;

    root /var/www/optical-system/backend/public;
    index index.php;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/run/php/php8.2-fpm.sock;
    }
}
NGINX
```

Enable the sites and restart Nginx:

```bash
sudo ln -s /etc/nginx/sites-available/optical-frontend /etc/nginx/sites-enabled/optical-frontend
sudo ln -s /etc/nginx/sites-available/optical-api /etc/nginx/sites-enabled/optical-api
sudo nginx -t
sudo systemctl restart nginx
```

## 6) Environment tips

- For SSL: use **Let’s Encrypt** (certbot) on production.
- For queue/workers: use **Supervisor** if you have queues enabled.
- Ensure the backend `.env` has `APP_ENV=production` and `APP_DEBUG=false`.
- If the frontend calls the API on a different domain, ensure **CORS** is configured in the backend.

---

If you want a Docker-based deployment instead, tell me the target platform and I can prepare a Dockerfile + compose setup.
