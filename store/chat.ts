"use client";

import { create } from "zustand";

type ChatStore = {
    open: boolean;
    /** Message à pré-remplir à l'ouverture (ex. depuis un bouton de la page). */
    draft: string;
    setOpen: (open: boolean) => void;
    openWith: (draft?: string) => void;
    clearDraft: () => void;
};

export const useChatStore = create<ChatStore>((set) => ({
    open: false,
    draft: "",
    setOpen: (open) => set({ open }),
    openWith: (draft = "") => set({ open: true, draft }),
    clearDraft: () => set({ draft: "" }),
}));
