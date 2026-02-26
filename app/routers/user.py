from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.schemas.user_schema import UserCreate, UserOut, UserUpdate
from app.models.user import User
from app.models.reservations import Reservation
from app.persistence.database import get_db
from sqlalchemy.orm.exc import NoResultFound
from ..utils.auth import get_current_user, get_current_admin_user, hash_password
from app.persistence.database import SessionLocal
from sqlalchemy.exc import IntegrityError
import re

from app.utils.geocode import geocode_adresse_google

router = APIRouter(prefix="/Utilisateurs",  # Préfixe pour les routes
    tags=["Users"],  # Regroupement dans Swagger UI
    responses={404: {"description": "Utilisateur non trouvé"}},)

# Creer un nouvel utilisateur
@router.post("/Inscription", response_model=UserOut, status_code=status.HTTP_201_CREATED,
              summary="Création de compte pour les utilisateurs ===> Tous le monde", 
              description="Permet de créer un nouvel utilisateur avec un pseudo, un prénom, un email, une ville et un mot de passe.")
def create_user(user: UserCreate, db: Session = Depends(get_db), force: bool = False):

    db_user = db.query(User).filter(User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Cet email est déjà enregistré.")
    
    db_user_by_username = db.query(User).filter(User.username == user.username).first()
    if db_user_by_username:
        raise HTTPException(status_code=400, detail="Ce nom d'utilisateur est déjà pris.")
    
    # Validation du mot de passe
    if len(user.password) < 8 or not re.search(r'[!@#$%^&*(),.?":{}|<>]', user.password):
        raise HTTPException(
            status_code=400,
            detail="Le mot de passe doit contenir au moins 8 caractères et un caractère spécial."
        )

    # Géocoder la ville (city)
    lat, lon = geocode_adresse_google(user.city)
    if (lat is None or lon is None) and not force:
        raise HTTPException(
            status_code=400, 
            detail="Ville introuvable. Voulez-vous continuer ?"
        )
        
        # Pour continuer malgré l'erreur lat/lon
    if lat is None or lon is None:
        lat, lon = None, None

    try:
        hashed_pw = hash_password(user.password)
        db_user = User(
            first_name=user.first_name,
            username=user.username,
            city=user.city,
            email=user.email,
            hashed_password=hashed_pw,
            lat=lat,
            lon=lon
        )
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=500, detail="Erreur base de données. Réessayez plus tard.")
    
    return db_user

# Récupérer tous les utilisateurs de la base de données
@router.get("/TousLesUtilisateurs",
            summary="Voir tous les utilisateurs ===> Admin Only", 
            description="Permet de récupérer tous les utilisateurs de la base de données. Accessible uniquement aux administrateurs.")
def get_all_users(db: Session = Depends(get_db), current_user: dict = Depends(get_current_admin_user)):
    
    users = db.query(User).all()

    # Retourner les informations des utilisateurs, en excluant les mots de passe
    return [{"id": user.id, "first_name": user.first_name, "last_name": user.username, "email": user.email, "Admin": user.is_admin} for user in users]


# Supprimer son propre compte
@router.delete("/SupprimerMonCompte",
               summary="Supprimer son compte utilisateur ===> Authentifié", 
               description="Permet à un utilisateur de supprimer son propre compte. Accessible uniquement aux utilisateurs authentifiés.")
def delete_user(current_user: dict = Depends(get_current_user)):
    db: Session = SessionLocal()
    user_id = current_user["id"]  # Récupération de l'id de l'utilisateur à partir du token JWT

    try:
        # Cherche l'utilisateur dans la base de données
        user = db.query(User).filter(User.id == user_id).first()

        if not user:
            raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
        
        # Vérifier les réservations actives ou confirmées
        reservations_en_cours = db.query(Reservation).filter(
            Reservation.utilisateur_id == user_id,
            Reservation.statut.in_(["confirmée"])  # adapte selon tes statuts exacts
        ).all()

        if reservations_en_cours:
            raise HTTPException(
                status_code=403,
                detail="Impossible de supprimer le compte : vous avez des réservations confirmées."
            )
        
        if user.id != user_id:
            raise HTTPException(status_code=403, detail="Vous ne pouvez supprimer que votre propre compte")
        
        # Suppression de l'utilisateur
        db.delete(user)
        db.commit()

        return {"message": "Votre compte a été supprimé avec succès"}
    
    finally:
        db.close()
        

# Mise à jour de l'utilisateur (mot de passe et ville)
@router.put("/UpdateUser", response_model=UserOut,
            summary="Mettre à jour ses informations ===> Authentifié", 
            description="Permet à un utilisateur de mettre à jour ses informations (mot de passe et ville). Accessible uniquement aux utilisateurs authentifiés.")
def update_user(user_update: UserUpdate, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]  # ID de l'utilisateur à partir du token JWT

    # Chercher l'utilisateur dans la base de données
    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
    
    # Mettre à jour les informations
    if user_update.city:
        user.city = user_update.city
    
    if user_update.password:
        user.hashed_password = hash_password(user_update.password)

    # Sauvegarder les changements
    db.commit()
    db.refresh(user)
    
    return user


@router.get("/VoirMesInformations", response_model=UserOut,
            summary="Voir ses informations utilisateur ===> Authentifié", 
            description="Permet à un utilisateur de voir ses informations (nom, prénom, ville, email). Accessible uniquement aux utilisateurs authentifiés.")
def view_user_information(db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]  # Récupérer l'ID de l'utilisateur via le JWT

    # Chercher l'utilisateur dans la base de données
    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")

    # Préparer les données à retourner
    user_info = {
        "first_name": user.first_name,
        "username": user.username,
        "city": user.city,
        "email": user.email
    }

    return user_info
