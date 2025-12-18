import { PrismaService } from '../prisma.service.js';
import { CreateProjectDto, UpdateProjectDto } from './dto.js';
export declare class ProjectsService {
    private prisma;
    constructor(prisma: PrismaService);
    list(user: any): import(".prisma/client").Prisma.PrismaPromise<{
        title: string;
        description: string;
        id: string;
        createdAt: Date;
    }[]>;
    create(user: any, dto: CreateProjectDto): import(".prisma/client").Prisma.Prisma__ProjectClient<{
        title: string;
        description: string;
        id: string;
        createdAt: Date;
    }, never, import("@prisma/client/runtime/library").DefaultArgs>;
    get(user: any, id: string): Promise<{
        title: string;
        description: string;
        id: string;
        createdAt: Date;
    }>;
    update(user: any, id: string, dto: UpdateProjectDto): Promise<{
        title: string;
        description: string;
        id: string;
        createdAt: Date;
    }>;
    remove(user: any, id: string): Promise<{
        ok: boolean;
    }>;
}
