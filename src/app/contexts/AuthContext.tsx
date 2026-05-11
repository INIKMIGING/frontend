import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import apiClient from '../services/apiClient';
import { ENDPOINTS } from '../services/endpoints';

interface AuthContextType {
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    // Mengecek apakah user sebelumnya sudah login
    const stored = localStorage.getItem('network-monitor-auth');
    return stored === 'true';
  });

  useEffect(() => {
    // Sinkronisasi status login ke localStorage
    localStorage.setItem('network-monitor-auth', String(isAuthenticated));
  }, [isAuthenticated]);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      console.log("1. Mengirim data login ke server...");
      
      // PERUBAHAN FINAL: Kita taruh data di "params" agar otomatis jadi URL Query
      // (?username=admin&password=admin123)
      const response = await apiClient.post(ENDPOINTS.LOGIN, null, {
        params: {
          username: username,
          password: password
        }
      });

      console.log("2. Berhasil! Balasan dari server:", response.data);

      if (response.data && response.data.access_token) {
        console.log("3. Token didapatkan! Menyimpan ke kantong...");
        localStorage.setItem('token', response.data.access_token);
        localStorage.setItem('username', username); 
        setIsAuthenticated(true);
        return true;
      } else {
        console.log("3. Login sukses tapi tidak ada token.");
        setIsAuthenticated(true);
        return true;
      }
    } catch (error: any) {
      console.error('X. Gagal Login!');
      if (error.response) {
        console.error('Pesan dari Backend:', JSON.stringify(error.response.data, null, 2));
      }
      return false;
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('network-monitor-auth');
    localStorage.removeItem('token');
    localStorage.removeItem('username');
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}