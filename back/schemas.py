from typing import Optional, List
from pydantic import BaseModel, EmailStr
from back.models import UserRole

class UserBase(BaseModel):
    username: str
    email: EmailStr
    role: UserRole
    company_id: Optional[int] = None

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int

    class Config:
        from_attributes = True

class UserInDB(User):
    hashed_password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: str | None = None

class CompanyBase(BaseModel):
    name: str

class ProjectBase(BaseModel):
    name: str

class DefectBase(BaseModel):
    name: str

class CompanyCreate(CompanyBase):

    class Config:
        from_attributes = True

class ProjectCreate(ProjectBase):
    company_id: Optional[int] = None
    engineer_ids: Optional[List[int]] = None

    class Config:
        from_attributes = True

class DefectCreate(DefectBase):
    project_id: Optional[int] = None

    class Config:
        from_attributes = True

class AddUserToCompany(BaseModel):
    user_id: int

class UserToCompanyResponse(BaseModel):
    message: str
    user_id: int
    company_id: int
    user_role: str

    class Config:
        from_attributes = True


class DefectOut(BaseModel):
    id: int
    name: str
    project_id: int
    engineer_id: Optional[int]

    class Config:
        orm_mode = True


class EngineerOut(BaseModel):
    id: int
    username: str
    email: str
    defects: List[DefectOut] = []

    class Config:
        orm_mode = True


class ManagerOut(BaseModel):
    id: int
    username: str
    email: str
    projects: List[str] = []  # только имена проектов

    class Config:
        orm_mode = True


class ProjectOut(BaseModel):
    id: int
    name: str
    manager_id: int
    engineers: List[EngineerOut] = []
    defects: List[DefectOut] = []

    class Config:
        orm_mode = True


class CompanyFullOut(BaseModel):
    id: int
    name: str
    projects: List[ProjectOut] = []
    managers: List[ManagerOut] = []
    engineers: List[EngineerOut] = []

    class Config:
        orm_mode = True