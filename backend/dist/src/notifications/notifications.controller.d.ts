import { NotificationsService } from './notifications.service';
export declare class NotificationsController {
    private notificationsService;
    constructor(notificationsService: NotificationsService);
    getAll(req: any): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        isRead: boolean;
        type: string;
        title: string;
        body: string;
        metadata: import("@prisma/client/runtime/client").JsonValue | null;
    }[]>;
    getUnreadCount(req: any): Promise<number>;
    markAsRead(req: any, id: string): Promise<import("@prisma/client").Prisma.BatchPayload>;
    markAllAsRead(req: any): Promise<import("@prisma/client").Prisma.BatchPayload>;
}
