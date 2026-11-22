import { NextRequest, NextResponse } from "next/server";
import { chatWithMicheck, type ChatTurn } from "@/lib/laingchain/chat";
import { ModelsBusyError } from "@/lib/laingchain/openrouter";

const MAX_TURNS = 20;
const MAX_MESSAGE_LENGTH = 4000;
const MAX_TOTAL_LENGTH = 16000;

interface ChatBody {
    messages?: unknown;
    webSearch?: unknown;
}

const isTurn = (value: unknown): value is ChatTurn => {
    const turn = value as ChatTurn;
    return (
        typeof turn === "object" &&
        turn !== null &&
        (turn.role === "user" || turn.role === "assistant") &&
        typeof turn.content === "string" &&
        turn.content.trim().length > 0 &&
        turn.content.length <= MAX_MESSAGE_LENGTH
    );
};

export async function POST(req: NextRequest) {
    let body: ChatBody;
    try {
        body = (await req.json()) as ChatBody;
    } catch {
        return NextResponse.json(
            { message: "Invalid JSON body" },
            { status: 400 },
        );
    }

    if (!Array.isArray(body.messages) || body.messages.length === 0) {
        return NextResponse.json(
            { message: "A non-empty messages array is required" },
            { status: 400 },
        );
    }

    // On ne garde que les derniers échanges pour borner la taille du contexte.
    const turns = body.messages.slice(-MAX_TURNS);
    if (!turns.every(isTurn)) {
        return NextResponse.json(
            {
                message: `Each message needs a role (user|assistant) and a non-empty content of at most ${MAX_MESSAGE_LENGTH} characters`,
            },
            { status: 400 },
        );
    }

    if (turns.at(-1)?.role !== "user") {
        return NextResponse.json(
            { message: "The last message must come from the user" },
            { status: 400 },
        );
    }

    const total = turns.reduce((sum, t) => sum + t.content.length, 0);
    if (total > MAX_TOTAL_LENGTH) {
        return NextResponse.json(
            { message: "Conversation is too long" },
            { status: 400 },
        );
    }

    try {
        const reply = await chatWithMicheck(turns, {
            webSearch: body.webSearch !== false,
        });
        return NextResponse.json(reply, { status: 200 });
    } catch (error) {
        if (error instanceof ModelsBusyError) {
            return NextResponse.json(
                { message: error.message },
                { status: 503 },
            );
        }

        console.error("Chat API Error:", error);
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
