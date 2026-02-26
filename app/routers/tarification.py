from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import timedelta

from app.models.garages import Garage
from app.models.Vehicules import Vehicule
from app.schemas.tarification import TarificationOut
from app.utils.tarification import calcul_tarif_mensuel
from app.utils.auth import get_current_garage
from app.persistence.database import get_db

router = APIRouter()

@router.get("/TarificationMensuelle/", response_model=TarificationOut)
def voir_tarification(
    current_garage: dict = Depends(get_current_garage),
    db: Session = Depends(get_db)
):
    garage = db.query(Garage).filter(Garage.garage_id == current_garage["id"]).first()
    if not garage:
        raise HTTPException(status_code=404, detail="Garage non trouvé")

    nb_vehicules = db.query(Vehicule).filter(Vehicule.garage_id == garage.garage_id).count()
    tarif = calcul_tarif_mensuel(nb_vehicules, garage.date_creation)

    return TarificationOut(
        nombre_vehicules=nb_vehicules,
        tarif_mensuel=tarif,
        gratuit_jusquau=(garage.date_creation + timedelta(days=90)).strftime('%Y-%m-%d')
    )
