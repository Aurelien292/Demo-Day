from pydantic import BaseModel, EmailStr

class AdminBase(BaseModel):
    admin_email: EmailStr

class AdminOut(AdminBase):
    admin_id: int
    admin_name: str

    class Config:
        orm_mode = True
