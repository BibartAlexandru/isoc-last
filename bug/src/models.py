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
    assignee_id = Column(Integer, nullable=False)
    creation_date = Column(DateTime, nullable=False)
    estimated_fixed_date = Column(DateTime, nullable=False)
    status = Column(String(50), nullable=False)
    project_id = Column(Integer, nullable=False)

    archive_reason = Column(String(255))
    archived_date = Column(DateTime)
    archiver_id = Column(Integer)

class BugTrail(Base):
    __tablename__ = "bug_trails"

    id = Column(Integer, primary_key=True, autoincrement=True)
    bug_id = Column(Integer, ForeignKey("bugs.id"))
    creation_date = Column(DateTime, nullable=False)
    description = Column(String(255), nullable=False)

class BugComment(Base):
    __tablename__ = "bug_comments"

    id = Column(Integer, primary_key=True, autoincrement=True)
    description = Column(String(255), nullable=False)
    type = Column(String(50), nullable=False)
    bug_id = Column(Integer, ForeignKey("bugs.id"))
    creation_date = Column(DateTime, nullable=False)

class CreateBugRequest(BaseModel):
    name: str
    feature: str
    submitter_id: int
    assignee_id: int | None
    creation_date: datetime
    estimated_fixed_date: datetime
    status: str
    project_id: int

class UpdateBugRequest(BaseModel):

    name: str | None = None
    feature: str | None = None
    assignee_id: int | None = None
    status: str | None = None

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
