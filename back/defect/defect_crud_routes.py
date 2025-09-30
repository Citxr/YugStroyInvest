from fastapi import APIRouter, Depends, HTTPException
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

@router.delete("/{defect_id}")
@require_role(models.UserRole.ENGINEER)
async def delete_defect(defect_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    db_defect = db.query(models.Defect).filter(
        models.Defect.id == defect_id,
        models.Defect.user_engineer_id == current_user.id
    ).first()

    if not db_defect:
        raise HTTPException(status_code=404, detail="Дефект не найдена")

    db.delete(db_defect)
    db.commit()
    return {"message": "Дефект удален"}

@router.get("/my-defects")
@require_role(models.UserRole.ENGINEER)
async def get_my_defects(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    defects = db.query(models.Defect).filter(
        models.Defect.user_engineer_id == current_user.id
    ).offset(skip).limit(limit).all()

    return defects

@router.get("/my-defects/{defect_id}")
@require_role(models.UserRole.ENGINEER)
async def get_my_defect(defect_id: int,
                         db: Session = Depends(get_db),
                         current_user: models.User = Depends(auth.get_current_user)
):

    defect = db.query(models.Defect).filter(
        models.Defect.id == defect_id,
        models.Defect.user_engineer_id == current_user.id
    ).first()

    if not defect:
        raise HTTPException(
            status_code=404,
            detail="Дефект не найден или у вас нет к нему доступа"
        )

    return defect


@router.delete("/{defect_id}/remove-engineer", response_model=schemas.RemoveDefectResponse)
@require_role([models.UserRole.MANAGER, models.UserRole.ADMIN])
async def remove_engineer_from_defect(
        defect_id: int,
        db: Session = Depends(get_db),
        current_user: models.User = Depends(auth.get_current_user)
):
    db_defect = db.query(models.Defect).filter(
        models.Defect.id == defect_id
    ).first()

    if not db_defect:
        raise HTTPException(status_code=404, detail="Дефект не найден")

    if current_user.role == models.UserRole.MANAGER:
        project = db.query(models.Project).filter(
            models.Project.id == db_defect.project_id,
            models.Project.user_manager_id == current_user.id
        ).first()

        if not project:
            raise HTTPException(
                status_code=403,
                detail="Недостаточно прав. Вы не являетесь менеджером проекта этого дефекта"
            )

    if not db_defect.user_engineer_id:
        raise HTTPException(
            status_code=400,
            detail="У этого дефекта нет назначенного инженера"
        )

    try:
        engineer_id = db_defect.user_engineer_id
        defect_name = db_defect.name

        db_defect.user_engineer_id = None
        db.commit()
        db.refresh(db_defect)

        return schemas.RemoveDefectResponse(
            message="Инженер успешно удален из дефекта",
            defect_id=db_defect.id,
            defect_name=defect_name,
            engineer_id=engineer_id
        )

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Ошибка при удалении инженера из дефекта: {str(e)}"
        )


@router.patch("/defects/{defect_id}/assign-engineer", response_model=schemas.AssignEngineerToDefectResponse)
@require_role([models.UserRole.ADMIN, models.UserRole.MANAGER])
async def assign_engineer_to_defect(
        defect_id: int,
        engineer_data: schemas.AssignEngineerToDefect,
        db: Session = Depends(get_db),
        current_user: models.User = Depends(auth.get_current_user)
):
    db_defect = db.query(models.Defect).filter(
        models.Defect.id == defect_id
    ).first()

    if not db_defect:
        raise HTTPException(status_code=404, detail="Дефект не найден")

    db_engineer = db.query(models.User).filter(
        models.User.id == engineer_data.engineer_id,
        models.User.role == models.UserRole.ENGINEER
    ).first()

    if not db_engineer:
        raise HTTPException(status_code=404, detail="Инженер не найден")

    if current_user.role == models.UserRole.MANAGER:
        project = db.query(models.Project).filter(
            models.Project.id == db_defect.project_id,
            models.Project.user_manager_id == current_user.id
        ).first()

        if not project:
            raise HTTPException(
                status_code=403,
                detail="Недостаточно прав. Вы не являетесь менеджером проекта этого дефекта"
            )

    project = db.query(models.Project).filter(models.Project.id == db_defect.project_id).first()
    if db_engineer.company_id != project.company_id:
        raise HTTPException(
            status_code=400,
            detail="Инженер должен состоять в той же компании что и проект дефекта"
        )

    if db_defect.user_engineer_id == engineer_data.engineer_id:
        raise HTTPException(
            status_code=400,
            detail="Дефект уже привязан к этому инженеру"
        )

    try:
        previous_engineer_id = db_defect.user_engineer_id

        db_defect.user_engineer_id = engineer_data.engineer_id
        db.commit()
        db.refresh(db_defect)

        message = "Инженер успешно привязан к дефекту"
        if previous_engineer_id:
            message = "Инженер дефекта успешно изменен"

        return schemas.AssignEngineerToDefectResponse(
            message=message,
            defect_id=db_defect.id,
            defect_name=db_defect.name,
            engineer_id=engineer_data.engineer_id
        )

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Ошибка при привязке инженера к дефекту: {str(e)}"
        )