"use client";

import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import type { WebSource } from "@/lib/laingchain/openrouter";
import { LogoLight } from "@/components/ui/logo/logo";
import { SourcesList } from "@/components/verify/sources-list";
import { useChatStore } from "@/store/chat";
import { RichText } from "./rich-text";

interface Message {
  id: number;
  role: "user" | "assistant";
  content: string;
  sources?: WebSource[];
  error?: boolean;
}

const SUGGESTIONS = [
  "Comment reconnaître un faux communiqué officiel ?",
  "Y a-t-il des délestages JIRAMA annoncés cette semaine ?",
  "Ahoana no hamantarana vaovao sandoka eny amin'ny Facebook ?",
  "Une offre d'emploi demande des frais par MVola, est-ce une arnaque ?",
];

const MAX_LENGTH = 4000;
let nextId = 1;

export function ChatWidget() {
  const { open, setOpen, draft, clearDraft } = useChatStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [webSearch, setWebSearch] = useState(true);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Pré-remplissage depuis un bouton de la page, puis focus sur le champ.
  useEffect(() => {
    if (!open) return;
    if (draft) {
      setInput(draft);
      clearDraft();
    }
    const id = requestAnimationFrame(() => inputRef.current?.focus());
    return () => cancelAnimationFrame(id);
  }, [open, draft, clearDraft]);

  // Défile vers le dernier message.
  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  // Échap ferme le chat.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: globalThis.KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, setOpen]);

  const send = async (content: string) => {
    const text = content.trim().slice(0, MAX_LENGTH);
    if (!text || loading) return;

    const userMessage: Message = { id: nextId++, role: "user", content: text };
    // L'historique envoyé exclut les messages d'erreur.
    const history = [...messages.filter((m) => !m.error), userMessage];
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          webSearch,
          messages: history.map(({ role, content }) => ({ role, content })),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || `Erreur ${res.status}`);
      setMessages((prev) => [
        ...prev,
        { id: nextId++, role: "assistant", content: data.message, sources: data.sources },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: nextId++,
          role: "assistant",
          error: true,
          content:
            err instanceof Error && err.message !== "Internal Server Error"
              ? err.message
              : "Désolé, une erreur est survenue. Réessayez dans quelques secondes.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    send(input);
  };

  // Entrée envoie, Maj+Entrée fait un retour à la ligne.
  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      send(input);
    }
  };

  return (
    <>
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="fixed bottom-5 right-5 z-[60] flex items-center gap-2 rounded-full bg-gradient-to-r from-[#0da99b] to-[#6cc671] py-3 pl-4 pr-5 font-bold text-[#0d1a10] shadow-[0_12px_40px_rgba(0,0,0,0.35)] transition hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
          aria-label="Ouvrir le chat Mi-check"
        >
          <span aria-hidden className="text-lg">💬</span>
          <span className="hidden sm:inline">Discuter avec Mi-check</span>
        </button>
      )}

      {open && (
        <div
          role="dialog"
          aria-label="Chat avec Mi-check"
          className="fixed inset-x-3 bottom-3 top-16 z-[60] flex flex-col overflow-hidden rounded-[1.5rem] border border-white/10 bg-[#180F0C] text-white shadow-[0_24px_80px_rgba(0,0,0,0.55)] sm:inset-x-auto sm:bottom-5 sm:right-5 sm:top-auto sm:h-[min(640px,calc(100vh-2.5rem))] sm:w-[400px]"
        >
          <header className="flex items-center gap-3 border-b border-white/10 bg-gradient-to-r from-[#0da99b]/20 to-[#6cc671]/10 px-4 py-3">
            <LogoLight className="h-7 w-7" color="#6cc671" />
            <div className="flex-1">
              <p className="font-bold leading-tight">Mi-check</p>
              <p className="text-xs text-white/60">Assistant anti-intox · malgache &amp; français</p>
            </div>
            {messages.length > 0 && (
              <button
                type="button"
                onClick={() => setMessages([])}
                className="rounded-full px-2 py-1 text-xs text-white/60 hover:bg-white/10 hover:text-white"
                title="Nouvelle conversation"
              >
                Effacer
              </button>
            )}
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex h-8 w-8 items-center justify-center rounded-full text-xl text-white/70 hover:bg-white/10 hover:text-white"
              aria-label="Fermer le chat"
            >
              ×
            </button>
          </header>

          <div ref={listRef} className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
            {messages.length === 0 && (
              <div className="space-y-4">
                <div className="rounded-2xl rounded-tl-sm bg-white/[0.06] p-3.5 text-sm leading-relaxed">
                  <p>
                    <strong>Manao ahoana !</strong> 👋 Je suis Mi-check. Posez-moi une question sur une
                    info qui circule, ou demandez-moi comment repérer une fausse nouvelle.
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => send(s)}
                      className="rounded-xl border border-white/10 px-3 py-2 text-left text-sm text-white/80 transition hover:border-[#6cc671] hover:text-white"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m) =>
              m.role === "user" ? (
                <div key={m.id} className="flex justify-end">
                  <div className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-tr-sm bg-[#6cc671] px-3.5 py-2.5 text-sm text-[#0d1a10]">
                    {m.content}
                  </div>
                </div>
              ) : (
                <div key={m.id} className="max-w-[92%]">
                  <div
                    className={`rounded-2xl rounded-tl-sm px-3.5 py-2.5 text-sm leading-relaxed ${
                      m.error ? "bg-[#d64545]/15 text-[#ffb3b3]" : "bg-white/[0.06]"
                    }`}
                  >
                    <RichText text={m.content} />
                  </div>
                  {m.sources && m.sources.length > 0 && (
                    <details className="mt-1.5 rounded-xl bg-white/[0.03] px-3 py-2 text-xs">
                      <summary className="cursor-pointer text-white/60 hover:text-white">
                        Sources consultées ({m.sources.length})
                      </summary>
                      <div className="mt-2">
                        <SourcesList sources={m.sources} compact tone="dark" />
                      </div>
                    </details>
                  )}
                </div>
              ),
            )}

            {loading && (
              <div className="flex w-fit items-center gap-1.5 rounded-2xl rounded-tl-sm bg-white/[0.06] px-4 py-3" aria-label="Mi-check écrit">
                {[0, 150, 300].map((delay) => (
                  <span
                    key={delay}
                    className="h-2 w-2 animate-bounce rounded-full bg-[#6cc671]"
                    style={{ animationDelay: `${delay}ms` }}
                  />
                ))}
              </div>
            )}
          </div>

          <form onSubmit={onSubmit} className="border-t border-white/10 p-3">
            <div className="flex items-end gap-2 rounded-2xl border border-white/10 bg-black/30 p-2 focus-within:border-[#0da99b]">
              <label htmlFor="chat-input" className="sr-only">Votre message</label>
              <textarea
                id="chat-input"
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                rows={1}
                maxLength={MAX_LENGTH}
                placeholder="Écrivez en malgache ou en français…"
                className="max-h-32 min-h-9 flex-1 resize-none bg-transparent px-2 py-1.5 text-sm text-white placeholder:text-white/40 focus:outline-none"
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#6cc671] font-bold text-[#0d1a10] transition hover:brightness-110 disabled:opacity-40"
                aria-label="Envoyer"
              >
                ↑
              </button>
            </div>
            <label className="mt-2 flex cursor-pointer items-center gap-2 px-1 text-xs text-white/60">
              <input
                type="checkbox"
                checked={webSearch}
                onChange={(e) => setWebSearch(e.target.checked)}
                className="accent-[#6cc671]"
              />
              Recherche web (sources récentes, plus lent)
            </label>
          </form>
        </div>
      )}
    </>
  );
}
