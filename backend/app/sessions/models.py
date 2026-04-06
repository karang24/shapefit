from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from ..database import Base


class Session(Base):
    __tablename__ = "sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    coach_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"))
    start_time = Column(DateTime(timezone=True), server_default=func.now())
    end_time = Column(DateTime(timezone=True))
    notes = Column(Text)

    user = relationship("User", foreign_keys=[user_id])
    coach = relationship("User", foreign_keys=[coach_id])
    workout_logs = relationship("WorkoutLog", back_populates="session", cascade="all, delete-orphan")
