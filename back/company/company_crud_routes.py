from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from back import schemas, models
from back.auth import auth
from back.database import get_db
from back.decorators import require_role
from back.models import Company, Project, Defect, UserRole
from back.schemas import CompanyFullOut, CompanyListItemOut

router = APIRouter(prefix="/company", tags=["company"])

@router.post("/create", response_model=schemas.CompanyCreate)
@require_role(models.UserRole.ADMIN)
async def create_company(company: schemas.CompanyCreate, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    db_company = models.Company(name=company.name)
    db.add(db_company)
    db.commit()
    return db_company

@router.delete("/{company_id}")
@require_role(models.UserRole.ADMIN)
async def delete_company(company_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    db_company = db.query(models.Company).filter(
        models.Company.id == company_id
    ).first()

    if not db_company:
        raise HTTPException(status_code=404, detail="Компания не найдена")

    try:
        db.delete(db_company)
        db.commit()

        return {"message": "Компания удалена"}

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Ошибка при удалении компании: {str(e)}"
        )

@router.post("/{company_id}/users", response_model=schemas.UserToCompanyResponse)
@require_role(models.UserRole.ADMIN)
async def add_user_to_company(
        company_id: int,
        user_data: schemas.AddUserToCompany,
        db: Session = Depends(get_db),
        current_user: models.User = Depends(auth.get_current_user)
):

    db_company = db.query(models.Company).filter(
        models.Company.id == company_id
    ).first()

    if not db_company:
        raise HTTPException(status_code=404, detail="Компания не найдена")

    user_to_add = db.query(models.User).filter(
        models.User.id == user_data.user_id
    ).first()

    if not user_to_add:
        raise HTTPException(status_code=404, detail="Пользователь не найден")

    if user_to_add.company_id is not None:
        if user_to_add.company_id == company_id:
            raise HTTPException(
                status_code=400,
                detail="Пользователь уже состоит в этой компании"
            )
        else:
            current_company = db.query(models.Company).filter(
                models.Company.id == user_to_add.company_id
            ).first()
            company_name = current_company.name if current_company else "другой компании"
            raise HTTPException(
                status_code=400,
                detail=f"Пользователь уже состоит в компании: {company_name}"
            )

    try:
        user_to_add.company_id = company_id
        db.commit()
        db.refresh(user_to_add)

        return schemas.UserToCompanyResponse(
            message="Пользователь успешно добавлен в компанию",
            user_id=user_to_add.id,
            company_id=company_id,
            user_role=user_to_add.role.value
        )

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Ошибка при добавлении пользователя в компанию: {str(e)}"
        )


@router.get("/my-companies", response_model=CompanyFullOut)
async def get_full_company_info(company_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):

    company = (
        db.query(Company)
        .options(
            joinedload(Company.projects)
            .joinedload(Project.engineers),
            joinedload(Company.projects)
            .joinedload(Project.defects)
            .joinedload(Defect.engineer),
            joinedload(Company.users),
        )
        .filter(Company.id == company_id)
        .first()
    )

    if current_user.role == models.UserRole.CLIENT or current_user.role != models.UserRole.ADMIN:
        if current_user.company_id != company_id:
            raise HTTPException(status_code=403, detail="Недостаточно прав для получения данных этой компании")

    if not company:
        raise HTTPException(status_code=404, detail="Company not found")

    managers = [
        {
            "id": u.id,
            "username": u.username,
            "email": u.email,
            "projects": [p.name for p in u.managed_projects],
        }
        for u in company.users if u.role == UserRole.MANAGER
    ]

    engineers = [
        {
            "id": u.id,
            "username": u.username,
            "email": u.email,
            "defects": [
                {
                    "id": d.id,
                    "name": d.name,
                    "project_id": d.project_id,
                    "engineer_id": d.user_engineer_id,
                }
                for d in u.defect_as_engineer
            ],
        }
        for u in company.users if u.role == UserRole.ENGINEER
    ]

    projects = []
    for p in company.projects:
        manager_data = None
        if p.manager:
            manager_data = {
                "id": p.manager.id,
                "username": p.manager.username,
                "email": p.manager.email,
                "projects": []
            }
        
        projects.append({
            "id": p.id,
            "name": p.name,
            "manager_id": p.user_manager_id,
            "manager": manager_data,
            "engineers": [
                {
                    "id": e.id,
                    "username": e.username,
                    "email": e.email,
                    "defects": [
                        {
                            "id": d.id,
                            "name": d.name,
                            "project_id": d.project_id,
                            "engineer_id": d.user_engineer_id,
                        }
                        for d in e.defect_as_engineer if d.project_id == p.id
                    ],
                }
                for e in p.engineers
            ],
            "defects": [
                {
                    "id": d.id,
                    "name": d.name,
                    "project_id": d.project_id,
                    "engineer_id": d.user_engineer_id,
                }
                for d in p.defects
            ]
        })

    return {
        "id": company.id,
        "name": company.name,
        "projects": projects,
        "managers": managers,
        "engineers": engineers,
    }


@router.get("/all", response_model=list[CompanyListItemOut])
@require_role(models.UserRole.ADMIN)
async def list_companies(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    companies = db.query(models.Company).all()

    result: list[CompanyListItemOut] = []
    for c in companies:
        projects_count = db.query(models.Project).filter(models.Project.company_id == c.id).count()
        users_count = db.query(models.User).filter(models.User.company_id == c.id).count()
        result.append(CompanyListItemOut(
            id=c.id,
            name=c.name,
            projects_count=projects_count,
            users_count=users_count
        ))

    return result


@router.delete("/{company_id}/users/{user_id}", response_model=schemas.RemoveUserFromCompanyResponse)
@require_role(models.UserRole.ADMIN)
async def remove_user_from_company(
        company_id: int,
        user_id: int,
        db: Session = Depends(get_db),
        current_user: models.User = Depends(auth.get_current_user)
):
    db_company = db.query(models.Company).filter(
        models.Company.id == company_id
    ).first()

    if not db_company:
        raise HTTPException(status_code=404, detail="Компания не найдена")

    user_to_remove = db.query(models.User).filter(
        models.User.id == user_id
    ).first()

    if not user_to_remove:
        raise HTTPException(status_code=404, detail="Пользователь не найден")

    if user_to_remove.company_id != company_id:
        raise HTTPException(
            status_code=400,
            detail="Пользователь не состоит в указанной компании"
        )

    try:
        user_role = user_to_remove.role.value

        if user_to_remove.role == models.UserRole.MANAGER:
            managed_projects = db.query(models.Project).filter(
                models.Project.user_manager_id == user_id,
                models.Project.company_id == company_id
            ).count()

            if managed_projects > 0:
                raise HTTPException(
                    status_code=400,
                    detail="Невозможно отвязать менеджера, у которого есть проекты в компании. Сначала передайте проекты другому менеджеру."
                )

        if user_to_remove.role == models.UserRole.ENGINEER:
            active_defects = db.query(models.Defect).filter(
                models.Defect.user_engineer_id == user_id
            ).join(models.Project).filter(
                models.Project.company_id == company_id
            ).count()

            if active_defects > 0:
                raise HTTPException(
                    status_code=400,
                    detail="Невозможно отвязать инженера, у которого есть активные дефекты в компании. Сначала перераспределите дефекты."
                )

        engineer_projects = db.query(models.Project).join(
            models.Project.engineers
        ).filter(
            models.User.id == user_id,
            models.Project.company_id == company_id
        ).all()

        for project in engineer_projects:
            project.engineers.remove(user_to_remove)

        user_to_remove.company_id = None
        db.commit()
        db.refresh(user_to_remove)

        return schemas.RemoveUserFromCompanyResponse(
            message="Пользователь успешно отвязан от компании",
            user_id=user_to_remove.id,
            company_id=company_id,
            user_role=user_role
        )

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Ошибка при отвязке пользователя от компании: {str(e)}"
        )