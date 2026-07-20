# Notifications Feature

This branch covers the notification system:

- `NotificationsService` — CRUD operations for notifications (create, list, unread count, mark as read/all as read)
- `NotificationsController` — REST endpoints (`/notifications`, `/notifications/unread-count`, `/notifications/:id/read`, `/notifications/read-all`)
- `NotificationsProcessor` — BullMQ worker (`@Processor('notifications')`) that consumes queued jobs and persists notifications to PostgreSQL
- Notification creation is decoupled from the message-send request path: `ChatGateway` queues a job via BullMQ instead of writing directly to the database, keeping message delivery fast
- Live delivery: in addition to the queued DB write, `ChatGateway` emits a `notification:new` socket event directly to the recipient's personal room so the frontend can show a toast/badge instantly
- Frontend: `NotificationContext`, `NotificationBell` (unread badge + dropdown), and `ToastContainer` (auto-dismissing toast popups)