import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { companyAPI } from '../../services/api';
import './Company.css';

const Company = () => {
  const { user, isClient, isAdmin} = useAuth();
  const [loading, setLoading] = useState(true);
  const [company, setCompany] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true);
        setError('');
        if (user?.company_id) {
          const data = await companyAPI.getCompanyInfo(user.company_id);
          const normalized = {
            ...data,
            projects: Array.isArray(data.projects) ? data.projects : [],
            engineers: Array.isArray(data.engineers) ? data.engineers : [],
            managers: Array.isArray(data.managers) ? data.managers : [],
          };
          setCompany(normalized);
        } else {
          setCompany(null);
        }
      } catch (e) {
        console.error('Ошибка загрузки компании:', e);
        setError('Ошибка загрузки данных компании');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [user]);

  if (!(isClient() || isAdmin())) {
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

  if (error) {
    return (
      <div className="error-message">
        <span className="error-icon">⚠️</span>
        {error}
      </div>
    );
  }

  if (!company) {
    return (
      <div className="empty-state">
        <h2>Компания не найдена</h2>
        <p>Похоже, вы не привязаны к компании.</p>
      </div>
    );
  }

  const totalDefects = (company.projects || []).reduce(
    (sum, p) => sum + (p.defects?.length || 0),
    0
  );

  return (
    <div className="company-detail">
      <div className="company-header">
        <h1 className="page-title">
          <span className="building-icon">🏢</span>
          {company.name}
        </h1>
      </div>

      <div className="company-stats">
        <div className="stat-card">
          <div className="stat-number">{company.projects?.length || 0}</div>
          <div className="stat-label">Проектов</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{(company.engineers || []).length}</div>
          <div className="stat-label">Инженеров</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{totalDefects}</div>
          <div className="stat-label">Дефектов</div>
        </div>
      </div>

      <div className="company-sections">
        <section className="section">
          <h2 className="section-title">Проекты</h2>
          <div className="list">
            {(company.projects || []).map(project => (
              <div key={project.id} className="item-card">
                <div className="item-title">{project.name}</div>
                <div className="item-meta">
                  <span>Инженеров: {project.engineers?.length || 0}</span>
                  <span>Дефектов: {project.defects?.length || 0}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="section">
          <h2 className="section-title">Менеджеры</h2>
          <div className="list">
            {(company.managers || []).map(manager => (
              <div key={manager.id} className="item-card">
                <div className="item-title">{manager.username}</div>
                <div className="item-subtitle">{manager.email}</div>
                <div className="item-meta">
                  Проекты: {(manager.projects || []).length}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="section">
          <h2 className="section-title">Инженеры</h2>
          <div className="list">
            {(company.engineers || []).map(engineer => (
              <div key={engineer.id} className="item-card">
                <div className="item-title">{engineer.username}</div>
                <div className="item-subtitle">{engineer.email}</div>
                <div className="item-meta">
                  Дефектов: {engineer.defects?.length || 0}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="section">
          <h2 className="section-title">Дефекты</h2>
          <div className="list">
            {(company.projects || []).flatMap(project => 
              (project.defects || []).map(defect => (
                <div key={defect.id} className="item-card">
                  <div className="item-title">{defect.name}</div>
                  <div className="item-subtitle">Проект: {project.name}</div>
                  <div className="item-meta">
                    <span>ID: {defect.id}</span>
                    {defect.engineer_id && (
                      <span>Инженер ID: {defect.engineer_id}</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Company;


