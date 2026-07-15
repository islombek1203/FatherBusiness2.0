import type { Role, Locale } from "@/generated/prisma/enums";

declare module "next-auth" {
  interface User {
    role: Role;
    locale: Locale;
  }

  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      role: Role;
      locale: Locale;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: Role;
    locale?: Locale;
    sessionToken?: string;
  }
}
