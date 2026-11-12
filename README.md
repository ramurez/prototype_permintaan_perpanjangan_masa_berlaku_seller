# Prototype Perpanjangan Masa Berlaku Penawaran SPSE

Prototype statis HTML/CSS/JS untuk memvalidasi alur sisi Penyedia pada fitur perpanjangan masa berlaku penawaran. Seluruh data dan proses dalam prototype bersifat fiktif/simulasi.

## Menjalankan secara lokal

Buka `dist/index.html` langsung di browser, atau dari folder proyek jalankan:

```bash
python3 -m http.server 8080 --directory dist
```

Lalu buka `http://localhost:8080/`. Opsi `--directory dist` penting agar halaman utama terbuka, bukan directory listing.

## Skenario yang tersedia

- Halaman daftar tender menampilkan badge kuning **Permintaan Perpanjangan Masa Berlaku**, batas respons yang otomatis mengikuti akhir masa berlaku penawaran, dan link **Tinjau permintaan** di kolom status.
- Tombol pada daftar membuka detail tender dan langsung mengarahkan Penyedia ke bagian permintaan perpanjangan.
- Permintaan menjadi satu tabel dengan **Dokumen Penawaran**, dipisahkan oleh border dan header kuning tipis agar tetap sederhana seperti komponen native SPSE.
- Detail mempertahankan informasi **90 Hari Kalender** dari pola SPSE dan menambahkan tanggal **Berakhir efektif** agar tidak ambigu.
- Pokja hanya mengirim permintaan; tidak ada parameter target atau saran tanggal dari Pokja.
- Terima permintaan → Penyedia memilih tanggal masa berlaku baru → memperbarui jaminan penawaran jika diperlukan → review surat penawaran → tanda tangan elektronik mock → tanggal baru aktif dan status **Berhasil**.
- Masa berlaku lama tetap aktif apabila alur berhenti sebelum e-sign dan tetap disimpan dalam riwayat setelah tanggal baru aktif.
- Langkah pembaruan jaminan mengikuti pola tabel **Dokumen Administrasi** SPSE: nama dokumen, metadata file, tombol **Tambah**, dan hapus dokumen.
- Pembaruan jaminan penawaran bersifat opsional. Penyedia dapat melanjutkan tanpa mengunggah dokumen baru; dalam kondisi tersebut dokumen lama tidak diubah.
- Tolak permintaan → alasan wajib → timestamp, riwayat, dan notifikasi Pokja mock.
- Kontrol demo untuk **Tidak Direspons**, **Tidak Selesai**, **Berhasil**, dan **Ditolak**.
- Riwayat, notifikasi dalam aplikasi, serta permintaan ulang yang baru aktif setelah state terminal.

## Catatan

- Tidak ada UI Pokja dalam prototype.
- Tidak ada data atau tanda tangan elektronik nyata yang diproses.
- Teks konsekuensi hukum sengaja dibuat netral karena masih menunggu validasi Policy.
