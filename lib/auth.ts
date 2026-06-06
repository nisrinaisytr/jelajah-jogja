// lib/auth.ts
// Helper auth untuk Route Handler & Server Component (memakai cookies() dari next/headers).
// JANGAN import file ini dari middleware (pakai lib/session-config + getIronSession(req,res) di sana).
import { getIronSession, IronSession } from "iron-session";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { sessionOptions, SessionData } from "./session-config";

const SALT_ROUNDS = 10; // sesuai 07-CLAUDE.md

/** Ambil session di Route Handler / Server Component. */
export async function getSession(): Promise<IronSession<SessionData>> {
  // Next.js 14: cookies() sinkron. getIronSession menerima cookie store.
  return getIronSession<SessionData>(cookies(), sessionOptions);
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export type { SessionData };
