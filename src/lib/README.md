# 🛠️ Shared Library Layer (Drivers)

This folder contains **singleton connections** and core utilities used across the entire Edge and Node runtime. 

## 📁 Files
* `auth.ts`: Decodes JWT tokens, checks Redis cache, and sets SameSite=Lax cookies.
* `db.ts`: Establishes the `postgres` pool and mounts the Drizzle instance. (Note: Kept light so connection pooling doesn't exhaust in serverless environments).
* `redis.ts`: Driver for rate-limiting and session state retrieval.
* `storage.ts`: Cloudflare R2 proxy tools, including file signature validation and chunk uploads.
* `utils.ts`: Small pure functions (like Shadcn's `cn` logic).

## 🔌 Philosophy
Logic here MUST be stateless and side-effect free (outside of their core intent). These files are widely imported by `/api` routes, middleware, and `/modules`. Avoid circular dependencies.
