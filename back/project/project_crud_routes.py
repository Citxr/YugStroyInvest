from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from back import schemas, models
from back.auth import auth
from back.database import get_db
from back.decorators import require_role

router = APIRouter(prefix="/project", tags=["project"])


@router.post("", response_model=schemas.ProjectCreate)
@require_role(models.UserRole.MANAGER)
async def create_project(project: schemas.ProjectCreate,
                        db: Session = Depends(get_db),
                        current_user: models.User = Depends(auth.get_current_user)):
    db_project = models.Project(
        name=project.name,
        user_manager_id=current_user.id,
        company_id=project.company_id
    )
    db.add(db_project)

    if project.engineer_ids:
        engineers = db.query(models.User).filter(
            models.User.id.in_(project.engineer_ids),
            models.User.role == models.UserRole.ENGINEER,
            models.User.company_id == current_user.company_id
        ).all()
        db_project.engineers.extend(engineers)

    db.commit()
    db.refresh(db_project)

    return db_project

@router.delete("/{project_id}")
@require_role(models.UserRole.MANAGER)
async def delete_project(project_id: int,
                         db: Session = Depends(get_db),
                         current_user: models.User = Depends(auth.get_current_user)):
    db_project = db.query(models.Project).filter(
        models.Project.id == project_id,
        models.Project.user_manager_id == current_user.id
    ).first()

    if not db_project:
        raise HTTPException(status_code=404, detail="Проект не найдена")

    db.delete(db_project)
    db.commit()
    return {"message": "Проект удалён"}

@router.get("/my-projects")
@require_role(models.UserRole.MANAGER)
async def get_my_projects(db: Session = Depends(get_db),
                          current_user: models.User = Depends(auth.get_current_user),
                          skip: int = 0,
                          limit: int = 100
):

    projects = db.query(models.Project).filter(
        models.Project.user_manager_id == current_user.id
    ).offset(skip).limit(limit).all()

    return projects

@router.get("/my-projects/{project_id}")
@require_role(models.UserRole.MANAGER)
async def get_my_project(project_id: int,
                         db: Session = Depends(get_db),
                         current_user: models.User = Depends(auth.get_current_user)
):

    project = db.query(models.Project).filter(
        models.Project.id == project_id,
        models.Project.user_manager_id == current_user.id
    ).first()

    if not project:
        raise HTTPException(
            status_code=404,
            detail="Проект не найден или у вас нет к нему доступа"
        )

    return project


@router.delete("/{project_id}/manager", response_model=schemas.RemoveProjectFromManagerResponse)
@require_role([models.UserRole.ADMIN, models.UserRole.MANAGER])
async def remove_manager_from_project(
        project_id: int,
        db: Session = Depends(get_db),
        current_user: models.User = Depends(auth.get_current_user)
):
    db_project = db.query(models.Project).filter(
        models.Project.id == project_id
    ).first()

    if not db_project:
        raise HTTPException(status_code=404, detail="Проект не найден")

    if not db_project.user_manager_id:
        raise HTTPException(
            status_code=400,
            detail="У этого проекта нет назначенного менеджера"
        )

    if current_user.role == models.UserRole.MANAGER:
        if db_project.user_manager_id != current_user.id:
            raise HTTPException(
                status_code=403,
                detail="Недостаточно прав. Вы не являетесь менеджером этого проекта"
            )


    try:
        previous_manager_id = db_project.user_manager_id
        project_name = db_project.name

        db_project.user_manager_id = None
        db.commit()
        db.refresh(db_project)

        return schemas.RemoveProjectFromManagerResponse(
            message="Менеджер успешно удален из проекта",
            project_id=db_project.id,
            project_name=project_name,
            previous_manager_id=previous_manager_id
        )

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Ошибка при удалении менеджера из проекта: {str(e)}"
        )


@router.patch("/{project_id}/assign-manager", response_model=schemas.AssignProjectToManagerResponse)
@require_role([models.UserRole.ADMIN, models.UserRole.MANAGER])
async def assign_project_to_manager(
        project_id: int,
        manager_data: schemas.AssignProjectToManager,
        db: Session = Depends(get_db),
        current_user: models.User = Depends(auth.get_current_user)
):
    db_project = db.query(models.Project).filter(
        models.Project.id == project_id
    ).first()

    if not db_project:
        raise HTTPException(status_code=404, detail="Проект не найден")

    db_manager = db.query(models.User).filter(
        models.User.id == manager_data.manager_id,
        models.User.role == models.UserRole.MANAGER
    ).first()

    if not db_manager:
        raise HTTPException(status_code=404, detail="Менеджер не найден")

    if current_user.role == models.UserRole.MANAGER:
        if db_project.user_manager_id and db_project.user_manager_id != current_user.id:
            raise HTTPException(
                status_code=403,
                detail="Недостаточно прав. Вы не являетесь менеджером этого проекта"
            )

    if db_manager.company_id != db_project.company_id:
        raise HTTPException(
            status_code=400,
            detail="Менеджер должен состоять в той же компании что и проект"
        )

    if db_project.user_manager_id == manager_data.manager_id:
        raise HTTPException(
            status_code=400,
            detail="Проект уже привязан к этому менеджеру"
        )

    try:
        previous_manager_id = db_project.user_manager_id

        db_project.user_manager_id = manager_data.manager_id
        db.commit()
        db.refresh(db_project)

        message = "Проект успешно привязан к менеджеру"
        if previous_manager_id:
            message = "Менеджер проекта успешно изменен"

        return schemas.AssignProjectToManagerResponse(
            message=message,
            project_id=db_project.id,
            project_name=db_project.name,
            manager_id=manager_data.manager_id
        )

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Ошибка при привязке проекта к менеджеру: {str(e)}"
        )


@router.post("/{project_id}/engineers", response_model=schemas.AddEngineersToProjectResponse)
@require_role([models.UserRole.ADMIN, models.UserRole.MANAGER])
async def add_engineers_to_project(
        project_id: int,
        engineers_data: schemas.AddEngineersToProject,
        db: Session = Depends(get_db),
        current_user: models.User = Depends(auth.get_current_user)
):
    db_project = db.query(models.Project).filter(
        models.Project.id == project_id
    ).first()

    if not db_project:
        raise HTTPException(status_code=404, detail="Проект не найден")

    if current_user.role == models.UserRole.MANAGER:
        if db_project.user_manager_id != current_user.id:
            raise HTTPException(
                status_code=403,
                detail="Недостаточно прав. Вы не являетесь менеджером этого проекта"
            )

    if not engineers_data.engineer_ids:
        raise HTTPException(
            status_code=400,
            detail="Список инженеров не может быть пустым"
        )

    db_engineers = db.query(models.User).filter(
        models.User.id.in_(engineers_data.engineer_ids),
        models.User.role == models.UserRole.ENGINEER
    ).all()

    found_engineer_ids = [engineer.id for engineer in db_engineers]
    not_found_ids = set(engineers_data.engineer_ids) - set(found_engineer_ids)

    if not_found_ids:
        raise HTTPException(
            status_code=404,
            detail=f"Инженеры с ID {list(not_found_ids)} не найдены"
        )

    wrong_company_engineers = [
        engineer for engineer in db_engineers
        if engineer.company_id != db_project.company_id
    ]

    if wrong_company_engineers:
        wrong_ids = [eng.id for eng in wrong_company_engineers]
        raise HTTPException(
            status_code=400,
            detail=f"Инженеры с ID {wrong_ids} не состоят в компании проекта"
        )

    existing_engineer_ids = [eng.id for eng in db_project.engineers]
    new_engineers = [
        engineer for engineer in db_engineers
        if engineer.id not in existing_engineer_ids
    ]

    if not new_engineers:
        raise HTTPException(
            status_code=400,
            detail="Все указанные инженеры уже добавлены в проект"
        )

    try:
        db_project.engineers.extend(new_engineers)
        db.commit()
        db.refresh(db_project)

        return schemas.AddEngineersToProjectResponse(
            message=f"Успешно добавлено {len(new_engineers)} инженеров в проект",
            project_id=db_project.id,
            project_name=db_project.name,
            added_engineers_count=len(new_engineers),
            engineer_ids=[eng.id for eng in new_engineers]
        )

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Ошибка при добавлении инженеров в проект: {str(e)}"
        )


@router.delete("/{project_id}/engineers", response_model=schemas.ProjectEngineersResponse)
@require_role([models.UserRole.MANAGER, models.UserRole.ADMIN])
async def remove_engineers_from_project(
        project_id: int,
        engineers_data: schemas.RemoveEngineersFromProject,
        db: Session = Depends(get_db),
        current_user: models.User = Depends(auth.get_current_user)
):
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Проект не найден")

    if current_user.role == models.UserRole.MANAGER:
        if project.user_manager_id != current_user.id:
            raise HTTPException(
                status_code=403,
                detail="Вы можете удалять инженеров только из своих проектов"
            )

    current_engineers = project.engineers

    engineer_ids_to_remove = set(engineers_data.engineer_ids)
    current_engineer_ids = {engineer.id for engineer in current_engineers}

    non_existent_engineers = engineer_ids_to_remove - current_engineer_ids
    if non_existent_engineers:
        raise HTTPException(
            status_code=400,
            detail=f"Инженеры с ID {list(non_existent_engineers)} не найдены в проекте"
        )

    engineers_to_remove = [eng for eng in current_engineers if eng.id in engineer_ids_to_remove]

    for engineer in engineers_to_remove:
        project.engineers.remove(engineer)

    try:
        db.commit()
        db.refresh(project)
        remaining_engineers = project.engineers

        return schemas.ProjectEngineersResponse(
            project_id=project.id,
            project_name=project.name,
            removed_engineers=[schemas.UserBase(
                id=eng.id,
                username=eng.username,
                email=eng.email,
                role=eng.role
            ) for eng in engineers_to_remove],
            remaining_engineers=[schemas.UserBase(
                id=eng.id,
                username=eng.username,
                email=eng.email,
                role=eng.role
            ) for eng in remaining_engineers]
        )

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Ошибка при удалении инженеров: {str(e)}")