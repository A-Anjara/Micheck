// Contexte malgache partagé par la vérification et le chat.

// Mi-check cible l'information circulant à Madagascar (posts en malgache ou en français).
export const MADAGASCAR_CONTEXT = `CONTEXTE : Mi-check vérifie surtout l'information qui circule à Madagascar, sur Facebook en particulier.
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

// Mots-outils fréquents pour distinguer malgache et français.
const MG_WORDS = new Set(
    "ny sy amin'ny an'ny ho dia fa izany tsy misy ary hoe ao amin ireo izy ianao isika izahay mba koa na raha satria fotoana ianareo azy azo tokony efa mbola nanao manao hoy any eto".split(" "),
);
const FR_WORDS = new Set(
    "le la les des est et que qui pour une un du dans sur pas par avec au aux ce cette sont ont il elle nous vous ils mais ou plus été être".split(" "),
);

/** Langue principale du texte : "malgache" ou "français". */
export const detectLanguage = (text: string): "malgache" | "français" => {
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


/** Date du jour en toutes lettres, pour situer le modèle dans le temps. */
export const todayFr = (): string =>
    new Date().toLocaleDateString("fr-FR", { dateStyle: "full" });
