# 🛠️ LMS Operations (ops/)

This folder contains all tools for deployment, setup, and health checks.

### 🚀 1. NEW VPS SETUP (Run once on fresh server)
Installs Docker, configures firewall (80/443), and disables host Nginx.
```bash
bash ops/setup.sh
```

### 🚢 2. DEPLOY / UPDATE
Pulls latest code, builds images, and starts all services in the correct order.
```bash
bash ops/deploy.sh
```

### 🩺 3. DOCTOR (Health Check)
Diagnoses common issues (ports, .env, DB connection, Redis) and shows fix guide.
```bash
bash ops/doctor.sh
```

### 💾 4. DB INITIALIZATION
Applies the initial database schema to the Postgres container.
```bash
bash ops/db-init.sh
```

---

## 📊 Quick Summary Table
| Use Case | Path |
| :--- | :--- |
| First time on a new VPS | `ops/setup.sh` |
| Updating the website | `ops/deploy.sh` |
| Website not working? | `ops/doctor.sh` |
| Reset everything (Clean) | `ops/deploy.sh --clean` |

---
*All other technical reports and history are in `ops/docs/`.*
