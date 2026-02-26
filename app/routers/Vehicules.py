from math import radians, cos, sin, asin, sqrt
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.models.Vehicules import Vehicule
from app.models.garages import Garage
from app.models.reservations import Reservation
from app.persistence.database import get_db
from typing import List
from app.schemas.Vehicules import VehiculeOut, VehiculeSearchRequest, VehiculeClientOut, VehiculeFicheResponse, ReservationOut

from ..utils.auth import get_current_garage
from .reservations import get_date_disponibilite

import os

router = APIRouter()

def est_valide(val):
    if isinstance(val, float) or isinstance(val, int):
        return val > 0
    return val not in [None, "", "string"]

def haversine(lat1, lon1, lat2, lon2):
    R = 6371  # rayon Terre en km
    dlat = radians(lat2 - lat1)
    dlon = radians(lon2 - lon1)
    a = sin(dlat / 2) ** 2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon / 2) ** 2
    c = 2 * asin(sqrt(a))
    return R * c


# Rechercher un véhicule en fonction des critères
@router.post(
    "/RechercheVehicule", 
    response_model=List[VehiculeClientOut],
    summary="Recherche de véhicules  ===> Tous le monde",
    description="Permet de rechercher des véhicules en fonction de la marque, du modèle, du carburant, de la ville, du prix minimum et maximum, de la disponibilité et de la localisation."
)
def rechercher_vehicule(
    request: VehiculeSearchRequest,
    db: Session = Depends(get_db)
):
    query = db.query(
        Vehicule,
        Garage.ville,
        Garage.lat.label("garage_lat"),
        Garage.lon.label("garage_lon")
    ).join(Garage)

    # 🔍 Filtres sur attributs simples
    if est_valide(request.marque):
        query = query.filter(Vehicule.marque.ilike(f"%{request.marque}%"))
    if est_valide(request.modele):
        query = query.filter(Vehicule.modele.ilike(f"%{request.modele}%"))
    if request.disponibilite is not None:
        query = query.filter(Vehicule.disponibilite == request.disponibilite)
    if est_valide(request.carburant):
        query = query.filter(Vehicule.carburant == request.carburant)
    if est_valide(request.ville):
        query = query.filter(Garage.ville.ilike(f"%{request.ville}%"))

    if est_valide(request.prix_min) and est_valide(request.prix_max):
        if request.prix_min > request.prix_max:
            raise HTTPException(
                status_code=400,
                detail="prix minimum ne peut pas être supérieur au prix maximum"
            )
    if est_valide(request.prix_min):
        query = query.filter(Vehicule.prix_par_jour >= request.prix_min)
    if est_valide(request.prix_max):
        query = query.filter(Vehicule.prix_par_jour <= request.prix_max)

    # 📍 Filtrage géographique
    if request.lat is not None and request.lon is not None and request.rayon_km is not None:
        garages = db.query(Garage).all()

        garages_proches_ids = [
            g.garage_id
            for g in garages
            if g.lat is not None and g.lon is not None and 
               haversine(request.lat, request.lon, g.lat, g.lon) <= request.rayon_km
        ]
        print(f"📌 Garages dans un rayon de {request.rayon_km} km : {garages_proches_ids}")

        if garages_proches_ids:
            query = query.filter(Vehicule.garage_id.in_(garages_proches_ids))
        else:
            print("❌ Aucun garage trouvé dans ce rayon.")
            return []

    # 🔄 Exécution de la requête SQL
    vehicules = query.all()
    print(f"🛠 Résultats bruts SQL : {vehicules}")

    # 📦 Construction de la réponse
    vehicules_pydantic = []
    for vehicule, ville, garage_lat, garage_lon in vehicules:
        
        try:
            v = VehiculeClientOut(
                vehicule_id=vehicule.vehicule_id,
                modele=vehicule.modele,
                marque=vehicule.marque,
                prix_par_jour=vehicule.prix_par_jour,
                carburant=vehicule.carburant,
                options=vehicule.options or [],
                disponibilite=vehicule.disponibilite,
                ville=ville,
                type_vehicule=vehicule.type_vehicule or "Non spécifié",
                images=vehicule.images or [],
                date_disponibilite=get_date_disponibilite(vehicule.vehicule_id, db),
                lat=garage_lat,
                lon=garage_lon,
                rayon_km=request.rayon_km,
                garage_id=vehicule.garage_id
            )
            vehicules_pydantic.append(v)
            print(f"🚗 {v.marque} {v.modele} à {v.ville} - {v.prix_par_jour}€/jour")
        except Exception as e:
            print("❌ Erreur lors de la création de VehiculeClientOut :", e)
            print(f"🚗 Donnée problématique : {vehicule=}, {ville=}, {garage_lat=}, {garage_lon=}")

    print(f"✅ Nombre de véhicules trouvés : {len(vehicules_pydantic)}")
    return vehicules_pydantic


# Consulter la fiche d'un véhicule
@router.get("/ConsulterFicheVehicules/{vehicule_id}", response_model=VehiculeFicheResponse)
def consulter_fiche(vehicule_id: int, db: Session = Depends(get_db)):
    # Récupération du véhicule principal
    vehicule = db.query(Vehicule).filter(Vehicule.vehicule_id == vehicule_id).first()
    if not vehicule:
        raise HTTPException(status_code=404, detail="Véhicule non trouvé")

    # Récupération des images
    images_vehicule = []
    for i in range(1, 5):
        image_filename = f"vehicule_{vehicule_id}_{i}.jpg"
        image_path = f"static/images/vehicules/{vehicule_id}/{image_filename}"
        if os.path.exists(image_path):
            images_vehicule.append(f"/static/images/vehicules/{vehicule_id}/{image_filename}")

    # Dernière réservation confirmée
    derniere_reservation = db.query(Reservation).filter(
        Reservation.vehicule_id == vehicule_id,
        Reservation.statut == "confirmée"
    ).order_by(Reservation.date_fin.desc()).first()

    date_disponibilite = derniere_reservation.date_fin if derniere_reservation else None

    # Construction de l'objet ReservationOut si existe
    reservation_out = None
    if derniere_reservation:
        reservation_out = ReservationOut.from_orm(derniere_reservation)

    # Récupération des autres véhicules du garage
    vehicules_du_garage_db = db.query(Vehicule).filter(
        Vehicule.garage_id == vehicule.garage_id
    ).all()

    # Construction liste véhicules autres que le principal
    vehicules_du_garage = []
    for v in vehicules_du_garage_db:
        if v.vehicule_id == vehicule_id:
            continue  # On ne remet pas le véhicule principal dans la liste
        vehicules_du_garage.append(
            VehiculeClientOut(
                vehicule_id=v.vehicule_id,
                modele=v.modele,
                marque=v.marque,
                prix_par_jour=v.prix_par_jour,
                carburant=v.carburant,
                options=v.options or [],
                date_disponibilite=None,
                disponibilite=v.disponibilite if v.disponibilite is not None else True,
                ville=v.garage.ville if v.garage else None,
                type_vehicule=v.type_vehicule or "Non spécifié",
                images=[],  # Optionnel : tu peux aussi récupérer images si tu veux
                reservation=None,
                boite_vitesse=v.boite_vitesse,
                nb_portes=v.nb_portes,
                nb_places=v.nb_places,
                kilometrage=v.kilometrage,
                annee_circulation=v.annee_circulation,
                crit_air=v.crit_air,
                permis_requis=v.permis_requis,
                garage_id=v.garage_id
            )
        )

    # Construction du véhicule principal avec toutes les infos et la réservation
    vehicule_principal = VehiculeClientOut(
        vehicule_id=vehicule.vehicule_id,
        modele=vehicule.modele,
        marque=vehicule.marque,
        prix_par_jour=vehicule.prix_par_jour,
        carburant=vehicule.carburant,
        options=vehicule.options or [],
        date_disponibilite=date_disponibilite,
        disponibilite=vehicule.disponibilite if vehicule.disponibilite is not None else True,
        ville=vehicule.garage.ville if vehicule.garage else None,
        type_vehicule=vehicule.type_vehicule or "Non spécifié",
        images=images_vehicule,
        reservation=reservation_out,
        boite_vitesse=vehicule.boite_vitesse,
        nb_portes=vehicule.nb_portes,
        nb_places=vehicule.nb_places,
        kilometrage=vehicule.kilometrage,
        annee_circulation=vehicule.annee_circulation,
        crit_air=vehicule.crit_air,
        permis_requis=vehicule.permis_requis,
        garage_nom=vehicule.garage.nom if vehicule.garage else None,
        garage_ville=vehicule.garage.ville if vehicule.garage else None,
        garage_id=vehicule.garage_id,
        garage_description=vehicule.garage.description if vehicule.garage else None,
    )

    # Réponse finale
    return VehiculeFicheResponse(
        vehicule=vehicule_principal,
        vehicules_du_garage=vehicules_du_garage
    )




# Mettre à jour la disponibilité d'un véhicule
@router.put("/DisponibiliteVehicules/{vehicule_id}/disponibilite", response_model=VehiculeOut,
              summary="Mettre à jour la disponibilité d'un véhicule  ===> Garage Authentifié",
              description="Permet à un garage de mettre à jour la disponibilité d'un véhicule. Le véhicule doit être associé au garage connecté.")
def mise_a_jour_disponibilite(
    vehicule_id: int,
    disponibilite: bool,
    db: Session = Depends(get_db),
    current_garage: dict = Depends(get_current_garage)
):
    vehicule = db.query(Vehicule).filter(Vehicule.vehicule_id == vehicule_id).first()
    if not vehicule:
        raise HTTPException(status_code=404, detail="Véhicule non trouvé")

    # Vérifie que le vehicule appartient bien au garage du token
    if vehicule.garage_id != current_garage:
        raise HTTPException(status_code=403, detail="Action non autorisée")

    vehicule.disponibilite = disponibilite
    db.commit()
    db.refresh(vehicule)

    return vehicule
    



OPTIONS_VALIDES = [
    "GPS",
    "Bluetooth",
    "Toit ouvrant",
    "Sièges chauffants",
    "Caméra de recul",
    "Aide au stationnement",
    "Climatisation automatique",
    "Régulateur de vitesse",
    "Allumage sans clé",
]


TYPES_VEHICULES = ["Berline", "SUV", "Citadine", "Sportive", "Cabriolet", "Break"]

@router.get("/Options", tags=["Vehicules"], summary="Liste des options valides pour les véhicules")
def get_options():
    return {"options": OPTIONS_VALIDES}

@router.get("/Types", tags=["Vehicules"], summary="Liste des types de véhicules valides")
def get_types():
    return {"types_vehicules": TYPES_VEHICULES}

# Récupérer les images de tous les véhicules
@router.get("/vehicules/images", summary="Récupérer les images de tous les véhicules", response_model=List[str])
async def get_all_vehicule_images(db: Session = Depends(get_db)):
    vehicules = db.query(Vehicule).all()

    # Extraire toutes les images dans une seule liste
    all_images = []
    for v in vehicules:
        if v.images:
            all_images.extend(v.images)

    return all_images