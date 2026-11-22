import Link from "next/link";
import { NAV_LINKS } from "@/constants/constants";
import { LogoLight } from "@/components/ui/logo/logo";
import { OpenChatButton } from "@/components/chat/open-chat-button";

export function Footer() {
  return (
    <footer className="relative overflow-hidden bg-[#180F0C] pt-20 pb-10">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-64 bg-[radial-gradient(ellipse_60%_100%_at_50%_100%,rgba(72,169,60,0.35),transparent_70%)]"
      />
      <div className="site-container relative">
        <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-8 text-center sm:p-12">
          <h2 className="text-[clamp(1.75rem,3.5vw,3rem)] font-bold leading-tight tracking-tight">
            Un doute sur une info ? <span className="text-[#6cc671]">Demandez à Mi-check.</span>
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-white/70">
            Avant de partager, prenez 10 secondes pour vérifier. Mi-check répond en malgache et en
            français.
          </p>
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="#verifier"
              className="inline-flex items-center justify-center rounded-full bg-white px-7 py-3 text-sm font-semibold text-[#180F0C] transition hover:bg-[#e8f0da]"
            >
              Vérifier une information
            </Link>
            <OpenChatButton className="inline-flex items-center justify-center rounded-full border border-white/25 px-7 py-3 text-sm font-semibold text-white transition hover:border-[#A8C37D] hover:text-[#A8C37D]">
              💬 Discuter avec Mi-check
            </OpenChatButton>
          </div>
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-6 border-t border-white/10 pt-8 sm:flex-row">
          <Link href="#accueil" className="flex items-center gap-2.5" aria-label="Mi-check, retour en haut">
            <LogoLight className="h-7 w-auto" color="#FFFFFF" />
            <span className="text-lg font-bold">Mi-check</span>
          </Link>
          <nav aria-label="Liens du pied de page" className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-white/70">
            {NAV_LINKS.map((link) => (
              <Link key={link.href} href={link.href} className="hover:text-[#A8C37D]">
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <p className="mt-8 text-center text-xs leading-relaxed text-white/40">
          Mi-check · DevFest 2026 · Les analyses sont générées par IA et peuvent contenir des erreurs :
          consultez toujours les sources citées.
        </p>
      </div>
    </footer>
  );
}
