# Mi-check — le détecteur de fausses informations

Mi-check aide à savoir si une information qui circule à **Madagascar** (surtout sur Facebook) est **vraie, fausse ou trompeuse**, et explique pourquoi, sources à l'appui, **en malgache ou en français**.

Projet réalisé pour le **DevFest 2026**.

| Où | Ce qu'on peut faire |
| --- | --- |
| **Site web** | Vérifier un texte ou une image, discuter avec l'assistant Mi-check |
| **Extension Chrome / Edge** | Bouton « ✓ Vérifier » sur chaque post Facebook, verdict dans un panneau latéral, clic droit sur un texte ou une image |
| **Page de démo** (`/demo`) | Faux fil Facebook pour tester ou présenter l'extension |

Chaque vérification renvoie un **verdict** (vrai / faux / trompeur / invérifiable), un **score de confiance**, une **explication**, les **indices** relevés, des **conseils** et les **sources** consultées.

---

## Démarrage rapide

### Prérequis

- **Node.js ≥ 20.9** (testé avec Node 24) et npm
- Une **clé API OpenRouter** gratuite : <https://openrouter.ai/keys>
- Google Chrome ou Microsoft Edge (pour l'extension)

### 1. Installer

```bash
git clone <url-du-repo>
cd devfest-2026---micheck
npm i
```

### 2. Configurer

Créez un fichier `.env.local` à la racine (il est ignoré par git, ne le commitez jamais) :

```bash
# Obligatoire
OPENROUTER_API_KEY=sk-or-...

# Facultatif
# OPENROUTER_MODEL=google/gemma-4-31b-it:free
# OPENROUTER_FALLBACK_MODELS=particle-ai/particle-1:free,inclusionai/ling-3.2-flash:free
# OPENROUTER_WEB_SEARCH=false        # désactive la recherche web (payante)
# OPENROUTER_WEB_MAX_RESULTS=5       # nombre de sources par recherche
```

> **Recherche web** : elle est **payante** (~0,007 $ par vérification avec texte) et nécessite des crédits OpenRouter. Sans crédits, Mi-check bascule automatiquement **sans recherche web** (modèles gratuits) : il fonctionne, mais sans sources récentes.

### 3. Lancer

```bash
npm run dev
```

Ouvrez <http://localhost:3000>.

### 4. Installer l'extension (facultatif)

1. Ouvrez `chrome://extensions` (ou `edge://extensions`) et activez le **Mode développeur**.
2. Cliquez sur **Charger l'extension non empaquetée** et choisissez le dossier [`extension/`](extension/).
3. Épinglez Mi-check (icône puzzle 🧩).
4. Ouvrez <http://localhost:3000/demo> ou Facebook, puis cliquez sur **✓ Vérifier** sur un post.

Après une modification du code de l'extension : bouton ↻ dans `chrome://extensions`, puis rechargez l'onglet.

---

## Essayer rapidement

```bash
# Vérification
curl -X POST http://localhost:3000/api/verify \
  -H "Content-Type: application/json" \
  -d '{"text":"La JIRAMA annonce une coupure d'\''une semaine dans tout Antananarivo."}'

# Chat
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Comment reconnaître un faux communiqué ?"}]}'
```

---

## Scripts

| Commande | Rôle |
| --- | --- |
| `npm run dev` | Serveur de développement (webpack) |
| `npm run build` | Build de production |
| `npm run start` | Serveur de production (après `build`) |
| `npm run lint` | ESLint |
| `npx tsc --noEmit` | Vérification des types |

---

## Structure du projet

```
app/
  page.tsx                 Page d'accueil (hero, vérification, étapes, extension, chat)
  demo/page.tsx            Faux fil Facebook pour tester l'extension
  api/verify/route.ts      POST : vérifier un texte et/ou une image
  api/chat/route.ts        POST : discuter avec l'assistant
components/
  landing/                 Sections de la page d'accueil (dont verify-tool.tsx)
  chat/                    Widget de chat flottant
  verify/                  Carte de résultat, liste des sources
  layout/                  Navbar, pied de page
lib/laingchain/
  openrouter.ts            Client OpenRouter : secours, nouvelles tentatives, sources
  madagascar.ts            Contexte malgache + détection de la langue
  verifyContent.ts         Logique de vérification (prompt, parsing, verdict)
  chat.ts                  Logique du chat
extension/                 Extension Chrome / Edge (Manifest V3, JS sans build)
docs/                      Documentation technique
```

> Le dépôt contient aussi du code hérité d'un autre projet (produits, paiements Stripe, admin, NextAuth). Il **n'est pas utilisé** par Mi-check et ses dépendances (`@/lib/prisma`, `@/lib/stripe`…) sont des bouchons.

---

## Documentation

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — architecture, flux d'une vérification, modules, choix techniques, limites
- [docs/API.md](docs/API.md) — contrat des routes `/api/verify` et `/api/chat`
- [extension/README.md](extension/README.md) — détails de l'extension

---

## Dépannage

| Problème | Solution |
| --- | --- |
| `OPENROUTER_API_KEY is not set` | Créez `.env.local` avec la clé, puis relancez `npm run dev` |
| « Les modèles IA gratuits sont saturés » | Limite des modèles gratuits : réessayez après quelques secondes |
| Avertissement « crédits insuffisants pour la recherche web » | Normal sans crédits OpenRouter : Mi-check continue sans recherche web |
| Extension : « Serveur Mi-check injoignable » | Vérifiez que `npm run dev` tourne et l'URL dans *Paramètres* de la popup |
| Extension : pas de bouton sur Facebook | Rechargez l'extension (↻) **et** l'onglet ; console (Cmd+Option+J), filtre `Mi-check` |
| Erreur « A tree hydrated… » dans le terminal | Causée par une extension du navigateur qui modifie la page, sans impact |

---

## Avertissement

Les analyses sont **générées par IA** et peuvent contenir des erreurs. Mi-check compare l'information à des sources trouvées en ligne : **consultez toujours les sources citées** avant de conclure.
