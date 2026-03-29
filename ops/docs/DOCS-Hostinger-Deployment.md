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

## 5. Low-Resource VPS Strategy (Limited RAM/Storage) 🛠️

If you are on a KVM with limited storage (e.g. 5GB - 20GB) and no `npm` installed, follow these rules:

### A. Run Database Setup without npm/host tools
Instead of running commands on your host, use the isolated builder container:
```bash
# This applies SQL migrations, Seeds data, and Creates the Super Admin
docker compose --profile setup up migration --abort-on-container-exit
```

### B. Clean up Storage
Docker builds can leave behind large intermediate layers. Run this after every successful deployment:
```bash
docker system prune -f
```

### C. Resource Monitoring
Check your RAM usage to ensure Node.js is not hitting swap:
```bash
docker stats
```

## 6. Security Recommendations

- **Firewall**: Ensure only ports 80, 443 (for a reverse proxy like Nginx) and 3000 (if exposing app directly) are open.
- **SSL**: Usenix `certbot` and `Nginx` to provide HTTPS. Next.js standalone is best served behind a proxy.
- **Secrets**: Change `JWT_SECRET` and Postgres password in `.env` immediately.

---
**TechNurture Labs Production Engineering Team**
