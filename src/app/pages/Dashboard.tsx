import { useMemo } from 'react';
import { PageContainer } from '../components/layout/PageContainer';
import { 
  Activity, 
  Server, 
  AlertTriangle, 
  CheckCircle2,
  Cpu,
  HardDrive,
  Thermometer,
  ShieldCheck
} from 'lucide-react';

import { useNetworkMetrics } from '../hooks/useNetworkMetrics';
import { useCPUMetrics } from '../hooks/useCPUMetrics';
import { useMemoryMetrics } from '../hooks/useMemoryMetrics';
import { useTemperatureMetrics } from '../hooks/useTemperatureMetrics';

export function Dashboard() {
  const { metrics: networkMetrics, loading: netLoading } = useNetworkMetrics();
  const { metrics: cpuMetrics, loading: cpuLoading } = useCPUMetrics();
  const { metrics: memMetrics, loading: memLoading } = useMemoryMetrics();
  const { metrics: tempMetrics, loading: tempLoading } = useTemperatureMetrics();

  const loading = netLoading || cpuLoading || memLoading || tempLoading;

  const summary = useMemo(() => {
    // 1. TOTAL MONITORED DEVICES (Dari network, karena ping pasti ada untuk semua host)
    const totalDevices = networkMetrics.length;

    // 2. KUMPULKAN ACTIVE ALERTS
    const activeAlerts: any[] = [];

    networkMetrics.forEach(m => {
      if (m.status === 'down') {
        activeAlerts.push({ id: `${m.deviceId}-net`, device: m.deviceName, ip: m.ipAddress, sector: 'Network', issue: 'DOWN (Offline)', icon: Activity, color: 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-950/30 border-red-300 dark:border-red-500/30', update: m.lastUpdate });
      }
    });

    cpuMetrics.forEach(m => {
      if (m.status === 'critical') {
        activeAlerts.push({ id: `${m.deviceId}-cpu`, device: m.deviceName, ip: m.ipAddress, sector: 'CPU', issue: `CRITICAL (${m.cpuUsage.toFixed(1)}%)`, icon: Cpu, color: 'text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-950/30 border-orange-300 dark:border-orange-500/30', update: m.lastUpdate });
      }
    });

    memMetrics.forEach(m => {
      if (m.status === 'critical') {
        activeAlerts.push({ id: `${m.deviceId}-mem`, device: m.deviceName, ip: m.ipAddress, sector: 'Memory', issue: `CRITICAL (${m.usage.toFixed(1)}%)`, icon: HardDrive, color: 'text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-950/30 border-purple-300 dark:border-purple-500/30', update: m.lastUpdate });
      }
    });

    tempMetrics.forEach(m => {
      if (m.status === 'critical') {
        activeAlerts.push({ id: `${m.deviceId}-tmp`, device: m.deviceName, ip: m.ipAddress, sector: 'Temperature', issue: `CRITICAL (${m.temperature.toFixed(1)}°C)`, icon: Thermometer, color: 'text-rose-600 dark:text-rose-400 bg-rose-100 dark:bg-rose-950/30 border-rose-300 dark:border-rose-500/30', update: m.lastUpdate });
      }
    });

    // 3. OVERALL HEALTH PERCENTAGE
    const uniqueProblemDevices = new Set(activeAlerts.map(a => a.device)).size;
    const healthPercent = totalDevices > 0 ? ((totalDevices - uniqueProblemDevices) / totalDevices) * 100 : 100;

    // 4. SECTOR VALID SENSORS & AVERAGES (Tiap sektor punya total device masing-masing)
    const netValid = networkMetrics.filter(m => m.status !== 'unknown');
    const netUp = networkMetrics.filter(m => m.status === 'up');
    const avgPing = netUp.length > 0 ? netUp.reduce((sum, m) => sum + (m.avgPing || 0), 0) / netUp.length : 0;

    const cpuValid = cpuMetrics.filter(m => m.status !== 'unknown');
    const avgCpu = cpuValid.length > 0 ? cpuValid.reduce((sum, m) => sum + m.cpuUsage, 0) / cpuValid.length : 0;

    const memValid = memMetrics.filter(m => m.status !== 'unknown');
    const avgMem = memValid.length > 0 ? memValid.reduce((sum, m) => sum + m.usage, 0) / memValid.length : 0;

    const tempValid = tempMetrics.filter(m => m.status !== 'unknown');
    const avgTemp = tempValid.length > 0 ? tempValid.reduce((sum, m) => sum + m.temperature, 0) / tempValid.length : 0;

    return {
      totalDevices,
      activeAlerts,
      healthPercent,
      sectorData: {
        // Parameter total disesuaikan dengan .length milik masing-masing array sektor
        network: { valid: netValid.length, total: networkMetrics.length, avg: avgPing },
        cpu: { valid: cpuValid.length, total: cpuMetrics.length, avg: avgCpu },
        memory: { valid: memValid.length, total: memMetrics.length, avg: avgMem },
        temp: { valid: tempValid.length, total: tempMetrics.length, avg: avgTemp }
      }
    };
  }, [networkMetrics, cpuMetrics, memMetrics, tempMetrics]);

  if (loading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-600 dark:text-zinc-500">Menganalisis status infrastruktur...</p>
          </div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      {/* HEADER */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-zinc-100 mb-2">NOC Dashboard</h1>
        <p className="text-slate-600 dark:text-zinc-500">Real-time infrastructure health and critical alerts</p>
      </div>

      {/* ROW 1: EXECUTIVE SUMMARY */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-800 rounded-xl p-6 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-zinc-400 mb-1">Total Monitored Devices</p>
            <p className="text-3xl font-bold text-slate-900 dark:text-zinc-100">{summary.totalDevices}</p>
          </div>
          <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center border border-blue-100 dark:border-blue-800">
            <Server className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-800 rounded-xl p-6 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-zinc-400 mb-1">Overall Health</p>
            <p className={`text-3xl font-bold ${summary.healthPercent === 100 ? 'text-emerald-600 dark:text-emerald-400' : 'text-yellow-600 dark:text-yellow-400'}`}>
              {summary.healthPercent.toFixed(1)}%
            </p>
          </div>
          <div className={`w-12 h-12 rounded-full flex items-center justify-center border ${summary.healthPercent === 100 ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800' : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-100 dark:border-yellow-800'}`}>
            <ShieldCheck className={`w-6 h-6 ${summary.healthPercent === 100 ? 'text-emerald-600 dark:text-emerald-400' : 'text-yellow-600 dark:text-yellow-400'}`} />
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-800 rounded-xl p-6 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-zinc-400 mb-1">Active Critical Alerts</p>
            <p className={`text-3xl font-bold ${summary.activeAlerts.length > 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
              {summary.activeAlerts.length}
            </p>
          </div>
          <div className={`w-12 h-12 rounded-full flex items-center justify-center border ${summary.activeAlerts.length > 0 ? 'bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-800' : 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800'}`}>
            <AlertTriangle className={`w-6 h-6 ${summary.activeAlerts.length > 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`} />
          </div>
        </div>
      </div>

      {/* ROW 2: THE RED ZONE */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-800 rounded-xl shadow-sm overflow-hidden mb-8">
        <div className="p-6 border-b border-slate-200 dark:border-zinc-800 flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${summary.activeAlerts.length > 0 ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`}></div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-zinc-100">The Red Zone (Action Required)</h2>
        </div>
        
        {summary.activeAlerts.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center bg-slate-50 dark:bg-zinc-900/50">
            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 dark:text-emerald-400" />
            </div>
            <h3 className="text-xl font-semibold text-slate-800 dark:text-zinc-200 mb-1">All Systems Normal 🎉</h3>
            <p className="text-slate-500 dark:text-zinc-500">No critical issues or offline devices detected.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 dark:bg-zinc-800 text-xs uppercase font-semibold text-slate-500 dark:text-zinc-400">
                <tr>
                  <th className="px-6 py-4">Device</th>
                  <th className="px-6 py-4">IP Address</th>
                  <th className="px-6 py-4">Sector</th>
                  <th className="px-6 py-4">Issue Detail</th>
                  <th className="px-6 py-4">Last Update</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-zinc-800">
                {summary.activeAlerts.map((alert) => (
                  <tr key={alert.id} className="hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-zinc-100">{alert.device}</td>
                    <td className="px-6 py-4 text-sm font-mono text-slate-500 dark:text-zinc-400">{alert.ip}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-zinc-300">
                        <alert.icon className="w-4 h-4" />
                        {alert.sector}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {/* PENAMBAHAN whitespace-nowrap AGAR PILL TIDAK PECAH/TURUN KE BAWAH */}
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border whitespace-nowrap inline-block ${alert.color}`}>
                        {alert.issue}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500 dark:text-zinc-400">{alert.update}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ROW 3: SECTOR PERFORMANCE METRICS */}
      <h2 className="text-xl font-bold text-slate-900 dark:text-zinc-100 mb-4">Sector Performance Metrics (Average)</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        <div className="bg-slate-50 dark:bg-zinc-800/50 border border-slate-200 dark:border-zinc-700/50 rounded-xl p-6 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
              <Activity className="w-6 h-6" />
            </div>
            <span className="text-[11px] font-bold px-2.5 py-1 bg-white dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 border border-slate-200 dark:border-zinc-700 rounded-full shadow-sm">
              {summary.sectorData.network.valid} / {summary.sectorData.network.total} Sensors
            </span>
          </div>
          <p className="text-slate-500 dark:text-zinc-400 text-sm font-medium mb-1">Network (Avg Ping)</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-zinc-100">{summary.sectorData.network.avg.toFixed(1)} ms</p>
        </div>

        <div className="bg-slate-50 dark:bg-zinc-800/50 border border-slate-200 dark:border-zinc-700/50 rounded-xl p-6 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg text-orange-600 dark:text-orange-400">
              <Cpu className="w-6 h-6" />
            </div>
            <span className="text-[11px] font-bold px-2.5 py-1 bg-white dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 border border-slate-200 dark:border-zinc-700 rounded-full shadow-sm">
              {summary.sectorData.cpu.valid} / {summary.sectorData.cpu.total} Sensors
            </span>
          </div>
          <p className="text-slate-500 dark:text-zinc-400 text-sm font-medium mb-1">CPU (Avg Usage)</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-zinc-100">{summary.sectorData.cpu.avg.toFixed(1)}%</p>
        </div>

        <div className="bg-slate-50 dark:bg-zinc-800/50 border border-slate-200 dark:border-zinc-700/50 rounded-xl p-6 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-purple-600 dark:text-purple-400">
              <HardDrive className="w-6 h-6" />
            </div>
            <span className="text-[11px] font-bold px-2.5 py-1 bg-white dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 border border-slate-200 dark:border-zinc-700 rounded-full shadow-sm">
              {summary.sectorData.memory.valid} / {summary.sectorData.memory.total} Sensors
            </span>
          </div>
          <p className="text-slate-500 dark:text-zinc-400 text-sm font-medium mb-1">Memory (Avg Usage)</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-zinc-100">{summary.sectorData.memory.avg.toFixed(1)}%</p>
        </div>

        <div className="bg-slate-50 dark:bg-zinc-800/50 border border-slate-200 dark:border-zinc-700/50 rounded-xl p-6 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-rose-100 dark:bg-rose-900/30 rounded-lg text-rose-600 dark:text-rose-400">
              <Thermometer className="w-6 h-6" />
            </div>
            <span className="text-[11px] font-bold px-2.5 py-1 bg-white dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 border border-slate-200 dark:border-zinc-700 rounded-full shadow-sm">
              {summary.sectorData.temp.valid} / {summary.sectorData.temp.total} Sensors
            </span>
          </div>
          <p className="text-slate-500 dark:text-zinc-400 text-sm font-medium mb-1">Temp (Avg Core)</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-zinc-100">{summary.sectorData.temp.avg.toFixed(1)}°C</p>
        </div>

      </div>
    </PageContainer>
  );
}