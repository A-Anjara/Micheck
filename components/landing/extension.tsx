import Link from "next/link";
import { EXTENSION_FEATURES, EXTENSION_STEPS } from "@/constants/constants";
import { PhoneFrame } from "@/components/ui/phone-frame";
import { FeedScreen } from "@/components/ui/phone-screens";

export function ExtensionSection() {
  return (
    <section id="extension" className="scroll-mt-6 bg-white py-20 text-[#18241c] md:py-28">
      <div className="site-container grid items-center gap-14 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <span className="inline-block rounded-full bg-[#e3f5e8] px-4 py-1.5 text-sm font-semibold text-[#206c30]">
            Extension Chrome &amp; Edge
          </span>
          <h2 className="mt-5 text-[clamp(2rem,4.2vw,3.6rem)] font-bold leading-[1.1] tracking-tight">
            Vérifiez directement <span className="text-[#6cc671]">sur Facebook</span>
          </h2>
          <p className="mt-4 max-w-xl text-lg text-[#3a4a3d]">
            En faisant défiler votre fil, chaque post reçoit un bouton{" "}
            <strong className="text-[#206c30]">✓ Vérifier</strong>. Un clic, et le verdict
            s&apos;affiche dans un panneau à côté, avec les sources.
          </p>

          <ul className="mt-8 grid gap-3 sm:grid-cols-2">
            {EXTENSION_FEATURES.map((feature) => (
              <li
                key={feature.title}
                className="rounded-2xl bg-gradient-to-r from-[#b6e4b8] to-[#cbeccd] p-4"
              >
                <p className="font-semibold">{feature.title}</p>
                <p className="mt-1 text-sm text-[#3a4a3d]">{feature.description}</p>
              </li>
            ))}
          </ul>

          <div className="mt-10 rounded-[1.75rem] bg-[#f4faf5] p-6">
            <h3 className="font-bold">Installer l&apos;extension (mode développeur)</h3>
            <ol className="mt-4 space-y-3">
              {EXTENSION_STEPS.map((step, index) => (
                <li key={step} className="flex gap-3 text-sm text-[#3a4a3d]">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#206c30] text-xs font-bold text-white">
                    {index + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
            <Link
              href="/demo"
              className="mt-6 inline-flex items-center justify-center rounded-full bg-[#180F0C] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#2a1c17]"
            >
              Essayer sur le faux fil de démo →
            </Link>
          </div>
        </div>

        <div className="mx-auto w-full max-w-[320px] rotate-[2deg] sm:max-w-[360px]">
          <PhoneFrame>
            <FeedScreen />
          </PhoneFrame>
        </div>
      </div>
    </section>
  );
}
