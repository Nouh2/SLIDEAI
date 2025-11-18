var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
// apps/api/src/projects/projects.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service.js';
let ProjectsService = class ProjectsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    list(user) {
        return this.prisma.project.findMany({
            where: { orgId: user.org_id ?? undefined, ownerId: user.sub },
            orderBy: { createdAt: 'desc' },
            select: { id: true, title: true, description: true, createdAt: true },
        });
    }
    create(user, dto) {
        return this.prisma.project.create({
            data: {
                title: dto.title,
                description: dto.description ?? '',
                ownerId: user.sub,
                orgId: user.org_id ?? null,
            },
            select: { id: true, title: true, description: true, createdAt: true },
        });
    }
    async get(user, id) {
        const proj = await this.prisma.project.findFirst({
            where: { id, ownerId: user.sub, orgId: user.org_id ?? null },
            select: { id: true, title: true, description: true, createdAt: true },
        });
        if (!proj)
            throw new NotFoundException('Projet introuvable');
        return proj;
    }
    async update(user, id, dto) {
        await this.get(user, id);
        return this.prisma.project.update({
            where: { id },
            data: { ...dto },
            select: { id: true, title: true, description: true, createdAt: true },
        });
    }
    async remove(user, id) {
        await this.get(user, id);
        await this.prisma.project.delete({ where: { id } });
        return { ok: true };
    }
};
ProjectsService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [PrismaService])
], ProjectsService);
export { ProjectsService };
