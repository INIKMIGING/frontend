import { LocationEdit } from '../LocationEdit';

export function DeviceStatusCard({ device, onClick, displayLocation, onLocationSave }) {
  const statusConfig = {
    online: {
      color: 'bg-emerald-500 dark:bg-emerald-400',
      borderColor: 'border-emerald-300 dark:border-emerald-500/30',
      bgColor: 'bg-emerald-50 dark:bg-emerald-950/20',
      textColor: 'text-emerald-700 dark:text-emerald-400',
    },
    offline: {
      color: 'bg-red-500',
      borderColor: 'border-red-300 dark:border-red-500/30',
      bgColor: 'bg-red-50 dark:bg-red-950/20',
      textColor: 'text-red-700 dark:text-red-400',
    },
  };

  const config = statusConfig[device.status] || statusConfig.offline;

  // Format last update helper
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

  return (
    <div
      onClick={onClick}
      className={`p-5 rounded-lg border ${config.borderColor} ${config.bgColor} hover:bg-slate-100 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer shadow-sm`}
    >
      {/* UBAH DI SINI: Tambah gap-2, flex-1 min-w-0, truncate, shrink-0, dan title */}
      <div className="flex items-start justify-between mb-4 gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-slate-900 dark:text-zinc-100 truncate" title={device.name}>
            {device.name}
          </h3>
        </div>
        <div className={`px-2.5 py-1 rounded-full text-xs font-medium shrink-0 ${config.bgColor} ${config.textColor} border ${config.borderColor}`}>
          {device.status}
        </div>
      </div>
      
      <div className="space-y-2 text-sm">
        <div className="flex justify-between items-center">
          <span className="text-slate-600 dark:text-zinc-500">Location:</span>
          <span className="text-slate-800 dark:text-zinc-300" onClick={(e) => e.stopPropagation()}>
            {displayLocation !== undefined ? (
              <LocationEdit 
                deviceId={device.id} 
                initialLocation={displayLocation} 
                onSave={onLocationSave}
                align="right" 
              />
            ) : (
              device.location
            )}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-600 dark:text-zinc-500">IP Address:</span>
          <span className="text-slate-800 dark:text-zinc-300 font-mono text-xs">{device.ip}</span>
        </div>
      </div>
      
      <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-300 dark:border-zinc-700">
        <div className={`w-2 h-2 rounded-full ${config.color} animate-pulse`}></div>
        <span className="text-xs text-slate-600 dark:text-zinc-500">
          Last update: {device.displayLastSeen || formatLastUpdate(device.lastSeen)}
        </span>
      </div>
    </div>
  );
}