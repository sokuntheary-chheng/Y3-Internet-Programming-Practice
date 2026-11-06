import { IsOptional, IsString, Length, MaxLength } from 'class-validator';

// What a client may send to create a tree. `id`, `createdAt` and `ownerId`
// are not here: the server decides them (contract: docs/api-contract.md).
export class CreateTreeDto {
  @IsString()
  @Length(1, 100)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}
