from datetime import datetime, timedelta
import json
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..auth.models import User
from ..auth.dependencies import get_current_user
from ..config import get_settings
from .models import MealAnalysis
from .schemas import (
    AnalyzeMealImageRequest,
    AnalyzeMealImageResponse,
    CalorieTargetRequest,
    CalorieTargetResponse,
    DailyUsage,
    FoodItemEstimate,
)
from .service import analyze_meal_image_openai

router = APIRouter(prefix="/api/nutrition", tags=["nutrition"])
settings = get_settings()

ACTIVITY_MULTIPLIERS = {
    "sedentary": 1.2,
    "light": 1.375,
    "moderate": 1.55,
    "active": 1.725,
    "very_active": 1.9,
}


def _get_today_window() -> tuple[datetime, datetime]:
    now = datetime.utcnow()
    start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    end = start + timedelta(days=1)
    return start, end


def _get_today_usage_count(db: Session, user_id: int) -> int:
    start, end = _get_today_window()
    return (
        db.query(MealAnalysis)
        .filter(
            MealAnalysis.user_id == user_id,
            MealAnalysis.created_at >= start,
            MealAnalysis.created_at < end,
        )
        .count()
    )


@router.get("/usage-today", response_model=DailyUsage)
def get_usage_today(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    used = _get_today_usage_count(db, current_user.id)
    daily_limit = max(1, settings.DAILY_IMAGE_ANALYSIS_LIMIT)
    return DailyUsage(used=used, limit=daily_limit, remaining=max(0, daily_limit - used))


@router.post("/calorie-target", response_model=CalorieTargetResponse)
def calculate_calorie_target(payload: CalorieTargetRequest, current_user: User = Depends(get_current_user)):
    # Mifflin-St Jeor BMR formula
    if payload.sex == "male":
        bmr_raw = (10 * payload.weight_kg) + (6.25 * payload.height_cm) - (5 * payload.age) + 5
    else:
        bmr_raw = (10 * payload.weight_kg) + (6.25 * payload.height_cm) - (5 * payload.age) - 161

    multiplier = ACTIVITY_MULTIPLIERS[payload.activity_level]
    maintenance_raw = bmr_raw * multiplier

    if payload.goal == "maintenance":
        target_raw = maintenance_raw
    elif payload.goal == "deficit":
        target_raw = maintenance_raw * (1 - (payload.deficit_percent / 100))
    else:
        target_raw = maintenance_raw * (1 + (payload.surplus_percent / 100))

    bmr = int(round(bmr_raw))
    maintenance_calories = int(round(maintenance_raw))
    target_calories = int(round(target_raw))
    adjustment_kcal = target_calories - maintenance_calories

    return CalorieTargetResponse(
        formula="Mifflin-St Jeor",
        bmr=bmr,
        activity_multiplier=multiplier,
        maintenance_calories=maintenance_calories,
        goal=payload.goal,
        target_calories=target_calories,
        adjustment_kcal=adjustment_kcal,
    )


@router.post("/analyze-image", response_model=AnalyzeMealImageResponse, status_code=status.HTTP_201_CREATED)
def analyze_meal_image(
    payload: AnalyzeMealImageRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    daily_limit = max(1, settings.DAILY_IMAGE_ANALYSIS_LIMIT)
    used_today = _get_today_usage_count(db, current_user.id)
    if used_today >= daily_limit:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Daily image analysis limit reached ({daily_limit}/day)",
        )

    try:
        analysis = analyze_meal_image_openai(
            api_key=settings.OPENAI_API_KEY,
            model=settings.OPENAI_VISION_MODEL,
            image_base64=payload.image_base64,
            mime_type=payload.mime_type,
            meal_type=payload.meal_type,
        )
    except RuntimeError as exc:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(exc)) from exc
    except Exception as exc:
        provider_message = str(exc).strip()
        if not provider_message:
            provider_message = exc.__class__.__name__
        if len(provider_message) > 300:
            provider_message = provider_message[:300] + "..."
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"AI provider error: {provider_message}",
        ) from exc

    db_row = MealAnalysis(
        user_id=current_user.id,
        meal_type=payload.meal_type,
        model=settings.OPENAI_VISION_MODEL,
        estimated_calories=int(analysis["estimated_calories"]),
        protein_g=float(analysis["protein_g"]),
        carbs_g=float(analysis["carbs_g"]),
        fat_g=float(analysis["fat_g"]),
        confidence=float(analysis["confidence"]),
        raw_json=json.dumps(analysis),
    )
    db.add(db_row)
    db.commit()
    db.refresh(db_row)

    used_after = used_today + 1
    return AnalyzeMealImageResponse(
        meal_type=payload.meal_type,
        estimated_calories=db_row.estimated_calories,
        protein_g=float(db_row.protein_g),
        carbs_g=float(db_row.carbs_g),
        fat_g=float(db_row.fat_g),
        confidence=float(db_row.confidence),
        food_items=[
            FoodItemEstimate(
                name=item.get("name", "Unknown"),
                estimated_portion=item.get("estimated_portion", "-"),
                estimated_calories=int(item.get("estimated_calories", 0)),
            )
            for item in analysis.get("food_items", [])
        ],
        notes=str(analysis.get("notes", "")),
        model=db_row.model,
        daily_usage=DailyUsage(used=used_after, limit=daily_limit, remaining=max(0, daily_limit - used_after)),
        created_at=db_row.created_at,
    )
