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
    exercise_type: str
    exp_earned: int

    class Config:
        from_attributes = True


class WorkoutHistoryItem(BaseModel):
    date: str
    exercise: str
    weight_kg: float
    reps: int
    sets: int
    exercise_type: str
    exp_earned: int


class ExerciseProgress(BaseModel):
    exercise: str
    weights: List[dict]


class WorkoutHistory(BaseModel):
    workouts: List[WorkoutHistoryItem]
    exercise_progress: List[ExerciseProgress]


class ExerciseTypeDefinition(BaseModel):
    type_key: str
    label: str
    base_exp_per_rep: float
    description: str


class ExerciseCatalogItem(BaseModel):
    id: int
    name: str
    category: str
    base_exp_per_rep: float


class ExerciseTypeExp(BaseModel):
    type_key: str
    total_exp: int


class WorkoutGamificationSummary(BaseModel):
    rank: str
    next_rank: Optional[str]
    total_exp: int
    exp_to_next_rank: int
    progress_percent: float
    exercise_type_exp: List[ExerciseTypeExp]
