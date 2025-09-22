from fastapi import APIRouter
from .company_crud_routes import router as company_routes

company_crud_routes = APIRouter()
company_crud_routes.include_router(company_routes)