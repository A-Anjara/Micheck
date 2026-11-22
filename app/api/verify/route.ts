import { NextRequest, NextResponse } from "next/server";
import { ModelsBusyError, verifyContent } from "@/lib/laingchain/verifyContent";
import { ConfigError } from "@/lib/laingchain/openrouter";

const MAX_TEXT_LENGTH = 8000;
// Taille max de l'image en base64 (~4 Mo).
const MAX_IMAGE_LENGTH = 4 * 1024 * 1024;

interface VerifyBody {
    text?: unknown;
    image?: unknown;
    pageUrl?: unknown;
}

const isValidImage = (image: string): boolean =>
    /^data:image\/(png|jpe?g|webp|gif);base64,/i.test(image) ||
    /^https:\/\//i.test(image);

export async function POST(req: NextRequest) {
    let body: VerifyBody;
    try {
        body = (await req.json()) as VerifyBody;
    } catch {
        return NextResponse.json(
            { message: "Invalid JSON body" },
            { status: 400 },
        );
    }

    const text = typeof body.text === "string" ? body.text.trim() : "";
    const image = typeof body.image === "string" ? body.image.trim() : "";
    const pageUrl =
        typeof body.pageUrl === "string" ? body.pageUrl.slice(0, 500) : "";

    if (!text && !image) {
        return NextResponse.json(
            { message: "A text or an image is required" },
            { status: 400 },
        );
    }

    if (text.length > MAX_TEXT_LENGTH) {
        return NextResponse.json(
            { message: `Text must be at most ${MAX_TEXT_LENGTH} characters` },
            { status: 400 },
        );
    }

    if (image && (!isValidImage(image) || image.length > MAX_IMAGE_LENGTH)) {
        return NextResponse.json(
            {
                message:
                    "Image must be an https URL or a base64 data URL (png, jpeg, webp, gif) under 4 MB",
            },
            { status: 400 },
        );
    }

    try {
        const result = await verifyContent({
            text: text || undefined,
            image: image || undefined,
            pageUrl: pageUrl || undefined,
        });

        return NextResponse.json(result, { status: 200 });
    } catch (error) {
        if (error instanceof ConfigError) {
            console.error("Configuration error:", error.message);
            return NextResponse.json(
                { message: error.message },
                { status: 500 },
            );
        }
        if (error instanceof ModelsBusyError) {
            return NextResponse.json(
                { message: error.message },
                { status: 503 },
            );
        }

        console.error("Verify API Error:", error);

        return NextResponse.json(
            {
                message: "Internal Server Error",
                error:
                    process.env.NODE_ENV === "development"
                        ? String(error)
                        : undefined,
            },
            { status: 500 },
        );
    }
}
