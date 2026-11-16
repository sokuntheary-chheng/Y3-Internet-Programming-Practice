import { IsString, Length } from 'class-validator';

// POST /persons/:id/memories — contract: content 1–2000 chars.
export class CreateMemoryDto {
  @IsString()
  @Length(1, 2000)
  content: string;
}
