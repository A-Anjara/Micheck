import { PhoneFrame } from "@/components/ui/phone-frame";

type SocialNetwork = "instagram" | "x" | "tiktok" | "youtube";

function SocialIcon({ network }: { network: SocialNetwork }) {
  const common = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  return (
    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-white backdrop-blur-sm sm:h-12 sm:w-12">
      {network === "instagram" && (
        <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden>
          <rect x="3.5" y="3.5" width="17" height="17" rx="5" {...common} />
          <circle cx="12" cy="12" r="4" {...common} />
          <circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" />
        </svg>
      )}
      {network === "x" && (
        <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden>
          <path d="M5 5l14 14M19 5L5 19" {...common} strokeWidth={2} />
        </svg>
      )}
      {network === "tiktok" && (
        <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden>
          <path d="M14 4v9.5a3.5 3.5 0 1 1-3.5-3.5" {...common} />
          <path d="M14 4c.6 2.6 2.5 4.2 5 4.2" {...common} />
        </svg>
      )}
      {network === "youtube" && (
        <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden>
          <rect x="3" y="6" width="18" height="12" rx="4" {...common} />
          <path d="M10 9.5l5 2.5-5 2.5z" fill="currentColor" stroke="none" />
        </svg>
      )}
    </div>
  );
}

function SocialScreen() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-6 bg-[radial-gradient(circle_at_50%_20%,#2b4a9b,#0a1230_72%)] px-4">
      <p className="text-lg font-semibold text-white sm:text-xl">
        Social Media
      </p>
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <SocialIcon network="instagram" />
        <SocialIcon network="x" />
        <SocialIcon network="tiktok" />
        <SocialIcon network="youtube" />
      </div>
    </div>
  );
}

function EmptyScreen() {
  return (
    <div className="relative h-full w-full overflow-hidden bg-[radial-gradient(circle_at_50%_18%,#2a2320,#0b0807_70%)]">
      <span
        aria-hidden
        className="absolute left-1/2 top-2 h-4 w-16 -translate-x-1/2 rounded-full bg-black"
      />
    </div>
  );
}

export function HeroVisual() {
  return (
    <div className="relative mx-auto mt-10 h-[300px] w-full max-w-6xl overflow-hidden sm:h-[440px] lg:h-[600px]">
      <div className="absolute bottom-[-14%] left-[1%] w-[36%] max-w-[260px] -rotate-[8deg] rounded-3xl border border-white/20 bg-white p-1.5 shadow-[0_30px_80px_rgba(0,0,0,0.45)] sm:left-[5%] sm:p-2">
        <div className="aspect-[9/19] w-full overflow-hidden rounded-2xl">
          <EmptyScreen />
        </div>
      </div>

      <div className="absolute bottom-[-16%] right-[1%] w-[32%] max-w-[235px] rotate-[8deg] rounded-3xl border border-white/20 bg-white p-1.5 shadow-[0_30px_80px_rgba(0,0,0,0.45)] sm:right-[5%] sm:p-2">
        <div className="aspect-[9/19] w-full overflow-hidden rounded-2xl">
          <EmptyScreen />
        </div>
      </div>

      <div className="absolute bottom-[-12%] left-1/2 w-[38%] max-w-[290px] -translate-x-1/2">
        <PhoneFrame className="shadow-[0_40px_120px_rgba(0,0,0,0.6)]">
          <SocialScreen />
        </PhoneFrame>
      </div>

      <span className="absolute bottom-7 left-[13%] -rotate-[8deg] text-xs font-bold tracking-[0.18em] text-white uppercase drop-shadow sm:text-sm">
        Blogs
      </span>
      <span className="absolute right-[13%] bottom-7 rotate-[8deg] text-xs font-bold tracking-[0.18em] text-white uppercase drop-shadow sm:text-sm">
        Chats
      </span>
      <span className="absolute bottom-4 left-1/2 z-20 -translate-x-1/2 text-sm font-bold tracking-[0.18em] text-white uppercase drop-shadow sm:text-base">
        Réseaux sociaux
      </span>
    </div>
  );
}
