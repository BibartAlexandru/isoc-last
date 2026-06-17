from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from .database import Base
from pydantic import BaseModel
from datetime import datetime

class Bug(Base):
    __tablename__ = "bugs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(150), nullable=False)
    feature = Column(String(50), nullable=False)
    submitter_id = Column(Integer, nullable=False)
    assignee_id = Column(Integer, nullable=True)
    creation_date = Column(DateTime, nullable=False)
    estimated_fixed_date = Column(DateTime, nullable=False)
    status = Column(String(50), nullable=False)
    severity = Column(Integer, nullable=False, default=1)
    project_id = Column(Integer, nullable=False)

    archive_reason = Column(String(255))
    archived_date = Column(DateTime)
    archiver_id = Column(Integer)

class BugTrail(Base):
    __tablename__ = "bug_trails"

    id = Column(Integer, primary_key=True, autoincrement=True)
    bug_id = Column(Integer, ForeignKey("bugs.id", ondelete="CASCADE"))
    creation_date = Column(DateTime, nullable=False)
    description = Column(String(255), nullable=False)

class BugComment(Base):
    __tablename__ = "bug_comments"

    id = Column(Integer, primary_key=True, autoincrement=True)
    description = Column(String(255), nullable=False)
    type = Column(String(50), nullable=False)
    bug_id = Column(Integer, ForeignKey("bugs.id", ondelete="CASCADE"))
    creation_date = Column(DateTime, nullable=False)

# --- Pydantic models ---

class CreateBugRequest(BaseModel):
    name: str
    feature: str
    submitter_id: int
    assignee_id: int | None = None
    creation_date: datetime
    estimated_fixed_date: datetime
    status: str
    severity: int = 1
    project_id: int

class UpdateBugRequest(BaseModel):
    name: str | None = None
    feature: str | None = None
    assignee_id: int | None = None
    status: str | None = None
    severity: int | None = None
    estimated_fixed_date: datetime | None = None

    archive_reason: str | None = None
    archived_date: datetime | None = None
    archiver_id: int | None = None

class ArchiveBugRequest(BaseModel):
    archiver_id: int
    archive_reason: str
    archived_date: datetime

class BugSearchRequest(BaseModel):
    id: int | None = None
    name: str | None = None
    feature: str | None = None
    status: str | None = None
    assignee_id: int | None = None
    submitter_id: int | None = None
    project_id: int | None = None
    severity: int | None = None

class CreateCommentRequest(BaseModel):
    description: str
    type: str = "comment"
