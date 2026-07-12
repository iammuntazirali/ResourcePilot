# AssetFlow

Enterprise Asset & Resource Management System — Odoo Hackathon project.

## Stack

| Layer | Technology |
|-------|------------|
| Frontend | React, Vite, Tailwind CSS, React Router, Axios, Recharts |
| Backend | Node.js, Express, Sequelize, MySQL |
| Auth | JWT + RBAC |

## Quick Start

### 1. Start MySQL

```bash
docker compose up -d
```

### 2. Backend

```bash
cd backend
cp .env.example .env
npm install
npm run db:migrate
npm run db:seed
npm run dev
```     

API: http://localhost:5000/api/health

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

App: http://localhost:5173

## Demo Accounts

| Email | Role | Password |
|-------|------|----------|
| admin@assetflow.com | Super Admin | Admin@123 |
| manager@assetflow.com | Asset Manager | Admin@123 |
| employee@assetflow.com | Employee | Admin@123 |

## Phase 1 Features (Implemented)

- JWT authentication with refresh tokens
- Role-based access control (7 roles, granular permissions)
- Department, location, category master data
- Asset CRUD with lifecycle state machine
- Status history & audit logging
- Assignment request → approval → assignment workflow
- Asset return (check-in) workflow
- Dashboard with Recharts KPIs
- ERP-style sidebar layout

## Project Structure

```
assetflow/
├── backend/          # Express API + Sequelize
├── frontend/         # React SPA
├── docker-compose.yml
└── ARCHITECTURE.md   # Full architecture document
```

## API Base URL

`/api/v1`

See `ARCHITECTURE.md` for complete API, database schema, and workflow documentation.
