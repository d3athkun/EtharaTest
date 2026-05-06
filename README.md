# TaskFlow (Ethara)

A full-stack project & task management app with role-based access control (Admin/Member) and a Super Admin panel, built with **Node.js + Express + Prisma + PostgreSQL** on the backend and **React + Vite** on the frontend.

## Live Demo

> **Backend:** `https://<your-railway-backend-url>`
> **Frontend:** `https://<your-railway-frontend-url>`

---

## Features

- **Authentication** – JWT-based signup/login with bcrypt password hashing
- **Projects** – Create, edit, delete projects; invite/remove members
- **Tasks** – Create, assign, filter, and update task status and priority
  - Status: `To Do` / `In Progress` / `Done`
  - Priority: `Low` / `Medium` / `High`
- **Role-Based Access** (per project):
  - **Admin**: Full CRUD on project, tasks, and members
  - **Member**: Can create tasks, update their own task status
- **Super Admin Panel** – An environment-gated system-wide admin can view all projects, members, and tasks across the platform, and manage member roles
- **Dashboard** – Stats cards, overdue tasks, recent activity
- **Health Check** – `GET /api/health` endpoint for uptime monitoring
- **Premium dark UI** – Built with Vanilla CSS, Inter font, glassmorphism

---

## Tech Stack

| Layer | Tech |
|---|---|
| Backend | Node.js, Express, Prisma ORM |
| Database | PostgreSQL |
| Auth | JWT + bcryptjs |
| Validation | Zod |
| Frontend | React, Vite, React Router |
| HTTP Client | Axios |
| Deployment | Railway |

---

## Local Development

### Prerequisites

- Node.js 20+
- PostgreSQL database

### Backend

```bash
cd EtharaTest
cp .env.example .env   # Fill in DATABASE_URL and JWT_SECRET
npm install
npx prisma migrate dev --name init
npm run dev            # Starts on http://localhost:5000
```

### Frontend

```bash
cd EtharaTest/frontend
npm install
npm run dev            # Starts on http://localhost:5173
```

Set `VITE_API_URL=http://localhost:5000/api` in `frontend/.env`.

---

## Environment Variables

### Backend (`.env`)

```
DATABASE_URL=postgresql://user:password@host:5432/dbname
JWT_SECRET=change-this-to-a-long-random-secret
PORT=5000
NODE_ENV=production
CLIENT_URL=https://your-frontend-url.railway.app
SUPER_ADMIN_EMAIL=                        # Optional — enables the Super Admin panel
```

### Frontend (`frontend/.env`)

```
VITE_API_URL=https://your-backend-url.railway.app/api
```

---

## API Endpoints

### Health

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/health` | Health check — returns `{ status: "ok" }` |

### Auth

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/signup` | Register new user |
| POST | `/api/auth/login` | Login, returns JWT |

### Projects

| Method | Endpoint | Auth | Role |
|---|---|---|---|
| GET | `/api/projects` | ✅ | Any member |
| POST | `/api/projects` | ✅ | Authenticated |
| GET | `/api/projects/:id` | ✅ | Member |
| PATCH | `/api/projects/:id` | ✅ | Admin |
| DELETE | `/api/projects/:id` | ✅ | Admin |
| POST | `/api/projects/:id/members` | ✅ | Admin |
| DELETE | `/api/projects/:id/members/:userId` | ✅ | Admin |

### Tasks

| Method | Endpoint | Auth | Role |
|---|---|---|---|
| GET | `/api/tasks` | ✅ | Member |
| POST | `/api/tasks` | ✅ | Member |
| GET | `/api/tasks/:id` | ✅ | Member |
| PATCH | `/api/tasks/:id` | ✅ | Admin = all fields; Member = status only |
| DELETE | `/api/tasks/:id` | ✅ | Admin or creator |

### Dashboard

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/dashboard` | Stats + overdue + recent tasks |

---

## Deployment on Railway

### 1. Backend Service

1. Create a new Railway project
2. Add a **PostgreSQL** database plugin → copy `DATABASE_URL`
3. Deploy the root `EtharaTest/` directory as the backend service
4. Set environment variables:
   ```
   DATABASE_URL=<from Railway PostgreSQL>
   JWT_SECRET=<random secret>
   PORT=5000
   NODE_ENV=production
   CLIENT_URL=<your frontend Railway URL>
   SUPER_ADMIN_EMAIL=<optional, enables super admin panel>
   ```
5. Start command: `node src/index.js` (migrations run automatically on startup in production)

### 2. Frontend Service

1. Add another Railway service for the `frontend/` directory
2. Build command: `npm run build`
3. Output directory: `dist`
4. Set environment variables:
   ```
   VITE_API_URL=<your backend Railway URL>/api
   ```

---

## Database Schema

```
User          – id, name, email, passwordHash, createdAt
Project       – id, name, description, createdAt
ProjectMember – id, projectId, userId, role (ADMIN|MEMBER), joinedAt
Task          – id, title, description, status (TODO|IN_PROGRESS|DONE),
                priority (LOW|MEDIUM|HIGH), dueDate, projectId,
                creatorId, assigneeId, createdAt, updatedAt
```

---

## License

MIT
