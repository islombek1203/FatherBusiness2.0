import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import type { Role, Locale } from "@/generated/prisma/enums";

const credentialsSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
});

// The Prisma adapter's session methods (createSession/getSessionAndUser/
// deleteSession) are reused directly below to back real, server-side,
// database-persisted sessions — see the `jwt.encode`/`jwt.decode` overrides.
const adapter = PrismaAdapter(prisma);

const SESSION_MAX_AGE_SECONDS = 60 * 60 * 8; // 8 hours

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter,
  trustHost: true,
  session: {
    strategy: "jwt",
    maxAge: SESSION_MAX_AGE_SECONDS,
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (raw) => {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;
        const { email, password } = parsed.data;

        // Rate-limit by email: 5 attempts per 15 minutes, regardless of outcome.
        const { allowed } = checkRateLimit(`login:${email}`, {
          limit: 5,
          windowMs: 15 * 60 * 1000,
        });
        if (!allowed) return null;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !user.isActive) return null;

        const passwordMatches = await bcrypt.compare(password, user.passwordHash);
        if (!passwordMatches) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          locale: user.locale,
        };
      },
    }),
  ],
  callbacks: {
    // Runs once at sign-in with `user` populated; on every subsequent
    // request `user` is undefined and we just pass the existing token through
    // (its contents come from `jwt.decode`, backed by the DB session row).
    jwt: async ({ token, user }) => {
      if (user) {
        token.role = user.role as Role;
        token.locale = user.locale as Locale;
      }
      return token;
    },
    session: async ({ session, token }) => {
      if (token.sub) session.user.id = token.sub;
      if (token.name) session.user.name = token.name;
      if (token.email) session.user.email = token.email;
      if (token.role) session.user.role = token.role as Role;
      if (token.locale) session.user.locale = token.locale as Locale;
      return session;
    },
  },
  jwt: {
    // Overriding encode/decode turns the "jwt" strategy (the only one
    // Auth.js allows for a credentials-only setup) into a real database
    // session: the cookie holds nothing but an opaque, random session
    // token, and the actual session state lives in Postgres and is
    // instantly revocable (delete the row = the user is logged out).
    encode: async ({ token }) => {
      if (!token?.sub) return "";
      const sessionToken = randomUUID();
      const expires = new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000);
      await adapter.createSession!({ sessionToken, userId: token.sub, expires });
      return sessionToken;
    },
    decode: async ({ token: sessionToken }) => {
      if (!sessionToken) return null;
      const result = await adapter.getSessionAndUser!(sessionToken);
      if (!result) return null;
      const { session, user } = result;
      if (session.expires < new Date()) {
        await adapter.deleteSession!(sessionToken);
        return null;
      }
      const typedUser = user as typeof user & { role: Role; locale: Locale };
      return {
        sub: user.id,
        sessionToken,
        name: user.name,
        email: user.email,
        role: typedUser.role,
        locale: typedUser.locale,
      };
    },
  },
  events: {
    signOut: async (message) => {
      if ("token" in message && message.token?.sessionToken) {
        await adapter.deleteSession!(message.token.sessionToken as string);
      }
    },
  },
});
