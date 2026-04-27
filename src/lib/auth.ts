import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import * as usersRepo from "@/lib/repositories/users";
import type { Role } from "@/types/user";

/**
 * Optional: restrict which email domains can sign up via OAuth.
 * Set AUTH_ALLOWED_DOMAINS to a comma-separated list (e.g. "lerelief.ht,gmail.com").
 * Leave empty to allow any domain.
 */
function isDomainAllowed(email: string): boolean {
  const allowed = process.env.AUTH_ALLOWED_DOMAINS?.trim();
  if (!allowed) return true; // No restriction configured
  const domain = email.split("@").pop()?.toLowerCase();
  if (!domain) return false;
  return allowed
    .split(",")
    .map((d) => d.trim().toLowerCase())
    .some((d) => domain === d || domain.endsWith(`.${d}`));
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID ?? process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET ?? process.env.GOOGLE_CLIENT_SECRET,
    }),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Courriel", type: "email" },
        password: { label: "Mot de passe", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await usersRepo.findByEmail(credentials.email as string);

        if (!user || !user.hashedPassword) return null;

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.hashedPassword as string
        );

        if (!isValid) return null;

        return {
          id: user.id as string,
          name: user.name as string,
          email: user.email as string,
          image: user.image as string | null,
          role: user.role as string,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const userRole = (user as { role?: Role }).role;
        token.role = userRole ?? "writer";
        token.id = user.id;
      }

      if ((!token.role || !token.id) && token.email) {
        const existing = await usersRepo.findByEmail(token.email);
        if (existing) {
          token.role = (existing.role as Role) ?? "writer";
          token.id = existing.id as string;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        (session.user as unknown as { role: Role }).role = token.role as Role;
      }
      return session;
    },
    async signIn({ user, account }) {
      // For OAuth providers, create or find user in Firestore
      if (account?.provider !== "credentials" && user.email) {
        // Domain validation for OAuth signups
        if (!isDomainAllowed(user.email)) {
          console.warn(`[auth] OAuth sign-in blocked for email domain: ${user.email.split("@").pop()}`);
          return false;
        }

        const existing = await usersRepo.findByEmail(user.email);
        if (!existing) {
          const newUser = await usersRepo.createUser({
            name: user.name || "",
            email: user.email,
            hashedPassword: "",
            role: "writer",
            image: user.image || null,
          });
          user.id = newUser.id as string;
          (user as { role?: Role }).role = "writer";
        } else {
          user.id = existing.id as string;
          (user as { role?: Role }).role = existing.role as Role;
        }
      }
      return true;
    },
  },
});
