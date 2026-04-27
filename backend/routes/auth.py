import os
from datetime import datetime, timedelta, timezone

import jwt
from fastapi import APIRouter, HTTPException

from models.auth import LoginRequest, TokenResponse

router = APIRouter(prefix="/api/auth")


@router.post("/login", response_model=TokenResponse)
def login(body: LoginRequest):
    if body.password != os.environ.get("APP_PASSWORD", ""):
        raise HTTPException(status_code=401, detail="Invalid password")

    payload = {"exp": datetime.now(timezone.utc) + timedelta(hours=24)}
    token = jwt.encode(payload, os.environ["JWT_SECRET"], algorithm="HS256")
    return TokenResponse(access_token=token)
