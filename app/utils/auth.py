from passlib.context import CryptContext

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from app.utils.jwt_handler import SECRET_KEY, ALGORITHM


# Configuration pour le hachage des mots de passe
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


# Configuration pour JWT

security = HTTPBearer()


def get_current_admin_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        
        # Vérifier que l'utilisateur a bien un attribut 'is_admin' dans le payload
        if "is_admin" not in payload or not payload["is_admin"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Accès réservé aux administrateurs"
            )
        return payload
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token invalide")
    
    
def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    try:
        # Décoder le token JWT pour extraire le payload
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])

        # Vérifier que l'utilisateur a bien un attribut 'id' dans le payload
        if "id" not in payload:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token invalide, 'id' manquant dans le payload"
            )

        return payload  # Retourner le payload pour être utilisé par la suite
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token invalide ou corrompu",
            headers={"WWW-Authenticate": "Bearer"},
        )

