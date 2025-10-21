import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient
from back.main import app
from back.database import get_db, Base
from back.models import User, Company, Project, Defect, UserRole
from back.auth.auth import get_password_hash

# Тестовая база данных в памяти
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

@pytest.fixture(scope="function")
def db_session():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)

@pytest.fixture
def client():
    return TestClient(app)

@pytest.fixture
def test_company(db_session):
    company = Company(name="Test Company")
    db_session.add(company)
    db_session.commit()
    db_session.refresh(company)
    return company

@pytest.fixture
def test_admin_user(db_session, test_company):
    user = User(
        username="admin",
        email="admin@test.com",
        hashed_password=get_password_hash("password"),
        role=UserRole.ADMIN,
        company_id=test_company.id
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user

@pytest.fixture
def test_manager_user(db_session, test_company):
    user = User(
        username="manager",
        email="manager@test.com",
        hashed_password=get_password_hash("password"),
        role=UserRole.MANAGER,
        company_id=test_company.id
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user

@pytest.fixture
def test_engineer_user(db_session, test_company):
    user = User(
        username="engineer",
        email="engineer@test.com",
        hashed_password=get_password_hash("password"),
        role=UserRole.ENGINEER,
        company_id=1
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user

@pytest.fixture
def test_engineer_user_without_company(db_session, test_company):
    user = User(
        username="engineer1",
        email="engineer1@test.com",
        hashed_password=get_password_hash("password"),
        role=UserRole.ENGINEER,
        company_id=None
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def test_client_user(db_session, test_company):
    user = User(
        username="client",
        email="client@test.com",
        hashed_password=get_password_hash("password"),
        role=UserRole.CLIENT,
        company_id=test_company.id
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user

@pytest.fixture
def test_project(db_session, test_company, test_manager_user):
    project = Project(
        name="Test Project",
        user_manager_id=test_manager_user.id,
        company_id=test_company.id,
    )
    db_session.add(project)
    db_session.commit()
    db_session.refresh(project)
    return project

@pytest.fixture
def test_project_without_manager(db_session, test_company):
    project = Project(
        name="Test Project",
        user_manager_id=None,
        company_id=test_company.id
    )
    db_session.add(project)
    db_session.commit()
    db_session.refresh(project)
    return project

@pytest.fixture
def test_defect(db_session, test_project, test_engineer_user):
    defect = Defect(
        name="Test Defect",
        project_id=test_project.id,
        user_engineer_id=test_engineer_user.id
    )
    db_session.add(defect)
    db_session.commit()
    db_session.refresh(defect)
    return defect

@pytest.fixture
def test_defect_without_engineer(db_session, test_project, test_engineer_user):
    defect = Defect(
        name="Test Defect",
        project_id=test_project.id,
        user_engineer_id=None
    )
    db_session.add(defect)
    db_session.commit()
    db_session.refresh(defect)
    return defect

def get_auth_headers(client, username, password):
    response = client.post("/auth/token", data={"username": username, "password": password})
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}
