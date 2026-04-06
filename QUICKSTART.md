# ShapeFit Quick Start Guide

## Prerequisites

- **Python 3.10+** (3.12 recommended, 3.13+ requires pillow>=10.4.0)
- Node.js 16+
- PostgreSQL 12+
- Git

## Setup Time: ~10 minutes

### Step 0: Check Python Version

```bash
cd backend
python check_python_version.py
```

This will verify your Python version and provide compatibility instructions.

### Step 1: Clone and Setup Backend (5 minutes)

```bash
# Install Python dependencies
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Setup database
cp .env.example .env
# Edit .env with your database credentials

# Initialize and create coach
python init_db.py
python create_coach.py
python generate_qr.py

# Start backend
uvicorn app.main:app --reload
```

### Step 2: Setup Mobile App (5 minutes)

```bash
# New terminal
cd mobile
npm install

# Start Expo
npx expo start
```

### Step 3: Test the App

1. Open Expo on your device (scan QR code from terminal)
2. Register new account
3. Scan the coach QR code (from `backend/coach_qr.png`)
4. Log a workout!

## One-Command Start (After Setup)

**Windows:**
```bash
start.bat
```

**Linux/Mac:**
```bash
./start.sh
```

## Common Commands

```bash
# Backend
cd backend
source venv/bin/activate
uvicorn app.main:app --reload

# Test API
python test_api.py

# Regenerate coach QR
python generate_qr.py

# Mobile
cd mobile
npx expo start
npx expo start --android
npx expo start --ios

# Build APK
eas build --platform android
```

## Troubleshooting

**Python 3.13 Pillow installation error?**
```bash
cd backend
# Update Pillow version for Python 3.13+ compatibility
sed -i 's/pillow==10.1.0/pillow>=10.4.0/g' requirements.txt
# Reinstall
pip install -r requirements.txt
```

**Backend won't start?**
- Check PostgreSQL is running
- Verify DATABASE_URL in .env
- Ensure .env file exists: `cp .env.example .env`
- Check port 8000 isn't in use

**Missing .env file error?**
```bash
cd backend
cp .env.example .env
# Edit .env with your database credentials
```

**Mobile can't connect?**
- Android emulator: use `http://10.0.2.2:8000`
- iOS simulator: use `http://localhost:8000`
- Physical device: use computer's IP address
- Update API_URL in `mobile/src/api/client.ts`

**QR scan not working?**
- Ensure camera permission granted
- Use `backend/coach_qr.png` to scan
- Good lighting helps scanning

## Next Steps

- Add more exercises to your workouts
- Track your progress over time
- Build muscle with progressive overload!

Need help? Check README.md for full documentation.
