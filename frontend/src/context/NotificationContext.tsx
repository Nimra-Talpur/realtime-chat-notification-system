'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { useSocket } from './SocketContext';
import { apiRequest } from '@/lib/api';

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  isRead: boolean;
  metadata?: any;
  createdAt: string;
}

interface Toast {
  id: string;
  title: string;
  body: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  toasts: Toast[];
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  dismissToast: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { token } = useAuth();
  const { socket } = useSocket();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Load existing notifications on mount
  useEffect(() => {
    if (!token) return;
    apiRequest('/notifications', {}, token).then(setNotifications).catch(console.error);
  }, [token]);

  // Listen for live notifications
  useEffect(() => {
    if (!socket) return;

    const onNotification = (data: any) => {
      const newNotif: Notification = {
        id: `temp-${Date.now()}`,
        type: data.type,
        title: data.title,
        body: data.body,
        isRead: false,
        metadata: data.metadata,
        createdAt: new Date().toISOString(),
      };

      setNotifications((prev) => [newNotif, ...prev]);

      const toastId = `toast-${Date.now()}`;
      setToasts((prev) => [...prev, { id: toastId, title: data.title, body: data.body }]);

      // Auto-dismiss toast after 4s
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== toastId));
      }, 4000);
    };

    socket.on('notification:new', onNotification);
    return () => {
      socket.off('notification:new', onNotification);
    };
  }, [socket]);

  const markAsRead = async (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    if (token && !id.startsWith('temp-')) {
      await apiRequest(`/notifications/${id}/read`, { method: 'PATCH' }, token).catch(console.error);
    }
  };

  const markAllAsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    if (token) {
      await apiRequest('/notifications/read-all', { method: 'PATCH' }, token).catch(console.error);
    }
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <NotificationContext.Provider
      value={{ notifications, unreadCount, toasts, markAsRead, markAllAsRead, dismissToast }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotifications must be used within NotificationProvider');
  return context;
}