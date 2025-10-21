import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { defectAPI, companyAPI } from '../../services/api';
import './Defects.css';

const Defects = () => {
  const { user, isAdmin, isManager, isEngineer } = useAuth();
  const location = useLocation();
  const [defects, setDefects] = useState([]);
  const [visibleDefects, setVisibleDefects] = useState([]);
  const [searchName, setSearchName] = useState('');
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [selectedDefect, setSelectedDefect] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    project_id: null,
    engineer_id: null
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchDefects = useCallback(async () => {
    try {
      setLoading(true);
      
      if (isEngineer()) {
        const defectsData = await defectAPI.getMyDefects();

        if (user?.company_id) {
          try {
            const company = await companyAPI.getCompanyInfo(user.company_id);
            const projectMap = new Map((company.projects || []).map(p => [p.id, p]));
            const withProjectNames = (defectsData || []).map(d => ({
              ...d,
              project: projectMap.get(d.project_id) ? { name: projectMap.get(d.project_id).name } : undefined,
            }));
            setDefects(withProjectNames);
            setVisibleDefects(withProjectNames);
          } catch (e) {
            console.error('Ошибка получения данных компании для дефектов:', e);
            setDefects(defectsData);
          }
        } else {
          setDefects(defectsData);
          setVisibleDefects(defectsData);
        }
      } else {
        if (isAdmin()) {
          const allCompanies = await companyAPI.getAllCompanies();
          const companyIds = (allCompanies || []).map(c => c.id);
          const companyDetails = await Promise.all(companyIds.map(id => companyAPI.getCompanyInfo(id)));

          const defectsList = [];
          companyDetails.forEach(company => {
            const engineerById = new Map((company.engineers || []).map(e => [e.id, e]));
            (company.projects || []).forEach(p => {
              (p.defects || []).forEach(d => {
                const engineer = d.engineer_id ? engineerById.get(d.engineer_id) : null;
                defectsList.push({
                  id: d.id,
                  name: d.name,
                  project_id: d.project_id,
                  user_engineer_id: d.engineer_id || null,
                  engineer: engineer ? { username: engineer.username, email: engineer.email } : null,
                  project: { name: p.name },
                });
              });
            });
          });

          setDefects(defectsList);
          setVisibleDefects(defectsList);
        } else if (isManager() && user?.company_id) {
          const company = await companyAPI.getCompanyInfo(user.company_id);
          const engineerById = new Map((company.engineers || []).map(e => [e.id, e]));
          const allCompanyProjects = company.projects || [];
          const allowedProjects = allCompanyProjects.filter(p => p.manager_id === user.id);

          const defectsList = [];
          allowedProjects.forEach(p => {
            (p.defects || []).forEach(d => {
              const engineer = d.engineer_id ? engineerById.get(d.engineer_id) : null;
              defectsList.push({
                id: d.id,
                name: d.name,
                project_id: d.project_id,
                user_engineer_id: d.engineer_id || null,
                engineer: engineer ? { username: engineer.username, email: engineer.email } : null,
                project: { name: p.name },
              });
            });
          });

          setDefects(defectsList);
          setVisibleDefects(defectsList);
        } else {
          const empty = [];
          setDefects(empty);
          setVisibleDefects(empty);
        }
      }
    } catch (error) {
      console.error('Ошибка загрузки дефектов:', error);
      setError('Ошибка загрузки данных');
    } finally {
      setLoading(false);
    }
  }, [isEngineer, isManager, user]);

  useEffect(() => {
    if (isAdmin() || isManager() || isEngineer()) {
      fetchDefects();
    }
  }, [fetchDefects, isAdmin, isManager, isEngineer]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('create') === '1' && isEngineer()) {
      setShowCreateForm(true);
    }
  }, [location.search, isEngineer]);

  const handleCreateDefect = async (e) => {
    e.preventDefault();
    try {
      setError('');
      setSuccess('');
      
      await defectAPI.createDefect({
        name: formData.name,
        project_id: formData.project_id
      });
      
      setSuccess('Дефект успешно создан');
      setFormData({ name: '', project_id: null });
      setShowCreateForm(false);
      fetchDefects();
    } catch (error) {
      console.error('Ошибка создания дефекта:', error);
      setError(error.response?.data?.detail || 'Ошибка создания дефекта');
    }
  };



  const handleClearSearch = () => {
    setSearchName('');
    setVisibleDefects(defects);
  };

  const handleDeleteDefect = async (defectId) => {
    if (window.confirm('Вы уверены, что хотите удалить этот дефект?')) {
      try {
        await defectAPI.deleteDefect(defectId);
        setSuccess('Дефект успешно удален');
        fetchDefects();
      } catch (error) {
        console.error('Ошибка удаления дефекта:', error);
        setError(error.response?.data?.detail || 'Ошибка удаления дефекта');
      }
    }
  };

  const handleAssignEngineer = async (e) => {
    e.preventDefault();
    try {
      setError('');
      setSuccess('');
      
      await defectAPI.assignEngineerToDefect(selectedDefect.id, parseInt(formData.engineer_id));
      
      setSuccess('Инженер успешно назначен на дефект');
      setFormData({ engineer_id: null });
      setShowAssignForm(false);
      setSelectedDefect(null);
      fetchDefects();
    } catch (error) {
      console.error('Ошибка назначения инженера:', error);
      setError(error.response?.data?.detail || 'Ошибка назначения инженера');
    }
  };

  const handleRemoveEngineer = async (defectId) => {
    if (window.confirm('Вы уверены, что хотите удалить инженера из дефекта?')) {
      try {
        await defectAPI.removeEngineerFromDefect(defectId);
        setSuccess('Инженер успешно удален из дефекта');
        fetchDefects();
      } catch (error) {
        console.error('Ошибка удаления инженера:', error);
        setError(error.response?.data?.detail || 'Ошибка удаления инженера');
      }
    }
  };

  if (!isAdmin() && !isManager() && !isEngineer()) {
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
    <div className="defects">
      <div className="defects-header">
        <h1 className="page-title">
          <span className="tool-icon">🔧</span>
          Управление дефектами
        </h1>
        <form className="search" onSubmit={
            async (e) => {
              e.preventDefault();
              const query = (searchName || '').trim().toLowerCase();
              if (!query) {
                setVisibleDefects(defects);
                return;
              }
              const found = defects.find(d => (d.name || '').toLowerCase().includes(query));
              if (!found) {
                setVisibleDefects([]);
                return;
              }
              try {
                if (isEngineer()) {
                  await defectAPI.getMyDefect(found.id);
                }
              } catch (e) {
              }
              setVisibleDefects(defects.filter(d => d.id === found.id));
            }
        } style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <input
            type="text"
            placeholder="Поиск по имени дефекта"
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
            className="form-input"
          />
          <button className="btn-s btn-outline" type="submit">Найти</button>
          <button className="btn-s btn-outline" type="button" onClick={handleClearSearch}>Сброс</button>
        </form>
        {isEngineer() && (
          <button 
            className="btn btn-primary"
            onClick={() => setShowCreateForm(true)}
          >
            <span className="btn-icon">➕</span>
            Создать дефект
          </button>
        )}
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

      <div className="defects-grid">
        {visibleDefects.map((defect) => (
          <div key={defect.id} className={`defect-card ${isAdmin() || isManager() ? 'admin-card' : ''}`}>
            <div className="defect-header">
              <h3 className="defect-name">{defect.name}</h3>
              <div className="defect-actions">
                {(isAdmin() || isManager()) && (
                  <>
                    {defect.user_engineer_id ? (
                      <button
                        className="btn btn-sm btn-warning"
                        onClick={() => handleRemoveEngineer(defect.id)}
                      >
                        Удалить инженера
                      </button>
                    ) : (
                      <button
                        className="btn btn-sm btn-outline"
                        onClick={() => {
                          setSelectedDefect(defect);
                          setShowAssignForm(true);
                        }}
                      >
                        Назначить инженера
                      </button>
                    )}
                  </>
                )}
              </div>
              <div className="defect-status">
                <span className={`status ${defect.user_engineer_id ? 'assigned' : 'unassigned'}`}>
                  {defect.user_engineer_id ? 'Назначен' : 'Не назначен'}
                </span>
              </div>
            </div>
            
            <div className="defect-info">
              <div className="info-item">
                <span className="info-label">Проект:</span>
                <span className="info-value">{defect.project?.name || `ID: ${defect.project_id}`}</span>
              </div>
              
              <div className="info-item">
                <span className="info-label">Инженер:</span>
                <span className={`info-value ${defect.engineer ? 'assigned' : 'unassigned'}`}>
                  {defect.engineer ? defect.engineer.username : 'Не назначен'}
                </span>
              </div>
              
              {(isAdmin() || isManager()) && (
                <div className="info-item">
                  <span className="info-label">Email:</span>
                  <span className="info-value">{defect.engineer.email}</span>
                </div>
              )}
            </div>
            <div className="delete-button">
            {isEngineer() && defect.user_engineer_id === user?.id && (
                  <button
                    className="btn btn-sm btn-danger"
                    onClick={() => handleDeleteDefect(defect.id)}
                  >
                    Удалить
                  </button>
                )}
            </div>
          </div>
        ))}
      </div>

      {showCreateForm && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Создать новый дефект</h3>
              <button 
                className="modal-close"
                onClick={() => setShowCreateForm(false)}
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleCreateDefect} className="modal-form">
              <div className="form-group">
                <label htmlFor="defect-name" className="form-label">
                  Название дефекта
                </label>
                <input
                  type="text"
                  id="defect-name"
                  name="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="form-input"
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="project-id" className="form-label">
                  ID проекта
                </label>
                <input
                  type="number"
                  id="project-id"
                  name="project_id"
                  value={formData.project_id || ''}
                  onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
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

      {showAssignForm && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Назначить инженера на дефект</h3>
              <button 
                className="modal-close"
                onClick={() => setShowAssignForm(false)}
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleAssignEngineer} className="modal-form">
              <div className="form-group">
                <label htmlFor="engineer-id" className="form-label">
                  ID инженера
                </label>
                <input
                  type="number"
                  id="engineer-id"
                  name="engineer_id"
                  value={formData.engineer_id || ''}
                  onChange={(e) => setFormData({ ...formData, engineer_id: e.target.value })}
                  className="form-input"
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

export default Defects;
