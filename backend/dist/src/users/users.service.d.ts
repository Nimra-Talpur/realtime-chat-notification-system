import { PrismaService } from '../prisma/prisma.service';
export declare class UsersService {
    private prisma;
    constructor(prisma: PrismaService);
    search(query: string, excludeUserId: string): Promise<{
        id: string;
        name: string;
        email: string;
        avatarUrl: string | null;
        isOnline: boolean;
    }[]>;
}
