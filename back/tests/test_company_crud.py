import pytest
from fastapi.testclient import TestClient

class TestCompanyCRUD:
    """Тесты для CRUD операций с компаниями"""
    
    def test_create_company_success(self, client, test_admin_user):
        """Тест успешного создания компании"""
        headers = {"Authorization": f"Bearer {client.post('/auth/token', data={'username': 'admin', 'password': 'password'}).json()['access_token']}"}
        company_data = {"name": "New Company"}
        response = client.post("/company/create", json=company_data, headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "New Company"
        assert "name" in data
    
    def test_create_company_unauthorized(self, client, test_engineer_user):
        """Тест создания компании без прав администратора"""
        headers = {"Authorization": f"Bearer {client.post('/auth/token', data={'username': 'engineer', 'password': 'password'}).json()['access_token']}"}
        company_data = {"name": "New Company"}
        response = client.post("/company/create", json=company_data, headers=headers)
        assert response.status_code == 403
        assert "Только admin может выполнять это действие" in response.json()["detail"]
    
    def test_delete_company_success(self, client, test_admin_user, test_company):
        """Тест успешного удаления компании"""
        headers = {"Authorization": f"Bearer {client.post('/auth/token', data={'username': 'admin', 'password': 'password'}).json()['access_token']}"}
        response = client.delete(f"/company/{test_company.id}", headers=headers)
        assert response.status_code == 200
        assert "Компания удалена" in response.json()["message"]
    
    def test_delete_company_not_found(self, client, test_admin_user):
        """Тест удаления несуществующей компании"""
        headers = {"Authorization": f"Bearer {client.post('/auth/token', data={'username': 'admin', 'password': 'password'}).json()['access_token']}"}
        response = client.delete("/company/999", headers=headers)
        assert response.status_code == 404
        assert "Компания не найдена" in response.json()["detail"]
    
    def test_add_user_to_company_success(self, client, test_admin_user, test_company, test_engineer_user_without_company):
        """Тест успешного добавления пользователя в компанию"""
        headers = {"Authorization": f"Bearer {client.post('/auth/token', data={'username': 'admin', 'password': 'password'}).json()['access_token']}"}
        user_data = {"user_id": test_engineer_user_without_company.id}
        response = client.post(f"/company/{test_company.id}/users", json=user_data, headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert data["user_id"] == test_engineer_user_without_company.id
        assert data["company_id"] == test_company.id
        assert "успешно добавлен" in data["message"]
    
    def test_add_user_to_company_user_not_found(self, client, test_admin_user, test_company):
        """Тест добавления несуществующего пользователя в компанию"""
        headers = {"Authorization": f"Bearer {client.post('/auth/token', data={'username': 'admin', 'password': 'password'}).json()['access_token']}"}
        user_data = {"user_id": 999}
        response = client.post(f"/company/{test_company.id}/users", json=user_data, headers=headers)
        assert response.status_code == 404
        assert "Пользователь не найден" in response.json()["detail"]
    
    def test_add_user_to_company_already_in_company(self, client, test_admin_user, test_company, test_engineer_user):
        """Тест добавления пользователя, уже состоящего в компании"""
        # Сначала добавляем пользователя в компанию
        test_engineer_user.company_id = test_company.id
        
        headers = {"Authorization": f"Bearer {client.post('/auth/token', data={'username': 'admin', 'password': 'password'}).json()['access_token']}"}
        user_data = {"user_id": test_engineer_user.id}
        response = client.post(f"/company/{test_company.id}/users", json=user_data, headers=headers)
        assert response.status_code == 400
        assert "уже состоит в этой компании" in response.json()["detail"]
    
    def test_get_full_company_info_success(self, client, test_admin_user, test_company):
        """Тест получения полной информации о компании"""
        headers = {"Authorization": f"Bearer {client.post('/auth/token', data={'username': 'admin', 'password': 'password'}).json()['access_token']}"}
        response = client.get(f"/company/my-companies?company_id={test_company.id}", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == test_company.id
        assert data["name"] == test_company.name
        assert "projects" in data
        assert "managers" in data
        assert "engineers" in data
    
    def test_get_full_company_info_forbidden(self, client, test_engineer_user_without_company, test_company):
        """Тест получения информации о компании без прав"""
        headers = {"Authorization": f"Bearer {client.post('/auth/token', data={'username': 'engineer1', 'password': 'password'}).json()['access_token']}"}
        response = client.get(f"/company/my-companies?company_id={test_company.id}", headers=headers)
        assert response.status_code == 403
        assert "Недостаточно прав" in response.json()["detail"]
    
    def test_list_companies_success(self, client, test_admin_user, test_company):
        """Тест получения списка всех компаний"""
        headers = {"Authorization": f"Bearer {client.post('/auth/token', data={'username': 'admin', 'password': 'password'}).json()['access_token']}"}
        response = client.get("/company/all", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 1
        assert data[0]["id"] == test_company.id
        assert data[0]["name"] == test_company.name
        assert "projects_count" in data[0]
        assert "users_count" in data[0]
    
    def test_remove_user_from_company_success(self, client, test_admin_user, test_company, test_engineer_user):
        """Тест успешного удаления пользователя из компании"""
        # Сначала добавляем пользователя в компанию
        test_engineer_user.company_id = test_company.id
        
        headers = {"Authorization": f"Bearer {client.post('/auth/token', data={'username': 'admin', 'password': 'password'}).json()['access_token']}"}
        response = client.delete(f"/company/{test_company.id}/users/{test_engineer_user.id}", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert data["user_id"] == test_engineer_user.id
        assert data["company_id"] == test_company.id
        assert "успешно отвязан" in data["message"]
    
    def test_remove_user_from_company_user_not_in_company(self, client, test_admin_user, test_company, test_engineer_user_without_company):
        """Тест удаления пользователя, не состоящего в компании"""
        headers = {"Authorization": f"Bearer {client.post('/auth/token', data={'username': 'admin', 'password': 'password'}).json()['access_token']}"}
        response = client.delete(f"/company/{test_company.id}/users/{test_engineer_user_without_company.id}", headers=headers)
        assert response.status_code == 400
        assert "не состоит в указанной компании" in response.json()["detail"]
