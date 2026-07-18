import { PrismaService } from '../prisma/prisma.service';
export declare class NotificationsService {
    private prisma;
    constructor(prisma: PrismaService);
    create(data: {
        userId: string;
        type: string;
        title: string;
        body: string;
        metadata?: Record<string, any>;
    }): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        isRead: boolean;
        type: string;
        title: string;
        body: string;
        metadata: import("@prisma/client/runtime/client").JsonValue | null;
    }>;
    getForUser(userId: string): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        isRead: boolean;
        type: string;
        title: string;
        body: string;
        metadata: import("@prisma/client/runtime/client").JsonValue | null;
    }[]>;
    getUnreadCount(userId: string): Promise<number>;
    markAsRead(id: string, userId: string): Promise<import("@prisma/client").Prisma.BatchPayload>;
    markAllAsRead(userId: string): Promise<import("@prisma/client").Prisma.BatchPayload>;
}
