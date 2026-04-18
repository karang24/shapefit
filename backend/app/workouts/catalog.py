from __future__ import annotations

from typing import Dict

from sqlalchemy.orm import Session

from .models import ExerciseCatalog


DEFAULT_EXERCISES: tuple[dict, ...] = (
    {"name": "Kettlebell Swing", "category": "kettlebell", "base_exp_per_rep": 1.6},
    {"name": "Kettlebell Clean", "category": "kettlebell", "base_exp_per_rep": 1.7},
    {"name": "Kettlebell Snatch", "category": "kettlebell", "base_exp_per_rep": 1.8},
    {"name": "Kettlebell Goblet Squat", "category": "kettlebell", "base_exp_per_rep": 1.5},
    {"name": "Kettlebell Turkish Get-Up", "category": "kettlebell", "base_exp_per_rep": 2.0},
    {"name": "Kettlebell Press", "category": "kettlebell", "base_exp_per_rep": 1.6},
    {"name": "Kettlebell Front Squat", "category": "kettlebell", "base_exp_per_rep": 1.7},
    {"name": "Kettlebell High Pull", "category": "kettlebell", "base_exp_per_rep": 1.6},
    {"name": "Kettlebell Lunge", "category": "kettlebell", "base_exp_per_rep": 1.5},
    {"name": "Kettlebell Deadlift", "category": "kettlebell", "base_exp_per_rep": 1.7},
    {"name": "Kettlebell Windmill", "category": "kettlebell", "base_exp_per_rep": 1.6},
    {"name": "Barbell Overhead Press", "category": "powerlifting", "base_exp_per_rep": 1.9},
    {"name": "Barbell Front Squat", "category": "powerlifting", "base_exp_per_rep": 2.0},
    {"name": "Barbell Pause Squat", "category": "powerlifting", "base_exp_per_rep": 2.1},
    {"name": "Barbell Incline Bench Press", "category": "powerlifting", "base_exp_per_rep": 1.9},
    {"name": "Barbell Romanian Deadlift", "category": "powerlifting", "base_exp_per_rep": 2.0},
    {"name": "Barbell Deficit Deadlift", "category": "powerlifting", "base_exp_per_rep": 2.1},
    {"name": "Barbell Pendlay Row", "category": "powerlifting", "base_exp_per_rep": 1.8},
    {"name": "Barbell Pin Press", "category": "powerlifting", "base_exp_per_rep": 2.0},
    {"name": "Barbell Tempo Squat", "category": "powerlifting", "base_exp_per_rep": 2.1},
    {"name": "Barbell Squat", "category": "powerlifting", "base_exp_per_rep": 2.0},
    {"name": "Barbell Bench Press", "category": "powerlifting", "base_exp_per_rep": 2.0},
    {"name": "Barbell Deadlift", "category": "powerlifting", "base_exp_per_rep": 2.2},
    {"name": "Dumbbell Curl", "category": "bodybuilding", "base_exp_per_rep": 1.4},
    {"name": "Lat Pulldown", "category": "bodybuilding", "base_exp_per_rep": 1.5},
    {"name": "Leg Press", "category": "bodybuilding", "base_exp_per_rep": 1.5},
    {"name": "Cable Fly", "category": "bodybuilding", "base_exp_per_rep": 1.4},
    {"name": "Seated Row", "category": "bodybuilding", "base_exp_per_rep": 1.5},
    {"name": "Leg Extension", "category": "bodybuilding", "base_exp_per_rep": 1.3},
    {"name": "Leg Curl", "category": "bodybuilding", "base_exp_per_rep": 1.3},
    {"name": "Lateral Raise", "category": "bodybuilding", "base_exp_per_rep": 1.2},
    {"name": "Triceps Pushdown", "category": "bodybuilding", "base_exp_per_rep": 1.3},
    {"name": "Hammer Curl", "category": "bodybuilding", "base_exp_per_rep": 1.3},
    {"name": "Machine Chest Press", "category": "bodybuilding", "base_exp_per_rep": 1.5},
    {"name": "Pec Deck", "category": "bodybuilding", "base_exp_per_rep": 1.3},
    {"name": "Hack Squat", "category": "bodybuilding", "base_exp_per_rep": 1.6},
    {"name": "Push Up", "category": "kalistenik", "base_exp_per_rep": 1.1},
    {"name": "Pull Up", "category": "kalistenik", "base_exp_per_rep": 1.4},
    {"name": "Dip", "category": "kalistenik", "base_exp_per_rep": 1.3},
    {"name": "Chin Up", "category": "kalistenik", "base_exp_per_rep": 1.4},
    {"name": "Australian Row", "category": "kalistenik", "base_exp_per_rep": 1.2},
    {"name": "Pike Push Up", "category": "kalistenik", "base_exp_per_rep": 1.2},
    {"name": "Diamond Push Up", "category": "kalistenik", "base_exp_per_rep": 1.2},
    {"name": "Bulgarian Split Squat (BW)", "category": "kalistenik", "base_exp_per_rep": 1.3},
    {"name": "Bodyweight Squat", "category": "kalistenik", "base_exp_per_rep": 1.0},
    {"name": "L-Sit Hold (Sec)", "category": "kalistenik", "base_exp_per_rep": 1.3},
    {"name": "Hanging Knee Raise", "category": "kalistenik", "base_exp_per_rep": 1.2},
    {"name": "Burpee", "category": "kalistenik", "base_exp_per_rep": 1.4},
    {"name": "Farmer Carry (Steps)", "category": "strongman", "base_exp_per_rep": 1.8},
    {"name": "Sled Push (Steps)", "category": "strongman", "base_exp_per_rep": 1.9},
    {"name": "Atlas Stone Lift", "category": "strongman", "base_exp_per_rep": 2.2},
    {"name": "Yoke Walk (Steps)", "category": "strongman", "base_exp_per_rep": 2.1},
    {"name": "Log Press", "category": "strongman", "base_exp_per_rep": 2.0},
    {"name": "Tire Flip", "category": "strongman", "base_exp_per_rep": 2.2},
    {"name": "Sandbag Carry (Steps)", "category": "strongman", "base_exp_per_rep": 1.9},
    {"name": "Zercher Carry (Steps)", "category": "strongman", "base_exp_per_rep": 2.0},
    {"name": "Heavy Sled Drag (Steps)", "category": "strongman", "base_exp_per_rep": 2.0},
    {"name": "Axle Deadlift", "category": "strongman", "base_exp_per_rep": 2.2},
    {"name": "Stone Shoulder", "category": "strongman", "base_exp_per_rep": 2.3},
    {"name": "Conan Wheel Carry (Steps)", "category": "strongman", "base_exp_per_rep": 2.2},
)


def ensure_default_exercises(db: Session) -> None:
    existing_rows = db.query(ExerciseCatalog).all()
    existing_names = {row.name.strip().lower() for row in existing_rows}
    inserted = False

    for item in DEFAULT_EXERCISES:
        if item["name"].strip().lower() in existing_names:
            continue
        db.add(ExerciseCatalog(**item))
        inserted = True
    if inserted:
        db.commit()


def get_exercise_lookup(db: Session) -> Dict[str, ExerciseCatalog]:
    ensure_default_exercises(db)
    rows = db.query(ExerciseCatalog).order_by(ExerciseCatalog.name.asc()).all()
    return {row.name.strip().lower(): row for row in rows}


def list_exercises(db: Session) -> list[ExerciseCatalog]:
    ensure_default_exercises(db)
    return db.query(ExerciseCatalog).order_by(ExerciseCatalog.category.asc(), ExerciseCatalog.name.asc()).all()


def list_categories(db: Session) -> list[dict]:
    rows = list_exercises(db)
    by_category: dict[str, dict] = {}
    for row in rows:
        category = row.category
        current = by_category.get(category)
        if not current:
            by_category[category] = {"type_key": category, "label": category.capitalize(), "sum_base_exp": 0.0, "count": 0}
            current = by_category[category]
        current["sum_base_exp"] += float(row.base_exp_per_rep)
        current["count"] += 1

    return [
        {
            "type_key": category_data["type_key"],
            "label": category_data["label"],
            "base_exp_per_rep": round(category_data["sum_base_exp"] / max(category_data["count"], 1), 2),
            "description": f"Kategori {category_data['label']}",
        }
        for category_data in by_category.values()
    ]
