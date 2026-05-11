import { useState } from 'react';
import { useMemoryMetrics } from '../../hooks/useMemoryMetrics';
import { LineChart } from '../../components/charts/LineChart';
import { Search, Grid3x3, List, HardDrive, Download, ChevronDown, Loader2 } from 'lucide-react';
import { DatePicker } from '../../components/DatePicker';
import apiClient from '../../services/apiClient';
import * as XLSX from 'xlsx';

export function Memory() {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('table'); 
  const [selectedDevice, setSelectedDevice] = useState<any>(null);

  const [selectedDate, setSelectedDate] = useState('');
  const [selectedPreset, setSelectedPreset] = useState('24h');
  const [isCustomRange, setIsCustomRange] = useState(false);

  const { metrics, loading } = useMemoryMetrics(
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

  // =========================================================================
  // FUNGSI EXPORT EXCEL DENGAN FITUR "DATA MERGING" & UNKNOWN LOGIC
  // =========================================================================
  const handleExportExcel = async (range: string) => {
    setShowExportMenu(false); 
    setIsExporting(true);     

    try {
      let apiRange = range;
      if (range === 'week') apiRange = '7d'; 
      else if (range === 'month') apiRange = '30d';

      const response = await apiClient.get(`/api/summary/report?range=${apiRange}`);
      const payload = response.data?.data ? response.data.data : response.data;
      const rawBackendData = payload['memory'] || []; 
      
      let formattedData: any[] = [];

      if (rawBackendData.length > 0) {
        console.log(`Berhasil menarik ${rawBackendData.length} baris dari server. Melakukan merging...`);
        
        // Looping dari data UI (filteredMetrics) agar alat yang unknown tetap tercetak
        formattedData = filteredMetrics.map(m => {
          const serverItems = rawBackendData.filter((item: any) => item.device === m.deviceName);
          
          let finalMin: any = "N/A";
          let finalMax: any = "N/A";
          let finalAvg: any = "N/A";

          // Jika alat UNKNOWN di UI, paksa Excel jadi N/A
          if (m.status === 'unknown') {
             return {
              "Device Name": m.deviceName,
              "IP Address": m.ipAddress || 'Unknown',
              "Location": m.location || 'Unknown',
              "Min Memory (%)": "N/A",
              "Max Memory (%)": "N/A",
              "Avg Memory (%)": "N/A"
            };
          }

          if (serverItems.length > 0) {
            finalMin = Math.min(...serverItems.map((s: any) => s.min));
            finalMin = Number(finalMin.toFixed(1));
            
            finalMax = Math.max(...serverItems.map((s: any) => s.max));
            finalMax = Number(finalMax.toFixed(1));
            
            const totalAvg = serverItems.reduce((acc: number, curr: any) => acc + curr.avg, 0);
            finalAvg = Number((totalAvg / serverItems.length).toFixed(1));
          } else {
            // Fallback UI jika backend kosong tapi status alatnya Normal
            finalAvg = m.usage !== null ? Number(m.usage.toFixed(1)) : 'N/A';
          }

          return {
            "Device Name": m.deviceName,
            "IP Address": m.ipAddress || 'Unknown',
            "Location": m.location || 'Unknown',
            "Min Memory (%)": finalMin,
            "Max Memory (%)": finalMax,
            "Avg Memory (%)": finalAvg
          };
        });
      } 
      else {
        console.warn(`Data server kosong. Menggunakan data tabel fallback.`);
        formattedData = filteredMetrics.map(m => ({
          "Device Name": m.deviceName,
          "IP Address": m.ipAddress || 'Unknown',
          "Location": m.location || 'Unknown',
          "Min Memory (%)": "N/A", 
          "Max Memory (%)": "N/A", 
          "Avg Memory (%)": m.status === 'unknown' ? 'N/A' : (m.usage !== null ? Number(m.usage.toFixed(1)) : 'N/A')
        }));
      }

      const worksheet = XLSX.utils.json_to_sheet(formattedData);
      
      worksheet['!cols'] = [
        { wch: 30 }, { wch: 18 }, { wch: 25 }, { wch: 15 }, { wch: 15 }, { wch: 15 },
      ];

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, `Memory_${range}`);

      const dateStr = new Date().toISOString().split('T')[0];
      XLSX.writeFile(workbook, `Report_Memory_${range}_${dateStr}.xlsx`);

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
          <p className="text-slate-600 dark:text-zinc-500">Loading memory metrics...</p>
        </div>
      </div>
    );
  }

  const normalCount = filteredMetrics.filter(m => m.status === 'normal').length;
  const warningCount = filteredMetrics.filter(m => m.status === 'warning').length;
  const criticalCount = filteredMetrics.filter(m => m.status === 'critical').length;
  
  // =====================================================================
  // UPDATE: LOGIKA UNTUK MENAMPILKAN TOTAL DEVICE VS VALID DEVICE
  // =====================================================================
  const totalDevicesCount = filteredMetrics.length;
  const validMetricsForAvg = filteredMetrics.filter(m => m.status !== 'unknown');
  const validDevicesCount = validMetricsForAvg.length;
  
  const avgUsage = validDevicesCount > 0 
    ? validMetricsForAvg.reduce((sum, m) => sum + m.usage, 0) / validDevicesCount 
    : 0;

  const formatLastUpdate = (isoString: string) => {
    if (!isoString || isoString === '-') return 'N/A';
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return isoString;
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'normal': return { color: 'bg-emerald-500 dark:bg-emerald-400', borderColor: 'border-emerald-300 dark:border-emerald-500/30', bgColor: 'bg-emerald-50 dark:bg-emerald-950/20', textColor: 'text-emerald-700 dark:text-emerald-400' };
      case 'warning': return { color: 'bg-yellow-500 dark:bg-yellow-400', borderColor: 'border-yellow-300 dark:border-yellow-500/30', bgColor: 'bg-yellow-50 dark:bg-yellow-950/20', textColor: 'text-yellow-700 dark:text-yellow-400' };
      case 'critical': return { color: 'bg-red-500', borderColor: 'border-red-300 dark:border-red-500/30', bgColor: 'bg-red-50 dark:bg-red-950/20', textColor: 'text-red-700 dark:text-red-400' };
      case 'unknown': return { color: 'bg-slate-400 dark:bg-zinc-600', borderColor: 'border-slate-300 dark:border-zinc-700', bgColor: 'bg-slate-100 dark:bg-zinc-800', textColor: 'text-slate-500 dark:text-zinc-500' }; // STATUS BARU!
      default: return { color: 'bg-slate-500 dark:bg-zinc-500', borderColor: 'border-slate-300 dark:border-zinc-700', bgColor: 'bg-white dark:bg-zinc-900', textColor: 'text-slate-700 dark:text-zinc-400' };
    }
  };

  const handleApplyTimeFilter = () => { if (selectedDate) setIsCustomRange(true); };
  const handleResetTimeFilter = () => { setSelectedDate(''); setSelectedPreset('24h'); setIsCustomRange(false); };

  return (
    <>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-zinc-100 mb-2">Memory Monitoring</h1>
        <p className="text-slate-600 dark:text-zinc-500">Device memory utilization tracking and alerts</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-300 dark:border-emerald-500/30 rounded-lg p-4 shadow-sm">
          <p className="text-sm text-slate-600 dark:text-zinc-500 mb-1">Normal</p>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{normalCount}</p>
        </div>
        <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-300 dark:border-yellow-500/30 rounded-lg p-4 shadow-sm">
          <p className="text-sm text-slate-600 dark:text-zinc-500 mb-1">Warning</p>
          <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{warningCount}</p>
        </div>
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-300 dark:border-red-500/30 rounded-lg p-4 shadow-sm">
          <p className="text-sm text-slate-600 dark:text-zinc-500 mb-1">Critical</p>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400">{criticalCount}</p>
        </div>
        
        {/* UPDATE: KARTU AVG USAGE MENAMPILKAN VALID SENSORS */}
        <div className="bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-800 rounded-lg p-4 shadow-sm flex flex-col justify-center">
          <div className="flex justify-between items-start">
            <p className="text-sm text-slate-600 dark:text-zinc-500 mb-1">Avg Usage</p>
            <span className="text-[10px] font-medium px-2 py-0.5 bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 rounded-full border border-slate-200 dark:border-zinc-700" title="Valid Sensors / Total Devices">
              {validDevicesCount}/{totalDevicesCount} Sensors
            </span>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-zinc-100 mt-1">
            {avgUsage > 0 ? avgUsage.toFixed(1) : 0}%
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 dark:text-zinc-500" />
          <input
            type="text"
            placeholder="Search by device name, location, or IP..."
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
          <p className="text-slate-600 dark:text-zinc-500">No memory metrics found matching your search.</p>
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 dark:text-zinc-400 uppercase tracking-wider">Memory Usage</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 dark:text-zinc-400 uppercase tracking-wider">Action</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 dark:text-zinc-400 uppercase tracking-wider">Last Update</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-zinc-800">
                {filteredMetrics.map((metric) => {
                  const config = getStatusConfig(metric.status);
                  return (
                    <tr key={metric.deviceId} className="hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap"><div className="font-medium text-slate-900 dark:text-zinc-100">{metric.deviceName}</div></td>
                      <td className="px-6 py-4 whitespace-nowrap"><div className="text-sm font-mono text-slate-700 dark:text-zinc-400">{metric.ipAddress}</div></td>
                      <td className="px-6 py-4 whitespace-nowrap"><div className="text-sm text-slate-700 dark:text-zinc-400">{metric.location}</div></td>
                      <td className="px-6 py-4 whitespace-nowrap"><span className={`px-2.5 py-1 rounded-full text-xs font-medium ${config.bgColor} ${config.textColor} border ${config.borderColor}`}>{metric.status}</span></td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 bg-slate-200 dark:bg-zinc-700 rounded-full h-2 w-24">
                            <div className={`h-2 rounded-full ${config.color}`} style={{ width: metric.status === 'unknown' ? '0%' : `${Math.min(metric.usage, 100)}%` }} />
                          </div>
                          {/* JIKA UNKNOWN TAMPILKAN N/A */}
                          <span className="text-sm text-slate-800 dark:text-zinc-300 font-medium">
                            {metric.status === 'unknown' ? 'N/A' : `${metric.usage.toFixed(1)}%`}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap"><button onClick={() => setSelectedDevice(metric)} className="text-yellow-500 dark:text-yellow-400 hover:text-yellow-600 dark:hover:text-yellow-300 text-sm font-medium">View Chart</button></td>
                      <td className="px-6 py-4 whitespace-nowrap"><div className="text-sm text-slate-700 dark:text-zinc-400">{formatLastUpdate(metric.lastUpdate)}</div></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMetrics.map((metric) => {
            const config = getStatusConfig(metric.status);
            return (
              <div key={metric.deviceId} className={`p-5 rounded-lg border ${config.borderColor} ${config.bgColor} hover:bg-slate-100/50 dark:hover:bg-zinc-800/50 transition-colors`}>
                <div className="flex items-start justify-between mb-4 gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-slate-900 dark:text-zinc-100 truncate" title={metric.deviceName}>{metric.deviceName}</h3>
                    <p className="text-sm text-slate-600 dark:text-zinc-500 mt-0.5">{metric.ipAddress}</p>
                  </div>
                  <div className={`px-2.5 py-1 rounded-full text-xs font-medium shrink-0 ${config.bgColor} ${config.textColor} border ${config.borderColor}`}>{metric.status}</div>
                </div>
                <div className="space-y-3 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600 dark:text-zinc-500">Location:</span>
                    <span className="text-slate-900 dark:text-zinc-300">{metric.location}</span>
                  </div>
                  <div className="bg-slate-100 dark:bg-zinc-800 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <HardDrive className={`w-5 h-5 ${config.textColor}`} />
                      <span className={`text-2xl font-bold ${config.textColor}`}>
                        {metric.status === 'unknown' ? 'N/A' : `${metric.usage.toFixed(1)}%`}
                      </span>
                    </div>
                    <div className="bg-slate-200 dark:bg-zinc-700 rounded-full h-2">
                      <div className={`h-2 rounded-full ${config.color}`} style={{ width: metric.status === 'unknown' ? '0%' : `${Math.min(metric.usage, 100)}%` }} />
                    </div>
                    <p className="text-xs text-slate-600 dark:text-zinc-500 mt-2">Memory Usage</p>
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="bg-zinc-800 rounded-lg p-4">
                <p className="text-xs text-zinc-500 mb-1">Status</p>
                <p className={`text-lg font-bold ${getStatusConfig(activeDeviceData.status).textColor}`}>{activeDeviceData.status.toUpperCase()}</p>
              </div>
              <div className="bg-zinc-800 rounded-lg p-4">
                <p className="text-xs text-zinc-500 mb-1">Memory Usage</p>
                <p className="text-lg font-bold text-zinc-100">
                  {activeDeviceData.status === 'unknown' ? 'N/A' : `${activeDeviceData.usage.toFixed(1)}%`}
                </p>
              </div>
            </div>

            <div className="bg-zinc-800 rounded-lg p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <HardDrive className="w-5 h-5 text-yellow-400" />
                  <h3 className="text-lg font-semibold text-zinc-100">
                    Memory Usage History ({isCustomRange && selectedDate ? 'Selected Date' : selectedPreset === '1h' ? 'Last 1h' : selectedPreset === '6h' ? 'Last 6h' : 'Last 24h'})
                  </h3>
                </div>
                
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <DatePicker value={selectedDate} onChange={(date: any) => { setSelectedDate(date); if (date) setIsCustomRange(true); }} label="Date" />
                  <button onClick={handleApplyTimeFilter} disabled={!selectedDate} className="px-4 py-1.5 bg-yellow-400 hover:bg-yellow-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-zinc-900 rounded text-xs font-medium transition-colors">Apply</button>
                  {isCustomRange && <button onClick={handleResetTimeFilter} className="px-3 py-1.5 bg-zinc-700 hover:bg-zinc-600 text-zinc-300 rounded text-xs font-medium transition-colors">Reset</button>}
                </div>
              </div>
              
              <LineChart data={activeDeviceData.history} dataKey="usage" xAxisKey="timestamp" color="#facc15" height={300} />
              
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