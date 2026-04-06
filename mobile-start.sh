#!/bin/bash

echo "========================================="
echo "ShapeFit Mobile - Quick Start"
echo "========================================="
echo

echo "Checking dependencies..."
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js not installed!"
    echo "Please install from https://nodejs.org/"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "ERROR: npm not installed!"
    echo "Please install Node.js which includes npm"
    exit 1
fi

echo "[OK] Node.js and npm installed"
echo

echo "Checking if backend is running..."
if ! curl -s http://localhost:8000/ > /dev/null; then
    echo "WARNING: Backend not accessible at http://localhost:8000"
    echo "Please start backend first:"
    echo "  cd .."
    echo "  docker-compose up"
    echo
    read -p "Press Enter to continue anyway, or Ctrl+C to cancel..."
fi

echo "[OK] Backend is running"
echo

echo "========================================="
echo "Choose Development Mode:"
echo "========================================="
echo
echo "1. Development with Emulator"
echo "2. Development with Physical Device (Expo Go)"
echo "3. Build APK for Testing"
echo "4. Build APK for Production"
echo
read -p "Enter your choice (1-4): " choice

case $choice in
    1)
        echo
        echo "Starting development server..."
        cd mobile
        npm start
        ;;
    2)
        echo
        echo "For physical device testing:"
        echo "1. Install Expo Go from Play Store / App Store"
        echo "2. Start development server:"
        cd mobile
        npm start
        echo "3. Scan QR code with Expo Go app"
        ;;
    3)
        echo
        echo "Building preview APK..."
        cd mobile
        npm run build:android
        echo
        echo "Build complete! Check https://expo.dev/dashboard"
        ;;
    4)
        echo
        echo "Building production APK..."
        cd mobile
        npm run build:android:prod
        echo
        echo "Build complete! Check https://expo.dev/dashboard"
        ;;
    *)
        echo "Invalid choice. Please try again."
        exit 1
        ;;
esac

echo
echo "========================================="
echo "Quick Start Complete!"
echo "========================================="
echo
echo "Available Commands:"
echo "  npm start              - Start development server"
echo "  npm run build:android  - Build preview APK"
echo "  npm run build:android:prod - Build production APK"
echo "  npm run configure      - Configure EAS build"
echo "  npm run lint            - Check code quality"
echo
echo "See MOBILE_DEPLOYMENT.md for detailed guide"
echo
