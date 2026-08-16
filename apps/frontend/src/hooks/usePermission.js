import { useAdminAuth } from '../context/useAdminAuth';

/**
 * Hook to check if the current admin user has a specific permission.
 * @param {string} module The module name (e.g. 'billing', 'user_management')
 * @param {string} action The action name ('view', 'create', 'edit', 'delete', 'approve', 'manage')
 * @returns {boolean} Whether the action is permitted
 */
export function usePermission(module, action) {
  const { permissions, admin } = useAdminAuth();

  if (!admin) return false;
  if (admin.role === 'super_admin') return true;
  if (!permissions) return false;

  const level = permissions[module];
  if (!level || level === 'none') return false;

  if (action === 'view') {
    return ['view', 'own_only', 'manage', 'full'].includes(level);
  }
  if (action === 'create' || action === 'edit') {
    return ['own_only', 'manage', 'full'].includes(level);
  }
  if (action === 'delete') {
    return level === 'full';
  }
  if (action === 'manage') {
    return ['manage', 'full'].includes(level);
  }
  if (action === 'approve') {
    if (level === 'manage' || level === 'full') return true;
    if (level === 'view' && admin.role === 'reviewer') return true;
    return false;
  }

  return false;
}

/**
 * Hook to get the raw access level for a module.
 * @param {string} module The module name
 * @returns {string} One of 'full', 'manage', 'view', 'own_only', 'none'
 */
export function useModulePermission(module) {
  const { permissions, admin } = useAdminAuth();

  if (!admin) return 'none';
  if (admin.role === 'super_admin') return 'full';
  return permissions?.[module] || 'none';
}
