import re

with open('src/v2/ConnectionManager.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# I will replace the incorrect block with the correct one.
bad_block = """              </div>
              </div>
              <div className="mt-4 text-[11px] text-white/50 bg-black/20 border border-white/5 rounded-xl p-4 leading-relaxed">
                <span className="font-semibold text-white/70 block mb-1">Como conectar:</span> 
                Abra o WhatsApp &gt; clique nos três pontinhos no lado direito superior &gt; Dispositivos Conectados &gt; Conectar Dispositivo &gt; escaneie o código QR
              </div>"""

good_block = """              </div>
              <div className="mt-4 text-[11px] text-white/50 bg-black/20 border border-white/5 rounded-xl p-4 leading-relaxed">
                <span className="font-semibold text-white/70 block mb-1">Como conectar:</span> 
                Abra o WhatsApp &gt; clique nos três pontinhos no lado direito superior &gt; Dispositivos Conectados &gt; Conectar Dispositivo &gt; escaneie o código QR
              </div>"""

content = content.replace(bad_block, good_block)

with open('src/v2/ConnectionManager.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
