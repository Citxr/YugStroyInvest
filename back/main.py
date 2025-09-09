from fastapi import FastAPI
from .auth import token_routes

app = FastAPI()
app.include_router(token_routes)