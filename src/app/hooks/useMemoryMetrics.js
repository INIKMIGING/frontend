import { useQuery } from '@tanstack/react-query';
import apiClient from '../services/apiClient';
import { ENDPOINTS } from '../services/endpoints';

export const useMemoryMetrics = (timePreset = '24h', customDate = '') => {
  const { data = [], isLoading, error, refetch } = useQuery({
    queryKey: ['memory-metrics-real', timePreset, customDate],
    queryFn: async () => {
      try {
        const hostsResponse = await apiClient.get(ENDPOINTS.HOSTS);
        let allHosts = Array.isArray(hostsResponse.data) ? hostsResponse.data : (hostsResponse.data?.data || []);

        const memoryPromises = allHosts.map(async (host) => {
          try {
            const itemsResponse = await apiClient.get(ENDPOINTS.ITEMS_BY_HOST(host.id));
            let items = Array.isArray(itemsResponse.data) ? itemsResponse.data : (itemsResponse.data?.data || []);

            // =========================================================
            // 1. CARI SENSOR MEMORY (PRIORITAS & ANTI-RESERVE)
            // =========================================================
            let memSensor = items.find(item => item.key_ === 'vm.memory.util[vm.memory.util.1]');
            
            if (!memSensor) {
              memSensor = items.find(item => {
                if (!item.key_) return false;
                
                const keyLow = item.key_.toLowerCase();
                const nameLow = item.name ? item.name.toLowerCase() : '';

                const isMemory = keyLow.includes('vm.memory.util');
                const isReserve = keyLow.includes('reserve') || nameLow.includes('reserve') || 
                                  keyLow.includes('i/o') || nameLow.includes('i/o'); 
                
                return isMemory && !isReserve;
              });
            }
            
            if (!memSensor) return null;

            // =========================================================
            // 2. LOGIKA WAKTU DINAMIS
            // =========================================================
            let start, end;
            if (customDate) {
              const [y, m, d] = customDate.split('-').map(Number);
              start = new Date(y, m - 1, d, 0, 0, 0); 
              end = new Date(y, m - 1, d, 23, 59, 59); 
            } else {
              end = new Date();
              start = new Date();
              if (timePreset === '1h') start.setHours(end.getHours() - 1);
              else if (timePreset === '6h') start.setHours(end.getHours() - 6);
              else start.setHours(end.getHours() - 24);
            }

            const formatAPI = (d) => d.toISOString().substring(0, 19); 
            const startDate = formatAPI(start);
            const endDate = formatAPI(end);

            // =========================================================
            // 3. TARIK HISTORY MEMORY
            // =========================================================
            const memId = memSensor.id || memSensor.itemid;
            const historyRes = await apiClient.get(`${ENDPOINTS.ITEM_HISTORY(memId)}?start_date=${startDate}&end_date=${endDate}`);
            
            let historyData = Array.isArray(historyRes.data) ? historyRes.data : (historyRes.data?.data || []);

            // =========================================================
            // 4. SAFETY NET & UNKNOWN LOGIC (KOSONG = UNKNOWN)
            // =========================================================
            if (historyData.length === 0) {
              return {
                deviceId: host.id,
                deviceName: host.visible_name || host.host,
                deviceType: "Cisco Catalyst",
                location: host.location || "Unknown",
                ipAddress: host.ip_address || "-",
                usage: 0, 
                status: 'unknown', // History kosong = Unknown
                lastUpdate: '-',
                history: [], 
              };
            }

            const realHistory = historyData.map(data => {
              let timeStr = String(data.clock);
              
              if (!isNaN(timeStr) && timeStr.length === 10) {
                timeStr = new Date(Number(timeStr) * 1000).toISOString();
              } else if (!timeStr.endsWith('Z') && !timeStr.includes('+')) {
                timeStr = timeStr.replace(' ', 'T') + 'Z'; 
              }

              return {
                timestamp: timeStr, 
                rawTime: timeStr,   
                usage: Math.round(data.value_numeric * 100) / 100 
              };
            });

            const latestUsage = realHistory.length > 0 ? realHistory[realHistory.length - 1].usage : 0;
            const lastUpdateClock = realHistory.length > 0 ? realHistory[realHistory.length - 1].rawTime : null;

            // =========================================================
            // UPDATE LOGIKA STATUS (0% = ERROR/UNKNOWN)
            // =========================================================
            let status = 'normal';
            if (latestUsage === 0) status = 'unknown'; // RAM 0% itu mustahil, pasti error sensor
            else if (latestUsage >= 85) status = 'critical';
            else if (latestUsage >= 50) status = 'warning';

            return {
              deviceId: host.id,
              deviceName: host.visible_name || host.host,
              deviceType: "Cisco Catalyst",
              location: host.location || "Unknown",
              ipAddress: host.ip_address || "-",
              usage: latestUsage,
              status: status,
              lastUpdate: lastUpdateClock ? new Date(lastUpdateClock).toLocaleString('id-ID') : '-',
              history: realHistory,
            };
          } catch (err) {
            console.warn(`Gagal memproses memory untuk host ${host.id}:`, err);
            return null;
          }
        });

        const results = await Promise.all(memoryPromises);
        return results.filter(item => item !== null);

      } catch (err) {
        console.error("Gagal mengambil data keseluruhan memory:", err);
        return [];
      }
    },
    refetchInterval: 60000, 
  });

  return { metrics: data, loading: isLoading, error: error ? error.message : null, refreshManual: refetch };
};