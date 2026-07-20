import { PrismaService } from '../prisma/prisma.service';
export declare class UsersService {
    private prisma;
    constructor(prisma: PrismaService);
    search(query: string, excludeUserId: string): Promise<{
        name: string;
        email: string;
        id: string;
        avatarUrl: string | null;
        isOnline: boolean;
    }[]>;
}
