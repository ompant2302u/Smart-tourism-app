# Tour Tech - Start Both Servers
$root = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Tour Tech - Starting Both Servers" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Backend
Write-Host "`n[Backend] Installing dependencies..." -ForegroundColor Yellow
Set-Location "$root\backend"
pip install django djangorestframework django-cors-headers djangorestframework-simplejwt whitenoise --quiet
python manage.py migrate 2>$null
python manage.py collectstatic --noinput 2>$null

Write-Host "[Backend] Starting Django on http://localhost:8000 ..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$root\backend'; python manage.py runserver 8000" -WindowStyle Normal

Start-Sleep -Seconds 2

# Frontend
Write-Host "[Frontend] Starting React on http://localhost:3000 ..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$root\frontend'; npm run dev" -WindowStyle Normal

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  Frontend : http://localhost:3000" -ForegroundColor White
Write-Host "  Backend  : http://localhost:8000/api/" -ForegroundColor White
Write-Host "  Admin    : http://localhost:8000/admin/" -ForegroundColor White
Write-Host "========================================" -ForegroundColor Cyan
