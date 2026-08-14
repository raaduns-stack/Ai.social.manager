import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
  Inject,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { REQUIRE_PERMISSION_KEY } from '../decorators/require-permission.decorator';
import { DATABASE_CONNECTION } from '../../database/database.module';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as schema from '../../database/schema';
import { and, eq } from 'drizzle-orm';
import { UserRole } from '../../common/enums/roles.enum';
import { ActivityLogsService } from '../../activity-logs/activity-logs.service';

type Database = PostgresJsDatabase<typeof schema>;

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    @Inject(DATABASE_CONNECTION) private readonly db: Database,
    private readonly activityLogsService: ActivityLogsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermission = this.reflector.getAllAndOverride<{ module: string; action: string }>(
      REQUIRE_PERMISSION_KEY,
      [context.getHandler(), context.getClass()],
    );

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Check if user is logged in (JwtAuthGuard attaches user to request)
    if (!user) {
      return false;
    }

    // Customer role is NEVER allowed to access admin endpoints
    if (user.role === UserRole.USER || user.role === 'user') {
      throw new ForbiddenException({
        statusCode: 403,
        error: 'FORBIDDEN',
        message: 'Customers are not allowed to access admin routes.',
        module: requiredPermission?.module || 'admin',
        requiredRole: 'ADMIN',
      });
    }

    // Super Admin bypasses all checks
    if (user.role === UserRole.SUPER_ADMIN) {
      return true;
    }

    // If no specific permission is required, default to allowing all logged-in admin users
    if (!requiredPermission) {
      return true;
    }

    const { module, action } = requiredPermission;

    // Query DB for this role's module permission
    const permission = await this.db.query.rolePermissions.findFirst({
      where: and(
        eq(schema.rolePermissions.role, user.role as any),
        eq(schema.rolePermissions.module, module),
      ),
    });

    const accessLevel = (permission?.accessLevel as string) || 'none';

    // Verify if accessLevel permits action
    let hasAccess = false;
    if (accessLevel === 'full') {
      hasAccess = true;
    } else if (accessLevel === 'none') {
      hasAccess = false;
    } else if (action === 'view') {
      hasAccess = ['view', 'own_only', 'manage', 'full'].includes(accessLevel);
    } else if (action === 'create' || action === 'edit') {
      hasAccess = ['own_only', 'manage', 'full'].includes(accessLevel);
    } else if (action === 'delete') {
      hasAccess = accessLevel === 'full';
    } else if (action === 'manage') {
      hasAccess = ['manage', 'full'].includes(accessLevel);
    } else if (action === 'approve') {
      if (accessLevel === 'manage' || accessLevel === 'full') {
        hasAccess = true;
      } else if (accessLevel === 'view' && user.role === 'reviewer') {
        hasAccess = true;
      }
    }

    if (!hasAccess) {
      // Log denied access attempts to Audit Logs
      await this.activityLogsService.record({
        userId: user.userId || null,
        userName: user.email || null,
        action: 'ACCESS_DENIED',
        module: module,
        description: `Unauthorized attempt to perform ${action} action on module ${module}`,
      });

      throw new ForbiddenException({
        statusCode: 403,
        error: 'FORBIDDEN',
        message: `You don't have permission to access ${module.replace(/_/g, ' ')}.`,
        module: module,
        requiredRole: 'SUPER_ADMIN',
      });
    }

    return true;
  }
}
