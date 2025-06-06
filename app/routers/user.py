from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.schemas.user_schema import UserCreate, UserOut
from app.models.user import User
from app.persistence.database import get_db
from app.utils.auth import hash_password
from ..utils.auth import get_current_admin_user
from sqlalchemy.orm.exc import NoResultFound
from ..utils.auth import get_current_user
from app.persistence.database import SessionLocal

router = APIRouter()

@router.post("/users/", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def create_user(user: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed_pw = hash_password(user.password)
    db_user = User(
        first_name=user.first_name,
        username=user.username,
        city=user.city,
        email=user.email,
        hashed_password=hashed_pw
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


@router.get("/users")
def get_all_users(db: Session = Depends(get_db), current_user: dict = Depends(get_current_admin_user)):
    # Récupérer tous les utilisateurs de la base de données
    users = db.query(User).all()

    # Retourner les informations des utilisateurs, en excluant les mots de passe
    return [{"id": user.id, "first_name": user.first_name, "last_name": user.username, "email": user.email, "Admin": user.is_admin} for user in users]

@router.delete("/users/me")
def delete_user(current_user: dict = Depends(get_current_user)):
    db: Session = SessionLocal()
    user_id = current_user["id"]  # Récupération de l'id de l'utilisateur à partir du token JWT

    try:
        # Cherche l'utilisateur dans la base de données
        user = db.query(User).filter(User.id == user_id).first()

        if not user:
            raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
        
        if user.id != user_id:
            raise HTTPException(status_code=403, detail="Vous ne pouvez supprimer que votre propre compte")
        
        # Suppression de l'utilisateur
        db.delete(user)
        db.commit()

        return {"message": "Votre compte a été supprimé avec succès"}
    
    except NoResultFound:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
    finally:
        db.close()