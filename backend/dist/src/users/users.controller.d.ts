import { UsersService } from './users.service';
export declare class UsersController {
    private usersService;
    constructor(usersService: UsersService);
    search(req: any, q: string): Promise<{
        name: string;
        email: string;
        id: string;
        avatarUrl: string | null;
        isOnline: boolean;
    }[]>;
}
