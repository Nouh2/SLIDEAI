import { PrismaService } from '../prisma.service.js';
import { CreateProjectDto, UpdateProjectDto } from './dto.js';
export declare class ProjectsService {
    private prisma;
    constructor(prisma: PrismaService);
    list(user: any): any;
    create(user: any, dto: CreateProjectDto): any;
    get(user: any, id: string): Promise<any>;
    update(user: any, id: string, dto: UpdateProjectDto): Promise<any>;
    remove(user: any, id: string): Promise<{
        ok: boolean;
    }>;
}
