from sqlalchemy import Column, Integer, ForeignKey, DateTime, String, Numeric, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from ..database import Base


class MealAnalysis(Base):
    __tablename__ = "meal_analyses"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    meal_type = Column(String(20), nullable=False)
    model = Column(String(100), nullable=False)
    estimated_calories = Column(Integer, nullable=False)
    protein_g = Column(Numeric(6, 2), nullable=False)
    carbs_g = Column(Numeric(6, 2), nullable=False)
    fat_g = Column(Numeric(6, 2), nullable=False)
    confidence = Column(Numeric(4, 2), nullable=False)
    raw_json = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)

    user = relationship("User")
