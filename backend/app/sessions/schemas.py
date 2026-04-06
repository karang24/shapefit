from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class SessionBase(BaseModel):
    notes: Optional[str] = None


class SessionCreate(SessionBase):
    pass


class SessionStart(BaseModel):
    qr_token: str


class Session(SessionBase):
    id: int
    user_id: int
    coach_id: Optional[int]
    start_time: datetime
    end_time: Optional[datetime]

    class Config:
        from_attributes = True


class SessionDetail(Session):
    workout_logs: list = []


class SessionUpdate(BaseModel):
    end_time: Optional[datetime] = None
    notes: Optional[str] = None
