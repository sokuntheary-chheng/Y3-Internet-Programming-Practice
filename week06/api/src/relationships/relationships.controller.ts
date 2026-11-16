import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import { RelationshipsService } from './relationships.service.js';
import { CreateRelationshipDto } from './dto/create-relationship.dto.js';
import { CurrentUser } from '../auth/current-user.decorator.js';

@Controller()
export class RelationshipsController {
  constructor(private readonly relationships: RelationshipsService) {}

  @Get('trees/:id/relationships')
  findAll(@CurrentUser() userId: number, @Param('id', ParseIntPipe) id: number) {
    return this.relationships.findAll(userId, id);
  }

  // 201 Relationship
  @Post('trees/:id/relationships')
  create(
    @CurrentUser() userId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateRelationshipDto,
  ) {
    return this.relationships.create(userId, id, dto);
  }

  @Delete('relationships/:id')
  @HttpCode(204)
  remove(@CurrentUser() userId: number, @Param('id', ParseIntPipe) id: number) {
    return this.relationships.remove(userId, id);
  }
}
