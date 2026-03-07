# 🏢 Super Admin Module

This module forms the **Operational Control Center** of the TechNurture platform. It is strictly meant for global administrators who manage the multi-tenant architecture.

## 📁 Structure
* `/actions/`: Contains server-side mutations ('use server'). This includes deep-cloning logic for courses, plan management, and global promo codes.
* `/components/`: The UI dashboard elements and complex interfaces (Editors, Builders, Pickers) strictly accessible to platform admins.
* `types.ts`: TypeScript models for the admin dashboard state.

## 🔌 Database Connectivity
* **High Risk**: These actions directly mutate core tables like `courses`, `schools`, `paymentPlans`, and `promoCodes`.
* **Security Guarding**: Every action inside `/actions` must be wrapped with `verifySession()` and check against the Super Admin role before executing logic.

> **Developer Note**: Never expose components from here to `school-admin` or  `student` portals. Keep it structurally isolated.
