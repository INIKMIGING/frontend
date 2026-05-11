import { useState } from 'react';
import { PageContainer } from '../components/layout/PageContainer';
import { DeviceStatusCard } from '../components/cards/DeviceStatusCard';
import { Search, Grid3x3, List } from 'lucide-react';
import { LocationEdit } from '../components/LocationEdit';

// IMPORT KEDUA HOOK
import { useDevices } from '../hooks/useDevices';
import { useNetworkMetrics } from '../hooks/useNetworkMetrics';

export function Devices() {
  const { devices, loading: devicesLoading, updateLocation } = useDevices();
  const { metrics: networkMetrics, loading: networkLoading } = useNetworkMetrics();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'table'

  const loading = devicesLoading || networkLoading;

  // Helper to format lastUpdate timestamp (Dipindah ke atas agar bisa dipakai saat map data)
  const formatLastUpdate = (isoString) => {
    if (!isoString) return 'N/A';
    const date = new Date(isoString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  };

  // 1. GABUNGKAN STATUS PING & WAKTU KE DALAM DAFTAR DEVICES
  const devicesWithRealStatus = devices.map(device => {
    // Cari data ping perangkat ini di hasil tarikan Network
    const netStat = networkMetrics.find(m => m.deviceId === device.id);
    
    // Kalau di network statusnya 'down', berarti dia offline
    const realStatus = netStat && netStat.status === 'down' ? 'offline' : 'online';
    
    // Ambil string waktu dari Network (yang sudah up-to-date)
    const displayLastSeen = netStat && netStat.lastUpdate && netStat.lastUpdate !== '-' 
      ? netStat.lastUpdate 
      : formatLastUpdate(device.lastSeen);
    
    return { 
      ...device, 
      status: realStatus,
      displayLastSeen: displayLastSeen
    };
  });

  // 2. FILTER PENCARIAN (Menggunakan data yang sudah digabung)
  const filteredDevices = devicesWithRealStatus.filter(device => {
    const query = searchQuery.toLowerCase();
    const displayLocation = device.location || 'Unknown';
    return (
      device.name.toLowerCase().includes(query) ||
      device.type.toLowerCase().includes(query) ||
      displayLocation.toLowerCase().includes(query) ||
      (device.ip && device.ip.includes(query))
    );
  });

  if (loading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-600 dark:text-zinc-500">Loading devices...</p>
          </div>
        </div>
      </PageContainer>
    );
  }

  // Hitung jumlah online dan offline yang asli
  const onlineCount = filteredDevices.filter(d => d.status === 'online').length;
  const offlineCount = filteredDevices.filter(d => d.status === 'offline').length;

  return (
    <PageContainer>
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-zinc-100 mb-2">Devices</h1>
        <p className="text-slate-600 dark:text-zinc-500">Manage and monitor all network devices</p>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-800 rounded-lg p-4 shadow-sm">
          <p className="text-sm text-slate-600 dark:text-zinc-500 mb-1">Total Devices</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-zinc-100">{filteredDevices.length}</p>
        </div>
        <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-300 dark:border-emerald-500/30 rounded-lg p-4 shadow-sm">
          <p className="text-sm text-slate-600 dark:text-zinc-500 mb-1">Online</p>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{onlineCount}</p>
        </div>
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-300 dark:border-red-500/30 rounded-lg p-4 shadow-sm">
          <p className="text-sm text-slate-600 dark:text-zinc-500 mb-1">Offline</p>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400">{offlineCount}</p>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 dark:text-zinc-500" />
          <input
            type="text"
            placeholder="Search by name, type, location, or IP..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-100 dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 rounded-lg text-sm text-slate-900 dark:text-zinc-200 placeholder:text-slate-500 dark:placeholder:text-zinc-500 focus:outline-none focus:border-yellow-400/50 focus:ring-1 focus:ring-yellow-400/20"
          />
        </div>

        {/* View Toggle */}
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('table')}
            className={`px-4 py-2.5 rounded-lg border transition-colors ${
              viewMode === 'table'
                ? 'bg-yellow-400 text-zinc-900 border-yellow-400'
                : 'bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-400 border-slate-300 dark:border-zinc-700 hover:border-slate-400 dark:hover:border-zinc-600'
            }`}
          >
            <List className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`px-4 py-2.5 rounded-lg border transition-colors ${
              viewMode === 'grid'
                ? 'bg-yellow-400 text-zinc-900 border-yellow-400'
                : 'bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-400 border-slate-300 dark:border-zinc-700 hover:border-slate-400 dark:hover:border-zinc-600'
            }`}
          >
            <Grid3x3 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Devices Display */}
      {filteredDevices.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-800 rounded-lg p-12 text-center shadow-sm">
          <p className="text-slate-600 dark:text-zinc-500">No devices found matching your search.</p>
        </div>
      ) : viewMode === 'grid' ? (
        /* Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDevices.map((device) => (
            <DeviceStatusCard 
              key={device.id} 
              device={device} 
              displayLocation={device.location}
              onLocationSave={async (newLoc) => {
                if(updateLocation) await updateLocation(device.id, newLoc);
              }}
            />
          ))}
        </div>
      ) : (
        /* Table View */
        <div className="bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-800 rounded-lg overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-100 dark:bg-zinc-800 border-b border-slate-300 dark:border-zinc-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 dark:text-zinc-400 uppercase tracking-wider">
                    Device
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 dark:text-zinc-400 uppercase tracking-wider">
                    IP Address
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 dark:text-zinc-400 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 dark:text-zinc-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 dark:text-zinc-400 uppercase tracking-wider">
                    Last Update
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-zinc-800">
                {filteredDevices.map((device) => (
                  <tr key={device.id} className="hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-slate-900 dark:text-zinc-100">{device.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-mono text-slate-700 dark:text-zinc-400">{device.ip}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <LocationEdit
                        deviceId={device.id}
                        initialLocation={device.location}
                        onSave={async (newLoc) => {
                          if(updateLocation) await updateLocation(device.id, newLoc);
                        }}
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                          className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                            device.status === 'online'
                              ? 'bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/30'
                              : 'bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400 border border-red-300 dark:border-red-500/30'
                          }`}
                      >
                        {device.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-600 dark:text-zinc-500">
                        {device.displayLastSeen}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </PageContainer>
  );
}