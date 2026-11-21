import Link from "next/link";
import type { ReactNode } from "react";

type ButtonVariant = "primary" | "secondary";

interface ButtonLinkProps {
  href: string;
  children: ReactNode;
  variant?: ButtonVariant;
  className?: string;
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    "bg-white text-[#180F0C] hover:bg-[#e8f0da] hover:shadow-[0_0_30px_rgba(168,195,125,0.25)]",
  secondary:
    "border border-white/25 text-white hover:border-[#A8C37D] hover:text-[#A8C37D]",
};

export function ButtonLink({
  href,
  children,
  variant = "primary",
  className = "",
}: ButtonLinkProps) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center justify-center rounded-full px-7 py-3 text-sm font-semibold transition duration-200 hover:scale-[1.02] ${VARIANT_CLASSES[variant]} ${className}`.trim()}
    >
      {children}
    </Link>
  );
}
