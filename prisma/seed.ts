// prisma/seed.ts
// Seed akun admin awal: Owner + Staff (Tahap 1).
// CATATAN: field umur/gender/alamat/no_telp/kotaAsal WAJIB (NOT NULL) di schema,
// padahal tidak dispesifikasikan. Diisi placeholder yang masuk akal -> silakan edit.
import "dotenv/config";
import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient({
  // Kita biarkan kosong, tapi kita pastikan env ter-load dengan benar di langkah ke-2
});
const SALT_ROUNDS = 10; // sesuai 07-CLAUDE.md

async function main() {
  const ownerPassword = await bcrypt.hash("owner123", SALT_ROUNDS);
  const staffPassword = await bcrypt.hash("staff123", SALT_ROUNDS);

  // Owner (idempotent: aman dijalankan ulang)
  await prisma.user.upsert({
    where: { email: "owner@jelajahjogja.com" },
    update: {},
    create: {
      email: "owner@jelajahjogja.com",
      password: ownerPassword,
      nama: "Pemilik Travel",
      umur: 40,                         // placeholder (FLAG-8)
      gender: "Laki-laki",             // standar penuh, bukan "L" (FLAG-5)
      alamat: "Jl. Malioboro No. 1, Yogyakarta",
      kotaAsal: "Yogyakarta",
      no_telp: "081200000001",         // placeholder (FLAG-8)
      role: Role.OWNER,
    },
  });

  // Staff
  await prisma.user.upsert({
    where: { email: "staff@jelajahjogja.com" },
    update: {},
    create: {
      email: "staff@jelajahjogja.com",
      password: staffPassword,
      nama: "Staff Operasional",
      umur: 25,
      gender: "Perempuan",
      alamat: "Jl. Kaliurang KM 5, Sleman, Yogyakarta",
      kotaAsal: "Yogyakarta",
      no_telp: "081200000002",
      role: Role.STAFF,
    },
  });

  console.log("Seed admin selesai: Owner + Staff dibuat.");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("Seed gagal:", e);
    await prisma.$disconnect();
    process.exit(1);
  });