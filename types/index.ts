import type { NextRequest } from "next/server";
import type { ReactNode } from "react";

export type AdminRole = "ADMIN" | "SUPERADMIN";

export interface IPagination {
  take: number;
  skip: number;
}

export type IfileType = "IMAGE" | "VIDEO" | "FILE";

export interface IResponseType<T> {
  status: "success" | "error";
  message: string;
  data?: T;
}

export interface IObjectEntity {
  key: string;
  value: unknown;
}

export interface IDBSession {
  id: string;
  username: string;
  role: AdminRole;
  image?: string;
  adminId: string;
  expires?: string | number | Date;
}

export interface INextauthSession {
  id: string;
}

export type NextRequestWithId = NextRequest & {
  userId?: string | null;
};

export interface I3DMaterial {
  name: string;
  color?: string;
  texture?: string;
  [key: string]: unknown;
}

export interface NavLink {
  label: string;
  href: string;
}

export interface ButtonProps {
  children: ReactNode;
  href: string;
  variant?: "primary" | "secondary";
}
