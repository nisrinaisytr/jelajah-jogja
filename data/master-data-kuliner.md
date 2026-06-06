# Master Data Kuliner — Jelajah Jogja

Total: **20 tempat kuliner ikonik di Yogyakarta** dengan koordinat lengkap untuk pencarian terdekat di paket wisata.

**Fungsi**: Saat generate paket, sistem cari 2-3 kuliner terdekat (Haversine) dari itinerary harian, lalu masukkan ke section "Kuliner Rekomendasi" paket.

---

## Daftar 20 Kuliner Ikonik

| ID | Nama Tempat | Jenis | Alamat | Lat | Long | Harga (Rp) | Rating |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Gudeg Yu Djum Wijilan | Gudeg | Jl. Wijilan No.167, Yogyakarta | -7.8062 | 110.3692 | 25000 | 4.4 |
| 2 | Gudeg Pawon | Gudeg | Jl. Janturan No.36, Yogyakarta | -7.8147 | 110.3920 | 30000 | 4.5 |
| 3 | Sate Klathak Pak Pong | Sate | Jl. Stadion Sultan Agung, Bantul | -7.8794 | 110.3733 | 40000 | 4.5 |
| 4 | Bakmi Jawa Mbah Mo | Bakmi | Code, Trimulyo, Bantul | -7.8881 | 110.3431 | 25000 | 4.6 |
| 5 | Mangut Lele Mbah Marto | Olahan Lele | Jl. Sewon Indah, Bantul | -7.8542 | 110.3578 | 20000 | 4.5 |
| 6 | Bakpia Pathok 25 | Oleh-oleh Bakpia | Jl. AIP II KS Tubun NG I/504, Yogyakarta | -7.7942 | 110.3622 | 35000 | 4.4 |
| 7 | Ayam Goreng Mbok Berek | Ayam Goreng | Jl. Solo KM 9.5, Sleman | -7.7825 | 110.4292 | 35000 | 4.3 |
| 8 | Sate Kambing Pak Bari | Sate Kambing | Sosrowijayan, Yogyakarta | -7.7929 | 110.3653 | 45000 | 4.4 |
| 9 | Kopi Joss Lik Man | Kopi & Snack | Jl. Mangkubumi, Yogyakarta | -7.7872 | 110.3661 | 10000 | 4.5 |
| 10 | Soto Kadipiro | Soto Ayam | Jl. Wates KM 3, Yogyakarta | -7.8089 | 110.3389 | 18000 | 4.4 |
| 11 | Mie Ayam Tumini | Mie Ayam | Jl. Kusumanegara 96, Yogyakarta | -7.8050 | 110.3856 | 15000 | 4.5 |
| 12 | House of Raminten | Tradisional Modern | Jl. FM Noto No.7, Yogyakarta | -7.7728 | 110.3711 | 50000 | 4.4 |
| 13 | Jejamuran Resto | Jamur | Jl. Magelang KM 9.5, Sleman | -7.7339 | 110.3531 | 75000 | 4.5 |
| 14 | Sego Pecel Mbok Sador | Pecel | Jl. Mataram, Yogyakarta | -7.7900 | 110.3682 | 12000 | 4.3 |
| 15 | Bakmi Kadin | Bakmi | Jl. Bintaran Kulon 6, Yogyakarta | -7.8020 | 110.3742 | 28000 | 4.4 |
| 16 | Ayam Goreng Suharti | Ayam Goreng | Jl. Laksda Adisucipto KM 7, Sleman | -7.7800 | 110.4178 | 40000 | 4.5 |
| 17 | Sego Tempong Mbak Wati | Sego Tempong | Jl. Wates KM 4.5, Bantul | -7.8225 | 110.3194 | 18000 | 4.4 |
| 18 | Warung Bu Ageng | Tradisional Lengkap | Jl. Tirtodipuran 13, Yogyakarta | -7.8133 | 110.3669 | 55000 | 4.6 |
| 19 | Oseng Mercon Bu Narti | Pedas Ekstrem | Jl. KH Ahmad Dahlan, Yogyakarta | -7.8014 | 110.3636 | 22000 | 4.5 |
| 20 | Mangut Beong Sehati | Mangut Beong | Jl. Magelang-Yogya KM 24, Magelang | -7.6892 | 110.2856 | 35000 | 4.4 |

---

## Sebaran Kuliner per Wilayah

| Wilayah | Jumlah | Kuliner |
|---|---|---|
| **Kota Jogja (Malioboro & sekitarnya)** | 11 | Gudeg Yu Djum, Bakpia Pathok 25, Kopi Joss, Mie Ayam Tumini, House of Raminten, Sego Pecel, Bakmi Kadin, Warung Bu Ageng, Oseng Mercon, Sate Kambing Pak Bari, Sego Tempong |
| **Sleman (Utara)** | 4 | Ayam Goreng Mbok Berek, Jejamuran, Ayam Goreng Suharti, Gudeg Pawon |
| **Bantul (Selatan)** | 4 | Sate Klathak Pak Pong, Bakmi Mbah Mo, Mangut Lele Mbah Marto, Soto Kadipiro |
| **Magelang** | 1 | Mangut Beong Sehati (rute ke Borobudur) |

---

## Format JSON untuk Seed

Tambahan tabel **Kuliner** di Prisma:

```prisma
model Kuliner {
  id        Int      @id @default(autoincrement())
  nama      String   @db.VarChar(150)
  jenis     String   @db.VarChar(50)
  alamat    String   @db.VarChar(255)
  latitude  Float
  longitude Float
  hargaRataRata Int
  rating    Float
  imageUrl  String?  @db.Text
  createdAt DateTime @default(now())

  @@index([jenis])
}
```

```typescript
const kuliners = [
  {
    nama: "Gudeg Yu Djum Wijilan",
    jenis: "Gudeg",
    alamat: "Jl. Wijilan No.167, Yogyakarta",
    latitude: -7.8062,
    longitude: 110.3692,
    hargaRataRata: 25000,
    rating: 4.4
  },
  // ... 19 kuliner lainnya
];
await prisma.kuliner.createMany({ data: kuliners });
```

---

## Algoritma Pemilihan Kuliner di Paket

```typescript
function pilihKulinerTerdekat(
  destinasiHariIni: Destination[], 
  jumlahKuliner: number = 3
): Kuliner[] {
  // Hitung centroid (titik pusat) destinasi hari itu
  const centroidLat = avg(destinasiHariIni.map(d => d.latitude));
  const centroidLng = avg(destinasiHariIni.map(d => d.longitude));
  
  // Hitung jarak Haversine semua kuliner ke centroid
  const sortedKuliner = allKuliner.map(k => ({
    ...k,
    jarakKeCentroid: haversine(k.latitude, k.longitude, centroidLat, centroidLng)
  })).sort((a, b) => a.jarakKeCentroid - b.jarakKeCentroid);
  
  // Ambil top N + diversifikasi jenis (tidak semua gudeg)
  return diversifikasi(sortedKuliner, jumlahKuliner);
}
```
