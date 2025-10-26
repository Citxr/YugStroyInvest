import axios from 'axios';

// Базовый URL для API (настройте под ваш бэкенд)
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// Создаем экземпляр axios с базовой конфигурацией
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Интерцептор для добавления токена авторизации
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Интерцептор для обработки ошибок
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Токен истек или недействителен
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// API сервисы
export const authAPI = {
  // Регистрация пользователя
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  // Вход в систему
  login: async (username, password) => {
    const formData = new FormData();
    formData.append('username', username);
    formData.append('password', password);

    const response = await api.post('/auth/token', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    return response.data;
  },

  // Получение информации о текущем пользователе
  getCurrentUser: async () => {
    const response = await api.get('/auth/users/me/');
    return response.data;
  },
};

export const companyAPI = {
  // Создание компании
  createCompany: async (companyData) => {
    const response = await api.post('/company/create', companyData);
    return response.data;
  },

  // Удаление компании
  deleteCompany: async (companyId) => {
    const response = await api.delete(`/company/${companyId}`);
    return response.data;
  },

  // Добавление пользователя в компанию
  addUserToCompany: async (companyId, userId) => {
    const response = await api.post(`/company/${companyId}/users`, {
      user_id: userId,
    });
    return response.data;
  },

  // Удаление пользователя из компании
  removeUserFromCompany: async (companyId, userId) => {
    const response = await api.delete(`/company/${companyId}/users/${userId}`);
    return response.data;
  },

  // Получение полной информации о компании
  getCompanyInfo: async (companyId) => {
    const response = await api.get(`/company/my-companies?company_id=${companyId}`);
    return response.data;
  },

  // Список всех компаний (для админа)
  getAllCompanies: async () => {
    const response = await api.get('/company/all');
    return response.data;
  },
};

export const projectAPI = {
  // Создание проекта
  createProject: async (projectData) => {
    const response = await api.post('/project', projectData);
    return response.data;
  },

  // Удаление проекта
  deleteProject: async (projectId) => {
    const response = await api.delete(`/project/${projectId}`);
    return response.data;
  },

  // Получение проектов менеджера
  getMyProjects: async (skip = 0, limit = 100) => {
    const response = await api.get(`/project/my-projects?skip=${skip}&limit=${limit}`);
    return response.data;
  },

  // Получение конкретного проекта
  getMyProject: async (projectId) => {
    const response = await api.get(`/project/my-projects/${projectId}`);
    return response.data;
  },

  // Удаление менеджера из проекта
  removeManagerFromProject: async (projectId) => {
    const response = await api.delete(`/project/${projectId}/manager`);
    return response.data;
  },

  // Назначение менеджера на проект
  assignProjectToManager: async (projectId, managerId) => {
    const response = await api.patch(`/project/${projectId}/assign-manager`, {
      manager_id: managerId,
    });
    return response.data;
  },

  // Добавление инженеров в проект
  addEngineersToProject: async (projectId, engineerIds) => {
    const response = await api.post(`/project/${projectId}/engineers`, {
      engineer_ids: engineerIds,
    });
    return response.data;
  },

  // Удаление инженеров из проекта
  removeEngineersFromProject: async (projectId, engineerIds) => {
    const response = await api.delete(`/project/${projectId}/engineers`, {
      data: { engineer_ids: engineerIds },
    });
    return response.data;
  },
};

export const defectAPI = {
  // Создание дефекта
  createDefect: async (defectData) => {
    const response = await api.post('/defect', defectData);
    return response.data;
  },

  // Удаление дефекта
  deleteDefect: async (defectId) => {
    const response = await api.delete(`/defect/${defectId}`);
    return response.data;
  },

  // Получение дефектов инженера
  getMyDefects: async (skip = 0, limit = 100) => {
    const response = await api.get(`/defect/my-defects?skip=${skip}&limit=${limit}`);
    return response.data;
  },

  // Получение конкретного дефекта
  getMyDefect: async (defectId) => {
    const response = await api.get(`/defect/my-defects/${defectId}`);
    return response.data;
  },

  // Удаление инженера из дефекта
  removeEngineerFromDefect: async (defectId) => {
    const response = await api.delete(`/defect/${defectId}/remove-engineer`);
    return response.data;
  },

  // Назначение инженера на дефект
  assignEngineerToDefect: async (defectId, engineerId) => {
    const response = await api.patch(`/defect/defects/${defectId}/assign-engineer`, {
      engineer_id: engineerId,
    });
    return response.data;
  },
};

export default api;
