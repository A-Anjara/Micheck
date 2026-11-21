import { ButtonLink } from "@/components/ui/button/button";
import { HERO_CONTENT } from "@/constants/constants";
import { NavBar } from "@/components/layout/navBar";
import { HeroVisual } from "@/components/landing/hero-visual";

export function Hero() {
  return (
    <section
      id="accueil"
      className="relative overflow-hidden bg-[#180F0C] pb-0"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,#180F0C_0%,#180F0C_42%,#00897B_68%,#57BE5C_86%,#B3FF00_100%)]"
      />

      <NavBar />

      <div className="relative mx-auto flex max-w-7xl flex-col items-center px-6 pt-32 text-center sm:pt-36 md:pt-40">
        <h1 className="max-w-[1150px] text-[clamp(2rem,5.2vw,4.75rem)] font-extrabold leading-[1.05] tracking-tight text-white uppercase">
          {HERO_CONTENT.title}
        </h1>

        <div className="mt-8 sm:mt-10">
          <ButtonLink href={HERO_CONTENT.ctaHref}>
            {HERO_CONTENT.ctaLabel}
          </ButtonLink>
        </div>
      </div>

      <HeroVisual />
    </section>
  );
}
