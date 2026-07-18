import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { Queue } from 'bullmq';
export declare class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private jwtService;
    private prisma;
    private notificationsQueue;
    server: Server;
    private logger;
    constructor(jwtService: JwtService, prisma: PrismaService, notificationsQueue: Queue);
    handleConnection(client: Socket): Promise<void>;
    handleDisconnect(client: Socket): Promise<void>;
    handleJoinRoom(client: Socket, data: {
        chatRoomId: string;
    }): Promise<{
        event: string;
        chatRoomId: string;
    }>;
    handleLeaveRoom(client: Socket, data: {
        chatRoomId: string;
    }): Promise<{
        event: string;
        chatRoomId: string;
    }>;
    handleTypingStart(client: Socket, data: {
        chatRoomId: string;
    }): void;
    handleTypingStop(client: Socket, data: {
        chatRoomId: string;
    }): void;
    handleSendMessage(client: Socket, data: {
        chatRoomId: string;
        content: string;
    }): Promise<{
        event: string;
        messageId: string;
    }>;
}
