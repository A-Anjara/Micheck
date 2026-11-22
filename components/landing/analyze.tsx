import { ANALYZE_TITLE, FEATURE_ITEMS } from "@/constants/constants";
import { FeatureCard } from "@/components/ui/feature-card";
import { PhoneFrame } from "@/components/ui/phone-frame";
import { ResultScreen } from "@/components/ui/phone-screens";

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
            <PhoneFrame>
              <ResultScreen />
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
