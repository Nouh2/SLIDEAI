var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
// apps/api/src/projects/projects.controller.ts
import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards, UsePipes } from '@nestjs/common';
import { SupabaseGuard } from '../auth/supabase.guard.js';
import { ProjectsService } from './projects.service.js';
import { ZodValidationPipe } from '../common/zod-pipe.js';
import { createProjectSchema, updateProjectSchema } from './dto.js';
let ProjectsController = class ProjectsController {
    service;
    constructor(service) {
        this.service = service;
    }
    list(req) {
        return this.service.list(req.user);
    }
    create(req, body) {
        return this.service.create(req.user, body);
    }
    get(req, id) {
        return this.service.get(req.user, id);
    }
    update(req, id, body) {
        return this.service.update(req.user, id, body);
    }
    remove(req, id) {
        return this.service.remove(req.user, id);
    }
};
__decorate([
    Get(),
    __param(0, Req()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ProjectsController.prototype, "list", null);
__decorate([
    Post(),
    UsePipes(new ZodValidationPipe(createProjectSchema)),
    __param(0, Req()),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], ProjectsController.prototype, "create", null);
__decorate([
    Get(':id'),
    __param(0, Req()),
    __param(1, Param('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], ProjectsController.prototype, "get", null);
__decorate([
    Patch(':id'),
    UsePipes(new ZodValidationPipe(updateProjectSchema)),
    __param(0, Req()),
    __param(1, Param('id')),
    __param(2, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", void 0)
], ProjectsController.prototype, "update", null);
__decorate([
    Delete(':id'),
    __param(0, Req()),
    __param(1, Param('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], ProjectsController.prototype, "remove", null);
ProjectsController = __decorate([
    Controller('/projects'),
    UseGuards(SupabaseGuard),
    __metadata("design:paramtypes", [ProjectsService])
], ProjectsController);
export { ProjectsController };
