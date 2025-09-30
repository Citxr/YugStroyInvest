from functools import wraps
from fastapi import HTTPException, status
from . import models

from typing import Union, List


def require_role(roles: Union[models.UserRole, List[models.UserRole]]):
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            current_user = kwargs.get('current_user')

            allowed_roles = [roles] if isinstance(roles, models.UserRole) else roles
            if not current_user or current_user.role not in allowed_roles:
                if len(allowed_roles) == 1:
                    detail = f"Только {allowed_roles[0].value} может выполнять это действие"
                else:
                    role_names = [role.value for role in allowed_roles]
                    detail = f"Только {', '.join(role_names)} могут выполнять это действие"
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=detail
                )
            return await func(*args, **kwargs)
        return wrapper
    return decorator