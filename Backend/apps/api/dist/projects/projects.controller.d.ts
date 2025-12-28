import { ProjectsService } from './projects.service.js';
export declare class ProjectsController {
    private service;
    constructor(service: ProjectsService);
    list(req: any): import(".prisma/client").Prisma.PrismaPromise<{
        id: string;
        title: string;
        description: string;
        createdAt: Date;
    }[]>;
    create(req: any, body: any): import(".prisma/client").Prisma.Prisma__ProjectClient<{
        id: string;
        title: string;
        description: string;
        createdAt: Date;
    }, never, import("@prisma/client/runtime/library").DefaultArgs>;
    get(req: any, id: string): Promise<{
        id: string;
        title: string;
        description: string;
        createdAt: Date;
    }>;
    update(req: any, id: string, body: any): Promise<{
        id: string;
        title: string;
        description: string;
        createdAt: Date;
    }>;
    remove(req: any, id: string): Promise<{
        ok: boolean;
    }>;
}
