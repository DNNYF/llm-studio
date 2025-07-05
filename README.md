# Proyek Chatbot dengan Konfigurasi LLM

Selamat datang di proyek Chatbot & LLM Config Manager. Aplikasi ini adalah aplikasi web Next.js yang menyediakan antarmuka chat dengan AI (menggunakan API Heroku kustom) dan dasbor admin untuk mengonfigurasi parameter model bahasa (LLM).

## Daftar Isi

- [Fitur Utama](#fitur-utama)
- [Teknologi yang Digunakan](#teknologi-yang-digunakan)
- [Prasyarat](#prasyarat)
- [Konfigurasi Proyek](#konfigurasi-proyek)
- [Instalasi & Menjalankan Proyek](#instalasi--menjalankan-proyek)
- [Struktur Proyek](#struktur-proyek)
- [Cara Kerja Aplikasi](#cara-kerja-aplikasi)
- [Akses Admin](#akses-admin)

---

### Fitur Utama

- **Antarmuka Chat Interaktif**: Pengguna dapat berinteraksi dengan chatbot AI yang didukung oleh model dari API Heroku kustom Anda.
- **Histori Percakapan**: Semua percakapan disimpan secara lokal di peramban, memungkinkan pengguna untuk melanjutkan percakapan sebelumnya.
- **Dasbor Admin yang Dilindungi**: Halaman admin terpisah untuk mengelola dan menyesuaikan perilaku LLM, dilindungi oleh autentikasi database.
- **Konfigurasi LLM Dinamis**: Admin dapat mengubah parameter seperti *system prompt*, *temperature*, *top-k*, *top-p*, dan lainnya secara langsung dari antarmuka.
- **Desain Responsif**: Dibuat dengan komponen ShadCN UI dan Tailwind CSS untuk pengalaman yang baik di desktop dan perangkat seluler.

### Teknologi yang Digunakan

- **Framework**: Next.js (App Router)
- **Bahasa**: TypeScript
- **Styling**: Tailwind CSS & ShadCN UI
- **AI & Backend**: API kustom yang di-host di Heroku (atau platform lain)
- **Database**: PostgreSQL (untuk autentikasi)
- **Manajemen Form**: React Hook Form & Zod
- **Animasi**: Framer Motion

### Prasyarat

- [Node.js](https://nodejs.org/) (versi 20 atau lebih tinggi direkomendasikan)
- [npm](https://www.npmjs.com/) (biasanya terinstal bersama Node.js)
- URL API LLM Anda sendiri yang di-host di Heroku atau platform lain.
- Akses ke database PostgreSQL.

---

### Konfigurasi Proyek

Sebelum menjalankan aplikasi, Anda perlu mengatur beberapa variabel lingkungan.

1.  **Buat file `.env`**:
    Di direktori utama proyek, buat file baru bernama `.env` dengan menyalin dari `.env.example`.

2.  **Konfigurasi URL API Heroku**:
    -   Tambahkan baris berikut ke dalam file `.env`, ganti nilainya dengan URL API LLM Anda.
    ```bash
    HEROKU_API_URL=https://your-custom-api-url.com/v1/chat/completions
    ```
    -   Logika untuk memanggil API ini ada di `src/ai/flows/chat.ts`.

3.  **Konfigurasi Database (PostgreSQL)**:
    -   Aplikasi ini menggunakan database PostgreSQL untuk autentikasi admin.
    -   Tambahkan `DATABASE_URL` ke file `.env` Anda. Formatnya adalah `postgres://USER:PASSWORD@HOST:PORT/DATABASE`.
    ```bash
    DATABASE_URL="postgres://user:password@host:port/database"
    ```
    -   Pastikan Anda memiliki tabel `users` dengan skema berikut:
        ```sql
        CREATE TABLE users (
            id SERIAL PRIMARY KEY,
            username VARCHAR(255) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL
        );
        ```
    -   Masukkan data admin awal Anda. Contoh:
        ```sql
        INSERT INTO users (username, password) VALUES ('admin@gmail.com', '123');
        ```

---

### Instalasi & Menjalankan Proyek

1.  **Clone Repositori** (jika berlaku).

2.  **Instal Dependensi**:
    ```bash
    npm install
    ```

3.  **Konfigurasi Environment Variables**:
    Ikuti langkah-langkah di [Konfigurasi Proyek](#konfigurasi-proyek) di atas.

4.  **Jalankan Server Pengembangan**:
    ```bash
    npm run dev
    ```
    Aplikasi akan tersedia di [http://localhost:9002](http://localhost:9002).

### Struktur Proyek

```
.
├── src/
│   ├── app/
│   │   ├── chat/         # Halaman chat untuk pengguna
│   │   ├── admin/        # Halaman admin (dilindungi login)
│   │   ├── login/        # Halaman login untuk admin
│   │   ├── layout.tsx
│   │   └── page.tsx      # Halaman utama (mengarahkan ke /chat)
│   │
│   ├── ai/
│   │   └── flows/
│   │       └── chat.ts   # Logika inti untuk memanggil API LLM
│   │
│   ├── components/       # Komponen React
│   │
│   ├── lib/
│   │   ├── db.ts         # Konfigurasi koneksi database
│   │   ├── schemas.ts
│   │   └── utils.ts
│   │
│   └── middleware.ts     # Middleware untuk melindungi rute /admin
│
├── .env                  # File environment variable
├── .env.example          # Contoh file environment variable
├── package.json
└── tailwind.config.ts
```

### Cara Kerja Aplikasi

- **Halaman Admin (`/admin`)**:
  - Admin login melalui halaman `/login` menggunakan kredensial dari database.
  - Setelah berhasil, mereka dapat mengakses dasbor di `/admin` untuk mengubah parameter LLM.
  - Konfigurasi disimpan di database PostgreSQL.

- **Halaman Chat (`/chat`)**:
  - Dapat diakses oleh semua pengguna tanpa login.
  - Aplikasi mengirim permintaan `fetch` ke `HEROKU_API_URL` dengan menyertakan pesan pengguna, riwayat percakapan, dan parameter yang diambil dari konfigurasi aktif di database.
  - Riwayat percakapan disimpan dan diambil dari `localStorage`.

### Akses Admin

Untuk mengakses dasbor admin, gunakan kredensial yang tersimpan di database PostgreSQL Anda. Jika Anda mengikuti panduan penyiapan, kredensialnya adalah:

- **Email**: `admin@gmail.com`
- **Password**: `123`
