---
description: Automatically deploy the latest changes to the VPS
---

# VPS Deployment Workflow

This workflow automates the process of committing local changes, pushing to GitHub and the VPS repo, and performing a clean rebuild on the production server.

// turbo
1. Commit and push local changes:
`git add .; git commit -m "Deployment update"; git push origin main`

// turbo
2. Push directly to the VPS repository:
`git remote add vps ssh://root@187.127.132.137/root/TechNurtureLabs; git push vps main`

// turbo
3. Remote Rebuild: Sync worktree, rebuild images, and restart containers:
`ssh root@187.127.132.137 "cd ~/TechNurtureLabs; git checkout main; git reset --hard; docker compose down; docker compose up -d --build"`

// turbo
4. Verify System Status (Wait 15s for stability):
`ssh root@187.127.132.137 "sleep 15; docker ps; docker compose logs --tail=50 app"`

5. Monitor logs if errors occur:
`ssh root@187.127.132.137 "docker compose logs -f app"`
