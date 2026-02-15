import { Controller, Get, Post, Body, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { OrgService } from './org.service.js';
import { CreateOrgDto } from './dto/create-org.dto.js';
import { AddMemberDto } from './dto/add-member.dto.js';
import { SupabaseGuard } from '../auth/supabase.guard.js';

@Controller('/v1/orgs')
@UseGuards(SupabaseGuard)
export class OrgController {
    constructor(private readonly orgService: OrgService) { }

    @Post()
    create(@Request() req: any, @Body() createOrgDto: CreateOrgDto) {
        return this.orgService.createOrg(req.user.sub, createOrgDto);
    }

    @Get()
    findAll(@Request() req: any) {
        return this.orgService.getUserOrgs(req.user.sub);
    }

    @Get(':id/members')
    getMembers(@Request() req: any, @Param('id') id: string) {
        return this.orgService.getOrgMembers(id, req.user.sub);
    }

    @Post(':id/members')
    addMember(@Request() req: any, @Param('id') id: string, @Body() addMemberDto: AddMemberDto) {
        return this.orgService.addMember(id, req.user.sub, addMemberDto);
    }

    @Delete(':id/members/:userId')
    removeMember(@Request() req: any, @Param('id') id: string, @Param('userId') userId: string) {
        return this.orgService.removeMember(id, req.user.sub, userId);
    }
}
