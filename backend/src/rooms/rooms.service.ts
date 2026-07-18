import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RoomsService {
  constructor(private prisma: PrismaService) {}


async createOrGetDirectRoom(userId: string, otherUserId: string) {
    const existing = await this.prisma.chatRoom.findFirst({
      where: {
        isGroup: false,
        members: {
          every: { userId: { in: [userId, otherUserId] } },
        },
      },
      include: {
        members: {
          include: {
            user: { select: { id: true, name: true, avatarUrl: true, isOnline: true } },
          },
        },
      },
    });

    if (existing && existing.members.length === 2) {
      return existing;
    }

    return this.prisma.chatRoom.create({
      data: {
        isGroup: false,
        members: {
          create: [{ userId }, { userId: otherUserId }],
        },
      },
      include: {
        members: {
          include: {
            user: { select: { id: true, name: true, avatarUrl: true, isOnline: true } },
          },
        },
      },
    });
  }

  // Create a group room
  async createGroupRoom(name: string, creatorId: string, memberIds: string[]) {
    const allMembers = Array.from(new Set([creatorId, ...memberIds]));
    return this.prisma.chatRoom.create({
      data: {
        name,
        isGroup: true,
        members: {
          create: allMembers.map((userId) => ({ userId })),
        },
      },
      include: {
        members: {
          include: {
            user: { select: { id: true, name: true, avatarUrl: true, isOnline: true } },
          },
        },
      },
    });
  }
  // List rooms a user belongs to
  async getUserRooms(userId: string) {
    return this.prisma.chatRoom.findMany({
      where: {
        members: { some: { userId } },
      },
      include: {
        members: {
          include: {
            user: { select: { id: true, name: true, avatarUrl: true, isOnline: true } },
          },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  // Get message history for a room (with access check)
  async getRoomMessages(roomId: string, userId: string) {
    const membership = await this.prisma.chatRoomMember.findUnique({
      where: { userId_chatRoomId: { userId, chatRoomId: roomId } },
    });

    if (!membership) {
      throw new ForbiddenException('You are not a member of this room');
    }

    return this.prisma.message.findMany({
      where: { chatRoomId: roomId },
      include: {
        sender: { select: { id: true, name: true, avatarUrl: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }
}