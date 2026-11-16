import { IsEmail, IsIn, IsString } from 'class-validator';
import { ROLES } from '../role.constants.js';

// POST /trees/:id/members — contract: email (valid), role (one of the three).
export class AddMemberDto {
  @IsEmail()
  email: string;

  @IsString()
  @IsIn(ROLES)
  role: string;
}

// PATCH /members/:id — contract: role only.
export class MemberRoleDto {
  @IsString()
  @IsIn(ROLES)
  role: string;
}
