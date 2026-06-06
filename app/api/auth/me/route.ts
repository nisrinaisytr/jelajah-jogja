// app/api/auth/me/route.ts
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSession();
    return NextResponse.json({ user: session.user ?? null });
  } catch (e) {
    console.error("me error:", e);
    return NextResponse.json({ user: null }, { status: 200 });
  }
}
