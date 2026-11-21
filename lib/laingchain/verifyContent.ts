export type Verdict = "vrai" | "faux" | "trompeur" | "invérifiable";

export interface VerificationResult {
    verdict: Verdict;
    confidence: number;
    summary: string;
    explanation: string;
    signals: string[];
    advice: string;
}

export interface VerificationInput {
    text?: string;
    image?: string;
    pageUrl?: string;
}

const VERDICTS: Verdict[] = ["vrai", "faux", "trompeur", "invérifiable"];

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
// Modèle gratuit multimodal (texte + image). Les modèles ":free" sont
// limités en débit : OpenRouter bascule sur les suivants en cas d'échec.
const MODEL = process.env.OPENROUTER_MODEL ?? "google/gemma-4-31b-it:free";
const FALLBACK_MODELS = (
    process.env.OPENROUTER_FALLBACK_MODELS ??
    "particle-ai/particle-1:free,inclusionai/ling-3.2-flash:free"
)
    .split(",")
    .map((m) => m.trim())
    .filter((m) => m && m !== MODEL);

const VERIFY_SYSTEM_PROMPT = `Tu es Mi-check, un expert en fact-checking et en détection de désinformation.
On te soumet un texte et/ou une image. Analyse :
- pour un texte : la véracité des affirmations, les biais, le sensationnalisme, les sources absentes, les incohérences ;
- pour une image : les signes de génération par IA ou de retouche (mains, texte illisible, ombres, reflets, artefacts), la cohérence avec le contexte, le risque de sortie de contexte.
Tu n'as pas accès à internet : si tu ne peux pas trancher, utilise le verdict "invérifiable" et dis comment vérifier.
Réponds UNIQUEMENT avec un objet JSON valide, sans texte autour, au format :
{"verdict":"vrai|faux|trompeur|invérifiable","confidence":0-100,"summary":"une phrase","explanation":"2 à 5 phrases","signals":["indice 1","indice 2"],"advice":"comment vérifier soi-même"}
Toutes les valeurs sont en français.`;

const extractJson = (raw: string): unknown => {
    const start = raw.indexOf("{");
    const end = raw.lastIndexOf("}");
    if (start === -1 || end <= start) {
        throw new Error("La réponse du modèle ne contient pas de JSON");
    }
    return JSON.parse(raw.slice(start, end + 1));
};

const normalizeResult = (data: unknown): VerificationResult => {
    const obj = (data ?? {}) as Record<string, unknown>;
    const verdict = String(obj.verdict ?? "").toLowerCase() as Verdict;
    const confidence = Number(obj.confidence);

    return {
        verdict: VERDICTS.includes(verdict) ? verdict : "invérifiable",
        confidence: Number.isFinite(confidence)
            ? Math.min(100, Math.max(0, Math.round(confidence)))
            : 0,
        summary: String(obj.summary ?? ""),
        explanation: String(obj.explanation ?? ""),
        signals: Array.isArray(obj.signals)
            ? obj.signals.map(String).slice(0, 8)
            : [],
        advice: String(obj.advice ?? ""),
    };
};

type ChatContentPart =
    | { type: "text"; text: string }
    | { type: "image_url"; image_url: { url: string } };

interface OpenRouterResponse {
    choices?: { message?: { content?: string | null } }[];
    error?: { message?: string };
}

/** Tous les modèles gratuits sont saturés : l'utilisateur doit réessayer. */
export class ModelsBusyError extends Error {
    constructor() {
        super(
            "Les modèles IA gratuits sont saturés pour le moment. Réessayez dans quelques secondes.",
        );
        this.name = "ModelsBusyError";
    }
}

class RetryableError extends Error {}

const RETRYABLE_STATUS = new Set([408, 429, 502, 503, 504]);

// Chaque tentative = une liste de modèles (OpenRouter bascule de l'un à
// l'autre). La dernière passe par le routeur "openrouter/free", qui choisit
// lui-même un modèle gratuit disponible et compatible avec la requête.
const ATTEMPTS: { models: string[]; delayMs: number }[] = [
    { models: [MODEL, ...FALLBACK_MODELS].slice(0, 3), delayMs: 0 },
    { models: [MODEL, ...FALLBACK_MODELS].slice(0, 3), delayMs: 1500 },
    { models: ["openrouter/free"], delayMs: 1500 },
];

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const requestOpenRouter = async (
    apiKey: string,
    models: string[],
    userContent: string | ChatContentPart[],
): Promise<unknown> => {
    const res = await fetch(OPENROUTER_URL, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            "X-Title": "Mi-check",
        },
        body: JSON.stringify({
            model: models[0],
            models,
            temperature: 0,
            max_tokens: 1500,
            messages: [
                { role: "system", content: VERIFY_SYSTEM_PROMPT },
                { role: "user", content: userContent },
            ],
        }),
    });

    const data = (await res.json().catch(() => ({}))) as OpenRouterResponse;
    if (!res.ok) {
        const message = `OpenRouter ${res.status}: ${data.error?.message ?? res.statusText}`;
        throw RETRYABLE_STATUS.has(res.status)
            ? new RetryableError(message)
            : new Error(message);
    }

    // Réponse vide ou sans JSON (ex. modèle de raisonnement tronqué) : on
    // retente plutôt que d'échouer.
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
        throw new RetryableError("Empty response from OpenRouter");
    }
    try {
        return extractJson(content);
    } catch {
        throw new RetryableError("Model response is not valid JSON");
    }
};

const callOpenRouter = async (
    userContent: string | ChatContentPart[],
): Promise<unknown> => {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
        throw new Error("OPENROUTER_API_KEY is not set");
    }

    for (const { models, delayMs } of ATTEMPTS) {
        if (delayMs) await sleep(delayMs);
        try {
            return await requestOpenRouter(apiKey, models, userContent);
        } catch (error) {
            if (!(error instanceof RetryableError)) throw error;
            console.warn(`OpenRouter retry (${models.join(", ")}):`, error.message);
        }
    }

    throw new ModelsBusyError();
};

export const verifyContent = async ({
    text,
    image,
    pageUrl,
}: VerificationInput): Promise<VerificationResult> => {
    const intro = [
        pageUrl ? `Page d'origine : ${pageUrl}` : null,
        text ? `Texte à vérifier :\n"""\n${text}\n"""` : null,
        image ? "Image à vérifier : voir ci-dessous." : null,
    ]
        .filter(Boolean)
        .join("\n\n");

    const userContent: string | ChatContentPart[] = image
        ? [
              { type: "text" as const, text: intro },
              { type: "image_url" as const, image_url: { url: image } },
          ]
        : intro;

    return normalizeResult(await callOpenRouter(userContent));
};
