import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { defectAPI } from '../../services/api';
import './Defects.css';

const Defects = () => {
  const { user, isAdmin, isManager, isEngineer } = useAuth();
  const [defects, setDefects] = useState([]);
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
        // Получаем дефекты инженера
        const defectsData = await defectAPI.getMyDefects();
        setDefects(defectsData);
      } else {
        // Для админа и менеджера получаем все дефекты
        // Пока используем моковые данные
        setDefects([
          { 
            id: 1, 
            name: 'Трещина в несущей стене', 
            project_id: 1,
            user_engineer_id: 1,
            engineer: { username: 'Иван Петров', email: 'ivan@example.com' },
            project: { name: 'Жилой комплекс "Солнечный"' }
          },
          { 
            id: 2, 
            name: 'Протечка в системе отопления', 
            project_id: 1,
            user_engineer_id: 2,
            engineer: { username: 'Мария Сидорова', email: 'maria@example.com' },
            project: { name: 'Жилой комплекс "Солнечный"' }
          },
          { 
            id: 3, 
            name: 'Неисправность лифтового оборудования', 
            project_id: 2,
            user_engineer_id: 3,
            engineer: { username: 'Алексей Козлов', email: 'alex@example.com' },
            project: { name: 'Офисное здание "Бизнес-центр"' }
          },
          { 
            id: 4, 
            name: 'Дефект в электропроводке', 
            project_id: 2,
            user_engineer_id: null,
            engineer: null,
            project: { name: 'Офисное здание "Бизнес-центр"' }
          }
        ]);
      }
    } catch (error) {
      console.error('Ошибка загрузки дефектов:', error);
      setError('Ошибка загрузки данных');
    } finally {
      setLoading(false);
    }
  }, [isEngineer]);

  useEffect(() => {
    if (isAdmin() || isManager() || isEngineer()) {
      fetchDefects();
    }
  }, [fetchDefects, isAdmin, isManager, isEngineer]);

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
        {defects.map((defect) => (
          <div key={defect.id} className="defect-card">
            <div className="defect-header">
              <h3 className="defect-name">{defect.name}</h3>
              <div className="defect-actions">
                {isEngineer() && defect.user_engineer_id === user?.id && (
                  <button 
                    className="btn btn-sm btn-danger"
                    onClick={() => handleDeleteDefect(defect.id)}
                  >
                    Удалить
                  </button>
                )}
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
              
              {defect.engineer && (
                <div className="info-item">
                  <span className="info-label">Email:</span>
                  <span className="info-value">{defect.engineer.email}</span>
                </div>
              )}
            </div>

            <div className="defect-status">
              <span className={`status ${defect.user_engineer_id ? 'assigned' : 'unassigned'}`}>
                {defect.user_engineer_id ? 'Назначен' : 'Не назначен'}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Модальное окно создания дефекта */}
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

      {/* Модальное окно назначения инженера */}
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
