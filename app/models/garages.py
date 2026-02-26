from sqlalchemy import Column, Integer, String, ForeignKey, Boolean, Text , DateTime, Float
from sqlalchemy.orm import relationship
from app.persistence.database import Base
from datetime import datetime

class Garage(Base):
    __tablename__ = 'garages'

    garage_id = Column(Integer, primary_key=True, index=True)
    nom = Column(String(100), nullable=False)
    adresse = Column(String(200), nullable=False)
    ville = Column(String(150), nullable=False) 
    email = Column(String(200), unique=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)
    description = Column(Text, nullable=True)
    telephone = Column(String(20), nullable=True)
    date_creation = Column(DateTime, default=datetime.utcnow)
    lat = Column(Float, nullable=True)
    lon = Column(Float, nullable=True)

    vehicules = relationship("Vehicule", back_populates="garage")
    liste_reservations = relationship("Reservation", back_populates="garage")
    liste_Vehicules = relationship("Vehicule", back_populates="garage")
    avis = relationship("Avis", back_populates="garage")
