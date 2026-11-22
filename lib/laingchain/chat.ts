import { chatCompletion, type ChatMessage, WEB_SEARCH, type WebSource } from "./openrouter";
import { detectLanguage, MADAGASCAR_CONTEXT, todayFr } from "./madagascar";

export interface ChatTurn {
    role: "user" | "assistant";
    content: string;
}

export interface ChatReply {
    message: string;
    sources: WebSource[];
    webSearch: boolean;
}

const buildChatPrompt = (webSearch: boolean, language: string) => `Tu es Mi-check, un assistant de fact-checking bienveillant pour le public malgache.
Ton rôle : aider l'utilisateur à savoir si une information est vraie, expliquer comment repérer une fausse information,
et conseiller sur les bons réflexes (vérifier la source, la date, chercher l'info sur les pages officielles, recherche d'image inversée…).
${MADAGASCAR_CONTEXT}
Date du jour : ${todayFr()}.
${
    webSearch
        ? "Des résultats de recherche web récents te sont fournis : appuie-toi dessus et cite les sites par leur nom (ex. « selon 2424.mg »)."
        : "Tu n'as pas accès à internet : dis-le si une question porte sur une actualité récente que tu ne peux pas vérifier."
}
Règles :
- Réponds en ${language}, de façon claire et concise (3 à 8 phrases, ou une courte liste à puces).
- Donne ton avis sur la fiabilité (vrai, faux, trompeur ou impossible à vérifier) quand on te soumet une information.
- N'invente jamais de source, de chiffre ou de date. Si tu ne sais pas, dis-le.
- Refuse poliment de rédiger de fausses informations, des rumeurs ou des faux communiqués.
- Pas de liens markdown : cite simplement le nom du site. Tu peux utiliser **gras** et des listes « - ».`;

// Retire les liens markdown "[site](url)" -> "site" (les sources sont affichées à part).
const stripMarkdownLinks = (text: string): string =>
    text.replace(/\[([^\]]+)\]\((https?:[^)]+)\)/g, "$1").trim();

export const chatWithMicheck = async (
    turns: ChatTurn[],
    { webSearch: wantWeb = true }: { webSearch?: boolean } = {},
): Promise<ChatReply> => {
    const lastUser = [...turns].reverse().find((t) => t.role === "user");
    const language = detectLanguage(lastUser?.content ?? "");
    const webSearch = WEB_SEARCH && wantWeb;

    const messages: ChatMessage[] = [
        { role: "system", content: buildChatPrompt(webSearch, language) },
        ...turns.map((t) => ({ role: t.role, content: t.content })),
    ];

    const { result, sources } = await chatCompletion({
        messages,
        webSearch,
        temperature: 0.3,
        parse: (content) => {
            const text = stripMarkdownLinks(content);
            if (!text) throw new Error("Empty answer");
            return text;
        },
    });

    return { message: result, sources, webSearch };
};
