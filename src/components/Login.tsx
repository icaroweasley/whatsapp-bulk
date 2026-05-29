import React, { useState } from 'react';
import { LogIn, Loader2, MessageSquare, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface LoginProps {
  onBack?: () => void;
}

export default function Login({ onBack }: LoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Preencha todos os campos.');
      return;
    }

    if (isRegistering && password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const endpoint = isRegistering ? '/api/auth/register' : '/api/auth/login';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro na operação');
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
        <div className="flex flex-col items-center gap-2 mb-10">
          <div className="w-28 h-28 flex items-center justify-center drop-shadow-[0_0_20px_rgba(34,197,94,0.4)]">
            <img src="/logo.png" alt="WhatsApp Bulk Logo" className="w-full h-full object-contain" />
          </div>
          <span className="font-semibold text-3xl tracking-tighter text-white">WhatsApp <span className="font-light opacity-50">Bulk</span></span>
        </div>

        <div className="liquid-panel rounded-[2rem] p-8 lg:p-10 w-full space-y-6 relative overflow-hidden backdrop-blur-2xl border border-white/10 bg-white/5 shadow-2xl">
          {onBack && (
            <button 
              onClick={onBack}
              className="absolute top-6 left-6 text-white/40 hover:text-white text-sm flex items-center gap-2 transition-colors font-medium"
            >
              ← Voltar
            </button>
          )}

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
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl pl-5 pr-12 py-4 text-white focus:outline-none focus:ring-2 focus:ring-white/30 transition-all font-medium text-lg placeholder-white/20"
                  placeholder="Sua senha"
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {isRegistering && (
              <div>
                <label className="block text-xs font-medium text-white/60 uppercase tracking-wider mb-2 ml-1">Confirmar Senha</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl pl-5 pr-12 py-4 text-white focus:outline-none focus:ring-2 focus:ring-white/30 transition-all font-medium text-lg placeholder-white/20"
                    placeholder="Repita sua senha"
                  />
                </div>
              </div>
            )}

            <button 
              type="submit"
              disabled={isLoading}
              className="w-full bg-white text-black hover:bg-white/90 rounded-2xl px-8 py-4 flex items-center justify-center gap-3 transition-all font-semibold shadow-[0_0_20px_rgba(255,255,255,0.2)] disabled:opacity-50 mt-4"
            >
              {isLoading ? (
                <>
                  <Loader2 size={20} className="animate-spin text-black" />
                  {isRegistering ? 'Criando conta...' : 'Conectando...'}
                </>
              ) : (
                <>
                  <LogIn size={20} className="text-black" />
                  {isRegistering ? 'Criar Conta' : 'Acessar Painel'}
                </>
              )}
            </button>
          </form>

          <div className="text-center mt-6">
            <button 
              onClick={() => setIsRegistering(!isRegistering)}
              className="text-white/60 hover:text-white transition-colors text-sm font-medium"
            >
              {isRegistering ? 'Já tem uma conta? Faça login' : 'Ainda não tem conta? Crie uma aqui'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
