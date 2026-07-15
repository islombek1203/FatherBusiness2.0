import { auth } from "@/auth";
import type { Role } from "@/generated/prisma/enums";

export class UnauthorizedError extends Error {
  constructor() {
    super("Not authenticated");
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends Error {
  constructor() {
    super("Not authorized for this action");
    this.name = "ForbiddenError";
  }
}

export async function requireUser() {
  const session = await auth();
  if (!session?.user) throw new UnauthorizedError();
  return session.user;
}

// Admin and Staff can create/edit records and record transactions; Viewer is
// read-only everywhere. Every mutating server action calls this — never rely
// on the client (or the nav/proxy UX gating) to keep this restriction sound.
export async function requireRole(roles: Role[]) {
  const user = await requireUser();
  if (!roles.includes(user.role)) throw new ForbiddenError();
  return user;
}

export const WRITE_ROLES: Role[] = ["ADMIN", "STAFF"];
