from __future__ import annotations

from typing import Dict, Iterable, Optional, Tuple


RANK_ORDER: Tuple[str, ...] = ("F", "E", "D", "C", "B", "A", "S")
BASE_EXP_NEXT_RANK = 500
RANK_GROWTH_FACTOR = 5


def _build_rank_thresholds() -> Tuple[Tuple[str, int], ...]:
    thresholds: list[Tuple[str, int]] = [("F", 0)]
    total_exp = 0
    exp_to_next = BASE_EXP_NEXT_RANK

    for rank in RANK_ORDER[1:]:
        total_exp += exp_to_next
        thresholds.append((rank, total_exp))
        exp_to_next *= RANK_GROWTH_FACTOR

    return tuple(thresholds)


RANK_THRESHOLDS: Tuple[Tuple[str, int], ...] = _build_rank_thresholds()

FALLBACK_CATEGORY_BASE_EXP: Dict[str, float] = {
    "kettlebell": 1.7,
    "powerlifting": 2.05,
    "bodybuilding": 1.45,
    "kalistenik": 1.25,
    "strongman": 1.95,
}


def calculate_workout_exp(base_exp_per_rep: float, weight_kg: float, reps: int, sets: int) -> int:
    safe_weight = max(float(weight_kg), 0.0)
    safe_reps = max(int(reps), 0)
    safe_sets = max(int(sets), 0)
    total_reps = safe_reps * safe_sets
    weight_multiplier = 1.0 + (safe_weight / 12.0)
    exp = int(round(total_reps * float(base_exp_per_rep) * weight_multiplier))
    return max(exp, 1)


def get_rank(total_exp: int) -> Dict[str, Optional[float | int | str]]:
    exp_value = max(int(total_exp), 0)
    current_rank = "F"
    current_floor = 0
    next_rank: Optional[str] = None
    next_threshold: Optional[int] = None

    for index, (rank, threshold) in enumerate(RANK_THRESHOLDS):
        if exp_value >= threshold:
            current_rank = rank
            current_floor = threshold
            if index + 1 < len(RANK_THRESHOLDS):
                next_rank, next_threshold = RANK_THRESHOLDS[index + 1]
            else:
                next_rank, next_threshold = None, None
        else:
            break

    if next_threshold is None:
        progress_percent = 100.0
        exp_to_next_rank = 0
    else:
        range_size = max(next_threshold - current_floor, 1)
        progress_percent = ((exp_value - current_floor) / range_size) * 100.0
        exp_to_next_rank = max(next_threshold - exp_value, 0)

    return {
        "rank": current_rank,
        "next_rank": next_rank,
        "total_exp": exp_value,
        "exp_to_next_rank": exp_to_next_rank,
        "progress_percent": round(progress_percent, 2),
    }


def summarize_gamification(log_rows: Iterable, exercise_lookup: Dict[str, object]) -> dict:
    total_exp = 0
    per_type: Dict[str, int] = {}

    for workout in log_rows:
        normalized_name = (workout.exercise or "").strip().lower()
        catalog_item = exercise_lookup.get(normalized_name)

        if catalog_item:
            exercise_type = catalog_item.category
            base_exp_per_rep = float(catalog_item.base_exp_per_rep)
        else:
            exercise_type = "bodybuilding"
            base_exp_per_rep = FALLBACK_CATEGORY_BASE_EXP[exercise_type]

        exp = calculate_workout_exp(
            base_exp_per_rep=base_exp_per_rep,
            weight_kg=float(workout.weight_kg),
            reps=workout.reps,
            sets=workout.sets,
        )
        total_exp += exp
        per_type[exercise_type] = per_type.get(exercise_type, 0) + exp

    rank_payload = get_rank(total_exp)
    top_types = sorted(per_type.items(), key=lambda item: item[1], reverse=True)

    return {
        **rank_payload,
        "exercise_type_exp": [{"type_key": key, "total_exp": value} for key, value in top_types],
    }
