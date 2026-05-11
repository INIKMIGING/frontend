import { useQuery } from '@tanstack/react-query';
import apiClient from '../services/apiClient';
import { ENDPOINTS } from '../services/endpoints';

export const useTemperatureMetrics = (timePreset = '24h', customDate = '') => {
  const { data = [], isLoading, error, refetch } = useQuery({
    queryKey: ['temperature-metrics-real', timePreset, customDate],
    queryFn: async () => {
      try {
        const hostsResponse = await apiClient.get(ENDPOINTS.HOSTS);
        let allHosts = Array.isArray(hostsResponse.data) ? hostsResponse.data : (hostsResponse.data?.data || []);

        const tempPromises = allHosts.map(async (host) => {
          try {
            const itemsResponse = await apiClient.get(ENDPOINTS.ITEMS_BY_HOST(host.id));
            let items = Array.isArray(itemsResponse.data) ? itemsResponse.data : (itemsResponse.data?.data || []);

            const allTempSensors = items.filter(item => item.key_ && item.key_.startsWith('sensor.temp.value'));
            const inletSensors = allTempSensors.filter(item => item.name && item.name.toLowerCase().includes('inlet'));

            const tempSensors = inletSensors.length > 0 ? inletSensors : allTempSensors;
            
            if (tempSensors.length === 0) return null;

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

            let allHistoryPoints = [];
            let maxCurrentTemp = 0;
            let lastUpdateRaw = null;

            for (const sensor of tempSensors) {
              const sensorId = sensor.id || sensor.itemid;
              const historyRes = await apiClient.get(`${ENDPOINTS.ITEM_HISTORY(sensorId)}?start_date=${startDateStr}&end_date=${endDateStr}`);
              
              let historyData = Array.isArray(historyRes.data) ? historyRes.data : (historyRes.data?.data || []);
              allHistoryPoints.push(...historyData);

              if (historyData.length > 0) {
                const latest = historyData[historyData.length - 1];
                const tempValue = Math.round(latest.value_numeric * 10) / 10;
                if (tempValue > maxCurrentTemp) {
                  maxCurrentTemp = tempValue;
                  lastUpdateRaw = latest.clock;
                }
              }
            }

            // =========================================================
            // 3. SAFETY NET: DATA KOSONG MASUK KE STATUS 'UNKNOWN'
            // =========================================================
            if (allHistoryPoints.length === 0) {
              return {
                deviceId: host.id,
                deviceName: host.visible_name || host.host,
                deviceType: "Cisco Catalyst",
                location: host.location || "Unknown",
                ipAddress: host.ip_address || "-",
                temperature: 0,
                status: 'unknown', // <-- Dulu normal, sekarang unknown
                lastUpdate: '-',
                history: [], 
              };
            }

            const groupedByTime = {};
            allHistoryPoints.forEach(point => {
              let timeStr = String(point.clock);
              if (!timeStr.endsWith('Z') && !timeStr.includes('+')) {
                timeStr = timeStr.replace(' ', 'T') + 'Z'; 
              }
              if (!groupedByTime[timeStr]) groupedByTime[timeStr] = [];
              groupedByTime[timeStr].push(point.value_numeric);
            });

            const realHistory = Object.keys(groupedByTime).sort().map(isoTime => {
              const temps = groupedByTime[isoTime];
              const maxTempAtThisMinute = Math.max(...temps); 
              return {
                timestamp: isoTime,
                temperature: Math.round(maxTempAtThisMinute * 10) / 10
              };
            });

            // =========================================================
            // UPDATE LOGIKA STATUS
            // =========================================================
            let status = 'normal';
            if (maxCurrentTemp === 0) status = 'unknown'; // Kalau suhu 0, berarti error
            else if (maxCurrentTemp >= 58) status = 'critical';
            else if (maxCurrentTemp >= 48) status = 'warning';

            let finalLastUpdate = lastUpdateRaw;
            if (finalLastUpdate && !String(finalLastUpdate).endsWith('Z')) {
                finalLastUpdate = String(finalLastUpdate).replace(' ', 'T') + 'Z';
            }

            return {
              deviceId: host.id,
              deviceName: host.visible_name || host.host,
              deviceType: "Cisco Catalyst",
              location: host.location || "Unknown",
              ipAddress: host.ip_address || "-",
              temperature: maxCurrentTemp,
              status: status,
              lastUpdate: finalLastUpdate ? new Date(finalLastUpdate).toLocaleString('id-ID') : '-',
              history: realHistory,
            };
          } catch (err) {
            return null;
          }
        });

        const results = await Promise.all(tempPromises);
        return results.filter(item => item !== null);
      } catch (err) {
        console.error("Gagal mengambil data temperature:", err);
        return [];
      }
    },
    refetchInterval: 60000, 
  });

  return { metrics: data, loading: isLoading, error: error ? error.message : null, refreshManual: refetch };
};