import { ButtonLink } from "@/components/ui/button/button";
import { NavBar } from "@/components/layout/navBar";
import { HeroVisual } from "@/components/landing/hero-visual";

export function Hero() {
  return (
    <section
      id="accueil"
      className="relative overflow-hidden bg-[#180F0C]"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_75%_45%_at_50%_100%,#0da99b_0%,#48a93c_44%,transparent_100%)]"
      />

      <NavBar />

      <div className="site-container relative flex flex-col items-center pt-44 text-center sm:pt-36 md:pt-40">
        <h1 className="max-w-[1150px] text-[clamp(1.875rem,6vw,4.75rem)] font-extrabold leading-[1.08] tracking-tight text-white uppercase sm:leading-[1.05]">
          Mi-check, le détecteur de fausses informations.
        </h1>

        <div className="mt-7 w-full max-w-[360px] sm:mt-10 sm:w-auto">
          <ButtonLink href="#verification" className="w-full sm:w-auto focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">
            Lancer une vérification
          </ButtonLink>
        </div>
      </div>

      <HeroVisual />
    </section>
  );
}
