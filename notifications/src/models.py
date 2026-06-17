from sqlalchemy import Column,Integer,String
from .database import Base



class NotificationConfig(Base):
    __tablename__ = "notification_conf"
    user_id = Column(
        Integer,
        primary_key=True
    )

    min_severity = Column(
        Integer,
        nullable=False
    )

class BugNotification(Base):
    __tablename__ = "notification"
    id = Column(
        Integer,
        primary_key=True
    )


    bug_id = Column(
        Integer
    )

    description = Column(
        String(255)
    )
