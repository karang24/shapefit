from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 10080
    OPENAI_API_KEY: str = ""
    OPENAI_VISION_MODEL: str = "gpt-5.4-mini"
    DAILY_IMAGE_ANALYSIS_LIMIT: int = 3

    class Config:
        env_file = ".env"


@lru_cache()
def get_settings():
    return Settings()
