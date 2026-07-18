import { PrismaService } from '../prisma/prisma.service';
export declare class RoomsService {
    private prisma;
    constructor(prisma: PrismaService);
    createOrGetDirectRoom(userId: string, otherUserId: string): Promise<{
        members: ({
            user: {
                name: string;
                id: string;
                avatarUrl: string | null;
                isOnline: boolean;
            };
        } & {
            id: string;
            userId: string;
            chatRoomId: string;
            joinedAt: Date;
            isTyping: boolean;
        })[];
    } & {
        name: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        isGroup: boolean;
    }>;
    createGroupRoom(name: string, creatorId: string, memberIds: string[]): Promise<{
        members: ({
            user: {
                name: string;
                id: string;
                avatarUrl: string | null;
                isOnline: boolean;
            };
        } & {
            id: string;
            userId: string;
            chatRoomId: string;
            joinedAt: Date;
            isTyping: boolean;
        })[];
    } & {
        name: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        isGroup: boolean;
    }>;
    getUserRooms(userId: string): Promise<({
        members: ({
            user: {
                name: string;
                id: string;
                avatarUrl: string | null;
                isOnline: boolean;
            };
        } & {
            id: string;
            userId: string;
            chatRoomId: string;
            joinedAt: Date;
            isTyping: boolean;
        })[];
        messages: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            content: string;
            isRead: boolean;
            senderId: string;
            chatRoomId: string;
        }[];
    } & {
        name: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        isGroup: boolean;
    })[]>;
    getRoomMessages(roomId: string, userId: string): Promise<({
        sender: {
            name: string;
            id: string;
            avatarUrl: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        content: string;
        isRead: boolean;
        senderId: string;
        chatRoomId: string;
    })[]>;
}
