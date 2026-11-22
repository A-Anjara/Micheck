"use client";

import type { ReactNode } from "react";
import { useChatStore } from "@/store/chat";

interface OpenChatButtonProps {
  children: ReactNode;
  className?: string;
  draft?: string;
}

/** Bouton qui ouvre le chat Mi-check (utilisable dans des composants serveur). */
export function OpenChatButton({ children, className = "", draft }: OpenChatButtonProps) {
  const openWith = useChatStore((s) => s.openWith);
  return (
    <button type="button" onClick={() => openWith(draft)} className={className}>
      {children}
    </button>
  );
}
