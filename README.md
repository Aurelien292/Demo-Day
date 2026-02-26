# Vehicle Rental Project

## Description
Plateforme web pour connecter les utilisateurs à la recherche de véhicules à louer avec les garages locaux.

## Prérequis
- Python 3.10+
- MySQL
- Virtualenv (`venv`)


## Créer et activer l’environnement virtuel :
```
python3 -m venv venv
source venv/bin/activate   # Linux/Mac
venv\Scripts\activate      # Windows
```

## Installer les dépendances :
```
pip install -r requirements.txt
```

## mise a jour des dépendances :
```
pip freeze > requirements.txt
```

## Mise a jours des table dans Mysql
```
python3 -m app.persistence.init_db
```
## Lancement du serveur
```
uvicorn app.main:app --reload
```
## Documentation API

Accéder à la documentation interactive Swagger UI :
```
http://127.0.0.1:8000/docs
```

## Utilisation de Alembic ( migration auto de DB )
```
alembic revision --autogenerate -m "Ajout champ couleur à Vehicule"
alembic upgrade head
```

## Historique alembic 
```
alembic history
alembic current
```