import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import './Profile.css';

const Profile = () => {
  const { user, logout } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    role: '',
    company_id: null
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || '',
        email: user.email || '',
        role: user.role || '',
        company_id: user.company_id || null
      });
    }
  }, [user]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSave = () => {
    // Здесь будет логика сохранения изменений профиля
    setSuccess('Профиль успешно обновлен');
    setIsEditing(false);
  };

  const handleCancel = () => {
    setFormData({
      username: user.username || '',
      email: user.email || '',
      role: user.role || '',
      company_id: user.company_id || null
    });
    setIsEditing(false);
    setError('');
    setSuccess('');
  };

  const getRoleLabel = (role) => {
    const roleLabels = {
      admin: 'Администратор',
      manager: 'Менеджер',
      engineer: 'Инженер',
      client: 'Клиент'
    };
    return roleLabels[role] || role;
  };

  const getRoleIcon = (role) => {
    const roleIcons = {
      admin: '👑',
      manager: '👷‍♂️',
      engineer: '🔧',
      client: '👤'
    };
    return roleIcons[role] || '👤';
  };

  const getRoleDescription = (role) => {
    const descriptions = {
      admin: 'Полный доступ ко всем функциям системы',
      manager: 'Управление проектами и назначение инженеров',
      engineer: 'Работа с дефектами и проектами',
      client: 'Просмотр информации о проектах'
    };
    return descriptions[role] || '';
  };

  if (!user) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="profile">
      <div className="profile-header">
        <h1 className="page-title">
          <span className="profile-icon">👤</span>
          Мой профиль
        </h1>
        <div className="profile-actions">
          {!isEditing ? (
            <button 
              className="btn btn-primary"
              onClick={() => setIsEditing(true)}
            >
              <span className="btn-icon">✏️</span>
              Редактировать
            </button>
          ) : (
            <div className="edit-actions">
              <button 
                className="btn btn-outline"
                onClick={handleCancel}
              >
                Отмена
              </button>
              <button 
                className="btn btn-success"
                onClick={handleSave}
              >
                Сохранить
              </button>
            </div>
          )}
        </div>
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

      <div className="profile-content">
        <div className="profile-card">
          <div className="profile-avatar">
            <div className="avatar-circle">
              <span className="avatar-icon">{getRoleIcon(user.role)}</span>
            </div>
            <div className="avatar-info">
              <h2 className="user-name">{user.username}</h2>
              <p className="user-role">{getRoleLabel(user.role)}</p>
            </div>
          </div>

          <div className="profile-details">
            <div className="detail-section">
              <h3 className="section-title">Основная информация</h3>
              <div className="detail-grid">
                <div className="detail-item">
                  <label className="detail-label">Имя пользователя</label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                      className="form-input"
                    />
                  ) : (
                    <span className="detail-value">{user.username}</span>
                  )}
                </div>

                <div className="detail-item">
                  <label className="detail-label">Email</label>
                  {isEditing ? (
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="form-input"
                    />
                  ) : (
                    <span className="detail-value">{user.email}</span>
                  )}
                </div>

                <div className="detail-item">
                  <label className="detail-label">Роль</label>
                  <span className="detail-value role-badge">
                    <span className="role-icon">{getRoleIcon(user.role)}</span>
                    {getRoleLabel(user.role)}
                  </span>
                </div>

                <div className="detail-item">
                  <label className="detail-label">ID компании</label>
                  {isEditing ? (
                    <input
                      type="number"
                      name="company_id"
                      value={formData.company_id || ''}
                      onChange={handleChange}
                      className="form-input"
                    />
                  ) : (
                    <span className="detail-value">
                      {user.company_id ? user.company_id : 'Не назначена'}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="detail-section">
              <h3 className="section-title">Описание роли</h3>
              <div className="role-description">
                <p>{getRoleDescription(user.role)}</p>
              </div>
            </div>

            <div className="detail-section">
              <h3 className="section-title">Статистика</h3>
              <div className="stats-grid">
                <div className="stat-item">
                  <span className="stat-icon">📅</span>
                  <div className="stat-content">
                    <div className="stat-number">-</div>
                    <div className="stat-label">Дней в системе</div>
                  </div>
                </div>
                <div className="stat-item">
                  <span className="stat-icon">🏗️</span>
                  <div className="stat-content">
                    <div className="stat-number">-</div>
                    <div className="stat-label">Проектов</div>
                  </div>
                </div>
                <div className="stat-item">
                  <span className="stat-icon">🔧</span>
                  <div className="stat-content">
                    <div className="stat-number">-</div>
                    <div className="stat-label">Дефектов</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="profile-actions-card">
          <h3 className="section-title">Действия</h3>
          <div className="actions-list">
            <button className="action-btn">
              <span className="action-icon">🔒</span>
              <span className="action-text">Изменить пароль</span>
            </button>
            <button className="action-btn">
              <span className="action-icon">📊</span>
              <span className="action-text">Моя статистика</span>
            </button>
            <button className="action-btn">
              <span className="action-icon">⚙️</span>
              <span className="action-text">Настройки</span>
            </button>
            <button 
              className="action-btn danger"
              onClick={logout}
            >
              <span className="action-icon">🚪</span>
              <span className="action-text">Выйти из системы</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
