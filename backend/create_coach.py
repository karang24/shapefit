import sys
from pathlib import Path
import bcrypt

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

from sqlalchemy import text
from app.config import get_settings
from app.database import engine
from app.auth.models import User

settings = get_settings()

def create_coach_account():
    with engine.connect() as conn:
        result = conn.execute(text("SELECT COUNT(*) FROM users WHERE role = 'coach'"))
        coach_count = result.scalar()

        if coach_count > 0:
            print("Coach account already exists!")
            existing = conn.execute(text("SELECT name, email FROM users WHERE role = 'coach'")).fetchone()
            print(f"Existing coach: {existing[0]} ({existing[1]})")
            return

        password = "coach123"
        password_bytes = password.encode('utf-8')
        salt = bcrypt.gensalt()
        password_hash = bcrypt.hashpw(password_bytes, salt)

        conn.execute(
            text("INSERT INTO users (name, email, password_hash, role) VALUES (:name, :email, :password_hash, :role)"),
            {"name": "Coach", "email": "coach@shapefit.com", "password_hash": password_hash.decode('utf-8'), "role": "coach"}
        )
        conn.commit()

        print("Coach account created successfully!")
        print("Email: coach@shapefit.com")
        print("Password: coach123")

if __name__ == "__main__":
    create_coach_account()
