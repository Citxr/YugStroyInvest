import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { companyAPI, projectAPI, defectAPI } from '../../services/api';
import './Dashboard.css';

const Dashboard = () => {
  const { user, isAdmin, isManager, isEngineer, isClient } = useAuth();
  const navigate = useNavigate();
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

      if (isAdmin()) {
        const all = await companyAPI.getAllCompanies();
        const companyIds = (all || []).map(c => c.id);
        const details = await Promise.all(companyIds.map(id => companyAPI.getCompanyInfo(id)));

        const companiesCount = companyIds.length;
        const projectsCount = details.reduce((sum, c) => sum + (c.projects?.length || 0), 0);
        const defectsCount = details.reduce(
          (sum, c) => sum + (c.projects || []).reduce((s, p) => s + (p.defects?.length || 0), 0),
          0
        );
        const engineersCount = details.reduce((sum, c) => sum + (c.engineers?.length || 0), 0);

        setStats({
          companies: companiesCount,
          projects: projectsCount,
          defects: defectsCount,
          engineers: engineersCount,
        });
      } else if (isManager()) {
        const projects = await projectAPI.getMyProjects(0, 100);
        // Для дефектов суммируем по проектам через company/my-companies, т.к. отдельного API нет
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
        setStats({
          companies: 1,
          projects: projects.length,
          defects: defectsCount,
          engineers: engineersSet.size,
        });
      } else if (isEngineer()) {
        const myDefects = await defectAPI.getMyDefects(0, 100);
        const projectIds = new Set((myDefects || []).map(d => d.project_id));
        setStats({
          companies: 0,
          projects: projectIds.size,
          defects: (myDefects || []).length,
          engineers: 0,
        });
      } else if (isClient()) {
        if (user?.company_id) {
          const company = await companyAPI.getCompanyInfo(user.company_id);
          const projects = company.projects || [];
          const defectsCount = projects.reduce((sum, p) => sum + (p.defects?.length || 0), 0);
          const engineersCount = (company.engineers || []).length;
          setStats({
            companies: 1,
            projects: projects.length,
            defects: defectsCount,
            engineers: engineersCount,
          });
        } else {
          setStats({ companies: 0, projects: 0, defects: 0, engineers: 0 });
        }
      } else {
        setStats({ companies: 0, projects: 0, defects: 0, engineers: 0 });
      }

      setRecentActivity([]);
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
        <div className="stats-grid">
          {!isEngineer() && (
            <div className="stat-card">
              <div className="stat-icon building-icon">🏢</div>
              <div className="stat-content">
                <div className="stat-number">{stats.companies}</div>
                <div className="stat-label">Компаний</div>
              </div>
            </div>
          )}

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

          {!isEngineer() && (
            <div className="stat-card">
              <div className="stat-icon">👷‍♂️</div>
              <div className="stat-content">
                <div className="stat-number">{stats.engineers}</div>
                <div className="stat-label">Инженеров</div>
              </div>
            </div>
          )}
        </div>

        <div className="quick-actions">
          <h2 className="section-title">Быстрые действия</h2>
          <div className="actions-grid">
            {isAdmin() && (
              <>
                <button
                    className="action-btn"
                    onClick={() => navigate('/companies')}
                >
                  <span className="action-icon">🏢</span>
                  <span className="action-text">Управление компаниями</span>
                </button>
                <button
                    className="action-btn"
                    onClick={() => navigate('/projects')}
                >
                  <span className="action-icon">🏗️</span>
                  <span className="action-text">Управление проектами</span>
                </button>
                <button
                    className="action-btn"
                    onClick={() => navigate('/defects')}
                >
                  <span className="action-icon">🔧</span>
                  <span className="action-text">Управление дефектами</span>
                </button>
              </>
            )}
            
            {isManager() && (
              <>
                <button
                  className="action-btn"
                  onClick={() => navigate('/projects')}
                >
                  <span className="action-icon">🏗️</span>
                  <span className="action-text">Создать проект</span>
                </button>
                <button
                  className="action-btn"
                  onClick={() => navigate('/defects')}
                >
                  <span className="action-icon">👷‍♂️</span>
                  <span className="action-text">Назначить инженера</span>
                </button>
              </>
            )}
            
            {isEngineer() && (
              <>
                <button
                  className="action-btn"
                  onClick={() => navigate('/defects?create=1')}
                >
                  <span className="action-icon">🔧</span>
                  <span className="action-text">Создать дефект</span>
                </button>
                <button
                  className="action-btn"
                  onClick={() => navigate('/defects')}
                >
                  <span className="action-icon">📋</span>
                  <span className="action-text">Мои задачи</span>
                </button>
              </>
            )}

            {isClient() && (
              <>
                <button
                  className="action-btn"
                  onClick={() => navigate('/company')}
                >
                  <span className="action-icon">🏢</span>
                  <span className="action-text">Моя компания</span>
                </button>
              </>
            )}
          </div>
        </div>

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
