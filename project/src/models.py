from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from .database import Base
from pydantic import BaseModel
from datetime import datetime

class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, autoincrement=True)
    owner_id = Column(Integer, nullable=False)
    name = Column(String(50), nullable=False)
    description = Column(String(255), nullable=False)
    status = Column(String(50), nullable=False)
    archive_reason = Column(String(255))
    archived_date = Column(DateTime)
    archiver_id = Column(Integer)

class ProjectMember(Base):
    __tablename__ = "project_members"

    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), primary_key=True)
    user_id = Column(Integer, primary_key=True)
    role = Column(String(50), nullable=False)

# --- Pydantic request models ---

class MemberInput(BaseModel):
    user_id: int
    role: str

class CreateProjectRequest(BaseModel):
    name: str
    description: str
    status: str
    members: list[MemberInput] = []

class UpdateProjectRequest(BaseModel):
    name: str | None = None
    description: str | None = None
    status: str | None = None
    members_add: list[MemberInput] | None = None
    members_remove: list[int] | None = None

class ArchiveProjectRequest(BaseModel):
    archive_reason: str

class ProjectSearchRequest(BaseModel):
    id: int | None = None
    name: str | None = None
    status: str | None = None
    owner_id: int | None = None
