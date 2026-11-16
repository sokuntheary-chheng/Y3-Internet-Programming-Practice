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
import { PersonsService } from './persons.service.js';
import { CreatePersonDto, UpdatePersonDto } from './dto/person.dto.js';
import { CurrentUser } from '../auth/current-user.decorator.js';

@Controller()
export class PersonsController {
  constructor(private readonly persons: PersonsService) {}

  // /trees/:id/persons
  @Get('trees/:id/persons')
  findAll(@CurrentUser() userId: number, @Param('id', ParseIntPipe) id: number) {
    return this.persons.findAll(userId, id);
  }

  // 201 Person
  @Post('trees/:id/persons')
  create(
    @CurrentUser() userId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreatePersonDto,
  ) {
    return this.persons.create(userId, id, dto);
  }

  // /persons/:id
  @Get('persons/:id')
  findOne(@CurrentUser() userId: number, @Param('id', ParseIntPipe) id: number) {
    return this.persons.findOne(userId, id);
  }

  @Patch('persons/:id')
  update(
    @CurrentUser() userId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePersonDto,
  ) {
    return this.persons.update(userId, id, dto);
  }

  @Delete('persons/:id')
  @HttpCode(204)
  remove(@CurrentUser() userId: number, @Param('id', ParseIntPipe) id: number) {
    return this.persons.remove(userId, id);
  }
}
