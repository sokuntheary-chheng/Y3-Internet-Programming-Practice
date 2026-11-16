import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import type { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { LoginDto, RegisterDto } from './dto/auth.dto.js';

// The shape of a user the API may return: everything except the password.
const publicUser = {
  id: true,
  name: true,
  email: true,
  createdAt: true,
} satisfies Prisma.UserSelect;

// Passwords are stored hashed, never in clear text (contract). The token is a
// random opaque string kept in memory: good enough for M2. Week 8 replaces
// this with real login (JWT) — the routes and status codes stay the same.
@Injectable()
export class AuthService {
  private readonly tokens = new Map<string, number>();

  constructor(private readonly prisma: PrismaService) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    // 409 email taken
    if (existing) throw new ConflictException('Email already taken');
    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        password: this.hash(dto.password),
      },
      select: publicUser,
    });
    return user;
  }

  async login(dto: LoginDto): Promise<{ token: string }> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    // 401 wrong credentials — same message for "no such email" and "bad
    // password", so the endpoint does not reveal which emails exist.
    if (!user || !this.matches(dto.password, user.password))
      throw new UnauthorizedException('Wrong credentials');
    const token = randomBytes(24).toString('hex');
    this.tokens.set(token, user.id);
    return { token };
  }

  async me(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: publicUser,
    });
    // The session pointed at a user that no longer exists (deleted row).
    if (!user) throw new UnauthorizedException('Unknown user');
    return user;
  }

  // Used by AuthGuard: token -> userId, or undefined when unknown/expired.
  userIdFor(token: string): number | undefined {
    return this.tokens.get(token);
  }

  private hash(password: string): string {
    const salt = randomBytes(16).toString('hex');
    return `${salt}:${scryptSync(password, salt, 64).toString('hex')}`;
  }

  private matches(password: string, stored: string): boolean {
    const [salt, hash] = stored.split(':');
    if (!salt || !hash) return false;
    const candidate = scryptSync(password, salt, 64);
    const expected = Buffer.from(hash, 'hex');
    return candidate.length === expected.length && timingSafeEqual(candidate, expected);
  }
}
