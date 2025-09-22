from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from back import schemas, models
from back.auth import auth
from back.database import get_db
from back.decorators import require_role

router = APIRouter(prefix="/project", tags=["project"])


@router.post("", response_model=schemas.ProjectCreate)
@require_role(models.UserRole.MANAGER)
async def create_defect(project: schemas.ProjectCreate, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    db_project = models.Project(name=project.name,user_manager_id=current_user.id, company_id=project.company_id)
    db.add(db_project)
    db.commit()
    db.refresh(db_project)

    if project.engineer_ids:
        # Получаем объекты инженеров из базы
        engineers = db.query(models.User).filter(
            models.User.id.in_(project.engineer_ids),
            models.User.role == models.UserRole.ENGINEER  # Проверяем что это инженеры
        ).all()

        # Добавляем связь через relationship
        db_project.user_engineer.extend(engineers)
        db.commit()
        db.refresh(db_project)


    return db_project