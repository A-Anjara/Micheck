export type Verdict = "vrai" | "faux" | "trompeur" | "invérifiable";

export interface VerificationResult {
    verdict: Verdict;
    confidence: number;
    summary: string;
    explanation: string;
    signals: string[];
    advice: string;
    sources: VerificationSource[];
    webSearch: boolean;
}

export interface VerificationSource {
    title: string;
    url: string;
    domain: string;
    excerpt: string;
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

// Recherche web via le plugin OpenRouter (payant, ~0,007 $ par requête).
const WEB_SEARCH = process.env.OPENROUTER_WEB_SEARCH !== "false";
const WEB_MAX_RESULTS = Number(process.env.OPENROUTER_WEB_MAX_RESULTS) || 5;

const WEB_INSTRUCTIONS = `Des résultats de recherche web récents te sont fournis : appuie-toi d'abord sur eux.
Compare l'affirmation à ce que disent des sources fiables, en priorité malgaches (voir liste ci-dessus), puis internationales.
Si les sources contredisent l'affirmation, c'est "faux" ; si elles la confirment, "vrai" ; si elles la nuancent, "trompeur".
Mentionne dans "explanation" quelles sources confirment ou contredisent (par nom de site).`;

const OFFLINE_INSTRUCTIONS = `Tu n'as pas accès à internet : si tu ne peux pas trancher, utilise le verdict "invérifiable" et dis comment vérifier.`;

// Mi-check cible l'information circulant à Madagascar (posts en malgache ou en français).
const MADAGASCAR_CONTEXT = `CONTEXTE : Mi-check vérifie surtout l'information qui circule à Madagascar, sur Facebook en particulier.
Les contenus sont en malgache (y compris dialectes et malgache « vary amin'anana » mêlé de français) ou en français.
Sources fiables à privilégier, par exemple :
- officielles : Présidence de la République, Primature et ministères, CENI (élections), BNGRC (catastrophes, cyclones), Direction générale de la Météorologie, JIRAMA (eau, électricité), Banque Centrale de Madagascar, INSTAT, ministère de l'Éducation (examens CEPE, BEPC, Baccalauréat) ;
- médias publics : TVM, RNM, Taratra ;
- presse : L'Express de Madagascar, Midi Madagasikara, NewsMada / Les Nouvelles, Madagascar Tribune, La Gazette de la Grande Île, Orange Actu Madagascar, 2424.mg ;
- internationales : AFP Factuel, RFI, Le Monde Afrique, Jeune Afrique.
Désinformations fréquentes à Madagascar, à surveiller :
- faux communiqués officiels (logo ou en-tête copié, tampon, fautes, absence sur les pages officielles) ;
- fausses offres d'emploi, de concours ou de bourses, et arnaques au mobile money (MVola, Orange Money, Airtel Money) ;
- fausses alertes cyclone ou fausses annonces de délestage/coupure JIRAMA ;
- fausses dates ou faux résultats d'examens, faux décès de personnalités ;
- rumeurs politiques, remèdes miracles, photos anciennes ou d'un autre pays présentées comme actuelles à Madagascar.`;

const buildSystemPrompt = (webSearch: boolean) => `Tu es Mi-check, un expert en fact-checking et en détection de désinformation.
On te soumet un texte et/ou une image. Analyse :
- pour un texte : la véracité des affirmations, les biais, le sensationnalisme, les sources absentes, les incohérences ;
- pour une image : les signes de génération par IA ou de retouche (mains, texte illisible, ombres, reflets, artefacts), la cohérence avec le contexte, le risque de sortie de contexte.
${MADAGASCAR_CONTEXT}
Date du jour : ${new Date().toLocaleDateString("fr-FR", { dateStyle: "full" })}.
${webSearch ? WEB_INSTRUCTIONS : OFFLINE_INSTRUCTIONS}
Réponds UNIQUEMENT avec un objet JSON valide, sans texte autour, au format :
{"verdict":"vrai|faux|trompeur|invérifiable","confidence":0-100,"summary":"une phrase","explanation":"2 à 5 phrases","signals":["indice 1","indice 2"],"advice":"comment vérifier soi-même"}
LANGUE : la clé "verdict" garde TOUJOURS une des quatre valeurs françaises ci-dessus.
Les autres valeurs (summary, explanation, signals, advice) sont rédigées dans la « Langue de réponse » indiquée dans le message,
même si les sources trouvées sont dans une autre langue. Si aucune n'est indiquée (image seule), utilise la langue du texte visible dans l'image, sinon le français.`;

// Mots-outils fréquents pour distinguer malgache et français.
const MG_WORDS = new Set(
    "ny sy amin'ny an'ny ho dia fa izany tsy misy ary hoe ao amin ireo izy ianao isika izahay mba koa na raha satria fotoana ianareo azy azo tokony efa mbola nanao manao hoy any eto".split(" "),
);
const FR_WORDS = new Set(
    "le la les des est et que qui pour une un du dans sur pas par avec au aux ce cette sont ont il elle nous vous ils mais ou plus été être".split(" "),
);

/** Langue principale du texte : "malgache" ou "français". */
const detectLanguage = (text: string): "malgache" | "français" => {
    let mg = 0;
    let fr = 0;
    for (const raw of text.toLowerCase().split(/[\s.,;:!?()«»"“”\-]+/)) {
        const word = raw.replace(/[’]/g, "'");
        if (MG_WORDS.has(word)) mg++;
        if (FR_WORDS.has(word)) fr++;
        // Préfixes typiquement malgaches.
        if (/^(an'|amin'|ny|mi|ma|ha|fa)[a-z']{3,}/.test(word) && !FR_WORDS.has(word)) mg += 0.25;
    }
    return mg > fr ? "malgache" : "français";
};

/**
 * Extrait l'objet JSON de la réponse du modèle, en réparant les défauts
 * courants : bloc ```json, texte autour, virgules finales, et surtout réponse
 * TRONQUÉE (limite de tokens atteinte) dont on referme chaînes et accolades.
 */
const extractJson = (raw: string): unknown => {
    const text = raw.replace(/```(?:json)?/gi, "");
    const start = text.indexOf("{");
    if (start === -1) {
        throw new Error("La réponse du modèle ne contient pas de JSON");
    }

    // Parcours en tenant compte des chaînes pour trouver la fin réelle de l'objet.
    const stack: string[] = [];
    let inString = false;
    let escaped = false;
    let end = -1;
    for (let i = start; i < text.length; i++) {
        const ch = text[i];
        if (inString) {
            if (escaped) escaped = false;
            else if (ch === "\\") escaped = true;
            else if (ch === '"') inString = false;
            continue;
        }
        if (ch === '"') inString = true;
        else if (ch === "{" || ch === "[") stack.push(ch === "{" ? "}" : "]");
        else if (ch === "}" || ch === "]") {
            stack.pop();
            if (stack.length === 0) {
                end = i;
                break;
            }
        }
    }

    let candidate: string;
    if (end !== -1) {
        candidate = text.slice(start, end + 1);
    } else {
        // Tronqué : on referme la chaîne en cours, on retire une clé/valeur
        // incomplète en fin, puis on ferme les tableaux/objets ouverts.
        candidate = text.slice(start);
        if (inString) candidate += '"';
        candidate = candidate
            .replace(/,\s*"[^"]*"\s*:?\s*$/, "") // clé sans valeur
            .replace(/[,:]\s*$/, "");
        candidate += stack.reverse().join("");
    }

    candidate = candidate.replace(/,\s*([}\]])/g, "$1"); // virgules finales
    return JSON.parse(candidate);
};

// Retire les liens markdown que le modèle ajoute parfois : "[site](url)" -> "site".
const stripMarkdownLinks = (value: unknown): string =>
    String(value ?? "").replace(/\[([^\]]+)\]\((https?:[^)]+)\)/g, "$1");

const VERDICT_ALIASES: Record<string, Verdict> = {
    true: "vrai",
    false: "faux",
    misleading: "trompeur",
    unverifiable: "invérifiable",
    inverifiable: "invérifiable",
    marina: "vrai",
    diso: "faux",
    mamitaka: "trompeur",
    "tsy marina": "faux",
    "tsy azo hamarinina": "invérifiable",
};

const normalizeVerdict = (value: unknown): Verdict => {
    const v = String(value ?? "").trim().toLowerCase();
    if (VERDICTS.includes(v as Verdict)) return v as Verdict;
    return VERDICT_ALIASES[v] ?? "invérifiable";
};

const normalizeResult = (
    data: unknown,
    sources: VerificationSource[],
    webSearch: boolean,
): VerificationResult => {
    const obj = (data ?? {}) as Record<string, unknown>;
    const verdict = normalizeVerdict(obj.verdict);
    const confidence = Number(obj.confidence);

    return {
        verdict,
        confidence: Number.isFinite(confidence)
            ? Math.min(100, Math.max(0, Math.round(confidence)))
            : 0,
        summary: stripMarkdownLinks(obj.summary),
        explanation: stripMarkdownLinks(obj.explanation),
        signals: Array.isArray(obj.signals)
            ? obj.signals.map(stripMarkdownLinks).slice(0, 8)
            : [],
        advice: stripMarkdownLinks(obj.advice),
        sources,
        webSearch,
    };
};

type ChatContentPart =
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
const extractSources = (annotations: UrlCitation[] = []): VerificationSource[] => {
    const seen = new Set<string>();
    const sources: VerificationSource[] = [];
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

interface ModelAnswer {
    data: unknown;
    sources: VerificationSource[];
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
    webSearch: boolean,
): Promise<ModelAnswer> => {
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
            // Les modèles « à raisonnement » consomment des tokens avant de
            // répondre : marge large + raisonnement réduit pour éviter la troncature.
            max_tokens: 3000,
            reasoning: { effort: "low", exclude: true },
            ...(webSearch && {
                plugins: [{ id: "web", max_results: WEB_MAX_RESULTS }],
            }),
            messages: [
                { role: "system", content: buildSystemPrompt(webSearch) },
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
    const message = data.choices?.[0]?.message;
    const content = message?.content;
    if (!content) {
        throw new RetryableError("Empty response from OpenRouter");
    }
    try {
        return {
            data: extractJson(content),
            sources: extractSources(message?.annotations),
        };
    } catch {
        throw new RetryableError(
            `Model response is not valid JSON (${data.model ?? "?"}): ${content.slice(0, 300).replace(/\s+/g, " ")}`,
        );
    }
};

const callOpenRouter = async (
    userContent: string | ChatContentPart[],
    webSearch: boolean,
): Promise<ModelAnswer> => {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
        throw new Error("OPENROUTER_API_KEY is not set");
    }

    for (const { models, delayMs } of ATTEMPTS) {
        if (delayMs) await sleep(delayMs);
        try {
            return await requestOpenRouter(apiKey, models, userContent, webSearch);
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
    // Le texte vient en premier : la recherche web s'appuie sur ce message.
    const intro = [
        text ? `Texte à vérifier :\n"""\n${text}\n"""` : null,
        image ? "Image à vérifier : voir ci-dessous." : null,
        "Contexte : actualité de Madagascar.",
        text ? `Langue de réponse : ${detectLanguage(text)}.` : null,
        pageUrl ? `Page d'origine : ${pageUrl}` : null,
    ]
        .filter(Boolean)
        .join("\n\n");

    const userContent: string | ChatContentPart[] = image
        ? [
              { type: "text" as const, text: intro },
              { type: "image_url" as const, image_url: { url: image } },
          ]
        : intro;

    // Sans texte (image seule), une recherche web n'aurait pas de requête utile.
    const webSearch = WEB_SEARCH && Boolean(text);
    const { data, sources } = await callOpenRouter(userContent, webSearch);

    return normalizeResult(data, sources, webSearch);
};
