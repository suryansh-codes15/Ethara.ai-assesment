# 🚀 TaskFlow.ai — Enterprise AI Task Orchestration

TaskFlow.ai is a high-performance, premium SaaS platform for team task management. It features a stunning glass-morphism UI, real-time AI-driven analytics, and enterprise-grade security.

**Live Site**: [etharaai-assesment_production.up.railway.app](https://etharaai-assesment_production.up.railway.app)

---

## 🎨 Design System: "Obsidian Pro"
- **Glassmorphism**: Deep blurs and translucent surfaces for a premium feel.
- **Layered Depth**: Distinct surface levels with subtle glow effects.
- **Micro-animations**: Smooth transitions using Framer Motion.
- **Dynamic Themes**: Deep indigo/violet color palette tailored for professional focus.

---

## 📸 Key Features

- 🧠 **AI Task Generation** — Groq-powered strategy generator that builds 8+ milestones in seconds.
- 📊 **Real-Time Dashboard** — Dynamic stats synced directly from the database with automated refresh.
- 📉 **Advanced Analytics** — Velocity charts, activity heatmaps, and burndown graphs for executive insights.
- 📋 **Premium Kanban** — Drag-and-drop workflow with `@hello-pangea/dnd`.
- 👥 **Role-Based Control** — Secure Admin vs Member permissions via JWT.
- 🔒 **Security Hardened** — Helmet, Morgan, XSS Protection, and Rate Limiting integrated.
- ⚡ **Optimized Data Layer** — Prisma ORM with SQLite (dev) / PostgreSQL (prod) support.

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Framer Motion, Recharts, Tailwind CSS |
| Backend | Node.js, Express.js |
| AI Engine | Groq SDK (Llama 3) |
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
   GROQ_API_KEY=your_key
   NODE_ENV=production
   FRONTEND_URL=https://your-frontend.railway.app
   ```

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
