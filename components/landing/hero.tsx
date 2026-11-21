import { ButtonLink } from "@/components/ui/button/button";
import { HERO_CONTENT } from "@/constants/constants";

export function Hero() {
  return (
    <div className="mx-auto max-w-3xl px-6 pt-10 text-center md:pt-14">
      <h1 className="text-3xl font-extrabold uppercase leading-tight sm:text-4xl md:text-5xl">
        {HERO_CONTENT.title}
      </h1>

      <div className="mt-8">
        <ButtonLink href={HERO_CONTENT.ctaHref}>
          {HERO_CONTENT.ctaLabel}
        </ButtonLink>
      </div>
    </div>
  );
}
