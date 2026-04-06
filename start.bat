@echo off
echo Starting ShapeFit Fitness Tracker...
echo.
echo Starting Backend...
cd backend
start cmd /k "venv\Scripts\activate && uvicorn app.main:app --reload"
echo.
echo Backend running at http://localhost:8000
echo.
echo Starting Mobile App...
cd ..\mobile
start cmd /k "npx expo start"
echo.
echo Mobile Expo DevTools should open in your browser
echo.
