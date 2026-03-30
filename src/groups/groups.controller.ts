import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AddGroupMemberDto } from '../common/dtos/add-group-member.dto';
import { CreateGroupDto } from '../common/dtos/create-group.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { GroupsService } from './groups.service';

interface AuthenticatedRequest {
	user?: {
		id?: string;
	};
}

@ApiTags('groups')
@Controller('groups')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class GroupsController {
	constructor(private readonly groupsService: GroupsService) {}

	@Post()
	@ApiOperation({ summary: 'Crear grupo y agregar al creador como miembro' })
	createGroup(@Body() dto: CreateGroupDto, @Req() req: AuthenticatedRequest) {
		return this.groupsService.createGroup(dto, req.user?.id ?? '');
	}

	@Post(':groupId/members')
	@ApiOperation({ summary: 'Agregar usuario a grupo' })
	addMember(@Param('groupId') groupId: string, @Body() dto: AddGroupMemberDto) {
		return this.groupsService.addMember(groupId, dto);
	}

	@Get(':groupId/members')
	@ApiOperation({ summary: 'Listar miembros de un grupo' })
	listMembers(@Param('groupId') groupId: string) {
		return this.groupsService.listMembers(groupId);
	}
}
