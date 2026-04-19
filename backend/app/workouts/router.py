from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from collections import defaultdict
from ..database import get_db
from ..auth.models import User
from ..auth.dependencies import get_current_user
from ..sessions.models import Session as SessionModel
from .models import WorkoutLog as WorkoutLogModel
from .schemas import (
    ExerciseCatalogItem,
    ExerciseTypeDefinition,
    WorkoutGamificationSummary,
    WorkoutLogCreate,
    WorkoutLog as WorkoutLogResponse,
    WorkoutHistoryItem,
    ExerciseProgress,
    WorkoutHistory,
)
from .gamification import (
    calculate_workout_exp,
    summarize_gamification,
)
from .catalog import get_exercise_lookup, list_categories, list_exercises
from ..progression.service import (
    generate_weekly_mission_summary,
    get_goal_profile,
    get_total_mission_bonus_exp,
    upsert_weekly_reward,
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

    exercise_lookup = get_exercise_lookup(db)
    selected_exercise = exercise_lookup.get(workout.exercise.strip().lower())
    if not selected_exercise:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Exercise harus dipilih dari daftar dropdown."
        )
    
    db_workout = WorkoutLogModel(**workout.model_dump())
    db.add(db_workout)
    db.commit()
    db.refresh(db_workout)
    exp_earned = calculate_workout_exp(
        base_exp_per_rep=float(selected_exercise.base_exp_per_rep),
        weight_kg=float(db_workout.weight_kg),
        reps=db_workout.reps,
        sets=db_workout.sets,
    )
    return WorkoutLogResponse(
        id=db_workout.id,
        session_id=db_workout.session_id,
        exercise=db_workout.exercise,
        weight_kg=float(db_workout.weight_kg),
        reps=db_workout.reps,
        sets=db_workout.sets,
        created_at=db_workout.created_at,
        exercise_type=selected_exercise.category,
        exp_earned=exp_earned,
    )


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
    exercise_lookup = get_exercise_lookup(db)
    
    workouts = []
    exercise_weights = defaultdict(list)
    
    for workout_log, session in result:
        selected_exercise = exercise_lookup.get(workout_log.exercise.strip().lower())
        exercise_type = selected_exercise.category if selected_exercise else "bodybuilding"
        base_exp = float(selected_exercise.base_exp_per_rep) if selected_exercise else 1.45
        exp_earned = calculate_workout_exp(
            base_exp_per_rep=base_exp,
            weight_kg=float(workout_log.weight_kg),
            reps=workout_log.reps,
            sets=workout_log.sets,
        )
        item = WorkoutHistoryItem(
            date=session.start_time.strftime("%Y-%m-%d"),
            exercise=workout_log.exercise,
            weight_kg=float(workout_log.weight_kg),
            reps=workout_log.reps,
            sets=workout_log.sets,
            exercise_type=exercise_type,
            exp_earned=exp_earned,
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


@router.get("/exercise-types", response_model=list[ExerciseTypeDefinition])
def get_exercise_types(db: Session = Depends(get_db)):
    return list_categories(db)


@router.get("/exercises", response_model=list[ExerciseCatalogItem])
def get_exercise_catalog(db: Session = Depends(get_db)):
    return [
        ExerciseCatalogItem(
            id=item.id,
            name=item.name,
            category=item.category,
            base_exp_per_rep=float(item.base_exp_per_rep),
        )
        for item in list_exercises(db)
    ]


@router.get("/gamification", response_model=WorkoutGamificationSummary)
def get_workout_gamification(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    from sqlalchemy.sql import select

    stmt = (
        select(WorkoutLogModel)
        .join(SessionModel, WorkoutLogModel.session_id == SessionModel.id)
        .filter(SessionModel.user_id == current_user.id)
    )
    workout_rows = [row[0] for row in db.execute(stmt).all()]
    mission_bonus_exp = 0
    goal_profile = get_goal_profile(db, current_user.id)
    if goal_profile:
        mission = generate_weekly_mission_summary(db, current_user.id, goal_profile.goal_type)
        upsert_weekly_reward(db, current_user.id, mission)
        mission_bonus_exp = get_total_mission_bonus_exp(db, current_user.id)

    return WorkoutGamificationSummary(
        **summarize_gamification(workout_rows, get_exercise_lookup(db), extra_exp=mission_bonus_exp)
    )


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
