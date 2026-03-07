# 💾 Database Layer

This directory holds the raw **Drizzle ORM** schema mapping. 

It is intentionally separated from `src/lib/db.ts` (which holds the connection driver) to act as a pristine source of truth for the entire application's data structure.

## 📁 Structure
* `schema.ts`: Defines every table, relationship, enum, and index. 

## 🔌 Best Practices
* Always run `npm run db:generate` and `npm run db:push` whenever modifying this file.
* Relations (e.g., `usersRelations`) are explicitly defined at the bottom of the file to enable relational queries like `db.query.schools.findFirst({ with: { students: true } })`.
