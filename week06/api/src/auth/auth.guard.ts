import {
  CanActivate,
  ExecutionContext,
  Injectable,
  SetMetadata,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { AuthService } from './auth.service.js';

export const IS_PUBLIC = 'isPublic';
// @Public() marks the only two routes that work without a token (contract).
export const Public = () => SetMetadata(IS_PUBLIC, true);

export interface AuthedRequest extends Request {
  userId?: number;
}

// Reads "Authorization: Bearer <token>" and puts the user id on the request.
// Registered as APP_GUARD, so every route requires a login unless it is @Public().
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly auth: AuthService,
    private readonly reflector: Reflector,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const req = context.switchToHttp().getRequest<AuthedRequest>();
    const header = req.headers.authorization ?? '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : undefined;
    // 401 without a valid token (contract)
    if (!token) throw new UnauthorizedException('Missing token');
    const userId = this.auth.userIdFor(token);
    if (userId === undefined) throw new UnauthorizedException('Invalid token');
    req.userId = userId;
    return true;
  }
}
