import pytest
from fastapi.testclient import TestClient
from back.auth.auth import verify_password, get_password_hash, create_access_token, authenticate_user
from back.models import User, UserRole
from datetime import timedelta

class TestAuthFunctions:
    """Тесты для функций аутентификации"""
    
    def test_verify_password_correct(self):
        """Тест проверки правильного пароля"""
        password = "test_password"
        hashed = get_password_hash(password)
        assert verify_password(password, hashed) == True
    
    def test_verify_password_incorrect(self):
        """Тест проверки неправильного пароля"""
        password = "test_password"
        wrong_password = "wrong_password"
        hashed = get_password_hash(password)
        assert verify_password(wrong_password, hashed) == False
    
    def test_get_password_hash(self):
        """Тест хеширования пароля"""
        password = "test_password"
        hashed = get_password_hash(password)
        assert hashed != password
        assert len(hashed) > 0
    
    def test_create_access_token(self):
        """Тест создания токена доступа"""
        data = {"sub": "test_user"}
        token = create_access_token(data)
        assert token is not None
        assert isinstance(token, str)
        assert len(token) > 0
    
    def test_create_access_token_with_expires_delta(self):
        """Тест создания токена с кастомным временем истечения"""
        data = {"sub": "test_user"}
        expires_delta = timedelta(minutes=60)
        token = create_access_token(data, expires_delta)
        assert token is not None
        assert isinstance(token, str)

class TestAuthEndpoints:
    """Тесты для эндпоинтов аутентификации"""
    
    def test_register_user_success(self, client, db_session):
        """Тест успешной регистрации пользователя"""
        user_data = {
            "username": "newuser",
            "email": "newuser@test.com",
            "password": "password123",
            "role": "engineer",
            "company_id": None
        }
        response = client.post("/auth/register", json=user_data)
        assert response.status_code == 200
        data = response.json()
        assert data["username"] == "newuser"
        assert data["email"] == "newuser@test.com"
        assert data["role"] == "engineer"
        assert "id" in data
    
    def test_register_user_duplicate_email(self, client, db_session, test_admin_user):
        """Тест регистрации с дублирующимся email"""
        user_data = {
            "username": "newuser",
            "email": "admin@test.com",  # Дублирующийся email
            "password": "password123",
            "role": "engineer",
            "company_id": None
        }
        response = client.post("/auth/register", json=user_data)
        assert response.status_code == 400
        assert "уже существует" in response.json()["detail"]
    
    def test_login_success(self, client, test_admin_user):
        """Тест успешного входа"""
        login_data = {
            "username": "admin",
            "password": "password"
        }
        response = client.post("/auth/token", data=login_data)
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
    
    def test_login_wrong_username(self, client, test_admin_user):
        """Тест входа с неправильным именем пользователя"""
        login_data = {
            "username": "nonexistent",
            "password": "password"
        }
        response = client.post("/auth/token", data=login_data)
        assert response.status_code == 401
        assert "Неверное имя или пароль" in response.json()["detail"]
    
    def test_login_wrong_password(self, client, test_admin_user):
        """Тест входа с неправильным паролем"""
        login_data = {
            "username": "admin",
            "password": "wrongpassword"
        }
        response = client.post("/auth/token", data=login_data)
        assert response.status_code == 401
        assert "Неверное имя или пароль" in response.json()["detail"]
    
    def test_get_current_user_success(self, client, test_admin_user):
        """Тест получения информации о текущем пользователе"""
        headers = {"Authorization": f"Bearer {client.post('/auth/token', data={'username': 'admin', 'password': 'password'}).json()['access_token']}"}
        response = client.get("/auth/users/me/", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert data["username"] == "admin"
        assert data["email"] == "admin@test.com"
        assert data["role"] == "admin"
    
    def test_get_current_user_invalid_token(self, client):
        """Тест получения информации с невалидным токеном"""
        headers = {"Authorization": "Bearer invalid_token"}
        response = client.get("/auth/users/me/", headers=headers)
        assert response.status_code == 401
        assert "Could not validate credentials" in response.json()["detail"]
