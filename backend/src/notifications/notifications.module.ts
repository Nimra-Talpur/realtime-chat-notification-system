import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { NotificationsProcessor } from './notifications.processor';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'notifications',
    }),
  ],
  providers: [NotificationsService, NotificationsProcessor],
  controllers: [NotificationsController],
  exports: [NotificationsService, BullModule],
})
export class NotificationsModule {}