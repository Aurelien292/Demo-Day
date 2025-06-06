from fastapi import FastAPI
from app.routers import user
from app.routers import auth

from app.persistence import init_db

app = FastAPI()


init_db.init_db()
init_db.create_lambda_user()

app.include_router(user.router, prefix="/users", tags=["Users"])
app.include_router(auth.router, prefix="/auth", tags=["Auth"])

