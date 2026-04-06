from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List


class WorkoutLogBase(BaseModel):
    exercise: str
    weight_kg: float
    reps: int
    sets: int


class WorkoutLogCreate(WorkoutLogBase):
    session_id: int


class WorkoutLog(WorkoutLogBase):
    id: int
    session_id: int
    created_at: datetime

    class Config:
        from_attributes = True


class WorkoutHistoryItem(BaseModel):
    date: str
    exercise: str
    weight_kg: float
    reps: int
    sets: int


class ExerciseProgress(BaseModel):
    exercise: str
    weights: List[dict]


class WorkoutHistory(BaseModel):
    workouts: List[WorkoutHistoryItem]
    exercise_progress: List[ExerciseProgress]
