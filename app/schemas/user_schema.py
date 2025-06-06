from pydantic import BaseModel, EmailStr, Field

class UserBase(BaseModel):
    first_name: str = Field(..., max_length=50)
    username: str = Field(..., max_length=50)
    city: str | None = None
    email: EmailStr
   

class UserCreate(UserBase):
    password: str = Field(..., min_length=8)

class UserUpdate(BaseModel):
    first_name: str | None = None
    username: str | None = None
    city: str | None = None
    email: EmailStr | None = None
    password: str | None = None

class UserOut(UserBase):
    id: int

    class Config:
        from_attributes = True
