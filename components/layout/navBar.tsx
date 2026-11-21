import Link from "next/link";
import { NAV_LINKS } from "@/constants/constants";
import { LogoLight } from "@/components/ui/logo/logo";

export function NavBar() {
  return (
    <header className="absolute inset-x-0 top-0 z-50">
      <div className="site-container flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:py-6">
        <Link
          href="#accueil"
          aria-label="Mi-check, accueil"
          className="flex min-h-11 items-center gap-2.5 self-start rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
        >
          <LogoLight className="h-8 w-auto" color="#FFFFFF" />
          <span className="text-xl font-bold tracking-tight text-white">
            Mi-check
          </span>
        </Link>

        <nav
          aria-label="Navigation principale"
          className="flex w-full items-center justify-between gap-3 text-xs font-medium text-white/90 sm:w-auto sm:justify-end sm:gap-6 sm:text-sm lg:gap-8"
        >
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="inline-flex min-h-11 items-center rounded-md text-center transition-colors duration-200 hover:text-[#A8C37D] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
