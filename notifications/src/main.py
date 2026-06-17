import asyncio
from fastapi import FastAPI, WebSocket, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from .database import SessionLocal, engine
from .models import (
    Base,
    NotificationConfig
)
from .rabbit import consume

from .websocket import (
    connect,
    disconnect,
    broadcast
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

notification_queue = asyncio.Queue()

def db():
    s = SessionLocal()
    try:
        yield s
    finally:
        s.close()


connections = []

@app.on_event("startup")
async def startup_event():


    asyncio.create_task(
        rabbit_worker()
    )



async def rabbit_worker():
    loop = asyncio.get_running_loop()
    def run_consumer():

        import pika
        import json


        connection = pika.BlockingConnection(
            pika.ConnectionParameters(
                host="rabbitmq"
            )
        )


        channel = connection.channel()


        channel.queue_declare(
            queue="bug_updates"
        )


        def callback(
            ch,
            method,
            properties,
            body
        ):

            event=json.loads(body)


            asyncio.run_coroutine_threadsafe(
                notification_queue.put(event),
                loop
            )


        channel.basic_consume(
            queue="bug_updates",
            on_message_callback=callback,
            auto_ack=True
        )


        channel.start_consuming()



    await asyncio.to_thread(
        run_consumer
    )



async def notification_sender():
    while True:
        event = await notification_queue.get()
        await broadcast(
            event
        )


@app.on_event("startup")
async def websocket_worker():
    asyncio.create_task(
        notification_sender()
    )


@app.websocket("/api/notifications")
async def notifications(
    websocket: WebSocket
):
    await connect(
        websocket
    )
    try:
        while True:
            await websocket.receive_text()
    finally:
        await disconnect(
            websocket
        )

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
