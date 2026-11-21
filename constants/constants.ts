import type { FeatureItem, NavLink, StepItem } from "./types";

export const NAV_LINKS: NavLink[] = [
  { label: "Accueil", href: "#accueil" },
  { label: "Vérification de contenu", href: "#verification" },
];

export const ANALYZE_TITLE = {
  highlight: "Mi-check",
  rest: " analyse, explique, et vous guide",
};

export const FEATURE_ITEMS: FeatureItem[] = [
  {
    description: "Analysez un texte, une photo ou une vidéo au même endroit.",
  },
  {
    description:
      "Un score de confiance et une explication simple pour comprendre le résultat.",
  },
  {
    description: "Repérez les deepfakes et les contenus générés par IA.",
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
