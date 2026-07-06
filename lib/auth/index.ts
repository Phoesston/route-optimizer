import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import {DrizzleAdapter} from "@auth/drizzle-adapter";
import {eq} from "drizzle-orm";
import {db} from "@/lib/db";
import {users, accounts, sessions, verificationTokens} from "@/lib/db/schema";
import {verifyPassword} from "./password";

export const {handlers, signIn, signOut, auth} = NextAuth({
    adapter: DrizzleAdapter(db, {
        usersTable: users,
        accountsTable: accounts,
        sessionsTable: sessions,
        verificationTokensTable: verificationTokens,
    }),
    session: {strategy: "jwt"},
    pages: {signIn: "/login"},
    providers: [
        Credentials({
            credentials: { email: {}, password: {} },
            async authorize(creds) {
                const email = creds?.email as string;
                const password = creds?.password as string;

                if (!email || !password) return null;

                const [user] = await db.select().from(users).where(eq(users.email, email));
                if (!user?.passwordHash) return null;

                const ok = await verifyPassword(password, user.passwordHash);
                if (!ok) return null;

                return {id: user.id, email: user.email, name: user.name};
            },
        }),
    ],
    callbacks: {
        async jwt({token, user}) {
            if (user) token.id = user.id;
            return token;
        },
        async session({session, token}) {
            if (token.id) session.user.id = token.id as string;
            return session;
        },
    },
});