#!/bin/bash

echo "Starting ShapeFit Fitness Tracker..."
echo

echo "Starting Backend..."
cd backend
source venv/bin/activate
uvicorn app.main:app --reload &
BACKEND_PID=$!
echo "Backend running at http://localhost:8000 (PID: $BACKEND_PID)"
echo

echo "Starting Mobile App..."
cd ../mobile
npx expo start &
MOBILE_PID=$!
echo "Mobile Expo DevTools should open in your browser (PID: $MOBILE_PID)"
echo

echo "Press Ctrl+C to stop both servers"
wait
