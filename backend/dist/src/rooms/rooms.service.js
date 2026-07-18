"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoomsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let RoomsService = class RoomsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createOrGetDirectRoom(userId, otherUserId) {
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
    async createGroupRoom(name, creatorId, memberIds) {
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
    async getUserRooms(userId) {
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
    async getRoomMessages(roomId, userId) {
        const membership = await this.prisma.chatRoomMember.findUnique({
            where: { userId_chatRoomId: { userId, chatRoomId: roomId } },
        });
        if (!membership) {
            throw new common_1.ForbiddenException('You are not a member of this room');
        }
        return this.prisma.message.findMany({
            where: { chatRoomId: roomId },
            include: {
                sender: { select: { id: true, name: true, avatarUrl: true } },
            },
            orderBy: { createdAt: 'asc' },
        });
    }
};
exports.RoomsService = RoomsService;
exports.RoomsService = RoomsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], RoomsService);
//# sourceMappingURL=rooms.service.js.map