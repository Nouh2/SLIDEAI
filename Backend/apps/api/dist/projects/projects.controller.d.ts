import { ProjectsService } from './projects.service.js';
export declare class ProjectsController {
    private service;
    constructor(service: ProjectsService);
    list(req: any): import(".prisma/client").Prisma.PrismaPromise<{
        id: string;
        createdAt: Date;
        title: string;
        description: string;
    }[]>;
    create(req: any, body: any): import(".prisma/client").Prisma.Prisma__ProjectClient<{
        id: string;
        createdAt: Date;
        title: string;
        description: string;
    }, never, import("@prisma/client/runtime/library").DefaultArgs>;
    get(req: any, id: string): Promise<{
        id: string;
        createdAt: Date;
        title: string;
        description: string;
    }>;
    update(req: any, id: string, body: any): Promise<{
        id: string;
        createdAt: Date;
        title: string;
        description: string;
    }>;
    remove(req: any, id: string): Promise<{
        ok: boolean;
    }>;
}
