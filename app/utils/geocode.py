import os
import requests
from dotenv import load_dotenv
load_dotenv()
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")

def geocode_adresse_google(adresse: str):
    print("[DEBUG] GOOGLE_API_KEY dans geocode :", os.getenv("GOOGLE_API_KEY"))
    if not GOOGLE_API_KEY:
        raise ValueError("Clé API Google manquante. Assurez-vous que GOOGLE_API_KEY est définie dans .env")

    url = "https://maps.googleapis.com/maps/api/geocode/json"
    params = {
        "address": adresse,
        "key": GOOGLE_API_KEY,
    }

    response = requests.get(url, params=params)
    data = response.json()

    if data["status"] == "OK":
        location = data["results"][0]["geometry"]["location"]
        return location["lat"], location["lng"]
    else:
        print(f"[!] Erreur géocodage : {data['status']}")
        return None, None
