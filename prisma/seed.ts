// prisma/seed.ts
// Seed lengkap Jelajah Jogja (TAHAP 1):
//   - 2 akun admin (Owner + Staff)  -> upsert (idempotent)
//   - 75 Destination + 3000 DestinationScore (parse master-database-lengkap.md)
//   - 32 Hotel (parse master-data-hotel.md)
//   - 20 Kuliner (parse master-data-kuliner.md)
// File data dibaca dari folder ./data di root project.
import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import path from "path";
import { parseDestinations, parseScores, parseHotels, parseKuliner } from "./seed-helpers";

const prisma = new PrismaClient();
const SALT_ROUNDS = 10; // sesuai 07-CLAUDE.md
const DATA_DIR = path.join(process.cwd(), "data");

// ---------- 1. Admin (Owner + Staff) ----------
async function seedAdmins() {
  const ownerPassword = await bcrypt.hash("owner123", SALT_ROUNDS);
  const staffPassword = await bcrypt.hash("staff123", SALT_ROUNDS);

  await prisma.user.upsert({
    where: { email: "owner@jelajahjogja.com" },
    update: {},
    create: {
      email: "owner@jelajahjogja.com",
      password: ownerPassword,
      nama: "Pemilik Travel",
      umur: 40,
      gender: "Laki-laki",
      alamat: "Jl. Malioboro No. 1, Yogyakarta",
      kotaAsal: "Yogyakarta",
      no_telp: "081200000001",
      role: Role.OWNER,
    },
  });

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
  console.log("✓ Admin (Owner + Staff) siap.");
}

// ---------- 2. Hotel ----------
async function seedHotels() {
  if ((await prisma.hotel.count()) > 0) {
    console.log("• Hotel sudah ada, skip.");
    return;
  }
  const hotels = parseHotels(DATA_DIR);
  await prisma.hotel.createMany({ data: hotels as any });
  console.log(`✓ Seed ${hotels.length} hotel.`);
}

// ---------- 3. Kuliner ----------
async function seedKuliner() {
  if ((await prisma.kuliner.count()) > 0) {
    console.log("• Kuliner sudah ada, skip.");
    return;
  }
  const kuliner = parseKuliner(DATA_DIR);
  await prisma.kuliner.createMany({ data: kuliner as any });
  console.log(`✓ Seed ${kuliner.length} kuliner.`);
}

// ---------- 4. Destinasi + Skor TOPSIS ----------
async function seedDestinations() {
  if ((await prisma.destination.count()) > 0) {
    console.log("• Destinasi sudah ada, skip.");
    return;
  }
  const dests = parseDestinations(DATA_DIR);
  const scores = parseScores(DATA_DIR);

  // create destinasi satu per satu untuk menangkap id auto-increment -> map dari kode "DST-XX"
  const codeToId = new Map<string, number>();
  for (const d of dests) {
    const { code, ...data } = d;
    const created = await prisma.destination.create({ data: data as any });
    codeToId.set(code, created.id);
  }

  // bangun 3000 baris skor, lalu createMany per-chunk
  const scoreRows = scores.map((s) => ({
    destinationId: codeToId.get(s.destCode)!,
    kriteriaKey: s.kriteriaKey,
    subCriteriaKey: s.subCriteriaKey,
    scoreValue: s.scoreValue,
  }));
  const CHUNK = 1000;
  for (let i = 0; i < scoreRows.length; i += CHUNK) {
    await prisma.destinationScore.createMany({ data: scoreRows.slice(i, i + CHUNK) });
  }
  console.log(`✓ Seed ${dests.length} destinasi + ${scoreRows.length} skor TOPSIS.`);
}

async function main() {
  console.log("=== SEED JELAJAH JOGJA (v4) ===");
  await seedAdmins();
  await seedHotels();
  await seedKuliner();
  await seedDestinations();
  console.log("✅ Seed selesai.");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("❌ Seed gagal:", e);
    await prisma.$disconnect();
    process.exit(1);
  });