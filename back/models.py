from sqlalchemy import Column, String, Enum, Integer, ForeignKey, Table
import enum
from sqlalchemy.orm import relationship
from back.database import Base

projects_engineers = Table(
    'projects_engineers',
    Base.metadata,
    Column('project_id', Integer, ForeignKey("projects.id", ondelete='CASCADE')),
    Column('user_engineer_id', Integer, ForeignKey("users.id", ondelete='CASCADE')),
)

class UserRole(str, enum.Enum):
    ENGINEER = "engineer"
    MANAGER = "manager"
    CLIENT = "client"
    ADMIN = "admin"

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    role = Column(Enum(UserRole))

    # Убрать engineers_projects и использовать только projects
    projects = relationship("Project", secondary=projects_engineers, back_populates="engineers")
    projects_as_manager = relationship("Project", back_populates="manager", foreign_keys="Project.user_manager_id")
    company_as_admin = relationship("Company", back_populates="admin", foreign_keys="Company.user_admin_id")
    company_as_engineer = relationship("Company", back_populates="engineer", foreign_keys="Company.user_engineer_id")
    company_as_client = relationship("Company", back_populates="client", foreign_keys="Company.user_client_id")
    company_as_manager = relationship("Company", back_populates="manager", foreign_keys="Company.user_manager_id")
    defect_as_engineer = relationship("Defect", back_populates="engineer", foreign_keys="Defect.user_engineer_id")

class Company(Base):
    __tablename__ = "companies"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    user_engineer_id = Column(Integer, ForeignKey("users.id"))
    user_admin_id = Column(Integer, ForeignKey("users.id"))
    user_client_id = Column(Integer, ForeignKey("users.id"))
    user_manager_id = Column(Integer, ForeignKey("users.id"))

    engineer = relationship("User", back_populates="company_as_engineer", foreign_keys=[user_engineer_id])
    admin = relationship("User", back_populates="company_as_admin", foreign_keys=[user_admin_id])
    client = relationship("User", back_populates="company_as_client", foreign_keys=[user_client_id])
    manager = relationship("User", back_populates="company_as_manager", foreign_keys=[user_manager_id])
    projects = relationship("Project", back_populates="company", cascade="all, delete-orphan")

class Project(Base):
    __tablename__ = "projects"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    user_manager_id = Column(Integer, ForeignKey("users.id"))
    company_id = Column(Integer, ForeignKey("companies.id", ondelete='CASCADE'))

    engineers = relationship("User", secondary=projects_engineers, back_populates="projects")
    manager = relationship("User", back_populates="projects_as_manager", foreign_keys=[user_manager_id])
    company = relationship("Company", back_populates="projects")
    defects = relationship("Defect", back_populates="project", cascade="all, delete-orphan")

class Defect(Base):
    __tablename__ = "defects"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    user_engineer_id = Column(Integer, ForeignKey("users.id"))
    project_id = Column(Integer, ForeignKey("projects.id", ondelete='CASCADE'))

    engineer = relationship("User", back_populates="defect_as_engineer", foreign_keys=[user_engineer_id])
    project = relationship("Project", back_populates="defects")