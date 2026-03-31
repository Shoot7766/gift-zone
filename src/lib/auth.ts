import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db, initDb } from "@/db";

// Initialize DB tables on startup
try { initDb(); } catch (e) { console.log("DB init:", e); }

const authSecret = process.env.NEXTAUTH_SECRET;
if (!authSecret) {
  throw new Error(
    "Missing NEXTAUTH_SECRET. Set it in your environment before starting the app."
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Parol", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        try {
          const user = db.$client
            .prepare("SELECT * FROM users WHERE email = ?")
            .get(credentials.email as string) as {
              id: string;
              name: string;
              email: string;
              password: string;
              role: string;
              phone: string | null;
              avatar: string | null;
            } | undefined;

          if (!user) return null;

          const isValid = await bcrypt.compare(
            credentials.password as string,
            user.password
          );
          if (!isValid) return null;

          return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            phone: user.phone ?? undefined,
            image: user.avatar ?? undefined,
          };
        } catch {
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role;
        token.phone = (user as { phone?: string }).phone;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.phone = token.phone as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/kirish",
  },
  session: { strategy: "jwt" },
  secret: authSecret,
});
