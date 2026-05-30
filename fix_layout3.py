import re

with open('src/v2/AppV2.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Remove Logo from Sidebar (since we're moving it to the header on mobile)
old_sidebar_logo = '<div className="flex w-10 h-10 md:w-12 md:h-12 md:mb-10 items-center justify-center drop-shadow-[0_0_15px_rgba(34,197,94,0.4)] relative z-10">'
new_sidebar_logo = '<div className="hidden md:flex w-12 h-12 mb-10 items-center justify-center drop-shadow-[0_0_15px_rgba(34,197,94,0.4)] relative z-10">'
content = content.replace(old_sidebar_logo, new_sidebar_logo)

# 2. Add Mobile Header and update Desktop Header
old_header = """            {/* Top Bar */}
            <header className="h-20 border-b border-white/5 shrink-0 flex items-center justify-between px-8 bg-black/10">
              <div className="flex items-center gap-4">
                <span className="font-semibold text-xl tracking-tight text-white">WhatsApp <span className="font-light opacity-50">Bulk</span></span>
                <div className="w-px h-5 bg-white/10 mx-2 hidden sm:block"></div>
                <div className="hidden sm:flex items-center gap-2">
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">{instanceName ? 'CONEXÃO ATIVA' : 'DESCONECTADO'}</span>
                  <span className="text-white/30">|</span>
                  <span className="text-xs font-medium text-white/70">{instanceName ? instanceName : 'Aguardando Dispositivo'}</span>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                {user?.planExpiresAt && (
                  <div className="flex items-center gap-2 mr-2">
                    <span className={`text-[10px] px-2 py-1 rounded font-bold tracking-wide uppercase ${user.mpCustomerId ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'}`}>
                      {user.mpCustomerId ? 'Pro' : 'Trial'}
                    </span>
                    <span className="hidden sm:flex text-[10px] bg-green-500/10 text-green-400 border border-green-500/20 px-2 py-1 rounded items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
                      Vence: {new Date(user.planExpiresAt).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-3 bg-white/5 px-3 py-1.5 rounded-full border border-white/5">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-purple-500 to-blue-500 flex items-center justify-center text-white text-xs font-bold uppercase overflow-hidden">
                     {user?.username?.substring(0, 2)}
                  </div>
                  <span className="text-sm font-semibold pr-2 hidden sm:block">{user?.username}</span>
                </div>
              </div>
            </header>"""

new_headers = """            {/* Desktop Top Bar (Hidden on Mobile) */}
            <header className="hidden md:flex h-20 border-b border-white/5 shrink-0 items-center justify-between px-8 bg-black/10">
              <div className="flex items-center gap-4">
                <span className="font-semibold text-xl tracking-tight text-white">WhatsApp <span className="font-light opacity-50">Bulk</span></span>
                <div className="w-px h-5 bg-white/10 mx-2 hidden sm:block"></div>
                <div className="hidden sm:flex items-center gap-2">
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">{instanceName ? 'CONEXÃO ATIVA' : 'DESCONECTADO'}</span>
                  <span className="text-white/30">|</span>
                  <span className="text-xs font-medium text-white/70">{instanceName ? instanceName : 'Aguardando Dispositivo'}</span>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                {user?.planExpiresAt && (
                  <div className="flex flex-col items-end mr-2">
                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold tracking-wide uppercase ${user.mpCustomerId ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'}`}>
                      {user.mpCustomerId ? 'Pro' : 'Trial'}
                    </span>
                    <span className="flex text-[10px] text-green-400/80 items-center gap-1 mt-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
                      Vence: {new Date(user.planExpiresAt).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-3 bg-white/5 px-3 py-1.5 rounded-full border border-white/5">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-purple-500 to-blue-500 flex items-center justify-center text-white text-xs font-bold uppercase overflow-hidden">
                     {user?.username?.substring(0, 2)}
                  </div>
                  <span className="text-sm font-semibold pr-2 hidden sm:block">{user?.username}</span>
                </div>
              </div>
            </header>"""

content = content.replace(old_header, new_headers)

# 3. Add Mobile Header just BEFORE the sidebar
mobile_header = """          {/* Mobile Header (Visible only on Mobile, above Sidebar) */}
          <header className="flex md:hidden w-full p-4 border-b border-white/5 bg-black/20 shrink-0 items-center justify-between order-first">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 flex items-center justify-center drop-shadow-[0_0_10px_rgba(34,197,94,0.4)]">
                <img src="/logo_v3.png" alt="Logo" className="w-full h-full object-contain" />
              </div>
              <span className="font-semibold text-lg tracking-tight text-white">WhatsApp <span className="font-light opacity-50">Bulk</span></span>
            </div>
            
            <div className="flex items-center gap-3">
              {user?.planExpiresAt && (
                <div className="flex flex-col items-end">
                  <span className={`text-[9px] px-1.5 rounded font-bold tracking-wide uppercase ${user.mpCustomerId ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'}`}>
                    {user.mpCustomerId ? 'Pro' : 'Trial'}
                  </span>
                  <span className="text-[9px] text-green-400/80 mt-0.5">
                    Até {new Date(user.planExpiresAt).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              )}
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-blue-500 flex items-center justify-center text-white text-xs font-bold uppercase overflow-hidden">
                 {user?.username?.substring(0, 2)}
              </div>
            </div>
          </header>
          
"""

# Insert mobile header before Left Sidebar
# <aside className="w-full h-16 md:w-24 md:h-full shrink-0 flex flex-row md:flex-col items-center justify-between md:justify-start px-6 md:px-0 py-0 md:py-6 border-b md:border-b-0 md:border-r border-white/5 relative z-20 bg-black/40 md:bg-black/20 order-first">
old_aside_start = '<aside className="w-full h-16 md:w-24 md:h-full shrink-0 flex flex-row md:flex-col items-center justify-between md:justify-start px-6 md:px-0 py-0 md:py-6 border-b md:border-b-0 md:border-r border-white/5 relative z-20 bg-black/40 md:bg-black/20 order-first">'
new_aside_start = old_aside_start.replace('order-first', 'order-2 md:order-first')
content = content.replace(old_aside_start, mobile_header + new_aside_start)

# 4. Make Main Content Area order-3 on mobile
old_main_start = '<div className="flex-1 flex flex-col overflow-hidden relative z-10">'
new_main_start = '<div className="flex-1 flex flex-col overflow-hidden relative z-10 order-3 md:order-2">'
content = content.replace(old_main_start, new_main_start)


with open('src/v2/AppV2.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
