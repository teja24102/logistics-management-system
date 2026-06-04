from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from jose import JWTError, jwt
from passlib.context import CryptContext
import os

from database.init_db import get_db
from models.schemas import User, RegisterRequest, TokenResponse, UserResponse

router        = APIRouter()
pwd_context   = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")
SECRET_KEY    = os.getenv("SECRET_KEY", "lms-secret-2024-xyz")
ALGORITHM     = "HS256"


def hash_password(p):      return pwd_context.hash(p)
def verify_password(p, h): return pwd_context.verify(p, h)

def create_token(data: dict):
    d = data.copy()
    d["exp"] = datetime.utcnow() + timedelta(hours=24)
    return jwt.encode(d, SECRET_KEY, algorithm=ALGORITHM)

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        uid = payload.get("sub")
        if not uid: raise HTTPException(401, "Invalid token")
    except JWTError:
        raise HTTPException(401, "Invalid token")
    user = db.get(User, int(uid))
    if not user: raise HTTPException(401, "User not found")
    return user


@router.post("/register", response_model=TokenResponse, status_code=201)
def register(p: RegisterRequest, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == p.email).first():
        raise HTTPException(400, "Email already registered")
    user = User(name=p.name, email=p.email,
                hashed_password=hash_password(p.password), role=p.role)
    db.add(user); db.commit(); db.refresh(user)
    token = create_token({"sub": str(user.id), "role": user.role})
    return TokenResponse(access_token=token, role=user.role, name=user.name, user_id=user.id)


@router.post("/login", response_model=TokenResponse)
def login(form: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == form.username).first()
    if not user or not verify_password(form.password, user.hashed_password):
        raise HTTPException(401, "Incorrect email or password")
    token = create_token({"sub": str(user.id), "role": user.role})
    return TokenResponse(access_token=token, role=user.role, name=user.name, user_id=user.id)


@router.get("/me", response_model=UserResponse)
def me(u: User = Depends(get_current_user)):
    return u
