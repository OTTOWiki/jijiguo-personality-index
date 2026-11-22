#!/usr/bin/env python3
# 生成分享二维码、PWA 图标与 Open Graph 封面（仅需 Pillow + qrcode）
import os, math
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import qrcode

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'assets')
os.makedirs(OUT, exist_ok=True)
URL = 'https://ottowiki.github.io/jijiguo-personality-index/'
FONT_CJK = '/system/fonts/NotoSansCJK-Regular.ttc'
FONT_MONO = '/system/fonts/DroidSansMono.ttf'

def cjk(size, index=0):
    return ImageFont.truetype(FONT_CJK, size, index=index)
def mono(size):
    return ImageFont.truetype(FONT_MONO, size)
def hexrgb(h):
    h = h.lstrip('#')
    return tuple(int(h[i:i+2],16) for i in (0,2,4))

# ---------- QR ----------
qr = qrcode.QRCode(version=None, error_correction=qrcode.constants.ERROR_CORRECT_M, box_size=10, border=2)
qr.add_data(URL)
qr.make(fit=True)
img = qr.make_image(fill_color='#0a0b0e', back_color='#ffffff').convert('RGB')
img.save(os.path.join(OUT, 'share-qr.png'))

# ---------- PWA 图标 ----------
def make_icon(size, path, radius_ratio=0.23):
    S = size * 4
    im = Image.new('RGBA', (S, S), (0,0,0,0))
    d = ImageDraw.Draw(im)
    r = int(S * radius_ratio)
    d.rounded_rectangle([0,0,S-1,S-1], radius=r, fill=(10,11,14,255))
    d.rounded_rectangle([int(S*0.035)]*2 + [S-int(S*0.035), S-int(S*0.035)], radius=r, outline=(255,201,74,110), width=max(2,S//160))
    # 光晕
    glow = Image.new('RGBA',(S,S),(0,0,0,0)); gd=ImageDraw.Draw(glow)
    gd.ellipse([int(S*.1),int(S*.1),int(S*.9),int(S*.9)], fill=(255,201,74,26))
    glow = glow.filter(ImageFilter.GaussianBlur(int(S*.06)))
    im = Image.alpha_composite(im, glow)
    d = ImageDraw.Draw(im)
    f = cjk(int(S*0.56), 0)
    text='吉'
    bbox = d.textbbox((0,0), text, font=f)
    tw, th = bbox[2]-bbox[0], bbox[3]-bbox[1]
    d.text(((S-tw)/2 - bbox[0], (S-th)/2 - bbox[1] - S*0.02), text, font=f,
           fill=(255,201,74,255), stroke_width=max(1,S//300), stroke_fill=(255,201,74,255))
    im = im.resize((size,size), Image.LANCZOS)
    im.save(path, 'PNG')
for s in (180,192,512):
    make_icon(s, os.path.join(OUT, 'icon-%d.png'%s))

# ---------- OG 封面 ----------
W,H = 1200,630
bg = Image.new('RGB',(W,H),(8,9,12))
d = ImageDraw.Draw(bg)
# 渐变
for y in range(H):
    t = y/H
    r = int(8 + (22-8)*t); g = int(9 + (25-9)*t); b = int(12 + (34-12)*t)
    d.line([(0,y),(W,y)], fill=(r,g,b))
# 装饰光斑
ov = Image.new('RGBA',(W,H),(0,0,0,0)); od=ImageDraw.Draw(ov)
od.ellipse([-220,-260,520,460], fill=(255,157,63,36))
od.ellipse([900,-180,1420,340], fill=(112,84,255,32))
ov = ov.filter(ImageFilter.GaussianBlur(90))
bg = Image.alpha_composite(bg.convert('RGBA'), ov).convert('RGB')
d = ImageDraw.Draw(bg)
# 扫描线
ov = Image.new('RGBA',(W,H),(0,0,0,0)); od=ImageDraw.Draw(ov)
for y in range(0,H,3):
    od.line([(0,y),(W,y)], fill=(255,255,255,8))
bg = Image.alpha_composite(bg.convert('RGBA'), ov).convert('RGB')
d = ImageDraw.Draw(bg)

gold=(255,201,74); ink=(238,241,247); ink2=(170,179,196); ink3=(120,130,148); orange=(255,138,61); red=(255,92,122)

# 顶部标识
f_mono = mono(17); f_mono_s = mono(14)
d.text((64,54), 'OTTO SUBCULTURE PERSONALITY INDEX', font=f_mono, fill=(255,201,74,230))
d.text((64,84), '吉吉国人格图鉴 · JIJIGUO PERSONALITY INDEX', font=cjk(24), fill=(255,255,255,240))

# 标题
f_title = cjk(96); f_title2 = cjk(96)
d.text((60,150), '吉吉国', font=f_title, fill=(255,255,255,255), stroke_width=1, stroke_fill=(255,255,255,255))
d.text((60,258), '人格图鉴', font=f_title2, fill=gold, stroke_width=1, stroke_fill=gold)
# 副标题
d.text((66,392), '你是电棍 OTTO 亚文化圈里的谁？', font=cjk(34), fill=(238,241,247,255))
d.text((66,444), '7 位人物  ·  30 / 85 / 120 题  ·  八维雷达  ·  人格卡', font=cjk(24), fill=(170,179,196,255))

# 人物 chips（暗底 + 彩色描边）
names=[('侯国玉','#ffc94a'),('山泥若','#ff9e7a'),('炫神','#a78bfa'),('棍母','#c9d6e6'),('DJGun','#4de2d0'),('Karasu','#ff7aa2'),('沈阳美食家','#ffb86b')]
x=66; y=500
f_chip=cjk(20)
chips = Image.new('RGBA',(W,H),(0,0,0,0)); cd=ImageDraw.Draw(chips)
for name,color in names:
    bb=cd.textbbox((0,0),name,font=f_chip); tw=bb[2]-bb[0]
    w=tw+34
    cd.rounded_rectangle([x,y,x+w,y+42], radius=21, fill=(*hexrgb(color)[:3], 26), outline=(*hexrgb(color)[:3], 190), width=1)
    cd.text((x+17,y+7),name,font=f_chip,fill=(238,241,247,255))
    x+=w+9
bg = Image.alpha_composite(bg.convert('RGBA'), chips).convert('RGB')
d = ImageDraw.Draw(bg)
# 底部
d.text((66,558), 'ottowiki.github.io/jijiguo-personality-index', font=mono(16), fill=(255,201,74,210))
d.text((66,584), 'OTTOWiki 开源 · Vanilla JS · 仅供娱乐，请勿上升真人', font=cjk(15), fill=(140,150,168,255))

# 右侧二维码
qr_img = qrcode.QRCode(version=None, error_correction=qrcode.constants.ERROR_CORRECT_M, box_size=10, border=2)
qr_img.add_data(URL); qr_img.make(fit=True)
qim = qr_img.make_image(fill_color='#0a0b0e', back_color='#ffffff').convert('RGB').resize((172,172), Image.LANCZOS)
# 白色卡片
card = Image.new('RGBA',(204,236),(255,255,255,255))
bg.paste(qim, (972,322))
d = ImageDraw.Draw(bg)
d.rounded_rectangle([958,308,1150,548], radius=18, outline=(255,201,74,180), width=2)
d.text((1000,500), '扫码开测', font=cjk(22), fill=(238,241,247,255))
# 边框
d.rounded_rectangle([20,20,W-21,H-21], radius=26, outline=(255,255,255,30), width=2)
bg.save(os.path.join(OUT,'og-cover.png'), 'PNG', optimize=True)
print('assets generated:', [f for f in sorted(os.listdir(OUT)) if f.endswith('.png') or f.endswith('.svg')])
