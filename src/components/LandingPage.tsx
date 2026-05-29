import React from 'react';
import { Rocket, Users, MessageSquare, Database, ArrowRight } from 'lucide-react';

interface LandingPageProps {
  onLoginClick: () => void;
}

export default function LandingPage({ onLoginClick }: LandingPageProps) {
  return (
    <div className="relative min-h-screen font-sans text-white bg-transparent overflow-x-hidden selection:bg-emerald-500/30">
      {/* ChatPulse Aesthetic Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[#0a0a0f]"></div>
        <div className="absolute top-[-10%] left-[-5%] w-[600px] h-[600px] bg-purple-600/40 rounded-full blur-[120px] animate-blob"></div>
        <div className="absolute top-[30%] right-[-10%] w-[700px] h-[700px] bg-emerald-500/30 rounded-full blur-[150px] animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-[-10%] left-[10%] w-[500px] h-[500px] bg-blue-600/30 rounded-full blur-[120px] animate-blob animation-delay-4000"></div>
        <div className="absolute inset-0 bg-black/40 backdrop-blur-3xl"></div>
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
      <main className="relative z-10 w-full max-w-7xl mx-auto px-6 pt-20 pb-20 flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-white/70 text-xs font-medium uppercase tracking-widest mb-8 backdrop-blur-md">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          Plataforma de Relacionamento Inteligente
        </div>
        
        <h1 className="text-5xl md:text-7xl lg:text-8xl font-medium tracking-tight mb-8 leading-[1.1]">
          Escale sua comunicação <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-white to-purple-400">
            e fidelize clientes.
          </span>
        </h1>
        
        <p className="text-lg md:text-xl text-white/50 max-w-2xl mb-12 leading-relaxed">
          Nossa plataforma permite gerenciar campanhas no WhatsApp com envio humanizado, personalização em massa e infraestrutura robusta para potencializar o marketing da sua empresa.
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
      <section className="relative z-10 w-full max-w-7xl mx-auto px-6 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <div className="liquid-panel rounded-[2rem] p-8 border border-white/10 bg-white/5 backdrop-blur-xl hover:-translate-y-2 transition-transform duration-500 group">
            <div className="w-14 h-14 rounded-full bg-purple-500/10 text-purple-400 flex items-center justify-center mb-6 group-hover:bg-purple-500 group-hover:text-white transition-colors duration-500">
              <MessageSquare size={24} />
            </div>
            <h3 className="text-xl font-semibold mb-3">Envio Humanizado</h3>
            <p className="text-white/50 leading-relaxed text-sm">
              Nossa tecnologia simula o comportamento humano, criando pausas inteligentes e naturais entre as mensagens para garantir uma comunicação fluida e segura.
            </p>
          </div>

          <div className="liquid-panel rounded-[2rem] p-8 border border-white/10 bg-white/5 backdrop-blur-xl hover:-translate-y-2 transition-transform duration-500 group">
            <div className="w-14 h-14 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-6 group-hover:bg-emerald-500 group-hover:text-white transition-colors duration-500">
              <Database size={24} />
            </div>
            <h3 className="text-xl font-semibold mb-3">Infraestrutura Dedicada</h3>
            <p className="text-white/50 leading-relaxed text-sm">
              Conexão 100% em nuvem. Você autêntica o seu dispositivo via QR Code no nosso painel de controle e nós processamos os envios na nossa infraestrutura fechada.
            </p>
          </div>

          <div className="liquid-panel rounded-[2rem] p-8 border border-white/10 bg-white/5 backdrop-blur-xl hover:-translate-y-2 transition-transform duration-500 group">
            <div className="w-14 h-14 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center mb-6 group-hover:bg-blue-500 group-hover:text-white transition-colors duration-500">
              <Users size={24} />
            </div>
            <h3 className="text-xl font-semibold mb-3">Personalização Total</h3>
            <p className="text-white/50 leading-relaxed text-sm">
              Torne a comunicação única! Utilize variáveis customizadas (como Nome e Produto) da sua lista de clientes para enviar mensagens altamente engajadoras.
            </p>
          </div>

        </div>
      </section>

      {/* Showcase Section */}
      <section className="relative z-10 w-full max-w-7xl mx-auto px-6 pb-32">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-5xl font-medium tracking-tight mb-4">Veja na prática</h2>
          <p className="text-white/50 max-w-2xl mx-auto">Uma interface limpa e intuitiva, desenhada para focar nos resultados das suas campanhas.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="relative group rounded-3xl overflow-hidden shadow-2xl border border-white/10">
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent z-10"></div>
            <img 
              src="/mockup-1.png" 
              alt="Dashboard de Marketing" 
              className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute bottom-0 left-0 p-8 z-20">
              <h3 className="text-2xl font-semibold mb-2">Painel de Controle</h3>
              <p className="text-white/70 text-sm">Gerencie suas listas e instâncias em um só lugar.</p>
            </div>
          </div>

          <div className="relative group rounded-3xl overflow-hidden shadow-2xl border border-white/10">
             <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent z-10"></div>
            <img 
              src="/mockup-2.png" 
              alt="Automação de Mensagens" 
              className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute bottom-0 left-0 p-8 z-20">
              <h3 className="text-2xl font-semibold mb-2">Editor de Campanhas</h3>
              <p className="text-white/70 text-sm">Insira mídias, textos personalizados e acompanhe o progresso.</p>
            </div>
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
