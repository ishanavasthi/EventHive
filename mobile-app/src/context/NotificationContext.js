import React, { createContext, useState, useEffect, useContext, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import api from '../services/api';
import { AuthContext } from './AuthContext';

// Configure Notifications handler for foreground alerts
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const { user } = useContext(AuthContext);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const isInitialLoad = useRef(true);
  const pollingInterval = useRef(null);

  const fetchNotifications = async (silent = false) => {
    if (!user || user._id === 'guest_123') return;
    if (!silent) setLoading(true);

    try {
      const res = await api.get('/notifications');
      const newNotifications = res.data;

      // Calculate unread count
      const count = newNotifications.filter(n => !n.read).length;
      setUnreadCount(count);

      // Check for new unread notifications to trigger local push banners
      if (!isInitialLoad.current && notifications.length > 0) {
        newNotifications.forEach(async (newNotif) => {
          const isNew = !notifications.some(existing => existing._id === newNotif._id);
          if (isNew && !newNotif.read) {
            await triggerLocalNotification(newNotif);
          }
        });
      }

      setNotifications(newNotifications);
      isInitialLoad.current = false;
    } catch (err) {
      console.log('Error fetching notifications:', err.message);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const triggerLocalNotification = async (notif) => {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: notif.title,
          body: notif.message,
          data: { relatedId: notif.relatedId, type: notif.type },
          sound: true,
        },
        trigger: null, // Fires immediately
      });
    } catch (err) {
      console.log('Error triggering local notification:', err);
    }
  };

  const markAsRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      // Update local state directly for responsive UI
      setNotifications(prev =>
        prev.map(n => (n._id === id ? { ...n, read: true } : n))
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.log('Error marking notification as read:', err.message);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.put('/notifications/read-all');
      // Update local state directly
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.log('Error marking all notifications as read:', err.message);
    }
  };

  // Register push notifications permissions
  useEffect(() => {
    const registerForPushNotifications = async () => {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') {
        console.log('Failed to get push token for notifications permission!');
      }
    };

    if (user && user._id !== 'guest_123') {
      registerForPushNotifications();
      fetchNotifications();

      // Poll notifications every 10 seconds for real-time simulator updates
      pollingInterval.current = setInterval(() => {
        fetchNotifications(true);
      }, 10000);
    } else {
      // Clear notifications if user logged out or is guest
      setNotifications([]);
      setUnreadCount(0);
      isInitialLoad.current = true;
      if (pollingInterval.current) {
        clearInterval(pollingInterval.current);
        pollingInterval.current = null;
      }
    }

    return () => {
      if (pollingInterval.current) {
        clearInterval(pollingInterval.current);
        pollingInterval.current = null;
      }
    };
  }, [user]);

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
