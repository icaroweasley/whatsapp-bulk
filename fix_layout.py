import re

# Fix AppV2.tsx mobile nav gap and move AdminPanel out of the main container
with open('src/v2/AppV2.tsx', 'r', encoding='utf-8') as f:
    app_content = f.read()

# 1. Fix mobile nav spacing (Line 1035 and 1065)
old_nav = 'className="flex-1 w-auto md:w-full flex flex-row md:flex-col items-center justify-center md:justify-start gap-6 md:gap-6 relative z-10"'
new_nav = 'className="flex-1 w-auto md:w-full flex flex-row md:flex-col items-center justify-start md:justify-start gap-4 md:gap-6 relative z-10"'
app_content = app_content.replace(old_nav, new_nav)

old_actions = 'className="flex flex-row md:flex-col gap-4 md:mt-auto relative z-10 w-auto md:w-full items-center"'
new_actions = 'className="flex flex-row md:flex-col gap-2 md:gap-4 md:mt-auto relative z-10 w-auto md:w-full items-center shrink-0 ml-auto md:ml-0"'
app_content = app_content.replace(old_actions, new_actions)

# 2. Move AdminPanel to the root level
admin_panel_str = '{showAdmin && <AdminPanel onClose={() => setShowAdmin(false)} />}\n        '
app_content = app_content.replace(admin_panel_str, '')

# Now insert it at the bottom just before the closing </div>
app_content = app_content.replace('      <style dangerouslySetInnerHTML={{__html: `', '      {showAdmin && <AdminPanel onClose={() => setShowAdmin(false)} />}\n\n      <style dangerouslySetInnerHTML={{__html: `')

with open('src/v2/AppV2.tsx', 'w', encoding='utf-8') as f:
    f.write(app_content)


# Fix AdminPanel.tsx header layout for mobile
with open('src/components/AdminPanel.tsx', 'r', encoding='utf-8') as f:
    admin_content = f.read()

old_header = """        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-4">
            <button 
              onClick={onClose}
              className="w-10 h-10 liquid-glass rounded-full flex items-center justify-center hover:bg-white/10 transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-3xl font-semibold tracking-tight flex items-center gap-3">
                <Users className="text-purple-400" />
                Painel Administrativo
              </h1>
              <p className="text-white/50">Gerencie as contas dos seus clientes e as instâncias liberadas.</p>
            </div>
          </div>
          
          {!isCreating && (
            <button 
              onClick={() => setIsCreating(true)}
              className="bg-white text-black hover:bg-white/90 rounded-full px-6 py-3 flex items-center gap-2 font-semibold shadow-[0_0_20px_rgba(255,255,255,0.2)] transition-all"
            >
              <Plus size={18} /> Novo Cliente
            </button>
          )}
        </div>"""

new_header = """        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div className="flex items-start md:items-center gap-4">
            <button 
              onClick={onClose}
              className="w-10 h-10 shrink-0 liquid-glass rounded-full flex items-center justify-center hover:bg-white/10 transition-colors mt-1 md:mt-0"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl md:text-3xl font-semibold tracking-tight flex items-center gap-3 mb-1 md:mb-0 leading-tight">
                <Users className="text-purple-400 shrink-0" />
                Painel Administrativo
              </h1>
              <p className="text-white/50 text-sm md:text-base mt-2 md:mt-0 leading-relaxed">Gerencie as contas dos seus clientes e as instâncias liberadas.</p>
            </div>
          </div>
          
          {!isCreating && (
            <button 
              onClick={() => setIsCreating(true)}
              className="bg-white text-black hover:bg-white/90 rounded-full px-6 py-3 flex items-center gap-2 font-semibold shadow-[0_0_20px_rgba(255,255,255,0.2)] transition-all shrink-0 self-start md:self-auto ml-14 md:ml-0"
            >
              <Plus size={18} /> Novo Cliente
            </button>
          )}
        </div>"""

admin_content = admin_content.replace(old_header, new_header)

with open('src/components/AdminPanel.tsx', 'w', encoding='utf-8') as f:
    f.write(admin_content)
