import { NextAuthConfig } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

export const ssoOptions: NextAuthConfig = {
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        }),
    ],
    callbacks: {
        async session({ session, token }) {
            // @ts-ignore
            session.user.id = token.sub!;
            return session;
        },
    },
};
