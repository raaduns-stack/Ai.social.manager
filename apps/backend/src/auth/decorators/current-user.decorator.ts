import { createParamDecorator, ExecutionContext } from '@nestjs/common';

// Usage: findMe(@CurrentUser() user) instead of manually reading request.user
export const CurrentUser = createParamDecorator((data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();
  return request.user;
});
