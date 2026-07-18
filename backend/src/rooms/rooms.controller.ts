import { Controller, Post, Get, Body, Param, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RoomsService } from './rooms.service';

@Controller('rooms')
@UseGuards(AuthGuard('jwt'))
export class RoomsController {
  constructor(private roomsService: RoomsService) {}

  @Post('direct')
  createDirect(@Req() req: any, @Body('otherUserId') otherUserId: string) {
    return this.roomsService.createOrGetDirectRoom(req.user.userId, otherUserId);
  }

  @Post('group')
  createGroup(
    @Req() req: any,
    @Body('name') name: string,
    @Body('memberIds') memberIds: string[],
  ) {
    return this.roomsService.createGroupRoom(name, req.user.userId, memberIds);
  }

  @Get()
  getMyRooms(@Req() req: any) {
    return this.roomsService.getUserRooms(req.user.userId);
  }

  @Get(':id/messages')
  getMessages(@Req() req: any, @Param('id') id: string) {
    return this.roomsService.getRoomMessages(id, req.user.userId);
  }
}