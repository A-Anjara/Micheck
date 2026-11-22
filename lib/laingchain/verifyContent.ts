import {
    chatCompletion,
    type ChatContentPart,
    WEB_SEARCH,
    type WebSource,
} from "./openrouter";
import { detectLanguage, MADAGASCAR_CONTEXT, todayFr } from "./madagascar";

export { ModelsBusyError } from "./openrouter";

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

export type VerificationSource = WebSource;

export interface VerificationInput {
    text?: string;
    image?: string;
    pageUrl?: string;
}

const VERDICTS: Verdict[] = ["vrai", "faux", "trompeur", "invérifiable"];

const WEB_INSTRUCTIONS = `Des résultats de recherche web récents te sont fournis : appuie-toi d'abord sur eux.
Compare l'affirmation à ce que disent des sources fiables, en priorité malgaches (voir liste ci-dessus), puis internationales.
Si les sources contredisent l'affirmation, c'est "faux" ; si elles la confirment, "vrai" ; si elles la nuancent, "trompeur".
Mentionne dans "explanation" quelles sources confirment ou contredisent (par nom de site).`;

const OFFLINE_INSTRUCTIONS = `Tu n'as pas accès à internet : si tu ne peux pas trancher, utilise le verdict "invérifiable" et dis comment vérifier.`;

const buildSystemPrompt = (webSearch: boolean) => `Tu es Mi-check, un expert en fact-checking et en détection de désinformation.
On te soumet un texte et/ou une image. Analyse :
- pour un texte : la véracité des affirmations, les biais, le sensationnalisme, les sources absentes, les incohérences ;
- pour une image : les signes de génération par IA ou de retouche (mains, texte illisible, ombres, reflets, artefacts), la cohérence avec le contexte, le risque de sortie de contexte.
${MADAGASCAR_CONTEXT}
Date du jour : ${todayFr()}.
${webSearch ? WEB_INSTRUCTIONS : OFFLINE_INSTRUCTIONS}
Réponds UNIQUEMENT avec un objet JSON valide, sans texte autour, au format :
{"verdict":"vrai|faux|trompeur|invérifiable","confidence":0-100,"summary":"une phrase","explanation":"2 à 5 phrases","signals":["indice 1","indice 2"],"advice":"comment vérifier soi-même"}
LANGUE : la clé "verdict" garde TOUJOURS une des quatre valeurs françaises ci-dessus.
Les autres valeurs (summary, explanation, signals, advice) sont rédigées dans la « Langue de réponse » indiquée dans le message,
même si les sources trouvées sont dans une autre langue. Si aucune n'est indiquée (image seule), utilise la langue du texte visible dans l'image, sinon le français.`;

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
    const { result: data, sources } = await chatCompletion({
        messages: [
            { role: "system", content: buildSystemPrompt(webSearch) },
            { role: "user", content: userContent },
        ],
        webSearch,
        parse: extractJson,
    });

    return normalizeResult(data, sources, webSearch);
};
