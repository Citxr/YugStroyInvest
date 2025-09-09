from sqlalchemy import Column,String,Enum,Integer
import enum
from back.database import Base


class UserRole(str, enum.Enum):
    ENGINEER = "engineer"
    MANAGER = "manager"
    CLIENT = "client"

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    role = Column(Enum(UserRole))

