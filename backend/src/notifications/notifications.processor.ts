import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { NotificationsService } from './notifications.service';

interface NotificationJobData {
  userId: string;
  type: string;
  title: string;
  body: string;
  metadata?: Record<string, any>;
}

@Processor('notifications')
export class NotificationsProcessor extends WorkerHost {
  private logger = new Logger('NotificationsProcessor');

  constructor(private notificationsService: NotificationsService) {
    super();
  }

  async process(job: Job<NotificationJobData>): Promise<any> {
    this.logger.log(`Processing notification job ${job.id} for user ${job.data.userId}`);

    const notification = await this.notificationsService.create(job.data);

    this.logger.log(`Notification ${notification.id} created`);
    return notification;
  }
}