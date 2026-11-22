# API Mi-check

Deux routes publiques, JSON en entrée et en sortie. Base locale : `http://localhost:3000`.

- [`POST /api/verify`](#post-apiverify) — vérifier un texte et/ou une image
- [`POST /api/chat`](#post-apichat) — discuter avec l'assistant
- [Erreurs communes](#erreurs-communes)

---

## `POST /api/verify`

Analyse un contenu et renvoie un verdict sourcé.

### Corps

| Champ | Type | Obligatoire | Contraintes |
| --- | --- | --- | --- |
| `text` | string | `text` ou `image` | ≤ 8000 caractères |
| `image` | string | `text` ou `image` | Data URL `data:image/(png\|jpeg\|webp\|gif);base64,...` ou URL `https://`, ≤ 4 Mo |
| `pageUrl` | string | non | Tronquée à 500 caractères ; contexte pour le modèle |

La recherche web n'est utilisée que si `text` est présent (et si elle est activée et que le compte a des crédits).

```json
{
  "text": "La JIRAMA annonce une coupure d'une semaine dans tout Antananarivo.",
  "pageUrl": "https://www.facebook.com/exemple/posts/123"
}
```

### Réponse `200`

```json
{
  "verdict": "faux",
  "confidence": 88,
  "summary": "Aucun communiqué officiel de la JIRAMA n'annonce une coupure d'une semaine.",
  "explanation": "Les sources consultées (2424.mg, L'Express de Madagascar) évoquent des délestages tournants de quelques heures…",
  "signals": ["Aucune source officielle citée", "Ton alarmiste, incitation à partager"],
  "advice": "Consultez la page Facebook officielle de la JIRAMA avant de partager.",
  "sources": [
    {
      "title": "Antananarivo : un déficit de 18 MW prolonge les délestages",
      "url": "https://www.journal.mg/...",
      "domain": "journal.mg",
      "excerpt": "Le déficit de production sur le réseau d'Antananarivo…"
    }
  ],
  "webSearch": true
}
```

| Champ | Description |
| --- | --- |
| `verdict` | `"vrai"`, `"faux"`, `"trompeur"` ou `"invérifiable"` (toujours en français) |
| `confidence` | Entier 0–100, estimation du modèle |
| `summary`, `explanation`, `advice` | Dans la langue du contenu (malgache ou français) |
| `signals` | Indices relevés (8 max) |
| `sources` | Sources **réellement renvoyées** par la recherche web (vide sans recherche web) |
| `webSearch` | `true` si la recherche web a effectivement été utilisée |

### Erreurs

| Code | Cas |
| --- | --- |
| 400 | JSON invalide, ni texte ni image, texte trop long, image invalide ou trop lourde |
| 503 | Tous les modèles gratuits sont saturés : réessayer |
| 500 | Erreur inattendue (détail dans `error` en développement uniquement) |

---

## `POST /api/chat`

Conversation avec l'assistant Mi-check (contexte malgache, réponse dans la langue du dernier message utilisateur).

### Corps

| Champ | Type | Obligatoire | Contraintes |
| --- | --- | --- | --- |
| `messages` | `{ role, content }[]` | oui | Non vide ; seuls les 20 derniers sont gardés ; `role` = `"user"` ou `"assistant"` ; `content` non vide, ≤ 4000 caractères ; total ≤ 16 000 ; le dernier message doit venir de `user` |
| `webSearch` | boolean | non | Défaut `true` ; `false` pour une réponse plus rapide et gratuite |

```json
{
  "webSearch": true,
  "messages": [
    { "role": "user", "content": "Manao ahoana" },
    { "role": "assistant", "content": "Manao ahoana ! Inona no azoko ampiana anao ?" },
    { "role": "user", "content": "Marina ve fa hisy fahatapahan-jiro mandritra ny herinandro iray ?" }
  ]
}
```

### Réponse `200`

```json
{
  "message": "**Tsy marina tsara izany…**\n- Araka ny 2424.mg…",
  "sources": [{ "title": "…", "url": "https://2424.mg/…", "domain": "2424.mg", "excerpt": "…" }],
  "webSearch": true
}
```

`message` peut contenir du markdown léger (`**gras**`, listes `- `) ; les liens markdown sont retirés (les sources sont dans `sources`).

### Erreurs

| Code | Cas |
| --- | --- |
| 400 | JSON invalide, `messages` absent ou vide, message invalide (rôle, longueur), dernier message non `user`, conversation trop longue |
| 503 | Modèles gratuits saturés |
| 500 | Erreur inattendue |

---

## Erreurs communes

Format :

```json
{ "message": "Description lisible", "error": "détail (développement uniquement)" }
```

Comportements automatiques côté serveur (transparents pour le client) :

- **Modèles saturés** : bascule sur des modèles de secours, jusqu'à 3 tentatives, puis `503`.
- **Crédits OpenRouter insuffisants** : nouvel essai sans recherche web (`webSearch: false` dans la réponse), recherche web en pause 10 minutes.
- **Réponse du modèle tronquée ou mal formée** : réparation du JSON, sinon nouvelle tentative.

Temps de réponse typiques : 5–10 s sans recherche web, 10–20 s avec.
