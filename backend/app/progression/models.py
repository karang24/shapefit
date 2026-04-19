from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Date, UniqueConstraint
from sqlalchemy.sql import func
from ..database import Base


class UserGoalProfile(Base):
    __tablename__ = "user_goal_profiles"
    __table_args__ = (
        UniqueConstraint("user_id", name="uq_user_goal_profiles_user_id"),
    )

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    goal_type = Column(String(30), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class WeeklyMissionReward(Base):
    __tablename__ = "weekly_mission_rewards"
    __table_args__ = (
        UniqueConstraint("user_id", "week_start", name="uq_weekly_mission_rewards_user_week"),
    )

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    week_start = Column(Date, nullable=False, index=True)
    week_end = Column(Date, nullable=False)
    goal_type = Column(String(30), nullable=False)
    completed_items = Column(Integer, nullable=False, default=0)
    total_items = Column(Integer, nullable=False, default=0)
    bonus_exp = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
