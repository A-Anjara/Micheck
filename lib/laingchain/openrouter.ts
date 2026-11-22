// Client OpenRouter partagé (vérification + chat) : modèles gratuits de
// secours, nouvelles tentatives, recherche web et extraction des sources.

export interface WebSource {
    title: string;
    url: string;
    domain: string;
    excerpt: string;
}

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

// Recherche web via le plugin OpenRouter (payant, ~0,007 $ par requête).
export const WEB_SEARCH = process.env.OPENROUTER_WEB_SEARCH !== "false";
export const WEB_MAX_RESULTS = Number(process.env.OPENROUTER_WEB_MAX_RESULTS) || 5;

export type ChatContentPart =
    | { type: "text"; text: string }
    | { type: "image_url"; image_url: { url: string } };

interface UrlCitation {
    type?: string;
    url_citation?: { url?: string; title?: string; content?: string };
}

interface OpenRouterResponse {
    model?: string;
    choices?: {
        message?: { content?: string | null; annotations?: UrlCitation[] };
    }[];
    error?: { message?: string };
}

const EXCERPT_LENGTH = 280;

/** Sources réellement renvoyées par la recherche web (pas inventées par le modèle). */
const extractSources = (annotations: UrlCitation[] = []): WebSource[] => {
    const seen = new Set<string>();
    const sources: WebSource[] = [];
    for (const a of annotations) {
        const c = a.url_citation;
        if (a.type !== "url_citation" || !c?.url) continue;
        let url: URL;
        try {
            url = new URL(c.url);
        } catch {
            continue;
        }
        if (!/^https?:$/.test(url.protocol) || seen.has(url.href)) continue;
        seen.add(url.href);

        const excerpt = (c.content ?? "")
            .replace(/^#+\s.*$/gm, "") // titres markdown
            .replace(/\[(\d+)\]/g, "") // renvois [12]
            .replace(/\s+/g, " ")
            .trim();
        sources.push({
            title: c.title?.trim() || url.hostname,
            url: url.href,
            domain: url.hostname.replace(/^www\./, ""),
            excerpt:
                excerpt.length > EXCERPT_LENGTH
                    ? `${excerpt.slice(0, EXCERPT_LENGTH).trimEnd()}…`
                    : excerpt,
        });
    }
    return sources;
};

/** Tous les modèles gratuits sont saturés : l'utilisateur doit réessayer. */
export class ModelsBusyError extends Error {
    constructor() {
        super(
            "Les modèles IA gratuits sont saturés pour le moment. Réessayez dans quelques secondes.",
        );
        this.name = "ModelsBusyError";
    }
}

export class RetryableError extends Error {}

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

export interface ChatMessage {
    role: "system" | "user" | "assistant";
    content: string | ChatContentPart[];
}

export interface CompletionOptions<T> {
    messages: ChatMessage[];
    webSearch?: boolean;
    temperature?: number;
    /** Transforme la réponse ; une exception déclenche une nouvelle tentative. */
    parse?: (content: string) => T;
}

export interface CompletionResult<T> {
    result: T;
    sources: WebSource[];
    model?: string;
}

const requestOpenRouter = async <T>(
    apiKey: string,
    models: string[],
    { messages, webSearch = false, temperature = 0, parse }: CompletionOptions<T>,
): Promise<CompletionResult<T>> => {
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
            temperature,
            // Les modèles « à raisonnement » consomment des tokens avant de
            // répondre : marge large + raisonnement réduit pour éviter la troncature.
            max_tokens: 3000,
            reasoning: { effort: "low", exclude: true },
            ...(webSearch && {
                plugins: [{ id: "web", max_results: WEB_MAX_RESULTS }],
            }),
            messages,
        }),
    });

    const data = (await res.json().catch(() => ({}))) as OpenRouterResponse;
    if (!res.ok) {
        const message = `OpenRouter ${res.status}: ${data.error?.message ?? res.statusText}`;
        throw RETRYABLE_STATUS.has(res.status)
            ? new RetryableError(message)
            : new Error(message);
    }

    // Réponse vide (ex. modèle de raisonnement tronqué) : on retente.
    const message = data.choices?.[0]?.message;
    const content = message?.content;
    if (!content) {
        throw new RetryableError("Empty response from OpenRouter");
    }

    let result: T;
    try {
        result = parse ? parse(content) : (content as T);
    } catch {
        throw new RetryableError(
            `Unparsable model response (${data.model ?? "?"}): ${content.slice(0, 300).replace(/\s+/g, " ")}`,
        );
    }
    return { result, sources: extractSources(message?.annotations), model: data.model };
};

/** Appel OpenRouter avec modèles de secours et nouvelles tentatives. */
export const chatCompletion = async <T = string>(
    options: CompletionOptions<T>,
): Promise<CompletionResult<T>> => {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
        throw new Error("OPENROUTER_API_KEY is not set");
    }

    for (const { models, delayMs } of ATTEMPTS) {
        if (delayMs) await sleep(delayMs);
        try {
            return await requestOpenRouter(apiKey, models, options);
        } catch (error) {
            if (!(error instanceof RetryableError)) throw error;
            console.warn(`OpenRouter retry (${models.join(", ")}):`, error.message);
        }
    }

    throw new ModelsBusyError();
};
