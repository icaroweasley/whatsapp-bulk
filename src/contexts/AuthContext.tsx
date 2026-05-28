import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: string;
  username: string;
  instances: string[];
  planStatus?: string;
  customPrice?: number | null;
  planExpiresAt?: string | null;
  mpCustomerId?: string | null;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  login: () => {},
  logout: () => {},
  refreshUser: async () => {},
  isLoading: true,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('evo_token');
    const storedUser = localStorage.getItem('evo_user');

    if (storedToken && storedUser) {
      setToken(storedToken);
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        localStorage.removeItem('evo_user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('evo_token', newToken);
    localStorage.setItem('evo_user', JSON.stringify(newUser));
    // Remove temporary states that were from local usage
    localStorage.removeItem('evo_instanceName'); 
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('evo_token');
    localStorage.removeItem('evo_user');
    localStorage.removeItem('evo_selectedInstance');
  };

  const refreshUser = async () => {
    if (!token) return;
    try {
      const res = await fetch(`/api/auth/me`, {
        headers: { 
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        localStorage.setItem('evo_user', JSON.stringify(data.user));
      }
    } catch (e) {
      console.error('Erro ao recarregar usuário:', e);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, refreshUser, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
