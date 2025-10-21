import pytest
from back.models import User, Company, Project, Defect, UserRole
from back.auth.auth import get_password_hash

class TestUserModel:
    """Тесты для модели User"""
    
    def test_user_creation(self, db_session, test_company):
        """Тест создания пользователя"""
        user = User(
            username="testuser",
            email="test@example.com",
            hashed_password=get_password_hash("password"),
            role=UserRole.ENGINEER,
            company_id=test_company.id
        )
        db_session.add(user)
        db_session.commit()
        db_session.refresh(user)
        
        assert user.id is not None
        assert user.username == "testuser"
        assert user.email == "test@example.com"
        assert user.role == UserRole.ENGINEER
        assert user.company_id == test_company.id
    
    def test_user_relationships(self, db_session, test_company):
        """Тест связей пользователя"""
        user = User(
            username="testuser",
            email="test@example.com",
            hashed_password=get_password_hash("password"),
            role=UserRole.MANAGER,
            company_id=test_company.id
        )
        db_session.add(user)
        db_session.commit()
        db_session.refresh(user)
        
        # Проверяем связь с компанией
        assert user.company is not None
        assert user.company.id == test_company.id
        assert user.company.name == test_company.name

class TestCompanyModel:
    """Тесты для модели Company"""
    
    def test_company_creation(self, db_session):
        """Тест создания компании"""
        company = Company(name="Test Company")
        db_session.add(company)
        db_session.commit()
        db_session.refresh(company)
        
        assert company.id is not None
        assert company.name == "Test Company"
    
    def test_company_relationships(self, db_session, test_admin_user):
        """Тест связей компании"""
        company = Company(name="Test Company")
        db_session.add(company)
        db_session.commit()
        db_session.refresh(company)
        
        # Добавляем пользователя в компанию
        test_admin_user.company_id = company.id
        db_session.commit()
        
        # Проверяем связь с пользователями
        assert len(company.users) == 1
        assert company.users[0].id == test_admin_user.id

class TestProjectModel:
    """Тесты для модели Project"""
    
    def test_project_creation(self, db_session, test_company, test_manager_user):
        """Тест создания проекта"""
        project = Project(
            name="Test Project",
            user_manager_id=test_manager_user.id,
            company_id=test_company.id
        )
        db_session.add(project)
        db_session.commit()
        db_session.refresh(project)
        
        assert project.id is not None
        assert project.name == "Test Project"
        assert project.user_manager_id == test_manager_user.id
        assert project.company_id == test_company.id
    
    def test_project_relationships(self, db_session, test_company, test_manager_user, test_engineer_user):
        """Тест связей проекта"""
        project = Project(
            name="Test Project",
            user_manager_id=test_manager_user.id,
            company_id=test_company.id
        )
        db_session.add(project)
        
        # Добавляем инженера в проект
        project.engineers.append(test_engineer_user)
        db_session.commit()
        db_session.refresh(project)
        
        # Проверяем связи
        assert project.manager.id == test_manager_user.id
        assert project.company.id == test_company.id
        assert len(project.engineers) == 1
        assert project.engineers[0].id == test_engineer_user.id

class TestDefectModel:
    """Тесты для модели Defect"""
    
    def test_defect_creation(self, db_session, test_project, test_engineer_user):
        """Тест создания дефекта"""
        defect = Defect(
            name="Test Defect",
            project_id=test_project.id,
            user_engineer_id=test_engineer_user.id
        )
        db_session.add(defect)
        db_session.commit()
        db_session.refresh(defect)
        
        assert defect.id is not None
        assert defect.name == "Test Defect"
        assert defect.project_id == test_project.id
        assert defect.user_engineer_id == test_engineer_user.id
    
    def test_defect_relationships(self, db_session, test_project, test_engineer_user):
        """Тест связей дефекта"""
        defect = Defect(
            name="Test Defect",
            project_id=test_project.id,
            user_engineer_id=test_engineer_user.id
        )
        db_session.add(defect)
        db_session.commit()
        db_session.refresh(defect)
        
        # Проверяем связи
        assert defect.engineer.id == test_engineer_user.id
        assert defect.project.id == test_project.id
        assert defect.project.name == test_project.name

class TestUserRoleEnum:
    """Тесты для enum UserRole"""
    
    def test_user_role_values(self):
        """Тест значений ролей пользователей"""
        assert UserRole.ADMIN.value == "admin"
        assert UserRole.MANAGER.value == "manager"
        assert UserRole.ENGINEER.value == "engineer"
        assert UserRole.CLIENT.value == "client"
    
    def test_user_role_comparison(self):
        """Тест сравнения ролей"""
        assert UserRole.ADMIN != UserRole.MANAGER
        assert UserRole.ENGINEER == UserRole.ENGINEER
