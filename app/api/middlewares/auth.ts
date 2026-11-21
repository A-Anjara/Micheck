import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getSession } from "@/lib/sessions/dbSession";
import type { AdminRole, INextauthSession, NextRequestWithId } from "@/types";
import { authOptions } from "@/lib/nextauth";
import {
    checkIsSuperadmin,
    isPrerenderBailout,
    isTokenExpired,
    unauthorizedResponse,
} from "@/lib/api-utils";

interface AuthConfig {
    type?: "nextauth" | "db_session";
    adminRole?: AdminRole;
}

type RouteHandler = (
    req: NextRequestWithId,
    context: unknown,
) => Promise<NextResponse>;

export const checkHasAccess = (
    handler: RouteHandler,
    { type = "db_session", adminRole = "ADMIN" }: AuthConfig = {},
) => {
    return async (
        req: NextRequestWithId,
        context: unknown,
    ): Promise<NextResponse> => {
        try {
            if (type === "nextauth") {
                return await handleNextAuth(req, handler, context);
            }

            if (type === "db_session") {
                const authHeader = req.headers.get("Authorization");

                if (!authHeader || !authHeader.startsWith("Bearer ")) {
                    return unauthorizedResponse(
                        "Missing or invalid Authorization header",
                    );
                }

                const token = authHeader.split(" ")[1];
                if (!token) {
                    return unauthorizedResponse("No token provided");
                }

                return await handleDBSession(
                    req,
                    token,
                    adminRole,
                    handler,
                    context,
                );
            }

            return unauthorizedResponse("Unknown token type");
        } catch (error) {
            if (isPrerenderBailout(error)) {
                throw error;
            }

            console.error("Authentication error:", error);
            const message =
                error instanceof Error
                    ? error.message
                    : "An unexpected error occurred";
            return NextResponse.json(
                { error: "Internal server error", message },
                { status: 500 },
            );
        }
    };
};

const handleNextAuth = async (
    req: NextRequestWithId,
    handler: RouteHandler,
    context: unknown,
): Promise<NextResponse> => {
    const session = await getServerSession(authOptions);
    if (!session) {
        return unauthorizedResponse("No valid session found");
    }

    const expires = new Date(session.expires).getTime();
    if (isTokenExpired(expires)) {
        return unauthorizedResponse("Token has expired");
    }

    req.userId = (session.user as INextauthSession).id ?? null;
    return await handler(req, context);
};

const handleDBSession = async (
    req: NextRequestWithId,
    token: string,
    adminRole: AdminRole,
    handler: RouteHandler,
    context: unknown,
): Promise<NextResponse> => {
    const dbSession = await getSession(token);

    if (!dbSession) {
        return unauthorizedResponse("No session found");
    }

    if (adminRole === "SUPERADMIN") {
        try {
            await checkIsSuperadmin(dbSession);
        } catch {
            return unauthorizedResponse("Superadmin privileges required");
        }
    }

    const expires = new Date(dbSession.expires ?? 0).getTime();
    if (isTokenExpired(expires)) {
        return unauthorizedResponse("Token has expired");
    }

    return await handler(req, context);
};
