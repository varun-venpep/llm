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

export const ALL_TENANT_ADMIN_PERMISSIONS = TENANT_ADMIN_PERMISSIONS.map(permission => permission.key);

export function normalizeTenantAdminPermissions(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((permission): permission is string => typeof permission === 'string');
}

export function hasTenantPermission(user: { role?: string; tenantAdminPermissions?: string[] | null }, permission: string) {
  if (user.role === 'SUPER_ADMIN') return true;
  if (user.role !== 'TENANT_ADMIN') return false;

  const permissions = normalizeTenantAdminPermissions(user.tenantAdminPermissions);
  if (permissions.length === 0) return true;

  return permissions.includes(permission);
}
