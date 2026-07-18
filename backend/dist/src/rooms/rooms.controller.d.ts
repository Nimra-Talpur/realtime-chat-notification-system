import { RoomsService } from './rooms.service';
export declare class RoomsController {
    private roomsService;
    constructor(roomsService: RoomsService);
    createDirect(req: any, otherUserId: string): Promise<{
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
    createGroup(req: any, name: string, memberIds: string[]): Promise<{
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
    getMyRooms(req: any): Promise<({
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
    getMessages(req: any, id: string): Promise<({
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
