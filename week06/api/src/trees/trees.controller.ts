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

// The controller maps HTTP to service calls: no business rules here.
@Controller('trees')
export class TreesController {
  constructor(private readonly trees: TreesService) {}

  @Get()
  findAll() {
    return this.trees.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.trees.findOne(id);
  }

  // 201 is the default for @Post; the created tree comes back in the body
  @Post()
  create(@Body() dto: CreateTreeDto) {
    return this.trees.create(dto);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateTreeDto) {
    return this.trees.update(id, dto);
  }

  // 204: success with no body
  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id', ParseIntPipe) id: number) {
    this.trees.remove(id);
  }
}
