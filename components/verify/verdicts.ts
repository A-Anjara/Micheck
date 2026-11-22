import type { Verdict } from "@/lib/laingchain/verifyContent";

export const VERDICT_STYLES: Record<
  Verdict,
  { label: string; color: string; soft: string }
> = {
  vrai: { label: "Plutôt vrai", color: "#2e9d4f", soft: "#e3f5e8" },
  faux: { label: "Faux", color: "#d64545", soft: "#fbe7e7" },
  trompeur: { label: "Trompeur", color: "#e08a2c", soft: "#fcefdf" },
  invérifiable: { label: "Invérifiable", color: "#7a7a7a", soft: "#efefef" },
};
