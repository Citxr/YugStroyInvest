import pytest
from fastapi.testclient import TestClient

class TestDefectCRUD:
    """Тесты для CRUD операций с дефектами"""
    
    def test_create_defect_success(self, client, test_engineer_user, test_project):
        """Тест успешного создания дефекта"""
        headers = {"Authorization": f"Bearer {client.post('/auth/token', data={'username': 'engineer', 'password': 'password'}).json()['access_token']}"}
        defect_data = {
            "name": "New Defect",
            "project_id": test_project.id
        }
        response = client.post("/defect", json=defect_data, headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "New Defect"
        assert data["project_id"] == test_project.id
    
    def test_create_defect_unauthorized(self, client, test_manager_user, test_project):
        """Тест создания дефекта без прав"""
        headers = {"Authorization": f"Bearer {client.post('/auth/token', data={'username': 'manager', 'password': 'password'}).json()['access_token']}"}
        defect_data = {
            "name": "New Defect",
            "project_id": test_project.id
        }
        response = client.post("/defect", json=defect_data, headers=headers)
        assert response.status_code == 403
        assert "Только engineer может выполнять это действие" in response.json()["detail"]
    
    def test_delete_defect_success(self, client, test_engineer_user, test_defect):
        """Тест успешного удаления дефекта"""
        headers = {"Authorization": f"Bearer {client.post('/auth/token', data={'username': 'engineer', 'password': 'password'}).json()['access_token']}"}
        response = client.delete(f"/defect/{test_defect.id}", headers=headers)
        assert response.status_code == 200
        assert "Дефект удален" in response.json()["message"]
    
    def test_delete_defect_not_found(self, client, test_engineer_user):
        """Тест удаления несуществующего дефекта"""
        headers = {"Authorization": f"Bearer {client.post('/auth/token', data={'username': 'engineer', 'password': 'password'}).json()['access_token']}"}
        response = client.delete("/defect/999", headers=headers)
        assert response.status_code == 404
        assert "Дефект не найдена" in response.json()["detail"]
    
    def test_delete_defect_wrong_engineer(self, client, test_engineer_user, test_defect, test_engineer_user_without_company):
        """Тест удаления дефекта другим инженером"""
        
        headers = {"Authorization": f"Bearer {client.post('/auth/token', data={'username': 'engineer1', 'password': 'password'}).json()['access_token']}"}
        response = client.delete(f"/defect/{test_defect.id}", headers=headers)
        assert response.status_code == 404
        assert "Дефект не найдена" in response.json()["detail"]
    
    def test_get_my_defects_success(self, client, test_engineer_user, test_defect):
        """Тест получения дефектов пользователя"""
        headers = {"Authorization": f"Bearer {client.post('/auth/token', data={'username': 'engineer', 'password': 'password'}).json()['access_token']}"}
        response = client.get("/defect/my-defects", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 1
        assert data[0]["id"] == test_defect.id
        assert data[0]["name"] == test_defect.name
    
    def test_get_my_defect_success(self, client, test_engineer_user, test_defect):
        """Тест получения конкретного дефекта"""
        headers = {"Authorization": f"Bearer {client.post('/auth/token', data={'username': 'engineer', 'password': 'password'}).json()['access_token']}"}
        response = client.get(f"/defect/my-defects/{test_defect.id}", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == test_defect.id
        assert data["name"] == test_defect.name
        assert data["user_engineer_id"] == test_engineer_user.id
    
    def test_get_my_defect_not_found(self, client, test_engineer_user):
        """Тест получения несуществующего дефекта"""
        headers = {"Authorization": f"Bearer {client.post('/auth/token', data={'username': 'engineer', 'password': 'password'}).json()['access_token']}"}
        response = client.get("/defect/my-defects/999", headers=headers)
        assert response.status_code == 404
        assert "Дефект не найден" in response.json()["detail"]
    
    def test_remove_engineer_from_defect_success(self, client, test_admin_user, test_defect):
        """Тест успешного удаления инженера из дефекта"""
        headers = {"Authorization": f"Bearer {client.post('/auth/token', data={'username': 'admin', 'password': 'password'}).json()['access_token']}"}
        response = client.delete(f"/defect/{test_defect.id}/remove-engineer", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert data["defect_id"] == test_defect.id
        assert data["engineer_id"] == test_defect.user_engineer_id
        assert "успешно удален" in data["message"]

    def test_remove_engineer_from_defect_no_engineer(self, client, test_admin_user, test_defect_without_engineer):
        """Тест удаления инженера из дефекта без инженера"""

        headers = {"Authorization": f"Bearer {client.post('/auth/token', data={'username': 'admin', 'password': 'password'}).json()['access_token']}"}
        response = client.delete(f"/defect/{test_defect_without_engineer.id}/remove-engineer", headers=headers)
        assert response.status_code == 400
        assert "нет назначенного инженера" in response.json()["detail"]
    
    def test_assign_engineer_to_defect_success(self, client, test_admin_user, test_engineer_user, test_defect_without_engineer):
        """Тест успешного назначения инженера дефекту"""
        # Сначала убираем инженера из дефекта
        
        headers = {"Authorization": f"Bearer {client.post('/auth/token', data={'username': 'admin', 'password': 'password'}).json()['access_token']}"}
        engineer_data = {"engineer_id": test_engineer_user.id}
        response = client.patch(f"/defect/defects/{test_defect_without_engineer.id}/assign-engineer", json=engineer_data, headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert data["defect_id"] == test_defect_without_engineer.id
        assert data["engineer_id"] == test_engineer_user.id
        assert "успешно привязан" in data["message"]
    
    def test_assign_engineer_to_defect_not_found(self, client, test_admin_user, test_defect):
        """Тест назначения несуществующего инженера"""
        headers = {"Authorization": f"Bearer {client.post('/auth/token', data={'username': 'admin', 'password': 'password'}).json()['access_token']}"}
        engineer_data = {"engineer_id": 999}
        response = client.patch(f"/defect/defects/{test_defect.id}/assign-engineer", json=engineer_data, headers=headers)
        assert response.status_code == 404
    
    def test_assign_engineer_to_defect_wrong_company(self, client, test_admin_user, test_defect, test_engineer_user_without_company):
        """Тест назначения инженера из другой компании"""

        headers = {"Authorization": f"Bearer {client.post('/auth/token', data={'username': 'admin', 'password': 'password'}).json()['access_token']}"}
        engineer_data = {"engineer_id": test_engineer_user_without_company.id}
        response = client.patch(f"/defect/defects/{test_defect.id}/assign-engineer", json=engineer_data, headers=headers)
        assert response.status_code == 400

    
    def test_assign_engineer_to_defect_already_assigned(self, client, test_admin_user, test_defect, test_engineer_user):
        """Тест назначения уже назначенного инженера"""
        headers = {"Authorization": f"Bearer {client.post('/auth/token', data={'username': 'admin', 'password': 'password'}).json()['access_token']}"}
        engineer_data = {"engineer_id": test_engineer_user.id}
        response = client.patch(f"/defect/defects/{test_defect.id}/assign-engineer", json=engineer_data, headers=headers)
        assert response.status_code == 400
        assert "уже привязан к этому инженеру" in response.json()["detail"]
