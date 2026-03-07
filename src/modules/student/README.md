# 🚀 Student Module (Gamified Learning)

This module is the core product interface where **K-12 students learn and earn**.

## 📁 Structure
* `/actions/`: Contains the logic for XP aggregation, level calculations, streak maintenance, and profile updates.
* `/components/`: Fun, gamified UI elements like `achievement-badge`, `challenge-card`, and `stat-pill`.

## 🔌 Database Connectivity
* **Core Loops**: Read/Writes heavily to `lesson_progress`, `quiz_attempts`, `user_daily_challenges`, and updates `users` (cumulative XP).
* **Algorithms**: Streak calculation relies on comparing `last_active_at` with the server's current date. Level calculation relies on a base algorithm dividing total XP.

> **Developer Note**: Optimization is critical here. This module sees 90% of the platform's traffic. Action DB calls are kept tight.
