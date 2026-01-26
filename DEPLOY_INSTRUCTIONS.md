# Deploying to VPS with Docker

This guide explains how to deploy the application on a VPS (Virtual Private Server) like DigitalOcean, AWS EC2, or Vultr using Docker.

## Prerequisites

1.  **VPS**: A server running a Linux distribution (Ubuntu 20.04/22.04 recommended).
2.  **Domain**: A domain name pointing to your VPS IP address (optional but recommended).
3.  **SSH Access**: Ability to SSH into your VPS.

## Step 1: Prepare the VPS

SSH into your VPS and install Docker and Docker Compose.

```bash
# Update and upgrade packages
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add current user to docker group (to run without sudo)
sudo usermod -aG docker $USER
newgrp docker

# Verify installation
docker --version
docker compose version
```

## Step 2: Deploy the Application

You can deploy by cloning your repository or copying the files directly.

### Option A: Using Git (Recommended)

1.  Clone your repository:
    ```bash
    git clone <your-repo-url>
    cd <your-project-folder>
    ```

2.  Create your production `.env` file:
    ```bash
    cp .env.example .env
    # Edit .env with your production secrets
    nano .env
    ```

3.  Build and start the container:
    ```bash
    docker compose up -d --build
    ```

### Option B: Copy Files Manually (SCP/SFTP)

Copy the necessary files (`Dockerfile`, `docker-compose.yml`, `next.config.ts`, `package.json`, `bun.lock`/`package-lock.json`, `src`, `public`, `.env`, etc.) to your VPS.

## Step 3: Manage the Application

-   **Check Logs**:
    ```bash
    docker compose logs -f
    ```

-   **Stop the Application**:
    ```bash
    docker compose down
    ```

-   **Update Application**:
    1.  Pull new changes: `git pull`
    2.  Rebuild and restart: `docker compose up -d --build`

## Step 4: Setup Reverse Proxy (Nginx) with SSL (Optional but Recommended)

For production, it is crucial to use HTTPS.

1.  **Install Nginx**:
    ```bash
    sudo apt install nginx certbot python3-certbot-nginx -y
    ```

2.  **Configure Nginx**:
    Create a config file `/etc/nginx/sites-available/myapp`:
    ```nginx
    server {
        server_name yourdomain.com;

        location / {
            proxy_pass http://localhost:3000;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
        }
    }
    ```

3.  **Enable Site and Restart Nginx**:
    ```bash
    sudo ln -s /etc/nginx/sites-available/myapp /etc/nginx/sites-enabled/
    sudo nginx -t
    sudo systemctl restart nginx
    ```

4.  **Setup SSL (Certbot)**:
    ```bash
    sudo certbot --nginx -d yourdomain.com
    ```
