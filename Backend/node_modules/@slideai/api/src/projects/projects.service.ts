// apps/api/src/projects/projects.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service.js';
import { CreateProjectDto, UpdateProjectDto } from './dto.js';

@Injectable()
export class ProjectsService {
  constructor(private prisma: PrismaService) {}

  list(user: any) {
    return this.prisma.project.findMany({
      where: { orgId: user.org_id ?? undefined, ownerId: user.sub },
      orderBy: { createdAt: 'desc' },
      select: { id: true, title: true, description: true, createdAt: true },
    });
  }

  create(user: any, dto: CreateProjectDto) {
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

  async get(user: any, id: string) {
    const proj = await this.prisma.project.findFirst({
      where: { id, ownerId: user.sub, orgId: user.org_id ?? null },
      select: { id: true, title: true, description: true, createdAt: true },
    });
    if (!proj) throw new NotFoundException('Projet introuvable');
    return proj;
  }

  async update(user: any, id: string, dto: UpdateProjectDto) {
    await this.get(user, id);
    return this.prisma.project.update({
      where: { id },
      data: { ...dto },
      select: { id: true, title: true, description: true, createdAt: true },
    });
  }

  async remove(user: any, id: string) {
    await this.get(user, id);
    await this.prisma.project.delete({ where: { id } });
    return { ok: true };
  }
}
