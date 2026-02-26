from pydantic import BaseModel, EmailStr, Field, validator
from fastapi import HTTPException, status
import re
from typing import List , Optional , TYPE_CHECKING
from app.schemas.Vehicules import VehiculeBase  
from datetime import datetime
 
 
if TYPE_CHECKING:
    from app.schemas.reservations import ReservationClientOut 
    
class GarageBase(BaseModel):
    nom: str
    adresse: str
    ville: str
    email: EmailStr
    liste_vehicules: Optional[List[VehiculeBase]] = None  
    liste_reservations: Optional[List["ReservationClientOut"]] = None  
    lat: Optional[float] = None  # Ajout latitude
    lon: Optional[float] = None  # Ajout longitude
    garage_id : int 
    class Config:
       from_attributes = True


class GarageCreate(BaseModel):
    nom: str
    adresse: str
    ville: str
    email: EmailStr
    password: str = Field(...)
    description: Optional[str] = None
    telephone: Optional[str] = None  # Ajout du champ téléphone 
    lat: Optional[float] = None  # Ajout latitude
    lon: Optional[float] = None  # Ajout longitude
    
      
    
    @validator('password')
    def password_strength(cls, value):
        # Vérifier la longueur
        if len(value) < 8:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Le mot de passe doit contenir au moins 8 caractères."
            )
        
        # Vérifier la présence de caractères spéciaux
        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', value):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Le mot de passe doit contenir au moins un caractère spécial."
            )
        
        
        return value
    
    


class GarageClientOut(BaseModel):
    nom: str
    adresse: str
    ville: str
    email: EmailStr
    description: Optional[str] = None  
    telephone: Optional[str]
    date_creation: Optional[datetime] = None
    lat: Optional[float] = None  # Ajout latitude
    lon: Optional[float] = None  # Ajout longitude
    distance: float | None = None  # km
    duration: float | None = None  # min
    garage_id: int
    
    class Config:
       from_attributes = True

class GarageInfosOut(BaseModel):
    garage_id: int
    nom: str
    email: str
    ville: str
    telephone: str
    date_creation: datetime
    nb_vehicules: int
    periode_gratuite: bool
    jours_restants_gratuits: int
    tarif_mensuel: float
    prochaine_facturation: str  # ISO format (aaaa-mm-jj)
    adresse: str                 
    description: str             

    class Config:
       from_attributes = True




class GarageOut(GarageBase):
    garage_id: int
    liste_vehicules: Optional[List[VehiculeBase]] = []  # Liste des véhicules du garage
    liste_reservations: Optional[List["ReservationClientOut"]] = []
    date_creation: Optional[datetime] = None
    lat: Optional[float] = None  # Ajout latitude
    lon: Optional[float] = None  # Ajout longitude
    
    class Config:
       from_attributes = True  # Permet la conversion entre Pydantic et SQLAlchemy
        
class GarageCreateResponse(GarageOut):
    pass
        
        
from app.schemas.reservations import ReservationClientOut
GarageBase.model_rebuild()
GarageOut.model_rebuild()



class GarageUpdate(BaseModel):
    nom: str | None = None
    email: str | None = None
    ville: str | None = None
    telephone: str | None = None
    adresse: str | None = None
    description: str | None = None
    
class GarageInfosUpdateOut(BaseModel):
    garage_id: int
    nom: Optional[str] = None
    email: Optional[str] = None
    ville: Optional[str] = None
    telephone: Optional[str] = None
    adresse: Optional[str] = None
    description: Optional[str] = None
    
    class Config:
       from_attributes = True