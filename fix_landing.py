import re

with open('src/components/LandingPage.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Decrease distance and 2. Change text
content = content.replace('pt-20 pb-20 flex flex-col', 'pt-12 pb-20 flex flex-col')
content = content.replace('Plataforma de Relacionamento Inteligente', 'Plataforma de Disparo de Mensagens Inteligente')

# 3. Change "Veja na prática" to Steps 1, 2, 3 and 4. Add "Crie sua conta" button
old_showcase = """      {/* Showcase Section */}
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
      </section>"""

new_showcase = """      {/* Como Funciona Section */}
      <section className="relative z-10 w-full max-w-7xl mx-auto px-6 pb-32">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-5xl font-medium tracking-tight mb-4">Como funciona</h2>
          <p className="text-white/50 max-w-2xl mx-auto">Tudo que você precisa em três passos simples.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="liquid-panel rounded-[2rem] p-10 border border-white/10 bg-white/5 backdrop-blur-xl text-center hover:-translate-y-2 transition-transform duration-500">
             <div className="text-emerald-400 font-bold text-5xl mb-6">1</div>
             <h3 className="text-2xl font-semibold mb-4">Conecte seu WhatsApp</h3>
             <p className="text-white/50 text-sm leading-relaxed">Escaneie o QR Code e conecte o seu aparelho com segurança à nossa infraestrutura otimizada em nuvem.</p>
          </div>
          
          <div className="liquid-panel rounded-[2rem] p-10 border border-white/10 bg-white/5 backdrop-blur-xl text-center hover:-translate-y-2 transition-transform duration-500">
             <div className="text-purple-400 font-bold text-5xl mb-6">2</div>
             <h3 className="text-2xl font-semibold mb-4">Importe seus Contatos</h3>
             <p className="text-white/50 text-sm leading-relaxed">Puxe os contatos diretamente da sua agenda do celular ou crie listas segmentadas específicas para cada campanha.</p>
          </div>
          
          <div className="liquid-panel rounded-[2rem] p-10 border border-white/10 bg-white/5 backdrop-blur-xl text-center hover:-translate-y-2 transition-transform duration-500">
             <div className="text-cyan-400 font-bold text-5xl mb-6">3</div>
             <h3 className="text-2xl font-semibold mb-4">Dispare a Campanha</h3>
             <p className="text-white/50 text-sm leading-relaxed">Escreva a mensagem, anexe mídias, defina um intervalo humano inteligente e deixe o envio rodar no automático.</p>
          </div>
        </div>

        <div className="mt-16 flex justify-center">
          <button 
            onClick={onLoginClick}
            className="group relative bg-white text-black rounded-full px-12 py-5 text-lg font-bold hover:scale-105 transition-all shadow-[0_0_40px_rgba(255,255,255,0.3)] flex items-center gap-3 overflow-hidden"
          >
            <span className="relative z-10">Crie sua conta</span>
            <ArrowRight className="relative z-10 group-hover:translate-x-1 transition-transform" />
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-200 to-purple-200 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          </button>
        </div>
      </section>"""

content = content.replace(old_showcase, new_showcase)

with open('src/components/LandingPage.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
