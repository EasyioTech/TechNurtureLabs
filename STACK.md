# Technology Stack: EduQuest

## Frontend
- **Framework**: Next.js 15.5.12
- **State Management**: React 19 (Server Components, Actions, Hooks).
- **Styling**: Tailwind CSS 4.0.0, PostCSS.
- **Animations**: Framer Motion 12.23.24.
- **Icon Library**: Lucide React.
- **UI Components**: Radix UI primitives, Headless UI, `vaul` (drawer), `cmdk` (command pallete).
- **Data Visualization**: Recharts 3.0.2.
- **Forms**: React Hook Form with Zod validation.

## Backend
- **Framework**: Next.js API Routes (Route Handlers) and Server Actions.
- **Database**: PostgreSQL with `@libsql/client` (LibSQL/SQLite compatibility) and `postgres` driver.
- **ORM**: Drizzle ORM 0.44.7.
- **Caching & Sessions**: Redis (via `ioredis`).
- **Authentication**: Custom JWT with `jose`, `bcryptjs` for hashing.
- **File Storage**: AWS S3 compatible (SDK v3) for media and uploads.
- **Payments**: Stripe SDK.

## DevOps & Tools
- **Runtime**: Node.js.
- **Package Manager**: NPM.
- **Linter**: ESLint with `eslint-config-next`.
- **Database Migrations**: Drizzle Kit.
- **Validation**: Zod.
- **Testing**: (Inferred) React Testing Library or Playwright.
