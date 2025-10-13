import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import './Layout.css';

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { path: '/dashboard', label: 'Панель управления', icon: '🏠', roles: ['admin', 'manager', 'engineer', 'client'] },
    { path: '/companies', label: 'Компании', icon: '🏢', roles: ['admin'] },
    { path: '/projects', label: 'Проекты', icon: '🏗️', roles: ['admin', 'manager'] },
    { path: '/defects', label: 'Дефекты', icon: '🔧', roles: ['admin', 'manager', 'engineer'] },
    { path: '/profile', label: 'Профиль', icon: '👤', roles: ['admin', 'manager', 'engineer', 'client'] },
  ];

  const filteredMenuItems = menuItems.filter(item => 
    item.roles.includes(user?.role)
  );

  const getRoleLabel = (role) => {
    const roleLabels = {
      admin: 'Администратор',
      manager: 'Менеджер',
      engineer: 'Инженер',
      client: 'Клиент'
    };
    return roleLabels[role] || role;
  };

  return (
    <div className={`layout ${isDarkMode ? 'dark' : ''}`}>
      {/* Боковая панель */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h2 className="logo">
            <span className="construction-icon">🏗️</span>
            ЮгСтройИнвест
          </h2>
          <button 
            className="sidebar-toggle"
            onClick={() => setSidebarOpen(false)}
          >
            ✕
          </button>
        </div>

        <nav className="sidebar-nav">
          <ul className="nav-list">
            {filteredMenuItems.map((item) => (
              <li key={item.path} className="nav-item">
                <a
                  href={item.path}
                  className={`nav-link ${location.pathname === item.path ? 'active' : ''}`}
                  onClick={(e) => {
                    e.preventDefault();
                    navigate(item.path);
                    setSidebarOpen(false);
                  }}
                >
                  <span className="nav-icon">{item.icon}</span>
                  <span className="nav-label">{item.label}</span>
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">
              <span className="construction-icon">👷</span>
            </div>
            <div className="user-details">
              <div className="user-name">{user?.username}</div>
              <div className="user-role">{getRoleLabel(user?.role)}</div>
            </div>
          </div>
          <button className="btn btn-outline btn-sm" onClick={handleLogout}>
            Выйти
          </button>
        </div>
      </aside>

      {/* Основной контент */}
      <main className="main-content">
        <header className="header">
          <div className="header-left">
            <button 
              className="sidebar-toggle-mobile"
              onClick={() => setSidebarOpen(true)}
            >
              ☰
            </button>
            <h1 className="page-title">
              {filteredMenuItems.find(item => item.path === location.pathname)?.label || 'Панель управления'}
            </h1>
          </div>
          
          <div className="header-right">
            <button 
              className="theme-toggle"
              onClick={toggleTheme}
              title={isDarkMode ? 'Светлая тема' : 'Темная тема'}
            >
              {isDarkMode ? '☀️' : '🌙'}
            </button>
          </div>
        </header>

        <div className="content">
          <Outlet />
        </div>
      </main>

      {/* Overlay для мобильных устройств */}
      {sidebarOpen && (
        <div 
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default Layout;
