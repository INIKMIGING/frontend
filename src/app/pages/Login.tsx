import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { Eye, EyeOff, Lock, User } from 'lucide-react';

export function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!username || !password) {
      setError('Please enter both username and password');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const success = await login(username, password);
      if (success) {
        navigate('/dashboard');
      } else {
        setError('Invalid credentials. Please try again.');
      }
    } catch (err) {
      setError('An error occurred while communicating with the server.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-zinc-950 dark:to-zinc-900 p-4">
      {/* Login Card */}
      <div className="w-full max-w-md">
        {/* Card Container */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-zinc-800 overflow-hidden">
          
          {/* Yellow Accent Strip */}
          <div className="h-2 bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-400"></div>
          
          {/* Card Content */}
          <div className="p-8">
            
            {/* Logo & Title Section */}
            <div className="text-center mb-8">
              
              {/* Indosat Logo Section with Dual Theme Support */}
              <div className="flex justify-center mb-6">
                <img 
                  src="/logo-indosat.png" 
                  alt="Indosat Logo" 
                  className="h-16 w-auto object-contain translate-x-3 block dark:hidden"
                />
                <img 
                  src="/logo-indosat-dark.png" 
                  alt="Indosat Logo Dark" 
                  className="h-20 w-auto object-contain hidden dark:block"
                />
              </div>
              
              <h1 className="text-2xl font-bold text-slate-900 dark:text-zinc-100 mb-2">
                Network Monitoring System
              </h1>
              <p className="text-sm text-slate-600 dark:text-zinc-500">
                NOC Operator Login
              </p>
            </div>

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              
              {/* Username Field */}
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-slate-700 dark:text-zinc-400 mb-2">
                  Username
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2">
                    <User className="w-5 h-5 text-slate-400 dark:text-zinc-600" />
                  </div>
                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your username"
                    disabled={isLoading}
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 rounded-lg text-slate-900 dark:text-zinc-200 placeholder:text-slate-400 dark:placeholder:text-zinc-600 focus:outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-slate-700 dark:text-zinc-400 mb-2">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2">
                    <Lock className="w-5 h-5 text-slate-400 dark:text-zinc-600" />
                  </div>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    disabled={isLoading}
                    className="w-full pl-11 pr-12 py-3 bg-slate-50 dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 rounded-lg text-slate-900 dark:text-zinc-200 placeholder:text-slate-400 dark:placeholder:text-zinc-600 focus:outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-zinc-600 dark:hover:text-zinc-400 disabled:opacity-50 transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 dark:bg-red-950/20 border border-red-300 dark:border-red-500/30 rounded-lg p-3">
                  <p className="text-sm text-red-700 dark:text-red-400 text-center">
                    {error}
                  </p>
                </div>
              )}

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    disabled={isLoading}
                    className="w-4 h-4 rounded border-slate-300 dark:border-zinc-700 text-yellow-500 focus:ring-yellow-400 focus:ring-offset-0 disabled:opacity-50"
                  />
                  <span className="ml-2 text-slate-700 dark:text-zinc-400">Remember me</span>
                </label>
                <button
                  type="button"
                  disabled={isLoading}
                  className="text-yellow-600 dark:text-yellow-400 hover:text-yellow-700 dark:hover:text-yellow-300 font-medium disabled:opacity-50 transition-colors"
                >
                  Forgot password?
                </button>
              </div>

              {/* Login Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 bg-yellow-400 hover:bg-yellow-500 active:bg-yellow-600 text-zinc-900 font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-yellow-400/20 hover:shadow-xl hover:shadow-yellow-400/30"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-3 border-zinc-900 border-t-transparent rounded-full animate-spin"></div>
                    <span>Signing in...</span>
                  </div>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>

            {/* Footer Note */}
            <div className="mt-6 pt-6 border-t border-slate-200 dark:border-zinc-800">
              <p className="text-xs text-center text-slate-500 dark:text-zinc-600">
                © 2026 Indosat Network Operations Center
              </p>
            </div>
          </div>
        </div>

        {/* Real Credentials Hint */}
        <div className="mt-4 bg-slate-200/50 dark:bg-zinc-800/50 backdrop-blur-sm rounded-lg p-4 border border-slate-300/50 dark:border-zinc-700/50">
          <p className="text-xs text-slate-600 dark:text-zinc-500 text-center flex flex-col gap-1">
            <span className="font-semibold text-slate-800 dark:text-zinc-300">Authorized Access Only</span>
            <span>Test credentials: admin / admin123</span>
          </p>
        </div>
      </div>
    </div>
  );
}