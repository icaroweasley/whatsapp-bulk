import re

# Fix ConnectionManager.tsx
with open('src/v2/ConnectionManager.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Insert instructions under the select dropdown
instructions = """
              </div>
              <div className="mt-4 text-[11px] text-white/50 bg-black/20 border border-white/5 rounded-xl p-4 leading-relaxed">
                <span className="font-semibold text-white/70 block mb-1">Como conectar:</span> 
                Abra o WhatsApp &gt; clique nos três pontinhos no lado direito superior &gt; Dispositivos Conectados &gt; Conectar Dispositivo &gt; escaneie o código QR
              </div>
"""
content = content.replace(
    '</select>\n                <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none">\n                  <ChevronDown size={20} className="text-white/50" />\n                </div>\n              </div>',
    '</select>\n                <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none">\n                  <ChevronDown size={20} className="text-white/50" />\n                </div>\n              </div>' + instructions
)

with open('src/v2/ConnectionManager.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

# Fix AppV2.tsx
with open('src/v2/AppV2.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Ensure Plug is imported
if 'Plug' not in content:
    content = content.replace('Loader2 } from \'lucide-react\';', 'Loader2, Plug } from \'lucide-react\';')

# Replace Icon 1
icon1_old = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>'
icon1_new = '<div className="flex items-center gap-1.5"><span className="text-[11px] font-black opacity-40">1</span><Plug size={20} /></div>'
content = content.replace(icon1_old, icon1_new)

# Replace Icon 2
icon2_old = '<Users size={22} />'
icon2_new = '<div className="flex items-center gap-1.5"><span className="text-[11px] font-black opacity-40">2</span><Users size={20} /></div>'
content = content.replace(icon2_old, icon2_new)

# Replace Icon 3
icon3_old = '<MessageSquare size={22} />'
icon3_new = '<div className="flex items-center gap-1.5"><span className="text-[11px] font-black opacity-40">3</span><MessageSquare size={20} /></div>'
content = content.replace(icon3_old, icon3_new)

# Make the nav buttons slightly wider to accommodate the text
content = content.replace('relative w-12 h-12 rounded-2xl flex items-center', 'relative w-16 h-12 rounded-2xl flex items-center')

with open('src/v2/AppV2.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
