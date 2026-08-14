from pathlib import Path
from PIL import Image, ImageDraw

source = Path('assets/document-pages')
pages = sorted(source.glob('page-*.png'))
for group in range(0, len(pages), 12):
    batch = pages[group:group + 12]
    sheet = Image.new('RGB', (1200, 1600), '#d8d2c8')
    for index, page in enumerate(batch):
        image = Image.open(page).convert('RGB')
        image.thumbnail((260, 340))
        x = 50 + (index % 4) * 290
        y = 50 + (index // 4) * 510
        sheet.paste(image, (x, y + 28))
        ImageDraw.Draw(sheet).text((x, y), f'Page {group + index + 1}', fill='#1c2526')
    sheet.save(source / f'qa-sheet-{group // 12 + 1}.jpg', quality=85)
