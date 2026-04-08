from sqlalchemy import Column, String
from database import Base

class AppSettings(Base):
    __tablename__ = 'app_settings'

    key = Column(String, primary_key=True)
    value = Column(String)
