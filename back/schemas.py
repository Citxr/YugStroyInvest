from typing import Optional, List

from pydantic import BaseModel, EmailStr
from back.models import UserRole



class UserBase(BaseModel):
    username: str
    email: EmailStr
    role: UserRole

class UserCreate(UserBase):
    password: str


class User(UserBase):
    id: int

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
    user_engineer_id: Optional[int] = None
    user_client_id: Optional[int] = None

    class Config:
        from_attributes = True

class ProjectCreate(ProjectBase):
    user_manager_id: Optional[int] = None
    company_id: Optional[int] = None
    engineer_ids: Optional[List[int]] = None

    class Config:
        from_attributes = True

class DefectCreate(DefectBase):
    user_engineer_id: Optional[int] = None
    project_id: Optional[int] = None

    class Config:
        from_attributes = True