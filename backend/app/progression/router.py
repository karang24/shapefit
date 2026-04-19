from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..auth.dependencies import get_current_user
from ..auth.models import User
from ..database import get_db
from .models import UserGoalProfile
from .schemas import GoalProfileState, GoalProfileUpdate, WeeklyMissionSummary
from .service import generate_weekly_mission_summary, get_goal_profile, upsert_weekly_reward

router = APIRouter(prefix="/api/progression", tags=["progression"])


@router.get("/goal", response_model=GoalProfileState)
def get_goal(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    profile = get_goal_profile(db, current_user.id)
    if not profile:
        return GoalProfileState(has_profile=False)

    return GoalProfileState(
        has_profile=True,
        goal_type=profile.goal_type,
        updated_at=profile.updated_at,
    )


@router.put("/goal", response_model=GoalProfileState)
def upsert_goal(payload: GoalProfileUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    profile = get_goal_profile(db, current_user.id)
    if not profile:
        profile = UserGoalProfile(user_id=current_user.id, goal_type=payload.goal_type)
        db.add(profile)
    else:
        profile.goal_type = payload.goal_type

    db.commit()
    db.refresh(profile)
    return GoalProfileState(
        has_profile=True,
        goal_type=profile.goal_type,
        updated_at=profile.updated_at,
    )


@router.get("/missions/current", response_model=WeeklyMissionSummary)
def get_current_week_mission(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    profile = get_goal_profile(db, current_user.id)
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Goal profile belum diatur. Set goal dulu di /api/progression/goal."
        )

    mission = generate_weekly_mission_summary(db, current_user.id, profile.goal_type)
    upsert_weekly_reward(db, current_user.id, mission)
    return mission
