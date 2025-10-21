from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from back.auth import token_routes
from back.company import company_crud_routes
from back.defect import defect_crud_routes
from back.project import project_crud_routes
app = FastAPI()
app.include_router(token_routes)
app.include_router(company_crud_routes)
app.include_router(defect_crud_routes)
app.include_router(project_crud_routes)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)