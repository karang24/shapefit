@echo off
echo =========================================
echo ShapeFit Backend Setup Script
echo =========================================
echo.

echo Step 1: Checking Python version...
python check_python_version.py
echo.

echo Step 2: Checking virtual environment...
if not exist "venv" (
    echo Creating virtual environment...
    python -m venv venv
    echo [OK] Virtual environment created
) else (
    echo Virtual environment already exists
)
echo.

echo Step 3: Activating virtual environment...
call venv\Scripts\activate.bat
echo [OK] Virtual environment activated
echo.

echo Step 4: Installing dependencies...
pip install -r requirements.txt
if errorlevel 1 (
    echo [ERROR] Failed to install dependencies
    pause
    exit /b 1
)
echo [OK] Dependencies installed
echo.

echo Step 5: Checking .env file...
if not exist ".env" (
    echo Creating .env file from .env.example...
    copy .env.example .env
    echo [OK] .env file created
    echo Please edit .env with your database credentials
    notepad .env
    echo Please continue after editing .env...
    pause
) else (
    echo .env file already exists
)
echo.

echo Step 6: Checking PostgreSQL connection...
psql -U postgres -c "SELECT 1" >nul 2>&1
if errorlevel 1 (
    echo [WARNING] Cannot connect to PostgreSQL. Please ensure:
    echo   - PostgreSQL is running
    echo   - Database 'shapefit' exists
    echo   - Credentials in .env are correct
    echo.
    echo Press any key to continue anyway...
    pause >nul
)
echo.

echo Step 7: Initializing database...
python init_db.py
if errorlevel 1 (
    echo [ERROR] Failed to initialize database
    pause
    exit /b 1
)
echo [OK] Database initialized
echo.

echo Step 8: Creating coach account...
python create_coach.py
echo.

echo Step 9: Generating coach QR code...
python generate_qr.py
echo.

echo =========================================
echo Setup Complete!
echo =========================================
echo.
echo Next steps:
echo 1. Start backend server:
echo    uvicorn app.main:app --reload
echo.
echo 2. Test API:
echo    python test_api.py
echo.
echo 3. Setup mobile app:
echo    cd ..\mobile
echo    npm install
echo    npx expo start
echo.
pause
