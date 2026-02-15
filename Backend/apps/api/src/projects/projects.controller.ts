// apps/api/src/projects/projects.controller.ts
import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards, UsePipes } from '@nestjs/common';
import { SupabaseGuard } from '../auth/supabase.guard.js';
import { ProjectsService } from './projects.service.js';
import { ZodValidationPipe } from '../common/zod-pipe.js';
import { createProjectSchema, updateProjectSchema } from './dto.js';

@Controller('/v1/projects')
@UseGuards(SupabaseGuard)
export class ProjectsController {
  constructor(private service: ProjectsService) { }

  @Get()
  list(@Req() req: any) {
    return this.service.list(req.user);
  }

  @Post()
  @UsePipes(new ZodValidationPipe(createProjectSchema))
  create(@Req() req: any, @Body() body: any) {
    return this.service.create(req.user, body);
  }

  @Get(':id')
  get(@Req() req: any, @Param('id') id: string) {
    return this.service.get(req.user, id);
  }

  @Patch(':id')
  @UsePipes(new ZodValidationPipe(updateProjectSchema))
  update(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    return this.service.update(req.user, id, body);
  }

  @Delete(':id')
  remove(@Req() req: any, @Param('id') id: string) {
    return this.service.remove(req.user, id);
  }
}
