# 🚀 Obsidian Pro — Enterprise Task Platform

The "Obsidian Pro" edition of TaskFlow is a high-performance, premium SaaS platform for team task management. It features a stunning glass-morphism UI, real-time analytics, and enterprise-grade security.

**Live Demo**: [your-url.railway.app](https://your-url.railway.app)  
**API Docs**: [your-backend.railway.app](https://your-backend.railway.app)

---

## 🎨 Design System: "Obsidian Pro"
- **Glassmorphism**: Deep blurs and translucent surfaces for a premium feel.
- **Layered Depth**: Distinct surface levels with subtle glow effects.
- **Micro-animations**: Smooth transitions using Framer Motion.
- **Dynamic Themes**: Deep indigo/violet color palette tailored for professional focus.

---

## 📸 Key Features

- 📊 **Executive Dashboard** — High-impact Recharts analytics and activity heatmaps.
- 📋 **Premium Kanban** — Drag-and-drop workflow with `@hello-pangea/dnd`.
- 👥 **Role-Based Control** — Secure Admin vs Member permissions via JWT.
- 📁 **Project Hub** — Manage project health, accent colors, and team members.
- 🔒 **Security Hardened** — Helmet, Morgan, and Rate Limiting integrated.
- ⚡ **Optimized Data Layer** — Prisma ORM with SQLite for fast, type-safe queries.

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Framer Motion, Recharts, Tailwind CSS |
| Backend | Node.js, Express.js |
| Database | SQLite with Prisma ORM |
| Auth | JWT (JSON Web Tokens) + bcrypt |
| Deployment | Railway |

---

## 📁 Project Structure

```
taskmanager/
├── backend/
│   ├── prisma/             # Database schema and migrations
│   ├── controllers/        # Business logic for all routes
│   ├── middleware/         # Auth, validation, and error handling
│   ├── routes/             # API endpoint definitions
│   └── server.js           # Entry point
└── frontend/
    ├── src/
    │   ├── api/            # Axios interceptors and services
    │   ├── components/     # High-fidelity UI components
    │   ├── context/        # Auth and state management
    │   └── pages/          # Application views
```

---

## ☁️ Railway Deployment

### Deploy Backend
1. Create a new Railway project.
2. Add a service from GitHub (select the `backend/` folder).
3. Set environment variables:
   ```
   DATABASE_URL="file:./dev.db"
   JWT_SECRET=your_secret_key
   NODE_ENV=production
   FRONTEND_URL=https://your-frontend.railway.app
   ```
4. Railway auto-detects Node.js and deploys.
   > [!NOTE]
   > SQLite data resets on every deployment. For persistent production data, use a Railway PostgreSQL service.

### Deploy Frontend
1. Add another service (select the `frontend/` folder).
2. Set environment variable:
   ```
   VITE_API_URL=https://your-backend.railway.app
   ```

---

## 🛠️ Local Development

1. **Install dependencies**:
   ```bash
   cd backend && npm install
   cd ../frontend && npm install
   ```

2. **Setup Database**:
   ```bash
   cd backend
   npx prisma db push
   npx prisma generate
   ```

3. **Run Dev Servers**:
   ```bash
   # Backend (port 5000)
   npm run dev
   # Frontend (port 3000)
   npm run dev
   ```
