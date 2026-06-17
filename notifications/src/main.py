from fastapi import FastAPI, WebSocket, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from .database import SessionLocal, engine
from .models import (
    Base,
    NotificationConfig
)



Base.metadata.create_all(
    bind=engine
)


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

    s = SessionLocal()

    try:
        yield s

    finally:
        s.close()



connections = []



@app.websocket("/api/notifications")
async def notifications(
    ws: WebSocket
):

    await ws.accept()

    connections.append(ws)


    try:

        while True:

            await ws.receive_text()


    finally:

        connections.remove(ws)



@app.get(
    "/api/notifications/configuration"
)
def get_configuration(
    user_id:int,
    session:Session=Depends(db)
):

    config = session.query(
        NotificationConfig
    ).filter(
        NotificationConfig.user_id == user_id
    ).first()


    if not config:

        return {
            "user_id": user_id,
            "min_severity": 0
        }


    return config



@app.post(
    "/api/notifications/configuration"
)
def save_configuration(
    payload:dict,
    session:Session=Depends(db)
):

    config = NotificationConfig(
        user_id=payload["user_id"],
        min_severity=payload["min_severity"]
    )


    session.merge(config)

    session.commit()


    return {
        "status":"saved"
    }
