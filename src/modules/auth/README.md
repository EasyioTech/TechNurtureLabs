# 🔐 Auth Module

Handles the global **Onboarding & Registration Layer**.

## 📁 Structure
* `register-actions.ts`: Currently holds the multi-step registration wizard server actions (e.g. registering a new school and immediately provisioning their Admin user).

## 🔌 Database Connectivity
* Operations here are wrapped in deep **SQL Transactions** `.transaction()`. We never want a "half-created" school without an admin, or an admin without an authentication record.
* Uses `bcryptjs` for password/PIN hashing before persisting to `users`.
