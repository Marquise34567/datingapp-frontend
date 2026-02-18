# Dating Advice (Monorepo)

This workspace contains a Vite + React frontend and a TypeScript + Express backend.

Structure:
- `backend/` — Express API (TypeScript)
- `src/` — Frontend app (React, Vite)

Quick start:

```bash
# initialize repo (if not already a git repo)
git init
git add .
git commit -m "Initial commit: scaffold workspace"

# backend
cd backend
npm install
npm run dev

# frontend (from workspace root)
npm install
npm run dev -- --host
```
