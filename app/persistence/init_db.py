from sqlalchemy import create_engine
from sqlalchemy.orm import Session
from app.persistence.database import Base, SessionLocal, SQLALCHEMY_DATABASE_URL
from app.models import User, Garage, Vehicule, Reservation
from app.utils.auth import hash_password

def init_db():
    # Crée l'engine (même config que dans database.py)
    engine = create_engine(SQLALCHEMY_DATABASE_URL)
    # Crée toutes les tables (si elles n'existent pas)
    Base.metadata.create_all(bind=engine)

def create_lambda_user():
    db: Session = SessionLocal()
    lambda_user = db.query(User).filter(User.username == "Visitor").first()

    if not lambda_user:
        user = User(
            first_name="Visiteur",
            username="Visitor",
            city="N/A",
            email="lambda@example.com",
            hashed_password=hash_password("Visitor123")
        )
        db.add(user)
        db.commit()
        print(" Utilisateur 'Visitor' créé.")
    else:
        print("Visitor existe déjà.")
    
    db.close()

if __name__ == "__main__":
    init_db()             # Crée les tables
    create_lambda_user()  # Crée l'utilisateur s'il n'existe pas
