import { useQuery } from '@tanstack/react-query';
import apiClient from '../services/apiClient';
import { ENDPOINTS } from '../services/endpoints';

export const useCPUMetrics = (timePreset = '24h', customDate = '') => {
  const { data = [], isLoading, error, refetch } = useQuery({
    queryKey: ['cpu-metrics-real', timePreset, customDate],
    queryFn: async () => {
      try {
        const hostsResponse = await apiClient.get(ENDPOINTS.HOSTS);
        let allHosts = [];
        if (Array.isArray(hostsResponse.data)) allHosts = hostsResponse.data;
        else if (hostsResponse.data?.data) allHosts = hostsResponse.data.data;

        const cpuPromises = allHosts.map(async (host) => {
          try {
            const itemsResponse = await apiClient.get(ENDPOINTS.ITEMS_BY_HOST(host.id));
            let items = [];
            if (Array.isArray(itemsResponse.data)) items = itemsResponse.data;
            else if (itemsResponse.data?.data) items = itemsResponse.data.data;

            const cpuSensor = items.find(item => 
              item.key_ === 'system.cpu.util[cpmCPUTotal5minRev.12]' || 
              item.key_.includes('cpu.util')
            );
            
            if (!cpuSensor) return null;

            let start, end;
            
            if (customDate) {
              const selected = new Date(customDate);
              start = new Date(selected.setHours(0, 0, 0, 0));
              end = new Date(selected.setHours(23, 59, 59, 999));
            } else {
              end = new Date();
              start = new Date();
              if (timePreset === '1h') {
                start.setHours(end.getHours() - 1);
              } else if (timePreset === '6h') {
                start.setHours(end.getHours() - 6);
              } else {
                start.setHours(end.getHours() - 24); 
              }
            }

            const formatAPI = (d) => {
              return d.toISOString().substring(0, 19); 
            };

            const startDate = formatAPI(start);
            const endDate = formatAPI(end);

            const cpuId = cpuSensor.id || cpuSensor.itemid;
            const historyRes = await apiClient.get(`${ENDPOINTS.ITEM_HISTORY(cpuId)}?start_date=${startDate}&end_date=${endDate}`);
            
            let historyData = [];
            if (Array.isArray(historyRes.data)) historyData = historyRes.data;
            else if (historyRes.data?.data) historyData = historyRes.data.data;

            // =========================================================
            // UPDATE LOGIKA UNKNOWN (HANYA JIKA HISTORY KOSONG / LAST UPDATE N/A)
            // =========================================================
            if (historyData.length === 0) {
              return {
                deviceId: host.id,
                deviceName: host.visible_name || host.host,
                deviceType: "Cisco Catalyst",
                location: host.location || "Unknown",
                ipAddress: host.ip_address || "-",
                cpuUsage: 0,
                status: 'unknown', // History kosong = Unknown
                lastUpdate: '-',   // Ini akan jadi N/A di UI
                history: [], 
              };
            }

            const realHistory = historyData.map(data => {
              let timeStr = String(data.clock);
              
              if (!isNaN(timeStr) && timeStr.length === 10) {
                timeStr = new Date(Number(timeStr) * 1000).toISOString();
              } 
              else if (!timeStr.endsWith('Z') && !timeStr.includes('+')) {
                timeStr = timeStr.replace(' ', 'T') + 'Z'; 
              }

              return {
                timestamp: timeStr, 
                rawTime: timeStr,   
                cpuUsage: Math.round(data.value_numeric * 10) / 10 
              };
            });

            const latestUsage = realHistory.length > 0 ? realHistory[realHistory.length - 1].cpuUsage : 0;
            const lastUpdateClock = realHistory.length > 0 ? realHistory[realHistory.length - 1].rawTime : null;

            // =========================================================
            // UPDATE LOGIKA STATUS (0% TAPI ADA UPDATE = NORMAL)
            // =========================================================
            let status = 'normal';
            if (latestUsage >= 85) status = 'critical';
            else if (latestUsage >= 50) status = 'warning';
            // Jika latestUsage === 0, biarkan 'normal' karena history-nya ada (melewati if historyData.length === 0 di atas)

            return {
              deviceId: host.id,
              deviceName: host.visible_name || host.host,
              deviceType: "Cisco Catalyst",
              location: host.location || "Unknown",
              ipAddress: host.ip_address || "-",
              cpuUsage: latestUsage,
              status: status,
              lastUpdate: lastUpdateClock ? new Date(lastUpdateClock).toLocaleString('id-ID') : '-',
              history: realHistory,
            };
          } catch (err) {
            console.warn(`Gagal memproses CPU untuk host ${host.id}:`, err);
            return null;
          }
        });

        const results = await Promise.all(cpuPromises);
        return results.filter(item => item !== null);

      } catch (err) {
        console.error("Gagal mengambil data keseluruhan CPU:", err);
        return [];
      }
    },
    refetchInterval: 60000, 
  });

  return { metrics: data, loading: isLoading, error: error ? error.message : null, refreshManual: refetch };
};