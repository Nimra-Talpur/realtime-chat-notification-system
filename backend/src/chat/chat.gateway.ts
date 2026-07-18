import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { WsJwtGuard } from '../auth/ws-jwt.guard';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@WebSocketGateway({
  cors: { origin: '*' },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private logger = new Logger('ChatGateway');

  constructor(
    private jwtService: JwtService,
    private prisma: PrismaService,
    @InjectQueue('notifications') private notificationsQueue: Queue,
  ) {}

  // Runs when any client connects
  async handleConnection(client: Socket) {
    try {
      const token =
        client.handshake.auth?.token ||
        (client.handshake.headers?.authorization as string)?.replace('Bearer ', '');

      if (!token) {
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token, {
        secret: process.env.JWT_SECRET || 'dev_secret_change_this',
      });

      client.data.user = { userId: payload.sub, email: payload.email };

      // Save connection record
      await this.prisma.userConnection.create({
        data: {
          userId: payload.sub,
          socketId: client.id,
        },
      });

      // Mark user online
      await this.prisma.user.update({
        where: { id: payload.sub },
        data: { isOnline: true },
      });

      // Join a personal room named after their userId (lets us target them directly)
      client.join(`user:${payload.sub}`);

      // Notify everyone this user is online
      this.server.emit('user:online', { userId: payload.sub });

      this.logger.log(`Client connected: ${client.id} (user: ${payload.sub})`);
    } catch (err) {
      this.logger.warn(`Unauthorized connection attempt: ${client.id}`);
      client.disconnect();
    }
  }

  // Runs when any client disconnects
  async handleDisconnect(client: Socket) {
    const user = client.data.user;
    if (!user) return;

    // Remove this specific connection record
    await this.prisma.userConnection.deleteMany({
      where: { socketId: client.id },
    });

    // Check if user has any other active connections (other tabs/devices)
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

  // ----- Join a chat room -----
  @UseGuards(WsJwtGuard)
  @SubscribeMessage('room:join')
  async handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { chatRoomId: string },
  ) {
    client.join(`room:${data.chatRoomId}`);
    return { event: 'room:joined', chatRoomId: data.chatRoomId };
  }

  // ----- Leave a chat room -----
  @UseGuards(WsJwtGuard)
  @SubscribeMessage('room:leave')
  async handleLeaveRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { chatRoomId: string },
  ) {
    client.leave(`room:${data.chatRoomId}`);
    return { event: 'room:left', chatRoomId: data.chatRoomId };
  }

  // ----- Typing indicator -----
  @UseGuards(WsJwtGuard)
  @SubscribeMessage('typing:start')
  handleTypingStart(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { chatRoomId: string },
  ) {
    client.to(`room:${data.chatRoomId}`).emit('typing:update', {
      userId: client.data.user.userId,
      chatRoomId: data.chatRoomId,
      isTyping: true,
    });
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('typing:stop')
  handleTypingStop(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { chatRoomId: string },
  ) {
    client.to(`room:${data.chatRoomId}`).emit('typing:update', {
      userId: client.data.user.userId,
      chatRoomId: data.chatRoomId,
      isTyping: false,
    });
  }


 // ----- Send a message -----
  @UseGuards(WsJwtGuard)
  @SubscribeMessage('message:send')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { chatRoomId: string; content: string },
  ) {
    const senderId = client.data.user.userId;

    // Save message to DB
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

    // Broadcast to everyone in the room live
    this.server.to(`room:${data.chatRoomId}`).emit('message:new', message);

    // Find other members of the room (excluding sender) to notify
    const otherMembers = await this.prisma.chatRoomMember.findMany({
      where: {
        chatRoomId: data.chatRoomId,
        userId: { not: senderId },
      },
    });

    // Queue a background notification job for each recipient
    // Queue a background notification job for each recipient
    for (const member of otherMembers) {
      const notificationData = {
        userId: member.userId,
        type: 'NEW_MESSAGE',
        title: `New message from ${message.sender.name}`,
        body: data.content.slice(0, 100),
        metadata: { chatRoomId: data.chatRoomId, messageId: message.id },
      };

      await this.notificationsQueue.add('new-message', notificationData);

      // Push live to the recipient immediately (if they're connected)
      this.server.to(`user:${member.userId}`).emit('notification:new', notificationData);
    }

    return { event: 'message:sent', messageId: message.id };
  }
}