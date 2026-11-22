// Maquettes statiques affichées dans les cadres de téléphone de la landing.

function StatusBar() {
  return (
    <div className="flex items-center justify-between px-6 pt-3 text-[10px] font-semibold text-white/80">
      <span>9:41</span>
      <span aria-hidden>▂▄▆ ◔</span>
    </div>
  );
}

/** Fil d'actualité avec un post signalé « Faux » par l'extension. */
export function FeedScreen() {
  return (
    <div aria-hidden className="flex h-full flex-col bg-[#f0f2f5] text-[#050505]">
      <div className="bg-[#180F0C]">
        <StatusBar />
        <p className="px-4 pb-2 pt-4 text-sm font-extrabold text-white">Fil d&apos;actualité</p>
      </div>

      <div className="flex-1 space-y-2 overflow-hidden p-2">
        <div className="relative rounded-xl bg-white p-3 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-full bg-gradient-to-br from-[#e07a4a] to-[#8a3d1f]" />
            <div>
              <p className="text-[11px] font-bold">Info Choc 24</p>
              <p className="text-[9px] text-[#65676b]">2 h · 🌍</p>
            </div>
            <span className="ml-auto rounded-full bg-[#d64545] px-2 py-0.5 text-[9px] font-bold text-white">
              ● Faux
            </span>
          </div>
          <p className="mt-2 text-[11px] leading-snug">
            🚨 URGENT : coupure d&apos;électricité d&apos;une semaine dans tout Antananarivo dès demain !
            Partagez vite !!!
          </p>
          <div className="mt-2 h-20 rounded-lg bg-gradient-to-br from-[#1a1210] to-[#4a332c]" />
        </div>

        <div className="rounded-xl border border-[#d64545]/30 bg-white p-3 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-[#d64545] px-2 py-0.5 text-[9px] font-extrabold uppercase text-white">Faux</span>
            <span className="text-[9px] text-[#65676b]">Confiance 92 %</span>
          </div>
          <div className="mt-1.5 h-1.5 rounded-full bg-[#fbe7e7]">
            <div className="h-full w-[92%] rounded-full bg-[#d64545]" />
          </div>
          <p className="mt-2 text-[10px] font-semibold leading-snug">
            Aucun communiqué de la JIRAMA n&apos;annonce cette coupure.
          </p>
          <p className="mt-1 text-[9px] text-[#65676b]">Sources : 2424.mg · lexpress.mg · jirama.mg</p>
        </div>

        <div className="rounded-xl bg-white p-3 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-full bg-gradient-to-br from-[#0da99b] to-[#6cc671]" />
            <p className="text-[11px] font-bold">Club Astronomie</p>
            <span className="ml-auto rounded-full bg-gradient-to-r from-[#0da99b] to-[#6cc671] px-2 py-0.5 text-[9px] font-bold text-[#0d1a10]">
              ✓ Vérifier
            </span>
          </div>
          <div className="mt-2 h-2 w-4/5 rounded bg-[#e4e6eb]" />
          <div className="mt-1 h-2 w-3/5 rounded bg-[#e4e6eb]" />
        </div>
      </div>
    </div>
  );
}

/** Conversation avec l'assistant Mi-check. */
export function ChatScreen() {
  return (
    <div aria-hidden className="flex h-full flex-col bg-[#180F0C] text-white">
      <StatusBar />
      <div className="mt-3 flex items-center gap-2 border-b border-white/10 px-4 pb-3">
        <div className="h-7 w-7 rounded-full bg-gradient-to-br from-[#0da99b] to-[#6cc671]" />
        <div>
          <p className="text-xs font-bold">Mi-check</p>
          <p className="text-[9px] text-[#6cc671]">● en ligne</p>
        </div>
      </div>

      <div className="flex-1 space-y-2.5 overflow-hidden p-3 text-[10.5px] leading-snug">
        <div className="ml-auto w-4/5 rounded-2xl rounded-tr-sm bg-[#6cc671] px-3 py-2 text-[#0d1a10]">
          Marina ve fa hampiakarina ho 10 000 Ar ny vidin&apos;ny vary ?
        </div>
        <div className="w-[88%] rounded-2xl rounded-tl-sm bg-white/[0.08] px-3 py-2">
          <span className="font-bold text-[#ff8a8a]">Diso</span> io vaovao io. Tsy misy fanambarana
          ofisialy toy izany avy amin&apos;ny governemanta.
        </div>
        <div className="w-[88%] rounded-xl bg-white/[0.04] px-3 py-1.5 text-[9px] text-white/60">
          Sources : 2424.mg · moov.mg
        </div>
        <div className="ml-auto w-4/5 rounded-2xl rounded-tr-sm bg-[#6cc671] px-3 py-2 text-[#0d1a10]">
          Comment reconnaître un faux communiqué ?
        </div>
        <div className="w-[88%] rounded-2xl rounded-tl-sm bg-white/[0.08] px-3 py-2">
          Vérifiez qu&apos;il est publié sur la page officielle, regardez la date, le tampon et les
          fautes…
        </div>
      </div>

      <div className="m-3 rounded-full border border-white/10 px-3 py-2 text-[10px] text-white/40">
        Écrivez un message…
      </div>
    </div>
  );
}

/** Résultat détaillé d'une vérification. */
export function ResultScreen() {
  return (
    <div aria-hidden className="flex h-full flex-col bg-[#180F0C] text-white">
      <StatusBar />
      <p className="px-4 pt-4 text-sm font-extrabold">
        Mi-<span className="text-[#6cc671]">check</span>
      </p>

      <div className="flex-1 space-y-2.5 overflow-hidden p-3">
        <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3 text-[10.5px] leading-snug text-white/80">
          « Le ministère recrute 5 000 enseignants : frais de dossier de 20 000 Ar à envoyer par MVola. »
        </div>

        <div className="rounded-xl bg-white p-3 text-[#18241c]">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-[#d64545] px-2 py-0.5 text-[9px] font-extrabold uppercase text-white">
              Faux
            </span>
            <span className="ml-auto text-[9px] text-[#5b6b5e]">Confiance 95 %</span>
          </div>
          <div className="mt-1.5 h-1.5 rounded-full bg-[#fbe7e7]">
            <div className="h-full w-[95%] rounded-full bg-[#d64545]" />
          </div>
          <p className="mt-2 text-[10.5px] font-semibold leading-snug">
            Arnaque probable : un recrutement public ne demande jamais de frais par mobile money.
          </p>
          <p className="mt-2 text-[9px] font-bold uppercase tracking-wide text-[#206c30]">Indices</p>
          <ul className="mt-1 space-y-0.5 text-[9.5px] text-[#3a4a3d]">
            <li>● Paiement demandé par MVola</li>
            <li>● Absent du site du ministère</li>
            <li>● Ton urgent, aucune référence</li>
          </ul>
          <p className="mt-2 text-[9px] font-bold uppercase tracking-wide text-[#206c30]">Sources</p>
          <p className="mt-0.5 text-[9.5px] text-[#206c30] underline">education.gov.mg</p>
          <p className="text-[9.5px] text-[#206c30] underline">2424.mg</p>
        </div>
      </div>
    </div>
  );
}
