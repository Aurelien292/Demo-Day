from pydantic import BaseModel, Field
from datetime import date
from typing import Optional

class AvisBase(BaseModel):
    garage_id: Optional[int] = Field(None, description="ID du garage concerné")
    vehicule_id: Optional[int] = Field(None, description="ID du véhicule concerné")
    note: int = Field(..., ge=1, le=5, description="Note de l'avis (1 à 5)")
    commentaire: str = Field(..., max_length=1000, description="Commentaire laissé par l'utilisateur")
    date_avis: date = Field(..., description="Date à laquelle l'avis a été laissé")
    
    class Config:
        orm_mode = True

class AvisCreate(AvisBase):
    pass  

class Config:
        orm_mode = True


class AvisOut(AvisBase):
    avis_id: int
    utilisateur_id: int
    garage_id: Optional[int] = None
    vehicule_id: Optional[int] = None
    
    class Config:
        orm_mode = True
