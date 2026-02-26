from fastapi import APIRouter, Query, HTTPException
from app.utils.geocode import geocode_adresse_google

router = APIRouter()

@router.get("/api/geocode")
def api_geocode(adresse: str = Query(..., description="Adresse à géocoder")):
    lat, lon = geocode_adresse_google(adresse)
    if lat is None or lon is None:
        raise HTTPException(status_code=404, detail="Adresse introuvable")
    return {"lat": lat, "lon": lon}
