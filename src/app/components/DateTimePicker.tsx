import { useState, useRef, useEffect } from 'react';
import { Calendar } from 'lucide-react';
import { format } from 'date-fns';

interface DateTimePickerProps {
  value: string;
  onChange: (value: string) => void;
  label: string;
}

export function DateTimePicker({ value, onChange, label }: DateTimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [tempDate, setTempDate] = useState('');
  const [tempTime, setTempTime] = useState('');
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value) {
      const [datePart, timePart] = value.split('T');
      setTempDate(datePart || '');
      setTempTime(timePart || '');
    }
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleOK = () => {
    if (tempDate && tempTime) {
      onChange(`${tempDate}T${tempTime}`);
      setIsOpen(false);
    }
  };

  const handleToday = () => {
    const now = new Date();
    const date = format(now, 'yyyy-MM-dd');
    const time = format(now, 'HH:mm');
    setTempDate(date);
    setTempTime(time);
  };

  const handleClear = () => {
    setTempDate('');
    setTempTime('');
  };

  const displayValue = value
    ? (() => {
        try {
          const date = new Date(value);
          return format(date, 'dd/MM/yyyy HH:mm');
        } catch {
          return '';
        }
      })()
    : '';

  return (
    <div className="relative" ref={pickerRef}>
      {/* Label */}
      <label className="text-xs text-zinc-400 mb-1 block">{label}:</label>
      
      {/* Input Display */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-1.5 bg-zinc-700 border border-zinc-600 rounded text-xs text-zinc-200 focus:outline-none focus:border-yellow-400/50 focus:ring-1 focus:ring-yellow-400/20 flex items-center justify-between hover:bg-zinc-600 transition-colors"
      >
        <span className={displayValue ? 'text-zinc-200' : 'text-zinc-500'}>
          {displayValue || 'Pilih tanggal & waktu'}
        </span>
        <Calendar className="w-3 h-3 text-zinc-400" />
      </button>

      {/* Picker Popup */}
      {isOpen && (
        <div className="absolute z-50 mt-1 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl p-4 min-w-[280px]">
          {/* Date Input */}
          <div className="mb-3">
            <label className="text-xs text-zinc-400 mb-1 block">Tanggal</label>
            <input
              type="date"
              value={tempDate}
              onChange={(e) => setTempDate(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-700 border border-zinc-600 rounded text-sm text-zinc-200 focus:outline-none focus:border-yellow-400/50 focus:ring-1 focus:ring-yellow-400/20"
            />
          </div>

          {/* Time Input */}
          <div className="mb-4">
            <label className="text-xs text-zinc-400 mb-1 block">Waktu</label>
            <input
              type="time"
              value={tempTime}
              onChange={(e) => setTempTime(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-700 border border-zinc-600 rounded text-sm text-zinc-200 focus:outline-none focus:border-yellow-400/50 focus:ring-1 focus:ring-yellow-400/20"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 mb-3">
            <button
              type="button"
              onClick={handleToday}
              className="flex-1 px-3 py-1.5 bg-zinc-700 hover:bg-zinc-600 text-zinc-300 rounded text-xs font-medium transition-colors"
            >
              Today
            </button>
            <button
              type="button"
              onClick={handleClear}
              className="flex-1 px-3 py-1.5 bg-zinc-700 hover:bg-zinc-600 text-zinc-300 rounded text-xs font-medium transition-colors"
            >
              Clear
            </button>
          </div>

          {/* OK Button */}
          <button
            type="button"
            onClick={handleOK}
            disabled={!tempDate || !tempTime}
            className="w-full px-4 py-2 bg-yellow-400 hover:bg-yellow-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-zinc-900 rounded text-sm font-medium transition-colors"
          >
            OK
          </button>
        </div>
      )}
    </div>
  );
}
