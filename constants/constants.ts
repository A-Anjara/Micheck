import type { ExtensionFeature, FeatureItem, NavLink, StepItem } from "./types";

export const NAV_LINKS: NavLink[] = [
  { label: "Accueil", href: "#accueil" },
  { label: "Vérifier", href: "#verifier" },
  { label: "Comment ça marche", href: "#etapes" },
  { label: "Extension", href: "#extension" },
];

export const ANALYZE_TITLE = {
  highlight: "Mi-check",
  rest: " analyse, explique, et vous guide",
};

export const FEATURE_ITEMS: FeatureItem[] = [
  {
    description:
      "Analysez un texte ou une photo au même endroit, en malgache ou en français.",
  },
  {
    description:
      "Un score de confiance et une explication simple pour comprendre le résultat.",
  },
  {
    description:
      "Des sources fiables malgaches et internationales consultées en temps réel.",
  },
  {
    description: "Repérez les images retouchées ou générées par IA.",
  },
];

export const STEPS_TITLE = {
  before: "Détectez le faux en ",
  highlight: "3",
  after: " étapes.",
};

export const STEP_ITEMS: StepItem[] = [
  {
    number: "1",
    title: "Soumettez",
    description: "Collez ou importez votre contenu.",
  },
  {
    number: "2",
    title: "Analysez",
    description: "L'IA détecte les signes de manipulation.",
  },
  {
    number: "3",
    title: "Comprenez",
    description: "Recevez un score et une explication.",
  },
];

export const EXTENSION_FEATURES: ExtensionFeature[] = [
  {
    title: "Un bouton sur chaque post",
    description: "Détection automatique des posts pendant le défilement.",
  },
  {
    title: "Texte + image analysés",
    description: "Le texte complet, l'image et l'auteur du post sont pris en compte.",
  },
  {
    title: "Verdict à côté du fil",
    description: "Un panneau latéral affiche le verdict, les indices et les sources.",
  },
  {
    title: "Clic droit partout",
    description: "Vérifiez un texte sélectionné ou une image sur n'importe quel site.",
  },
];

export const EXTENSION_STEPS: string[] = [
  "Ouvrez chrome://extensions (ou edge://extensions) et activez le « Mode développeur ».",
  "Cliquez sur « Charger l'extension non empaquetée » et choisissez le dossier extension/ du projet.",
  "Épinglez Mi-check, ouvrez Facebook, puis cliquez sur « ✓ Vérifier » sur un post.",
];
