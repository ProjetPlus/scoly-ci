export const ADMIN_ROLES = ["super_admin", "admin"] as const;
export const TEAM_ROLES = ["moderator", "commercial", "comptable"] as const;
export const REFERENT_ROLES = ["referent"] as const;
export const CLIENT_ROLES = ["user"] as const;

export const FINAL_ROLES = [
  ...ADMIN_ROLES,
  ...TEAM_ROLES,
  ...REFERENT_ROLES,
  ...CLIENT_ROLES,
] as const;

export type AppRole = (typeof FINAL_ROLES)[number];

const hasAny = (roles: string[], allowed: readonly string[]) =>
  roles.some((role) => allowed.includes(role));

export const isPlatformAdmin = (roles: string[]) => hasAny(roles, ADMIN_ROLES);
export const isTeamMember = (roles: string[]) => hasAny(roles, TEAM_ROLES);
export const isReferent = (roles: string[]) => hasAny(roles, REFERENT_ROLES);

export const hasPrivilegedRole = (roles: string[]) =>
  isPlatformAdmin(roles) || isTeamMember(roles) || isReferent(roles);

export const getDashboardPathForRoles = (roles: string[]) => {
  if (isPlatformAdmin(roles)) return "/admin";
  if (isTeamMember(roles)) return "/team";
  if (isReferent(roles)) return "/me";
  return "/client";
};
