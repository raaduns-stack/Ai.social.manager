import { pgTable, uuid, varchar, pgEnum, unique } from 'drizzle-orm/pg-core';
import { roleEnum } from './users.schema';

export const permissionLevelEnum = pgEnum('permission_level', [
  'full',
  'manage',
  'view',
  'own_only',
  'none'
]);

export const rolePermissions = pgTable('role_permissions', {
  id: uuid('id').primaryKey().defaultRandom(),
  role: roleEnum('role').notNull(),
  module: varchar('module', { length: 255 }).notNull(),
  accessLevel: permissionLevelEnum('access_level').notNull(),
}, (t) => [
  unique('role_module_unique').on(t.role, t.module),
]);

export type RolePermission = typeof rolePermissions.$inferSelect;
export type NewRolePermission = typeof rolePermissions.$inferInsert;
