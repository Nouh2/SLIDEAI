import { ProjectsService } from './projects.service.js';
export declare class ProjectsController {
    private service;
    constructor(service: ProjectsService);
    list(req: any): any;
    create(req: any, body: any): any;
    get(req: any, id: string): Promise<any>;
    update(req: any, id: string, body: any): Promise<any>;
    remove(req: any, id: string): Promise<{
        ok: boolean;
    }>;
}
