import type { VerificationResult } from "@/lib/laingchain/verifyContent";
import { SourcesList } from "./sources-list";
import { VERDICT_STYLES } from "./verdicts";

interface ResultCardProps {
  result: VerificationResult;
}

export function ResultCard({ result }: ResultCardProps) {
  const style = VERDICT_STYLES[result.verdict] ?? VERDICT_STYLES.invérifiable;

  return (
    <article className="rounded-[1.75rem] bg-white p-6 text-[#18241c] shadow-[0_18px_40px_rgba(0,0,0,0.25)] sm:p-8">
      <div className="flex flex-wrap items-center gap-3">
        <span
          className="rounded-full px-4 py-1.5 text-sm font-extrabold uppercase tracking-wide text-white"
          style={{ background: style.color }}
        >
          {style.label}
        </span>
        <span className="ml-auto text-sm font-medium text-[#5b6b5e]">
          Confiance : {result.confidence} %
        </span>
      </div>

      <div
        className="mt-3 h-2 overflow-hidden rounded-full"
        style={{ background: style.soft }}
        role="meter"
        aria-label="Niveau de confiance"
        aria-valuenow={result.confidence}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full rounded-full transition-[width] duration-700"
          style={{ width: `${result.confidence}%`, background: style.color }}
        />
      </div>

      <p className="mt-5 text-lg font-semibold leading-snug">{result.summary}</p>
      {result.explanation && (
        <p className="mt-3 leading-relaxed text-[#3a4a3d]">{result.explanation}</p>
      )}

      {result.signals.length > 0 && (
        <section className="mt-6">
          <h3 className="text-sm font-bold uppercase tracking-wide text-[#206c30]">
            Indices relevés
          </h3>
          <ul className="mt-2 space-y-1.5">
            {result.signals.map((signal) => (
              <li key={signal} className="flex gap-2 text-sm text-[#3a4a3d]">
                <span aria-hidden className="text-[#6cc671]">●</span>
                {signal}
              </li>
            ))}
          </ul>
        </section>
      )}

      {result.advice && (
        <section className="mt-6 rounded-2xl bg-[#f4faf5] p-4">
          <h3 className="text-sm font-bold uppercase tracking-wide text-[#206c30]">
            Comment vérifier
          </h3>
          <p className="mt-1.5 text-sm leading-relaxed text-[#3a4a3d]">
            {result.advice}
          </p>
        </section>
      )}

      {result.sources.length > 0 && (
        <section className="mt-6">
          <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-[#206c30]">
            Sources consultées ({result.sources.length})
          </h3>
          <SourcesList sources={result.sources} />
        </section>
      )}

      <p className="mt-6 text-xs text-[#7a8a7d]">
        {result.webSearch
          ? "Analyse générée par IA à partir d'une recherche web. Ouvrez les sources pour vérifier."
          : "Analyse générée par IA, sans recherche web. Croisez toujours avec des sources fiables."}
      </p>
    </article>
  );
}
