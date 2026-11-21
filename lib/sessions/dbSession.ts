import type { IDBSession } from "@/types";

const SESSION_COOKIE = "db_session";

/**
 * Lit le jeton de session côté navigateur.
 * À brancher sur un cookie httpOnly sécurisé côté serveur.
 */
export const getToken = async (): Promise<string | null> => {
  if (typeof document === "undefined") {
    return null;
  }

  const cookie = document.cookie
    .split("; ")
    .find((entry) => entry.startsWith(`${SESSION_COOKIE}=`));

  return cookie?.split("=")[1] ?? null;
};

/**
 * Récupère une session à partir d'un jeton.
 * Aucun stockage persistant n'est configuré pour l'instant.
 */
export const getSession = async (token: string): Promise<IDBSession | null> => {
  void token;
  return null;
};
