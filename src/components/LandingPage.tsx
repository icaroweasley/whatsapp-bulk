import React from 'react';
import { Rocket, ShieldCheck, Zap, Database, ArrowRight } from 'lucide-react';

interface LandingPageProps {
  onLoginClick: () => void;
}

export default function LandingPage({ onLoginClick }: LandingPageProps) {
  return (
    <div className="relative min-h-screen font-sans text-white bg-black overflow-x-hidden selection:bg-purple-500/30">
      {/* Background Video with Gradient Overlay */}
      <div className="fixed inset-0 z-0">
        <video 
          autoPlay 
          loop 
          muted 
          playsInline
          className="w-full h-full object-cover opacity-40 mix-blend-luminosity"
          src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260315_073750_51473149-4350-4920-ae24-c8214286f323.mp4"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/60 to-black pointer-events-none"></div>
        {/* Glow Effects */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-600/20 rounded-full blur-[120px] pointer-events-none"></div>
      </div>

      {/* Navbar */}
      <nav className="relative z-10 w-full max-w-7xl mx-auto px-6 py-8 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 flex items-center justify-center drop-shadow-[0_0_15px_rgba(34,197,94,0.4)]">
            <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
          </div>
          <span className="font-semibold text-xl tracking-tighter text-white">WhatsApp <span className="font-light opacity-50">Bulk</span></span>
        </div>
        <button 
          onClick={onLoginClick}
          className="liquid-glass border border-white/10 text-white rounded-full px-6 py-2.5 text-sm font-semibold hover:bg-white/10 transition-colors shadow-[0_0_15px_rgba(255,255,255,0.05)]"
        >
          Área do Cliente
        </button>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 w-full max-w-7xl mx-auto px-6 pt-20 pb-32 flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-white/70 text-xs font-medium uppercase tracking-widest mb-8 backdrop-blur-md">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          Tecnologia Evolution API v2
        </div>
        
        <h1 className="text-5xl md:text-7xl lg:text-8xl font-medium tracking-tight mb-8 leading-[1.1]">
          Disparos em massa com <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-white to-purple-400">
            tecnologia anti-ban.
          </span>
        </h1>
        
        <p className="text-lg md:text-xl text-white/50 max-w-2xl mb-12 leading-relaxed">
          Escale suas vendas no WhatsApp sem perder números. Sistema focado na API oficial não-documentada, delay orgânico inteligente e infraestrutura robusta na nuvem.
        </p>

        <button 
          onClick={onLoginClick}
          className="group relative bg-white text-black rounded-full px-10 py-5 text-lg font-semibold hover:scale-105 transition-all shadow-[0_0_40px_rgba(255,255,255,0.3)] flex items-center gap-3 overflow-hidden"
        >
          <span className="relative z-10">Começar Agora</span>
          <ArrowRight className="relative z-10 group-hover:translate-x-1 transition-transform" />
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-200 to-purple-200 opacity-0 group-hover:opacity-100 transition-opacity"></div>
        </button>
      </main>

      {/* Features Grid */}
      <section className="relative z-10 w-full max-w-7xl mx-auto px-6 pb-32">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          <div className="liquid-panel rounded-[2rem] p-8 border border-white/10 bg-white/5 backdrop-blur-xl hover:-translate-y-2 transition-transform duration-500 group">
            <div className="w-14 h-14 rounded-full bg-purple-500/10 text-purple-400 flex items-center justify-center mb-6 group-hover:bg-purple-500 group-hover:text-white transition-colors duration-500">
              <Zap size={24} />
            </div>
            <h3 className="text-xl font-semibold mb-3">Delay Orgânico</h3>
            <p className="text-white/50 leading-relaxed text-sm">
              Nossa tecnologia simula a digitação humana de forma aleatória e injeta pausas entre os envios para evitar punições e proteger suas instâncias.
            </p>
          </div>

          <div className="liquid-panel rounded-[2rem] p-8 border border-white/10 bg-white/5 backdrop-blur-xl hover:-translate-y-2 transition-transform duration-500 group">
            <div className="w-14 h-14 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-6 group-hover:bg-emerald-500 group-hover:text-white transition-colors duration-500">
              <ShieldCheck size={24} />
            </div>
            <h3 className="text-xl font-semibold mb-3">Conexão Estável</h3>
            <p className="text-white/50 leading-relaxed text-sm">
              Use a Evolution API v2 para se manter online. Autenticação rápida via QR Code diretamente no painel e disparos processados na nossa VPS exclusiva.
            </p>
          </div>

          <div className="liquid-panel rounded-[2rem] p-8 border border-white/10 bg-white/5 backdrop-blur-xl hover:-translate-y-2 transition-transform duration-500 group">
            <div className="w-14 h-14 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center mb-6 group-hover:bg-blue-500 group-hover:text-white transition-colors duration-500">
              <Database size={24} />
            </div>
            <h3 className="text-xl font-semibold mb-3">Variáveis Dinâmicas</h3>
            <p className="text-white/50 leading-relaxed text-sm">
              Personalize cada mensagem com as variáveis da sua lista (como nome, produto, etc). Seus clientes sentem que você está falando diretamente com eles.
            </p>
          </div>

        </div>
      </section>
      
      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10 text-center py-10 text-white/30 text-sm">
        <p>© {new Date().getFullYear()} WhatsApp Bulk Pro. Desenvolvido para máxima conversão.</p>
      </footer>
    </div>
  );
}
