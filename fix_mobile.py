import re

with open('src/v2/AppV2.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Glassmorphism: Change solid backgrounds to glass
content = content.replace('bg-[#111116]', 'bg-black/30 backdrop-blur-xl')
content = content.replace('bg-[#0f1015]', 'bg-black/40 backdrop-blur-xl')

# 2. Main Shell Layout: Mobile Bottom Bar
# Change the shell from row flex to col flex on mobile
content = content.replace(
    'liquid-panel rounded-[2rem] flex overflow-hidden border border-white/10 shadow-2xl relative',
    'liquid-panel rounded-[2rem] flex flex-col md:flex-row overflow-hidden border border-white/10 shadow-2xl relative'
)

# 3. Sidebar: Make it horizontal on mobile, vertical on desktop
content = content.replace(
    'w-20 md:w-24 shrink-0 flex flex-col items-center py-6 border-r border-white/5 relative z-20 bg-black/20',
    'w-full h-16 md:w-24 md:h-full shrink-0 flex flex-row md:flex-col items-center justify-around md:justify-start px-4 md:px-0 py-0 md:py-6 border-t md:border-t-0 md:border-r border-white/5 relative z-20 bg-black/40 md:bg-black/20 order-last md:order-first'
)

# Find Logo and hide on mobile
content = content.replace(
    'w-12 h-12 mb-10 flex items-center justify-center drop-shadow-[0_0_15px_rgba(34,197,94,0.4)] relative z-10',
    'hidden md:flex w-12 h-12 mb-10 items-center justify-center drop-shadow-[0_0_15px_rgba(34,197,94,0.4)] relative z-10'
)

# Nav Icons wrapper: flex-col -> flex-row on mobile
content = content.replace(
    'flex-1 w-full flex flex-col items-center gap-6 relative z-10',
    'flex-1 w-full flex flex-row md:flex-col items-center justify-around md:justify-start gap-0 md:gap-6 relative z-10'
)

# Bottom Icons (Settings/Logout): flex-col -> flex-row
content = content.replace(
    'flex flex-col gap-4 relative z-10',
    'flex flex-row md:flex-col gap-2 md:gap-4 relative z-10'
)

with open('src/v2/AppV2.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

