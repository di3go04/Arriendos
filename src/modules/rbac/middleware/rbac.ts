import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { can, type Role } from "../lib/rbac";

export function middleware(request: NextRequest) {
    const role = request.cookies.get("role")?.value as Role;
    const pathname = request.nextUrl.pathname;

    const permissionMap: Record<string, string> = {
        "/api/properties": "read:properties",
        "/api/reports": "read:reports",
    };

    const required = permissionMap[pathname];
    if (required && !can(role, required)) {
        return new NextResponse("Forbidden", { status: 403 });
    }

    return NextResponse.next();
}