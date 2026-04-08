# AI Learning Companion

## Setup

### Backend (Django)

1. Fill in `backend/.env`:
```
GEMINI_API_KEY=your_key_here
SECRET_KEY=your_django_secret_key
DEBUG=True
```

2. Run migrations & start server:
```bash
cd backend
py -3.12 manage.py migrate
py -3.12 manage.py runserver
```

### Frontend (React + Vite + Tailwind v4)

```bash
cd frontend
npm install
npm run dev
```

App runs at: http://localhost:5173  
API runs at: http://localhost:8000

## API Endpoints

| Method | URL | Description |
|--------|-----|-------------|
| POST | `/api/content/process/` | Process YouTube URL or text |
| POST | `/api/content/chat/` | Streaming chat (SSE) |
| GET | `/api/learning/sessions/` | All sessions |
| GET | `/api/learning/sessions/<id>/` | Session detail + messages |

## Features
- YouTube transcript extraction
- Gemini AI analysis (summary + key points)
- Real-time streaming chat (SSE)
- Weak point detection & tracking
- Session history sidebar
