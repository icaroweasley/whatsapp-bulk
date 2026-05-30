import re

with open('src/v2/AppV2.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Stronger background colors and add more
old_blobs = """<div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[#0a0a0f]"></div>
        <div className="absolute top-[-10%] left-[-5%] w-[600px] h-[600px] bg-purple-600/40 rounded-full blur-[120px] animate-blob"></div>
        <div className="absolute top-[30%] right-[-10%] w-[700px] h-[700px] bg-emerald-500/30 rounded-full blur-[150px] animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-[-10%] left-[10%] w-[500px] h-[500px] bg-blue-600/30 rounded-full blur-[120px] animate-blob animation-delay-4000"></div>
        <div className="absolute inset-0 bg-black/40 backdrop-blur-3xl"></div>
      </div>"""

new_blobs = """<div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[#0a0a0f]"></div>
        <div className="absolute top-[-10%] left-[-5%] w-[600px] h-[600px] bg-purple-600/60 rounded-full blur-[120px] animate-blob"></div>
        <div className="absolute top-[30%] right-[-10%] w-[700px] h-[700px] bg-emerald-500/60 rounded-full blur-[150px] animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-[-10%] left-[10%] w-[500px] h-[500px] bg-blue-600/60 rounded-full blur-[120px] animate-blob animation-delay-4000"></div>
        <div className="absolute top-[60%] left-[40%] w-[400px] h-[400px] bg-pink-600/40 rounded-full blur-[120px] animate-blob"></div>
        <div className="absolute top-[10%] right-[30%] w-[450px] h-[450px] bg-amber-500/40 rounded-full blur-[120px] animate-blob animation-delay-2000"></div>
        <div className="absolute inset-0 bg-black/40 backdrop-blur-3xl"></div>
      </div>"""
content = content.replace(old_blobs, new_blobs)

# 2. Fix height for mobile (dvh) and no body scrolling
content = content.replace('min-h-screen font-sans text-white bg-transparent', 'min-h-[100dvh] font-sans text-white bg-transparent')
content = content.replace('flex h-screen p-4 lg:p-6 w-full max-w-[1600px] mx-auto items-center justify-center', 'flex h-[100dvh] p-2 md:p-4 lg:p-6 w-full max-w-[1600px] mx-auto items-center justify-center')
content = content.replace('w-full h-full lg:max-h-[900px] liquid-panel rounded-[2rem] flex flex-col md:flex-row overflow-hidden border border-white/10 shadow-2xl relative', 'w-full h-full max-h-full lg:max-h-[900px] liquid-panel rounded-2xl md:rounded-[2rem] flex flex-col md:flex-row overflow-hidden border border-white/10 shadow-2xl relative')

# 3. Sidebar to Top, border-b, logo visible, etc
old_aside = 'w-full h-16 md:w-24 md:h-full shrink-0 flex flex-row md:flex-col items-center justify-around md:justify-start px-4 md:px-0 py-0 md:py-6 border-t md:border-t-0 md:border-r border-white/5 relative z-20 bg-black/40 md:bg-black/20 order-last md:order-first'
new_aside = 'w-full h-16 md:w-24 md:h-full shrink-0 flex flex-row md:flex-col items-center justify-between md:justify-start px-6 md:px-0 py-0 md:py-6 border-b md:border-b-0 md:border-r border-white/5 relative z-20 bg-black/40 md:bg-black/20 order-first'
content = content.replace(old_aside, new_aside)

old_logo = 'hidden md:flex w-12 h-12 mb-10 items-center justify-center drop-shadow-[0_0_15px_rgba(34,197,94,0.4)] relative z-10'
new_logo = 'flex w-10 h-10 md:w-12 md:h-12 md:mb-10 items-center justify-center drop-shadow-[0_0_15px_rgba(34,197,94,0.4)] relative z-10'
content = content.replace(old_logo, new_logo)

old_nav = 'flex-1 w-full flex flex-row md:flex-col items-center justify-around md:justify-start gap-0 md:gap-6 relative z-10'
new_nav = 'flex-1 w-auto md:w-full flex flex-row md:flex-col items-center justify-center md:justify-start gap-6 md:gap-6 relative z-10'
content = content.replace(old_nav, new_nav)

old_bottom = 'flex flex-col gap-4 mt-auto relative z-10 w-full items-center'
new_bottom = 'flex flex-row md:flex-col gap-4 md:mt-auto relative z-10 w-auto md:w-full items-center'
content = content.replace(old_bottom, new_bottom)

with open('src/v2/AppV2.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
