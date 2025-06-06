from sqlalchemy import Column, Integer, String, Boolean
from app.persistence.database import Base




class User(Base):
    __tablename__ = 'users'

    id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String(50), nullable=False)
    username = Column(String(50), unique=True, nullable=False)
    city = Column(String(100), nullable=True)
    email = Column(String(100), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    is_admin = Column(Boolean, default=False)
