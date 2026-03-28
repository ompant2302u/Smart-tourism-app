@echo off
echo ========================================
echo   Tour Tech - Starting Both Servers
echo ========================================

echo.
echo [1/3] Setting up backend...
cd /d "%~dp0backend"
pip install djangorestframework django-cors-headers djangorestframework-simplejwt whitenoise --quiet
python manage.py migrate --run-syncdb 2>nul
python manage.py migrate 2>nul
python manage.py collectstatic --noinput 2>nul

echo.
echo [2/3] Starting Django backend on http://localhost:8000 ...
start "Tour Tech Backend" cmd /k "cd /d "%~dp0backend" && python manage.py runserver 8000"

echo.
echo [3/3] Starting React frontend on http://localhost:3000 ...
cd /d "%~dp0frontend"
start "Tour Tech Frontend" cmd /k "cd /d "%~dp0frontend" && npm run dev"

echo.
echo ========================================
echo   Both servers starting...
echo   Frontend: http://localhost:3000
echo   Backend:  http://localhost:8000/api/
echo   Admin:    http://localhost:8000/admin/
echo ========================================
timeout /t 3
