import { NextResponse } from "next/server";
import type { IDBSession } from "@/types";

export const unauthorizedResponse = (
  message: string,
  status = 401,
): NextResponse =>
  NextResponse.json({ message }, { status });

export const isTokenExpired = (expires: number): boolean =>
  Number.isFinite(expires) && expires < Date.now();

export const checkIsSuperadmin = async (
  session: IDBSession | null,
): Promise<IDBSession> => {
  if (!session || session.role !== "SUPERADMIN") {
    throw new Error("Superadmin privileges required");
  }

  return session;
};

export const fetchApi = (input: string, init?: RequestInit): Promise<Response> =>
  fetch(input, init);
