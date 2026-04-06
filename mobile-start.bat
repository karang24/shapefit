@echo off
echo =========================================
echo ShapeFit Mobile - Quick Start
echo =========================================
echo.

echo Checking dependencies...
where node >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js not installed!
    echo Please install from https://nodejs.org/
    pause
    exit /b 1
)

where npm >nul 2>&1
if errorlevel 1 (
    echo ERROR: npm not installed!
    pause
    exit /b 1
)

echo [OK] Node.js and npm installed
echo.

echo Checking if backend is running...
curl -s http://localhost:8000/ >nul 2>&1
if errorlevel 1 (
    echo WARNING: Backend not accessible at http://localhost:8000
    echo Please start backend first:
    echo   cd ..
    echo   docker-compose up
    echo.
    pause
)

echo [OK] Backend is running
echo.

echo =========================================
echo Choose Development Mode:
echo =========================================
echo.
echo 1. Development with Emulator (Android Studio/AVD)
echo 2. Development with Physical Device (Expo Go)
echo 3. Build APK for Testing
echo 4. Build APK for Production
echo.
set /p choice=
echo Enter your choice (1-4):
if %choice%==1 goto emulator
if %choice%==2 goto device
if %choice%==3 goto build_test
if %choice%==4 goto build_prod
goto end

:emulator
echo.
echo Starting development server...
cd mobile
npm start
goto end

:device
echo.
echo For physical device testing:
echo 1. Install Expo Go from Play Store / App Store
echo 2. Start development server:
cd mobile
npm start
echo 3. Scan QR code with Expo Go app
echo.
goto end

:build_test
echo.
echo Building preview APK...
cd mobile
call npm run build:android
echo.
echo Build complete! Check https://expo.dev/dashboard
echo.
goto end

:build_prod
echo.
echo Building production APK...
cd mobile
call npm run build:android:prod
echo.
echo Build complete! Check https://expo.dev/dashboard
echo.
goto end

:end
echo.
echo =========================================
echo Quick Start Complete!
echo =========================================
echo.
echo Available Commands:
echo   npm start              - Start development server
echo   npm run build:android  - Build preview APK
echo   npm run build:android:prod - Build production APK
echo   npm run configure      - Configure EAS build
echo   npm run lint            - Check code quality
echo.
echo See MOBILE_DEPLOYMENT.md for detailed guide
echo.
pause
