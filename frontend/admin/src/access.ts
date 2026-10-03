export const platformRoles = [
  "super_admin",
  "admin",
  "verification_agent",
  "support_agent",
  "finance_agent",
  "content_manager",
];
export function canAccess(role: string, path: string) {
  if (["/profile", "/settings", "/access"].includes(path))
    return platformRoles.includes(role);
  if (["admin", "super_admin"].includes(role)) return true;
  return (
    (
      {
        verification_agent: ["/properties"],
        support_agent: ["/support", "/reviews"],
        finance_agent: ["/payouts"],
        content_manager: ["/content"],
      } as Record<string, string[]>
    )[role]?.includes(path) ?? false
  );
}
export function homeFor(role: string) {
  return (
    (
      {
        verification_agent: "/properties",
        support_agent: "/support",
        finance_agent: "/payouts",
        content_manager: "/content",
      } as Record<string, string>
    )[role] ?? "/"
  );
}

export const allRoles = [
  "customer",
  "property_owner",
  "property_manager",
  "receptionist",
  "property_staff",
  ...platformRoles,
];
export function assignableRoles(actorRole: string) {
  return actorRole === "super_admin"
    ? allRoles
    : allRoles.filter((role) => role !== "super_admin");
}
export function canManageUser(
  actorRole: string,
  targetRole: string,
  targetId: string,
  actorId: string,
) {
  return (
    targetId !== actorId &&
    (actorRole === "super_admin" ||
      (actorRole === "admin" && !["admin", "super_admin"].includes(targetRole)))
  );
}
export const roleAreas: Record<string, string[]> = {
  super_admin: [
    "overview",
    "properties",
    "users",
    "reservations",
    "payouts",
    "reviews",
    "support",
    "content",
    "audit",
  ],
  admin: [
    "overview",
    "properties",
    "users",
    "reservations",
    "payouts",
    "reviews",
    "support",
    "content",
    "audit",
  ],
  verification_agent: ["properties"],
  support_agent: ["support", "reviews"],
  finance_agent: ["payouts"],
  content_manager: ["content"],
};
