# Инструкции по запуску фронтенда

## Быстрый старт

1. **Установите зависимости:**
   ```bash
   cd front/react-app
   npm install
   ```

2. **Создайте файл .env:**
   ```bash
   echo "REACT_APP_API_URL=http://localhost:8000" > .env
   ```

3. **Запустите приложение:**
   ```bash
   npm start
   ```

4. **Откройте браузер:**
   - Перейдите на http://localhost:3000
   - Зарегистрируйтесь или войдите в систему

## Тестовые пользователи

Для тестирования создайте пользователей с разными ролями:

### Администратор
- Username: admin
- Email: admin@example.com
- Role: admin
- Password: admin123

### Менеджер
- Username: manager
- Email: manager@example.com
- Role: manager
- Password: manager123

### Инженер
- Username: engineer
- Email: engineer@example.com
- Role: engineer
- Password: engineer123

### Клиент
- Username: client
- Email: client@example.com
- Role: client
- Password: client123

## Возможные проблемы

### Ошибка подключения к API
- Убедитесь, что бэкенд запущен на порту 8000
- Проверьте URL в файле .env
- Проверьте CORS настройки в бэкенде

### Ошибки сборки
- Удалите папку node_modules и package-lock.json
- Выполните `npm install` заново
- Проверьте версию Node.js (требуется 16+)

### Проблемы с маршрутизацией
- Убедитесь, что используете React Router DOM 6+
- Проверьте настройки в App.js

## Настройка для продакшена

1. **Соберите приложение:**
   ```bash
   npm run build
   ```

2. **Настройте веб-сервер:**
   - Скопируйте содержимое папки `build/` на веб-сервер
   - Настройте редирект всех запросов на `index.html`

3. **Настройте переменные окружения:**
   ```env
   REACT_APP_API_URL=https://your-api-domain.com
   ```
