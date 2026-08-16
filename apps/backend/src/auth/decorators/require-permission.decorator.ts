import { SetMetadata } from '@nestjs/common';

export const REQUIRE_PERMISSION_KEY = 'require_permission';

/**
 * Binds module permissions requirements to endpoints.
 * @param module The target administrative module (e.g., 'billing', 'user_management')
 * @param action The desired operation (e.g., 'view', 'create', 'edit', 'delete', 'approve', 'manage')
 */
export const RequirePermission = (module: string, action: string) =>
  SetMetadata(REQUIRE_PERMISSION_KEY, { module, action });
