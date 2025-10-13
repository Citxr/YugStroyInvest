import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import './Dashboard.css';

const Dashboard = () => {
  const { user, isAdmin, isManager, isEngineer } = useAuth();
  const [stats, setStats] = useState({
    companies: 0,
    projects: 0,
    defects: 0,
    engineers: 0
  });
  const [loading, setLoading] = useState(true);
  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Здесь можно добавить API вызовы для получения статистики
      // Пока используем моковые данные
      setStats({
        companies: 5,
        projects: 12,
        defects: 8,
        engineers: 15
      });

      setRecentActivity([
        { id: 1, type: 'project', message: 'Создан новый проект "Жилой комплекс"', time: '2 часа назад' },
        { id: 2, type: 'defect', message: 'Исправлен дефект в проекте "Офисное здание"', time: '4 часа назад' },
        { id: 3, type: 'engineer', message: 'Добавлен новый инженер в команду', time: '1 день назад' },
        { id: 4, type: 'company', message: 'Зарегистрирована новая компания', time: '2 дня назад' }
      ]);
    } catch (error) {
      console.error('Ошибка загрузки данных:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRoleDescription = () => {
    switch (user?.role) {
      case 'admin':
        return 'Вы имеете полный доступ ко всем функциям системы';
      case 'manager':
        return 'Вы можете управлять проектами и назначать инженеров';
      case 'engineer':
        return 'Вы можете работать с дефектами и проектами';
      case 'client':
        return 'Вы можете просматривать информацию о проектах';
      default:
        return '';
    }
  };

  const getRoleIcon = () => {
    switch (user?.role) {
      case 'admin':
        return '👑';
      case 'manager':
        return '👷‍♂️';
      case 'engineer':
        return '🔧';
      case 'client':
        return '👤';
      default:
        return '👤';
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div className="welcome-section">
          <h1 className="welcome-title">
            Добро пожаловать, {user?.username}! {getRoleIcon()}
          </h1>
          <p className="welcome-description">{getRoleDescription()}</p>
        </div>
      </div>

      <div className="dashboard-content">
        {/* Статистика */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon building-icon">🏢</div>
            <div className="stat-content">
              <div className="stat-number">{stats.companies}</div>
              <div className="stat-label">Компаний</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon construction-icon">🏗️</div>
            <div className="stat-content">
              <div className="stat-number">{stats.projects}</div>
              <div className="stat-label">Проектов</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon tool-icon">🔧</div>
            <div className="stat-content">
              <div className="stat-number">{stats.defects}</div>
              <div className="stat-label">Дефектов</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">👷‍♂️</div>
            <div className="stat-content">
              <div className="stat-number">{stats.engineers}</div>
              <div className="stat-label">Инженеров</div>
            </div>
          </div>
        </div>

        {/* Быстрые действия */}
        <div className="quick-actions">
          <h2 className="section-title">Быстрые действия</h2>
          <div className="actions-grid">
            {isAdmin() && (
              <>
                <button className="action-btn">
                  <span className="action-icon">🏢</span>
                  <span className="action-text">Управление компаниями</span>
                </button>
                <button className="action-btn">
                  <span className="action-icon">👥</span>
                  <span className="action-text">Добавить пользователя</span>
                </button>
              </>
            )}
            
            {isManager() && (
              <>
                <button className="action-btn">
                  <span className="action-icon">🏗️</span>
                  <span className="action-text">Создать проект</span>
                </button>
                <button className="action-btn">
                  <span className="action-icon">👷‍♂️</span>
                  <span className="action-text">Назначить инженера</span>
                </button>
              </>
            )}
            
            {isEngineer() && (
              <>
                <button className="action-btn">
                  <span className="action-icon">🔧</span>
                  <span className="action-text">Создать дефект</span>
                </button>
                <button className="action-btn">
                  <span className="action-icon">📋</span>
                  <span className="action-text">Мои задачи</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Последняя активность */}
        <div className="recent-activity">
          <h2 className="section-title">Последняя активность</h2>
          <div className="activity-list">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="activity-item">
                <div className="activity-icon">
                  {activity.type === 'project' && '🏗️'}
                  {activity.type === 'defect' && '🔧'}
                  {activity.type === 'engineer' && '👷‍♂️'}
                  {activity.type === 'company' && '🏢'}
                </div>
                <div className="activity-content">
                  <div className="activity-message">{activity.message}</div>
                  <div className="activity-time">{activity.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
