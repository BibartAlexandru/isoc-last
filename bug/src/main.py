from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from .rabbit import publish_bug_update
from sqlalchemy.orm import Session
from .models import *
from .database import *

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

@app.get("/")
async def root():
    return {"message": "Hello World - bug"}

@app.get("/api/bug")
def get_bugs(
    session: Session = Depends(db)
):
    return session.query(Bug).all()

@app.get("/api/bug/{bug_id}")
def get_bug(
    bug_id: int,
    session: Session = Depends(db)
):

    bug = (
        session.query(Bug)
        .filter(Bug.id == bug_id)
        .first()
    )

    if not bug:
        raise HTTPException(
            status_code=404,
            detail="Bug not found"
        )

    return bug

@app.post("/api/bug")
def create_bug(
    payload: CreateBugRequest,
    session: Session = Depends(db)
):

    bug = Bug(**payload.model_dump())

    session.add(bug)
    session.commit()
    session.refresh(bug)

    return bug

@app.put("/api/bug/{bug_id}")
def update_bug(
    bug_id: int,
    payload: UpdateBugRequest,
    session: Session = Depends(db)
):

    bug = (
        session.query(Bug)
        .filter(Bug.id == bug_id)
        .first()
    )

    if not bug:
        raise HTTPException(404)

    updates = payload.model_dump(
        exclude_unset=True
    )

    for key, value in updates.items():
        setattr(bug, key, value)

    session.commit()

    publish_bug_update(
        bug.id,
        f"Bug {bug.id} updated"
    )

    return bug

@app.post("/api/bug/archive/{bug_id}")
def archive_bug(
    bug_id: int,
    payload: ArchiveBugRequest,
    session: Session = Depends(db)
):

    bug = (
        session.query(Bug)
        .filter(Bug.id == bug_id)
        .first()
    )

    if not bug:
        raise HTTPException(404)

    bug.archiver_id = payload.archiver_id
    bug.archive_reason = payload.archive_reason
    bug.archived_date = payload.archived_date

    session.commit()

    publish_bug_update(
        bug.id,
        "Bug archived"
    )

    return {"status": "ok"}

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
    return {"message": "Hello World - bug"}

@app.get("/api/bug")
def get_bugs(
    session: Session = Depends(db)
):
    return session.query(Bug).all()

@app.get("/api/bug/{bug_id}")
def get_bug(
    bug_id: int,
    session: Session = Depends(db)
):

    bug = (
        session.query(Bug)
        .filter(Bug.id == bug_id)
        .first()
    )

    if not bug:
        raise HTTPException(
            status_code=404,
            detail="Bug not found"
        )

    return bug

@app.post("/api/bug")
def create_bug(
    payload: CreateBugRequest,
    session: Session = Depends(db)
):

    bug = Bug(**payload.model_dump())

    session.add(bug)
    session.commit()
    session.refresh(bug)

    return bug

@app.put("/api/bug/{bug_id}")
def update_bug(
    bug_id: int,
    payload: UpdateBugRequest,
    session: Session = Depends(db)
):

    bug = (
        session.query(Bug)
        .filter(Bug.id == bug_id)
        .first()
    )

    if not bug:
        raise HTTPException(404)

    updates = payload.model_dump(
        exclude_unset=True
    )

    for key, value in updates.items():
        setattr(bug, key, value)

    session.commit()

    publish_bug_update(
        bug.id,
        f"Bug {bug.id} updated"
    )

    return bug

@app.post("/api/bug/archive/{bug_id}")
def archive_bug(
    bug_id: int,
    payload: ArchiveBugRequest,
    session: Session = Depends(db)
):

    bug = (
        session.query(Bug)
        .filter(Bug.id == bug_id)
        .first()
    )

    if not bug:
        raise HTTPException(404)

    bug.archiver_id = payload.archiver_id
    bug.archive_reason = payload.archive_reason
    bug.archived_date = payload.archived_date

    session.commit()

    publish_bug_update(
        bug.id,
        "Bug archived"
    )

    return {"status": "ok"}

@app.post("/api/bug/search")
def search_bug(
    payload: BugSearchRequest,
    session: Session = Depends(db)
):

    query = session.query(Bug)

    filters = payload.model_dump(
        exclude_none=True
    )

    for field, value in filters.items():

        column = getattr(Bug, field)

        if isinstance(value, str):
            query = query.filter(
                column.ilike(f"%{value}%")
            )
        else:
            query = query.filter(
                column == value
            )

    return query.all()
