import {
  IsDateString,
  IsIn,
  IsOptional,
  IsString,
  Length,
  MaxLength,
} from 'class-validator';
import { IsAfterBirth } from './is-after-birth.validator.js';

export const GENDERS = ['male', 'female', 'other'] as const;

// POST /trees/:id/persons — contract rules for Person.
export class CreatePersonDto {
  @IsString()
  @Length(1, 100)
  name: string;

  @IsOptional()
  @IsIn(GENDERS)
  gender?: string;

  @IsOptional()
  @IsDateString()
  birthDate?: string;

  // deathDate must not be before birthDate (contract) — custom validator below
  @IsOptional()
  @IsDateString()
  @IsAfterBirth()
  deathDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  biography?: string;
}

// PATCH /persons/:id — same rules, everything optional (id and treeId excluded).
export class UpdatePersonDto {
  @IsOptional()
  @IsString()
  @Length(1, 100)
  name?: string;

  @IsOptional()
  @IsIn(GENDERS)
  gender?: string;

  @IsOptional()
  @IsDateString()
  birthDate?: string;

  @IsOptional()
  @IsDateString()
  @IsAfterBirth()
  deathDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  biography?: string;
}
