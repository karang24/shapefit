from sqlalchemy import Column, Integer, ForeignKey, DateTime, String, Numeric
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from ..database import Base


class WorkoutLog(Base):
    __tablename__ = "workout_logs"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("sessions.id", ondelete="CASCADE"), nullable=False)
    exercise = Column(String(100), nullable=False)
    weight_kg = Column(Numeric(5, 2), nullable=False)
    reps = Column(Integer, nullable=False)
    sets = Column(Integer, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    session = relationship("Session", back_populates="workout_logs")
