import json
from typing import Any


SYSTEM_PROMPT = (
    "You are a sports nutrition assistant. "
    "Analyze one meal image and estimate calories and macros. "
    "Return strict JSON only with keys: food_items, estimated_calories, protein_g, carbs_g, fat_g, confidence, notes. "
    "food_items is an array of objects with keys: name, estimated_portion, estimated_calories. "
    "confidence is between 0 and 1. "
    "Use integer calories and numeric grams."
)


def _normalize_base64(image_base64: str) -> tuple[str, str]:
    raw = image_base64.strip()
    if raw.startswith("data:") and "," in raw:
        header, body = raw.split(",", 1)
        mime_type = "image/jpeg"
        if ";base64" in header:
            mime_type = header.replace("data:", "").replace(";base64", "").strip().lower()
        return body.strip(), mime_type
    return raw, "image/jpeg"


def analyze_meal_image_openai(
    *,
    api_key: str,
    model: str,
    image_base64: str,
    mime_type: str | None,
    meal_type: str,
) -> dict[str, Any]:
    if not api_key:
        raise RuntimeError("OPENAI_API_KEY is empty")

    try:
        from openai import OpenAI
    except Exception as exc:
        raise RuntimeError("OpenAI SDK is not installed. Run pip install -r requirements.txt") from exc

    normalized_base64, inferred_mime = _normalize_base64(image_base64)
    final_mime_type = (mime_type or inferred_mime or "image/jpeg").lower()

    client = OpenAI(api_key=api_key)
    response = client.responses.create(
        model=model,
        input=[
            {
                "role": "system",
                "content": [{"type": "input_text", "text": SYSTEM_PROMPT}],
            },
            {
                "role": "user",
                "content": [
                    {
                        "type": "input_text",
                        "text": (
                            f"Meal type: {meal_type}. "
                            "Estimate calories/macros for this meal image. "
                            "Return only JSON."
                        ),
                    },
                    {
                        "type": "input_image",
                        "image_url": f"data:{final_mime_type};base64,{normalized_base64}",
                    },
                ],
            },
        ],
    )

    text = getattr(response, "output_text", "") or ""
    if not text:
        raise RuntimeError("Model returned empty output")

    try:
        parsed = json.loads(text)
    except json.JSONDecodeError as exc:
        raise RuntimeError("Model output is not valid JSON") from exc

    for key in ("food_items", "estimated_calories", "protein_g", "carbs_g", "fat_g", "confidence", "notes"):
        if key not in parsed:
            raise RuntimeError(f"Model output missing key: {key}")

    return parsed

