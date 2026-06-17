import os
from datetime import datetime
from fastapi import FastAPI, Depends, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from jose import jwt, JWTError

from .database import SessionLocal, engine
from .models import Base, Project, ProjectMember
from .models import (
    CreateProjectRequest,
    UpdateProjectRequest,
    ArchiveProjectRequest,
    ProjectSearchRequest,
)

Base.metadata.create_all(bind=engine)

JWT_SECRET = os.environ.get("JWT_SECRET")

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://localhost:5173",
        "https://127.0.0.1:5173",
        "https://preanaphoral-christena-babblingly.ngrok-free.dev",
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


def current_user(authorization: str = Header(...)):
    try:
        token = authorization.removeprefix("Bearer ")
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        return payload
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")


def _project_dict(project: Project, members: list[ProjectMember]) -> dict:
    return {
        "id": project.id,
        "owner_id": project.owner_id,
        "name": project.name,
        "description": project.description,
        "status": project.status,
        "archive_reason": project.archive_reason,
        "archived_date": project.archived_date,
        "members": [{"user_id": m.user_id, "role": m.role} for m in members],
    }


def _get_project_or_404(project_id: int, session: Session) -> Project:
    project = session.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


@app.get("/api/project")
def get_projects(
    session: Session = Depends(db),
    user: dict = Depends(current_user),
):
    projects = session.query(Project).all()
    result = []
    for p in projects:
        members = session.query(ProjectMember).filter(ProjectMember.project_id == p.id).all()
        result.append(_project_dict(p, members))
    return result


@app.get("/api/project/{project_id}")
def get_project(
    project_id: int,
    session: Session = Depends(db),
    user: dict = Depends(current_user),
):
    project = _get_project_or_404(project_id, session)
    members = session.query(ProjectMember).filter(ProjectMember.project_id == project_id).all()
    return _project_dict(project, members)


@app.post("/api/project")
def create_project(
    payload: CreateProjectRequest,
    session: Session = Depends(db),
    user: dict = Depends(current_user),
):
    owner_id = user["user_id"]

    project = Project(
        owner_id=owner_id,
        name=payload.name,
        description=payload.description,
        status=payload.status,
    )
    session.add(project)
    session.flush()

    # owner always added as Owner
    owner_member = ProjectMember(project_id=project.id, user_id=owner_id, role="Owner")
    session.add(owner_member)

    for m in payload.members:
        if m.user_id == owner_id:
            continue
        session.add(ProjectMember(project_id=project.id, user_id=m.user_id, role=m.role))

    session.commit()
    session.refresh(project)

    members = session.query(ProjectMember).filter(ProjectMember.project_id == project.id).all()
    return _project_dict(project, members)


@app.put("/api/project/{project_id}")
def update_project(
    project_id: int,
    payload: UpdateProjectRequest,
    session: Session = Depends(db),
    user: dict = Depends(current_user),
):
    project = _get_project_or_404(project_id, session)

    if project.owner_id != user["user_id"]:
        raise HTTPException(status_code=403, detail="Only the owner can edit this project")

    if project.archive_reason is not None:
        raise HTTPException(status_code=400, detail="Archived projects cannot be modified")

    if payload.name is not None:
        project.name = payload.name
    if payload.description is not None:
        project.description = payload.description
    if payload.status is not None:
        project.status = payload.status

    if payload.members_add:
        for m in payload.members_add:
            existing = (
                session.query(ProjectMember)
                .filter(
                    ProjectMember.project_id == project_id,
                    ProjectMember.user_id == m.user_id,
                )
                .first()
            )
            if existing:
                existing.role = m.role
            else:
                session.add(ProjectMember(project_id=project_id, user_id=m.user_id, role=m.role))

    if payload.members_remove:
        for uid in payload.members_remove:
            if uid == project.owner_id:
                continue
            session.query(ProjectMember).filter(
                ProjectMember.project_id == project_id,
                ProjectMember.user_id == uid,
            ).delete()

    session.commit()

    members = session.query(ProjectMember).filter(ProjectMember.project_id == project_id).all()
    return _project_dict(project, members)


@app.post("/api/project/archive/{project_id}")
def archive_project(
    project_id: int,
    payload: ArchiveProjectRequest,
    session: Session = Depends(db),
    user: dict = Depends(current_user),
):
    project = _get_project_or_404(project_id, session)

    if project.owner_id != user["user_id"]:
        raise HTTPException(status_code=403, detail="Only the owner can archive this project")

    if project.archive_reason is not None:
        raise HTTPException(status_code=400, detail="Project is already archived")

    project.archive_reason = payload.archive_reason
    project.archived_date = datetime.utcnow()
    project.archiver_id = user["user_id"]
    project.status = "arhivat"

    session.commit()

    members = session.query(ProjectMember).filter(ProjectMember.project_id == project_id).all()
    return _project_dict(project, members)


@app.post("/api/project/search")
def search_projects(
    payload: ProjectSearchRequest,
    session: Session = Depends(db),
    user: dict = Depends(current_user),
):
    query = session.query(Project)

    if payload.id is not None:
        query = query.filter(Project.id == payload.id)
    if payload.name is not None:
        query = query.filter(Project.name.ilike(f"%{payload.name}%"))
    if payload.status is not None:
        query = query.filter(Project.status == payload.status)
    if payload.owner_id is not None:
        query = query.filter(Project.owner_id == payload.owner_id)

    projects = query.all()
    result = []
    for p in projects:
        members = session.query(ProjectMember).filter(ProjectMember.project_id == p.id).all()
        result.append(_project_dict(p, members))
    return result
