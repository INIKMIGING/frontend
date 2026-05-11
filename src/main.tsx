import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './app/App';

// Mengimpor semua file CSS sesuai dengan struktur folder kamu
import './styles/tailwind.css';
import './styles/fonts.css';
import './styles/theme.css';
import './styles/index.css';

// 1. Inisialisasi TanStack Query Client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Mencegah API nembak ulang secara otomatis cuma karena kamu pindah/buka tab browser lain
      refetchOnWindowFocus: false, 
      
      // Kalau nembak API gagal (misal koneksi goyang), dia akan coba lagi otomatis 1 kali
      retry: 1, 
      
      // Catatan: Untuk refetchInterval (refresh tiap 2-3 menit), 
      // lebih baik diatur di masing-masing file Hooks saja seperti yang kita bahas sebelumnya.
    },
  },
});

// 2. Render Aplikasi Utama
ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    {/* Membungkus seluruh aplikasi dengan Provider TanStack Query */}
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>
);