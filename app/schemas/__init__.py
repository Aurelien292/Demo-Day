from app.schemas.garages import GarageBase, GarageCreate, GarageOut, GarageCreateResponse, GarageClientOut
from app.schemas.reservations import ReservationBase, ReservationCreate, ReservationUpdate, ReservationOut, ReservationClientOut
from app.schemas.Vehicules import VehiculeBase, VehiculeCreate, VehiculeOut, VehiculeClientOut, VehiculeSearchRequest
from app.schemas.user_schema import UserBase, UserCreate, UserOut, UserUpdate
from app.schemas.avis import AvisBase, AvisCreate, AvisOut

# Ici on appelle model_rebuild après avoir tout importé
GarageBase.model_rebuild()
GarageOut.model_rebuild()
GarageClientOut.model_rebuild()
ReservationOut.model_rebuild()
ReservationClientOut.model_rebuild()
UserBase.model_rebuild()
UserCreate.model_rebuild()
UserUpdate.model_rebuild()
UserOut.model_rebuild()

__all__ = [
    "UserBase", "UserCreate", "UserUpdate", "UserOut",
    "GarageBase", "GarageCreate", "GarageOut", "GarageCreateResponse", "GarageClientOut",
    "ReservationBase", "ReservationCreate", "ReservationUpdate", "ReservationOut","ReservationClientOut",
    "VehiculeBase", "VehiculeCreate", "VehiculeOut", "VehiculeClientOut", "VehiculeSearchRequest",
    "AvisBase", "AvisCreate", "AvisOut",
]
