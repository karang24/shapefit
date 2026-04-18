from pydantic import BaseModel, Field
from datetime import date, datetime
from typing import Optional


class BodyMetricBase(BaseModel):
    weight_kg: float = Field(..., gt=0, description="Weight in kg")
    waist_cm: Optional[float] = Field(None, gt=0, description="Waist circumference in cm")
    date: date


class BodyMetricCreate(BodyMetricBase):
    pass


class BodyMetric(BodyMetricBase):
    id: int
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True


class BodyMetricLatest(BodyMetric):
    pass


class DashboardSummary(BaseModel):
    sessions_this_week: int
    latest_weight: Optional[float]
    latest_waist: Optional[float]
    rank: str
    next_rank: Optional[str]
    total_exp: int
    exp_to_next_rank: int
    rank_progress_percent: float
