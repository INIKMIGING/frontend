import { TrendingUp, TrendingDown } from 'lucide-react';

export function MetricCard({ title, value, unit, icon: Icon, trend, trendValue, status = 'normal' }) {
  const statusColors = {
    normal: 'border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900',
    success: 'border-emerald-300 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/20',
    warning: 'border-yellow-300 dark:border-yellow-500/30 bg-yellow-50 dark:bg-yellow-950/20',
    danger: 'border-red-300 dark:border-red-500/30 bg-red-50 dark:bg-red-950/20',
  };

  const iconColors = {
    normal: 'text-slate-700 dark:text-zinc-400',
    success: 'text-emerald-600 dark:text-emerald-400',
    warning: 'text-yellow-600 dark:text-yellow-400',
    danger: 'text-red-600 dark:text-red-400',
  };

  return (
    <div className={`p-6 rounded-lg border ${statusColors[status]} shadow-sm`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-slate-600 dark:text-zinc-500 mb-1">{title}</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900 dark:text-zinc-100">
              {value}
            </span>
            {unit && (
              <span className="text-lg text-slate-700 dark:text-zinc-400">{unit}</span>
            )}
          </div>
          
          {trend && trendValue && (
            <div className="flex items-center gap-1 mt-2">
              {trend === 'up' ? (
                <TrendingUp className="w-4 h-4 text-emerald-400" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-400" />
              )}
              <span className={`text-sm ${trend === 'up' ? 'text-emerald-400' : 'text-red-400'}`}>
                {trendValue}
              </span>
            </div>
          )}
        </div>
        
        {Icon && (
          <div className={`p-3 rounded-lg bg-slate-100 dark:bg-zinc-800 ${iconColors[status]}`}>
            <Icon className="w-6 h-6" />
          </div>
        )}
      </div>
    </div>
  );
}