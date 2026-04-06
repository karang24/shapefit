from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_
from datetime import datetime
from ..database import get_db
from ..auth.models import User
from ..auth.dependencies import get_current_user
from .models import Session as SessionModel
from .schemas import SessionCreate, Session, SessionStart, SessionUpdate

router = APIRouter(prefix="/api/sessions", tags=["sessions"])


@router.post("/start", response_model=Session)
def start_session(qr_data: SessionStart, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    coach = db.query(User).filter(User.role == "coach").first()
    if not coach:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Coach not found"
        )
    
    db_session = SessionModel(
        user_id=current_user.id,
        coach_id=coach.id
    )
    db.add(db_session)
    db.commit()
    db.refresh(db_session)
    return db_session


@router.get("/active", response_model=Session)
def get_active_session(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    active_session = db.query(SessionModel).filter(
        SessionModel.user_id == current_user.id,
        SessionModel.end_time.is_(None)
    ).first()
    
    if not active_session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No active session found"
        )
    return active_session


@router.put("/{session_id}/finish", response_model=Session)
def finish_session(session_id: int, session_update: SessionUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    session = db.query(SessionModel).filter(
        SessionModel.id == session_id,
        SessionModel.user_id == current_user.id
    ).first()
    
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )
    
    session.end_time = session_update.end_time or datetime.utcnow()
    if session_update.notes is not None:
        session.notes = session_update.notes
    
    db.commit()
    db.refresh(session)
    return session
