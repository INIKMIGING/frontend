import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../services/apiClient';
import { ENDPOINTS } from '../services/endpoints';

export const useDevices = () => {
  const queryClient = useQueryClient();

  // 1. Fungsi GET: Mengambil Data Perangkat
  const { data = [], isLoading, error } = useQuery({
    queryKey: ['devices-real'],
    queryFn: async () => {
      try {
        const response = await apiClient.get(ENDPOINTS.HOSTS);
        
        let hosts = [];
        if (Array.isArray(response.data)) hosts = response.data;
        else if (response.data?.data) hosts = response.data.data;

        return hosts.map(host => ({
          id: host.id,
          name: host.visible_name || host.host,
          type: 'Cisco Catalyst', // Placeholder untuk tipe
          location: host.location || 'Unknown',
          ip: host.ip_address || '-', // IP Asli dari database
          status: 'online', // Statis sementara sebelum digabung ping
          lastSeen: host.created_at || new Date().toISOString()
        }));
      } catch (err) {
        console.error("Gagal mengambil data perangkat:", err);
        return []; // Sabuk pengaman agar tidak layar putih
      }
    }
  });

// 2. Fungsi PUT: Menyimpan Edit Lokasi ke Database
  const updateLocationMutation = useMutation({
    mutationFn: async ({ hostId, newLocation }) => {
      // PERUBAHAN DI SINI:
      // Kita kirim 'location' sebagai params (URL Query), BUKAN sebagai body JSON.
      // Axios akan otomatis membuat URL-nya menjadi: /api/hosts/{id}/location?location=NamaLokasi
      const response = await apiClient.put(ENDPOINTS.UPDATE_LOCATION(hostId), null, {
        params: {
          location: newLocation
        }
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devices-real'] });
    },
    onError: (err) => {
      console.error("Gagal update lokasi:", err);
      alert("Gagal menyimpan lokasi ke database.");
    }
  });

  // Jembatan untuk dipanggil oleh tombol di UI
  const updateLocation = async (hostId, newLocation) => {
    await updateLocationMutation.mutateAsync({ hostId, newLocation });
  };

  return { 
    devices: data, 
    loading: isLoading, 
    error: error ? error.message : null,
    updateLocation 
  };
};