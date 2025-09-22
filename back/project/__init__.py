from fastapi import APIRouter
from .project_crud_routes import router as project_routes

project_crud_routes = APIRouter()
project_crud_routes.include_router(project_routes)