import React, { useState } from 'react';
import { LogIn, Loader2, MessageSquare } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Preencha todos os campos.');
      return;
    }

    setIsLoading(true);
    setError('');

    const rawUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
    const API_URL = rawUrl.replace(/\/$/, '').replace('163.176.37.93:3001', '163.176.37.93:8080');
    try {
      const response = await fetch(`/api-proxy/api/auth/login`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-target-url': API_URL
        },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao fazer login');
      }

      login(data.token, data.user);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen font-sans text-white bg-black overflow-x-hidden flex items-center justify-center p-4">
      {/* Background Video with Gradient Overlay */}
      <div className="fixed inset-0 z-0">
        <video 
          autoPlay 
          loop 
          muted 
          playsInline
          className="w-full h-full object-cover opacity-50 mix-blend-luminosity"
          src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260315_073750_51473149-4350-4920-ae24-c8214286f323.mp4"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/90 pointer-events-none"></div>
      </div>

      <div className="w-full max-w-md relative z-10 flex flex-col items-center">
        {/* Header / Logo */}
        <div className="flex items-center gap-3 mb-10">
          <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.2)]">
            <MessageSquare size={22} className="text-black" fill="currentColor" />
          </div>
          <span className="font-semibold text-3xl tracking-tighter text-white">WhatsApp <span className="font-light opacity-50">Bulk</span></span>
        </div>

        <div className="liquid-panel rounded-[2rem] p-8 lg:p-10 w-full space-y-6 relative overflow-hidden backdrop-blur-2xl border border-white/10 bg-white/5 shadow-2xl">
          {error && (
            <div className="p-4 liquid-glass border border-red-500/30 bg-red-500/10 text-red-200 rounded-2xl text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-xs font-medium text-white/60 uppercase tracking-wider mb-2 ml-1">Usuário</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-white/30 transition-all font-medium text-lg placeholder-white/20"
                placeholder="Seu usuário"
              />
            </div>
            
            <div>
              <label className="block text-xs font-medium text-white/60 uppercase tracking-wider mb-2 ml-1">Senha</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-white/30 transition-all font-medium text-lg placeholder-white/20"
                placeholder="Sua senha"
              />
            </div>

            <button 
              type="submit"
              disabled={isLoading}
              className="w-full bg-white text-black hover:bg-white/90 rounded-2xl px-8 py-4 flex items-center justify-center gap-3 transition-all font-semibold shadow-[0_0_20px_rgba(255,255,255,0.2)] disabled:opacity-50 mt-4"
            >
              {isLoading ? (
                <>
                  <Loader2 size={20} className="animate-spin text-black" />
                  Conectando...
                </>
              ) : (
                <>
                  <LogIn size={20} className="text-black" />
                  Acessar Painel
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
