'use client';

import { useState, useRef, useEffect } from 'react';
import { useNotifications } from '@/context/NotificationContext';

export default function NotificationBell({ onOpenChat }: { onOpenChat?: (chatRoomId: string) => void }) {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative p-2 rounded-full hover:bg-gray-100 transition"
      >
        <svg className="w-5 h-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-medium rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          className="fixed sm:absolute left-2 right-2 sm:left-0 sm:right-auto sm:w-80 top-16 sm:top-auto sm:mt-2 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden flex flex-col"
          style={{ maxHeight: 'min(70vh, 420px)' }}
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 shrink-0">
            <p className="font-medium text-gray-900 text-sm">Notifications</p>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-blue-600 hover:underline"
              >
                Mark all as read
              </button>
            )}
          </div>

          <div className="overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">No notifications yet</p>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => {
                    markAsRead(n.id);
                    if (n.metadata?.chatRoomId && onOpenChat) {
                      onOpenChat(n.metadata.chatRoomId);
                      setOpen(false);
                    }
                  }}
                  className={`w-full text-left px-4 py-3 border-b border-gray-50 hover:bg-gray-100 transition cursor-pointer ${
                    !n.isRead ? 'bg-blue-50' : 'bg-white opacity-60'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <span
                      className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                        !n.isRead ? 'bg-blue-500' : 'bg-transparent'
                      }`}
                    />
                    <div className="min-w-0">
                      <p className={`text-sm truncate ${!n.isRead ? 'font-semibold text-gray-900' : 'font-normal text-gray-500'}`}>
                        {n.title}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5 truncate">{n.body}</p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}