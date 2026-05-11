import { useQuery } from '@tanstack/react-query';
import apiClient from '../services/apiClient';
import { ENDPOINTS } from '../services/endpoints';

export const useDashboardSummary = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: async () => {
      try {
        const response = await apiClient.get(ENDPOINTS.SUMMARY_REPORT);
        
        // Membongkar data dari Backend
        const summaryData = response.data?.data || response.data;
        
        // Kalau Backend berhasil mengirim data, kita pakai datanya
        if (summaryData && Object.keys(summaryData).length > 0) {
          return summaryData;
        }
        
        throw new Error("Data summary kosong");
      } catch (err) {
        console.warn("Gagal mengambil summary, menggunakan data fallback 0", err);
        // Sabuk Pengaman: Kalau API belum siap, kembalikan angka 0 agar UI tidak crash
        return {
          totalDevices: 0,
          onlineDevices: 0,
          offlineDevices: 0,
          criticalAlerts: 0,
          warningAlerts: 0,
          avgResponseTime: 0,
          networkUptime: 0
        };
      }
    },
    // Otomatis refresh data Dashboard setiap 30 detik
    refetchInterval: 30000, 
  });

  return { summary: data, loading: isLoading, error: error ? error.message : null };
};