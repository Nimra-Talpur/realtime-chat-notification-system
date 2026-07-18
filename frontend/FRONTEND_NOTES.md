# Frontend

This branch covers the Next.js frontend:

- **Auth**: Login/signup pages, `AuthContext` for JWT persistence via localStorage
- **Real-time**: `SocketContext` manages the Socket.IO connection lifecycle and online-user tracking
- **Chat UI**: Room list with unread badges (live-updated), message thread, typing indicator, online status dot, responsive mobile/desktop layout (single-panel on mobile with back navigation, dual-panel on desktop)
- **User discovery**: Live debounced search by name/email (`/users/search`) replacing manual user-ID entry
- **Notifications UI**: `NotificationBell` (unread badge + dropdown, click-to-open-chat), `ToastContainer` (auto-dismissing live toast popups), both driven by `NotificationContext`
- **Styling**: Tailwind CSS throughout, App Router structure (`src/app`)