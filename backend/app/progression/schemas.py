from datetime import date, datetime
from typing import Literal, Optional
from pydantic import BaseModel


GoalType = Literal["weight_loss", "fat_loss", "muscle_gain", "recomposition"]


class GoalProfileUpdate(BaseModel):
    goal_type: GoalType


class GoalProfileState(BaseModel):
    has_profile: bool
    goal_type: Optional[GoalType] = None
    updated_at: Optional[datetime] = None


class WeeklyMissionItem(BaseModel):
    item_key: str
    title: str
    target: int
    progress: int
    completed: bool


class WeeklyMissionSummary(BaseModel):
    week_start: date
    week_end: date
    goal_type: GoalType
    checklist: list[WeeklyMissionItem]
    completed_items: int
    total_items: int
    checklist_bonus_exp: int
    all_completed_bonus_exp: int
    total_bonus_exp: int
