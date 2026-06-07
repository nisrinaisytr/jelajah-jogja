// app/(consumer)/profile/page.tsx
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import ProfileForm from "@/components/ProfileForm";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const session = await getSession();
  if (!session.user) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { email: true, role: true, nama: true, umur: true, gender: true, alamat: true, no_telp: true, kotaAsal: true },
  });
  if (!user) redirect("/login");

  return (
    <main className="mx-auto max-w-2xl px-6 py-8">
      <h1 className="mb-1 text-2xl font-extrabold text-slate-900">Profil Saya</h1>
      <p className="mb-6 text-sm text-slate-500">Kelola data diri & keamanan akun.</p>
      <ProfileForm user={user} />
    </main>
  );
}
