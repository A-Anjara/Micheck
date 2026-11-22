"use client";

import { useRef, useState, type DragEvent, type FormEvent } from "react";
import type { VerificationResult } from "@/lib/laingchain/verifyContent";
import { ResultCard } from "@/components/verify/result-card";

type Mode = "text" | "image";

const MAX_TEXT = 8000;
const MAX_IMAGE_SIDE = 1600;

const EXAMPLES = [
  "URGENT : la JIRAMA annonce une coupure d'électricité d'une semaine dans tout Antananarivo à partir de demain.",
  "Mampiakatra ny vidin'ny vary ho 10 000 Ar ny kilao ny governemanta manomboka rahampitso.",
  "Le ministère de l'Éducation recrute 5 000 enseignants : inscription par MVola, frais de dossier 20 000 Ar.",
];

/** Réduit l'image côté navigateur et la convertit en data URL JPEG. */
async function fileToDataUrl(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_IMAGE_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas indisponible");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return canvas.toDataURL("image/jpeg", 0.85);
}

export function VerifyTool() {
  const [mode, setMode] = useState<Mode>("text");
  const [text, setText] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  const loadFile = async (file?: File) => {
    if (!file || !file.type.startsWith("image/")) return;
    try {
      setImage(await fileToDataUrl(file));
      setError(null);
    } catch {
      setError("Impossible de lire cette image.");
    }
  };

  const onDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setDragOver(false);
    loadFile(event.dataTransfer.files[0]);
  };

  const canSubmit = mode === "text" ? text.trim().length > 0 : Boolean(image);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!canSubmit || loading) return;

    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const payload =
        mode === "text"
          ? { text: text.trim() }
          : { image, text: caption.trim() || undefined };
      const res = await fetch("/api/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || `Erreur ${res.status}`);
      setResult(data as VerificationResult);
      requestAnimationFrame(() =>
        resultRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }),
      );
    } catch (err) {
      setError(
        err instanceof Error && err.message !== "Internal Server Error"
          ? err.message
          : "La vérification a échoué. Réessayez dans quelques secondes.",
      );
    } finally {
      setLoading(false);
    }
  };

  const tabClass = (active: boolean) =>
    `flex-1 rounded-full px-4 py-2.5 text-sm font-semibold transition ${
      active ? "bg-[#6cc671] text-[#102012]" : "text-white/70 hover:text-white"
    }`;

  return (
    <section
      id="verifier"
      className="relative scroll-mt-6 overflow-hidden bg-[#180F0C] py-20 md:py-28"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_0%,rgba(13,169,155,0.25),transparent_70%)]"
      />
      <div className="site-container relative">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-[clamp(2rem,4.2vw,3.6rem)] font-bold leading-[1.1] tracking-tight">
            Vérifiez une information <span className="text-[#6cc671]">maintenant</span>
          </h2>
          <p className="mt-4 text-white/70 sm:text-lg">
            Collez un post, un message WhatsApp ou importez une image. Mi-check cherche
            des sources fiables à Madagascar et vous explique son verdict, en malgache ou
            en français.
          </p>
        </div>

        <div className="mx-auto mt-12 grid max-w-6xl items-start gap-8 lg:grid-cols-2">
          <form
            onSubmit={onSubmit}
            className="rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-5 backdrop-blur sm:p-7"
          >
            <div role="tablist" aria-label="Type de contenu" className="flex gap-1 rounded-full bg-white/5 p-1">
              <button type="button" role="tab" aria-selected={mode === "text"} className={tabClass(mode === "text")} onClick={() => setMode("text")}>
                Texte
              </button>
              <button type="button" role="tab" aria-selected={mode === "image"} className={tabClass(mode === "image")} onClick={() => setMode("image")}>
                Image
              </button>
            </div>

            {mode === "text" ? (
              <div className="mt-5">
                <label htmlFor="verify-text" className="sr-only">Texte à vérifier</label>
                <textarea
                  id="verify-text"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  maxLength={MAX_TEXT}
                  rows={7}
                  placeholder="Collez ici le texte à vérifier…"
                  className="w-full resize-y rounded-2xl border border-white/10 bg-black/30 p-4 text-[15px] leading-relaxed text-white placeholder:text-white/40 focus:border-[#0da99b] focus:outline-none"
                />
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="text-xs text-white/50">Exemples :</span>
                  {EXAMPLES.map((example) => (
                    <button
                      key={example}
                      type="button"
                      onClick={() => setText(example)}
                      className="max-w-full truncate rounded-full border border-white/15 px-3 py-1 text-xs text-white/70 transition hover:border-[#6cc671] hover:text-[#6cc671] sm:max-w-[16rem]"
                    >
                      {example}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="mt-5 space-y-3">
                <label
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(true);
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={onDrop}
                  className={`flex min-h-56 cursor-pointer items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed p-3 text-center text-sm transition ${
                    dragOver ? "border-[#6cc671] text-white" : "border-white/15 text-white/60"
                  }`}
                >
                  <input
                    ref={fileInput}
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    className="sr-only"
                    onChange={(e) => loadFile(e.target.files?.[0])}
                  />
                  {image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={image} alt="Image à vérifier" className="max-h-72 rounded-xl" />
                  ) : (
                    <span>
                      Cliquez ou déposez une image ici
                      <br />
                      <span className="text-xs text-white/40">PNG, JPEG, WebP ou GIF</span>
                    </span>
                  )}
                </label>
                {image && (
                  <button type="button" onClick={() => setImage(null)} className="text-xs text-white/60 underline hover:text-white">
                    Retirer l&apos;image
                  </button>
                )}
                <label htmlFor="verify-caption" className="sr-only">Légende ou texte accompagnant l&apos;image</label>
                <input
                  id="verify-caption"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  maxLength={MAX_TEXT}
                  placeholder="Légende du post (facultatif, active la recherche web)"
                  className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-[#0da99b] focus:outline-none"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={!canSubmit || loading}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#0da99b] to-[#6cc671] px-6 py-3.5 font-bold text-[#0d1a10] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading && (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#0d1a10]/30 border-t-[#0d1a10]" />
              )}
              {loading ? "Analyse en cours…" : "Vérifier avec Mi-check"}
            </button>
            {loading && (
              <p className="mt-3 text-center text-xs text-white/50">
                Recherche de sources et analyse : 10 à 20 secondes.
              </p>
            )}
          </form>

          <div ref={resultRef} aria-live="polite">
            {error && (
              <div className="rounded-[1.75rem] border border-[#d64545]/40 bg-[#d64545]/10 p-6 text-sm text-[#ffb3b3]">
                {error}
              </div>
            )}
            {result && <ResultCard result={result} />}
            {!result && !error && (
              <div className="flex min-h-72 flex-col items-center justify-center rounded-[1.75rem] border border-dashed border-white/10 p-8 text-center text-white/50">
                <span aria-hidden className="text-4xl">🔎</span>
                <p className="mt-3 max-w-xs text-sm">
                  {loading
                    ? "Mi-check consulte des sources fiables…"
                    : "Le verdict, les indices et les sources apparaîtront ici."}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
