import type { ReactNode } from "react";

interface PhoneFrameProps {
  className?: string;
  screenClassName?: string;
  children?: ReactNode;
}

/**
 * Cadre de téléphone réutilisable (bordure sombre, écran arrondi, encoche).
 */
export function PhoneFrame({
  className = "",
  screenClassName = "",
  children,
}: PhoneFrameProps) {
  return (
    <div
      className={`relative aspect-[9/19.5] rounded-[2.5rem] border border-white/15 bg-[#0b0807] p-2 shadow-[0_40px_120px_rgba(0,0,0,0.55)] ${className}`.trim()}
    >
      <div
        aria-hidden
        className="absolute left-1/2 top-3 z-20 h-5 w-24 -translate-x-1/2 rounded-full bg-black"
      />
      <div
        className={`relative h-full w-full overflow-hidden rounded-[2rem] ${screenClassName}`.trim()}
      >
        {children}
      </div>
    </div>
  );
}
