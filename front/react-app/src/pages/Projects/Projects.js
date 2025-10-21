import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { projectAPI, companyAPI } from '../../services/api';
import './Projects.css';

const Projects = () => {
  const { user, isAdmin, isManager } = useAuth();
  const [projects, setProjects] = useState([]);
  const [visibleProjects, setVisibleProjects] = useState([]);
  const [searchName, setSearchName] = useState('');
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [showRemoveEngineersForm, setShowRemoveEngineersForm] = useState(false);
  const [showAssignManagerForm, setShowAssignManagerForm] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    company_id: null,
    engineer_ids: [],
    remove_engineer_ids: '',
    manager_id: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);
      
      if (isManager()) {
        const projectsData = await projectAPI.getMyProjects();
        if (user?.company_id) {
          try {
            const company = await companyAPI.getCompanyInfo(user.company_id);
            const companyProjects = company.projects || [];
            const idToCompanyProject = new Map(companyProjects.map(p => [p.id, p]));

            const enriched = (projectsData || []).map(p => {
              const cp = idToCompanyProject.get(p.id) || {};
              return {
                ...p,
                engineers: cp.engineers || [],
                defects: cp.defects || [],
                company_name: company.name,
              };
            });
            setProjects(enriched);
            setVisibleProjects(enriched);
          } catch (e) {
            setProjects(projectsData);
            setVisibleProjects(projectsData);
          }
        } else {
          setProjects(projectsData);
        }
      } else {
        const companies = await companyAPI.getAllCompanies();
        const companyIds = (companies || []).map(c => c.id);
        const companyDetails = await Promise.all(
          companyIds.map(id => companyAPI.getCompanyInfo(id))
        );

        const allProjects = companyDetails.flatMap(c => (c.projects || []).map(p => ({
          ...p,
          company_id: c.id,
          company_name: c.name,
        })));

        setProjects(allProjects);
        setVisibleProjects(allProjects);
      }
    } catch (error) {
      setError('Ошибка загрузки данных');
    } finally {
      setLoading(false);
    }
  }, [isManager, user]);

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
      setError(error.response?.data?.detail || 'Ошибка назначения инженеров');
    }
  };

  const handleRemoveEngineers = async (e) => {
    e.preventDefault();
    try {
      setError('');
      setSuccess('');

      const engineerIds = formData.remove_engineer_ids.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));

      await projectAPI.removeEngineersFromProject(selectedProject.id, engineerIds);

      setSuccess('Инженеры успешно удалены из проекта');
      setFormData({ ...formData, remove_engineer_ids: '' });
      setShowRemoveEngineersForm(false);
      setSelectedProject(null);
      fetchProjects();
    } catch (error) {
      setError(error.response?.data?.detail || 'Ошибка удаления инженеров');
    }
  };

  const handleRemoveManager = async (projectId) => {
    if (window.confirm('Удалить менеджера из проекта?')) {
      try {
        await projectAPI.removeManagerFromProject(projectId);
        setSuccess('Менеджер успешно удалён из проекта');
        fetchProjects();
      } catch (error) {
        setError(error.response?.data?.detail || 'Ошибка удаления менеджера');
      }
    }
  };

  const handleAssignManager = async (e) => {
    e.preventDefault();
    try {
      setError('');
      setSuccess('');

      await projectAPI.assignProjectToManager(selectedProject.id, parseInt(formData.manager_id));

      setSuccess('Менеджер успешно назначен на проект');
      setFormData({ ...formData, manager_id: '' });
      setShowAssignManagerForm(false);
      setSelectedProject(null);
      fetchProjects();
    } catch (error) {
      setError(error.response?.data?.detail || 'Ошибка назначения менеджера');
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
        <form className="search" onSubmit={async (e) => {
          e.preventDefault();
          const query = (searchName || '').trim().toLowerCase();
          if (!query) {
            setVisibleProjects(projects);
            return;
          }
          const found = projects.find(p => (p.name || '').toLowerCase().includes(query));
          if (!found) {
            setVisibleProjects([]);
            return;
          }
          try {
            if (isManager()) {
              await projectAPI.getMyProject(found.id);
            }
          } catch (e) {
            console.error('Ошибка запроса getMyProject:', e);
          }
          setVisibleProjects(projects.filter(p => p.id === found.id));
        }} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <input
            type="text"
            placeholder="Поиск по имени проекта"
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
            className="form-input"
          />
          <button className="btn-s btn-outline" type="submit">Найти</button>
          <button className="btn-s btn-outline" type="button" onClick={() => { setSearchName(''); setVisibleProjects(projects); }}>Сброс</button>
        </form>
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
        {visibleProjects.map((project) => (
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
              {(isAdmin() || isManager()) && (
                <button 
                  className="btn btn-sm btn-outline-red"
                  onClick={() => {
                    setSelectedProject(project);
                    setShowRemoveEngineersForm(true);
                  }}
                >
                  Удалить инженеров
                </button>
              )}
              {(isAdmin()) && (
                <button 
                  className="btn btn-sm btn-outline-red"
                  onClick={() => handleRemoveManager(project.id)}
                >
                  Удалить менеджера
                </button>
              )}
              {(isAdmin()) && (
                <button 
                  className="btn btn-sm btn-outline"
                  onClick={() => {
                    setSelectedProject(project);
                    setShowAssignManagerForm(true);
                  }}
                >
                  Назначить менеджера
                </button>
              )}
                <button 
                  className="btn btn-sm btn-danger"
                  onClick={() => handleDeleteProject(project.id)}
                >
                  Удалить
                </button>
              </div>
            </div>
            
            <div className="project-stats">
            {project.company_name && (
              <div className="stat-item">
                <span className="stat-icon">🏢</span>
                <span className="stat-text">Компания: {project.company_name}</span>
              </div>
            )}
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
                  ID компании
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

      {showRemoveEngineersForm && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Удалить инженеров из проекта</h3>
              <button 
                className="modal-close"
                onClick={() => setShowRemoveEngineersForm(false)}
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleRemoveEngineers} className="modal-form">
              <div className="form-group">
                <label htmlFor="remove-engineer-ids" className="form-label">
                  ID инженеров (через запятую)
                </label>
                <input
                  type="text"
                  id="remove-engineer-ids"
                  name="remove_engineer_ids"
                  value={formData.remove_engineer_ids}
                  onChange={(e) => setFormData({ ...formData, remove_engineer_ids: e.target.value })}
                  className="form-input"
                  placeholder="1, 2, 3"
                  required
                />
              </div>
              
              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setShowRemoveEngineersForm(false)}>
                  Отмена
                </button>
                <button type="submit" className="btn btn-danger">
                  Удалить
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAssignManagerForm && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Назначить менеджера на проект</h3>
              <button 
                className="modal-close"
                onClick={() => setShowAssignManagerForm(false)}
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleAssignManager} className="modal-form">
              <div className="form-group">
                <label htmlFor="assign-manager-id" className="form-label">
                  ID менеджера
                </label>
                <input
                  type="number"
                  id="assign-manager-id"
                  name="manager_id"
                  value={formData.manager_id}
                  onChange={(e) => setFormData({ ...formData, manager_id: e.target.value })}
                  className="form-input"
                  required
                />
              </div>
              
              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setShowAssignManagerForm(false)}>
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
