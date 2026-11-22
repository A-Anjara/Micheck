import { STEP_ITEMS, STEPS_TITLE } from "@/constants/constants";
import { PhoneFrame } from "@/components/ui/phone-frame";
import { ChatScreen } from "@/components/ui/phone-screens";
import { StepCard } from "@/components/ui/step-card";

export function StepsSection() {
  return (
    <section id="etapes" className="bg-[#f4faf5] py-12 md:py-20">
      <div className="site-container rounded-[2.5rem] bg-white px-6 py-14 md:px-12 md:py-20">
        <h2 className="text-center text-[clamp(1.9rem,3.8vw,3.5rem)] font-bold leading-tight tracking-tight text-[#18241c]">
          {STEPS_TITLE.before}
          <span className="text-[#206c30]">{STEPS_TITLE.highlight}</span>
          {STEPS_TITLE.after}
        </h2>

        <div className="relative mt-14">
          <div className="mx-auto w-full max-w-[340px] sm:max-w-[400px]">
            <PhoneFrame>
              <ChatScreen />
            </PhoneFrame>
          </div>

          <div className="mt-8 grid gap-5 md:grid-cols-2 lg:absolute lg:inset-0 lg:mt-0 lg:block">
            <StepCard
              step={STEP_ITEMS[0]}
              className="lg:absolute lg:top-[10%] lg:left-0 lg:w-[45%]"
            />
            <StepCard
              step={STEP_ITEMS[1]}
              className="lg:absolute lg:top-[10%] lg:right-0 lg:w-[45%]"
            />
            <StepCard
              step={STEP_ITEMS[2]}
              className="md:col-span-2 md:mx-auto md:max-w-[420px] lg:absolute lg:bottom-[6%] lg:left-1/2 lg:w-[45%] lg:max-w-none lg:-translate-x-1/2"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
