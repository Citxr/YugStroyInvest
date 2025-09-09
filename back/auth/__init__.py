from fastapi import APIRouter
from .auth_routes import router as get_user_router

token_routes = APIRouter()
token_routes.include_router(get_user_router)