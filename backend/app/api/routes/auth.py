from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(prefix="/auth", tags=["auth"])

class SignupRequest(BaseModel):
    email: str
    password: str
    full_name: str
    invite_code: str | None = None

class LoginRequest(BaseModel):
    email: str
    password: str

@router.post("/signup")
def signup(req: SignupRequest):
    user_id = f"user_{abs(hash(req.email)) % 10**12}"
    return {
        "user": {
            "user_id": user_id,
            "email": req.email,
            "full_name": req.full_name
        },
        "access_token": f"token_{user_id}"
    }

@router.post("/login")
def login(req: LoginRequest):
    user_id = f"user_{abs(hash(req.email)) % 10**12}"
    return {
        "user": {
            "user_id": user_id,
            "email": req.email
        },
        "access_token": f"token_{user_id}"
    }
