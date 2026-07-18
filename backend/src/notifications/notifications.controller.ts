import { Controller, Get, Patch, Param, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
@UseGuards(AuthGuard('jwt'))
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}

  @Get()
  getAll(@Req() req: any) {
    return this.notificationsService.getForUser(req.user.userId);
  }

  @Get('unread-count')
  getUnreadCount(@Req() req: any) {
    return this.notificationsService.getUnreadCount(req.user.userId);
  }

  @Patch(':id/read')
  markAsRead(@Req() req: any, @Param('id') id: string) {
    return this.notificationsService.markAsRead(id, req.user.userId);
  }

  @Patch('read-all')
  markAllAsRead(@Req() req: any) {
    return this.notificationsService.markAllAsRead(req.user.userId);
  }
}