from sqlalchemy import Column, Integer, String, Boolean, Float
from app.persistence.database import Base
from sqlalchemy.orm import relationship




class User(Base):
    __tablename__ = 'users'

    id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String(50), nullable=False)
    username = Column(String(50), unique=True, nullable=False)
    city = Column(String(100), nullable=True)
    email = Column(String(100), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    is_admin = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    lat = Column(Float, nullable=True)
    lon = Column(Float, nullable=True)
    
    avis = relationship("Avis", back_populates="utilisateur")
    reservations = relationship("Reservation", back_populates="utilisateur")
