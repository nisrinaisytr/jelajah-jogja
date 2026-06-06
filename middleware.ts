// middleware.ts (ROOT project, sejajar package.json)
// RBAC route guard sesuai 02-database-schema §3E:
//  - /admin/*           -> OWNER atau STAFF
//  - /admin/branch,/staff -> OWNER ONLY
//  - rute konsumen      -> LEADER atau MEMBER
//  - konsumen akses /admin/* -> redirect ke /
import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { sessionOptions, SessionData } from "@/lib/session-config";

const OWNER_ONLY = ["/admin/branch", "/admin/staff"];
const CONSUMER_PREFIXES = [
  "/home", "/profile", "/create-group", "/join-group", "/survey", "/waiting-room", "/results",
];

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const session = await getIronSession<SessionData>(req, res, sessionOptions);
  const user = session.user;
  const { pathname } = req.nextUrl;

  // ===== AREA ADMIN (/admin/*) =====
  if (pathname.startsWith("/admin")) {
    if (!user) return NextResponse.redirect(new URL("/admin-login", req.url));
    // konsumen (LEADER/MEMBER) tidak boleh masuk admin -> redirect ke beranda publik
    if (user.role !== "OWNER" && user.role !== "STAFF") {
      return NextResponse.redirect(new URL("/", req.url));
    }
    // halaman Owner-only
    if (OWNER_ONLY.some((p) => pathname.startsWith(p)) && user.role !== "OWNER") {
      return NextResponse.redirect(new URL("/admin/dashboard", req.url));
    }
    return res;
  }

  // ===== AREA KONSUMEN =====
  if (CONSUMER_PREFIXES.some((p) => pathname.startsWith(p))) {
    if (!user) return NextResponse.redirect(new URL("/login", req.url));
    // admin (OWNER/STAFF) diarahkan ke dashboard admin
    if (user.role === "OWNER" || user.role === "STAFF") {
      return NextResponse.redirect(new URL("/admin/dashboard", req.url));
    }
    return res;
  }

  return res;
}

// Hanya jalankan middleware di rute terproteksi (rute publik seperti /login, /register,
// /admin-login, /eksplorasi TIDAK dijaga). Catatan: /admin-login TIDAK match "/admin/:path*".
export const config = {
  matcher: [
    "/admin/:path*",
    "/home/:path*",
    "/profile/:path*",
    "/create-group/:path*",
    "/join-group/:path*",
    "/survey/:path*",
    "/waiting-room/:path*",
    "/results/:path*",
  ],
};
