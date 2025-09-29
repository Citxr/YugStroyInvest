from sqlalchemy import Column, String, Enum, Integer, ForeignKey, Table
from sqlalchemy.orm import relationship
import enum

from back.database import Base


projects_engineers = Table(
    "projects_engineers",
    Base.metadata,
    Column("project_id", Integer, ForeignKey("projects.id", ondelete="CASCADE"), primary_key=True),
    Column("user_engineer_id", Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
)

class UserRole(str, enum.Enum):
    ENGINEER = "engineer"
    MANAGER = "manager"
    CLIENT = "client"
    ADMIN = "admin"


class Company(Base):
    __tablename__ = "companies"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)

    users = relationship("User", back_populates="company")
    projects = relationship("Project", back_populates="company", cascade="all, delete-orphan")


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    role = Column(Enum(UserRole))
    company_id = Column(Integer, ForeignKey("companies.id"))

    company = relationship("Company", back_populates="users")

    engineer_projects = relationship(
        "Project",
        secondary=projects_engineers,
        back_populates="engineers",
    )

    managed_projects = relationship(
        "Project",
        back_populates="manager",
        foreign_keys="Project.user_manager_id",
    )

    defect_as_engineer = relationship(
        "Defect",
        back_populates="engineer",
        foreign_keys="Defect.user_engineer_id",
    )


class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    user_manager_id = Column(Integer, ForeignKey("users.id"))
    company_id = Column(Integer, ForeignKey("companies.id", ondelete="CASCADE"))

    manager = relationship(
        "User",
        back_populates="managed_projects",
        foreign_keys=[user_manager_id],
    )

    engineers = relationship(
        "User",
        secondary=projects_engineers,
        back_populates="engineer_projects",
    )

    company = relationship(
        "Company",
        back_populates="projects",
        foreign_keys=[company_id],
    )

    defects = relationship(
        "Defect",
        back_populates="project",
        cascade="all, delete-orphan",
    )


class Defect(Base):
    __tablename__ = "defects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    user_engineer_id = Column(Integer, ForeignKey("users.id"))
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"))

    engineer = relationship(
        "User",
        back_populates="defect_as_engineer",
        foreign_keys=[user_engineer_id],
    )
    project = relationship(
        "Project",
        back_populates="defects",
        foreign_keys=[project_id],
    )
