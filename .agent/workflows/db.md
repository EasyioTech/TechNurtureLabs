---
description: Manage Drizzle ORM and Postgres database on the VPS
---

# VPS Database Management Workflow

Use this workflow to check database status, push schema changes, or perform migrations on the production VPS.

// turbo
1. Check Database logs for errors:
`ssh root@187.127.132.137 "docker compose logs -f db"`

// turbo
2. Push local schema changes to VPS database (No rebuild needed):
`ssh root@187.127.132.137 "docker exec LMS_app npx drizzle-kit push"`

// turbo
3. List applied migrations on the VPS:
`ssh root@187.127.132.137 "docker exec LMS_app npx drizzle-kit list"`

// turbo
4. Connect to Postgres CLI for manual inspection:
`ssh root@187.127.132.137 "docker exec -it LMS_postgres psql -U postgres -d technurturelabs"`

// turbo
5. Re-run Initial Seed (DANGER: Will fail if admin exists):
`ssh root@187.127.132.137 "docker exec LMS_app npm run db:seed"`
