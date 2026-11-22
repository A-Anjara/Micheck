import type { WebSource } from "@/lib/laingchain/openrouter";

interface SourcesListProps {
  sources: WebSource[];
  /** Variante compacte (chat) : sans extraits. */
  compact?: boolean;
  tone?: "light" | "dark";
}

const isHttpUrl = (value: string): boolean => {
  try {
    const { protocol } = new URL(value);
    return protocol === "https:" || protocol === "http:";
  } catch {
    return false;
  }
};

export function SourcesList({
  sources,
  compact = false,
  tone = "light",
}: SourcesListProps) {
  const dark = tone === "dark";

  return (
    <ol className="space-y-3">
      {sources.map((source, index) => (
        <li key={source.url} className="flex gap-3">
          <span
            className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
              dark ? "bg-white/10 text-[#6cc671]" : "bg-[#e3f5e8] text-[#206c30]"
            }`}
          >
            {index + 1}
          </span>
          <div className="min-w-0">
            {isHttpUrl(source.url) ? (
              <a
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`line-clamp-2 text-sm font-semibold underline-offset-2 hover:underline ${
                  dark ? "text-[#6cc671]" : "text-[#206c30]"
                }`}
              >
                {source.title}
              </a>
            ) : (
              <span className="text-sm font-semibold">{source.title}</span>
            )}
            <p className={`text-xs ${dark ? "text-white/50" : "text-[#5b6b5e]"}`}>
              {source.domain}
            </p>
            {!compact && source.excerpt && (
              <blockquote
                className={`mt-1.5 border-l-2 pl-3 text-xs leading-relaxed ${
                  dark
                    ? "border-[#0da99b] text-white/60"
                    : "border-[#6cc671] text-[#3a4a3d]"
                }`}
              >
                {source.excerpt}
              </blockquote>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}
