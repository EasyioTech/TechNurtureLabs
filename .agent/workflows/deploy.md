---
description: Automatically deploy the latest changes to the VPS
---

# VPS Deployment Workflow

This workflow automates the process of committing local changes, pushing to GitHub, and deploying to the VPS.

// turbo
1. Commit all local changes to the current branch:
`git add . && git commit -m "Deployment update" && git push origin main`

// turbo
2. SSH into the VPS and pull the latest changes:
`ssh root@187.124.98.192 "cd ~/TechNurtureLabs && git pull origin main"`

// turbo
3. Rebuild and restart the Docker containers on the VPS:
`ssh root@187.124.98.192 "cd ~/TechNurtureLabs && docker-compose down && docker-compose up -d --build"`

// turbo
4. Verify all containers are up:
`ssh root@187.124.98.192 "docker ps"`

5. Observe the output and announce completion.
