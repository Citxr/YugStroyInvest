# Устранение проблем с фронтендом

## Исправленные ошибки

### 1. Ошибки линтера в Projects.js:
- ✅ Удалена неиспользуемая переменная `user`
- ✅ Добавлен `useCallback` для `fetchProjects`
- ✅ Исправлены зависимости в `useEffect`
- ✅ Удалены неиспользуемые переменные `response`
- ✅ Заменены прямые axios вызовы на API сервисы

### 2. Ошибки линтера в Defects.js:
- ✅ Добавлен `useCallback` для `fetchDefects`
- ✅ Исправлены зависимости в `useEffect`
- ✅ Удалены неиспользуемые переменные `response`
- ✅ Заменены прямые axios вызовы на API сервисы

## Настройка для работы с бэкендом

### 1. Создайте файл .env в папке front/react-app/:
```env
REACT_APP_API_URL=http://localhost:8000
```

### 2. Убедитесь, что бэкенд запущен:
```bash
cd back
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 3. Запустите фронтенд:
```bash
cd front/react-app
npm install
npm start
```

## Возможные проблемы и решения

### Проблема: CORS ошибки
**Решение:** Добавьте в бэкенд (main.py):
```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Проблема: 401 Unauthorized
**Решение:** 
1. Проверьте, что токен сохраняется в localStorage
2. Убедитесь, что бэкенд принимает Bearer токены
3. Проверьте настройки аутентификации в бэкенде

### Проблема: 404 Not Found
**Решение:**
1. Проверьте URL в .env файле
2. Убедитесь, что бэкенд запущен на правильном порту
3. Проверьте правильность API эндпоинтов

### Проблема: Ошибки сборки
**Решение:**
```bash
# Очистите кэш
rm -rf node_modules package-lock.json
npm install

# Или используйте yarn
yarn install
```

## Тестирование API

### Проверка через Swagger:
1. Откройте http://localhost:8000/docs
2. Протестируйте эндпоинты аутентификации
3. Создайте тестового пользователя
4. Получите токен и протестируйте другие эндпоинты

### Проверка через фронтенд:
1. Зарегистрируйтесь как администратор
2. Создайте компанию
3. Добавьте пользователей в компанию
4. Создайте проект
5. Назначьте инженеров на проект
6. Создайте дефекты

## Структура API запросов

### Аутентификация:
```javascript
// Регистрация
POST /auth/register
{
  "username": "admin",
  "email": "admin@example.com", 
  "password": "admin123",
  "role": "admin"
}

// Вход
POST /auth/token
FormData: username=admin&password=admin123

// Получение профиля
GET /auth/users/me/
Headers: Authorization: Bearer <token>
```

### Компании:
```javascript
// Создание компании
POST /company/create
Headers: Authorization: Bearer <token>
{
  "name": "ООО СтройМонтаж"
}

// Добавление пользователя
POST /company/1/users
Headers: Authorization: Bearer <token>
{
  "user_id": 2
}
```

### Проекты:
```javascript
// Создание проекта
POST /project
Headers: Authorization: Bearer <token>
{
  "name": "Жилой комплекс",
  "company_id": 1,
  "engineer_ids": [1, 2]
}

// Получение проектов менеджера
GET /project/my-projects
Headers: Authorization: Bearer <token>
```

### Дефекты:
```javascript
// Создание дефекта
POST /defect
Headers: Authorization: Bearer <token>
{
  "name": "Трещина в стене",
  "project_id": 1
}

// Получение дефектов инженера
GET /defect/my-defects
Headers: Authorization: Bearer <token>
```

## Логирование и отладка

### Включите логирование в браузере:
1. Откройте Developer Tools (F12)
2. Перейдите на вкладку Network
3. Проверьте запросы к API
4. Проверьте Console на наличие ошибок

### Проверка состояния приложения:
```javascript
// В консоли браузера
console.log(localStorage.getItem('token'));
console.log(JSON.parse(localStorage.getItem('user')));
```

## Готовые тестовые данные

### Пользователи для тестирования:
```javascript
// Администратор
{
  "username": "admin",
  "email": "admin@example.com",
  "password": "admin123",
  "role": "admin"
}

// Менеджер
{
  "username": "manager", 
  "email": "manager@example.com",
  "password": "manager123",
  "role": "manager"
}

// Инженер
{
  "username": "engineer",
  "email": "engineer@example.com", 
  "password": "engineer123",
  "role": "engineer"
}
```

Теперь фронтенд должен работать без ошибок линтера и корректно взаимодействовать с бэкендом!
