import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { TreesService } from './trees.service.js';
import { CreateTreeDto } from './dto/create-tree.dto.js';
import { UpdateTreeDto } from './dto/update-tree.dto.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { AddMemberDto } from './dto/member.dto.js';

// The controller maps HTTP to service calls: no business rules here.
@Controller('trees')
export class TreesController {
  constructor(private readonly trees: TreesService) {}

  @Get()
  findAll(@CurrentUser() userId: number) {
    return this.trees.findAll(userId);
  }

  @Get(':id')
  findOne(@CurrentUser() userId: number, @Param('id', ParseIntPipe) id: number) {
    return this.trees.findOne(userId, id);
  }

  // 201 is the default for @Post; the created tree comes back in the body
  @Post()
  create(@CurrentUser() userId: number, @Body() dto: CreateTreeDto) {
    return this.trees.create(userId, dto);
  }

  @Patch(':id')
  update(
    @CurrentUser() userId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTreeDto,
  ) {
    return this.trees.update(userId, id, dto);
  }

  // 204: success with no body
  @Delete(':id')
  @HttpCode(204)
  remove(@CurrentUser() userId: number, @Param('id', ParseIntPipe) id: number) {
    return this.trees.remove(userId, id);
  }

  // ---- members of a tree -------------------------------------------------

  @Get(':id/members')
  members(@CurrentUser() userId: number, @Param('id', ParseIntPipe) id: number) {
    return this.trees.members(userId, id);
  }

  // 201 Membership
  @Post(':id/members')
  addMember(
    @CurrentUser() userId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AddMemberDto,
  ) {
    return this.trees.addMember(userId, id, dto.email, dto.role);
  }
}
