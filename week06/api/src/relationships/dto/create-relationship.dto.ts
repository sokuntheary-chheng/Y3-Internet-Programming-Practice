import {
  IsIn,
  IsInt,
} from 'class-validator';
import { RELATION_TYPES } from '../relation.constants.js';

// POST /trees/:id/persons/:id/relationships → POST /trees/:id/relationships
export class CreateRelationshipDto {
  @IsInt()
  personId: number;

  @IsInt()
  relatedPersonId: number;

  @IsIn(RELATION_TYPES)
  type: string;
}
