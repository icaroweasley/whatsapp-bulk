from PIL import Image

def convert_to_transparent(input_path, output_path):
    img = Image.open(input_path).convert("RGBA")
    data = img.getdata()
    
    new_data = []
    for r, g, b, a in data:
        # Use the maximum color channel as the alpha value (luminosity approximation for glowing objects on black)
        alpha = max(r, g, b)
        
        if alpha == 0:
            new_data.append((0, 0, 0, 0))
        else:
            # Recover the original color without the black background premultiplication
            new_r = min(255, int(r * 255 / alpha))
            new_g = min(255, int(g * 255 / alpha))
            new_b = min(255, int(b * 255 / alpha))
            
            # Optionally, slightly boost alpha to make the glow more visible
            new_a = min(255, int(alpha * 1.2))
            
            new_data.append((new_r, new_g, new_b, new_a))
            
    img.putdata(new_data)
    img.save(output_path, "PNG")

convert_to_transparent("public/logo.png", "public/logo_transparent.png")
