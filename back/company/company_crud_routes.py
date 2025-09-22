from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from back import schemas, models
from back.auth import auth
from back.database import get_db
from back.decorators import require_role
from back.schemas import CompanyCreate

router = APIRouter(prefix="/company", tags=["company"])

@router.post("", response_model=schemas.CompanyCreate)
@require_role(models.UserRole.MANAGER)
async def create_company(company: schemas.CompanyCreate, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    db_company = models.Company(name=company.name,user_client_id=company.user_client_id,user_manager_id=current_user.id,user_engineer_id=company.user_engineer_id)
    db.add(db_company)
    db.commit()
    db.refresh(db_company)
    return db_company
