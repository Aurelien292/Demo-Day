from pydantic import BaseModel, EmailStr, Field, validator, ValidationError
from fastapi import HTTPException, status
import re

class UserBase(BaseModel):
    first_name: str = Field(...)
    username: str = Field(...)
    city: str = Field(...)
    email: EmailStr = Field(..., description="Adresse email de l'utilisateur")
    
    # Validateur générique pour la longueur des champs
    @classmethod
    def validate_length(cls, valeur, field_name: str, min_len: int, max_len: int):
        if len(valeur) < min_len:
            raise HTTPException(
                status_code=400,
                detail=f"{field_name} doit contenir au moins {min_len} caractères."
            )
        if len(valeur) > max_len:
            raise HTTPException(
                status_code=400,
                detail=f"{field_name} ne doit pas dépasser {max_len} caractères."
            )
        return valeur

    @validator('first_name')
    def first_name_length(cls, valeur):
        return cls.validate_length(valeur, 'Le prénom', 3, 50)

    @validator('username')
    def username_length(cls, valeur):
        return cls.validate_length(valeur, 'Le nom d\'utilisateur', 3, 50)

    @validator('city')
    def city_length(cls, valeur):
        return cls.validate_length(valeur, 'La ville', 3, 100)

    @validator('email')
    def email_length(cls, valeur):
        return cls.validate_length(valeur, 'L\'email', 3, 100)
   

class UserCreate(UserBase):
    password: str = Field(...)
    
    @validator('password')
    def password_strength(cls, value):
        # Vérifier la longueur
        if len(value) < 8:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Le mot de passe doit contenir au moins 8 caractères."
            )
        
        # Vérifier la présence de caractères spéciaux
        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', value):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Le mot de passe doit contenir au moins un caractère spécial."
            )
        
        
        return value
    

class UserUpdate(BaseModel):
    city: str | None = None
    password: str | None = None
    
    @validator('password')
    def password_strength(cls, value):
        # Vérifier la longueur
        if len(value) < 8:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Le mot de passe doit contenir au moins 8 caractères."
            )
        
        # Vérifier la présence de caractères spéciaux
        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', value):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Le mot de passe doit contenir au moins un caractère spécial."
            )
        
        
        return value

class UserOut(UserBase):
    first_name: str
    username: str
    city: str
    email: str
    lat: float | None = None
    lon: float | None = None

    class Config:
        from_attributes = True
