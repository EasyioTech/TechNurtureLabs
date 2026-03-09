---
description: Automatically deploy the latest changes to the VPS
---

# VPS Deployment Workflow

This workflow automates the process of committing local changes, pushing to both GitHub and the VPS repo, and updating the application.

// turbo
1. Commit all local changes to the current branch:
`git add . && git commit -m "Deployment update" && git push origin main`

// turbo
2. Configure VPS repository (one-time) and push directly to it:
`git remote add vps ssh://root@187.124.98.192/root/TechNurtureLabs; git config receive.denyCurrentBranch ignore; git push vps main`

// turbo
3. Remote Update: Reset VPS worktree and rebuild containers:
`ssh root@187.124.98.192 "cd ~/TechNurtureLabs; git reset --hard; docker compose down; docker compose up -d --build"`

// turbo
4. Verify all containers are up and healthy:
`ssh root@187.124.98.192 "docker ps"`

5. Observe the output and announce completion.
