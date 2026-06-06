// lib/generate-code.ts
// Generate kode grup format JJ-XXXX (02-database-schema §3B). Exclude I,O,0,1 untuk hindari salah baca.
// Keunikan tetap dicek di DB (groupCode @unique) saat create.

export function generateGroupCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let suffix = "";
  for (let i = 0; i < 4; i++) suffix += chars[Math.floor(Math.random() * chars.length)];
  return `JJ-${suffix}`;
}
