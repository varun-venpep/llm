export const TENANT_ADMIN_PERMISSIONS = [
  { key: 'courses.manage', label: 'Manage courses', description: 'Create, edit, publish, and update course content.' },
  { key: 'learners.manage', label: 'Manage learners', description: 'Create, edit, deactivate, and reset learner accounts.' },
  { key: 'people.manage', label: 'Manage teams and job roles', description: 'Create teams, job roles, and learner mappings.' },
  { key: 'certificates.manage', label: 'Manage certificates', description: 'Configure certificate templates and course certificates.' },
  { key: 'reports.view', label: 'View reports', description: 'Access analytics, reports, progress, and audit insights.' },
  { key: 'announcements.manage', label: 'Manage announcements', description: 'Create and update workspace announcements.' },
  { key: 'branding.manage', label: 'Manage branding and settings', description: 'Edit logos, colors, domains, and workspace settings.' },
] as const;

export type TenantAdminPermission = typeof TENANT_ADMIN_PERMISSIONS[number]['key'];

export const ALL_TENANT_ADMIN_PERMISSIONS: TenantAdminPermission[] = TENANT_ADMIN_PERMISSIONS.map(permission => permission.key);

const TENANT_ADMIN_PERMISSION_KEYS = new Set<string>(ALL_TENANT_ADMIN_PERMISSIONS);

export function isTenantAdminPermission(value: unknown): value is TenantAdminPermission {
  return typeof value === 'string' && TENANT_ADMIN_PERMISSION_KEYS.has(value);
}

export function normalizeTenantAdminPermissions(value: unknown): TenantAdminPermission[] {
  if (!Array.isArray(value)) return [];
  return value.filter(isTenantAdminPermission);
}

export function hasTenantPermission(user: { role?: string; tenantAdminPermissions?: string[] | null }, permission: string) {
  if (user.role === 'SUPER_ADMIN') return true;

  const permissions = normalizeTenantAdminPermissions(user.tenantAdminPermissions);
  if (user.role === 'TENANT_ADMIN' && permissions.length === 0) return true;
  if (permissions.length === 0) return false;

  return isTenantAdminPermission(permission) && permissions.includes(permission);
}
