import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { projectAPI } from '../../services/api';
import './Projects.css';

const Projects = () => {
  const { isAdmin, isManager } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    company_id: null,
    engineer_ids: []
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);
      
      if (isManager()) {
        // Получаем проекты менеджера
        const projectsData = await projectAPI.getMyProjects();
        setProjects(projectsData);
      } else {
        // Для админа получаем все проекты
        // Пока используем моковые данные
        setProjects([
          { 
            id: 1, 
            name: 'Жилой комплекс "Солнечный"', 
            manager_id: 1, 
            company_id: 1,
            engineers: [
              { id: 1, username: 'Иван Петров', email: 'ivan@example.com' },
              { id: 2, username: 'Мария Сидорова', email: 'maria@example.com' }
            ],
            defects: [
              { id: 1, name: 'Трещина в стене', engineer_id: 1 },
              { id: 2, name: 'Протечка крыши', engineer_id: 2 }
            ]
          },
          { 
            id: 2, 
            name: 'Офисное здание "Бизнес-центр"', 
            manager_id: 2, 
            company_id: 1,
            engineers: [
              { id: 3, username: 'Алексей Козлов', email: 'alex@example.com' }
            ],
            defects: [
              { id: 3, name: 'Неисправность лифта', engineer_id: 3 }
            ]
          }
        ]);
      }
    } catch (error) {
      console.error('Ошибка загрузки проектов:', error);
      setError('Ошибка загрузки данных');
    } finally {
      setLoading(false);
    }
  }, [isManager]);

  useEffect(() => {
    if (isAdmin() || isManager()) {
      fetchProjects();
    }
  }, [fetchProjects, isAdmin, isManager]);

  const handleCreateProject = async (e) => {
    e.preventDefault();
    try {
      setError('');
      setSuccess('');
      
      await projectAPI.createProject({
        name: formData.name,
        company_id: formData.company_id,
        engineer_ids: formData.engineer_ids
      });
      
      setSuccess('Проект успешно создан');
      setFormData({ name: '', company_id: null, engineer_ids: [] });
      setShowCreateForm(false);
      fetchProjects();
    } catch (error) {
      console.error('Ошибка создания проекта:', error);
      setError(error.response?.data?.detail || 'Ошибка создания проекта');
    }
  };

  const handleDeleteProject = async (projectId) => {
    if (window.confirm('Вы уверены, что хотите удалить этот проект?')) {
      try {
        await projectAPI.deleteProject(projectId);
        setSuccess('Проект успешно удален');
        fetchProjects();
      } catch (error) {
        console.error('Ошибка удаления проекта:', error);
        setError(error.response?.data?.detail || 'Ошибка удаления проекта');
      }
    }
  };

  const handleAssignEngineers = async (e) => {
    e.preventDefault();
    try {
      setError('');
      setSuccess('');
      
      const engineerIds = formData.engineer_ids.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
      
      await projectAPI.addEngineersToProject(selectedProject.id, engineerIds);
      
      setSuccess('Инженеры успешно добавлены в проект');
      setFormData({ engineer_ids: [] });
      setShowAssignForm(false);
      setSelectedProject(null);
      fetchProjects();
    } catch (error) {
      console.error('Ошибка назначения инженеров:', error);
      setError(error.response?.data?.detail || 'Ошибка назначения инженеров');
    }
  };

  if (!isAdmin() && !isManager()) {
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
    <div className="projects">
      <div className="projects-header">
        <h1 className="page-title">
          <span className="construction-icon">🏗️</span>
          Управление проектами
        </h1>
        <button 
          className="btn btn-primary"
          onClick={() => setShowCreateForm(true)}
        >
          <span className="btn-icon">➕</span>
          Создать проект
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

      <div className="projects-grid">
        {projects.map((project) => (
          <div key={project.id} className="project-card">
            <div className="project-header">
              <h3 className="project-name">{project.name}</h3>
              <div className="project-actions">
                <button 
                  className="btn btn-sm btn-outline"
                  onClick={() => {
                    setSelectedProject(project);
                    setShowAssignForm(true);
                  }}
                >
                  Назначить инженеров
                </button>
                <button 
                  className="btn btn-sm btn-danger"
                  onClick={() => handleDeleteProject(project.id)}
                >
                  Удалить
                </button>
              </div>
            </div>
            
            <div className="project-stats">
              <div className="stat-item">
                <span className="stat-icon">👷‍♂️</span>
                <span className="stat-text">{project.engineers?.length || 0} инженеров</span>
              </div>
              <div className="stat-item">
                <span className="stat-icon tool-icon">🔧</span>
                <span className="stat-text">{project.defects?.length || 0} дефектов</span>
              </div>
            </div>

            {project.engineers && project.engineers.length > 0 && (
              <div className="project-engineers">
                <h4 className="section-subtitle">Инженеры:</h4>
                <div className="engineers-list">
                  {project.engineers.map((engineer) => (
                    <div key={engineer.id} className="engineer-item">
                      <span className="engineer-name">{engineer.username}</span>
                      <span className="engineer-email">{engineer.email}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {project.defects && project.defects.length > 0 && (
              <div className="project-defects">
                <h4 className="section-subtitle">Дефекты:</h4>
                <div className="defects-list">
                  {project.defects.map((defect) => (
                    <div key={defect.id} className="defect-item">
                      <span className="defect-name">{defect.name}</span>
                      <span className="defect-engineer">Инженер: {defect.engineer_id}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Модальное окно создания проекта */}
      {showCreateForm && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Создать новый проект</h3>
              <button 
                className="modal-close"
                onClick={() => setShowCreateForm(false)}
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleCreateProject} className="modal-form">
              <div className="form-group">
                <label htmlFor="project-name" className="form-label">
                  Название проекта
                </label>
                <input
                  type="text"
                  id="project-name"
                  name="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="form-input"
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="company-id" className="form-label">
                  ID компании (необязательно)
                </label>
                <input
                  type="number"
                  id="company-id"
                  name="company_id"
                  value={formData.company_id || ''}
                  onChange={(e) => setFormData({ ...formData, company_id: e.target.value })}
                  className="form-input"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="engineer-ids" className="form-label">
                  ID инженеров (через запятую)
                </label>
                <input
                  type="text"
                  id="engineer-ids"
                  name="engineer_ids"
                  value={formData.engineer_ids}
                  onChange={(e) => setFormData({ ...formData, engineer_ids: e.target.value })}
                  className="form-input"
                  placeholder="1, 2, 3"
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

      {/* Модальное окно назначения инженеров */}
      {showAssignForm && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Назначить инженеров в проект</h3>
              <button 
                className="modal-close"
                onClick={() => setShowAssignForm(false)}
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleAssignEngineers} className="modal-form">
              <div className="form-group">
                <label htmlFor="assign-engineer-ids" className="form-label">
                  ID инженеров (через запятую)
                </label>
                <input
                  type="text"
                  id="assign-engineer-ids"
                  name="engineer_ids"
                  value={formData.engineer_ids}
                  onChange={(e) => setFormData({ ...formData, engineer_ids: e.target.value })}
                  className="form-input"
                  placeholder="1, 2, 3"
                  required
                />
              </div>
              
              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setShowAssignForm(false)}>
                  Отмена
                </button>
                <button type="submit" className="btn btn-primary">
                  Назначить
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Projects;
