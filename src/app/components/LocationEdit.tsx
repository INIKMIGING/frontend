import { useState } from 'react';
import { Pencil, Check, X, Loader2 } from 'lucide-react';

interface LocationEditProps {
  deviceId: string | number;
  initialLocation: string;
  onSave: (newLocation: string) => Promise<void>;
  align?: 'left' | 'right'; // Kita tambahkan opsi rata kiri/kanan
}

export function LocationEdit({ deviceId, initialLocation, onSave, align = 'left' }: LocationEditProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [location, setLocation] = useState(initialLocation);
  const [tempLocation, setTempLocation] = useState(initialLocation);
  const [isSaving, setIsSaving] = useState(false);

  // Cek apakah diminta rata kanan
  const isRight = align === 'right';

  const handleEdit = () => {
    setTempLocation(location);
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (tempLocation === location) {
      setIsEditing(false);
      return;
    }
    
    setIsSaving(true);
    try {
      await onSave(tempLocation); 
      setLocation(tempLocation);
      setIsEditing(false);
    } catch (error) {
      console.error("Gagal menyimpan lokasi");
      setTempLocation(location); 
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setTempLocation(location);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className={`flex items-center gap-1 ${isRight ? 'justify-end' : 'justify-start'}`}>
        <input
          type="text"
          value={tempLocation}
          onChange={(e) => setTempLocation(e.target.value)}
          disabled={isSaving}
          className={`px-2 py-0.5 bg-slate-100 dark:bg-zinc-800 border border-slate-300 dark:border-zinc-600 rounded text-xs text-slate-900 dark:text-zinc-200 focus:outline-none focus:border-yellow-400/50 focus:ring-1 focus:ring-yellow-400/20 disabled:opacity-50 ${isRight ? 'text-right' : 'text-left'}`}
          style={{ width: '120px' }}
          autoFocus
        />
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="p-1 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 rounded transition-colors disabled:opacity-50"
          title="Save"
        >
          {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
        </button>
        <button
          onClick={handleCancel}
          disabled={isSaving}
          className="p-1 text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded transition-colors disabled:opacity-50"
          title="Cancel"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-1.5 group ${isRight ? 'justify-end' : 'justify-start'}`}>
      {/* Jika rata kanan, taruh pensil di kiri teks */}
      {isRight && (
        <button
          onClick={handleEdit}
          className="p-0.5 opacity-0 group-hover:opacity-100 text-slate-500 dark:text-zinc-500 hover:text-yellow-500 dark:hover:text-yellow-400 rounded transition-all"
          title="Edit location"
        >
          <Pencil className="w-3 h-3" />
        </button>
      )}
      
      <span className={`text-sm text-slate-700 dark:text-zinc-400 ${isRight ? 'text-right' : 'text-left'}`}>
        {location === "Unknown" || !location ? "Unknown" : location}
      </span>

      {/* Jika rata kiri, taruh pensil di kanan teks */}
      {!isRight && (
        <button
          onClick={handleEdit}
          className="p-0.5 opacity-0 group-hover:opacity-100 text-slate-500 dark:text-zinc-500 hover:text-yellow-500 dark:hover:text-yellow-400 rounded transition-all"
          title="Edit location"
        >
          <Pencil className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}