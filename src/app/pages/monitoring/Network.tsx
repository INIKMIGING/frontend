import { useState } from 'react';
import { useNetworkMetrics } from '../../hooks/useNetworkMetrics';
import { LineChart } from '../../components/charts/LineChart';
import { Search, Grid3x3, List, Activity, Download, ChevronDown, Loader2 } from 'lucide-react';
import { DatePicker } from '../../components/DatePicker';
import apiClient from '../../services/apiClient';
import * as XLSX from 'xlsx';

export function Network() {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('table'); 
  const [selectedDevice, setSelectedDevice] = useState<any>(null);

  const [selectedDate, setSelectedDate] = useState('');
  const [selectedPreset, setSelectedPreset] = useState('24h'); 
  const [isCustomRange, setIsCustomRange] = useState(false);

  const { metrics, loading } = useNetworkMetrics(
    isCustomRange ? '' : selectedPreset, 
    isCustomRange ? selectedDate : ''
  );

  const [isExporting, setIsExporting] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  const filteredMetrics = metrics.filter(metric => {
    const query = searchQuery.toLowerCase();
    const displayLocation = metric.location || 'Unknown';
    return (
      metric.deviceName.toLowerCase().includes(query) ||
      displayLocation.toLowerCase().includes(query) ||
      (metric.ipAddress && metric.ipAddress.includes(query))
    );
  });

  const activeDeviceData = selectedDevice 
    ? metrics.find(m => m.deviceId === selectedDevice.deviceId) || selectedDevice 
    : null;

  const handleExportExcel = async (range: string) => {
    setShowExportMenu(false);
    setIsExporting(true);

    try {
      let apiRange = range;
      if (range === 'week') apiRange = '7d'; 
      
      const response = await apiClient.get(`/api/summary/report?range=${apiRange}`);
      const rawBackendData = response.data['bandwidth'] || []; 
      let formattedData: any[] = [];

      if (rawBackendData.length > 0) {
        console.log(`Berhasil menarik ${rawBackendData.length} data dari server. Melakukan merging...`);
        
        formattedData = filteredMetrics.map(m => {
          const serverItem = rawBackendData.find((item: any) => item.device === m.deviceName);
          
          if (m.status === 'unknown') {
             return {
              "Device Name": m.deviceName,
              "IP Address": m.ipAddress || 'Unknown',
              "Location": m.location || 'Unknown',
              "Min Ping (ms)": "N/A",
              "Max Ping (ms)": "N/A",
              "Avg Ping (ms)": "N/A",
              "Packet Loss (%)": "N/A"
            };
          }

          if (serverItem) {
             return {
              "Device Name": m.deviceName,
              "IP Address": m.ipAddress || 'Unknown',
              "Location": m.location || 'Unknown',
              "Min Ping (ms)": serverItem.min !== null ? Number(serverItem.min.toFixed(1)) : 'N/A',
              "Max Ping (ms)": serverItem.max !== null ? Number(serverItem.max.toFixed(1)) : 'N/A',
              "Avg Ping (ms)": serverItem.avg !== null ? Number(serverItem.avg.toFixed(1)) : 'N/A',
              "Packet Loss (%)": m.packetLoss !== null ? `${m.packetLoss}%` : 'N/A'
            };
          }

          return {
            "Device Name": m.deviceName,
            "IP Address": m.ipAddress || 'Unknown',
            "Location": m.location || 'Unknown',
            "Min Ping (ms)": "N/A",
            "Max Ping (ms)": "N/A",
            "Avg Ping (ms)": m.avgPing !== null ? Number(m.avgPing.toFixed(1)) : 'N/A',
            "Packet Loss (%)": m.packetLoss !== null ? `${m.packetLoss}%` : 'N/A'
          };
        });
      } else {
        console.warn(`Data server kosong. Menggunakan data tabel fallback.`);
        formattedData = filteredMetrics.map(m => ({
          "Device Name": m.deviceName,
          "IP Address": m.ipAddress || 'Unknown',
          "Location": m.location || 'Unknown',
          "Min Ping (ms)": "N/A", 
          "Max Ping (ms)": "N/A", 
          "Avg Ping (ms)": m.status === 'unknown' || m.status === 'down' ? 'N/A' : (m.avgPing !== null ? Number(m.avgPing.toFixed(1)) : 'N/A'),
          "Packet Loss (%)": m.status === 'unknown' ? 'N/A' : `${m.packetLoss}%`
        }));
      }

      const worksheet = XLSX.utils.json_to_sheet(formattedData);
      worksheet['!cols'] = [
        { wch: 30 }, { wch: 18 }, { wch: 25 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 18 }
      ];

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, `Network_${range}`);

      const dateStr = new Date().toISOString().split('T')[0];
      XLSX.writeFile(workbook, `Report_Network_${range}_${dateStr}.xlsx`);

    } catch (error) {
      console.error("Gagal export data Excel:", error);
      alert("Terjadi kesalahan saat mengunduh laporan dari server.");
    } finally {
      setIsExporting(false);
    }
  };

  if (loading && metrics.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-zinc-500">Loading network metrics...</p>
        </div>
      </div>
    );
  }

  // =====================================================================
  // UPDATE: LOGIKA DIPISAH AGAR 38/38 DAN AVG PING SAMA-SAMA AKURAT
  // =====================================================================
  const upCount = filteredMetrics.filter(m => m.status === 'up').length;
  const downCount = filteredMetrics.filter(m => m.status === 'down').length;
  
  const totalDevicesCount = filteredMetrics.length;
  
  // 1. Yang dihitung sebagai sensor valid (UP maupun DOWN, pokoknya bukan unknown)
  const validSensors = filteredMetrics.filter(m => m.status !== 'unknown');
  const validDevicesCount = validSensors.length;

  // 2. Yang dihitung untuk rata-rata ping HANYA yang UP (biar ping 0ms dari alat mati ga ikut kehitung)
  const upDevices = filteredMetrics.filter(m => m.status === 'up');
  const avgPing = upDevices.length > 0 
    ? upDevices.reduce((sum, m) => sum + (m.avgPing || 0), 0) / upDevices.length 
    : 0;

  const formatLastUpdate = (isoString: string) => {
    if (!isoString || isoString === '-') return 'N/A';
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return isoString; 
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  };

  const shouldShowPingNA = (status: string, packetLoss: number) => {
    return status === 'down' || status === 'unknown' || packetLoss === 100;
  };

  const getLatencyColor = (metric: any) => {
    if (metric.status === 'unknown') return 'bg-slate-400 dark:bg-zinc-600';
    if (shouldShowPingNA(metric.status, metric.packetLoss)) return 'bg-red-500';
    const ping = metric.avgPing;
    if (ping === null) return 'bg-red-500';
    if (ping < 50) return 'bg-emerald-400'; 
    if (ping < 100) return 'bg-yellow-400'; 
    return 'bg-red-500'; 
  };

  const handleApplyTimeFilter = () => { if (selectedDate) setIsCustomRange(true); };
  const handleResetTimeFilter = () => { setSelectedDate(''); setSelectedPreset('24h'); setIsCustomRange(false); };

  return (
    <>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-zinc-100 mb-2">Network Monitoring</h1>
        <p className="text-slate-600 dark:text-zinc-500">ICMP availability and response time monitoring</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-800 rounded-lg p-4 shadow-sm">
          <p className="text-sm text-slate-600 dark:text-zinc-500 mb-1">Total Devices</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-zinc-100">{totalDevicesCount}</p>
        </div>
        <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-300 dark:border-emerald-500/30 rounded-lg p-4 shadow-sm">
          <p className="text-sm text-slate-600 dark:text-zinc-500 mb-1">Up</p>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{upCount}</p>
        </div>
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-300 dark:border-red-500/30 rounded-lg p-4 shadow-sm">
          <p className="text-sm text-slate-600 dark:text-zinc-500 mb-1">Down</p>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400">{downCount}</p>
        </div>
        
        <div className="bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-800 rounded-lg p-4 shadow-sm flex flex-col justify-center">
          <div className="flex justify-between items-start">
            <p className="text-sm text-slate-600 dark:text-zinc-500 mb-1">Avg Ping</p>
            <span className="text-[10px] font-medium px-2 py-0.5 bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 rounded-full border border-slate-200 dark:border-zinc-700" title="Valid Sensors (UP & DOWN) / Total Devices">
              {validDevicesCount}/{totalDevicesCount} Sensors
            </span>
          </div>
          <p className="text-2xl font-bold text-yellow-500 dark:text-yellow-400 mt-1">
            {avgPing > 0 ? avgPing.toFixed(1) : 0} ms
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 dark:text-zinc-500" />
          <input
            type="text"
            placeholder="Search by device name, type, location, or IP..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-100 dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 rounded-lg text-sm text-slate-900 dark:text-zinc-200 placeholder:text-slate-500 dark:placeholder:text-zinc-500 focus:outline-none focus:border-yellow-400/50 focus:ring-1 focus:ring-yellow-400/20"
          />
        </div>

        <div className="relative">
          <button
            onClick={() => setShowExportMenu(!showExportMenu)}
            disabled={isExporting}
            className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-400 border border-slate-300 dark:border-zinc-700 rounded-lg hover:bg-slate-50 dark:hover:bg-zinc-800 hover:border-slate-400 dark:hover:border-zinc-600 transition-colors disabled:opacity-50"
          >
            {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            <span className="text-sm font-medium">{isExporting ? 'Exporting...' : 'Export Excel'}</span>
            <ChevronDown className={`w-4 h-4 transition-transform ${showExportMenu ? 'rotate-180' : ''}`} />
          </button>
          {showExportMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowExportMenu(false)}></div>
              <div className="absolute right-0 mt-2 w-36 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg shadow-lg z-20 py-1 overflow-hidden">
                <button onClick={() => handleExportExcel('today')} className="w-full text-left px-4 py-2.5 text-sm text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors">Today</button>
                <button onClick={() => handleExportExcel('week')} className="w-full text-left px-4 py-2.5 text-sm text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors">This Week</button>
                <button onClick={() => handleExportExcel('month')} className="w-full text-left px-4 py-2.5 text-sm text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors">This Month</button>
              </div>
            </>
          )}
        </div>

        <div className="flex gap-2">
          <button onClick={() => setViewMode('table')} className={`px-4 py-2.5 rounded-lg border transition-colors ${viewMode === 'table' ? 'bg-yellow-400 text-zinc-900 border-yellow-400' : 'bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-400 border-slate-300 dark:border-zinc-700 hover:border-slate-400 dark:hover:border-zinc-600'}`}><List className="w-4 h-4" /></button>
          <button onClick={() => setViewMode('grid')} className={`px-4 py-2.5 rounded-lg border transition-colors ${viewMode === 'grid' ? 'bg-yellow-400 text-zinc-900 border-yellow-400' : 'bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-400 border-slate-300 dark:border-zinc-700 hover:border-slate-400 dark:hover:border-zinc-600'}`}><Grid3x3 className="w-4 h-4" /></button>
        </div>
      </div>

      {filteredMetrics.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-800 rounded-lg p-12 text-center shadow-sm">
          <p className="text-slate-600 dark:text-zinc-500">No network metrics found matching your search.</p>
        </div>
      ) : viewMode === 'table' ? (
        <div className="bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-800 rounded-lg overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-100 dark:bg-zinc-800 border-b border-slate-300 dark:border-zinc-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 dark:text-zinc-400 uppercase tracking-wider">Device</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 dark:text-zinc-400 uppercase tracking-wider">IP Address</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 dark:text-zinc-400 uppercase tracking-wider">Location</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 dark:text-zinc-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 dark:text-zinc-400 uppercase tracking-wider">Avg Ping</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 dark:text-zinc-400 uppercase tracking-wider">Packet Loss</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 dark:text-zinc-400 uppercase tracking-wider">Action</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 dark:text-zinc-400 uppercase tracking-wider">Last Update</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-zinc-800">
                {filteredMetrics.map((metric) => (
                  <tr key={metric.deviceId} className="hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap"><div className="font-medium text-slate-900 dark:text-zinc-100">{metric.deviceName}</div></td>
                    <td className="px-6 py-4 whitespace-nowrap"><div className="text-sm font-mono text-slate-700 dark:text-zinc-400">{metric.ipAddress}</div></td>
                    <td className="px-6 py-4 whitespace-nowrap"><div className="text-sm text-slate-700 dark:text-zinc-400">{metric.location}</div></td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        metric.status === 'up' ? 'bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/30' : 
                        metric.status === 'down' ? 'bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400 border border-red-300 dark:border-red-500/30' :
                        'bg-slate-200 dark:bg-zinc-700 text-slate-600 dark:text-zinc-400 border border-slate-300 dark:border-zinc-600'
                      }`}>
                        {metric.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${getLatencyColor(metric)}`}></div>
                        <span className={`text-sm ${shouldShowPingNA(metric.status, metric.packetLoss) ? 'text-red-600 dark:text-red-400' : 'text-slate-700 dark:text-zinc-400'}`}>
                          {shouldShowPingNA(metric.status, metric.packetLoss) ? 'N/A' : metric.avgPing !== null ? `${metric.avgPing.toFixed(1)} ms` : 'N/A'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-700 dark:text-zinc-400">
                        {metric.status === 'unknown' ? 'N/A' : `${metric.packetLoss}%`}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap"><button onClick={() => setSelectedDevice(metric)} className="text-yellow-500 dark:text-yellow-400 hover:text-yellow-600 dark:hover:text-yellow-300 text-sm font-medium">View Chart</button></td>
                    <td className="px-6 py-4 whitespace-nowrap"><div className="text-sm text-slate-700 dark:text-zinc-400">{formatLastUpdate(metric.lastUpdate)}</div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMetrics.map((metric) => {
            const statusConfig = metric.status === 'up'
              ? { borderColor: 'border-emerald-300 dark:border-emerald-500/30', bgColor: 'bg-emerald-50 dark:bg-emerald-950/20', textColor: 'text-emerald-700 dark:text-emerald-400', iconColor: 'text-emerald-500 dark:text-emerald-400' }
              : metric.status === 'down' 
              ? { borderColor: 'border-red-300 dark:border-red-500/30', bgColor: 'bg-red-50 dark:bg-red-950/20', textColor: 'text-red-700 dark:text-red-400', iconColor: 'text-red-500 dark:text-red-400' }
              : { borderColor: 'border-slate-300 dark:border-zinc-700', bgColor: 'bg-slate-100 dark:bg-zinc-800', textColor: 'text-slate-600 dark:text-zinc-400', iconColor: 'text-slate-400 dark:text-zinc-500' };

            return (
              <div key={metric.deviceId} className={`p-5 rounded-lg border ${statusConfig.borderColor} ${statusConfig.bgColor} hover:bg-slate-100/50 dark:hover:bg-zinc-800/50 transition-colors`}>
                <div className="flex items-start justify-between mb-4 gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-slate-900 dark:text-zinc-100 truncate" title={metric.deviceName}>{metric.deviceName}</h3>
                    <p className="text-sm text-slate-600 dark:text-zinc-500 mt-0.5 font-mono">{metric.ipAddress}</p>
                  </div>
                  <div className={`px-2.5 py-1 rounded-full text-xs font-medium shrink-0 ${statusConfig.bgColor} ${statusConfig.textColor} border ${statusConfig.borderColor}`}>{metric.status.toUpperCase()}</div>
                </div>
                
                <div className="space-y-3 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600 dark:text-zinc-500">Location:</span>
                    <span className="text-slate-900 dark:text-zinc-300">{metric.location}</span>
                  </div>
                  
                  <div className="bg-slate-100 dark:bg-zinc-800 rounded-lg p-4 text-center">
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <Activity className={`w-6 h-6 ${statusConfig.iconColor}`} />
                      <span className={`text-3xl font-bold ${shouldShowPingNA(metric.status, metric.packetLoss) ? 'text-red-500' : 'text-slate-900 dark:text-zinc-100'}`}>
                        {shouldShowPingNA(metric.status, metric.packetLoss) ? 'N/A' : metric.avgPing !== null ? `${metric.avgPing.toFixed(1)} ms` : 'N/A'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-zinc-500">Avg Response Time</p>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600 dark:text-zinc-500">Packet Loss:</span>
                    <span className="text-slate-900 dark:text-zinc-300">
                      {metric.status === 'unknown' ? 'N/A' : `${metric.packetLoss}%`}
                    </span>
                  </div>
                </div>
                
                <button onClick={() => setSelectedDevice(metric)} className="w-full py-2 bg-slate-200 dark:bg-zinc-800 hover:bg-slate-300 dark:hover:bg-zinc-700 text-yellow-600 dark:text-yellow-400 rounded-lg text-sm font-medium transition-colors">View Details</button>
              </div>
            );
          })}
        </div>
      )}

      {/* Device Detail Modal */}
      {activeDeviceData && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setSelectedDevice(null)}>
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-zinc-100">{activeDeviceData.deviceName}</h2>
                <p className="text-zinc-500">{activeDeviceData.ipAddress} • {activeDeviceData.location}</p>
              </div>
              <button onClick={() => setSelectedDevice(null)} className="text-zinc-500 hover:text-zinc-300 text-2xl">×</button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-zinc-800 rounded-lg p-4">
                <p className="text-xs text-zinc-500 mb-1">Status</p>
                <p className={`text-lg font-bold ${
                  activeDeviceData.status === 'up' ? 'text-emerald-400' : 
                  activeDeviceData.status === 'down' ? 'text-red-400' : 'text-zinc-400'
                }`}>
                  {activeDeviceData.status.toUpperCase()}
                </p>
              </div>
              <div className="bg-zinc-800 rounded-lg p-4">
                <p className="text-xs text-zinc-500 mb-1">Avg Ping</p>
                <p className="text-lg font-bold text-zinc-100">
                  {shouldShowPingNA(activeDeviceData.status, activeDeviceData.packetLoss) ? 'N/A' : activeDeviceData.avgPing !== null ? `${activeDeviceData.avgPing.toFixed(1)} ms` : 'N/A'}
                </p>
              </div>
              <div className="bg-zinc-800 rounded-lg p-4">
                <p className="text-xs text-zinc-500 mb-1">Packet Loss</p>
                <p className="text-lg font-bold text-zinc-100">
                  {activeDeviceData.status === 'unknown' ? 'N/A' : `${activeDeviceData.packetLoss}%`}
                </p>
              </div>
            </div>

            <div className="bg-zinc-800 rounded-lg p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-yellow-400" />
                  <h3 className="text-lg font-semibold text-zinc-100">
                    Response Time History ({isCustomRange && selectedDate ? 'Selected Date' : selectedPreset === '1h' ? 'Last 1h' : selectedPreset === '6h' ? 'Last 6h' : 'Last 24h'})
                  </h3>
                </div>
                
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <DatePicker value={selectedDate} onChange={(date: any) => { setSelectedDate(date); if (date) setIsCustomRange(true); }} label="Date" />
                  <button onClick={handleApplyTimeFilter} disabled={!selectedDate} className="px-4 py-1.5 bg-yellow-400 hover:bg-yellow-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-zinc-900 rounded text-xs font-medium transition-colors">Apply</button>
                  {isCustomRange && <button onClick={handleResetTimeFilter} className="px-3 py-1.5 bg-zinc-700 hover:bg-zinc-600 text-zinc-300 rounded text-xs font-medium transition-colors">Reset</button>}
                </div>
              </div>
              
              <LineChart data={activeDeviceData.history} dataKey="responseTime" xAxisKey="timestamp" color="#facc15" height={300} />
              
              <div className="flex items-center justify-center gap-2 mt-4 pt-4 border-t border-zinc-700">
                <span className="text-xs text-zinc-500">Last:</span>
                <button onClick={() => { setSelectedPreset('1h'); setSelectedDate(''); setIsCustomRange(false); }} className={`px-3 py-1 rounded text-xs font-medium transition-colors ${selectedPreset === '1h' && !isCustomRange ? 'bg-yellow-400 text-zinc-900' : 'bg-zinc-700 hover:bg-zinc-600 text-zinc-400'}`}>1h</button>
                <button onClick={() => { setSelectedPreset('6h'); setSelectedDate(''); setIsCustomRange(false); }} className={`px-3 py-1 rounded text-xs font-medium transition-colors ${selectedPreset === '6h' && !isCustomRange ? 'bg-yellow-400 text-zinc-900' : 'bg-zinc-700 hover:bg-zinc-600 text-zinc-400'}`}>6h</button>
                <button onClick={() => { setSelectedPreset('24h'); setSelectedDate(''); setIsCustomRange(false); }} className={`px-3 py-1 rounded text-xs font-medium transition-colors ${selectedPreset === '24h' && !isCustomRange ? 'bg-yellow-400 text-zinc-900' : 'bg-zinc-700 hover:bg-zinc-600 text-zinc-400'}`}>24h</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}