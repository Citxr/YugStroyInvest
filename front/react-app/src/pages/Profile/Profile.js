import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import './Profile.css';
import {companyAPI, defectAPI, projectAPI} from "../../services/api";

const Profile = () => {
  const { user, logout } = useAuth();
  const [setFormData] = useState({
    username: '',
    email: '',
    role: '',
    company_id: null
  });
  const [error] = useState('');
  const [success] = useState('');
  const [stats, setStats] = useState({
    projects_count: 0,
    defects_count: 0
  });

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || '',
        email: user.email || '',
        role: user.role || '',
        company_id: user.company_id || null
      });

      loadStats();
    }
  }, [user]);

  const loadStats = async () => {
    try {
      if (user.role === 'manager' || user.role === 'client') {
        const projects = await projectAPI.getMyProjects();
        let defectsCount = 0;
        let engineersSet = new Set();
        if (user?.company_id) {
          const company = await companyAPI.getCompanyInfo(user.company_id);
          const myProjectIds = new Set(projects.map(p => p.id));
          defectsCount = (company.projects || [])
            .filter(p => myProjectIds.has(p.id))
            .reduce((sum, p) => sum + (p.defects?.length || 0), 0);
          (company.projects || [])
            .filter(p => myProjectIds.has(p.id))
            .forEach(p => (p.engineers || []).forEach(e => engineersSet.add(e.id)));
        }
        setStats(prev => ({ ...prev, projects_count: projects.length,defects_count: defectsCount }));

      } else if (user.role === 'engineer') {
        const defects = await defectAPI.getMyDefects();
        const projectIds = new Set((defects || []).map(d => d.project_id));
        setStats(prev => ({ ...prev, projects_count:projectIds.size,defects_count: defects.length }));
      }
      else if (user.role === 'admin') {
        const all = await companyAPI.getAllCompanies();
        const companyIds = (all || []).map(c => c.id);
        const details = await Promise.all(companyIds.map(id => companyAPI.getCompanyInfo(id)));
        const projectsCount = details.reduce((sum, c) => sum + (c.projects?.length || 0), 0);
        const defectsCount = details.reduce(
          (sum, c) => sum + (c.projects || []).reduce((s, p) => s + (p.defects?.length || 0), 0),
          0
        );
        setStats(prev => ({ ...prev, projects_count:projectsCount,defects_count: defectsCount }));
      }
    } catch (error) {
    }
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
      client: 'Просмотр информации о вашей компании'
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
            <button
              className="btn btn-primary"
            >
              <span className="btn-icon">✏️</span>
              Редактировать
            </button>
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
                  <span className="detail-value">{user.username || 'Не указано'}</span>
                </div>

                <div className="detail-item">
                  <label className="detail-label">Email</label>
                  <span className="detail-value">{user.email || 'Не указано'}</span>
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
                    <span className="detail-value">
                      {user.company_id ? user.company_id : 'Не назначена'}
                    </span>
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
                    <div className="stat-number">{stats.projects_count}</div>
                    <div className="stat-label">Проектов</div>
                  </div>
                </div>
                <div className="stat-item">
                  <span className="stat-icon">🔧</span>
                  <div className="stat-content">
                    <div className="stat-number">{stats.defects_count}</div>
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
