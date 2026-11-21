import type { FeatureItem } from "@/constants/types";

interface FeatureCardProps {
  feature: FeatureItem;
}

export function FeatureCard({ feature }: FeatureCardProps) {
  return (
    <article className="rounded-[1.75rem] border-[3px] border-white bg-gradient-to-r from-[#b6e4b8] to-[#cbeccd] px-6 py-7 shadow-[0_18px_40px_rgba(24,36,28,0.12)] sm:px-8 sm:py-8">
      <p className="text-base font-medium leading-snug text-[#18241c] sm:text-lg">
        {feature.description}
      </p>
    </article>
  );
}
