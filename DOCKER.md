# ShapeFit - Docker Setup Guide

Complete Docker setup for the ShapeFit Fitness Tracker backend. Perfect for Windows users!

## Prerequisites

- **Docker Desktop** installed and running
- Download from: https://www.docker.com/products/docker-desktop

## Quick Start

### Option 1: Automated Setup (Recommended)

**Windows:**
```bash
docker-start.bat
```

**Linux/Mac:**
```bash
./docker-start.sh
```

**Manual:**
```bash
docker-compose up --build
```

That's it! Docker will:
- ✅ Install and configure PostgreSQL
- ✅ Install Python dependencies
- ✅ Initialize database
- ✅ Create coach account (email: coach@shapefit.com, password: coach123)
- ✅ Generate QR code
- ✅ Start FastAPI backend server

## Access Services

Once Docker is running, you can access:

- **Backend API:** http://localhost:8000
- **API Documentation:** http://localhost:8000/docs
- **Database UI:** http://localhost:8080 (Adminer)
  - Server: postgres
  - Username: postgres
  - Password: postgres
  - Database: shapefit
- **Coach QR Code:** http://localhost:8000/api/coach-qr

## Accessing QR Code

### Option 1: Download from Browser
Navigate to: http://localhost:8000/api/coach-qr
The QR code image will download directly.

### Option 2: Copy from Container
```bash
docker cp shapefit_backend:/app/coach_qr/coach_qr.png ./coach_qr.png
```

### Option 3: View in Volume
The QR code is automatically saved in the Docker volume. Access it via:
```bash
docker run --rm -v coach_qr:/data -v $(pwd):/out alpine ls -la /data
docker run --rm -v coach_qr:/data -v $(pwd):/out alpine cp /data/coach_qr.png /out/
```

## Docker Commands Reference

### Start Services
```bash
# Build and start (first time)
docker-compose up --build

# Start (already built)
docker-compose up

# Start in background
docker-compose up -d

# Start specific service
docker-compose up backend
```

### Stop Services
```bash
# Stop all services
docker-compose down

# Stop and remove volumes (fresh start)
docker-compose down -v

# Stop specific service
docker-compose stop backend
```

### View Logs
```bash
# View all logs
docker-compose logs

# View specific service logs
docker-compose logs backend
docker-compose logs postgres

# Follow logs in real-time
docker-compose logs -f
docker-compose logs -f backend

# View last 100 lines
docker-compose logs --tail=100
```

### Container Management
```bash
# View running containers
docker-compose ps

# View all containers
docker ps -a

# Enter backend container
docker exec -it shapefit_backend bash

# Enter postgres container
docker exec -it shapefit_db psql -U postgres -d shapefit

# Run command in container
docker exec shapefit_backend python test_api.py

# Restart specific service
docker-compose restart backend
```

### Rebuilding
```bash
# Rebuild backend only
docker-compose up --build backend

# Rebuild everything
docker-compose up --build

# Force rebuild without cache
docker-compose build --no-cache
docker-compose up
```

### Database Management
```bash
# Access PostgreSQL directly
docker exec -it shapefit_db psql -U postgres -d shapefit

# View tables
\dt

# View users
SELECT * FROM users;

# Exit PostgreSQL
\q

# Backup database
docker exec shapefit_db pg_dump -U postgres shapefit > backup.sql

# Restore database
cat backup.sql | docker exec -i shapefit_db psql -U postgres -d shapefit
```

## Troubleshooting

### Docker Not Running
**Error:** Cannot connect to Docker daemon
**Solution:**
1. Open Docker Desktop
2. Wait for it to start (green dot in system tray)
3. Try again

### Port Already in Use
**Error:** Port 8000 or 5432 already in use
**Solution:**
```bash
# Find process using port
netstat -ano | findstr :8000
# Windows
taskkill /PID <PID> /F
# Linux/Mac
kill -9 <PID>
```

Or change ports in `docker-compose.yml`:
```yaml
ports:
  - "8001:8000"  # Use 8001 instead
```

### Container Won't Start
**Check logs:**
```bash
docker-compose logs backend
docker-compose logs postgres
```

**Common issues:**
- Database not ready → Wait longer, check healthcheck
- Import error → Check requirements.txt
- Permission error → Check volume permissions

### Can't Access Backend
**Check:**
1. Backend container is running: `docker-compose ps`
2. Port is accessible: `curl http://localhost:8000`
3. Firewall isn't blocking: Check Windows Firewall

### QR Code Not Found
**Check:**
1. Container initialized successfully: `docker-compose logs backend`
2. QR code was generated: Look for "Generating QR code..." in logs
3. Manual generation:
```bash
docker exec shapefit_backend python generate_qr.py
```

### Database Connection Failed
**Check:**
1. PostgreSQL is healthy: `docker-compose ps` (should show "healthy")
2. Backend can connect: Check logs for connection errors
3. Volume permissions: Check `postgres_data` volume

### Out of Space
**Clean up:**
```bash
# Remove stopped containers
docker container prune

# Remove unused images
docker image prune

# Remove unused volumes
docker volume prune

# Remove everything (careful!)
docker system prune -a --volumes
```

## Production Deployment

### Using Production Compose

Create `.env.prod`:
```
POSTGRES_USER=your_prod_user
POSTGRES_PASSWORD=your_secure_password_here
POSTGRES_DB=shapefit
SECRET_KEY=your_very_secure_random_secret_key_here_change_this
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080
```

Run production:
```bash
docker-compose -f docker-compose.prod.yml --env-file .env.prod up -d
```

### Security Best Practices

1. **Change Default Passwords**
   - PostgreSQL: Use strong password in .env
   - SECRET_KEY: Use random string

2. **Remove Adminer**
   - Comment out adminer service in docker-compose.yml
   - Or don't expose port 8080

3. **Use HTTPS**
   - Add reverse proxy (nginx/traefik)
   - Use SSL certificates

4. **Limit Resources**
   ```yaml
   services:
     backend:
       deploy:
         resources:
           limits:
             cpus: '1'
             memory: 512M
   ```

5. **Backup Database**
   ```bash
   # Automated backup
   docker exec shapefit_db pg_dump -U postgres shapefit | gzip > backup_$(date +%Y%m%d).sql.gz
   ```

## Advanced Usage

### Custom Dockerfile
Modify `backend/Dockerfile` for:
- Different Python version
- Additional system packages
- Production optimizations

### Multiple Environments
```bash
# Development
docker-compose up

# Staging
docker-compose -f docker-compose.staging.yml up

# Production
docker-compose -f docker-compose.prod.yml up
```

### Hot Reload
Already enabled! Backend code is mounted as volume in `docker-compose.yml`.

### Debugging in Container
```bash
# Install debug tools
docker exec shapefit_backend apt-get update
docker exec shapefit_backend apt-get install -y vim curl

# Edit files
docker exec -it shapefit_backend vim app/main.py

# Test endpoints
docker exec shapefit_backend curl http://localhost:8000/
```

## Performance Optimization

### Build Optimization
```yaml
# Use build cache
backend:
  build:
    context: ./backend
    cache_from:
      - shapefit_backend:latest
```

### Run Optimization
```yaml
# Use production config
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
```

## Monitoring

### Health Checks
```yaml
# Already included in docker-compose.yml
healthcheck:
  test: ["CMD-SHELL", "pg_isready -U postgres"]
  interval: 10s
  timeout: 5s
  retries: 5
```

### View Container Stats
```bash
docker stats
```

### Monitor Logs
```bash
# Real-time log monitoring
docker-compose logs -f
```

## Troubleshooting Guide Summary

| Issue | Solution |
|-------|----------|
| Docker not running | Start Docker Desktop |
| Port already in use | Change ports or kill process |
| Container won't start | Check logs: `docker-compose logs` |
| Can't access backend | Check container status and ports |
| QR not found | Check logs, regenerate manually |
| Database connection | Check health status, wait longer |
| Out of space | Run `docker system prune` |

## Getting Help

- Docker docs: https://docs.docker.com/
- Docker Compose docs: https://docs.docker.com/compose/
- PostgreSQL docs: https://www.postgresql.org/docs/
- FastAPI docs: https://fastapi.tiangolo.com/

## Success Checklist

- [ ] Docker Desktop installed and running
- [ ] Services start successfully
- [ ] Backend API accessible at http://localhost:8000
- [ ] API docs accessible at http://localhost:8000/docs
- [ ] Database UI accessible at http://localhost:8080
- [ ] Coach QR code generated and accessible
- [ ] Can register and login via API
- [ ] Can scan QR and start session
- [ ] Mobile app can connect to backend

## Next Steps

1. **Test Backend**
   ```bash
   docker exec shapefit_backend python test_api.py
   ```

2. **Setup Mobile App**
   ```bash
   cd mobile
   npm install
   npx expo start
   ```

3. **Test Complete Flow**
   - Register athlete account
   - Scan coach QR code
   - Log workout
   - Track progress

**You're all set!** 🚀
