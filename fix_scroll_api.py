import re

# Fix api/auth/me.js
with open('api/auth/me.js', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    'planStatus: user.planStatus',
    'planStatus: user.planStatus, planExpiresAt: user.planExpiresAt, mpCustomerId: user.mpCustomerId'
)

with open('api/auth/me.js', 'w', encoding='utf-8') as f:
    f.write(content)

# Fix api/auth/login.js
with open('api/auth/login.js', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    'planStatus: user.planStatus }',
    'planStatus: user.planStatus, planExpiresAt: user.planExpiresAt, mpCustomerId: user.mpCustomerId }'
)

with open('api/auth/login.js', 'w', encoding='utf-8') as f:
    f.write(content)

# Fix server/index.ts login
with open('server/index.ts', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    'planStatus: user.planStatus }',
    'planStatus: user.planStatus, planExpiresAt: user.planExpiresAt, mpCustomerId: user.mpCustomerId }'
)
content = content.replace(
    'customPrice: user.customPrice }',
    'customPrice: user.customPrice, planExpiresAt: user.planExpiresAt, mpCustomerId: user.mpCustomerId }'
)

with open('server/index.ts', 'w', encoding='utf-8') as f:
    f.write(content)

# Fix AppV2.tsx mobile scroll and rounded corners
with open('src/v2/AppV2.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Round corners of the main panel on mobile. Currently it's rounded-2xl md:rounded-[2rem]. Make it rounded-[2rem] everywhere.
content = content.replace('liquid-panel rounded-2xl md:rounded-[2rem]', 'liquid-panel rounded-[2rem]')

# 2. Fix the height constraint for mobile Screen 2 to allow scrolling
content = content.replace(
    '<div className="flex-1 flex flex-col w-full max-h-[calc(100vh-140px)]">',
    '<div className="flex-1 flex flex-col w-full h-[60vh] md:h-auto md:max-h-[calc(100vh-140px)] min-h-0">'
)

# 3. Add mt-2 or something to make it look nicer
with open('src/v2/AppV2.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
