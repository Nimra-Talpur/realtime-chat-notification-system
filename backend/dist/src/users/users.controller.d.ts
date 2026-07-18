import { UsersService } from './users.service';
export declare class UsersController {
    private usersService;
    constructor(usersService: UsersService);
    search(req: any, q: string): Promise<{
        id: string;
        name: string;
        email: string;
        avatarUrl: string | null;
        isOnline: boolean;
    }[]>;
}
