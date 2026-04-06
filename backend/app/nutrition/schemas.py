from pydantic import BaseModel, Field, field_validator
from datetime import datetime
from typing import Literal, Optional

MealType = Literal["breakfast", "lunch", "dinner", "snack"]
SexType = Literal["male", "female"]
ActivityLevel = Literal["sedentary", "light", "moderate", "active", "very_active"]
GoalType = Literal["deficit", "maintenance", "surplus"]


class AnalyzeMealImageRequest(BaseModel):
    image_base64: str = Field(min_length=32, description="Raw base64 string or data URL")
    mime_type: Optional[str] = Field(default="image/jpeg", description="image/jpeg or image/png")
    meal_type: MealType = "breakfast"

    @field_validator("mime_type")
    @classmethod
    def validate_mime_type(cls, value: Optional[str]) -> str:
        if not value:
            return "image/jpeg"
        normalized = value.strip().lower()
        if normalized not in {"image/jpeg", "image/png", "image/webp"}:
            raise ValueError("mime_type must be image/jpeg, image/png, or image/webp")
        return normalized


class FoodItemEstimate(BaseModel):
    name: str
    estimated_portion: str
    estimated_calories: int


class DailyUsage(BaseModel):
    used: int
    limit: int
    remaining: int


class AnalyzeMealImageResponse(BaseModel):
    meal_type: MealType
    estimated_calories: int
    protein_g: float
    carbs_g: float
    fat_g: float
    confidence: float
    food_items: list[FoodItemEstimate]
    notes: str
    model: str
    daily_usage: DailyUsage
    created_at: datetime


class CalorieTargetRequest(BaseModel):
    age: int = Field(ge=13, le=100)
    sex: SexType
    weight_kg: float = Field(gt=20, le=400)
    height_cm: float = Field(gt=120, le=250)
    activity_level: ActivityLevel
    goal: GoalType = "maintenance"
    deficit_percent: float = Field(default=15, ge=5, le=40)
    surplus_percent: float = Field(default=10, ge=5, le=30)


class CalorieTargetResponse(BaseModel):
    formula: str
    bmr: int
    activity_multiplier: float
    maintenance_calories: int
    goal: GoalType
    target_calories: int
    adjustment_kcal: int
