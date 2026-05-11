import { useQuery } from '@tanstack/react-query';
import apiClient from '../services/apiClient';
import { ENDPOINTS } from '../services/endpoints';

export const useNetworkMetrics = (timePreset = '24h', customDate = '') => {
  const { data = [], isLoading, error, refetch } = useQuery({
    queryKey: ['network-metrics-real-all', timePreset, customDate],
    queryFn: async () => {
      try {
        const hostsResponse = await apiClient.get(ENDPOINTS.HOSTS);
        let allHosts = Array.isArray(hostsResponse.data) ? hostsResponse.data : (hostsResponse.data?.data || []);

        const networkPromises = allHosts.map(async (host) => {
          try {
            const itemsResponse = await apiClient.get(ENDPOINTS.ITEMS_BY_HOST(host.id));
            let items = Array.isArray(itemsResponse.data) ? itemsResponse.data : (itemsResponse.data?.data || []);

            const pingSecSensor = items.find(item => item.key_ === 'icmppingsec');
            const pingLossSensor = items.find(item => item.key_ === 'icmppingloss');

            // Kalau router ini nggak dicolok sensor ping dari awal config Zabbix, skip
            if (!pingSecSensor) return null;

            // =========================================================
            // 1. LOGIKA WAKTU DINAMIS (WIB KE UTC)
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
            const startDateStr = formatAPI(start);
            const endDateStr = formatAPI(end);
            // =========================================================

            // --- PROSES 1: Tarik history Ping ---
            const secId = pingSecSensor.id || pingSecSensor.itemid;
            const secHistoryRes = await apiClient.get(`${ENDPOINTS.ITEM_HISTORY(secId)}?start_date=${startDateStr}&end_date=${endDateStr}`);
            let secHistoryData = Array.isArray(secHistoryRes.data) ? secHistoryRes.data : (secHistoryRes.data?.data || []);

            // =========================================================
            // 2. UPDATE SAFETY NET: DATA KOSONG MASUK KE STATUS 'UNKNOWN'
            // =========================================================
            if (secHistoryData.length === 0) {
              return {
                deviceId: host.id,
                deviceName: host.visible_name || host.host,
                deviceType: "Cisco Catalyst",
                location: host.location || "Unknown",
                ipAddress: host.ip_address || "-",
                status: 'unknown', // Dulu 'down', sekarang 'unknown' karena history-nya ga ada
                avgPing: null,
                packetLoss: null,  // Set null biar di UI bisa di-handle jadi N/A
                lastUpdate: '-',
                history: [],
              };
            }

            const realHistory = secHistoryData.map(data => {
              let timeStr = String(data.clock);
              // Paksa format UTC agar browser konversi ke WIB
              if (!timeStr.endsWith('Z') && !timeStr.includes('+')) {
                timeStr = timeStr.replace(' ', 'T') + 'Z'; 
              }
              return {
                timestamp: timeStr,
                rawTime: timeStr,
                responseTime: Math.round(data.value_numeric * 1000) // Convert sec to ms
              };
            });

            const latestPingMs = realHistory.length > 0 ? realHistory[realHistory.length - 1].responseTime : null;
            const lastUpdateRaw = realHistory.length > 0 ? realHistory[realHistory.length - 1].rawTime : null;

            // --- PROSES 2: Tarik history Packet Loss ---
            let latestLoss = 0;
            if (pingLossSensor) {
              const lossId = pingLossSensor.id || pingLossSensor.itemid;
              const lossHistoryRes = await apiClient.get(`${ENDPOINTS.ITEM_HISTORY(lossId)}?start_date=${startDateStr}&end_date=${endDateStr}`);
              let lossHistoryData = Array.isArray(lossHistoryRes.data) ? lossHistoryRes.data : (lossHistoryRes.data?.data || []);
              if (lossHistoryData.length > 0) {
                latestLoss = lossHistoryData[lossHistoryData.length - 1].value_numeric;
              }
            }

            // --- PROSES 3: Logika Status UP/DOWN Asli Zabbix ---
            // Zabbix mencatat Down jika Ping = 0 ms DAN Packet Loss = 100%
            let status = 'up';
            if (latestLoss === 100 || latestPingMs === 0) {
                status = 'down';
            }

            let finalLastUpdate = lastUpdateRaw;
            if (finalLastUpdate && !String(finalLastUpdate).endsWith('Z')) {
                finalLastUpdate = String(finalLastUpdate).replace(' ', 'T') + 'Z';
            }

            // 4. Bungkus menjadi format UI
            return {
              deviceId: host.id,
              deviceName: host.visible_name || host.host,
              deviceType: "Cisco Catalyst",
              location: host.location || "Unknown",
              ipAddress: host.ip_address || "-",
              status: status,
              avgPing: status === 'up' ? latestPingMs : 0, // Kalau down, set avgPing 0ms
              packetLoss: Math.round(latestLoss),
              lastUpdate: finalLastUpdate ? new Date(finalLastUpdate).toLocaleString('id-ID') : '-',
              history: realHistory,
            };
          } catch (err) {
            console.warn(`Gagal memproses network untuk host ${host.id}:`, err);
            return null;
          }
        });

        const results = await Promise.all(networkPromises);
        return results.filter(item => item !== null);

      } catch (err) {
        console.error("Gagal mengambil data keseluruhan network:", err);
        return [];
      }
    },
    refetchInterval: 60000, 
  });

  return { metrics: data, loading: isLoading, error: error ? error.message : null, refreshManual: refetch };
};