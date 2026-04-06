# ShapeFit Fitness Tracker

A mobile fitness tracking application for athletes to log workouts, scan QR codes to start sessions with a coach, and track body metrics.

## Tech Stack

### Backend
- FastAPI
- PostgreSQL
- SQLAlchemy
- JWT Authentication
- QRCode (for generating coach QR codes)
- **Docker & Docker Compose** (recommended for local development)

### Mobile
- React Native
- Expo
- Expo Camera (QR scanning)

## Project Structure

```
shapefit2/
├── backend/                      # FastAPI backend
│   ├── app/
│   │   ├── auth/                # Authentication endpoints
│   │   ├── sessions/             # Session management
│   │   ├── workouts/             # Workout logging
│   │   └── body_metrics/         # Body metrics tracking
│   ├── init_db.py               # Initialize database
│   ├── create_coach.py          # Create coach account
│   ├── generate_qr.py           # Generate coach QR code
│   ├── test_api.py              # Test API endpoints
│   ├── requirements.txt
│   └── .env.example
│
└── mobile/                      # React Native mobile app
    ├── src/
    │   ├── components/           # Reusable components
    │   ├── screens/              # App screens
    │   ├── navigation/           # Navigation setup
    │   ├── api/                  # API client
    │   ├── context/              # Auth context
    │   └── types/                # TypeScript types
    ├── app.json
    └── package.json
```

## Prerequisites

### Python Version
- **Recommended:** Python 3.12
- **Minimum:** Python 3.10
- **Python 3.13+** works but requires `pillow>=10.4.0`
- Check your Python version: `python --version`

### Other Requirements
- Node.js 16+
- PostgreSQL 12+
- Git

## Quick Start

**Recommended:** Use Docker for the fastest and easiest setup, especially on Windows.

### Option 1: Docker Setup (Recommended) ⭐

**Prerequisites:**
- Docker Desktop installed and running

**Start everything with one command:**
```bash
docker-compose up --build
```

Or use the automated scripts:
- Windows: `docker-start.bat`
- Linux/Mac: `./docker-start.sh`

**That's it!** Docker will automatically:
- ✅ Install and configure PostgreSQL
- ✅ Install Python dependencies
- ✅ Initialize database
- ✅ Create coach account (coach@shapefit.com / coach123)
- ✅ Generate QR code
- ✅ Start FastAPI backend server

**Access Services:**
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/docs
- Database UI: http://localhost:8080
- Coach QR Code: http://localhost:8000/api/coach-qr

**Stop services:**
```bash
docker-compose down
```

**For detailed Docker instructions, see:** [DOCKER.md](DOCKER.md)

### Option 2: Manual Setup

**Prerequisites:**
- Python 3.10+ (3.12 recommended, 3.13+ requires pillow>=10.4.0)
- PostgreSQL 12+ installed and running
- Node.js 16+ and npm

### Backend Setup (Manual)

1. **Navigate to backend directory:**
```bash
cd backend
```

2. **Create virtual environment:**
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. **Install dependencies:**
```bash
pip install -r requirements.txt
```

4. **Configure environment:**
```bash
cp .env.example .env
```

Edit `.env` with your database configuration:
```env
DATABASE_URL=postgresql://user:password@localhost:5432/shapefit
SECRET_KEY=your-secret-jwt-key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080
```

5. **Create PostgreSQL database:**
```bash
psql -U postgres
CREATE DATABASE shapefit;
\q
```

6. **Initialize database:**
```bash
python init_db.py
```

7. **Create coach account:**
```bash
python create_coach.py
```

This creates:
- Email: `coach@shapefit.com`
- Password: `coach123`

8. **Generate coach QR code:**
```bash
python generate_qr.py
```

This creates `coach_qr.png` that athletes can scan.

9. **Start the server:**
```bash
uvicorn app.main:app --reload
```

Backend will be available at `http://localhost:8000`
API documentation: `http://localhost:8000/docs`

10. **Test the API (optional):**
```bash
python test_api.py
```

### Mobile App Setup

1. **Navigate to mobile directory:**
```bash
cd mobile
```

2. **Install dependencies:**
```bash
npm install
```

3. **Update API URL if needed:**
Edit `mobile/src/api/client.ts`:
```typescript
const API_BASE_URL = 'http://YOUR_BACKEND_IP:8000';
```
For Android emulator, use `http://10.0.2.2:8000`
For iOS simulator, use `http://localhost:8000`
For physical device, use your computer's IP address.

4. **Run the app:**
```bash
npx expo start
```

Press `a` for Android or `i` for iOS.

5. **Test the app:**
- Register a new athlete account
- Login
- Scan the coach QR code (use `coach_qr.png` from backend)
- Log exercises
- Track body metrics
- View history

## Features

### Dashboard
- Weekly workout session progress
- Latest weight and waist measurements
- Quick action buttons for common tasks

### QR Scanner
- Scan coach QR code to start sessions
- Automatic session creation and navigation

### Add Exercise
- Log exercises with weight, reps, and sets
- View exercises in current session
- Finish session when done

### Body Metrics
- Log weight and waist circumference
- Track metrics over time
- View historical data

### History
- View all past workouts
- Track exercise progress over time
- See progressive overload indicators

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login and get JWT token
- `GET /api/auth/me` - Get current user info

### Sessions
- `POST /api/sessions/start` - Start new session (with QR token)
- `GET /api/sessions/active` - Get active session
- `PUT /api/sessions/{id}/finish` - Finish session

### Workouts
- `POST /api/workouts/` - Add workout log
- `GET /api/workouts/history` - Get workout history
- `GET /api/workouts/progress/{exercise}` - Get exercise progress

### Body Metrics
- `POST /api/body-metrics/` - Log body metrics
- `GET /api/body-metrics/` - Get all metrics
- `GET /api/body-metrics/latest` - Get latest metrics

### Dashboard
- `GET /api/dashboard` - Get dashboard summary

## Development Notes

### Architecture
- Single coach architecture (simplified setup)
- JWT tokens expire after 7 days (configurable)
- All API requests require authentication (except register/login)
- QR code format: `COACH-{timestamp}-{token}`

### Coach Account
The coach account is created automatically with:
- Email: `coach@shapefit.com`
- Password: `coach123`
- Role: `coach`

### QR Code Format
Coach QR codes contain a unique token that validates against the coach account. Format:
```
COACH-{8-char-uuid}-{date}
```

## Building for Production

### Backend
Deploy to any cloud provider that supports Python (Vercel, Railway, AWS, DigitalOcean).

### Mobile
Use Expo EAS Build:
```bash
npm install -g eas-cli
eas build --platform android
# or
eas build --platform ios
```

---

## Docker vs Manual Setup

| Aspect | Docker | Manual |
|---------|---------|--------|
| **PostgreSQL** | Not needed | Required installation |
| **Python** | Not needed | Required installation |
| **Virtual Environment** | Not needed | Required |
| **Setup Time** | 2-3 minutes | 10-15 minutes |
| **Windows Compatibility** | Excellent | Variable |
| **Consistency** | Same everywhere | Variable |
| **Python 3.13 Issues** | None (uses 3.12) | Possible |
| **Start Command** | `docker-compose up` | Multiple steps |
| **Stop Command** | `docker-compose down` | Manual processes |
| **Database Persistence** | Automatic | Manual |
| **Cleanup** | `docker-compose down -v` | Manual |

**Recommendation:** Use Docker for Windows - it's faster, more reliable, and avoids all installation issues.

**Docker Benefits:**
- ✅ Single command to start everything
- ✅ No PostgreSQL or Python installation
- ✅ Consistent environment across all OS
- ✅ Easy to stop and restart
- ✅ Built-in database persistence
- ✅ Production-ready setup
- ✅ Easy scaling and deployment

**Manual Setup Benefits:**
- ✅ Faster initial start (if tools already installed)
- ✅ More control over versions
- ✅ Better for development debugging
- ✅ No Docker overhead

---

## Troubleshooting

### Docker Issues

#### Docker Not Running
**Error:** Cannot connect to Docker daemon
**Solution:** Start Docker Desktop and wait for it to be ready (green dot in system tray)

#### Port Already in Use
**Error:** Ports 8000 or 5432 already in use
**Solution:**
```bash
# Windows - find process
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# Or change ports in docker-compose.yml
```

#### Container Won't Start
**Solution:**
```bash
# Check logs
docker-compose logs backend

# Rebuild
docker-compose up --build
```

#### QR Code Not Found
**Error:** 404 when accessing /api/coach-qr
**Solution:**
1. Check backend logs: `docker-compose logs backend`
2. Ensure QR was generated successfully
3. Manually regenerate: `docker exec shapefit_backend python generate_qr.py`

#### Database Connection Failed
**Solution:**
1. Check PostgreSQL health: `docker-compose ps` (should show "healthy")
2. Wait longer for database to initialize
3. Check logs: `docker-compose logs postgres`

### Python 3.13 Compatibility Issues (Manual Setup Only)

If you're using Python 3.13 and encounter Pillow installation errors:

**Error:** `KeyError: '__version__'` when installing Pillow

**Solution:**
```bash
cd backend

# Update requirements.txt to use compatible Pillow version
sed -i 's/pillow==10.1.0/pillow>=10.4.0/g' requirements.txt

# Reinstall dependencies
pip install -r requirements.txt
```

**Alternative:** Use Python 3.12 which has full compatibility:
```bash
# Install Python 3.12 from python.org
# Then recreate virtual environment
python3.12 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### Backend Issues
- **Database connection error**: Check DATABASE_URL in `.env`
- **Permission denied**: Ensure PostgreSQL user has correct permissions
- **Import errors**: Activate virtual environment before running
- **Missing .env file**: Run `cp .env.example .env` and configure it

### Mobile Issues
- **Network error**: Check API_URL matches backend address
- **Camera permission denied**: Grant camera permission in settings
- **QR scan not working**: Ensure QR code is well-lit and in focus

### Common Issues
- **CORS errors**: Backend CORS is configured for all origins (change for production)
- **Session timeout**: Token expires after 7 days, user needs to re-login
- **No active session**: Scan QR code to start a session before adding exercises

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
