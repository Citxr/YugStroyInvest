import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { companyAPI } from '../../services/api';
import './Companies.css';

const Companies = () => {
  const { isAdmin } = useAuth();
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showAddUserForm, setShowAddUserForm] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    user_id: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (isAdmin()) {
      fetchCompanies();
    }
  }, []);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      // Здесь будет API вызов для получения списка компаний
      // Пока используем моковые данные
      setCompanies([
        { id: 1, name: 'ООО "СтройМонтаж"', projects: 5, users: 12 },
        { id: 2, name: 'ЗАО "ЮгСтрой"', projects: 3, users: 8 },
        { id: 3, name: 'ИП "Строитель"', projects: 2, users: 4 },
        { id: 4, name: 'ООО "МегаСтрой"', projects: 7, users: 18 },
        { id: 5, name: 'АО "СтройИнвест"', projects: 4, users: 10 }
      ]);
    } catch (error) {
      console.error('Ошибка загрузки компаний:', error);
      setError('Ошибка загрузки данных');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCompany = async (e) => {
    e.preventDefault();
    try {
      setError('');
      setSuccess('');
      
      const response = await companyAPI.createCompany({
        name: formData.name
      });
      
      setSuccess('Компания успешно создана');
      setFormData({ name: '' });
      setShowCreateForm(false);
      fetchCompanies();
    } catch (error) {
      console.error('Ошибка создания компании:', error);
      setError(error.response?.data?.detail || 'Ошибка создания компании');
    }
  };

  const handleAddUserToCompany = async (e) => {
    e.preventDefault();
    try {
      setError('');
      setSuccess('');
      
      const response = await companyAPI.addUserToCompany(
        selectedCompany.id, 
        parseInt(formData.user_id)
      );
      
      setSuccess('Пользователь успешно добавлен в компанию');
      setFormData({ user_id: '' });
      setShowAddUserForm(false);
      setSelectedCompany(null);
      fetchCompanies();
    } catch (error) {
      console.error('Ошибка добавления пользователя:', error);
      setError(error.response?.data?.detail || 'Ошибка добавления пользователя');
    }
  };

  const handleDeleteCompany = async (companyId) => {
    if (window.confirm('Вы уверены, что хотите удалить эту компанию?')) {
      try {
        await companyAPI.deleteCompany(companyId);
        setSuccess('Компания успешно удалена');
        fetchCompanies();
      } catch (error) {
        console.error('Ошибка удаления компании:', error);
        setError(error.response?.data?.detail || 'Ошибка удаления компании');
      }
    }
  };

  const handleRemoveUserFromCompany = async (companyId, userId) => {
    if (window.confirm('Вы уверены, что хотите удалить пользователя из компании?')) {
      try {
        await companyAPI.removeUserFromCompany(companyId, userId);
        setSuccess('Пользователь успешно удален из компании');
        fetchCompanies();
      } catch (error) {
        console.error('Ошибка удаления пользователя:', error);
        setError(error.response?.data?.detail || 'Ошибка удаления пользователя');
      }
    }
  };

  if (!isAdmin()) {
    return (
      <div className="access-denied">
        <div className="access-denied-content">
          <span className="access-icon">🚫</span>
          <h2>Доступ запрещен</h2>
          <p>У вас нет прав для просмотра этой страницы</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="companies">
      <div className="companies-header">
        <h1 className="page-title">
          <span className="building-icon">🏢</span>
          Управление компаниями
        </h1>
        <button 
          className="btn btn-primary"
          onClick={() => setShowCreateForm(true)}
        >
          <span className="btn-icon">➕</span>
          Создать компанию
        </button>
      </div>

      {error && (
        <div className="error-message">
          <span className="error-icon">⚠️</span>
          {error}
        </div>
      )}

      {success && (
        <div className="success-message">
          <span className="success-icon">✅</span>
          {success}
        </div>
      )}

      <div className="companies-grid">
        {companies.map((company) => (
          <div key={company.id} className="company-card">
            <div className="company-header">
              <h3 className="company-name">{company.name}</h3>
              <div className="company-actions">
                <button 
                  className="btn btn-sm btn-outline"
                  onClick={() => {
                    setSelectedCompany(company);
                    setShowAddUserForm(true);
                  }}
                >
                  Добавить пользователя
                </button>
                <button 
                  className="btn btn-sm btn-danger"
                  onClick={() => handleDeleteCompany(company.id)}
                >
                  Удалить
                </button>
              </div>
            </div>
            
            <div className="company-stats">
              <div className="stat-item">
                <span className="stat-icon construction-icon">🏗️</span>
                <span className="stat-text">{company.projects} проектов</span>
              </div>
              <div className="stat-item">
                <span className="stat-icon">👥</span>
                <span className="stat-text">{company.users} пользователей</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Модальное окно создания компании */}
      {showCreateForm && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Создать новую компанию</h3>
              <button 
                className="modal-close"
                onClick={() => setShowCreateForm(false)}
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleCreateCompany} className="modal-form">
              <div className="form-group">
                <label htmlFor="company-name" className="form-label">
                  Название компании
                </label>
                <input
                  type="text"
                  id="company-name"
                  name="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="form-input"
                  required
                />
              </div>
              
              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setShowCreateForm(false)}>
                  Отмена
                </button>
                <button type="submit" className="btn btn-primary">
                  Создать
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Модальное окно добавления пользователя */}
      {showAddUserForm && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Добавить пользователя в компанию</h3>
              <button 
                className="modal-close"
                onClick={() => setShowAddUserForm(false)}
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleAddUserToCompany} className="modal-form">
              <div className="form-group">
                <label htmlFor="user-id" className="form-label">
                  ID пользователя
                </label>
                <input
                  type="number"
                  id="user-id"
                  name="user_id"
                  value={formData.user_id}
                  onChange={(e) => setFormData({ ...formData, user_id: e.target.value })}
                  className="form-input"
                  required
                />
              </div>
              
              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setShowAddUserForm(false)}>
                  Отмена
                </button>
                <button type="submit" className="btn btn-primary">
                  Добавить
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Companies;
