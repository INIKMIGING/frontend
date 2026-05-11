import { Bell, User, Search, Sun, Moon, LogOut } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router';
import { useState } from 'react';

export function Topbar() {
  const { theme, setTheme } = useTheme();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [showLogoutMenu, setShowLogoutMenu] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="h-16 bg-white dark:bg-zinc-900 border-b border-slate-300 dark:border-zinc-800 flex items-center justify-between px-6 shadow-sm">
      {/* Search Bar */}
      <div className="flex-1 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 dark:text-zinc-500" />
          <input
            type="text"
            placeholder="Search devices, metrics..."
            className="w-full pl-10 pr-4 py-2 bg-slate-100 dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 rounded-lg text-sm text-slate-900 dark:text-zinc-200 placeholder:text-slate-500 dark:placeholder:text-zinc-500 focus:outline-none focus:border-yellow-400/50 focus:ring-1 focus:ring-yellow-400/20"
          />
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-4">
        {/* Theme Toggle */}
        <button 
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="p-2 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
          title="Toggle theme"
        >
          {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        {/* Notifications */}
        <button className="relative p-2 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>

        {/* User Profile */}
        <div className="relative flex items-center gap-3 pl-4 border-l border-slate-300 dark:border-zinc-700">
          <div className="text-right">
            <p className="text-sm font-medium text-slate-900 dark:text-zinc-200">NOC Operator</p>
            <p className="text-xs text-slate-600 dark:text-zinc-500">Administrator</p>
          </div>
          <button
            onClick={() => setShowLogoutMenu(!showLogoutMenu)}
            className="w-9 h-9 bg-yellow-400 rounded-full flex items-center justify-center hover:bg-yellow-500 transition-colors"
          >
            <User className="w-5 h-5 text-zinc-900" />
          </button>
          
          {/* Logout Dropdown */}
          {showLogoutMenu && (
            <>
              <div 
                className="fixed inset-0 z-10" 
                onClick={() => setShowLogoutMenu(false)}
              ></div>
              <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-800 rounded-lg shadow-xl z-20 py-1">
                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-2.5 text-left flex items-center gap-3 text-slate-700 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="text-sm font-medium">Sign Out</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}