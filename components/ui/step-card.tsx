import type { StepItem } from "@/constants/types";

interface StepCardProps {
  step: StepItem;
  className?: string;
}

export function StepCard({ step, className = "" }: StepCardProps) {
  return (
    <article
      className={`flex items-center gap-4 rounded-3xl bg-gradient-to-r from-[#9bdb9f] to-[#d2eed4] p-4 shadow-[0_18px_40px_rgba(24,36,28,0.1)] sm:gap-5 sm:p-5 ${className}`.trim()}
    >
      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white text-2xl font-bold text-[#206c30] sm:h-20 sm:w-20 sm:text-3xl">
        {step.number}
      </div>
      <div>
        <h3 className="text-base font-semibold text-[#18241c] sm:text-lg">
          {step.title}
        </h3>
        <p className="mt-1 text-sm leading-snug text-[#3a4a3d]">
          {step.description}
        </p>
      </div>
    </article>
  );
}
