// lib/session-config.ts
// Konfigurasi iron-session yang dipakai BERSAMA oleh route handler & middleware.
// TIDAK meng-import next/headers, supaya aman dipakai di middleware (Edge runtime).
import type { SessionOptions } from "iron-session";

export type AppRole = "OWNER" | "STAFF" | "LEADER" | "MEMBER";

export interface SessionData {
  user?: {
    id: number;
    email: string;
    nama: string;
    role: AppRole;
  };
}

export const sessionOptions: SessionOptions = {
  // SESSION_SECRET di .env wajib >= 32 karakter (sudah dibuat di Tahap 1)
  password: process.env.SESSION_SECRET as string,
  cookieName: "jj_session",
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 hari
    path: "/",
  },
};
