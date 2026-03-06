import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";

const logFile = path.join(process.cwd(), "auth-debug.log");

function logDebug(message: string, data?: any) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message} ${data ? JSON.stringify(data) : ""}\n`;
    fs.appendFileSync(logFile, logMessage);
}

export const authOptions: NextAuthOptions = {
    session: {
        strategy: "jwt",
    },
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                const email = credentials?.email?.toLowerCase().trim();
                const password = credentials?.password;

                logDebug("Authorization attempt started", { email });

                if (!email || !password) {
                    logDebug("Missing email or password");
                    return null;
                }

                try {
                    logDebug("Searching for user in database...");
                    logDebug("Prisma keys:", Object.keys(prisma));
                    logDebug("Does prisma.user exist?", typeof (prisma as any).user);
                    logDebug("Does prisma.User exist?", typeof (prisma as any).User);

                    const userModel = (prisma as any).user || (prisma as any).User;

                    if (!userModel) {
                        logDebug("CRITICAL: Neither prisma.user nor prisma.User exist!");
                        // Even if userModel is null, we'll try the $queryRaw fallback below
                    }

                    let user = null;
                    if (userModel) {
                        user = await userModel.findUnique({
                            where: { email }
                        });
                    } else {
                        logDebug("Attempting $queryRaw fallback for User lookup...");
                        const users = await prisma.$queryRaw`SELECT * FROM "User" WHERE email = ${email}` as any[];
                        if (users && users.length > 0) {
                            user = users[0];
                            logDebug("User found via $queryRaw!");
                        } else {
                            logDebug("User not found via $queryRaw.");
                        }
                    }

                    if (!user) {
                        logDebug("User not found in database", { email });
                        return null;
                    }

                    logDebug("User found, comparing passwords...");

                    const isPasswordValid = await bcrypt.compare(
                        password,
                        user.password
                    );

                    if (!isPasswordValid) {
                        logDebug("Password comparison failed for user", email);
                        return null;
                    }

                    logDebug("Authentication successful", { email });
                    return {
                        id: user.id,
                        email: user.email,
                        name: user.name,
                        role: user.role,
                    };
                } catch (error: any) {
                    logDebug("Database or bcrypt error during authorization", {
                        message: error.message,
                        stack: error.stack
                    });
                    return null;
                }
            }
        })
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.role = (user as any).role;
                token.id = user.id;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                (session.user as any).role = token.role;
                (session.user as any).id = token.id;
            }
            return session;
        }
    },
    pages: {
        signIn: "/login",
    },
    secret: process.env.NEXTAUTH_SECRET,
};
