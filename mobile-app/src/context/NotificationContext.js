import React, { createContext } from 'react';

export const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  // Mock static values to disable notification polling/processing completely
  const notifications = [];
  const unreadCount = 0;
  const loading = false;

  const fetchNotifications = async () => {};
  const markAsRead = async () => {};
  const markAllAsRead = async () => {};

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};
