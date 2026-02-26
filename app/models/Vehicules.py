from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.persistence.database import Base




class Vehicule(Base):
    __tablename__ = 'vehicules'

    vehicule_id = Column(Integer, primary_key=True, index=True)
    modele = Column(String(100), index=True)
    marque = Column(String(100), index=True)
    prix_par_jour = Column((Float), index=True)
    carburant = Column(String(50), index=True)
    options = Column(JSON)  
    disponibilite = Column(Boolean, default=True)
    garage_id = Column(Integer, ForeignKey("garages.garage_id"))
    type_vehicule = Column(String(50), nullable=False, index=True)
    images = Column(JSON, default=[])
    boite_vitesse = Column(String(20), nullable=True)        
    nb_portes = Column(Integer, nullable=True)
    nb_places = Column(Integer, nullable=True)
    kilometrage = Column(Integer, nullable=True)            
    annee_circulation = Column(Integer, nullable=True)
    crit_air = Column(String(10), nullable=True)              
    permis_requis = Column(String(10), nullable=True)
    
    

    garage = relationship("Garage", back_populates="vehicules")
    reservations = relationship("Reservation", back_populates="vehicule")
    avis = relationship("Avis", back_populates="vehicule")
