import { ProjectsService } from './projects.service.js';
export declare class ProjectsController {
    private service;
    constructor(service: ProjectsService);
    list(req: any): import(".prisma/client").Prisma.PrismaPromise<{
        title: string;
        id: string;
        createdAt: Date;
        description: string;
    }[]>;
    create(req: any, body: any): import(".prisma/client").Prisma.Prisma__ProjectClient<{
        title: string;
        id: string;
        createdAt: Date;
        description: string;
    }, never, import("@prisma/client/runtime/library").DefaultArgs>;
    get(req: any, id: string): Promise<{
        title: string;
        id: string;
        createdAt: Date;
        description: string;
    }>;
    update(req: any, id: string, body: any): Promise<{
        title: string;
        id: string;
        createdAt: Date;
        description: string;
    }>;
    remove(req: any, id: string): Promise<{
        ok: boolean;
    }>;
}
