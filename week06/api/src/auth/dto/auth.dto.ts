import {
  IsEmail,
  IsOptional,
  IsString,
  Length,
  MinLength,
} from 'class-validator';

// POST /auth/register — contract: name 2–100, valid email, password 8+ chars.
export class RegisterDto {
  @IsString()
  @Length(2, 100)
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;
}

// POST /auth/login — only "wrong credentials" (401) is a rule here, no 409.
export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(1)
  password: string;
}

// GET /me has no body; kept so the controller file stays self-describing.
export class EmptyDto {
  @IsOptional()
  @IsString()
  _?: string;
}
