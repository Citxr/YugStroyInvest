from fastapi import APIRouter
from .defect_crud_routes import router as defect_routes

defect_crud_routes = APIRouter()
defect_crud_routes.include_router(defect_routes)