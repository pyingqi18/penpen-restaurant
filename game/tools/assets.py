# 把 GPT 生成的美术素材整理成游戏用的图片：裁切、抠品红窗、切素材表、压缩成 webp
# 用法：python3 tools/assets.py <素材根目录> <输出目录>
import json, sys, os
from PIL import Image, ImageDraw, ImageFilter

SRC = sys.argv[1] if len(sys.argv) > 1 else '/mnt/user-data/uploads/rest/assets'
OUT = sys.argv[2] if len(sys.argv) > 2 else 'assets'
os.makedirs(OUT, exist_ok=True)
manifest = {}
Y0, H = 60, 864  # 1536×1024 → 裁成 1536×864（16:9），对应游戏 1280×720

def save(im, name, q=82):
    p = os.path.join(OUT, name + '.webp')
    im.save(p, 'WEBP', quality=q, method=6)
    manifest[name] = {'w': im.width, 'h': im.height}
    return im

def clean_alpha(im, lo=40):
    im = im.convert('RGBA')
    a = im.getchannel('A').point(lambda v: 0 if v < lo else v)
    im.putalpha(a)
    return im

def trim(im, pad=4):
    bb = im.getchannel('A').point(lambda v: 255 if v > 0 else 0).getbbox()
    if not bb: return im, (0, 0)
    x0, y0, x1, y1 = max(0, bb[0] - pad), max(0, bb[1] - pad), min(im.width, bb[2] + pad), min(im.height, bb[3] + pad)
    return im.crop((x0, y0, x1, y1)), (x0, y0)

def sheet(path, cols, rows, names, maxw=420):
    im = clean_alpha(Image.open(os.path.join(SRC, path)))
    cw, ch = im.width / cols, im.height / rows
    for i, n in enumerate(names):
        if not n: continue
        c, r = i % cols, i // cols
        cell = im.crop((int(c * cw), int(r * ch), int((c + 1) * cw), int((r + 1) * ch)))
        sp, _ = trim(cell)
        if sp.width > maxw: sp = sp.resize((maxw, round(sp.height * maxw / sp.width)), Image.LANCZOS)
        save(sp, n)

# ---- 店内：底图（抠掉品红窗）、厨房前景、透明前景框 ----
room = Image.open(os.path.join(SRC, '01-restaurant/room_courtyard.png')).convert('RGBA').crop((0, Y0, 1536, Y0 + H))
px = room.load()
for y in range(room.height):
    for x in range(room.width):
        r, g, b, a = px[x, y]
        if r > 150 and b > 150 and g < 120:  # 品红及其抗锯齿边
            px[x, y] = (r, g, b, 0)
        elif r > 120 and b > 120 and g < r * 0.7 and g < b * 0.7:  # 带一点品红的边缘：去色
            px[x, y] = (int((r + g) / 2), g, int((b + g) / 2), a)
save(room, 'room_courtyard', 84)
# 厨房（灶台 + 柜子 + 长台）单独抠出来，盖在老大身上
poly = [(0, 478), (250, 478), (458, 486), (452, 600), (430, 600), (430, 790), (298, 1015), (0, 1015)]
mask = Image.new('L', (1536, 1024), 0); ImageDraw.Draw(mask).polygon(poly, fill=255)
mask = mask.crop((0, Y0, 1536, Y0 + H)).filter(ImageFilter.GaussianBlur(1.2))
kfg = room.copy(); kfg.putalpha(mask)
kfg, off = trim(kfg, 0)
save(kfg, 'kitchen_fg', 86); manifest['kitchen_fg'].update({'x': off[0], 'y': off[1]})
fg = Image.open(os.path.join(SRC, '01-restaurant/room_courtyard_fg.png')).convert('RGBA').crop((0, Y0, 1536, Y0 + H))
save(fg, 'room_fg', 80)
# ---- 四季窗景：只取窗区对应的那一条（交付规格：源窗景 x0 y306 w1536 h417）----
for se in ['spring', 'summer', 'autumn', 'winter']:
    v = Image.open(os.path.join(SRC, f'01-restaurant/view_courtyard_{se}.png')).convert('RGB').crop((0, 306, 1536, 723))
    save(v, f'view_{se}', 80)
# ---- 素材表切成单件 ----
sheet('01-restaurant/furniture_courtyard.png', 3, 2, ['table_s', 'table_m', 'table_l', 'table_s2', 'stool', 'stool_woven'])
sheet('01-restaurant/kitchen_props.png', 4, 2, ['ware_wok', 'ware_pot', 'ware_steamer', 'ware_clay', 'tray', 'water_set', 'tea_cart', 'dirty_dishes'], 300)
sheet('01-restaurant/decor_1.png', 4, 3, ['d_pilea', 'd_monstera', 'd_spider', 'd_frame', 'd_cattree', 'd_fishbowl', 'd_phono', 'd_books', 'd_lamp', 'd_chime', 'd_chili', 'd_garlic'], 300)
sheet('01-restaurant/decor_2.png', 4, 3, ['d_yarn', 'd_umbrella', 'd_vegbasket', 'd_ricesack', 'd_watervat', 'd_jars', 'd_hatrack', 'd_catbed', 'd_floorlamp', 'd_board', 'd_steamers', 'd_fruitcrate'], 300)
sheet('01-restaurant/furniture_courtyard_seasonal_decor.png', 4, 3, [f'{se}_{k}' for k in ['runner', 'vase', 'hanging'] for se in ['spring', 'summer', 'autumn', 'winter']], 260)
sheet('03-map/map_buildings.png', 3, 2, ['m_shop', 'm_market', 'm_coop', 'm_mailbox', 'm_sign', 'm_scarecrow'], 460)
json.dump(manifest, open(os.path.join(OUT, 'manifest.json'), 'w'), indent=0)
tot = sum(os.path.getsize(os.path.join(OUT, f)) for f in os.listdir(OUT))
print(len(manifest), 'images,', round(tot / 1024), 'KB')
