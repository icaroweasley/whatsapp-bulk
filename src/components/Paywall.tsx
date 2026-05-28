import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Loader2, CheckCircle, Shield, Zap, Lock } from 'lucide-react';

export default function Paywall() {
  const { user, token, logout, refreshUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubscribe = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/payments/checkout`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao gerar checkout.');
      }

      // Redirecionar para o Mercado Pago
      if (data.init_point) {
        window.location.href = data.init_point;
      } else {
        throw new Error('Link de pagamento não recebido.');
      }

    } catch (err: any) {
      setError(err.message);
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
          className="w-full h-full object-cover opacity-30 mix-blend-luminosity"
          src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260315_073750_51473149-4350-4920-ae24-c8214286f323.mp4"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/80 to-black pointer-events-none"></div>
      </div>

      <div className="w-full max-w-4xl relative z-10 flex flex-col lg:flex-row items-center gap-12">
        
        {/* Lado Esquerdo - Info */}
        <div className="flex-1 space-y-6 text-center lg:text-left">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-md mb-4">
            <Lock size={14} className="text-purple-400" />
            <span className="text-xs font-semibold tracking-widest uppercase text-white/80">Acesso Restrito</span>
          </div>
          
          <h1 className="text-5xl lg:text-6xl font-bold tracking-tighter leading-tight">
            Desbloqueie o <br/>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-white/80 to-white/40">
              Poder do Broadcast
            </span>
          </h1>
          
          <p className="text-lg text-white/60 max-w-md mx-auto lg:mx-0">
            Você está a um passo de automatizar seus envios. Assine o plano mensal e tenha acesso instantâneo ao painel.
          </p>

          <div className="space-y-4 pt-4 text-left inline-block lg:block">
            <div className="flex items-center gap-3">
              <CheckCircle size={20} className="text-green-400" />
              <span className="text-white/80">1.000 Disparos por dia garantidos</span>
            </div>
            <div className="flex items-center gap-3">
              <Zap size={20} className="text-yellow-400" />
              <span className="text-white/80">Conexão instantânea via QR Code</span>
            </div>
            <div className="flex items-center gap-3">
              <Shield size={20} className="text-blue-400" />
              <span className="text-white/80">Sistema anti-ban inteligente integrado</span>
            </div>
          </div>
        </div>

        {/* Lado Direito - Card de Pagamento */}
        <div className="w-full max-w-md liquid-panel rounded-[2rem] p-8 relative overflow-hidden backdrop-blur-2xl border border-white/10 bg-white/5 shadow-2xl">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold mb-2">Plano Profissional</h3>
            <div className="text-5xl font-light tracking-tighter">
              R$ {user?.customPrice !== null && user?.customPrice !== undefined ? user.customPrice : '100'}<span className="text-lg text-white/50 font-normal">/mês</span>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 liquid-glass border border-red-500/30 bg-red-500/10 text-red-200 rounded-2xl text-sm text-center">
              {error}
            </div>
          )}

          <button 
            onClick={handleSubscribe}
            disabled={isLoading}
            className="w-full bg-white text-black hover:bg-white/90 rounded-2xl px-8 py-5 flex items-center justify-center gap-3 transition-all font-semibold shadow-[0_0_30px_rgba(255,255,255,0.2)] disabled:opacity-50 text-lg group"
          >
            {isLoading ? (
              <>
                <Loader2 size={24} className="animate-spin text-black" />
                Processando...
              </>
            ) : (
              <>
                Ativar Plano Mensal
                <div className="w-8 h-8 rounded-full bg-black/10 flex items-center justify-center group-hover:translate-x-1 transition-transform">
                  &rarr;
                </div>
              </>
            )}
          </button>

          <button 
            onClick={() => refreshUser()}
            className="w-full mt-3 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-2xl px-8 py-4 flex items-center justify-center gap-2 transition-all font-medium text-sm"
          >
            Já fiz o pagamento (Atualizar)
          </button>

          <p className="text-center text-white/40 text-xs mt-6">
            Pagamento seguro via Mercado Pago. Cancelamento a qualquer momento.
          </p>
          
          <button 
            onClick={logout}
            className="w-full mt-4 py-2 text-white/40 hover:text-white transition-colors text-sm"
          >
            Sair da conta
          </button>
        </div>

      </div>
    </div>
  );
}
