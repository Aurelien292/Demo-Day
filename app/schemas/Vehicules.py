from pydantic import BaseModel
from typing import List, Optional, Literal
from app.models.Vehicules import Vehicule
from datetime import date


class VehiculeBase(BaseModel):
    modele: Optional[str] = None
    marque: Optional[str] = None
    prix_par_jour: float
    carburant: Literal["Essence", "Diesel", "Electrique", "Hybride", "GPL", "Autre"]
    options: Optional[List[str]] = []
    disponibilite: bool = True
    type_vehicule: Literal["Berline", "SUV", "Citadine", "Sportive", "Cabriolet", "Break"]
    images: List[str] = []
    boite_vitesse: Optional[Literal["Manuelle", "Automatique"]] = None
    nb_portes: Optional[int] = None
    nb_places: Optional[int] = None
    kilometrage: Optional[int] = None  
    annee_circulation: Optional[int] = None
    crit_air: Optional[Literal["Electrique", "1", "2", "3", "4", "5", "Non classé"]] = None
    permis_requis: Optional[bool] = None
    garage_id: int  # ID du garage auquel appartient le véhicule

    class Config:
       from_attributes = True

class VehiculeCreate(BaseModel):
    modele: str
    marque: str
    prix_par_jour: float
    carburant: Literal["Essence", "Diesel", "Electrique", "Hybride", "GPL", "Autre"] = "Essence"
    options: Optional[List[str]] = None
    disponibilite: bool = True
    type_vehicule: Literal["Berline", "SUV", "Citadine", "Sportive", "Cabriolet", "Break"] = "Berline"
    images: Optional[List[str]] = []
    boite_vitesse: Optional[Literal["Manuelle", "Automatique"]] = None
    nb_portes: Optional[int] = None
    nb_places: Optional[int] = None
    kilometrage: Optional[int] = None
    annee_circulation: Optional[int] = None
    crit_air: Optional[Literal["Electrique", "1", "2", "3", "4", "5", "Non classé"]] = None
    permis_requis: Optional[bool] = None
    
    
    

class VehiculeUpdate(BaseModel):
    
    prix_par_jour: Optional[float] = None
    carburant: Optional[Literal["Essence", "Diesel", "Electrique", "Hybride", "GPL", "Autre"]] = None
    options: Optional[List[str]] = None
    disponibilite: Optional[bool] = None
    kilometrage: Optional[int] = None
    

    class Config:
       from_attributes = True

class VehiculeOut(VehiculeBase):
    vehicule_id: int
    garage_id: int
    ville: Optional[str] = None
    images: List[str]
    
    class Config:
       from_attributes = True

# Modèle pour la réservation (à utiliser dans VehiculeClientOut)
class ReservationOut(BaseModel):
    reservation_id: int
    utilisateur_id: int
    vehicule_id: int
    date_debut: date
    date_fin: date
    statut: str  # Ajout du statut pour plus de détails
    garage_id: int

    class Config:
       from_attributes = True
    
class VehiculeClientOut(BaseModel):
    vehicule_id: int
    modele: str
    marque: str
    prix_par_jour: float
    carburant: Literal["Essence", "Diesel", "Electrique", "Hybride", "GPL", "Autre"]
    options: Optional[List[str]] = []
    disponibilite: Optional[bool] = None
    ville: Optional[str] = None
    type_vehicule: Optional[str] = "Non spécifié"
    images: Optional[List[str]] = []
    date_disponibilite: Optional[date] = None
    garage_nom: Optional[str] = None  
    garage_ville: Optional[str] = None
    reservation: Optional[ReservationOut] = None
    boite_vitesse: Optional[Literal["Manuelle", "Automatique"]] = None
    nb_portes: Optional[int] = None
    nb_places: Optional[int] = None
    kilometrage: Optional[int] = None
    annee_circulation: Optional[int] = None
    crit_air: Optional[Literal["Electrique", "1", "2", "3", "4", "5", "Non classé"]] = None
    permis_requis: Optional[bool] = None
    lat: Optional[float] = None       # <-- Ajouter
    lon: Optional[float] = None       # <-- Ajouter
    rayon_km: Optional[float] = None  # Si tu veux garder
    garage_id: Optional[int]
    garage_description: Optional[str] = None  # Description du garage
    

    class Config:
       from_attributes = True
 
 
# Nouveau modèle pour encapsuler la réponse
class VehiculeFicheResponse(BaseModel):
    vehicule: VehiculeClientOut  # Détails du véhicule demandé
    vehicules_du_garage: List[VehiculeClientOut]# Liste des autres véhicules du garage
    
    class Config:
       from_attributes = True       

class VehiculeSearchRequest(BaseModel):
    marque: Optional[str] = None
    modele: Optional[str] = None
    carburant: Optional[str] = None
    ville: Optional[str] = None
    prix_min: Optional[float] = None
    prix_max: Optional[float] = None
    disponibilite: Optional[bool] = None
    images: Optional[List[str]] = []
    lat: Optional[float] = None  # Ajout latitude
    lon: Optional[float] = None  # Ajout longitude     # Nouvelle coordonnée
    rayon_km: Optional[float] = None 
    
    
    class Config:
       from_attributes = True
   
    

