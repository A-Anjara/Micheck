# Architecture de Mi-check

Ce document décrit comment Mi-check est construit : composants, flux de données, modules clés, choix techniques et limites. Pour installer et lancer le projet, voir le [README](../README.md).

## Sommaire

1. [Vue d'ensemble](#1-vue-densemble)
2. [Stack technique](#2-stack-technique)
3. [Flux d'une vérification](#3-flux-dune-vérification)
4. [Backend : modules `lib/laingchain`](#4-backend--modules-liblaingchain)
5. [Routes API](#5-routes-api)
6. [Frontend web](#6-frontend-web)
7. [Extension Chrome / Edge](#7-extension-chrome--edge)
8. [Contexte malgache et langues](#8-contexte-malgache-et-langues)
9. [Fiabilité : secours, nouvelles tentatives, réparation](#9-fiabilité--secours-nouvelles-tentatives-réparation)
10. [Sécurité](#10-sécurité)
11. [Configuration](#11-configuration)
12. [Limites connues et pistes](#12-limites-connues-et-pistes)

---

## 1. Vue d'ensemble

```
┌──────────────────────┐   ┌──────────────────────────┐
│  Site web (Next.js)  │   │ Extension Chrome / Edge   │
│  - Vérifier          │   │ - Bouton sur posts FB     │
│  - Chat              │   │ - Clic droit, popup       │
│  - /demo             │   │ - Panneau latéral         │
└──────────┬───────────┘   └────────────┬─────────────┘
           │  fetch JSON                 │  fetch JSON (service worker)
           ▼                             ▼
┌──────────────────────────────────────────────────────┐
│ API Next.js (App Router, route handlers)             │
│   POST /api/verify   POST /api/chat                  │
├──────────────────────────────────────────────────────┤
│ lib/laingchain                                       │
│   verifyContent.ts   chat.ts                         │
│        └──────┬──────────┘                           │
│        openrouter.ts  ·  madagascar.ts               │
└───────────────┬──────────────────────────────────────┘
                │ HTTPS (clé serveur, jamais exposée)
                ▼
┌──────────────────────────────────────────────────────┐
│ OpenRouter                                           │
│   - Modèles gratuits multimodaux (texte + image)     │
│   - Plugin de recherche web (payant) → sources       │
└──────────────────────────────────────────────────────┘
```

**Principe :** toute l'intelligence est côté serveur. Le site et l'extension sont des clients minces qui envoient du contenu et affichent le résultat. La clé OpenRouter reste sur le serveur.

## 2. Stack technique

| Couche | Technologies |
| --- | --- |
| Web | Next.js 16 (App Router, `cacheComponents`), React 19, TypeScript, Tailwind CSS 4, Zustand (état du chat) |
| API | Route handlers Next.js (`app/api/*/route.ts`), `fetch` natif vers OpenRouter |
| IA | OpenRouter : modèles `:free` multimodaux + plugin `web` |
| Extension | Manifest V3, JavaScript natif (modules ES), sans étape de build |

Le dossier s'appelle `lib/laingchain` pour des raisons historiques ; Mi-check n'utilise plus LangChain pour ces modules (appels OpenRouter directs).

## 3. Flux d'une vérification

Exemple : clic sur « ✓ Vérifier » sur un post Facebook.

```
content-facebook.js          background.js               /api/verify            OpenRouter
       │                           │                          │                      │
 1. extrait texte, image,          │                          │                      │
    auteur, lien du post ─────────►│                          │                      │
       │                  2. télécharge l'image,              │                      │
       │                     la réduit (≤1600 px, JPEG)       │                      │
       │                     ─────────────────────────────────►│                      │
       │                           │              3. valide le corps                  │
       │                           │                 détecte la langue                │
       │                           │                 construit le prompt ────────────►│
       │                           │                          │       4. recherche web│
       │                           │                          │          + analyse IA │
       │                           │                          │◄──────────────────────│
       │                           │              5. parse/répare le JSON             │
       │                           │                 normalise le verdict             │
       │                           │                 extrait les sources              │
       │                           │◄─────────────────────────│                      │
       │◄── état du bouton ────────│ 6. stocke le résultat (storage.session)          │
       │                           │    → panneau latéral et popup l'affichent        │
```

Détail des étapes côté serveur (`verifyContent`) :

1. **Préparation du message** : texte en premier (la recherche web se base dessus), mention « Contexte : actualité de Madagascar », langue de réponse détectée, lien de la page d'origine.
2. **Prompt système** : rôle de fact-checker, contexte malgache, date du jour, règles de verdict, format JSON imposé.
3. **Recherche web** (si texte présent et activée) : le plugin OpenRouter récupère ~5 pages et les injecte dans le contexte du modèle.
4. **Analyse** par un modèle gratuit multimodal.
5. **Post-traitement** : extraction/réparation du JSON, normalisation du verdict, nettoyage des liens markdown, **sources = annotations réelles de la recherche** (le modèle ne peut pas inventer de lien).

Règles de verdict données au modèle : sources qui **contredisent** → `faux` ; qui **confirment** → `vrai` ; qui **nuancent** → `trompeur` ; rien de concluant → `invérifiable`.

## 4. Backend : modules `lib/laingchain`

### `openrouter.ts` — client partagé

- `chatCompletion<T>(options)` : point d'entrée unique pour appeler OpenRouter.
  - `messages` : tableau, ou **fonction `(webSearch) => messages`** pour adapter le prompt si la recherche web est finalement désactivée.
  - `webSearch` : active le plugin `web`.
  - `parse` : transforme la réponse ; une exception déclenche une nouvelle tentative.
  - Retourne `{ result, sources, model, webSearch }` (`webSearch` = réellement utilisée).
- Gestion des **modèles de secours**, des **nouvelles tentatives** et du **402** (voir §9).
- `extractSources()` : convertit les annotations `url_citation` en `{ title, url, domain, excerpt }` (dédupliquées, http(s) uniquement, extraits nettoyés et tronqués à 280 caractères).
- Erreurs exportées : `ModelsBusyError` (tous les modèles saturés → HTTP 503), `RetryableError`.

### `madagascar.ts` — contexte local

- `MADAGASCAR_CONTEXT` : sources fiables à privilégier et désinformations typiques (voir §8).
- `detectLanguage(text)` : `"malgache"` ou `"français"` par comptage de mots-outils et de préfixes.
- `todayFr()` : date du jour en toutes lettres.

### `verifyContent.ts` — vérification

- `verifyContent({ text?, image?, pageUrl? })` → `VerificationResult`.
- `extractJson()` : extraction robuste (blocs ```json, texte autour, virgules finales, **réponse tronquée refermée**).
- `normalizeVerdict()` : accepte aussi les verdicts anglais ou malgaches (`diso` → `faux`, `marina` → `vrai`…).
- La recherche web n'est lancée que s'il y a du texte (une image seule n'a pas de requête utile).

### `chat.ts` — assistant conversationnel

- `chatWithMicheck(turns, { webSearch })` → `{ message, sources, webSearch }`.
- Prompt : assistant de fact-checking bienveillant, contexte malgache, réponse dans la langue du dernier message utilisateur, interdiction d'inventer des sources ou de rédiger de fausses informations.
- Température 0,3 (un peu plus naturelle que la vérification, à 0).

## 5. Routes API

| Route | Rôle | Fichier |
| --- | --- | --- |
| `POST /api/verify` | Vérifier un texte et/ou une image | [app/api/verify/route.ts](../app/api/verify/route.ts) |
| `POST /api/chat` | Conversation avec l'assistant | [app/api/chat/route.ts](../app/api/chat/route.ts) |

Les deux routes sont **publiques** (pas d'authentification), valident leur corps avant tout appel externe et renvoient `NextResponse.json` avec des codes explicites (200, 400, 503, 500). Contrat détaillé : [API.md](API.md).

Les autres routes de `app/api` (produits, paiements, admin…) proviennent d'un ancien projet et ne sont pas utilisées par Mi-check.

## 6. Frontend web

Page d'accueil ([app/page.tsx](../app/page.tsx)), composée de sections :

| Section | Composant | Type |
| --- | --- | --- |
| Hero | `features/landing/hero` → `components/landing/hero.tsx` | Serveur |
| Fonctionnalités | `components/landing/analyze.tsx` | Serveur |
| Vérifier maintenant | `components/landing/verify-tool.tsx` | **Client** |
| 3 étapes | `components/landing/steps.tsx` | Serveur |
| Extension | `components/landing/extension.tsx` | Serveur |
| Pied de page | `components/layout/footer.tsx` | Serveur (+ bouton client) |
| Chat flottant | `components/chat/chat-widget.tsx` | **Client** |

Points notables :

- **Outil de vérification** : onglets texte/image, réduction de l'image dans le navigateur (canvas, ≤1600 px, JPEG), appel `POST /api/verify`, affichage via `ResultCard`.
- **Chat** : état d'ouverture partagé via Zustand ([store/chat.ts](../store/chat.ts)) pour être ouvert depuis la navbar ou le pied de page (`OpenChatButton`). Historique en mémoire (non persisté), 20 derniers échanges envoyés. Rendu markdown minimal (`RichText` : paragraphes, listes, gras), **sans HTML injecté**.
- **Maquettes de téléphone** : [components/ui/phone-screens.tsx](../components/ui/phone-screens.tsx), purement décoratives.
- **Page de démo** ([app/demo/page.tsx](../app/demo/page.tsx)) : reproduit les attributs utilisés par l'extension (`aria-posinset`, `data-ad-preview="message"`, menu « Actions pour cette publication », barre « J'aime »), avec des posts fictifs.

## 7. Extension Chrome / Edge

Manifest V3, dans [extension/](../extension/). Aucun build : on charge le dossier tel quel.

| Fichier | Rôle |
| --- | --- |
| `manifest.json` | Permissions (`contextMenus`, `storage`, `activeTab`, `scripting`, `sidePanel`), content script sur `*.facebook.com` et `localhost:3000/demo` |
| `content-facebook.js` | Détection des posts, bouton « ✓ Vérifier », extraction texte / image / auteur / lien |
| `background.js` | Service worker : menus contextuels, appel API, badge, état des vérifications, ouverture du panneau |
| `shared.js` | Appel `/api/verify`, conversion et réduction d'image, URL du serveur |
| `render.js` | Rendu du verdict (partagé popup / panneau) |
| `popup.*`, `sidepanel.*` | Interfaces |

### Détection des posts Facebook

Le HTML de Facebook est obfusqué et change souvent : on s'appuie sur des **attributs d'accessibilité et `data-*`**, jamais sur les classes CSS.

1. **Repères** : menu « … » (`aria-label="Actions pour cette publication"` / `"Actions for this post"`), blocs de texte (`data-ad-preview="message"`, `data-ad-rendering-role="story_message"`…), anciens sélecteurs (`aria-posinset`, `role="article"`).
2. **Remontée jusqu'à la carte** : depuis un repère, on remonte jusqu'au **plus petit ancêtre contenant la barre d'actions** (J'aime / Commenter / Partager). On s'arrête aussi avant d'englober un post déjà trouvé.
3. **Auto-correction** : un conteneur marqué qui finit par englober plusieurs posts est démarqué puis redécoupé (cas du premier post chargé seul).
4. **Commentaires exclus** : `role="article"` avec `aria-label` « Commentaire de… », ou contenu dans une liste `ul`.
5. **Défilement infini** : `MutationObserver` + `scroll`, scan regroupé toutes les 500 ms.
6. Bouton et badge de diagnostic dans un **Shadow DOM** (styles isolés), construits **sans `innerHTML`** (compatible Trusted Types).

### Communication

- Content script → service worker : `chrome.runtime.sendMessage` (`open-panel`, `verify-post`, `show-check`).
- Service worker → content script : `chrome.tabs.sendMessage` (`micheck-status`) pour mettre à jour la couleur du bouton.
- Service worker → popup / panneau : `chrome.storage.session` (`lastCheck`, `history` des 30 dernières vérifications), écouté via `storage.onChanged`.
- Le panneau latéral est ouvert de façon **synchrone** dans le geste utilisateur (exigence de `chrome.sidePanel.open`).
- Les requêtes vers l'API partent du service worker, qui a les permissions d'hôte : pas de CORS à configurer côté Next.js.

## 8. Contexte malgache et langues

Le prompt intègre `MADAGASCAR_CONTEXT` :

- **Sources à privilégier** : institutions (Présidence, ministères, CENI, BNGRC, Météo, JIRAMA, Banque Centrale, INSTAT, ministère de l'Éducation), médias publics (TVM, RNM, Taratra), presse (L'Express de Madagascar, Midi Madagasikara, NewsMada, Madagascar Tribune, La Gazette, Orange Actu, 2424.mg), international (AFP Factuel, RFI, Le Monde Afrique, Jeune Afrique).
- **Désinformations typiques** : faux communiqués officiels, fausses offres d'emploi / concours, arnaques au mobile money (MVola, Orange Money, Airtel Money), fausses alertes cyclone / délestage, faux résultats d'examens, faux décès, photos anciennes ou d'un autre pays.

**Langue** : le serveur détecte la langue du texte et l'impose (« Langue de réponse : malgache »). Le modèle ne la devine pas seul : lors des tests, il répondait en malgache à un post français. La clé `verdict` reste toujours en français (valeurs normalisées), le reste est dans la langue du post. L'interface reste en français.

## 9. Fiabilité : secours, nouvelles tentatives, réparation

Les modèles gratuits sont souvent saturés (429) et certains modèles « à raisonnement » tronquent leur réponse.

| Mécanisme | Détail |
| --- | --- |
| Modèles de secours | Chaque requête envoie une liste `models` : OpenRouter bascule de l'un à l'autre en cas d'erreur |
| Tentatives | 3 : liste principale → même liste après 1,5 s → routeur `openrouter/free` après 1,5 s |
| Erreurs retentées | 408, 429, 502, 503, 504, réponse vide, réponse non analysable |
| Tous saturés | `ModelsBusyError` → HTTP **503** avec un message clair |
| Crédits insuffisants (402) | Nouvel essai **sans recherche web** ; recherche web mise en pause **10 min** |
| Troncature | `max_tokens: 3000`, `reasoning: { effort: "low", exclude: true }`, et réparation du JSON tronqué |
| Logs | Chaque nouvelle tentative est loguée avec le modèle et le début de la réponse |

## 10. Sécurité

- La **clé OpenRouter** n'est lue que côté serveur (`process.env`) ; `.env*` est ignoré par git.
- **Validation** des corps de requête : types, tailles (texte ≤ 8000 caractères, image ≤ 4 Mo en data URL ou URL https, 20 messages de chat de ≤ 4000 caractères, total ≤ 16 000), rôle `system` refusé dans le chat.
- **Aucun HTML venant du modèle ou de la page n'est injecté** : rendu par `textContent` / composants React ; les liens de sources sont limités à `http(s)` et ouverts avec `rel="noopener noreferrer"`.
- Les messages d'erreur détaillés ne sont renvoyés qu'en développement.

**À faire avant une mise en ligne publique** : limitation de débit et/ou reCAPTCHA sur `/api/verify` et `/api/chat` (sinon n'importe qui peut consommer les crédits), restreindre `host_permissions` de l'extension, et pointer l'extension vers l'URL de production.

## 11. Configuration

| Variable | Défaut | Rôle |
| --- | --- | --- |
| `OPENROUTER_API_KEY` | — (obligatoire) | Clé API OpenRouter |
| `OPENROUTER_MODEL` | `google/gemma-4-31b-it:free` | Modèle principal (doit accepter les images) |
| `OPENROUTER_FALLBACK_MODELS` | `particle-ai/particle-1:free,inclusionai/ling-3.2-flash:free` | Modèles de secours, séparés par des virgules |
| `OPENROUTER_WEB_SEARCH` | activée | `false` pour désactiver la recherche web |
| `OPENROUTER_WEB_MAX_RESULTS` | `5` | Nombre de sources par recherche |

Côté extension, l'URL du serveur se règle dans la popup (*Paramètres*), défaut `http://localhost:3000`.

Les noms de modèles gratuits évoluent : la liste à jour est disponible sur <https://openrouter.ai/api/v1/models> (filtrer sur un prix nul et `input_modalities` contenant `image`).

## 12. Limites connues et pistes

| Limite | Piste |
| --- | --- |
| Recherche web payante ; sans crédits, pas de sources | Ajouter des crédits, ou intégrer une API de recherche gratuite (Tavily, etc.) |
| Modèles gratuits saturés par moments | Modèle payant peu cher en principal |
| DOM Facebook instable | Sélecteurs regroupés en tête de `content-facebook.js` ; badge et logs de diagnostic |
| Image seule analysée sans recherche web | Recherche d'image inversée |
| Pas de vidéo | Extraction d'images clés ou de transcription |
| L'IA peut se tromper sur des détails | Sources affichées systématiquement ; consigne de ne citer que des faits présents dans les sources |
| Tout tourne en local | Déploiement (ex. Vercel) + URL de production dans l'extension |
| API publique sans limite | Rate limiting, reCAPTCHA |
| Pas d'historique partagé | Base des intox déjà vérifiées pour des réponses instantanées et gratuites |
