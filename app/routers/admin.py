from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.persistence.database import get_db
from app.utils.auth import get_current_admin_user
from app.models.user import User
from app.models.garages import Garage

router = APIRouter()

@router.patch("/users/{user_id}/desactiver", summary="Désactiver un utilisateur",
               description="Permet à un administrateur de désactiver un utilisateur. L'utilisateur ne pourra plus se connecter.")
def desactiver_utilisateur(
    user_id: int,
    is_active: bool,
    db: Session = Depends(get_db),
    current_admin: dict = Depends(get_current_admin_user)
):
    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")

    if user.is_active == is_active:
        change_status = "actif" if is_active else "désactivé"
        raise HTTPException(status_code=400, detail=f"L'utilisateur est déjà {change_status}.")

    user.is_active = is_active
    db.commit()
    db.refresh(user)
    new_status = "activé" if is_active else "désactivé"
    return {"message": f"L'utilisateur {user.email} a été {new_status}."}


@router.patch("/users/{garage_id}/desactiver", summary="Désactiver un garage",
               description="Permet à un administrateur de désactiver un garage. Le garage ne pourra plus se connecter.")
def desactiver_garage(
    garage_id: int,
    is_active: bool,
    db: Session = Depends(get_db),
    current_admin: dict = Depends(get_current_admin_user)
):
    garage = db.query(Garage).filter(Garage.garage_id == garage_id).first()

    if not garage:
        raise HTTPException(status_code=404, detail="Garage non trouvé")

    if garage.is_active == is_active:
        change_status = "actif" if is_active else "désactivé"
        raise HTTPException(status_code=400, detail=f"Le garage est déjà {change_status}.")

    garage.is_active = is_active
    db.commit()
    db.refresh(garage)
    new_status = "activé" if is_active else "désactivé"
    return {"message": f"L'utilisateur {garage.email} a été {new_status}."}



@router.get("/stats", summary="Statistiques globales")
def generer_statistiques(db: Session = Depends(get_db)):
    from app.models.user import User
    from app.models.garages import Garage
    from app.models.Vehicules import Vehicule

    nb_users = db.query(User).count()
    nb_garages = db.query(Garage).count()
    nb_vehicules = db.query(Vehicule).count()

    return {
        "utilisateurs": nb_users,
        "garages": nb_garages,
        "vehicules": nb_vehicules
    }

