from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.persistence.database import Base


class Reservation(Base):
    __tablename__ = "reservations"

    reservation_id = Column(Integer, primary_key=True, index=True)
    utilisateur_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    vehicule_id = Column(Integer, ForeignKey("vehicules.vehicule_id"), nullable=False)
    garage_id = Column(Integer, ForeignKey("garages.garage_id"), nullable=True)
    date_debut = Column(DateTime, nullable=False)
    date_fin = Column(DateTime, nullable=False)
    statut = Column(String(50), default="en attente") 

    vehicule = relationship("Vehicule", back_populates="reservations")
    garage = relationship("Garage", back_populates="liste_reservations")
    utilisateur = relationship("User", back_populates="reservations")
    
    def confirmer_reservation(self):
        self.statut = "confirmée"

    def annuler_reservation(self):
        self.statut = "annulée"
