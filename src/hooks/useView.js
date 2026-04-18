import { useState, useContext, createContext } from 'react';
import { VIEW_TYPES } from '@/lib/constants';

const ViewContext = createContext(null);

export const ViewProvider = ({ children }) => {
  const [currentView, setCurrentView] = useState(VIEW_TYPES.MONTH);

  const value = {
    currentView,
    setCurrentView,
  };

  return (
    <ViewContext.Provider value={value}>
      {children}
    </ViewContext.Provider>
  );
};

export const useView = () => {
  const context = useContext(ViewContext);
  if (!context) {
    throw new Error('useView must be used within a ViewProvider');
  }
  return context;
};
