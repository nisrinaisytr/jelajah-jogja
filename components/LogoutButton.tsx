// components/LogoutButton.tsx
"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LogoutButton({ redirectTo = "/login" }: { redirectTo?: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push(redirectTo);
    router.refresh();
  }

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      className="rounded-xl bg-[#FF5E1F] px-4 py-2 font-semibold text-white shadow-sm transition hover:shadow-md disabled:opacity-60"
    >
      {loading ? "Keluar..." : "Keluar"}
    </button>
  );
}
