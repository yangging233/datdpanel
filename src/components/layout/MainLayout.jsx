import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';

const MainLayout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavigate = (path) => {
    navigate(path);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header
        onNotificationClick={() => {}}
        onSettingsClick={() => {}}
      />
      
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          currentPath={location.pathname}
          onNavigate={handleNavigate}
        />
        
        <main className="flex-1 overflow-auto">
          <div className="view-transition-wrapper h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
