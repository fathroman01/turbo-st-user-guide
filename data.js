export const initialData = {
  settings: {
    appName: "Portal Panduan",
    logo: "P"
  },
  apps: [
    {
      id: "turbo-st",
      name: "TURBO ST",
      icon: "monitor",
      pages: [
        {
          id: "beranda",
          title: "Beranda",
          icon: "home",
          description: "Selamat datang di panduan aplikasi Turbo ST.",
          content: `
            <p>Panduan Aplikasi Turbo ST dirancang untuk membantu Anda memahami fitur dan cara kerja aplikasi secara efisien.</p>
            <div class="img-container">
                <img src="dashboard.png" alt="Dashboard Turbo ST">
            </div>
          `
        },
        {
          id: "registrasi-mitra",
          title: "Registrasi Mitra",
          icon: "users",
          description: "Langkah-langkah untuk mendaftarkan mitra baru.",
          content: `<h2>Langkah Registrasi</h2><ol><li>Masuk ke menu Master Utility.</li></ol>`
        }
      ]
    },
    {
      id: "bakoel-st",
      name: "BAKOEL ST",
      icon: "smartphone",
      pages: [
        {
          id: "bakoel-beranda",
          title: "Beranda Bakoel",
          icon: "shopping-bag",
          description: "Selamat datang di panduan aplikasi Bakoel ST.",
          content: `<p>Mulai isi konten Bakoel ST di sini...</p>`
        }
      ]
    }
  ]
};
