import type { HeroContent, NavLink } from "./types";

export const NAV_LINKS: NavLink[] = [
  { label: "Accueil", href: "/" },
  { label: "Vérifier", href: "#verification" },
];

export const HERO_CONTENT: HeroContent = {
  title: "Mi-check, le détecteur de fausses informations.",
  ctaLabel: "Lancer une vérification",
  ctaHref: "#verification",
};