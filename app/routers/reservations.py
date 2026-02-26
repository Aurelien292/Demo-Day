from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session , joinedload
from sqlalchemy import func
from typing import List , Dict
from app.utils.auth import get_current_user
from app.persistence.database import get_db
from app.models.reservations import Reservation
from app.schemas.reservations import ReservationCreate, ReservationOut, ReservationUpdate, ReservationClientOut, ReservationCalendarOut
from datetime import datetime, timedelta , date
router = APIRouter()

# Créer une réservation
@router.post("/CreerReservations/", response_model=ReservationClientOut, status_code=status.HTTP_201_CREATED,
              summary="Créer une réservation ====> Authentifié",
              description="Permet de créer une nouvelle réservation pour un véhicule. Vérifie les dates et la disponibilité du véhicule.")
def create_reservation(
    reservation: ReservationCreate,
    db: Session = Depends(get_db),
    current_user: Dict = Depends(get_current_user)
):
    # Vérifie les dates
    if reservation.date_debut >= reservation.date_fin:
        raise HTTPException(status_code=400, detail="La date de début doit être avant la date de fin")

    # Vérifie si véhicule déjà réservé
    existing = db.query(Reservation).filter(
        Reservation.garage_id == reservation.garage_id,
        Reservation.vehicule_id == reservation.vehicule_id,
        Reservation.statut == "confirmée",
        Reservation.date_debut < reservation.date_fin,
        Reservation.date_fin > reservation.date_debut
    ).first()

    if existing:
        raise HTTPException(
            status_code=400,
            detail="Le véhicule est déjà réservé sur cette période."
        )

    # Crée l'instance avec utilisateur_id injecté depuis JWT
    db_reservation = Reservation(
        **reservation.dict(exclude={"utilisateur_id"}),
        utilisateur_id=current_user["id"],
        
    )

    db.add(db_reservation)
    db.commit()
    db.refresh(db_reservation)
    return db_reservation


# Modifier sa réservation (statut, dates)
@router.put("/ModifierReservations/{reservation_id}", response_model=ReservationUpdate,
              summary="Modifier une réservation ===> Authentifié",
              description="Permet de modifier une réservation existante. Vérifie les dates et les conflits avec d'autres réservations confirmées.")
def update_reservation(
    reservation_id: int,
    reservation_update: ReservationUpdate,
    db: Session = Depends(get_db),
    current_user: Dict = Depends(get_current_user)  # <- ici, on reçoit le payload
):
    reservation = db.query(Reservation).filter(Reservation.reservation_id == reservation_id).first()

    if not reservation:
        raise HTTPException(status_code=404, detail="Réservation non trouvée")

    # Vérifie que l'utilisateur connecté est le propriétaire de la réservation
    if reservation.utilisateur_id != current_user["id"]:
        raise HTTPException(status_code=403, detail="Accès non autorisé à cette réservation")

    # Applique les mises à jour
    update_data = reservation_update.dict(exclude_unset=True)
    date_debut = update_data.get("date_debut", reservation.date_debut)
    date_fin = update_data.get("date_fin", reservation.date_fin)

    if date_debut >= date_fin:
        raise HTTPException(status_code=400, detail="La date de début doit être avant la date de fin")

    # Vérification des conflits uniquement si la réservation est confirmée
    if reservation.statut == "confirmée":
        conflit = db.query(Reservation).filter(
            Reservation.vehicule_id == reservation.vehicule_id,
            Reservation.reservation_id != reservation_id,
            Reservation.statut == "confirmée",
            Reservation.date_debut < date_fin,
            Reservation.date_fin > date_debut
        ).first()

        if conflit:
            raise HTTPException(status_code=400, detail="Conflit avec une autre réservation confirmée")

    for key, value in update_data.items():
        setattr(reservation, key, value)

    db.commit()
    db.refresh(reservation)
    return reservation

# Supprimer sa réservation
@router.delete("/SupprimerReservations/{reservation_id}",
               summary="Supprimer une réservation ===> Authentifié",
              description="Permet de supprimer une réservation existante. Vérifie que l'utilisateur est le propriétaire de la réservation ou un administrateur.")
def delete_reservation(
    reservation_id: int,
    db: Session = Depends(get_db),
    current_user: Dict = Depends(get_current_user)  # <- on reçoit le payload JWT
):
    reservation = db.query(Reservation).filter(Reservation.reservation_id == reservation_id).first()

    if not reservation:
        raise HTTPException(status_code=404, detail="Réservation non trouvée")

    # Vérifie que c’est bien la réservation de l’utilisateur ou qu’il est admin
    if reservation.utilisateur_id != current_user["id"] and not current_user.get("is_admin", False):
        raise HTTPException(status_code=403, detail="Suppression non autorisée")

    db.delete(reservation)
    db.commit()
    return {"message": "Réservation supprimée avec succès"}


# Lister toutes mes réservations
@router.get("/ListerReservations/", response_model=List[ReservationClientOut],
            summary="Lister mes réservations ===> Authentifié",
            description="Permet de lister toutes les réservations de l'utilisateur connecté.")
def list_my_reservations(
    db: Session = Depends(get_db),
    current_user: Dict = Depends(get_current_user)
):
    reservations = db.query(Reservation).options(
        joinedload(Reservation.garage),
        joinedload(Reservation.vehicule)
    ).filter(
        Reservation.utilisateur_id == current_user["id"]
    ).all()
    return reservations

def get_date_disponibilite(vehicule_id: int, db: Session):
    # Récupère la date de fin max des réservations confirmées du véhicule
    dernier_fin = db.query(func.max(Reservation.date_fin)).filter(
        Reservation.vehicule_id == vehicule_id,
        Reservation.statut == "confirmée"
    ).scalar()

    # Si aucune réservation confirmée, le véhicule est disponible immédiatement (pas de date future)
    if dernier_fin is None:
        return None  # Cela indique que le véhicule est disponible immédiatement
    
    # Sinon, retourner la date de fin de la dernière réservation confirmée
    print(f"Véhicule {vehicule_id} sera disponible à partir du {dernier_fin}")
    return dernier_fin  # Date de fin de la dernière réservation confirmée


# Récupérer les dates réservées pour un véhicule spécifique
@router.get("/DatesReservées/{vehicule_id}", response_model=List[ReservationCalendarOut],
            summary="Récupérer les dates réservées pour un garage",
            description="Retourne toutes les réservations (confirmées ou en attente) pour un garage donné.")
def get_reserved_dates_for_garage(
    vehicule_id: int,
    db: Session = Depends(get_db)
):
    reservations = db.query(Reservation).filter(
        Reservation.vehicule_id == vehicule_id,
        Reservation.statut.in_(["confirmée", "en attente"])
    ).options(
        joinedload(Reservation.garage),
        joinedload(Reservation.vehicule)
    ).all()

    reserved_dates = []
    for reservation in reservations:
        color = 'green'
        if reservation.statut == 'confirmée':
            color = 'red'
        elif reservation.statut == 'en attente':
            color = 'orange'
        reserved_dates.append({
            "reservation_id": reservation.reservation_id,
            "date_debut": reservation.date_debut.strftime("%Y-%m-%d"),
            "date_fin": (reservation.date_fin + timedelta(days=1)).strftime("%Y-%m-%d"),
            "statut": reservation.statut,
            "garage_id": reservation.garage_id,
            "vehicule_id": reservation.vehicule_id,
            "color": color
        })
    return reserved_dates


@router.get("/ForteDemande/{vehicule_id}")
def check_forte_demande(vehicule_id: int, db: Session = Depends(get_db)):
    trois_mois = datetime.now().date() - timedelta(days=90)  # date pour éviter problème avec datetime
    reservations_vehicule = db.query(Reservation).filter(
        Reservation.vehicule_id == vehicule_id,
        Reservation.statut == "confirmée",
        Reservation.date_fin >= trois_mois
    ).all()

    jours_reserves = 0
    for res in reservations_vehicule:
        debut = max(res.date_debut, trois_mois)
        fin = min(res.date_fin, datetime.now().date())
        jours_reserves += (fin - debut).days + 1  # +1 pour inclure le dernier jour

    return {"forte_demande": jours_reserves > 60}

