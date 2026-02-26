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

@router.post("/login", summary="Login utilisateur + login admin",
              description="Permet à un utilisateur de se connecter en fournissant son email et son mot de passe. Retourne un token d'accès si les identifiants sont valides.")
def login(request: LoginRequest):
    db: Session = SessionLocal()
    user = db.query(User).filter(User.email == request.email).first()

    if not user or not verify_password(request.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Identifiants invalides")
    
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Votre compte a été désactivé. Veuillez contacter l'administrateur.")

    token = create_access_token({"id": user.id, "is_admin": user.is_admin,"username": user.username})
    return {"access_token": token, "username": user.username}


'''
@router.post("/check-email")
def check_email(request: dict):
    email = request.get("email")
    db: Session = SessionLocal()
    user = db.query(User).filter(User.email == email).first()
    if user:
        return {"exists": True}
    else:
        return {"exists": False}
    '''
    
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