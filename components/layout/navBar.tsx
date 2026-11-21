import Link from "next/link";
import { NAV_LINKS } from "@/constants/constants";
import { LogoLight } from "@/components/ui/logo/logo";

export function NavBar() {
  return (
    <header className="flex w-full items-center justify-between px-6 py-8 md:px-12">
      <Link href="/" aria-label="Mi-check, accueil">
        <LogoLight className="h-8 w-auto" color="#FFFFFF" />
      </Link>

      <nav className="flex items-center gap-6 text-sm font-medium text-white">
        {NAV_LINKS.map((link) => (
          <Link
            key={link.label}
            href={link.href}
            className="transition-colors duration-200 hover:text-[#A8C37D]"
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}