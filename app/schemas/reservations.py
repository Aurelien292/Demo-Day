from pydantic import BaseModel
from datetime import date
from typing import Optional, TYPE_CHECKING
from app.schemas.Vehicules import VehiculeOut
from app.schemas.garages import GarageOut 

if TYPE_CHECKING:
    from app.schemas.garages import GarageOut, GarageClientOut
    from app.schemas.Vehicules import VehiculeClientOut    
    
class ReservationBase(BaseModel):
    vehicule_id: int
    garage_id: Optional[int]
    date_debut: date
    date_fin: date
    
    class Config:
       from_attributes = True

class ReservationCreate(ReservationBase):
    vehicule_id: int
    garage_id: int
    date_debut: date
    date_fin: date
    
    class Config:
       from_attributes = True

class ReservationUpdate(BaseModel):
    date_debut: Optional[date] = None
    date_fin: Optional[date] = None
    
    class Config:
       from_attributes = True
    
    

class ReservationOut(ReservationBase):
    reservation_id: int
    garage: Optional["GarageOut"]
    vehicule: Optional[VehiculeOut]
    
    
    class Config:
       from_attributes = True

class ReservationClientOut(BaseModel):
    reservation_id: int
    vehicule_id: int
    date_debut: date
    date_fin: date
    garage_id: int
    statut: str
    garage: "GarageClientOut"
    vehicule: "VehiculeClientOut"

    class Config:
       from_attributes = True

from app.schemas.garages import GarageClientOut
from app.schemas.Vehicules import VehiculeClientOut
ReservationOut.model_rebuild()
ReservationClientOut.model_rebuild()

class ReservationCalendarOut(ReservationBase):
    reservation_id: int
    date_debut: date
    date_fin: date
    statut: str
    garage_id: int
    vehicule_id: int
    color: str

    class Config:
       from_attributes = True