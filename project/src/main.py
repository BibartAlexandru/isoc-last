from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

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

@app.get("/")
async def root():
    return {"message": "Hello World - project"}
