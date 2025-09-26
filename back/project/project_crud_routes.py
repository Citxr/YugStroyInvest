from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from back import schemas, models
from back.auth import auth
from back.database import get_db
from back.decorators import require_role

router = APIRouter(prefix="/project", tags=["project"])


@router.post("", response_model=schemas.ProjectCreate)
@require_role(models.UserRole.MANAGER)
async def create_defect(project: schemas.ProjectCreate, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    db_project = models.Project(name=project.name, user_manager_id=current_user.id, company_id=project.company_id)
    db.add(db_project)
    db.commit()
    db.refresh(db_project)

    if project.engineer_ids:
        engineers = db.query(models.User).filter(
            models.User.id.in_(project.engineer_ids),
            models.User.role == models.UserRole.ENGINEER
        ).all()

        db_project.engineers.extend(engineers)
        db.commit()
        db.refresh(db_project)

    return db_project

@router.delete("/{project_id}")
@require_role(models.UserRole.MANAGER)
async def delete_project(project_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    db_project = db.query(models.Project).filter(
        models.Project.id == project_id,
        models.Project.user_manager_id == current_user.id
    ).first()

    if not db_project:
        raise HTTPException(status_code=404, detail="Проект не найдена")

    db.delete(db_project)
    db.commit()
    return {"message": "Проект удалена"}