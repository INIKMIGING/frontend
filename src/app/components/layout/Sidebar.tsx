import { useState } from 'react';
import { Link, useLocation } from 'react-router';
import { 
  LayoutDashboard, 
  Cpu, 
  Activity, 
  ChevronDown, 
  ChevronRight 
} from 'lucide-react';

export function Sidebar() {
  const location = useLocation();
  const [monitoringExpanded, setMonitoringExpanded] = useState(true);

  const isActive = (path) => location.pathname === path;
  const isMonitoringActive = location.pathname.startsWith('/monitoring');

  const menuItems = [
    {
      label: 'Dashboard',
      icon: LayoutDashboard,
      path: '/dashboard',
    },
    {
      label: 'Devices',
      icon: Cpu,
      path: '/devices',
    },
  ];

  const monitoringSubItems = [
    { label: 'Network', path: '/monitoring/network' },
    { label: 'Memory', path: '/monitoring/memory' },
    { label: 'CPU', path: '/monitoring/cpu' },
    { label: 'Temperature', path: '/monitoring/temperature' },
  ];

  return (
    <aside className="w-64 bg-white dark:bg-zinc-900 border-r border-slate-300 dark:border-zinc-800 flex flex-col shadow-sm">
      {/* Logo */}
      <div className="p-6 border-b border-slate-300 dark:border-zinc-800">
        <h1 className="text-xl font-bold text-yellow-400">
          Network Monitor
        </h1>
        <p className="text-xs text-slate-500 dark:text-zinc-500 mt-1">NOC Dashboard</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {/* Main Menu Items */}
        {menuItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-lg
                transition-colors duration-150
                ${active 
                  ? 'bg-yellow-400/10 text-yellow-400 border border-yellow-400/20' 
                  : 'text-slate-700 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-zinc-100'
                }
              `}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}

        {/* Monitoring Parent Menu */}
        <div>
          <button
            onClick={() => setMonitoringExpanded(!monitoringExpanded)}
            className={`
              w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg
              transition-colors duration-150
              ${isMonitoringActive 
                ? 'bg-yellow-400/10 text-yellow-400 border border-yellow-400/20' 
                : 'text-slate-700 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-zinc-100'
              }
            `}
          >
            <div className="flex items-center gap-3">
              <Activity className="w-5 h-5" />
              <span className="font-medium">Monitoring</span>
            </div>
            {monitoringExpanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>

          {/* Monitoring Sub-Menu */}
          {monitoringExpanded && (
            <div className="mt-1 ml-4 space-y-1">
              {monitoringSubItems.map((item) => {
                const active = isActive(item.path);
                
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`
                      flex items-center gap-3 px-4 py-2.5 rounded-lg
                      transition-colors duration-150
                      ${active 
                        ? 'bg-yellow-400/10 text-yellow-400 border-l-2 border-yellow-400' 
                        : 'text-slate-600 dark:text-zinc-500 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-800 dark:hover:text-zinc-300 border-l-2 border-slate-300 dark:border-zinc-700'
                      }
                    `}
                  >
                    <span className="text-sm font-medium">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-slate-300 dark:border-zinc-800">
        <div className="text-xs text-slate-500 dark:text-zinc-600">
          <p>© 2026 Network Monitor</p>
          <p className="mt-1">Version 1.0.0</p>
        </div>
      </div>
    </aside>
  );
}