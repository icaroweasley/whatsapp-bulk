from PIL import Image
import math

def remove_dark_bg(input_path, output_path):
    img = Image.open(input_path).convert("RGBA")
    data = img.getdata()
    
    new_data = []
    for r, g, b, a in data:
        # Calculate brightness
        brightness = (r + g + b) / 3.0
        
        # If it's very dark (the background), make it fully transparent
        if brightness < 30:
            new_data.append((0, 0, 0, 0))
        else:
            # Smoothly transition alpha based on brightness
            # Brightness 30 -> alpha 0
            # Brightness 80+ -> alpha 255
            alpha = min(255, max(0, int((brightness - 30) * (255.0 / 50.0))))
            
            # Boost the color slightly to compensate for lost brightness
            boost = 255.0 / max(1, alpha) if alpha > 0 else 1
            new_r = min(255, int(r * boost * 0.8))
            new_g = min(255, int(g * boost * 0.8))
            new_b = min(255, int(b * boost * 0.8))
            
            # If it's bright enough, keep original color with full alpha
            if brightness > 100:
                new_data.append((r, g, b, 255))
            else:
                new_data.append((r, g, b, alpha))
                
    img.putdata(new_data)
    img.save(output_path, "PNG")

remove_dark_bg('C:\\Users\\user\\.gemini\\antigravity\\brain\\b583b9be-bd39-4f1e-9cb1-706256d918bf\\whatsapp_bulk_icon_1780098591473.png', 'public/logo_transparent.png')
