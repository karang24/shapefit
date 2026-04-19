from __future__ import annotations

from datetime import datetime, timedelta
from typing import Dict, Tuple

from sqlalchemy import func
from sqlalchemy.orm import Session

from ..sessions.models import Session as SessionModel
from ..workouts.models import WorkoutLog as WorkoutLogModel
from .models import WeeklyMissionReward, UserGoalProfile
from .schemas import WeeklyMissionItem, WeeklyMissionSummary

CHECKLIST_EXP_PER_ITEM = 5
CHECKLIST_ALL_DONE_EXP = 10
LIGHT_WEIGHT_THRESHOLD_KG = 25.0
RECOVERY_KEYWORDS = ("recovery", "active recovery", "pemulihan")

GOAL_MISSIONS: Dict[str, tuple[dict, ...]] = {
    "weight_loss": (
        {"item_key": "total_sessions", "title": "Selesaikan 4 sesi latihan minggu ini", "target": 4},
        {"item_key": "coach_sessions", "title": "Ikut minimal 2 sesi bersama coach", "target": 2},
        {"item_key": "mandiri_light_sessions", "title": "2 sesi mandiri beban ringan/active recovery", "target": 2},
        {"item_key": "total_workout_logs", "title": "Log minimal 10 set latihan", "target": 10},
    ),
    "fat_loss": (
        {"item_key": "total_sessions", "title": "Selesaikan 4 sesi latihan minggu ini", "target": 4},
        {"item_key": "coach_sessions", "title": "Ikut minimal 2 sesi bersama coach", "target": 2},
        {"item_key": "mandiri_light_sessions", "title": "2 sesi mandiri beban ringan/active recovery", "target": 2},
        {"item_key": "total_volume", "title": "Kumpulkan volume 3000 minggu ini", "target": 3000},
    ),
    "muscle_gain": (
        {"item_key": "total_sessions", "title": "Selesaikan 5 sesi latihan minggu ini", "target": 5},
        {"item_key": "coach_sessions", "title": "Ikut minimal 2 sesi bersama coach", "target": 2},
        {"item_key": "mandiri_sessions", "title": "Selesaikan minimal 2 sesi mandiri", "target": 2},
        {"item_key": "total_volume", "title": "Kumpulkan volume 5000 minggu ini", "target": 5000},
    ),
    "recomposition": (
        {"item_key": "total_sessions", "title": "Selesaikan 4 sesi latihan minggu ini", "target": 4},
        {"item_key": "coach_sessions", "title": "Ikut minimal 2 sesi bersama coach", "target": 2},
        {"item_key": "mandiri_sessions", "title": "Selesaikan minimal 2 sesi mandiri", "target": 2},
        {"item_key": "mandiri_light_sessions", "title": "1 sesi mandiri beban ringan/active recovery", "target": 1},
    ),
}


def get_week_window(reference: datetime | None = None) -> Tuple[datetime, datetime]:
    now = reference or datetime.utcnow()
    week_start = (now - timedelta(days=now.weekday())).replace(hour=0, minute=0, second=0, microsecond=0)
    week_end = week_start + timedelta(days=7)
    return week_start, week_end


def _build_metrics(db: Session, user_id: int, week_start: datetime, week_end: datetime) -> dict:
    sessions = db.query(SessionModel).filter(
        SessionModel.user_id == user_id,
        SessionModel.start_time >= week_start,
        SessionModel.start_time < week_end
    ).all()

    session_ids = [session.id for session in sessions]
    workouts = []
    if session_ids:
        workouts = db.query(WorkoutLogModel).filter(WorkoutLogModel.session_id.in_(session_ids)).all()

    session_max_weight = {session_id: 0.0 for session_id in session_ids}
    for workout in workouts:
        current_max = session_max_weight.get(workout.session_id, 0.0)
        session_max_weight[workout.session_id] = max(current_max, float(workout.weight_kg))

    coach_sessions = [session for session in sessions if session.coach_id is not None]
    mandiri_sessions = [session for session in sessions if session.coach_id is None]

    mandiri_light_sessions = 0
    for session in mandiri_sessions:
        notes = (session.notes or "").lower()
        has_recovery_note = any(keyword in notes for keyword in RECOVERY_KEYWORDS)
        max_weight = session_max_weight.get(session.id, 0.0)
        if has_recovery_note or max_weight <= LIGHT_WEIGHT_THRESHOLD_KG:
            mandiri_light_sessions += 1

    total_volume = 0
    for workout in workouts:
        total_volume += int(round(float(workout.weight_kg) * workout.reps * workout.sets))

    return {
        "total_sessions": len(sessions),
        "coach_sessions": len(coach_sessions),
        "mandiri_sessions": len(mandiri_sessions),
        "mandiri_light_sessions": mandiri_light_sessions,
        "total_workout_logs": len(workouts),
        "total_volume": total_volume,
    }


def generate_weekly_mission_summary(db: Session, user_id: int, goal_type: str) -> WeeklyMissionSummary:
    week_start, week_end = get_week_window()
    metrics = _build_metrics(db, user_id, week_start, week_end)
    mission_config = GOAL_MISSIONS.get(goal_type, GOAL_MISSIONS["recomposition"])

    checklist: list[WeeklyMissionItem] = []
    completed_items = 0
    for item in mission_config:
        progress = int(metrics.get(item["item_key"], 0))
        completed = progress >= item["target"]
        if completed:
            completed_items += 1
        checklist.append(
            WeeklyMissionItem(
                item_key=item["item_key"],
                title=item["title"],
                target=item["target"],
                progress=progress,
                completed=completed,
            )
        )

    total_items = len(checklist)
    checklist_bonus_exp = completed_items * CHECKLIST_EXP_PER_ITEM
    all_completed_bonus_exp = CHECKLIST_ALL_DONE_EXP if total_items > 0 and completed_items == total_items else 0
    total_bonus_exp = checklist_bonus_exp + all_completed_bonus_exp

    return WeeklyMissionSummary(
        week_start=week_start.date(),
        week_end=(week_end - timedelta(days=1)).date(),
        goal_type=goal_type,
        checklist=checklist,
        completed_items=completed_items,
        total_items=total_items,
        checklist_bonus_exp=checklist_bonus_exp,
        all_completed_bonus_exp=all_completed_bonus_exp,
        total_bonus_exp=total_bonus_exp,
    )


def upsert_weekly_reward(db: Session, user_id: int, mission: WeeklyMissionSummary) -> WeeklyMissionReward:
    reward = db.query(WeeklyMissionReward).filter(
        WeeklyMissionReward.user_id == user_id,
        WeeklyMissionReward.week_start == mission.week_start,
    ).first()

    if not reward:
        reward = WeeklyMissionReward(
            user_id=user_id,
            week_start=mission.week_start,
            week_end=mission.week_end,
            goal_type=mission.goal_type,
            completed_items=mission.completed_items,
            total_items=mission.total_items,
            bonus_exp=mission.total_bonus_exp,
        )
        db.add(reward)
    else:
        reward.week_end = mission.week_end
        reward.goal_type = mission.goal_type
        reward.completed_items = mission.completed_items
        reward.total_items = mission.total_items
        reward.bonus_exp = mission.total_bonus_exp

    db.commit()
    db.refresh(reward)
    return reward


def get_total_mission_bonus_exp(db: Session, user_id: int) -> int:
    total = db.query(func.coalesce(func.sum(WeeklyMissionReward.bonus_exp), 0)).filter(
        WeeklyMissionReward.user_id == user_id
    ).scalar()
    return int(total or 0)


def get_goal_profile(db: Session, user_id: int) -> UserGoalProfile | None:
    return db.query(UserGoalProfile).filter(UserGoalProfile.user_id == user_id).first()
