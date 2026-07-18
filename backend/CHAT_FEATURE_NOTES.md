# Chat Feature

This branch covers the real-time chat functionality:

- Socket.IO Gateway (`src/chat/chat.gateway.ts`) — JWT-authenticated WebSocket connections
- Real-time private messaging and group chat rooms
- Typing indicators (`typing:start` / `typing:stop` events)
- Online/offline presence tracking, backed by the `UserConnection` model to support multiple simultaneous device connections per user
- Message persistence to PostgreSQL via Prisma on every `message:send` event
- REST endpoints for room creation and message history (`src/rooms/`)