import { ProjectsService } from './projects.service.js';
export declare class ProjectsController {
    private service;
    constructor(service: ProjectsService);
    list(req: any): import(".prisma/client").Prisma.PrismaPromise<{
        title: string;
        description: string;
        id: string;
        createdAt: Date;
    }[]>;
    create(req: any, body: any): import(".prisma/client").Prisma.Prisma__ProjectClient<{
        title: string;
        description: string;
        id: string;
        createdAt: Date;
    }, never, import("@prisma/client/runtime/library").DefaultArgs>;
    get(req: any, id: string): Promise<{
        title: string;
        description: string;
        id: string;
        createdAt: Date;
    }>;
    update(req: any, id: string, body: any): Promise<{
        title: string;
        description: string;
        id: string;
        createdAt: Date;
    }>;
    remove(req: any, id: string): Promise<{
        ok: boolean;
    }>;
}
