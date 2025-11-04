
import React, { createContext, useState, useCallback } from 'react';
import { Alert, AlertContextType } from '../types';

export const AlertContext = createContext<AlertContextType>(null!);

export const AlertProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [alerts, setAlerts] = useState<Alert[]>([]);

  const addAlert = useCallback((message: string) => {
    const newAlert: Alert = {
      message,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setAlerts(prevAlerts => [newAlert, ...prevAlerts].slice(0, 5)); // Keep last 5 alerts
  }, []);

  return (
    <AlertContext.Provider value={{ alerts, addAlert }}>
      {children}
    </AlertContext.Provider>
  );
};
