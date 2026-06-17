from fastapi import WebSocket


clients = []


async def connect(
    websocket: WebSocket
):
    await websocket.accept()
    clients.append(websocket)

async def disconnect(
    websocket: WebSocket
):
    if websocket in clients:
        clients.remove(websocket)



async def broadcast(
    message: dict
):
    dead = []
    for client in clients:
        try:
            await client.send_json(
                message
            )
        except Exception:
            dead.append(client)

    for client in dead:
        clients.remove(client)
