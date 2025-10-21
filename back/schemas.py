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
    projects: List[str] = []

    class Config:
        orm_mode = True


class ProjectOut(BaseModel):
    id: int
    name: str
    manager_id: Optional[int] = None
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


class CompanyListItemOut(BaseModel):
    id: int
    name: str
    projects_count: int
    users_count: int

class RemoveUserFromCompanyResponse(BaseModel):
    message: str
    user_id: int
    company_id: int
    user_role: str

class ProjectChangeManager(BaseModel):
    new_manager_id: int

class ProjectChangeManagerResponse(BaseModel):
    message: str
    project_id: int
    project_name: str
    previous_manager_id: int
    new_manager_id: int

class RemoveDefectResponse(BaseModel):
    message: str
    defect_id: int
    defect_name: str
    engineer_id: int

class RemoveProjectFromManagerResponse(BaseModel):
    message: str
    project_id: int
    project_name: str
    previous_manager_id: int

class AssignProjectToManager(BaseModel):
    manager_id: int

class AssignProjectToManagerResponse(BaseModel):
    message: str
    project_id: int
    project_name: str
    manager_id: int

class AssignEngineerToDefect(BaseModel):
    engineer_id: int

class AssignEngineerToDefectResponse(BaseModel):
    message: str
    defect_id: int
    defect_name: str
    engineer_id: int

class AddEngineersToProject(BaseModel):
    engineer_ids: List[int]

class AddEngineersToProjectResponse(BaseModel):
    message: str
    project_id: int
    project_name: str
    added_engineers_count: int
    engineer_ids: List[int]

class RemoveEngineersFromProject(BaseModel):
    engineer_ids: List[int]

class ProjectEngineersResponse(BaseModel):
    project_id: int
    project_name: str
    removed_engineers: List[UserBase]
    remaining_engineers: List[UserBase]
