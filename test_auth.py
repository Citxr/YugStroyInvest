# Тестовый скрипт для проверки аутентификации

import requests
import json

# Базовый URL
BASE_URL = "http://localhost:8000"

def test_auth():
    print("=== Тест аутентификации ===")
    
    # 1. Регистрация тестового пользователя
    print("\n1. Регистрация пользователя...")
    register_data = {
        "username": "testuser",
        "email": "test@example.com",
        "password": "testpass123",
        "role": "admin"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/auth/register", json=register_data)
        print(f"Статус регистрации: {response.status_code}")
        if response.status_code == 200:
            print("Пользователь зарегистрирован успешно")
        else:
            print(f"Ошибка регистрации: {response.text}")
    except Exception as e:
        print(f"Ошибка при регистрации: {e}")
    
    # 2. Вход в систему
    print("\n2. Вход в систему...")
    login_data = {
        "username": "testuser",
        "password": "testpass123"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/auth/token", data=login_data)
        print(f"Статус входа: {response.status_code}")
        
        if response.status_code == 200:
            token_data = response.json()
            token = token_data["access_token"]
            print(f"Токен получен: {token[:20]}...")
            
            # 3. Проверка токена
            print("\n3. Проверка токена...")
            headers = {
                "Authorization": f"Bearer {token}"
            }
            
            response = requests.get(f"{BASE_URL}/auth/users/me/", headers=headers)
            print(f"Статус проверки токена: {response.status_code}")
            
            if response.status_code == 200:
                user_data = response.json()
                print(f"Пользователь найден: {user_data['username']} ({user_data['role']})")
            else:
                print(f"Ошибка проверки токена: {response.text}")
        else:
            print(f"Ошибка входа: {response.text}")
            
    except Exception as e:
        print(f"Ошибка при входе: {e}")

if __name__ == "__main__":
    test_auth()
