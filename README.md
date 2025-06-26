# eSIM Marketplace Project

A modern full-stack application with separate **frontend** (React, Vite, TailwindCSS, ShadCN UI) and **backend** (Node.js, Express, TypeORM, Supabase, Stripe) codebases.

## Tech Features

- ⚡️ **Vite** + **React 18** (frontend)
- 🎨 **TailwindCSS** + **ShadCN UI**
- 🧩 **TypeScript** everywhere
- 🧭 **React Router**, **React Query**
- 🔒 **Express**, **JWT**, **Supabase** (backend)
- 💳 **Stripe** integration
- 📧 **Nodemailer** for email
- 🗄️ **PostgreSQL** via **TypeORM**

## Project Structure

```
project-root/
├── frontend/           # React app (Vite, Tailwind, etc.)
│   ├── public/
│   ├── src/
│   ├── ...configs
│   └── .env           # Frontend environment variables
│
├── backend/            # Node.js/Express API
│   ├── src/
│   ├── ...configs
│   └── .env           # Backend environment variables
│
├── README.md
└── ...other root files
```

## Getting Started

### Prerequisites
- Node.js 18+
- npm, yarn, or pnpm

### 1. Install dependencies
```bash
cd frontend && npm install
cd ../backend && npm install
```

### 2. Environment Variables
- Copy `.env.example` to `.env` in both `frontend/` and `backend/` and fill in your secrets.
- **Never commit `.env` files to version control!**

### 3. Running the Apps
#### Frontend (React)
```bash
cd frontend
npm run dev
# App runs at http://localhost:8080 (or as configured)
```
#### Backend (API)
```bash
cd backend
npm run dev
# API runs at http://localhost:5000 (or as configured)
```

## Customization
- **Frontend:**
  - Components: `frontend/src/components/`
  - Pages: `frontend/src/pages/`
  - Styling: `frontend/tailwind.config.ts`
- **Backend:**
  - API routes: `backend/src/routes/`
  - Database: `backend/src/config/database.ts`
  - Auth: `backend/src/utils/tokenUtils.ts`

## Building for Production
- **Frontend:**
  ```bash
  cd frontend && npm run build
  # Output in frontend/dist/
  ```
- **Backend:**
  ```bash
  cd backend && npm run build
  # Output in backend/dist/
  ```

## Linting & Code Quality
- **Frontend:** `npm run lint` in `frontend/`
- **Backend:** `npm run lint` in `backend/`

## Notes
- Place your `.env` files in the correct folder (`frontend/` or `backend/`).
- Update all URLs and secrets for production.
- For more details, see comments in the codebase.
