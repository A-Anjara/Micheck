# Extension Mi-check (Chrome / Edge, Manifest V3)

Vérifie les **posts Facebook**, un **texte** ou une **image** via l'API Next.js du projet (`POST /api/verify`).

**Sur Facebook**, chaque post du fil reçoit un bouton **✓ Vérifier** (en haut à droite du post). Un clic envoie le texte + l'image du post à l'analyse et ouvre le **panneau latéral** Mi-check avec le verdict. Le bouton prend ensuite la couleur du verdict ; recliquer dessus réaffiche le détail.

## Lancer

1. À la racine du repo, créer `.env.local` avec `OPENROUTER_API_KEY=...`
   (optionnel : `OPENROUTER_MODEL`, défaut `google/gemma-4-31b-it:free` ; `OPENROUTER_FALLBACK_MODELS`, liste séparée par des virgules), puis `npm run dev`.
2. Ouvrir `chrome://extensions` (ou `edge://extensions`), activer le **mode développeur**.
3. **Charger l'extension non empaquetée** → choisir le dossier `extension/`.

## Tester

1. **L'API seule** (serveur lancé) :
   ```bash
   curl -X POST http://localhost:3000/api/verify \
     -H "Content-Type: application/json" \
     -d '{"text":"La Tour Eiffel mesure 3 km de haut."}'
   ```
   Réponse attendue : `{"verdict":"faux","confidence":..., ...}`.
2. **Facebook** : ouvrir facebook.com (après avoir rechargé l'extension, **recharger aussi l'onglet Facebook**), faire défiler le fil → bouton « ✓ Vérifier » sur chaque post → clic → le panneau latéral s'ouvre (« Analyse en cours… » puis verdict), le bouton devient « ● Faux », « ● Trompeur », etc.
   - Pas de bouton ? Console de l'onglet Facebook (F12) : vérifier qu'il n'y a pas d'erreur `content-facebook.js`. Facebook change souvent son HTML : les sélecteurs sont en haut de `content-facebook.js`.
3. **Menu clic droit texte** : sélectionner une phrase sur n'importe quel site → clic droit → « Vérifier ce texte avec Mi-check ». La popup s'ouvre avec « Analyse en cours… » puis le verdict.
4. **Menu clic droit image** : clic droit sur une image (ex. Wikipédia) → « Vérifier cette image avec Mi-check ».
5. **Popup** : cliquer sur l'icône Mi-check (épingler via l'icône puzzle) → onglet Texte ou Image (glisser une image depuis le bureau).
6. **Débogage** :
   - erreurs du service worker : `chrome://extensions` → Mi-check → lien « service worker » → onglet Console ;
   - erreurs de la popup : clic droit dans la popup → « Inspecter » ;
   - erreurs serveur : terminal de `npm run dev`.
   - « Serveur Mi-check injoignable » → vérifier que `npm run dev` tourne et l'URL dans *Paramètres*.
   - Erreur 429 / « rate limit » → limite des modèles gratuits, réessayer un peu plus tard.

## Utilisation

- **Clic droit sur un texte sélectionné** → « Vérifier ce texte avec Mi-check ».
- **Clic droit sur une image** → « Vérifier cette image avec Mi-check ».
- **Popup** : coller un texte, récupérer la sélection de la page, ou déposer une image.
- Le badge de l'icône affiche le verdict (Vrai / Faux / Trom / Invé).
- L'URL du serveur se change dans *Paramètres* (défaut : `http://localhost:3000`).

## Fichiers

| Fichier | Rôle |
| --- | --- |
| `manifest.json` | Déclaration MV3 (menus contextuels, popup, permissions) |
| `background.js` | Service worker : menus contextuels, appel API, badge |
| `shared.js` | Appel API, conversion/redimensionnement d'image |
| `content-facebook.js` | Détection des posts Facebook, bouton « Vérifier », extraction texte/image/auteur |
| `sidepanel.html/js` | Panneau latéral affichant le verdict |
| `render.js` | Rendu du verdict (partagé popup / panneau) |
| `popup.html/css/js` | Interface de saisie et d'affichage du verdict |

Pas de build : JavaScript natif. Après une modification, cliquer sur ↻ dans `chrome://extensions`.
