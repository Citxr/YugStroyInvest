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


class CompanyWithStats(BaseModel):
    id: int
    name: str
    users_count: int
    projects_count: int
    managers_count: int
    engineers_count: int

    class Config:
        from_attributes = True