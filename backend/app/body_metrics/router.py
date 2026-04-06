from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import date, datetime, timedelta
from ..database import get_db
from ..auth.models import User
from ..auth.dependencies import get_current_user
from ..sessions.models import Session as SessionModel
from .models import BodyMetric as BodyMetricModel
from .schemas import BodyMetricCreate, BodyMetric as BodyMetricResponse, BodyMetricLatest, DashboardSummary

router = APIRouter(prefix="/api/body-metrics", tags=["body-metrics"])


@router.post("/", response_model=BodyMetricResponse, status_code=status.HTTP_201_CREATED)
def log_body_metric(metric: BodyMetricCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    db_metric = BodyMetricModel(user_id=current_user.id, **metric.model_dump())
    db.add(db_metric)
    db.commit()
    db.refresh(db_metric)
    return db_metric


@router.get("/", response_model=list[BodyMetricResponse])
def get_body_metrics(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    metrics = db.query(BodyMetricModel).filter(
        BodyMetricModel.user_id == current_user.id
    ).order_by(
        BodyMetricModel.date.desc(),
        BodyMetricModel.created_at.desc(),
        BodyMetricModel.id.desc()
    ).all()
    return metrics


@router.get("/latest", response_model=BodyMetricLatest)
def get_latest_body_metric(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    metric = db.query(BodyMetricModel).filter(
        BodyMetricModel.user_id == current_user.id
    ).order_by(
        BodyMetricModel.date.desc(),
        BodyMetricModel.created_at.desc(),
        BodyMetricModel.id.desc()
    ).first()
    
    if not metric:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No body metrics found"
        )
    return metric
