from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from collections import defaultdict
from ..database import get_db
from ..auth.models import User
from ..auth.dependencies import get_current_user
from ..sessions.models import Session as SessionModel
from .models import WorkoutLog as WorkoutLogModel
from .schemas import (
    WorkoutLogCreate,
    WorkoutLog as WorkoutLogResponse,
    WorkoutHistoryItem,
    ExerciseProgress,
    WorkoutHistory,
)

router = APIRouter(prefix="/api/workouts", tags=["workouts"])


@router.post("/", response_model=WorkoutLogResponse, status_code=status.HTTP_201_CREATED)
def add_workout_log(workout: WorkoutLogCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    session = db.query(SessionModel).filter(
        SessionModel.id == workout.session_id,
        SessionModel.user_id == current_user.id
    ).first()
    
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )
    
    db_workout = WorkoutLogModel(**workout.model_dump())
    db.add(db_workout)
    db.commit()
    db.refresh(db_workout)
    return db_workout


@router.get("/history", response_model=WorkoutHistory)
def get_workout_history(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    from sqlalchemy.sql import select
    
    stmt = (
        select(WorkoutLogModel, SessionModel)
        .join(SessionModel, WorkoutLogModel.session_id == SessionModel.id)
        .filter(SessionModel.user_id == current_user.id)
        .order_by(SessionModel.start_time.desc())
    )
    
    result = db.execute(stmt).all()
    
    workouts = []
    exercise_weights = defaultdict(list)
    
    for workout_log, session in result:
        item = WorkoutHistoryItem(
            date=session.start_time.strftime("%Y-%m-%d"),
            exercise=workout_log.exercise,
            weight_kg=float(workout_log.weight_kg),
            reps=workout_log.reps,
            sets=workout_log.sets
        )
        workouts.append(item)
        
        exercise_weights[workout_log.exercise].append({
            "date": session.start_time.strftime("%Y-%m-%d"),
            "weight": float(workout_log.weight_kg)
        })
    
    exercise_progress = [
        ExerciseProgress(exercise=exercise, weights=sorted(weights, key=lambda x: x["date"]))
        for exercise, weights in exercise_weights.items()
    ]
    
    return WorkoutHistory(workouts=workouts, exercise_progress=exercise_progress)


@router.get("/progress/{exercise}", response_model=ExerciseProgress)
def get_exercise_progress(exercise: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    from sqlalchemy.sql import select
    
    stmt = (
        select(WorkoutLogModel, SessionModel)
        .join(SessionModel, WorkoutLogModel.session_id == SessionModel.id)
        .filter(
            SessionModel.user_id == current_user.id,
            WorkoutLogModel.exercise == exercise
        )
        .order_by(SessionModel.start_time.asc())
    )
    
    result = db.execute(stmt).all()
    
    weights = [
        {
            "date": session.start_time.strftime("%Y-%m-%d"),
            "weight": float(workout_log.weight_kg)
        }
        for workout_log, session in result
    ]
    
    return ExerciseProgress(exercise=exercise, weights=weights)
