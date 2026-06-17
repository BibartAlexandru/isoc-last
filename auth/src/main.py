import os
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from sqlalchemy.orm import Session

from .database import SessionLocal, engine
from .models import Base, User
from .google import verify_google_token
from .auth import create_token

Base.metadata.create_all(bind=engine)
app = FastAPI()

app.add_middleware(
    CORSMiddleware,

    allow_origins=[
        "https://localhost:5173",
        "https://127.0.0.1:5173",
        "https://preanaphoral-christena-babblingly.ngrok-free.dev"
    ],

    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def db():
    session = SessionLocal()
    try:
        yield session

    finally:
        session.close()


@app.post("/api/login/google")
def google_login(
    payload: dict,
    session: Session = Depends(db)
):

    google_user = verify_google_token(
        payload["oauth_token"]
    )

    if not google_user:
        raise HTTPException(
            status_code=403,
            detail="Invalid token"
        )

    user = session.query(User)\
        .filter(
            User.email == google_user["email"]
        )\
        .first()

    if not user:
        user = User(
            name=google_user["name"],
            email=google_user["email"]
        )
        session.add(user)
        session.commit()
        session.refresh(user)

    return {
        "auth_token":
            create_token(user.id, user.email, user.name)
    }
