from pydantic import BaseModel

class TarificationOut(BaseModel):
    nombre_vehicules: int
    tarif_mensuel: int
    gratuit_jusquau: str
    