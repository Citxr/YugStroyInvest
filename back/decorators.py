from functools import wraps
from fastapi import HTTPException, status
from . import models

def require_role(role: models.UserRole):
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            current_user = kwargs.get('current_user')
            if not current_user or current_user.role != role:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Только {role.value} может выполнять это действие"
                )
            return await func(*args, **kwargs)
        return wrapper
    return decorator