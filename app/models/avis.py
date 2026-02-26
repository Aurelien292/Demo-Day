from sqlalchemy import Column, Integer, String, Date, ForeignKey , Text
from sqlalchemy.orm import relationship
from datetime import date
from app.persistence.database import Base

class Avis(Base):
    __tablename__ = 'avis'

    avis_id = Column(Integer, primary_key=True, index=True)
    utilisateur_id = Column(Integer, ForeignKey("users.id"))
    garage_id = Column(Integer, ForeignKey("garages.garage_id"))
    vehicule_id = Column(Integer, ForeignKey("vehicules.vehicule_id"))
    note = Column(Integer, nullable=False)
    commentaire = Column(Text, nullable=True)
    date_avis = Column(Date, default=date.today)

    utilisateur = relationship("User", back_populates="avis")
    garage = relationship("Garage", back_populates="avis")
    vehicule = relationship("Vehicule", back_populates="avis")
