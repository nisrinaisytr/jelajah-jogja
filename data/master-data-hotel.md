# Master Data Hotel — Jelajah Jogja

Total: **32 hotel real di Yogyakarta**, dibagi 3 tier untuk auto-generate paket Hemat/Standard/Premium.

**Cara pakai**: Data ini akan di-seed ke tabel `Hotel` via `prisma/seed.ts`. Foto disimpan di `/public/images/lodging/<slug>.jpg`.

**Sumber data**: Booking.com, Traveloka, Google Maps (per Juni 2026, harga estimasi non-peak season).

---

## TIER PREMIUM (10 hotel, Rp 800rb - 3jt/malam)

Hotel bintang 4-5 dengan fasilitas lengkap. Cocok untuk variant paket Premium.

| ID | Nama Hotel | Alamat | Wilayah | Lat | Long | Rating | Harga/Malam | Fasilitas | Image |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Hotel Tugu Yogyakarta | Jl. Margo Utomo 2, Yogyakarta | Kota | -7.7873 | 110.3658 | 4.6 | 1850000 | WiFi, AC, Sarapan, Pool, Restoran, Spa, Parkir | hotel-tugu.jpg |
| 2 | Royal Ambarrukmo | Jl. Laksda Adisucipto 81, Yogyakarta | Sleman | -7.7825 | 110.4011 | 4.7 | 2100000 | WiFi, AC, Sarapan, Pool, Restoran, Spa, Gym, Parkir | royal-ambarrukmo.jpg |
| 3 | The Phoenix Hotel Yogyakarta | Jl. Jenderal Sudirman 9, Yogyakarta | Kota | -7.7847 | 110.3678 | 4.7 | 1750000 | WiFi, AC, Sarapan, Pool, Restoran, Spa, Gym, Bar | phoenix-yogyakarta.jpg |
| 4 | Melia Purosani | Jl. Suryotomo 31, Yogyakarta | Kota | -7.7994 | 110.3722 | 4.6 | 1450000 | WiFi, AC, Sarapan, Pool, Restoran, Gym, Parkir | melia-purosani.jpg |
| 5 | Plataran Heritage Borobudur | Jl. Borobudur, Magelang | Magelang | -7.6079 | 110.2032 | 4.8 | 2850000 | WiFi, AC, Sarapan, Pool, Restoran, Spa, View Borobudur | plataran-borobudur.jpg |
| 6 | Hotel Indies Heritage Prawirotaman | Jl. Prawirotaman 3, Yogyakarta | Kota | -7.8160 | 110.3686 | 4.6 | 980000 | WiFi, AC, Sarapan, Pool, Restoran, Heritage Style | indies-heritage.jpg |
| 7 | Greenhost Boutique Hotel | Jl. Prawirotaman II 629, Yogyakarta | Kota | -7.8175 | 110.3694 | 4.5 | 850000 | WiFi, AC, Sarapan, Pool, Resto Vegan, Galeri Seni | greenhost-boutique.jpg |
| 8 | Hyatt Regency Yogyakarta | Jl. Palagan Tentara Pelajar, Sleman | Sleman | -7.7367 | 110.3550 | 4.6 | 1650000 | WiFi, AC, Sarapan, Pool, Restoran, Spa, Gym, Golf | hyatt-regency.jpg |
| 9 | Sheraton Mustika Yogyakarta | Jl. Laksda Adisucipto KM 8.7, Sleman | Sleman | -7.7805 | 110.4197 | 4.5 | 1380000 | WiFi, AC, Sarapan, Pool, Restoran, Spa, Gym | sheraton-mustika.jpg |
| 10 | Grand Inna Malioboro | Jl. Malioboro 60, Yogyakarta | Kota | -7.7929 | 110.3658 | 4.4 | 880000 | WiFi, AC, Sarapan, Pool, Restoran, View Malioboro | grand-inna-malioboro.jpg |

## TIER STANDARD (12 hotel, Rp 300rb - 800rb/malam)

Hotel bintang 3 dengan fasilitas standar lengkap. Untuk variant paket Standard.

| ID | Nama Hotel | Alamat | Wilayah | Lat | Long | Rating | Harga/Malam | Fasilitas | Image |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 11 | Neo+ Awana Yogyakarta | Jl. Mataram 53, Yogyakarta | Kota | -7.7902 | 110.3686 | 4.4 | 480000 | WiFi, AC, Sarapan, Pool, Restoran, Parkir | neo-awana.jpg |
| 12 | favehotel Malioboro | Jl. Sosrowijayan 27, Yogyakarta | Kota | -7.7921 | 110.3651 | 4.3 | 420000 | WiFi, AC, Sarapan, Restoran, Parkir | favehotel-malioboro.jpg |
| 13 | Tara Hotel Yogyakarta | Jl. Magelang KM 5, Sleman | Sleman | -7.7531 | 110.3611 | 4.4 | 550000 | WiFi, AC, Sarapan, Pool, Restoran, Gym | tara-hotel.jpg |
| 14 | Cordela Hotel Senopati | Jl. Senopati 27, Yogyakarta | Kota | -7.8024 | 110.3669 | 4.3 | 480000 | WiFi, AC, Sarapan, Restoran, Parkir | cordela-senopati.jpg |
| 15 | Hotel Dafam Fortuna Malioboro | Jl. Dagen 60, Yogyakarta | Kota | -7.7919 | 110.3654 | 4.3 | 520000 | WiFi, AC, Sarapan, Pool, Restoran | dafam-fortuna.jpg |
| 16 | Pesonna Hotel Tugu Yogyakarta | Jl. Gandekan Lor 28, Yogyakarta | Kota | -7.7886 | 110.3614 | 4.4 | 450000 | WiFi, AC, Sarapan, Restoran, Parkir | pesonna-tugu.jpg |
| 17 | Whiz Prime Hotel Malioboro | Jl. Dagen 16, Yogyakarta | Kota | -7.7916 | 110.3652 | 4.3 | 380000 | WiFi, AC, Sarapan, Restoran, Parkir | whiz-prime.jpg |
| 18 | Adhisthana Hotel Yogyakarta | Jl. Prawirotaman II 613, Yogyakarta | Kota | -7.8171 | 110.3700 | 4.5 | 590000 | WiFi, AC, Sarapan, Pool, Restoran, Sepeda Gratis | adhisthana.jpg |
| 19 | Eastparc Hotel Yogyakarta | Jl. Laksda Adisucipto KM 6.5, Sleman | Sleman | -7.7792 | 110.4136 | 4.5 | 720000 | WiFi, AC, Sarapan, Pool, Restoran, Gym | eastparc.jpg |
| 20 | Grand Rohan Jogja | Jl. Janti, Bantul | Bantul | -7.7853 | 110.4061 | 4.3 | 520000 | WiFi, AC, Sarapan, Pool, Restoran, Parkir | grand-rohan.jpg |
| 21 | Jogjakarta Plaza Hotel | Jl. Affandi, Sleman | Sleman | -7.7569 | 110.3892 | 4.3 | 580000 | WiFi, AC, Sarapan, Pool, Restoran, Gym | jogjakarta-plaza.jpg |
| 22 | Atrium Premiere Yogyakarta | Jl. Lingkar Selatan, Bantul | Bantul | -7.8316 | 110.3553 | 4.2 | 420000 | WiFi, AC, Sarapan, Pool, Restoran | atrium-premiere.jpg |

## TIER BUDGET (10 hotel, Rp 120rb - 300rb/malam)

Guesthouse dan hotel ekonomis. Untuk variant paket Hemat.

| ID | Nama Hotel | Alamat | Wilayah | Lat | Long | Rating | Harga/Malam | Fasilitas | Image |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 23 | RedDoorz near Malioboro | Jl. Pajeksan 35, Yogyakarta | Kota | -7.7924 | 110.3636 | 4.0 | 180000 | WiFi, AC, Sarapan | reddoorz-malioboro.jpg |
| 24 | OYO 89422 Hotel Sumaryo | Jl. Mangkuyudan 32, Yogyakarta | Kota | -7.8089 | 110.3580 | 4.0 | 165000 | WiFi, AC | oyo-sumaryo.jpg |
| 25 | Edu Hostel Jogja | Jl. Letjen Suprapto 17, Yogyakarta | Kota | -7.7997 | 110.3603 | 4.4 | 220000 | WiFi, AC, Sarapan, Pool, Cafe | edu-hostel.jpg |
| 26 | Pop! Hotel Malioboro | Jl. Gandekan Lor 28, Yogyakarta | Kota | -7.7891 | 110.3618 | 4.2 | 280000 | WiFi, AC, Sarapan, Restoran | pop-malioboro.jpg |
| 27 | Hotel Tilamas | Jl. Prawirotaman MG III, Yogyakarta | Kota | -7.8167 | 110.3686 | 4.1 | 240000 | WiFi, AC, Sarapan, Parkir | tilamas.jpg |
| 28 | Penginapan Bladok | Jl. Sosrowijayan 76, Yogyakarta | Kota | -7.7925 | 110.3640 | 4.0 | 150000 | WiFi, AC, Sarapan | bladok.jpg |
| 29 | Sky Inn Sosrowijayan | Jl. Sosrowijayan 9, Yogyakarta | Kota | -7.7919 | 110.3658 | 4.1 | 160000 | WiFi, AC, Sarapan | sky-inn.jpg |
| 30 | Penginapan Borobudur Bed & Breakfast | Jl. Borobudur, Magelang | Magelang | -7.6082 | 110.2049 | 4.3 | 200000 | WiFi, AC, Sarapan, View Sawah | borobudur-bnb.jpg |
| 31 | Homestay Tembi | Desa Tembi, Bantul | Bantul | -7.8689 | 110.3328 | 4.4 | 175000 | WiFi, Sarapan, Pengalaman Budaya | homestay-tembi.jpg |
| 32 | Backpacker Lodge Prawirotaman | Jl. Prawirotaman 38, Yogyakarta | Kota | -7.8162 | 110.3691 | 4.2 | 130000 | WiFi, AC Dorm, Sarapan, Cafe | backpacker-lodge.jpg |

---

## Format JSON untuk Seed (`prisma/seed.ts`)

```typescript
const hotels = [
  {
    nama: "Hotel Tugu Yogyakarta",
    alamat: "Jl. Margo Utomo 2, Yogyakarta",
    wilayah: "Kota",
    latitude: -7.7873,
    longitude: 110.3658,
    rating: 4.6,
    hargaPerMalam: 1850000,
    fasilitas: JSON.stringify(["WiFi","AC","Sarapan","Pool","Restoran","Spa","Parkir"]),
    imageUrl: "/images/lodging/hotel-tugu.jpg",
    tier: "PREMIUM"
  },
  // ... 31 hotel lainnya
];

await prisma.hotel.createMany({ data: hotels });
```

---

## Catatan untuk Programmer

1. **Folder foto**: Simpan 32 foto hotel di `public/images/lodging/` dengan nama persis sesuai kolom `Image`.
2. **Wilayah**: Mostly "Kota" (Malioboro/Prawirotaman) + "Sleman" + sedikit "Bantul" & "Magelang". Cover area utama tour Jogja.
3. **Koordinat**: Sudah diverifikasi di Google Maps (per Juni 2026).
4. **Algoritma proximity**: Saat auto-generate paket, sistem hitung centroid Top N destinasi grup, lalu cari hotel terdekat dengan tier yang match variant paket.
