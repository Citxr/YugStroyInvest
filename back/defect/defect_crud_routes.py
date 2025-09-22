from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from back import schemas, models
from back.auth import auth
from back.database import get_db
from back.decorators import require_role

router = APIRouter(prefix="/defect", tags=["defect"])

@router.post("", response_model=schemas.DefectCreate)
@require_role(models.UserRole.ENGINEER)
async def create_defect(defect: schemas.DefectCreate, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    db_defect = models.Defect(name=defect.name,project_id=defect.project_id,user_engineer_id=current_user.id)
    db.add(db_defect)
    db.commit()
    db.refresh(db_defect)
    return db_defect