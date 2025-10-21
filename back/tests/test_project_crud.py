import pytest
from fastapi.testclient import TestClient

class TestProjectCRUD:
    """Тесты для CRUD операций с проектами"""
    
    def test_create_project_success(self, client, test_manager_user, test_company):
        """Тест успешного создания проекта"""
        headers = {"Authorization": f"Bearer {client.post('/auth/token', data={'username': 'manager', 'password': 'password'}).json()['access_token']}"}
        project_data = {
            "name": "New Project",
            "company_id": test_company.id,
            "engineer_ids": []
        }
        response = client.post("/project", json=project_data, headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "New Project"
        assert data["company_id"] == test_company.id
    
    def test_create_project_unauthorized(self, client, test_engineer_user, test_company):
        """Тест создания проекта без прав"""
        headers = {"Authorization": f"Bearer {client.post('/auth/token', data={'username': 'engineer', 'password': 'password'}).json()['access_token']}"}
        project_data = {
            "name": "New Project",
            "company_id": test_company.id,
            "engineer_ids": []
        }
        response = client.post("/project", json=project_data, headers=headers)
        assert response.status_code == 403
        assert "Только" in response.json()["detail"] and "admin" in response.json()["detail"]
    
    def test_delete_project_success(self, client, test_manager_user, test_project):
        """Тест успешного удаления проекта"""
        headers = {"Authorization": f"Bearer {client.post('/auth/token', data={'username': 'manager', 'password': 'password'}).json()['access_token']}"}
        response = client.delete(f"/project/{test_project.id}", headers=headers)
        assert response.status_code == 200
        assert "Проект удалён" in response.json()["message"]
    
    def test_delete_project_not_found(self, client, test_manager_user):
        """Тест удаления несуществующего проекта"""
        headers = {"Authorization": f"Bearer {client.post('/auth/token', data={'username': 'manager', 'password': 'password'}).json()['access_token']}"}
        response = client.delete("/project/999", headers=headers)
        assert response.status_code == 404
        assert "Проект не найдена" in response.json()["detail"]
    
    def test_get_my_projects_success(self, client, test_manager_user, test_project):
        """Тест получения проектов пользователя"""
        headers = {"Authorization": f"Bearer {client.post('/auth/token', data={'username': 'manager', 'password': 'password'}).json()['access_token']}"}
        response = client.get("/project/my-projects", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 1
        assert data[0]["id"] == test_project.id
        assert data[0]["name"] == test_project.name
    
    def test_get_my_project_success(self, client, test_manager_user, test_project):
        """Тест получения конкретного проекта"""
        headers = {"Authorization": f"Bearer {client.post('/auth/token', data={'username': 'manager', 'password': 'password'}).json()['access_token']}"}
        response = client.get(f"/project/my-projects/{test_project.id}", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == test_project.id
        assert data["name"] == test_project.name
    
    def test_get_my_project_not_found(self, client, test_manager_user):
        """Тест получения несуществующего проекта"""
        headers = {"Authorization": f"Bearer {client.post('/auth/token', data={'username': 'manager', 'password': 'password'}).json()['access_token']}"}
        response = client.get("/project/my-projects/999", headers=headers)
        assert response.status_code == 404
        assert "Проект не найден" in response.json()["detail"]
    
    def test_remove_manager_from_project_success(self, client, test_admin_user, test_project, test_manager_user):
        """Тест успешного удаления менеджера из проекта"""
        headers = {"Authorization": f"Bearer {client.post('/auth/token', data={'username': 'admin', 'password': 'password'}).json()['access_token']}"}
        response = client.delete(f"/project/{test_project.id}/manager", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert data["project_id"] == test_project.id
        assert data["previous_manager_id"] == test_manager_user.id
        assert "успешно удален" in data["message"]
    
    def test_remove_manager_from_project_no_manager(self, client, test_admin_user, test_project_without_manager):
        """Тест удаления менеджера из проекта без менеджера"""
        
        headers = {"Authorization": f"Bearer {client.post('/auth/token', data={'username': 'admin', 'password': 'password'}).json()['access_token']}"}
        response = client.delete(f"/project/{test_project_without_manager.id}/manager", headers=headers)
        assert response.status_code == 400
        assert "нет назначенного менеджера" in response.json()["detail"]
    
    def test_assign_project_to_manager_success(self, client, test_admin_user, test_project_without_manager, test_manager_user):
        """Тест успешного назначения менеджера проекту"""

        headers = {"Authorization": f"Bearer {client.post('/auth/token', data={'username': 'admin', 'password': 'password'}).json()['access_token']}"}
        manager_data = {"manager_id": test_manager_user.id}
        response = client.patch(f"/project/{test_project_without_manager.id}/assign-manager", json=manager_data, headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert data["project_id"] == test_project_without_manager.id
        assert data["manager_id"] == test_manager_user.id
        assert "успешно привязан" in data["message"]
    
    def test_assign_project_to_manager_not_found(self, client, test_admin_user, test_project):
        """Тест назначения несуществующего менеджера"""
        headers = {"Authorization": f"Bearer {client.post('/auth/token', data={'username': 'admin', 'password': 'password'}).json()['access_token']}"}
        manager_data = {"manager_id": 999}
        response = client.patch(f"/project/{test_project.id}/assign-manager", json=manager_data, headers=headers)
        assert response.status_code == 404
        assert "Менеджер не найден" in response.json()["detail"]

    def test_add_engineers_to_project_success(self, client, test_manager_user, test_project, test_engineer_user):
        """Тест успешного добавления инженеров в проект"""
        headers = {"Authorization": f"Bearer {client.post('/auth/token', data={'username': 'manager', 'password': 'password'}).json()['access_token']}"}
        engineers_data = {"engineer_ids": [test_engineer_user.id]}
        response = client.post(f"/project/{test_project.id}/engineers", json=engineers_data, headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert data["project_id"] == test_project.id
        assert data["added_engineers_count"] == 1
        assert test_engineer_user.id in data["engineer_ids"]
    
    def test_add_engineers_to_project_empty_list(self, client, test_manager_user, test_project):
        """Тест добавления пустого списка инженеров"""
        headers = {"Authorization": f"Bearer {client.post('/auth/token', data={'username': 'manager', 'password': 'password'}).json()['access_token']}"}
        engineers_data = {"engineer_ids": []}
        response = client.post(f"/project/{test_project.id}/engineers", json=engineers_data, headers=headers)
        assert response.status_code == 400
        assert "не может быть пустым" in response.json()["detail"]


