from PIL import Image, ImageDraw
import sys

def flood_fill_transparent(img_path):
    # Restore original first
    import shutil
    shutil.copyfile('/home/negasa/.gemini/antigravity/brain/d78c9298-b65b-4496-8353-5d53b0caf635/.user_uploaded/media_1789957761469.png', img_path)
    
    img = Image.open(img_path).convert("RGBA")
    
    # We will do a floodfill from (0,0) to find all connected black pixels
    width, height = img.size
    pixels = img.load()
    
    # Target color: black
    # Replacement: transparent
    
    def is_black(p):
        return p[0] < 20 and p[1] < 20 and p[2] < 20 and p[3] > 0
        
    stack = [(0, 0), (width-1, 0), (0, height-1), (width-1, height-1)]
    visited = set()
    
    while stack:
        x, y = stack.pop()
        if (x, y) in visited:
            continue
        visited.add((x, y))
        
        if is_black(pixels[x, y]):
            pixels[x, y] = (255, 255, 255, 0)
            
            if x > 0: stack.append((x-1, y))
            if x < width - 1: stack.append((x+1, y))
            if y > 0: stack.append((x, y-1))
            if y < height - 1: stack.append((x, y+1))
            
    img.save(img_path, "PNG")

flood_fill_transparent("client/public/astu-logo.png")
print("Floodfill background removed.")
