import {
  Body,
  Controller,
  Delete,
  HttpCode,
  Param,
  ParseIntPipe,
  Patch,
} from '@nestjs/common';
import { MembersService } from './members.service.js';
import { MemberRoleDto } from '../trees/dto/member.dto.js';
import { CurrentUser } from '../auth/current-user.decorator.js';

@Controller('members')
export class MembersController {
  constructor(private readonly members: MembersService) {}

  @Patch(':id')
  update(
    @CurrentUser() userId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: MemberRoleDto,
  ) {
    return this.members.update(userId, id, dto.role);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@CurrentUser() userId: number, @Param('id', ParseIntPipe) id: number) {
    return this.members.remove(userId, id);
  }
}
