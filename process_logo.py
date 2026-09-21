import sys
try:
    from PIL import Image
except ImportError:
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "Pillow"])
    from PIL import Image

def remove_black_background(img_path):
    img = Image.open(img_path)
    img = img.convert("RGBA")
    datas = img.getdata()
    newData = []
    
    for item in datas:
        # Check if the pixel is black or near-black
        if item[0] < 20 and item[1] < 20 and item[2] < 20:
            # Change to transparent
            newData.append((255, 255, 255, 0))
        else:
            newData.append(item)
            
    img.putdata(newData)
    img.save(img_path, "PNG")

remove_black_background("client/public/astu-logo.png")
print("Background removed.")
