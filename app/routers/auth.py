from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from app.persistence.database import SessionLocal
from app.models.user import User
from sqlalchemy.orm import Session
from app.utils.auth import verify_password , hash_password
from app.utils.jwt_handler import create_access_token

router = APIRouter()

class LoginRequest(BaseModel):
    email: str
    password: str

@router.post("/login")
def login(request: LoginRequest):
    db: Session = SessionLocal()
    user = db.query(User).filter(User.email == request.email).first()

    if not user or not verify_password(request.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Identifiants invalides")

    token = create_access_token({"id": user.id, "is_admin": user.is_admin})
    return {"access_token": token}
'''
@router.post("/login_admin")
def login(request: LoginRequest):
    db: Session = SessionLocal()
    user = db.query(User).filter(User.email == request.email).first()

    if not user or not verify_password(request.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Identifiants invalides")

    token = create_access_token({"id": user.id, "is_admin": True})
    return {"access_token": token}
'''