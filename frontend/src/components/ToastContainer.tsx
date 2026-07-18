'use client';

import { useNotifications } from '@/context/NotificationContext';

export default function ToastContainer() {
  const { toasts, dismissToast } = useNotifications();

  return (
    <div className="fixed top-4 right-4 left-4 sm:left-auto z-100 space-y-2 sm:w-80">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="bg-white border border-gray-200 shadow-lg rounded-xl p-4 animate-in slide-in-from-right"
        >
          <div className="flex justify-between items-start gap-2">
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{toast.title}</p>
              <p className="text-xs text-gray-500 mt-0.5 truncate">{toast.body}</p>
            </div>
            <button
              onClick={() => dismissToast(toast.id)}
              className="text-gray-400 hover:text-gray-600 text-lg leading-none shrink-0"
            >
              ×
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}