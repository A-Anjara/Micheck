import { ANALYZE_TITLE, FEATURE_ITEMS } from "@/constants/constants";
import { FeatureCard } from "@/components/ui/feature-card";
import { PhoneFrame } from "@/components/ui/phone-frame";

export function AnalyzeSection() {
  return (
    <section
      id="verification"
      className="bg-white py-20 md:py-28"
    >
      <div className="site-container">
        <h2 className="mx-auto max-w-4xl text-center text-[clamp(2rem,4.2vw,3.9rem)] font-bold leading-[1.1] tracking-tight text-[#18241c]">
          <span className="text-[#6cc671]">{ANALYZE_TITLE.highlight}</span>
          {ANALYZE_TITLE.rest}
        </h2>

        <div className="mt-14 grid items-center gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
          <div className="mx-auto w-full max-w-[320px] rotate-[-2deg] sm:max-w-[360px]">
            <PhoneFrame screenClassName="bg-[#0b0807]">
              <div className="relative h-full w-full bg-[radial-gradient(circle_at_35%_18%,#4a332c,#1a1210_55%,#0b0807)]">
                <div
                  aria-hidden
                  className="absolute -right-12 top-12 h-44 w-44 rounded-full bg-[#e07a4a]/30 blur-3xl"
                />
                <div
                  aria-hidden
                  className="absolute -left-12 bottom-16 h-52 w-52 rounded-full bg-[#8a3d1f]/25 blur-3xl"
                />
              </div>
            </PhoneFrame>
          </div>

          <div className="space-y-5">
            {FEATURE_ITEMS.map((feature) => (
              <FeatureCard key={feature.description} feature={feature} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
