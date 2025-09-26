from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from back import schemas, models
from back.auth import auth
from back.database import get_db
from back.decorators import require_role

router = APIRouter(prefix="/company", tags=["company"])

@router.post("/create", response_model=schemas.CompanyCreate)
@require_role(models.UserRole.ADMIN)
async def create_company(company: schemas.CompanyCreate, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    db_company = models.Company(name=company.name)
    db.add(db_company)
    db.commit()
    db.refresh(db_company)
    current_user.company_id = db_company.id
    db.commit()
    return db_company

@router.delete("/{company_id}")
@require_role(models.UserRole.ADMIN)
async def delete_company(company_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    db_company = db.query(models.Company).filter(
        models.Company.id == company_id
    ).first()
    if current_user.company_id != company_id:
        raise HTTPException(status_code=403, detail="Недостаточно прав для удаления этой компании")

    if not db_company:
        raise HTTPException(status_code=404, detail="Компания не найдена")

    db.delete(db_company)
    db.commit()
    return {"message": "Компания удалена"}


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

    if current_user.company_id != company_id:
        raise HTTPException(
            status_code=403,
            detail="Недостаточно прав. Вы не являетесь администратором этой компании"
        )

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