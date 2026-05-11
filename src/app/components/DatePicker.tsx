import { Calendar } from 'lucide-react';

interface DatePickerProps {
  value: string;
  onChange: (value: string) => void;
  label: string;
}

export function DatePicker({ value, onChange, label }: DatePickerProps) {
  return (
    <div className="flex items-center gap-2">
      {label && <label className="text-xs font-medium text-slate-700 dark:text-zinc-400">{label}:</label>}
      <div className="relative">
        <input
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="appearance-none block w-full pl-3 pr-8 py-1.5 bg-white dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 rounded-md text-xs text-slate-900 dark:text-zinc-200 shadow-sm focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500/50 transition-colors [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer"
        />
        <Calendar className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 dark:text-zinc-400 pointer-events-none" />
      </div>
    </div>
  );
}
