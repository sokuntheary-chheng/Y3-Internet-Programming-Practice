import { PartialType } from '@nestjs/mapped-types';
import { CreateTreeDto } from './create-tree.dto.js';

// Every field of CreateTreeDto, all optional, with the same validation rules
export class UpdateTreeDto extends PartialType(CreateTreeDto) {}
