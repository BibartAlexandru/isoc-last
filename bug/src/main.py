from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from .rabbit import publish_bug_update
from sqlalchemy.orm import Session
from datetime import datetime
from .models import *
from .database import *

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
    s = SessionLocal()
    try:
        yield s
    finally:
        s.close()

def _get_bug_or_404(bug_id: int, session: Session) -> Bug:
    bug = session.query(Bug).filter(Bug.id == bug_id).first()
    if not bug:
        raise HTTPException(status_code=404, detail="Bug not found")
    return bug

@app.get("/api/bug")
def get_bugs(session: Session = Depends(db)):
    return session.query(Bug).all()

@app.get("/api/bug/{bug_id}")
def get_bug(bug_id: int, session: Session = Depends(db)):
    return _get_bug_or_404(bug_id, session)

@app.post("/api/bug")
def create_bug(payload: CreateBugRequest, session: Session = Depends(db)):
    bug = Bug(**payload.model_dump())
    session.add(bug)
    session.flush()

    trail = BugTrail(
        bug_id=bug.id,
        creation_date=datetime.utcnow(),
        description="Bug created"
    )
    session.add(trail)
    session.commit()
    session.refresh(bug)
    return bug

@app.put("/api/bug/{bug_id}")
def update_bug(bug_id: int, payload: UpdateBugRequest, session: Session = Depends(db)):
    bug = _get_bug_or_404(bug_id, session)

    updates = payload.model_dump(exclude_unset=True)
    changes = []
    for key, value in updates.items():
        old = getattr(bug, key)
        if old != value:
            changes.append(f"{key}: {old} → {value}")
        setattr(bug, key, value)

    if changes:
        trail = BugTrail(
            bug_id=bug.id,
            creation_date=datetime.utcnow(),
            description="; ".join(changes)[:255]
        )
        session.add(trail)

    session.commit()

    publish_bug_update(bug.id, f"Bug {bug.id} updated")
    return bug

@app.post("/api/bug/archive/{bug_id}")
def archive_bug(bug_id: int, payload: ArchiveBugRequest, session: Session = Depends(db)):
    bug = _get_bug_or_404(bug_id, session)

    bug.archiver_id = payload.archiver_id
    bug.archive_reason = payload.archive_reason
    bug.archived_date = payload.archived_date

    trail = BugTrail(
        bug_id=bug.id,
        creation_date=datetime.utcnow(),
        description=f"Bug archived: {payload.archive_reason}"
    )
    session.add(trail)
    session.commit()

    publish_bug_update(bug.id, "Bug archived")
    return {"status": "ok"}

@app.post("/api/bug/search")
def search_bug(payload: BugSearchRequest, session: Session = Depends(db)):
    query = session.query(Bug)
    filters = payload.model_dump(exclude_none=True)
    for field, value in filters.items():
        column = getattr(Bug, field)
        if isinstance(value, str):
            query = query.filter(column.ilike(f"%{value}%"))
        else:
            query = query.filter(column == value)
    return query.all()

# --- Trails ---

@app.get("/api/bug/{bug_id}/trails")
def get_trails(bug_id: int, session: Session = Depends(db)):
    _get_bug_or_404(bug_id, session)
    return session.query(BugTrail).filter(BugTrail.bug_id == bug_id).order_by(BugTrail.creation_date).all()

# --- Comments ---

@app.get("/api/bug/{bug_id}/comments")
def get_comments(bug_id: int, session: Session = Depends(db)):
    _get_bug_or_404(bug_id, session)
    return session.query(BugComment).filter(BugComment.bug_id == bug_id).order_by(BugComment.creation_date).all()

@app.post("/api/bug/{bug_id}/comments")
def add_comment(bug_id: int, payload: CreateCommentRequest, session: Session = Depends(db)):
    _get_bug_or_404(bug_id, session)
    comment = BugComment(
        bug_id=bug_id,
        description=payload.description,
        type=payload.type,
        creation_date=datetime.utcnow()
    )
    session.add(comment)
    session.commit()
    session.refresh(comment)
    return comment
