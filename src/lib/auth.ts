import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import Facebook from "next-auth/providers/facebook";
import Twitter from "next-auth/providers/twitter";
import bcrypt from "bcryptjs";
import * as usersRepo from "@/lib/repositories/users";
import type { Role } from "@/types/user";

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    Facebook({
      clientId: process.env.FACEBOOK_CLIENT_ID,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
    }),
    Twitter({
      clientId: process.env.TWITTER_CLIENT_ID,
      clientSecret: process.env.TWITTER_CLIENT_SECRET,
    }),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
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
        token.role = (user as { role: Role }).role;
        token.id = user.id;
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
        const existing = await usersRepo.findByEmail(user.email);
        if (!existing) {
          const newUser = await usersRepo.createUser({
            name: user.name || "",
            email: user.email,
            hashedPassword: "",
            role: "reader",
            image: user.image || null,
          });
          user.id = newUser.id as string;
        } else {
          user.id = existing.id as string;
          (user as { role?: string }).role = existing.role as string;
        }
      }
      return true;
    },
  },
});
