// app/api/auth/logout/route.ts
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

export async function POST() {
  try {
    const session = await getSession();
    session.destroy(); // hapus cookie session
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("logout error:", e);
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
}
