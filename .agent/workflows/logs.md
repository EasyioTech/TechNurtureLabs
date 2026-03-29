---
description: Monitor logs and check system health on the VPS
---

# VPS Monitoring Workflow

Use this workflow to monitor the application logs or check the health of service containers on the production VPS.

// turbo
1. Check real-time logs for the main application:
`ssh root@187.127.132.137 "docker compose logs -f app"`

// turbo
2. Check logs for the Worker service (Achievements, etc):
`ssh root@187.127.132.137 "docker compose logs -f event-worker"`

// turbo
3. List all containers and their health status:
`ssh root@187.127.132.137 "docker ps"`

// turbo
4. Check Redis health and monitoring:
`ssh root@187.127.132.137 "docker exec LMS_redis redis-cli ping"`
