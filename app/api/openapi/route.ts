import { openApiDocument } from "@/lib/openapi";
import { NextResponse } from "next/server";

export const GET = async () => {
    try {
        return NextResponse.json(openApiDocument, { status: 200 });
    } catch (error) {
        console.error("Error when serving OpenAPI document:", error);
        return NextResponse.json(
            { message: "Internal Server Error" },
            { status: 500 },
        );
    }
};
