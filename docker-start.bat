@echo off
echo =========================================
echo ShapeFit Docker Setup
echo =========================================
echo.

echo Checking if Docker is running...
docker ps >nul 2>&1
if errorlevel 1 (
    echo ERROR: Docker is not running!
    echo Please start Docker Desktop and try again.
    pause
    exit /b 1
)
echo [OK] Docker is running
echo.

echo Building and starting Docker services...
docker-compose up --build
echo.

echo =========================================
echo Setup Complete!
echo =========================================
echo.
echo Services available:
echo - Backend API:     http://localhost:8000
echo - API Docs:         http://localhost:8000/docs
echo - Database UI:       http://localhost:8080
echo - Coach QR Code:    http://localhost:8000/api/coach-qr
echo.
echo To access QR code directly:
echo   docker cp shapefit_backend:/app/coach_qr/coach_qr.png ./coach_qr.png
echo.
echo To stop all services:
echo   docker-compose down
echo.
echo To view logs:
echo   docker-compose logs -f
echo.
pause
