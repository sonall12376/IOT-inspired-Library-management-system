import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  Info,
  Check,
  X
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';
import socket from '../services/socket';

interface NotificationItem {
  _id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'alert';
  isRead: boolean;
  createdAt: string;
}

interface ToastItem {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'alert';
}

export const NotificationCenter: React.FC = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch initial notifications
  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      if (res.data.success) {
        setNotifications(res.data.notifications);
        setUnreadCount(res.data.notifications.filter((n: NotificationItem) => !n.isRead).length);
      }
    } catch (err) {
      console.error('Failed to load notifications:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();

    // Listen to outside clicks to close dropdown
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);

    // Socket.io Real-time Push Alerts
    if (user) {
      const userId = user.id;
      if (userId) {
        socket.emit('join_user_room', userId);
        
        socket.on('notification_received', (newNotification: NotificationItem) => {
          // Prepend new notification to state
          setNotifications((prev) => [newNotification, ...prev]);
          setUnreadCount((prev) => prev + 1);

          // Add a real-time toast popup
          const toastId = Math.random().toString(36).substring(2, 9);
          setToasts((prev) => [
            ...prev,
            {
              id: toastId,
              title: newNotification.title,
              message: newNotification.message,
              type: newNotification.type
            }
          ]);

          // Auto-dismiss toast after 4.5s
          setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== toastId));
          }, 4500);
        });
      }
    }

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      socket.off('notification_received');
    };
  }, [user]);

  const handleMarkAsRead = async (id: string) => {
    try {
      const res = await api.put(`/notifications/${id}/read`);
      if (res.data.success) {
        setNotifications((prev) =>
          prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Failed to mark read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const res = await api.put('/notifications/read-all');
      if (res.data.success) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        setUnreadCount(0);
      }
    } catch (err) {
      console.error('Failed to mark all read:', err);
    }
  };

  const renderIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-emerald-400" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-amber-400" />;
      case 'alert':
        return <AlertCircle className="w-4 h-4 text-rose-455" />;
      default:
        return <Info className="w-4 h-4 text-indigo-400" />;
    }
  };

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    const diffMs = Date.now() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHrs = Math.floor(diffMins / 60);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHrs < 24) return `${diffHrs}h ago`;
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-400 hover:text-indigo-400 hover:bg-slate-900 rounded-lg transition-all cursor-pointer border border-transparent hover:border-slate-800"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white rounded-full flex items-center justify-center text-[9px] font-bold animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-3 w-80 max-h-[420px] overflow-y-auto bg-slate-900/95 backdrop-blur-md border border-slate-800 rounded-2xl shadow-2xl z-[100] flex flex-col"
          >
            {/* Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <span className="text-sm font-bold text-white font-outfit">Notifications</span>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-[10px] text-indigo-400 hover:text-indigo-300 font-medium cursor-pointer transition-all"
                >
                  Mark all as read
                </button>
              )}
            </div>

            {/* List */}
            <div className="divide-y divide-slate-850 flex-1 overflow-y-auto max-h-[300px]">
              {notifications.length > 0 ? (
                notifications.map((item) => (
                  <div
                    key={item._id}
                    className={`p-4 flex gap-3 text-left transition-all ${
                      !item.isRead ? 'bg-indigo-600/5' : 'hover:bg-slate-950/20'
                    }`}
                  >
                    <div className="mt-0.5 flex-shrink-0">{renderIcon(item.type)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-1">
                        <p className={`text-xs font-bold leading-tight ${!item.isRead ? 'text-white' : 'text-slate-350'}`}>
                          {item.title}
                        </p>
                        <span className="text-[9px] text-slate-500 font-medium flex-shrink-0">
                          {formatTime(item.createdAt)}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1 leading-normal break-words">
                        {item.message}
                      </p>
                    </div>

                    {!item.isRead && (
                      <button
                        onClick={() => handleMarkAsRead(item._id)}
                        className="self-center p-1 rounded hover:bg-slate-800 text-slate-500 hover:text-emerald-400 transition-all cursor-pointer"
                        title="Mark as read"
                      >
                        <Check className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))
              ) : (
                <div className="py-12 text-center text-xs text-slate-500">
                  <Bell className="w-8 h-8 text-slate-700 mx-auto mb-2.5" />
                  <span>No alerts or notifications yet.</span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Real-time Push Toasts Portal */}
      <div className="fixed bottom-6 right-6 z-[999] flex flex-col gap-3 w-80 max-w-full">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 50, y: 10, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 50, scale: 0.9 }}
              className="p-4 rounded-xl border border-slate-800 bg-slate-900/90 backdrop-blur-md shadow-2xl flex gap-3 items-start text-left"
            >
              <div className="mt-0.5">{renderIcon(toast.type)}</div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-white leading-tight font-outfit">{toast.title}</p>
                <p className="text-[10px] text-slate-400 mt-1 leading-normal">{toast.message}</p>
              </div>
              <button
                onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
                className="text-slate-500 hover:text-slate-350 cursor-pointer p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};
export default NotificationCenter;
