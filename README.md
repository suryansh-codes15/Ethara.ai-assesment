# 🚀 TaskFlow — Team Task Manager

A production-ready full-stack web application for managing team projects and tasks with role-based access control.

**Live Demo**: [your-url.railway.app](https://your-url.railway.app)  
**API Docs**: [your-backend.railway.app](https://your-backend.railway.app)

---

## 📸 Features

- ✅ **JWT Authentication** — Secure signup/login with password hashing
- 👥 **Role-Based Access Control** — Admin vs Member permissions
- 📁 **Project Management** — Create projects, add/remove members
- ✅ **Task Management** — Kanban board with drag-through status updates
- 📊 **Dashboard** — Real-time stats, charts, overdue tracking
- 🔒 **Security** — Protected routes, middleware validation, Joi schemas

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Tailwind CSS, Recharts, React Router |
| Backend | Node.js, Express.js |
| Database | MongoDB with Mongoose ODM |
| Auth | JWT (JSON Web Tokens) + bcrypt |
| Deployment | Railway |

---

## 📁 Project Structure

```
taskmanager/
├── backend/
│   ├── config/
│   │   └── db.js                # MongoDB connection
│   ├── controllers/
│   │   ├── authController.js    # Auth logic
│   │   ├── projectController.js # Project CRUD
│   │   ├── taskController.js    # Task CRUD
│   │   └── dashboardController.js
│   ├── middleware/
│   │   ├── auth.js              # JWT verify + role check
│   │   ├── validate.js          # Joi validation schemas
│   │   └── errorHandler.js      # Global error handler
│   ├── models/
│   │   ├── User.js
│   │   ├── Project.js
│   │   └── Task.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── projects.js
│   │   ├── tasks.js
│   │   └── dashboard.js
│   ├── server.js
│   ├── .env.example
│   └── railway.toml
│
└── frontend/
    ├── src/
    │   ├── api/
    │   │   ├── axios.js         # Axios config + interceptors
    │   │   └── index.js         # API service methods
    │   ├── components/
    │   │   ├── Layout.jsx       # Sidebar + navigation
    │   │   ├── Modal.jsx
    │   │   ├── TaskCard.jsx
    │   │   ├── Toast.jsx
    │   │   └── Loader.jsx
    │   ├── context/
    │   │   └── AuthContext.jsx  # Global auth state
    │   └── pages/
    │       ├── Login.jsx
    │       ├── Signup.jsx
    │       ├── Dashboard.jsx    # Stats + charts
    │       ├── Projects.jsx     # Project list
    │       └── ProjectView.jsx  # Kanban board
    ├── .env.example
    └── railway.toml
```

---

## 🔌 API Reference

### Auth
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/auth/signup` | Public | Register user |
| POST | `/api/auth/login` | Public | Login |
| GET | `/api/auth/me` | Private | Current user |
| GET | `/api/auth/users` | Admin | All users |

### Projects
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/projects` | Private | List projects |
| POST | `/api/projects` | Admin | Create project |
| GET | `/api/projects/:id` | Private | Get project |
| PUT | `/api/projects/:id` | Admin | Update project |
| DELETE | `/api/projects/:id` | Admin | Delete project |
| POST | `/api/projects/:id/add-member` | Admin | Add member |
| POST | `/api/projects/:id/remove-member` | Admin | Remove member |

### Tasks
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/tasks` | Private | List tasks (filtered) |
| POST | `/api/tasks` | Admin | Create task |
| GET | `/api/tasks/:id` | Private | Get task |
| PATCH | `/api/tasks/:id` | Private* | Update task |
| DELETE | `/api/tasks/:id` | Admin | Delete task |

*Members can only update status of their own assigned tasks

### Dashboard
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/dashboard` | Private | Stats + recent tasks |

---

## 🛠️ Local Development

### Prerequisites
- Node.js 18+
- MongoDB Atlas account (or local MongoDB)

### Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Fill in your MONGODB_URI and JWT_SECRET in .env
npm run dev
```

### Frontend Setup
```bash
cd frontend
npm install
cp .env.example .env
# Set VITE_API_URL=http://localhost:5000
npm run dev
```

---

## ☁️ Railway Deployment

### Deploy Backend
1. Create a new Railway project
2. Add a service from GitHub repo (select `backend/` folder)
3. Set environment variables:
   ```
   MONGODB_URI=mongodb+srv://...
   JWT_SECRET=your_secret_key
   NODE_ENV=production
   FRONTEND_URL=https://your-frontend.railway.app
   ```
4. Railway auto-detects Node.js and deploys

### Deploy Frontend
1. Add another service in same Railway project (select `frontend/` folder)
2. Set environment variable:
   ```
   VITE_API_URL=https://your-backend.railway.app
   ```
3. Deploy — Railway builds with `npm run build`

---

## 🔐 Role-Based Access

| Feature | Admin | Member |
|---------|-------|--------|
| Create/delete projects | ✅ | ❌ |
| Add/remove project members | ✅ | ❌ |
| Create/delete tasks | ✅ | ❌ |
| Edit any task | ✅ | ❌ |
| Update own task status | ✅ | ✅ |
| View own projects & tasks | ✅ | ✅ |
| View all projects & tasks | ✅ | ❌ |
| View all users | ✅ | ❌ |
| View dashboard stats | ✅ | ✅ (own data) |

---

## 📊 Data Models

```javascript
// User
{ name, email, password (hashed), role: 'admin'|'member' }

// Project  
{ name, description, createdBy (User), members [User], status }

// Task
{ title, description, project (Project), assignedTo (User),
  createdBy (User), status: 'todo'|'in-progress'|'done',
  priority: 'low'|'medium'|'high', dueDate }
```

---

## 🎥 Demo Video

[Watch the 3-minute demo →](https://your-video-link.com)

---

## 👤 Author

Built with ❤️ for the Full-Stack Assignment.
