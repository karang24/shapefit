from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from sqlalchemy.sql import func
from sqlalchemy.orm import Session
from pathlib import Path
from datetime import datetime, timedelta
from .database import engine, Base, get_db
from .auth.router import router as auth_router
from .sessions.router import router as sessions_router
from .workouts.router import router as workouts_router
from .body_metrics.router import router as body_metrics_router
from .nutrition.router import router as nutrition_router
from .auth.models import User
from .sessions.models import Session as SessionModel
from .workouts.models import WorkoutLog
from .body_metrics.models import BodyMetric
from .nutrition.models import MealAnalysis
from .auth.dependencies import get_current_user

Base.metadata.create_all(bind=engine)

app = FastAPI(title="ShapeFit API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(sessions_router)
app.include_router(workouts_router)
app.include_router(body_metrics_router)
app.include_router(nutrition_router)


@app.get("/")
def root():
    return {"message": "ShapeFit API"}


@app.get("/api/dashboard")
def get_dashboard(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    from .body_metrics.schemas import DashboardSummary
    
    week_ago = datetime.utcnow() - timedelta(days=7)
    
    sessions_this_week = db.query(SessionModel).filter(
        SessionModel.user_id == current_user.id,
        SessionModel.start_time >= week_ago
    ).count()
    
    latest_metric = db.query(BodyMetric).filter(
        BodyMetric.user_id == current_user.id
    ).order_by(
        BodyMetric.date.desc(),
        BodyMetric.created_at.desc(),
        BodyMetric.id.desc()
    ).first()
    
    latest_weight = float(latest_metric.weight_kg) if latest_metric else None
    latest_waist = float(latest_metric.waist_cm) if latest_metric and latest_metric.waist_cm else None
    
    return DashboardSummary(
        sessions_this_week=sessions_this_week,
        latest_weight=latest_weight,
        latest_waist=latest_waist
    )


@app.get("/api/coach-qr")
def get_coach_qr():
    backend_root = Path(__file__).resolve().parents[1]
    qr_file = backend_root / "coach_qr" / "coach_qr.png"
    if qr_file.exists():
        return FileResponse(str(qr_file), media_type="image/png")
    raise HTTPException(status_code=404, detail="QR code not found. Please generate it first.")
