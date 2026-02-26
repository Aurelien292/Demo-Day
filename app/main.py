from fastapi import FastAPI
from app.routers import user
from app.routers import auth
from app.routers import garages
from app.routers import Vehicules
from app.routers import reservations
from app.routers import avis
from app.routers import admin
from app.routers import tarification
from app.routers import geocode
from app.persistence import init_db
import os
from dotenv import load_dotenv
from pathlib import Path
env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

print("[DEBUG] Clé API chargée :", os.getenv("GOOGLE_API_KEY"))

from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

app = FastAPI(title="Plateforme de Réservation de Véhicules",
    description="API pour réserver des véhicules dans différents garages, noter les services, et gérer les utilisateurs.",
    version="1.0.0",
    )


app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:5500", "http://localhost:5500"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

init_db.init_db()
init_db.create_lambda_user()

app.include_router(user.router, prefix="/users", tags=["Users"])
app.include_router(auth.router, prefix="/auth", tags=["Auth"])
app.include_router(garages.router, prefix="/garages", tags=["Garages"])
app.include_router(Vehicules.router, prefix="/Vehicules", tags=["Vehicules"])
app.include_router(reservations.router, prefix="/reservations", tags=["Reservations"])
app.include_router(avis.router, prefix="/avis", tags=["Avis"])
app.include_router(admin.router, prefix="/admin", tags=["Admin"])
app.include_router(tarification.router, prefix="/tarification", tags=["Tarification"])
app.mount("/static", StaticFiles(directory="static"), name="static")
app.include_router(geocode.router)