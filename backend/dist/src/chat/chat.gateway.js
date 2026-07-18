"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const prisma_service_1 = require("../prisma/prisma.service");
const ws_jwt_guard_1 = require("../auth/ws-jwt.guard");
const bullmq_1 = require("@nestjs/bullmq");
const bullmq_2 = require("bullmq");
let ChatGateway = class ChatGateway {
    jwtService;
    prisma;
    notificationsQueue;
    server;
    logger = new common_1.Logger('ChatGateway');
    constructor(jwtService, prisma, notificationsQueue) {
        this.jwtService = jwtService;
        this.prisma = prisma;
        this.notificationsQueue = notificationsQueue;
    }
    async handleConnection(client) {
        try {
            const token = client.handshake.auth?.token ||
                client.handshake.headers?.authorization?.replace('Bearer ', '');
            if (!token) {
                client.disconnect();
                return;
            }
            const payload = this.jwtService.verify(token, {
                secret: process.env.JWT_SECRET || 'dev_secret_change_this',
            });
            client.data.user = { userId: payload.sub, email: payload.email };
            await this.prisma.userConnection.create({
                data: {
                    userId: payload.sub,
                    socketId: client.id,
                },
            });
            await this.prisma.user.update({
                where: { id: payload.sub },
                data: { isOnline: true },
            });
            client.join(`user:${payload.sub}`);
            this.server.emit('user:online', { userId: payload.sub });
            this.logger.log(`Client connected: ${client.id} (user: ${payload.sub})`);
        }
        catch (err) {
            this.logger.warn(`Unauthorized connection attempt: ${client.id}`);
            client.disconnect();
        }
    }
    async handleDisconnect(client) {
        const user = client.data.user;
        if (!user)
            return;
        await this.prisma.userConnection.deleteMany({
            where: { socketId: client.id },
        });
        const remaining = await this.prisma.userConnection.count({
            where: { userId: user.userId },
        });
        if (remaining === 0) {
            await this.prisma.user.update({
                where: { id: user.userId },
                data: { isOnline: false, lastSeen: new Date() },
            });
            this.server.emit('user:offline', { userId: user.userId });
        }
        this.logger.log(`Client disconnected: ${client.id}`);
    }
    async handleJoinRoom(client, data) {
        client.join(`room:${data.chatRoomId}`);
        return { event: 'room:joined', chatRoomId: data.chatRoomId };
    }
    async handleLeaveRoom(client, data) {
        client.leave(`room:${data.chatRoomId}`);
        return { event: 'room:left', chatRoomId: data.chatRoomId };
    }
    handleTypingStart(client, data) {
        client.to(`room:${data.chatRoomId}`).emit('typing:update', {
            userId: client.data.user.userId,
            chatRoomId: data.chatRoomId,
            isTyping: true,
        });
    }
    handleTypingStop(client, data) {
        client.to(`room:${data.chatRoomId}`).emit('typing:update', {
            userId: client.data.user.userId,
            chatRoomId: data.chatRoomId,
            isTyping: false,
        });
    }
    async handleSendMessage(client, data) {
        const senderId = client.data.user.userId;
        const message = await this.prisma.message.create({
            data: {
                content: data.content,
                senderId,
                chatRoomId: data.chatRoomId,
            },
            include: {
                sender: {
                    select: { id: true, name: true, avatarUrl: true },
                },
            },
        });
        this.server.to(`room:${data.chatRoomId}`).emit('message:new', message);
        const otherMembers = await this.prisma.chatRoomMember.findMany({
            where: {
                chatRoomId: data.chatRoomId,
                userId: { not: senderId },
            },
        });
        for (const member of otherMembers) {
            const notificationData = {
                userId: member.userId,
                type: 'NEW_MESSAGE',
                title: `New message from ${message.sender.name}`,
                body: data.content.slice(0, 100),
                metadata: { chatRoomId: data.chatRoomId, messageId: message.id },
            };
            await this.notificationsQueue.add('new-message', notificationData);
            this.server.to(`user:${member.userId}`).emit('notification:new', notificationData);
        }
        return { event: 'message:sent', messageId: message.id };
    }
};
exports.ChatGateway = ChatGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], ChatGateway.prototype, "server", void 0);
__decorate([
    (0, common_1.UseGuards)(ws_jwt_guard_1.WsJwtGuard),
    (0, websockets_1.SubscribeMessage)('room:join'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleJoinRoom", null);
__decorate([
    (0, common_1.UseGuards)(ws_jwt_guard_1.WsJwtGuard),
    (0, websockets_1.SubscribeMessage)('room:leave'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleLeaveRoom", null);
__decorate([
    (0, common_1.UseGuards)(ws_jwt_guard_1.WsJwtGuard),
    (0, websockets_1.SubscribeMessage)('typing:start'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], ChatGateway.prototype, "handleTypingStart", null);
__decorate([
    (0, common_1.UseGuards)(ws_jwt_guard_1.WsJwtGuard),
    (0, websockets_1.SubscribeMessage)('typing:stop'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], ChatGateway.prototype, "handleTypingStop", null);
__decorate([
    (0, common_1.UseGuards)(ws_jwt_guard_1.WsJwtGuard),
    (0, websockets_1.SubscribeMessage)('message:send'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleSendMessage", null);
exports.ChatGateway = ChatGateway = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: { origin: '*' },
    }),
    __param(2, (0, bullmq_1.InjectQueue)('notifications')),
    __metadata("design:paramtypes", [jwt_1.JwtService,
        prisma_service_1.PrismaService,
        bullmq_2.Queue])
], ChatGateway);
//# sourceMappingURL=chat.gateway.js.map