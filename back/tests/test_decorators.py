import pytest
from unittest.mock import Mock, AsyncMock
from back.decorators import require_role
from back.models import UserRole

class TestRequireRoleDecorator:
    """Тесты для декоратора require_role"""

    @pytest.mark.asyncio
    async def test_require_single_role_success(self):
        """Тест успешной проверки одной роли"""
        @require_role(UserRole.ADMIN)
        async def test_function(current_user=None):
            return "success"
        
        # Создаем мок пользователя с ролью ADMIN
        mock_user = Mock()
        mock_user.role = UserRole.ADMIN
        
        # Тестируем функцию
        result = await test_function(current_user=mock_user)
        assert result == "success"

    @pytest.mark.asyncio
    async def test_require_single_role_failure(self):
        """Тест неудачной проверки одной роли"""
        @require_role(UserRole.ADMIN)
        async def test_function(current_user=None):
            return "success"
        
        # Создаем мок пользователя с ролью ENGINEER
        mock_user = Mock()
        mock_user.role = UserRole.ENGINEER
        
        # Тестируем функцию
        with pytest.raises(Exception) as exc_info:
            await test_function(current_user=mock_user)
        
        assert "Только admin может выполнять это действие" in str(exc_info.value)

    @pytest.mark.asyncio
    async def test_require_multiple_roles_success(self):
        """Тест успешной проверки нескольких ролей"""
        @require_role([UserRole.ADMIN, UserRole.MANAGER])
        async def test_function(current_user=None):
            return "success"
        
        # Тестируем с ролью ADMIN
        mock_user_admin = Mock()
        mock_user_admin.role = UserRole.ADMIN
        result = await test_function(current_user=mock_user_admin)
        assert result == "success"
        
        # Тестируем с ролью MANAGER
        mock_user_manager = Mock()
        mock_user_manager.role = UserRole.MANAGER
        result = await test_function(current_user=mock_user_manager)
        assert result == "success"

    @pytest.mark.asyncio
    async def test_require_multiple_roles_failure(self):
        """Тест неудачной проверки нескольких ролей"""
        @require_role([UserRole.ADMIN, UserRole.MANAGER])
        async def test_function(current_user=None):
            return "success"
        
        # Создаем мок пользователя с ролью ENGINEER
        mock_user = Mock()
        mock_user.role = UserRole.ENGINEER
        
        # Тестируем функцию
        with pytest.raises(Exception) as exc_info:
            await test_function(current_user=mock_user)
        
        assert "Только admin, manager могут выполнять это действие" in str(exc_info.value)

    @pytest.mark.asyncio
    async def test_require_role_no_user(self):
        """Тест проверки роли без пользователя"""
        @require_role(UserRole.ADMIN)
        async def test_function(current_user=None):
            return "success"
        
        # Тестируем функцию без пользователя
        with pytest.raises(Exception) as exc_info:
            await test_function(current_user=None)
        
        assert "Только admin может выполнять это действие" in str(exc_info.value)

    @pytest.mark.asyncio
    async def test_require_role_none_user(self):
        """Тест проверки роли с None пользователем"""
        @require_role(UserRole.ADMIN)
        async def test_function(current_user=None):
            return "success"
        
        # Тестируем функцию с None пользователем
        with pytest.raises(Exception) as exc_info:
            await test_function(current_user=None)
        
        assert "Только admin может выполнять это действие" in str(exc_info.value)

    @pytest.mark.asyncio
    async def test_require_role_with_other_parameters(self):
        """Тест декоратора с другими параметрами функции"""
        @require_role(UserRole.ADMIN)
        async def test_function(param1, param2, current_user=None):
            return f"{param1}_{param2}"
        
        # Создаем мок пользователя с ролью ADMIN
        mock_user = Mock()
        mock_user.role = UserRole.ADMIN
        
        # Тестируем функцию с параметрами
        result = await test_function("test1", "test2", current_user=mock_user)
        assert result == "test1_test2"

    @pytest.mark.asyncio
    def test_require_role_preserves_function_metadata(self):
        """Тест сохранения метаданных функции"""
        @require_role(UserRole.ADMIN)
        async def test_function(current_user=None):
            """Test function docstring"""
            return "success"
        
        # Проверяем, что метаданные сохранены
        assert test_function.__name__ == "test_function"
        assert test_function.__doc__ == "Test function docstring"
