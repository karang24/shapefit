import sys
from pathlib import Path

# Check for .env file BEFORE importing app modules
env_file = Path(__file__).parent / '.env'
if not env_file.exists():
    print("ERROR: .env file not found!")
    print("Please copy .env.example to .env and configure your database:")
    print("  cp .env.example .env")
    print("Then edit .env with your database credentials:")
    print("  DATABASE_URL=postgresql://user:password@localhost:5432/shapefit")
    print("  SECRET_KEY=your-secret-jwt-key")
    sys.exit(1)

from app.config import get_settings
from app.database import Base, engine

# Import all models to register them with Base
from app.auth.models import User
from app.sessions.models import Session as SessionModel
from app.workouts.models import WorkoutLog
from app.body_metrics.models import BodyMetric

settings = get_settings()

def init_database():
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)

    print("Database initialized successfully!")
    print("\nNext steps:")
    print("1. Create coach account: python create_coach.py")
    print("2. Generate coach QR code: python generate_qr.py")
    print("3. Start the server: uvicorn app.main:app --reload")

if __name__ == "__main__":
    init_database()
