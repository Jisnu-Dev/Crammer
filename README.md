<div align="center">

# 📚 Crammer+

### AI-Powered Student Study Companion

*Study smarter. Not harder.*

[![React Native](https://img.shields.io/badge/React_Native-0.81-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-SDK_54-000020?style=for-the-badge&logo=expo&logoColor=white)](https://expo.dev/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.109-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://neon.tech/)
[![Google Gemini](https://img.shields.io/badge/Google_Gemini-AI-8E75B2?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev/)

</div>

---

## What is Crammer+?

**Crammer+** is a mobile application that turns a student's own study materials into a complete, AI-driven learning experience. Upload your notes or syllabus, and the app automatically generates a personalized study plan, quizzes, and assignments — all powered by Google Gemini AI. Track your progress, chat with an AI tutor, and stay on top of your academics in one unified platform.

---

## Features

| Feature | Description |
|---|---|
| **AI Study Plans** | Generate structured multi-week study plans from any subject name or uploaded material |
| **File Upload & Context** | Upload notes and syllabi; AI uses the content to personalize all responses |
| **AI Chat Assistant** | Ask study questions with answers grounded in your uploaded files |
| **Per-Topic Chat** | Dedicated AI chat thread for every topic in your study plan |
| **AI Quizzes** | Auto-generated quizzes per topic with score tracking |
| **Assignments** | Auto-created assignments from study plans with status tracking |
| **Progress Tracking** | Mark topics complete and monitor overall study progress |
| **Dashboard** | At-a-glance overview of all plans, quizzes, and assignments |
| **Secure Auth** | JWT-based authentication with role support (student, mentor, admin) |

---

## Tech Stack

### Frontend
- **React Native** 0.81 + **React** 19
- **Expo** SDK ~54 with **Expo Router** (file-based navigation)
- **TypeScript**
- **Expo EAS** for Android APK/AAB builds

### Backend
- **FastAPI** (Python) with **Uvicorn** ASGI server
- **SQLAlchemy** 2 ORM + **psycopg2**
- **PostgreSQL** hosted on **Neon**
- **JWT** authentication with **bcrypt** password hashing
- **Google Gemini** REST API via `httpx`

### Infrastructure
- Backend deployed on **Render**
- Database hosted on **Neon** (serverless PostgreSQL)
- Mobile builds via **Expo EAS**

---

## Project Structure

```
Crammer+/
├── frontend/                       # Expo React Native mobile app
│   ├── app/
│   │   ├── (auth)/                 # Login & Signup screens
│   │   │   ├── login.tsx
│   │   │   └── signup.tsx
│   │   ├── (tabs)/                 # Main app screens
│   │   │   ├── index.tsx           # Dashboard / Home
│   │   │   ├── study.tsx           # AI Chat Assistant
│   │   │   ├── study-plans.tsx     # Study Plans list
│   │   │   ├── study-plan-detail.tsx
│   │   │   ├── topic-chat.tsx      # Per-topic AI Chat
│   │   │   ├── topic-quiz.tsx      # AI Quizzes
│   │   │   ├── assignments.tsx     # All Assignments
│   │   │   ├── subject-assignments.tsx
│   │   │   └── files.tsx           # File Management
│   │   └── _layout.tsx             # Root layout + AuthProvider
│   ├── components/                 # Reusable UI components
│   ├── constants/                  # API base URL config
│   ├── contexts/                   # AuthContext (global auth state)
│   ├── services/                   # API service layer
│   │   ├── api.ts                  # Auth API calls
│   │   └── fileApi.ts              # File API calls
│   └── utils/                      # Token & auth utilities
│
└── backend/                        # FastAPI Python backend
    └── app/
        ├── main.py                 # App entry point, CORS, routing
        ├── api/v1/
        │   ├── routes/             # Individual route modules
        │   └── endpoints.py        # Router registration
        ├── config/                 # Pydantic settings
        ├── core/                   # DB connection, logging, exceptions
        ├── models/                 # SQLAlchemy ORM models
        ├── schemas/                # Pydantic request/response schemas
        ├── services/               # Business logic layer
        └── utils/                  # JWT helpers
```

---

## Database Schema

```
users            → id, full_name, email, password_hash, role, is_active
files            → id, filename, category, subject, extracted_text, uploaded_by (FK users)
study_plans      → id, user_id (FK), subject_name, plan_data (JSON), total_topics, total_hours
assignments      → id, user_id (FK), plan_id (FK), title, type, difficulty, status, week_number
quizzes          → id, plan_id (FK), topic_id, questions (JSON), user_answers, score, is_completed
topic_chat_msgs  → id, user_id (FK), plan_id (FK), topic_id, sender, text
```

---

## API Reference

All endpoints are prefixed with `/api/v1`.

| Module | Endpoints |
|---|---|
| **Auth** | `POST /auth/signup` · `POST /auth/login` · `GET /auth/me` |
| **Files** | `POST /files/upload` · `GET /files/` · `GET /files/{id}` · `DELETE /files/{id}` · `GET /files/context` |
| **Chat** | `POST /chat/send` |
| **Study Plans** | `POST /study-plans/generate` · `GET /study-plans/` · `GET /study-plans/{id}` · `DELETE /study-plans/{id}` |
| **Topics** | `PATCH /study-plans/{id}/topics/{topic_id}/status` |
| **Quizzes** | `POST /study-plans/{id}/topics/{topic_id}/quiz` · `PATCH .../quiz/results` |
| **Topic Chat** | `GET/POST/DELETE /study-plans/{id}/topics/{topic_id}/chat` |
| **Assignments** | `GET /assignments/` · `GET /assignments/subject/{plan_id}` · `PATCH /assignments/{id}/status` |
| **Dashboard** | `GET /dashboard/stats` |
| **Health** | `GET /health/` · `GET /health/db` · `GET /health/detailed` |

> Interactive docs available at `/docs` (Swagger UI) and `/redoc` (ReDoc).

---

## Getting Started

### Prerequisites

- **Node.js** >= 18 and **npm**
- **Python** >= 3.10
- **PostgreSQL** database (or a [Neon](https://neon.tech) account)
- **Google Gemini API Key** — [Get one here](https://ai.google.dev/)

---

### Backend Setup

```bash
# 1. Navigate to the backend directory
cd backend

# 2. Install Python dependencies
pip install -r requirements.txt

# 3. Create your environment file
cp .env.example .env
```

Fill in your `.env`:

```env
DATABASE_URL=postgresql://user:password@host/dbname
SECRET_KEY=your_jwt_secret_key
GEMINI_API_KEY=your_google_gemini_api_key
DEBUG=True
PORT=8000
```

```bash
# 4. Start the server
uvicorn app.main:app --reload
# OR use the provided script
./start.sh        # Linux/macOS
start.bat         # Windows
```

The API will be available at `http://localhost:8000`.

---

### Frontend Setup

```bash
# 1. Navigate to the frontend directory
cd frontend

# 2. Install dependencies
npm install

# 3. Start the Expo development server
npx expo start
```

To point the app at your local backend, update `constants/api.ts`:

```ts
export const API_BASE_URL = "http://<your-local-ip>:8000";
```

Scan the QR code with **Expo Go** on your Android/iOS device to run the app.

---

### Android Build (via EAS)

```bash
# Install EAS CLI
npm install -g eas-cli

# Build a preview APK
eas build --platform android --profile preview
```

---

## Environment Variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string (Neon or local) |
| `SECRET_KEY` | Secret key for JWT token signing |
| `GEMINI_API_KEY` | Google Gemini API key for AI features |
| `DEBUG` | Enable debug mode (`True` / `False`) |
| `PORT` | Port for the backend server (default: `8000`) |

---

## How It Works

```
Student uploads notes/syllabus
        ↓
Backend extracts text from file & stores in DB
        ↓
Student requests a Study Plan for a subject
        ↓
Backend sends subject + file context → Google Gemini
        ↓
Gemini returns structured plan (JSON) → stored in DB
        ↓
Student studies topics, chats with AI, takes quizzes
        ↓
Progress tracked: topic status, quiz scores, assignment completion
```

---

## Deployment

| Service | Platform |
|---|---|
| Backend API | [Render](https://render.com) |
| Database | [Neon](https://neon.tech) (Serverless PostgreSQL) |
| Mobile App | [Expo EAS](https://expo.dev/eas) (Android APK/AAB) |

---

## License

This project was developed as a university project at **BIT (Bankura Unnayani Institute of Engineering)**. All rights reserved.

---

<div align="center">

Built with dedication by the Crammer+ team.

*"The secret of getting ahead is getting started."*

</div>
