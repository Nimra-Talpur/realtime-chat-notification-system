# Redis Integration

This branch covers the Redis integration for this project:

- Redis runs via Docker (`redis:7-alpine`), exposed on port 6379
- Used as the BullMQ job queue broker (see `notifications` branch)
- Used as the Socket.IO Pub/Sub adapter via `@socket.io/redis-adapter`, configured in `src/main.ts`, enabling horizontal scaling of WebSocket connections across multiple backend instances