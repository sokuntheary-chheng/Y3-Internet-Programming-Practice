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
import { MemoriesService } from './memories.service.js';
import { CreateMemoryDto } from './dto/create-memory.dto.js';
import { CurrentUser } from '../auth/current-user.decorator.js';

@Controller()
export class MemoriesController {
  constructor(private readonly memories: MemoriesService) {}

  @Get('persons/:id/memories')
  findAll(@CurrentUser() userId: number, @Param('id', ParseIntPipe) id: number) {
    return this.memories.findAll(userId, id);
  }

  // 201 Memory
  @Post('persons/:id/memories')
  create(
    @CurrentUser() userId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateMemoryDto,
  ) {
    return this.memories.create(userId, id, dto);
  }

  @Delete('memories/:id')
  @HttpCode(204)
  remove(@CurrentUser() userId: number, @Param('id', ParseIntPipe) id: number) {
    return this.memories.remove(userId, id);
  }
}
