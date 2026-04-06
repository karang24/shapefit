from sqlalchemy import Column, Integer, ForeignKey, DateTime, Date, Numeric
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from ..database import Base


class BodyMetric(Base):
    __tablename__ = "body_metrics"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    weight_kg = Column(Numeric(5, 2), nullable=False)
    waist_cm = Column(Numeric(5, 2))
    date = Column(Date, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User")
