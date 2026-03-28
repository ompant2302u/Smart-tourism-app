# Tour Tech Innovators — How to Run

## Quick Start (Recommended)

Double-click **`start.bat`** — it starts both servers automatically.

Or in PowerShell:
```powershell
.\start.ps1
```

---

## Manual Setup

### Backend (Django — Port 8000)

```cmd
cd backend
pip install django djangorestframework django-cors-headers djangorestframework-simplejwt whitenoise
python manage.py migrate
python manage.py collectstatic --noinput
python manage.py runserver 8000
```

### Create Admin User (first time only)

```cmd
cd backend
python manage.py createsuperuser
```

Then open: **http://localhost:8000/admin/**

### Frontend (React + Vite — Port 3000)

```cmd
cd frontend
npm install
npm run dev
```

Then open: **http://localhost:3000**

---

## URLs

| Service  | URL |
|----------|-----|
| Frontend | http://localhost:3000 |
| API      | http://localhost:8000/api/ |
| **Admin Panel** | **http://localhost:8000/admin/** |

---

## Troubleshooting

- **Admin panel not loading styles** → Run `python manage.py collectstatic --noinput` in the `backend` folder
- **Admin panel login fails** → Create a superuser: `python manage.py createsuperuser`
- **CORS errors** → Make sure backend is running on port 8000
- **npm not found** → Install Node.js from https://nodejs.org (LTS)
- **Port 3000 busy** → Edit `frontend/vite.config.js` and change port
