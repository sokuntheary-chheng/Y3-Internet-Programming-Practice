import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { AuthedRequest } from './auth.guard.js';

// Reads the id that AuthGuard put on the request: @CurrentUser() userId: number
export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): number => {
    const req = context.switchToHttp().getRequest<AuthedRequest>();
    return req.userId as number;
  },
);
