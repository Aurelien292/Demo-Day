from fastapi import APIRouter, HTTPException, status, Depends, UploadFile, File, Query
from sqlalchemy.orm import Session
from app.schemas.garages import GarageCreate, GarageOut, GarageClientOut, GarageInfosOut, GarageUpdate, GarageInfosUpdateOut
from app.schemas.Vehicules import VehiculeCreate, VehiculeUpdate, VehiculeOut, VehiculeClientOut
from app.persistence.database import get_db
from app.models.garages import Garage
from app.models.Vehicules import Vehicule
from ..utils.auth import hash_password, verify_password, get_current_garage
from sqlalchemy.exc import IntegrityError
from pydantic import BaseModel
from app.utils.jwt_handler import create_access_token
from typing import List
from app.routers.Vehicules import TYPES_VEHICULES, OPTIONS_VALIDES
from app.models.reservations import Reservation
from datetime import datetime
from app.utils.tarification import calcul_tarif_mensuel
from datetime import datetime, timedelta
import os, re, uuid
from app.utils.geocode import geocode_adresse_google

import googlemaps
router = APIRouter()


gmaps = googlemaps.Client(key=os.getenv("GOOGLE_API_KEY"))

@router.get("/nearbygarages/", response_model=List[GarageClientOut],
            summary="Liste des garages à proximité",
            description="Retourne les garages dans un rayon donné autour des coordonnées utilisateur.")
def get_nearby_garages(
    lat: float = Query(..., description="Latitude de l'utilisateur"),
    lon: float = Query(..., description="Longitude de l'utilisateur"),
    radius_km: float = Query(10.0, ge=0.1, le=100.0, description="Rayon de recherche en kilomètres"),
    db: Session = Depends(get_db),
):
    garages = db.query(Garage).filter(Garage.lat.isnot(None), Garage.lon.isnot(None)).all()
    if not garages:
        
        raise HTTPException(status_code=404, detail="Aucun garage géolocalisé trouvé")

    origins = f"{lat},{lon}"
    destinations = [f"{g.lat},{g.lon}" for g in garages]

    try:
        matrix = gmaps.distance_matrix(
            origins=origins,
            destinations=destinations,
            mode="driving",
            language="fr"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur appel API Google: {str(e)}")

    results = []
    for g, element in zip(garages, matrix["rows"][0]["elements"]):
        if element.get("status") != "OK":
            continue
        distance_m = element["distance"]["value"]   # distance en mètres
        duration_s = element["duration"]["value"]   # durée en secondes
        if distance_m <= radius_km * 1000:
            g.distance = round(distance_m / 1000, 2)   # en km
            g.duration = round(duration_s / 60, 1)     # en minutes
            results.append(g)

    results.sort(key=lambda g: g.distance)
    return results



@router.post("/CreationDeGarage/", response_model=GarageClientOut, status_code=status.HTTP_201_CREATED,
              summary="Créer un garage",
              description="Permet de créer un nouveau garage avec un nom, une adresse, une ville, un email et un mot de passe.")
def create_garage(garage: GarageCreate, db: Session = Depends(get_db)):
    # Vérifications existantes
    db_garage = db.query(Garage).filter(Garage.email == garage.email).first()
    if db_garage:
        raise HTTPException(status_code=400, detail="Garage avec cet email existe déjà")
    
    db_garage_by_nom = db.query(Garage).filter(Garage.nom == garage.nom).first()
    if db_garage_by_nom:
        raise HTTPException(status_code=400, detail="Un garage avec ce nom existe déjà")
    
    # Géocodage adresse -> lat/lon
    lat, lon = geocode_adresse_google(f"{garage.adresse}, {garage.ville}")
    if lat is None or lon is None:
        raise HTTPException(status_code=400, detail="Adresse introuvable via Google Geocoding API")

    try:
        hashed_pw = hash_password(garage.password)
        new_garage = Garage(
            nom=garage.nom,
            adresse=garage.adresse,
            ville=garage.ville,
            email=garage.email,
            hashed_password=hashed_pw,
            description=garage.description,
            telephone=garage.telephone,
            lat=lat,
            lon=lon,
            date_creation=datetime.utcnow()
        )
        db.add(new_garage)
        db.commit()
        db.refresh(new_garage)
        
    except IntegrityError as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Erreur d'intégrité de la base de données. Veuillez réessayer plus tard.")
    
    return new_garage

class GarageLoginRequest(BaseModel):
    email: str
    password: str
    
# Connexion d'un garage
@router.post("/connexion/",summary="Connexion d'un garage",
              description="Permet à un garage de se connecter en fournissant son email et son mot de passe. Retourne un token d'accès si les identifiants sont valides.")
def connexion(request: GarageLoginRequest, db: Session = Depends(get_db)):
    garage = db.query(Garage).filter(Garage.email == request.email).first()
    
    if not garage or not verify_password(request.password, garage.hashed_password):
        raise HTTPException(status_code=401, detail="Identifiants ou password invalides")
    
    if not garage.is_active:
        raise HTTPException(status_code=403, detail="Votre compte a été désactivé. Veuillez contacter l'administrateur.")
    
    token = create_access_token({
        "id": garage.garage_id,
    }, expires_delta=None)

    return {
        "message": "Connexion réussie",
        "access_token": token
    }


#supprimer un garage
@router.delete("/SupprimerMonGarage/",
                summary="Supprimer son compte garage  ===> Garage Authentifié",
                description="Permet à un garage de supprimer son compte. Accessible uniquement aux garages authentifiés.")
def supprimer_mon_compte(  
    current_garage: dict = Depends(get_current_garage),  # dépendance qui extrait l’info du token
    db: Session = Depends(get_db)
):
    garage_id = current_garage["id"]

    db_garage = db.query(Garage).filter(Garage.garage_id == garage_id).first()
    if not db_garage:
        raise HTTPException(status_code=404, detail="Garage non trouvé")

    db.delete(db_garage)
    db.commit()

    return {"message": "Votre compte garage a été supprimé avec succès"}

# Ajouter un véhicule à un garage
@router.post("/AjouterVehicules/",
             summary="Ajouter un véhicule à un garage  ===> Garage Authentifié ",
             description="Permet à un garage d'ajouter un nouveau véhicule. Le véhicule doit être associé au garage connecté.")
def ajouter_vehicule(
    vehicule: VehiculeCreate,
    current_garage: dict = Depends(get_current_garage),
    db: Session = Depends(get_db)
):
    garage_id = current_garage
    db_garage = db.query(Garage).filter(Garage.garage_id == garage_id).first()
    if not db_garage:
        raise HTTPException(status_code=404, detail="Garage non trouvé")
    
     # Validation options
    invalid_options = [opt for opt in vehicule.options if opt not in OPTIONS_VALIDES]
    if invalid_options:
        raise HTTPException(status_code=400, detail=f"Options invalides : {invalid_options}")

    # Validation type_vehicule (optionnelle, Pydantic fait déjà ça)
    if vehicule.type_vehicule not in TYPES_VEHICULES:
        raise HTTPException(status_code=400, detail=f"Type de véhicule invalide : {vehicule.type_vehicule}")
    


    new_vehicule = Vehicule(
        modele=vehicule.modele,
    marque=vehicule.marque,
    prix_par_jour=vehicule.prix_par_jour,
    carburant=vehicule.carburant,
    options=vehicule.options,
    disponibilite=vehicule.disponibilite,
    garage_id=garage_id,
    type_vehicule=vehicule.type_vehicule,
    boite_vitesse=vehicule.boite_vitesse,
    nb_portes=vehicule.nb_portes,
    nb_places=vehicule.nb_places,
    kilometrage=vehicule.kilometrage,
    annee_circulation=vehicule.annee_circulation,
    crit_air=vehicule.crit_air,
    permis_requis=vehicule.permis_requis
    )
    db.add(new_vehicule)
    db.commit()
    db.refresh(new_vehicule)

    return new_vehicule

# Modifier un véhicule d'un garage
@router.put("/ModifierVehicule/{vehicule_id}", response_model=VehiculeOut,
             summary="Modifier un véhicule d'un garage  ===> Garage Authentifié ",
             description="Permet à un garage de modifier les informations d'un véhicule. Le véhicule doit être associé au garage connecté.")
def modifier_vehicule(
    vehicule_id: int,
    vehicule_update: VehiculeUpdate,
    current_garage: dict = Depends(get_current_garage),
    db: Session = Depends(get_db)
):
    garage_id = current_garage
    
    vehicule = db.query(Vehicule).filter(
        Vehicule.vehicule_id == vehicule_id,
        Vehicule.garage_id == garage_id 
    ).first()

    if not vehicule:
        raise HTTPException(status_code=404, detail="Véhicule non trouvé ou accès interdit")
    
    
    if vehicule_update.prix_par_jour is not None:
        vehicule.prix_par_jour = vehicule_update.prix_par_jour
    if vehicule_update.carburant:
        vehicule.carburant = vehicule_update.carburant
    if vehicule_update.options is not None:
        vehicule.options = vehicule_update.options  # conserve sous forme de liste (JSON)
    if vehicule_update.disponibilite is not None:
        vehicule.disponibilite = vehicule_update.disponibilite
    if vehicule_update.kilometrage is not None:
        vehicule.kilometrage = vehicule_update.kilometrage

    db.commit()
    db.refresh(vehicule)

    return vehicule 


# Supprimer un véhicule d'un garage
@router.delete("/SupprimeVehicules/{vehicule_id}", status_code=status.HTTP_200_OK,
                summary="Supprimer un véhicule d'un garage  ===> Garage Authentifié ",
                description="Permet à un garage de supprimer un véhicule. Le véhicule doit être associé au garage connecté.")
def supprimer_vehicule(
    vehicule_id: int,
    current_garage: dict = Depends(get_current_garage),
    db: Session = Depends(get_db)
):
    garage_id = current_garage

    vehicule = db.query(Vehicule).filter(
        Vehicule.vehicule_id == vehicule_id,
        Vehicule.garage_id == garage_id
    ).first()

    if not vehicule:
        raise HTTPException(status_code=404, detail="Véhicule non trouvé ou accès interdit")

    db.delete(vehicule)
    db.commit()

    return {"message": "Véhicule supprimé avec succès"}

# Lister les véhicules d'un garage
@router.get("/ListerVehicules/{garage_id}/vehicules/", response_model=List[VehiculeClientOut],
             summary="Lister les véhicules d'un garage  ===> Tous le monde",
             description="Permet à un garage de lister tous les véhicules associés à son garage. A tous le monde.")
def lister_vehicules_du_garage(garage_id: int, db: Session = Depends(get_db)):
    
    garage_obj = db.query(Garage).filter(Garage.garage_id == garage_id).first()
    if not garage_obj:
        raise HTTPException(status_code=404, detail="Garage non trouvé")
    
    vehicules = db.query(Vehicule).filter(Vehicule.garage_id == garage_id).all()
    if not vehicules:
        raise HTTPException(status_code=404, detail="Aucun véhicule trouvé pour ce garage")
    vehicules_pydantic = [
        VehiculeClientOut(
            vehicule_id=vehicule.vehicule_id,
            modele=vehicule.modele,
            marque=vehicule.marque,
            prix_par_jour=vehicule.prix_par_jour,
            carburant=vehicule.carburant,
            options=vehicule.options or [],
            disponibilite=vehicule.disponibilite,
            ville=vehicule.garage.ville,  # Accède à la ville via la relation Garage
            type_vehicule=vehicule.type_vehicule or "Non spécifié",
            images=[],
            garage_id=vehicule.garage_id,
        )
        for vehicule in vehicules
    ]
    
    # Retourne la liste des véhicules au format attendu par la réponse
    return vehicules_pydantic


#consulter les réservations pour un garage
@router.get("/ConsulterReservations/",
             summary="Consulter les réservations d'un garage  ===> Garage Authentifié",
             description="Permet à un garage de consulter toutes les réservations associées à son garage. Accessible uniquement aux garages authentifiés.")
def consulter_reservations(
    garage_id: int = Depends(get_current_garage),  # récupère directement l'id du garage
    db: Session = Depends(get_db)
):
    db_garage = db.query(Garage).filter(Garage.garage_id == garage_id).first()
    if not db_garage:
        raise HTTPException(status_code=404, detail="Garage non trouvé")

    # Récupérer les réservations du garage avec les informations du véhicule
    reservations = db.query(Reservation).join(Vehicule).filter(Reservation.garage_id == garage_id).all()

    # Ajouter les informations du véhicule à chaque réservation
    result = []
    for reservation in reservations:
        reservation_data = reservation.__dict__
        if reservation.vehicule:
            # Ajouter la marque et le modèle du véhicule dans la réponse
            reservation_data['vehicule_marque'] = reservation.vehicule.marque
            reservation_data['vehicule_modele'] = reservation.vehicule.modele
        else:
            reservation_data['vehicule_marque'] = "Inconnu"  # Marque inconnue si pas de véhicule associé
            reservation_data['vehicule_modele'] = "Inconnu"  # Modèle inconnu si pas de véhicule associé
        result.append(reservation_data)

    return result



# Confirmer une réservation pour un garage
@router.patch("/ConfirmerReservation/{reservation_id}", summary="Confirmer une réservation", tags=["Garages"])
def confirmer_reservation(
    reservation_id: int,
    db: Session = Depends(get_db),
    current_garage: dict = Depends(get_current_garage)
):
    garage_id = current_garage

    # Récupération de la réservation
    reservation = db.query(Reservation).filter(Reservation.reservation_id == reservation_id).first()
    if not reservation:
        raise HTTPException(status_code=404, detail="Réservation non trouvée")

    # Vérifier que le véhicule appartient au garage connecté
    vehicule = db.query(Vehicule).filter(
        Vehicule.vehicule_id == reservation.vehicule_id,
        Vehicule.garage_id == garage_id
    ).first()

    if not vehicule:
        raise HTTPException(status_code=403, detail="Accès interdit à cette réservation")
    
    if reservation.statut.lower() == "confirmée":
        raise HTTPException(status_code=400, detail="Réservation déjà confirmée")

    # Mise à jour du statut
    reservation.statut = "Confirmée"
    db.commit()
    db.refresh(reservation)

    return {"message": "Réservation confirmée", "reservation_id": reservation_id, "statut": reservation.statut}


# Uploader des images pour un véhicule

ALLOWED_EXTENSIONS = {"image/jpeg", "image/png", "image/jpg"}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 Mo

def sanitize_filename(name: str) -> str:
    # Enlève les caractères spéciaux non autorisés dans un nom de fichier
    return re.sub(r'[^a-zA-Z0-9_.-]', '_', name)

"""def find_available_slot(folder: str, vehicule_id: int) -> int:
    Trouver le premier slot disponible pour une image (vehicule_1 à vehicule_4).
    existing_files = [f for f in os.listdir(folder) if f.startswith(f"vehicule_{vehicule_id}_")]
    
    # Vérifier les slots de 1 à 4
    for i in range(1, 5):
        # Si le fichier n'existe pas pour ce slot, c'est ce slot qui est disponible
        if f"vehicule_{vehicule_id}_{i}" not in existing_files:
            return i
    
    # Si aucun slot n'est disponible, retourner None
    return None """

@router.post("/upload_images/{vehicule_id}", summary="Uploader jusqu'à 4 images pour un véhicule")
async def upload_images_vehicule(
    vehicule_id: int,
    images: List[UploadFile] = File(...),
    current_garage: int = Depends(get_current_garage),
    db: Session = Depends(get_db)
):
    garage_id = current_garage

    # Vérification que le véhicule appartient bien au garage
    vehicule = db.query(Vehicule).filter(
        Vehicule.vehicule_id == vehicule_id,
        Vehicule.garage_id == garage_id
    ).first()

    if not vehicule:
        raise HTTPException(status_code=404, detail="Véhicule non trouvé ou accès interdit")

    if len(images) > 4:
        raise HTTPException(status_code=400, detail="Vous pouvez uploader un maximum de 4 images.")

    image_urls = []
    
    folder = f"static/images/vehicules/{vehicule_id}"
    
    os.makedirs(folder, exist_ok=True)

    # Slots déjà utilisés pour le véhicule 
    existing_images = [f for f in os.listdir(folder) if f.startswith(f"vehicule_{vehicule_id}_")]
    existing_slots = [int(f.split('_')[-1].split('.')[0]) for f in existing_images]  # Récupérer les slots utilisés
    available_slots = [i for i in range(1, 5) if i not in existing_slots]  # Identifier les slots vides

    
    if not available_slots:
        raise HTTPException(status_code=400, detail="Tous les slots d'images (vehicule_1 à vehicule_4) sont déjà remplis.")

    # Ajout les images et les renommer pour occuper les slots disponibles
    for idx, img in enumerate(images):
        if idx >= len(available_slots):  # Si plus de 4 images sont envoyées, arrêter
            break

        # Format autorisé
        if img.content_type not in ALLOWED_EXTENSIONS:
            raise HTTPException(status_code=400, detail=f"Format non autorisé : {img.filename}")

        
        contents = await img.read()

        # Taille
        if len(contents) > MAX_FILE_SIZE:
            raise HTTPException(status_code=400, detail=f"L'image {img.filename} dépasse 5 Mo.")

        
        safe_filename = sanitize_filename(f"{vehicule.marque}_{vehicule.modele}_{img.filename}")
        
        
        available_slot = available_slots[idx]  
        new_filename = f"vehicule_{vehicule_id}_{available_slot}{os.path.splitext(safe_filename)[1]}"
        path = os.path.join(folder, new_filename)
        
        
        with open(path, "wb") as buffer:
            buffer.write(contents)

        # Chemin public pour frontend
        public_path = path.replace("static/", "")
        image_urls.append(f"/static/{public_path}")

    # Mise à jour des images dans la base de données
    vehicule.images = (vehicule.images or []) + image_urls
    db.commit()
    db.refresh(vehicule)

    return {
        "message": "Images ajoutées avec succès.",
        "images": image_urls
    }


# Supprimer une image d'un véhicule
@router.delete("/garages/{vehicule_id}/delete_image", summary="Supprimer une image d’un véhicule")
def delete_vehicule_image(
    vehicule_id: int,
    image_url: str = Query(..., description="URL de l'image à supprimer"),
    current_garage: int = Depends(get_current_garage),
    db: Session = Depends(get_db)
):
    garage_id = current_garage

    # Vérifie si le véhicule appartient au garage
    vehicule = db.query(Vehicule).filter(
        Vehicule.vehicule_id == vehicule_id,
        Vehicule.garage_id == garage_id
    ).first()

    if not vehicule:
        raise HTTPException(status_code=404, detail="Véhicule non trouvé ou accès interdit")

    # Vérifie si l'image est dans la liste
    if image_url not in vehicule.images:
        raise HTTPException(status_code=400, detail="L’image n’existe pas dans ce véhicule.")

     # Supprime l'image de la liste de la base de données
    vehicule.images = [img for img in vehicule.images if img != image_url]
    db.commit()
    db.refresh(vehicule)

    # Construire le chemin complet du fichier
    file_path = image_url.lstrip('/')

    # Log pour vérifier le chemin
    print(f"Chemin du fichier à supprimer : {file_path}")

    # Supprime le fichier physique si possible
    if os.path.exists(file_path):
        try:
            os.remove(file_path)
            print(f"Fichier {file_path} supprimé avec succès.")
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Erreur lors de la suppression physique : {str(e)}")
    else:
        print(f"Fichier {file_path} non trouvé.")
    
    return {
        "message": "Image supprimée avec succès.",
        "images_restantes": vehicule.images
    }
    
    
    
@router.get("/MonGarage", response_model=GarageInfosOut)
def infos_mon_garage(
    current_garage: dict = Depends(get_current_garage),
    db: Session = Depends(get_db)
):
    garage = db.query(Garage).filter(Garage.garage_id == current_garage).first()

    if not garage:
        raise HTTPException(status_code=404, detail="Garage non trouvé")

    nb_vehicules = db.query(Vehicule).filter(Vehicule.garage_id == garage.garage_id).count()
    date_creation = garage.date_creation
    date_fin_gratuite = date_creation + timedelta(days=90)
    jours_restants = (date_fin_gratuite - datetime.utcnow()).days
    jours_restants = max(jours_restants, 0)

    tarif = calcul_tarif_mensuel(nb_vehicules, date_creation)

    return {
        "garage_id": garage.garage_id,
        "nom": garage.nom,
        "email": garage.email,
        "ville": garage.ville,
        "telephone": garage.telephone,
        "date_creation": date_creation,
        "nb_vehicules": nb_vehicules,
        "periode_gratuite": jours_restants > 0,
        "jours_restants_gratuits": jours_restants,
        "tarif_mensuel": tarif,
        "adresse": garage.adresse,
        "description": garage.description or "Aucune description fournie",
        "prochaine_facturation": (date_creation + timedelta(days=90)).date().isoformat()  # ou autre logique
    }
    
@router.patch("/MonGarage", response_model=GarageInfosUpdateOut)
def modifier_garage(
    update: GarageUpdate,  # input model avec champs optionnels à modifier
    current_garage: int = Depends(get_current_garage),
    db: Session = Depends(get_db)
):
    garage = db.query(Garage).filter(Garage.garage_id == current_garage).first()

    if not garage:
        raise HTTPException(status_code=404, detail="Garage non trouvé")

    for field, value in update.dict(exclude_unset=True).items():
        setattr(garage, field, value)

    try:
        db.commit()
        db.refresh(garage)
    except Exception:
        db.rollback()
        raise HTTPException(status_code=500, detail="Erreur lors de la mise à jour du garage")

    return {
        "garage_id": garage.garage_id,
        "nom": garage.nom,
        "email": garage.email,
        "ville": garage.ville,
        "telephone": garage.telephone,
        "adresse": garage.adresse,
        "description": garage.description or "Aucune description fournie"
    }
    
    
    