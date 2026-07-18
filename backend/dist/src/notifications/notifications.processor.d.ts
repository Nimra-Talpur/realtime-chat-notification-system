import { WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { NotificationsService } from './notifications.service';
interface NotificationJobData {
    userId: string;
    type: string;
    title: string;
    body: string;
    metadata?: Record<string, any>;
}
export declare class NotificationsProcessor extends WorkerHost {
    private notificationsService;
    private logger;
    constructor(notificationsService: NotificationsService);
    process(job: Job<NotificationJobData>): Promise<any>;
}
export {};
