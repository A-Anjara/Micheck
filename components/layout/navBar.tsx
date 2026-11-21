import Link from "next/link";
import { NAV_LINKS } from "@/constants/constants";
import { LogoLight } from "@/components/ui/logo/logo";

export function NavBar() {
  return (
    <header className="absolute inset-x-0 top-0 z-50">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6 md:px-10">
        <Link
          href="#accueil"
          aria-label="Mi-check, accueil"
          className="flex items-center gap-2.5"
        >
          <LogoLight className="h-8 w-auto" color="#FFFFFF" />
          <span className="text-xl font-bold tracking-tight text-white">
            Mi-check
          </span>
        </Link>

        <nav
          aria-label="Navigation principale"
          className="flex items-center gap-4 text-xs font-medium text-white/90 sm:gap-8 sm:text-sm"
        >
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              // className="transition-colors duration-200 hover:text-[#A8C37D]"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
