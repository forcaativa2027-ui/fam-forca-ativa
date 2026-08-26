from PIL import Image
from pathlib import Path

source = Path("public/brand/fam-logo.jpg")
target = Path("public/favicon.ico")
image = Image.open(source).convert("RGBA")
image.thumbnail((256, 256), Image.Resampling.LANCZOS)
canvas = Image.new("RGBA", (256, 256), (255, 255, 255, 0))
left = (256 - image.width) // 2
top = (256 - image.height) // 2
canvas.alpha_composite(image, (left, top))
canvas.save(target, format="ICO", sizes=[(16, 16), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)])
print(target)
