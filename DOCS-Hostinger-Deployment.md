# Hostinger VPS Deployment Guide 🚀

This guide explains how to deploy the **EduQuest** application to a Hostinger VPS using Docker Compose.

## 1. Prerequisites (on VPS)

Your VPS should have the following installed:
- **Docker** (v24 or later)
- **Docker Compose** (v2.x)
- **Git**

To install them on Ubuntu 22.04+:
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y docker.io docker-compose git
sudo systemctl enable --now docker
```

## 2. Prepare the source on your local machine

Before pushing, make sure your `.env` is ready. 
**Avoid committed secrets to Git.**

## 3. Deployment Steps

### Option A: Manual Setup (Recommended for first run)

1.  **Clone the code** (or use SCP to upload):
    ```bash
    git clone YOUR_REPO_URL app
    cd app
    ```

2.  **Configure environment variables**:
    Create a `.env` file on the VPS:
    ```bash
    nano .env
    ```
    Add the production values (DATABASE_URL, JWT_SECRET, R2 credentials, etc.).

3.  **Run with Docker Compose**:
    ```bash
    docker-compose up -d --build
    ```

### Option B: Using the `deploy.sh` script

We've provided a script to automate updates:
```bash
chmod +x deploy.sh
./deploy.sh
```

## 4. Post-Deployment Checks

1.  **Verify containers are running**:
    ```bash
    docker-compose ps
    ```
2.  **Check logs**:
    ```bash
    docker-compose logs -f app
    ```
3.  **Database Initialisation**:
    The system auto-seeds the schema and super-admin (`admin@technurture.com / admin123`) on the first run of the database container via `schema.sql`.

## 5. Security Recommendations

- **Firewall**: Ensure only ports 80, 443 (for a reverse proxy like Nginx) and 3000 (if exposing app directly) are open.
- **SSL**: Usenix `certbot` and `Nginx` to provide HTTPS. Next.js standalone is best served behind a proxy.
- **Secrets**: Change `JWT_SECRET` and Postgres password in `.env` immediately.

---
**TechNurture Labs Production Engineering Team**
