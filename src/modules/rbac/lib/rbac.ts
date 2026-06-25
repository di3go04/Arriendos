export type Role = "admin" | "manager" | "user";

export const rolePermissions: Record<Role, string[]> = {
    admin: ["*"],
    manager: ["read:properties", "write:properties", "read:reports"],
    user: ["read:properties"],
};

export const can = (role: Role, permission: string) => {
    const perms = rolePermissions[role] ?? [];
    return perms.includes("*") || perms.includes(permission);
};