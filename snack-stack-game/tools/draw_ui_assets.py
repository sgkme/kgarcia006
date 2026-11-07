"""Draw Snack Stack's reference-inspired UI with explicit SVG geometry.

No bitmap inputs, image elements, tracing, pixel paths, or raster textures.
The reference sheets inform the palette, silhouettes and small shadows.
"""
from pathlib import Path
import json

ROOT = Path(__file__).resolve().parents[1]
INK = '#513019'
CREAM = '#fff1d7'
GOLD = '#ffcf32'
RED = '#e46d51'
GREEN = '#a5b47d'
BLUE = '#60bfe0'

def path(d, fill='none', stroke=INK, sw=5, **attrs):
    extra=' '.join(f'{k.replace("_","-")}="{v}"' for k,v in attrs.items())
    return f'<path d="{d}" fill="{fill}" stroke="{stroke}" stroke-width="{sw}" stroke-linejoin="round" stroke-linecap="round" {extra}/>'

def rect(x,y,w,h,fill,rx=8,stroke=INK,sw=5):
    return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{rx}" fill="{fill}" stroke="{stroke}" stroke-width="{sw}"/>'

def ellipse(x,y,rx,ry,fill,stroke=INK,sw=5):
    return f'<ellipse cx="{x}" cy="{y}" rx="{rx}" ry="{ry}" fill="{fill}" stroke="{stroke}" stroke-width="{sw}"/>'

def group(s,transform): return f'<g transform="{transform}">{s}</g>'
def star(x=80,y=80,r=48,fill=GOLD):
    import math
    points=[]
    for i in range(10):
        a=-math.pi/2+i*math.pi/5; rr=r if i%2==0 else r*.49
        points.append(f'{x+math.cos(a)*rr:.2f},{y+math.sin(a)*rr:.2f}')
    return f'<polygon points="{" ".join(points)}" fill="{fill}" stroke="{INK}" stroke-width="5" stroke-linejoin="round"/>'

def check(): return path('M48 82 L70 103 116 53',GREEN,INK,14)+path('M49 79 L70 99 113 53','none','#c9d998',5)
def coin(x=80,y=80,r=53):
    return ellipse(x,y+9,r,r*.64,'#be7727')+ellipse(x,y,r,r*.64,GOLD)+ellipse(x,y,r-10,r*.47,'#ffe57c','#dc9a26',3)+path(f'M{x-r*.62} {y-9} Q{x} {y-r*.53} {x+r*.55} {y-13}','none','#fff4bc',4)

def control(name):
    frame=path('M33 18 L128 10 Q147 9 145 30 L134 128 Q132 145 113 149 L23 155 Q9 155 13 136 L24 35 Q25 22 33 18Z','#a96232','#fffaf0',12)
    frame+=path('M30 15 L122 7 Q140 5 139 26 L128 121 Q126 138 110 140 L22 147 Q8 147 12 129 L23 30 Q24 18 30 15Z',CREAM)
    frame+=path('M32 24 L120 16 Q131 14 130 27','none','#fffefa',5)
    icon=''
    if name=='play': icon=path('M60 46 Q56 42 55 50 L52 109 Q52 118 60 113 L108 82 Q114 78 108 74Z',GOLD)
    elif name=='home': icon=path('M43 78 L40 118 70 121 73 96 88 96 88 119 117 116 117 74',CREAM)+path('M34 76 L79 37 124 72 115 87 79 57 44 88Z',RED)
    elif name=='shop': icon=path('M43 65 L116 62 119 119 39 125Z',RED)+path('M57 66 V48 Q58 24 81 26 Q104 26 101 64','none',INK,9)+path('M60 61 V48 Q62 32 80 32 Q97 32 94 61','none',CREAM,4)
    elif name=='settings':
        import math
        pts=[]
        for i in range(32):
            a=i*math.pi/16; r=48 if i%4 in (0,1) else 38;pts.append(f'{80+math.cos(a)*r:.1f},{80+math.sin(a)*r:.1f}')
        icon=f'<polygon points="{" ".join(pts)}" fill="{GREEN}" stroke="{INK}" stroke-width="5" stroke-linejoin="round"/>'+ellipse(80,80,18,18,CREAM)
    elif name=='pause': icon=path('M52 46 L70 44 65 113 46 115Z',GOLD)+path('M91 43 L110 42 104 110 85 112Z',GOLD)
    elif name in ('restart','back'):
        d='M110 55 Q77 27 48 55 Q23 84 49 109 Q74 133 105 105 L113 92' if name=='restart' else 'M50 65 H99 Q122 65 121 86 Q121 108 99 108 H61'
        icon=path(d,'none',INK,18)+path(d,'none',BLUE if name=='restart' else RED,11)
        icon+=path('M45 44 L42 72 69 65Z',BLUE if name=='restart' else RED) if name=='restart' else path('M67 43 L39 65 66 85Z',RED)
    elif name=='close': icon=path('M52 50 L108 105 M108 49 L51 107','none',INK,20)+path('M52 50 L108 105 M108 49 L51 107','none',RED,12)
    elif name.startswith('arrow_'):
        arrow=path('M94 47 L57 80 92 113 104 99 82 80 107 59Z',GREEN)
        angle={'arrow_left':0,'arrow_right':180,'arrow_up':90,'arrow_down':270}[name]
        icon=group(arrow,f'rotate({angle} 80 80)')
    elif name in ('sound_on','sound_off'):
        icon=path('M37 66 H56 L81 46 V114 L56 96 H37Z',GOLD)
        if name=='sound_on': icon+=path('M94 62 Q114 80 94 98 M107 49 Q140 80 107 111','none',INK,7)+path('M94 62 Q114 80 94 98 M107 49 Q140 80 107 111','none',GOLD,3)
        else:icon+=path('M44 115 L120 42','none',INK,14)+path('M44 115 L120 42','none',RED,8)
    elif name=='music': icon=path('M63 99 V50 L110 39 V92','none',INK,11)+path('M66 55 L107 45 V61 L66 70Z',BLUE)+ellipse(50,106,18,12,BLUE)+ellipse(98,99,18,12,BLUE)
    elif name in ('info','help'):
        icon=ellipse(80,80,45,45,BLUE)
        if name=='info': icon+=ellipse(80,53,5,5,CREAM,INK,3)+rect(74,69,12,38,CREAM,5,INK,3)
        else: icon+=path('M65 66 Q65 46 84 48 Q107 51 96 73 L83 85 V92','none',INK,13)+path('M65 65 Q66 49 84 51 Q102 54 93 70 L80 83 V91','none',CREAM,7)+ellipse(80,107,5,5,CREAM,INK,2)
    elif name=='menu': icon=''.join(rect(43,y,73,11,RED,4) for y in (49,76,103))
    elif name=='fullscreen':icon=path('M44 64 V45 H64 M96 43 H116 V63 M42 96 V116 H62 M94 113 H113 V93','none',INK,13)+path('M44 64 V45 H64 M96 43 H116 V63 M42 96 V116 H62 M94 113 H113 V93','none',GOLD,7)
    elif name=='lock':icon=path('M57 69 V53 Q59 28 82 29 Q108 30 106 66','none',INK,10)+path('M59 68 V52 Q61 34 82 35 Q101 36 100 66','none',GOLD,4)+rect(44,67,75,56,GOLD,8)+ellipse(82,88,6,7,INK,INK,0)+path('M82 93 V106','none',INK,7)
    return frame+icon

def reward(name):
    if name in ('coin','coin_stack'): return coin() if name=='coin' else coin(77,107,53)+coin(88,82,53)+coin(72,55,53)
    if name=='gem':return path('M19 61 L47 25 H113 L143 62 81 134Z','#ef6088')+path('M19 61 H143 M47 25 L61 62 81 134 100 62 113 25 M61 62 H100','none','#a43e5f',3)+path('M47 30 L24 58 58 58Z','#ffafc9','none',0)
    if name=='heart':return path('M80 139 C58 123 12 93 16 58 C19 23 57 16 80 44 C103 14 144 26 145 60 C146 95 101 124 80 139Z','#ef695f')+path('M29 58 Q34 32 59 39','none','#ffada0',6)
    if name in ('star','active_star'): return (ellipse(80,82,61,61,CREAM) if name=='active_star' else '')+star()+path('M56 63 L71 58 79 40','none','#ffef9b',4)
    if name=='trophy':return path('M49 40 H24 V64 Q22 93 53 91 M112 40 H136 V64 Q136 93 109 91','none',INK,10)+path('M49 40 H24 V64 Q22 93 53 91 M112 40 H136 V64 Q136 93 109 91','none',GOLD,5)+path('M43 25 H117 V60 Q116 91 86 100 V121 H112 V138 H48 V121 H74 V100 Q45 94 43 60Z',GOLD)+path('M53 34 H106','none','#fff0a4',5)
    if name=='crown':return path('M28 63 L54 83 80 31 105 81 134 58 123 127 H37Z',GOLD)+''.join(ellipse(x,y,9,9,GOLD) for x,y in ((25,52),(80,23),(137,48)))+path('M79 67 L93 90 79 110 66 91Z','#ee6784')
    if name in ('ticket','ribbon','medal','star_ticket'):
        if name in ('ribbon','medal'):return path('M54 92 L38 143 70 131 82 147 96 110 110 141 128 125 106 80Z',RED)+ellipse(80,65,47,47,GOLD)+ellipse(80,65,32,32,'#ffe9a0')
        return path('M21 55 L135 35 144 62 Q128 75 146 86 L140 111 28 132 20 110 Q35 96 16 85Z',CREAM)+path('M35 64 L125 49 132 100 37 117Z','none',RED,3)+(star(80,82,24) if name=='star_ticket' else '')
    if name in ('chest_closed','chest_open'):
        s=rect(22,73,118,65,RED,12)+path('M22 86 L139 86 M40 74 V135 M120 74 V135','none',CREAM,8)+rect(72,86,20,29,GOLD,4)
        if name=='chest_closed':s+=path('M21 73 V57 Q24 26 51 25 H110 Q135 28 139 57 V73Z',RED)+path('M42 28 V72 M118 34 V72','none',CREAM,9)
        else:s+=path('M24 73 L10 31 Q7 15 25 15 H111 Q134 17 138 38 L142 67Z','#9e5030')+group(coin(80,69,30),'')+coin(116,73,22)
        return s
    if name=='coin_bag':return path('M58 55 L45 22 Q78 32 115 20 L100 55 Q137 83 133 118 Q126 143 78 145 Q29 147 23 116 Q21 83 58 55Z',CREAM)+path('M54 56 Q81 64 105 54 M58 63 L99 63','none',RED,8)+path('M99 62 L119 87 105 91 91 67Z',RED)
    if name=='key':return ellipse(100,53,37,28,GOLD)+ellipse(104,50,13,10,CREAM)+path('M73 69 L22 119 37 136 53 121 43 110 54 99 66 108 86 87Z',GOLD)
    if name=='shield':return path('M80 23 L132 41 125 96 Q118 125 80 144 Q44 124 35 98 L29 42Z',GREEN)+path('M80 36 L119 50 113 96 Q105 115 81 130 Q54 115 47 96 L43 51Z','none',CREAM,4)+star(81,81,28)
    if name in ('lightning','boost'):return (ellipse(80,80,62,62,BLUE) if name=='boost' else '')+path('M67 26 L119 26 86 73 H116 L56 139 70 91 H35Z',GOLD)
    if name=='hourglass':return path('M40 33 Q44 63 73 80 Q45 103 42 132 H119 Q116 102 88 80 Q114 62 118 34Z',CREAM)+path('M52 49 H105 Q97 64 80 71 Q61 60 52 49 M80 98 L57 122 H104Z',GOLD,INK,3)+rect(34,18,91,22,RED,8)+rect(35,128,90,18,RED,7)
    if name=='gift':return rect(26,64,112,80,CREAM,7)+rect(19,48,125,28,RED,6)+path('M75 54 V143 M89 54 V143','none',GREEN,10)+path('M79 48 C19 49 30 4 57 22Z M84 48 C139 44 127 4 107 23Z',RED)
    if name=='sparkles':return star(59,78,48)+star(126,37,21)+star(121,126,26)
    return star()

def status(name):
    if name.startswith('meter_'):
        if name=='meter_vertical':return rect(52,12,55,137,CREAM,27)+rect(61,70,37,69,GOLD,18,INK,2)
        s=rect(10,57,140,49,GREEN,23)+rect(18,65,124,31,CREAM,16,INK,3)
        width={'meter_empty':0,'meter_half':61,'meter_full':120}[name]
        return s+(rect(20,67,width,27,GOLD,13,INK,0) if width else '')
    if name in ('clock','stopwatch'):
        s=(rect(66,8,28,16,RED,5)+path('M80 24 V34','none',INK,7)) if name=='stopwatch' else ''
        s+=ellipse(80,86,60,60,RED if name=='stopwatch' else GREEN)+ellipse(80,84,49,49,CREAM)
        import math
        for i in range(12):
            a=i*math.pi/6;s+=path(f'M{80+math.sin(a)*39:.2f} {84-math.cos(a)*39:.2f} l{math.sin(a)*4:.2f} {-math.cos(a)*4:.2f}','none',INK,3)
        return s+path('M80 55 V84 L103 65','none',INK,7)+ellipse(80,84,6,6,RED,INK,2)
    if name=='charges':return path('M24 45 L124 31 142 49 135 115 30 133 16 114Z',CREAM)+''.join(path(f'M{x} 65 L{x+12} 61 {x+1} 104 {x-11} 107Z',GOLD,INK,3) for x in (48,80,111))
    if name=='star_ticket':return reward(name)
    if name=='flame':return path('M68 145 Q17 132 34 81 Q43 58 64 39 L60 76 Q99 57 92 14 Q139 53 134 95 Q137 131 103 143Z','#ec6f42')+path('M78 135 Q46 121 63 94 L73 109 Q94 99 96 72 Q127 111 103 133Z',GOLD,INK,0)
    if name=='failure':return ellipse(80,80,61,61,GREEN)+group(control('close').split('</path>')[-1] if False else path('M59 59 L101 101 M101 59 L59 101','none',GOLD,17),'')
    if name=='location':return ellipse(80,133,53,18,GREEN)+path('M80 132 C60 100 31 77 35 51 C40 7 119 7 126 50 C132 79 98 111 80 132Z',RED)+ellipse(80,54,20,20,CREAM)
    if name in ('complete','locked','active_star'):
        return ellipse(80,108,63,29,'#a56a37')+ellipse(80,99,63,29,CREAM)+(check() if name=='complete' else group(control('lock'),'translate(25 0) scale(.69)') if name=='locked' else star(80,70,39))
    if name in ('stars_1','stars_3','stars_5'):
        s=rect(8,47,144,66,CREAM,26)+path('M20 104 H139','none',GREEN,5)
        n=5 if name=='stars_5' else 3
        for i in range(n):s+=star(29+i*(100/(n-1)),80,18 if n==5 else 24,GOLD if name!='stars_1' or i==0 else '#d8c8a4')
        return s
    if name.startswith('checkbox_'):
        return rect(24,28,112,112,'#ae6a38',20)+rect(21,20,112,112,GREEN,20)+rect(31,30,91,91,CREAM,13,INK,3)+(check() if name=='checkbox_on' else '')
    if name=='danger':return ellipse(80,85,62,62,GREEN)+ellipse(80,79,49,49,RED)
    return reward('star')

def panel(name):
    # Blank library components. Layout surfaces in the running game use their
    # own unskewed vector geometry, so these references are never stretched.
    if name=='button_pill':return rect(9,17,302,166,'#a25630',80)+rect(9,8,302,166,RED,80)+path('M45 36 Q160 16 273 35','none','#f8ae85',6)
    if name=='button_rect':return rect(9,17,302,166,'#a25630',24)+rect(9,8,302,166,RED,24)+path('M31 27 H284','none','#f8ae85',6)
    if name in ('tile_green','tile_round'):return rect(63,12,194,180,GREEN if name=='tile_green' else CREAM,24 if name=='tile_green' else 89)
    s=rect(9,11,302,178,CREAM,22)+path('M22 39 V30 Q22 22 36 22 H288','none','#fffaf1',5)
    if name in ('panel_red','panel_green'):s+=path('M12 60 V32 Q12 13 32 13 H288 Q308 13 308 32 V60Z',RED if name=='panel_red' else GREEN)+path('M12 60 H308','none',INK,4)
    if name=='panel_plain':s+=rect(21,23,278,154,'none',14,INK,3)
    if name=='panel_inset':s+=rect(21,23,278,154,'none',14,GREEN,7)
    if name=='panel_tab':s+=path('M14 13 H82 V185 H14Z',GREEN,INK,0)+path('M82 13 V185','none',INK,4)
    if name=='speech':s=path('M28 11 H290 Q310 11 310 30 V143 Q310 163 289 163 H164 L142 193 120 163 H28 Q9 163 9 143 V32 Q9 11 28 11Z',CREAM)
    if name=='folder':s=path('M9 181 V42 Q9 22 28 22 H110 L136 44 H290 Q310 44 310 65 V181Z',CREAM)+path('M10 63 V42 Q10 23 28 23 H109 L135 44 H290 Q310 44 310 64Z',RED)
    if name=='input':s=rect(9,11,302,178,CREAM,22)+rect(31,75,258,54,'none',22,INK,4)
    return s

def svg(body,w=160,h=160):
    return f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}"><g stroke-linejoin="round" stroke-linecap="round">{body}</g></svg>'

def chef(pose):
    # Chef Pepper: the existing character, redrawn with the same warm outlines,
    # simple shadows and cream coat as the rest of the game's vector library.
    hat=path('M44 91 L39 62 Q12 45 32 22 Q43 10 62 18 Q77-7 99 7 Q125-5 137 16 Q164 14 169 37 Q176 64 149 72 L146 91Z','#fff6e5')
    hat+=path('M55 61 L59 83 M103 49 L104 80 M142 53 L137 80','none','#efd6ae',4)
    body=path('M51 171 Q27 192 18 228 Q92 249 167 228 Q157 190 137 171Z','#fff2dd')
    body+=path('M59 186 L54 231 M133 187 L140 232','none',INK,4)
    body+=ellipse(76,211,3,3,INK,INK,0)+ellipse(121,211,3,3,INK,INK,0)+ellipse(76,227,3,3,INK,INK,0)+ellipse(122,227,3,3,INK,INK,0)
    face=ellipse(39,143,16,21,'#ffc68f')+ellipse(153,143,16,21,'#ffc68f')
    face+=path('M42 118 Q40 80 98 82 Q154 81 151 132 V151 Q149 183 98 185 Q45 180 43 153Z','#ffd09e')
    face+=path('M40 131 Q22 99 48 82 Q67 51 100 75 Q135 58 154 82 Q170 97 152 124 L134 112 Q122 107 115 92 Q100 115 78 113 Q66 129 44 130Z','#8b5029')
    face+=ellipse(61,157,10,7,'#f59b82','none',0)+ellipse(135,157,10,7,'#f59b82','none',0)+ellipse(99,151,5,4,'#e9a675','none',0)
    if pose=='stars':face+=star(70,138,12,GOLD)+star(128,138,12,GOLD)
    elif pose in ('celebrate','proud','wave','fists'):
        face+=path('M62 139 Q70 129 79 138 M119 138 Q128 128 137 138','none',INK,4)
    else:
        face+=ellipse(72,139,7,10,INK,INK,0)+ellipse(128,139,7,10,INK,INK,0)+ellipse(70,136,2,3,'#fff4df','none',0)+ellipse(126,136,2,3,'#fff4df','none',0)
    if pose in ('surprised','worried'):face+=ellipse(99,169,8,10,'#8d4e2c',INK,3)+path('M63 122 L78 117 M120 117 L136 121','none',INK,4)
    elif pose=='thinking':face+=path('M90 169 Q100 162 110 169','none',INK,4)
    else:face+=path('M86 165 Q99 178 113 163','none',INK,4)
    scarf=path('M77 184 L101 195 123 183 112 203 100 198 89 207Z','#dd4b3a')+ellipse(100,192,7,7,'#e86447',INK,3)
    hands=''
    if pose in ('wave','celebrate','stars'):
        hands=path('M146 196 L172 151 Q170 134 178 129 Q190 123 194 140 L198 159 Q197 171 183 173 L167 211Z','#ffd09e')+path('M179 144 l-2-17 M186 144 l1-18','none',INK,3)
    if pose=='fists':hands=ellipse(36,188,15,18,'#ffd09e')+ellipse(155,188,15,18,'#ffd09e')
    if pose=='thinking':hands=path('M133 211 L111 180 Q100 168 91 178 Q85 188 99 194 L116 224Z','#ffd09e')
    return hat+body+face+scarf+hands

def food_character(name):
    family=name.split('_')[0]
    b=''
    if family in ('burger','bun'):
        b=path('M22 81 Q28 21 83 19 Q142 21 147 83Z','#f6b047')+path('M21 92 H149 L145 123 H27Z','#6fb641')+path('M23 115 L151 111 142 147 37 152Z',GOLD)+path('M20 141 Q80 118 150 144 V162 H21Z','#87502c')+path('M26 165 H147 Q150 190 87 191 Q23 188 26 165Z','#efad4d')
        for x,y in ((48,59),(74,38),(99,51),(124,66)):b+=ellipse(x,y,7,3,CREAM,INK,1)
        eyey=73
    else:
        b=path('M19 45 L100 12 152 54 133 178 46 190Z','#bd7d3d')+path('M22 52 L102 24 144 59 126 172 48 178Z',CREAM)+path('M46 144 L132 127 131 146 48 163Z','#70b247')+path('M46 155 L129 139 126 159 49 178Z','#ed796d')
        eyey=91
    b+=ellipse(62,eyey,6,9,INK,INK,0)+ellipse(111,eyey,6,9,INK,INK,0)+ellipse(52,eyey+14,9,5,'#f1956b','none',0)+ellipse(123,eyey+14,9,5,'#f1956b','none',0)
    if any(x in name for x in ('angry','grr','mad')):b+=path(f'M52 {eyey-17} l17 7 M104 {eyey-10} l17-7 M76 {eyey+28} q11-11 21 0','none',INK,4)
    elif 'wink' in name:b+=path(f'M105 {eyey} q8-8 15 0','none',INK,5)+path(f'M76 {eyey+19} q11 14 23 0','none',INK,4)
    else:b+=path(f'M75 {eyey+19} q13 17 27-1','none',INK,4)
    return b

def legacy(name):
    if name.startswith('chef_'):return svg(chef(name[5:]),200,250)
    if name.startswith(('burger_','bun_','sand_')):return svg(food_character(name),180,210)
    if name in ('recipebook','book'):
        b=path('M31 31 L120 21 131 127 41 142Z','#df7654')+path('M42 38 L108 30 118 119 50 132Z',CREAM)+path('M31 31 L23 39 33 149 130 134 130 124 41 138Z','#bd603c')
        b+=group(food_character('burger_happy'),'translate(46 38) scale(.36)')
    elif name=='clipboard':b=rect(28,24,106,127,CREAM,10)+rect(59,13,46,24,'#d9b97f',7)+path('M48 61 H116 M48 84 H116 M48 107 H102','none',GREEN,7)
    elif name=='calendar':b=rect(20,30,125,112,CREAM,12)+path('M23 61 H142 M50 18 V44 M117 18 V44','none',RED,11)+star(83,99,25,GOLD)
    elif name=='chefhat':b=group(chef('calm').split('<path')[0] if False else path('M40 128 V69 Q17 62 23 41 Q30 19 52 25 Q68-3 91 14 Q116-3 133 24 Q155 24 154 48 Q156 69 132 72 V129Z',CREAM)+path('M43 111 H129 M62 72 V101 M110 72 V101','none','#d3b58e',5),'')
    elif name=='video':b=rect(16,29,130,101,RED,20)+path('M65 51 L111 80 64 109Z',CREAM)
    elif name=='vibrate':b=rect(52,26,60,114,CREAM,10)+path('M32 49 L21 68 34 83 23 104 M132 48 L144 67 132 83 143 104','none',BLUE,8)+ellipse(82,124,4,4,INK,INK,0)
    elif name=='globe':b=ellipse(80,80,62,62,BLUE)+path('M41 33 L59 34 63 53 94 55 99 74 79 94 86 124 66 136 53 108 32 87 44 66 31 50Z',GREEN,INK,3)
    elif name=='cloud':b=path('M22 123 Q-5 94 23 73 Q28 35 61 42 Q81 9 108 35 Q137 28 139 67 Q170 79 148 116Z',CREAM)
    elif name=='plate':b=ellipse(80,99,70,33,CREAM)+ellipse(80,92,68,31,'#fff9e9')+ellipse(80,92,53,23,'#f2e3ca',INK,2)
    elif name=='wave':b=path('M47 137 L22 96 Q15 80 30 78 L50 95 40 43 Q38 28 50 30 L65 78 59 25 Q60 12 72 20 L81 74 86 25 Q91 12 100 26 L100 80 114 42 Q121 30 128 42 L114 103 Q119 144 82 147Z','#ffd09e')
    else:b=star()
    return svg(b)

def main():
    manifest_path=ROOT/'assets/reference-manifest.json'
    manifest=json.loads(manifest_path.read_text())
    out=ROOT/'assets/ui';out.mkdir(parents=True,exist_ok=True)
    for a in manifest['ui']:
        name=a['id'];category=a['category'];w,h=(320,200) if category=='panels' else (160,160)
        draw={'controls':control,'rewards':reward,'status':status,'panels':panel}[category]
        (out/f'{name}.svg').write_text(svg(draw(name),w,h))
        for key in ('png','native_fidelity','comparison','path_count','color_precision','fingerprint'):a.pop(key,None)
        a.update(svg=f'assets/ui/{name}.svg',width=w,height=h,method='Handcrafted SVG shapes and paths; reference-inspired')
    manifest['redraw_method']='Handcrafted vector geometry. No raster images or tracing correction paths.'
    aliases={'sound':'sound_on','stopwatch':'stopwatch','pause':'pause','music':'music','clock':'clock','medal':'trophy','gem':'gem','check':'complete','play':'play','heart':'heart','xp':'lightning','close':'close','gear':'settings','flame':'flame','refresh':'restart','back':'back','shop':'shop','starOff':'star','sparkle':'sparkles','medal2':'medal','coin':'coin','crown':'crown','star':'star','lock':'lock','home':'home'}
    icons=ROOT/'assets/icons'
    legacy_names=set('recipebook book clipboard calendar chefhat video vibrate globe cloud plate wave'.split())
    legacy_names.update('chef_'+pose for pose in 'wave celebrate proud worried thinking stars fists calm surprised'.split())
    legacy_names.update('burger_happy burger_yay burger_smile burger_cheer bun_grin bun_happy bun_laugh bun_cheer sand_angry sand_mad sand_cheer sand_cool sand_happy sand_wink sand_grr sand_laugh'.split())
    for name in sorted(set(aliases)|legacy_names):
        (icons/f'{name}.svg').write_text((out/f'{aliases[name]}.svg').read_text() if name in aliases else legacy(name))
    manifest_path.write_text(json.dumps(manifest,indent=2)+'\n')
    print(f'Drew {len(manifest["ui"])} UI assets as native SVG geometry.')

if __name__=='__main__': main()
