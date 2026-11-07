"""Hand-authored scene geometry based on the ten supplied reference scenes.

All geometry is deliberately specified below: SVG paths, ellipses, rectangles,
gradients and reusable vector props. No raster images or bitmap tracing.
"""
from pathlib import Path
from html import escape
import json, math, argparse

ROOT=Path(__file__).resolve().parents[1]
INK='#342820'
CREAM='#fff3da'
RED='#f45c8d'
YELLOW='#ffda4d'
TURQ='#55d9d0'

class Drawing:
    def __init__(self): self.parts=[]
    def add(self,s): self.parts.append(s); return self
    def rect(self,x,y,w,h,c,r=0,stroke=INK,sw=6):return self.add(R(x,y,w,h,c,r,stroke,sw))
    def path(self,d,c='none',stroke=INK,sw=6):return self.add(P(d,c,stroke,sw))
    def ellipse(self,x,y,rx,ry,c,stroke=INK,sw=6):return self.add(E(x,y,rx,ry,c,stroke,sw))
    def group(self,s,x,y,scale=1,rot=0):return self.add(G(s,x,y,scale,rot))
    def text(self,x,y,t,size=32,c=CREAM):return self.add(T(x,y,t,size,c))
    def __str__(self):return ''.join(self.parts)

def R(x,y,w,h,c,r=0,stroke=INK,sw=6):return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{r}" fill="{c}" stroke="{stroke}" stroke-width="{sw}"/>'
def E(x,y,rx,ry,c,stroke=INK,sw=6):return f'<ellipse cx="{x}" cy="{y}" rx="{rx}" ry="{ry}" fill="{c}" stroke="{stroke}" stroke-width="{sw}"/>'
def P(d,c='none',stroke=INK,sw=6):return f'<path d="{d}" fill="{c}" stroke="{stroke}" stroke-width="{sw}" stroke-linecap="round" stroke-linejoin="round"/>'
def G(s,x,y,scale=1,rot=0):return f'<g transform="translate({x} {y}) scale({scale}) rotate({rot})">{s}</g>'
def T(x,y,t,size=32,c=CREAM):return f'<text x="{x}" y="{y}" text-anchor="middle" font-family="Arial Rounded MT Bold,Arial,sans-serif" font-weight="900" font-size="{size}" fill="{c}">{escape(t)}</text>'
def line(x,y,xx,yy,c=INK,sw=6):return P(f'M{x} {y} L{xx} {yy}','none',c,sw)
def star(x,y,r,c=YELLOW):
    pts=[]
    for i in range(10):
        a=-math.pi/2+i*math.pi/5;rr=r if i%2==0 else r*.45
        pts.append(f'{x+math.cos(a)*rr:.2f},{y+math.sin(a)*rr:.2f}')
    return f'<polygon points="{" ".join(pts)}" fill="{c}"/>'
def cloud(x,y,s=1):return G(P('M0 69 C-6 46 15 32 33 42 C33 15 51 6 68 16 C86-25 146-21 163 22 C183 12 205 27 206 46 C232 49 231 81 209 84 H20 Q0 84 0 69Z','#fffdf8','none',0),x,y,s)
def flower(x,y,s=1):
    return G(''.join(E(math.cos(i*math.pi/3)*12,math.sin(i*math.pi/3)*12,8,8,'#fff8d8','none',0) for i in range(6))+E(0,0,7,7,'#ffd93e','none',0),x,y,s)
def bush(x,y,s=1,c='#4d9b42'):
    return G(P('M-90 56 Q-121 28-91 5 Q-105-28-64-34 Q-64-76-22-61 Q8-89 36-61 Q77-69 81-28 Q118-14 103 22 Q130 56 95 75 Q88 109 45 94 Q14 119-17 94 Q-61 113-72 80 Q-104 87-90 56Z',c)+P('M-80 21 Q-52 0-36 28 Q-14-5 14 16 Q38-8 63 13 Q89 6 96 36 Q84 59 60 48 Q45 73 15 55 Q-8 80-39 57 Q-67 68-80 44Z','#65b54d','none',0),x,y,s)
def tree(x,y,s=1):
    return G(P('M-17 340 L-20 61 14 57 24 184 77 72 96 84 29 238 31 340Z','#a66c32')+P('M-9 302 V134 L4 162 13 323Z','#c18b48','none',0)+bush(0,0,1.1,'#328d3d')+bush(43,-86,.94,'#78b64b')+bush(-59,-60,1.15,'#3b9c43'),x,y,s)
def bunting(x,y,w=500):
    s=P(f'M0 0 Q{w/2} 90 {w} 82','none',INK,7)
    colors=[RED,YELLOW,'#52c9e8',RED,YELLOW]
    for i in range(5):
        xx=i*w/5; yy=82*(1-(1-i/5)**2)
        s+=P(f'M{xx} {yy} L{xx+18} {yy+89} {xx+w/5-5} {yy+20}Z',colors[i])
    return G(s,x,y)
def lamp(x,y,color=YELLOW,s=1):
    return G(line(0,0,0,100)+R(-12,91,24,24,'#aaa8a1',4)+P('M-49 165 Q-48 115 0 112 Q48 115 49 165Z',color)+E(0,164,48,6,'#fff2ad',INK,4),x,y,s)
def popcorn(x=0,y=0,s=1):
    b=''
    for xx,yy,r in [(-32,5,16),(-10,-8,18),(12,-19,18),(34,-6,16),(47,10,13),(14,8,19),(-8,15,18),(-31,23,15),(32,24,16)]:b+=E(xx,yy,r,r*.88,'#fff1b5',INK if yy<0 else 'none',4)
    b+=P('M-48 28 H48 L37 126 H-35Z','#fff5de')+P('M-39 30 H-22 L-15 124 H-32Z M-5 30 H12 L12 124 H-5Z M29 30 H44 L34 124 H23Z',RED,'none',0)
    return G(b,x,y,s)
def fries(x=0,y=0,s=1):
    b=''
    for i in range(6):
        xx=-37+i*14;yy=-20-(i%3)*13;b+=G(R(xx,yy,11,91,'#ffc642',3,'#d58b20',3),0,0,1,(i-3)*4)
    b+=P('M-44 49 H47 L33 130 H-30Z','#52c6dc')+P('M-38 64 H41 L37 91 Q11 81-1 94 Q-17 103-34 87Z',CREAM,'none',0)
    return G(b,x,y,s)
def cup(x=0,y=0,s=1,color=RED,straw=True):
    b=(P('M15 15 L26-34 H47','none',INK,7)+P('M15 15 L26-34 H47','none',color,4)) if straw else ''
    b+=P('M-42 24 H43 L31 126 H-29Z',CREAM)+P('M-37 48 H39 L34 91 H-32Z',color,'none',0)+R(-44,15,89,16,CREAM,5)+E(0,67,6,7,YELLOW,'none',0)
    return G(b,x,y,s)
def donut(x=0,y=0,s=1,color=RED):return G(E(0,0,45,42,'#e7a75b')+P('M-41-8 Q-42-31-15-35 Q10-48 33-26 Q50-7 34 10 Q22 17 10 6 Q-8 20-20 7 Q-36 18-41-8Z',color,'none',0)+E(0,0,13,15,'#834a26',INK,4)+P('M-24-22 L-18-28 M19-23 L26-19 M-26 0 L-30-4 M24 14 L29 9','none',YELLOW,4),x,y,s)
def chalkboard(x,y,w=195,h=385):
    s=R(0,0,w,h,'#c58a3b',18)+R(14,17,w-28,h-34,'#33343b',9)+T(w/2,65,'SNACKS',31)+P(f'M42 85 Q{w/2} 80 {w-38} 85','none',RED,6)
    for i,prop in enumerate((popcorn,fries,donut,cup)):
        yy=119+i*84;s+=prop(45,yy,.27) if prop!=donut else donut(45,yy+16,.38)
        s+=line(91,yy+22,w-34,yy+22,[YELLOW,RED,TURQ,'#9bd05a'][i],9)
    return G(s,x,y)
def plant(x,y,s=1):
    b=''
    for i in range(7):
        a=(i-3)*19;b+=G(P('M0 9 Q-45-65-16-99 Q20-87 8 7Z',['#83ba4b','#58a744','#389248'][i%3],INK,4),0,0,1,a)
    b+=P('M-50 0 H51 L38 77 H-36Z','#cf8b48')+R(-56,-8,112,18,'#dfa563',5)
    return G(b,x,y,s)
def bottle(x,y,s=1,color='#64d5fa',label=False):
    b=R(-32,11,64,130,color,14)+P('M-29 30 Q0 20 29 30','none','#d1f6ff',4)+R(-21,-7,42,25,YELLOW,7)
    if label:b+=R(-31,53,62,54,CREAM,0,INK,2)+star(0,80,19,'#fff')
    return G(b,x,y,s)
def sandwich(x,y,s=1):
    return G(E(0,104,137,45,'#fffaf1')+P('M-113 60 L-5-3 112 58-1 121Z','#e5aa53')+P('M-110 53 L-3-10 111 50-1 111Z','#f7dc94')+P('M-103 58 L-4 2 108 58 0 106Z','#71b243',INK,4)+P('M-101 44 L-4-13 103 45 0 93Z',YELLOW,INK,4)+P('M-112 23 L-3-43 111 22 0 81Z',CREAM)+P('M-95 25 L-2-26 93 27','none','#fff8df',6),x,y,s)
def awning(x,y,w,h=100,colors=(RED,CREAM),n=8):
    s='';dw=w/n
    for i in range(n):
        xx=dw*i;s+=P(f'M{xx} 0 H{xx+dw} V{h*.55} Q{xx+dw} {h} {xx+dw/2} {h} Q{xx} {h} {xx} {h*.55}Z',colors[i%len(colors)],INK,4)
    return G(s,x,y)

def food_truck():
    d=Drawing().rect(0,0,1088,1920,'url(#sky)',stroke='none',sw=0)
    d.ellipse(956,121,82,84,YELLOW,'none',0).add(cloud(334,112,1)).add(cloud(694,224,.99))
    d.path('M271 566 V346 H312 L336 307 364 345 V436 H437 V566 M480 575 V381 H555 V575 M1014 575 V293 H1035 V257 H1088 V579','#5ec3f0','none',0)
    d.add(tree(28,151,1.85)).add(bush(39,574,1.25)).add(bush(298,625,1.1)).add(bunting(81,389,376))
    d.rect(0,1310,1088,137,'#8db855',stroke='none',sw=0)
    # Road, paving and curb retain the reference's perspective.
    d.rect(0,1444,1088,181,'#dac8bc',stroke='none',sw=0).path('M0 1520 H1088 M71 1445 L0 1515 M459 1445 L333 1624 M745 1445 L820 1624','none','#b8a299',7)
    d.rect(0,1624,1088,111,'#aaa7b7',stroke='#817b87',sw=8).rect(0,1627,1088,25,'#ddd8dc',stroke='none',sw=0)
    d.path('M90 1627 L76 1646 V1732 M827 1627 L841 1646 V1732','none','#827c86',7)
    d.rect(0,1737,1088,183,'#76819d',stroke='none',sw=0)
    for x in (63,329,594,859):d.rect(x,1834,164,16,'#a2abc1',8,'none',0)
    # Umbrella behind the van.
    d.path('M878 620 L904 448 928 451 905 624Z','#6d7881')
    d.path('M607 464 Q732 374 892 362 Q894 328 915 332 Q942 332 940 365 Q1034 394 1118 447 L1113 541 977 555 969 538 Q897 552 834 528 Q755 551 711 518 Q657 526 605 502Z',CREAM,'#fff8e8',20)
    d.path('M607 464 Q742 372 894 365 Q897 337 918 339 Q938 341 937 368 Q1041 400 1103 445 L1103 535 Q1018 553 969 532 Q906 550 832 526 Q748 549 709 516 Q657 526 607 499Z',CREAM)
    d.path('M610 465 Q749 376 904 367 Q780 432 709 518 L612 501Z M910 369 Q949 404 968 531 Q904 548 835 527 Q869 407 910 369 M940 375 Q1030 394 1102 445 V533 L1084 539 Q1044 453 940 375Z',RED,'none',0)
    d.path('M612 466 Q858 498 1103 518','none','#745040',5)
    # Vent, wheels and main body; the silhouette follows the source van.
    d.path('M432 592 L443 548 Q447 526 473 526 H653 Q677 526 681 552 L688 595Z','#dfd8cd','#fff8e8',16)
    d.path('M432 592 L443 548 Q447 526 473 526 H653 Q677 526 681 552 L688 595Z','#dfd8cd')
    d.path('M513 553 H555 M569 553 H611 M513 573 H555 M569 573 H611','none',INK,9)
    for x in (149,981):d.ellipse(x,1321,116,117,'#373840').ellipse(x,1321,72,75,'#fff5df').ellipse(x,1321,49,50,'#c6c2b7')
    body='M-38 1006 L-5 811 Q30 622 155 607 Q523 581 942 605 Q1049 606 1067 703 L1076 1211 Q957 1177 918 1241 Q890 1280 891 1326 H360 Q355 1175 222 1148 Q101 1124 58 1291 H-27Z'
    d.path(body,'url(#van)','#fff7df',20).path(body,'url(#van)',INK,8)
    d.path('M-23 1225 H1068 V1210 Q961 1175 917 1240 Q892 1282 892 1324 H359 Q352 1205 259 1164 Q119 1111 57 1292 H-23Z',RED,INK,7)
    d.rect(353,1324,547,33,'#52c1e5',8,INK,8).rect(782,1249,76,51,YELLOW,14,INK,5).rect(795,1259,51,30,'#f4b73f',5,INK,4)
    d.path('M-23 1008 L24 776 Q33 721 66 721 H206 V1177 Q91 1165 57 1292 H-23Z',TURQ,INK,6)
    d.path('M-5 1003 L44 785 Q50 752 71 752 H158 Q178 752 178 774 V982 Q178 1001 157 1001Z','#62c7f4',INK,8)
    d.path('M6 955 L150 758 H173 L12 979 M22 986 L173 783 V807 L39 991Z','#b1e9ff','none',0)
    d.rect(25,935,49,104,'#656266',12,INK,8).rect(155,1038,20,53,'#5e6065',8,INK,6)
    d.ellipse(1,1125,55,49,'#ffeaa3',INK,8).rect(-11,1293,63,60,'#d8d4c9',12,INK,8)
    # Service opening and alternating scalloped canopy.
    d.rect(246,696,552,390,'#283341',10,INK,10).rect(274,725,500,335,'#33414f',4,'none',0)
    d.path('M257 659 H797 L825 704 H230Z',CREAM,INK,8)
    for i in range(8):
        xx=231+i*74;d.path(f'M{xx} 704 H{xx+74} V720 Q{xx+74} 753 {xx+37} 753 Q{xx} 753 {xx} 720Z',RED if i%2==0 else CREAM,INK,5)
    d.add(lamp(419,754,YELLOW,.86)).add(lamp(639,754,YELLOW,.86))
    d.rect(475,850,110,62,'#927044',5,INK,5).rect(472,846,114,22,'#9c7750',5,INK,5).rect(407,903,207,18,'#697785',5,INK,5)
    d.rect(411,923,197,67,'#3e4d5b',4,INK,4)
    for i in range(4):d.add(cup(317,932+i*25,.56,RED,False))
    d.add(cup(370,985,.68,YELLOW,False))
    for i in range(3):d.path(f'M{356+i*17} 978 L{346+i*22} 940','none',CREAM,6)
    for i in range(6):d.add(donut(434+(i%3)*47,1007+(i//3)*34,.6,[RED,'#9cdd63','#5dccdf'][i%3]))
    d.rect(398,1037,170,28,RED,4,INK,5).add(popcorn(662,956,.9)).add(fries(743,971,.7))
    d.rect(238,1068,574,32,'#dea449',12,INK,8).path('M252 1075 H796','none','#efbc6c',5)
    d.add(chalkboard(829,676,232,471))
    for x,y,c in [(406,1144,TURQ),(455,1181,'#ba7ac0'),(566,1151,RED),(679,1146,YELLOW),(761,1180,'#6ed7ee'),(713,1274,TURQ)]:d.path(f'M{x} {y} l16 17-23 8Z',c,'#7a7565',3)
    # A-frame sidewalk sign, separate from the serving truck.
    board=P('M5 350 L41 13 78 6 54 350Z','#b77a36',INK,8)+P('M58 18 L255 5 298 355 267 361 249 309 86 327 88 364 55 371Z','#dda048',INK,8)+P('M78 38 L233 24 260 301 90 316Z','#34353b',INK,6)+popcorn(168,132,.78)+line(121,282,215,273,RED,10)
    for i in range(8):
        a=i*math.pi/4;board+=line(166+math.cos(a)*75,164+math.sin(a)*75,166+math.cos(a)*85,164+math.sin(a)*85,YELLOW,6)
    d.group(board,31,1174,1.03,-3)
    d.add(bush(1061,1291,.9)).path('M970 1361 H1111 L1097 1480 H983Z','#fff3dc',INK,7)
    d.path('M987 1371 H1009 L1019 1476 H995Z M1040 1371 H1065 L1068 1476 H1046Z M1090 1371 H1110 L1097 1476 H1088Z',RED,'none',0).rect(961,1345,161,33,'#ffe5df',8,INK,7)
    return str(d)

def checker_floor(d,y,c1,c2,step=170):
    d.rect(0,y,1088,1920-y,c1,stroke='none',sw=0)
    for row,yy in enumerate(range(y,1920,115)):
        for col in range(-1,8):
            if (row+col)%2==0:
                x=col*step+(row%2)*26;d.path(f'M{x} {yy} h{step} l35 115 h-{step+18}Z',c2,'none',0)

def movie_theater():
    d=Drawing().rect(0,0,1088,1920,'#ffd978',stroke='none',sw=0)
    for x in range(0,1088,135):d.rect(x,120,70,1090,'#ffde85',stroke='none',sw=0)
    d.add(awning(0,0,1088,145,('#ff6467',CREAM),10))
    d.add(lamp(30,138,'#74cee9',1.3)).add(lamp(1055,138,'#74cee9',1.3))
    for x,c in ((134,'#173c66'),(420,'#f1a0bb'),(706,'#4fb6c2')):
        d.rect(x,206,235,315,'#b98b50',9,INK,6).rect(x+14,220,207,287,CREAM,3,INK,4).rect(x+25,231,185,265,c,1,INK,3)
    # Rocket poster, popcorn poster and film reel poster.
    d.group(P('M-44 58 L-10-33 Q9-76 47-78 Q63-35 27-4 L-24 72Z','#fff2d9')+P('M10-39 L32-61 34-37Z','#ef6e67')+E(11,-21,13,13,'#68c9ea',INK,4)+P('M-30 39 L-64 70-27 64 M-11 63 L-14 99 9 58Z','#ee6a61')+P('M-44 81 L-65 116-28 94Z',YELLOW,INK,3),258,346,.9,15)
    for x,y in ((168,265),(315,282),(177,390),(306,430)):d.add(star(x,y,11,CREAM))
    d.add(popcorn(538,315,1.05))
    d.ellipse(824,332,72,72,'#aac9cd',INK,6)
    for a in range(5):d.ellipse(824+math.cos(a*math.pi*2/5)*45,332+math.sin(a*math.pi*2/5)*45,16,16,'#314b61',INK,3)
    d.path('M864 381 Q938 373 910 435 H836 V451 H937','none','#24435b',13)
    for x in (251,537,822):d.path(f'M{x-60} 466 H{x+60}','none',CREAM,7)
    # Popcorn case and its transparent front.
    d.rect(24,571,345,448,'#f2e9c9',6,INK,7).rect(40,656,310,340,'#8fd4dd',2,INK,4)
    d.rect(12,560,368,100,'#e95c58',8,INK,7).text(196,625,'POPCORN',38)
    for x in (38,86,137,190,240,290,344):d.ellipse(x,577,5,5,YELLOW,'none',0)
    for row in range(6):
        for col in range(11):d.ellipse(52+col*27+(row%2)*10,860+row*24,15,12,['#ffed9c','#fff6cc','#ffe082'][(row+col)%3],'#d5b35c',1.5)
    d.add(popcorn(153,767,.82)).path('M280 716 L312 739 297 772 266 755Z','#9bbbc9',INK,4).path('M266 755 L236 807','none',INK,7)
    d.path('M53 680 V985 M331 680 V985','none','#e6fff9',9)
    # Candy vending display.
    d.rect(382,645,343,378,'#676b87',9,INK,7).rect(398,669,312,331,'#2c3049',3,INK,4)
    colors=['#69d3ef','#f188bd','#f0cc38','#70d35f','#ea668b','#a783e1']
    for row in range(4):
        for col in range(6):
            x=408+col*49;y=686+row*73;d.rect(x,y,39,62,colors[(row+col)%6],3,INK,2)
            d.path(f'M{x+8} {y+7} V{y+25} M{x+18} {y+7} V{y+25}','none','#fff1b9',3)
            if row>0:d.ellipse(x+20,y+43,8,8,colors[(col+3)%6],INK,2)
    d.rect(376,624,355,22,'#f5a3c3',4,INK,4)
    # Soda dispenser: four distinct valves and a tray.
    d.rect(744,626,275,391,'#495b6a',8,INK,7).rect(732,585,296,102,'#62b5df',10,INK,7).text(880,652,'SODA',54)
    for i,c in enumerate(('#ed7386','#b5dd74','#f4d166','#76d4e6')):
        d.rect(760+i*61,704,53,60,c,2,INK,4).rect(775+i*61,764,20,24,'#363b45',3,INK,3)
    d.rect(763,928,232,52,'#27363e',2,INK,4).path('M772 940 H987 M772 951 H987 M772 963 H987','none','#9aaab4',3)
    for i in range(6):d.add(cup(1047,787+i*32,.55,'#ec666e',False))
    d.rect(-10,1020,1110,38,'#efddc7',8,INK,7).rect(0,1058,1088,155,'#ee5a5d',0,INK,7)
    d.path('M70 1148 H300 M788 1148 H1024','none',YELLOW,13)
    for x,r in ((410,25),(544,43),(680,25)):d.add(star(x,1149,r,YELLOW))
    d.rect(0,1212,1088,210,'#fff0d0',0,INK,6)
    for x in range(0,1088,105):d.rect(x,1217,54,200,'#f26969',stroke='none',sw=0)
    d.rect(0,1410,1088,33,'#b63d4a',stroke=INK,sw=6)
    checker_floor(d,1445,'#f4f0db','#9bd6f1',210)
    # Queue barriers are behind the player's new serving counter.
    d.path('M-30 1457 Q41 1496 111 1446 M978 1446 Q1045 1501 1119 1457','none','#622b30',26).path('M-30 1451 Q41 1490 111 1440 M978 1440 Q1045 1495 1119 1451','none','#d94d59',17)
    for x in (112,976):d.ellipse(x,1810,87,35,'#485369',INK,7).rect(x-18,1459,36,347,'#56667e',12,INK,6).ellipse(x,1450,39,39,'#60738d',INK,6).path(f'M{x-8} 1491 V1780','none','#8b9cb0',5)
    return str(d)

def picnic_park():
    d=Drawing().rect(0,0,1088,1920,'#58c6f2',stroke='none',sw=0)
    d.ellipse(807,181,79,81,YELLOW,'none',0).add(cloud(228,124,1.2)).add(cloud(533,423,.83)).add(cloud(924,358,.94))
    d.path('M0 838 Q98 680 189 774 Q284 645 366 745 Q462 658 559 758 Q636 634 745 732 Q848 632 945 746 Q1032 652 1110 726 V1111 H0Z','#2c9f59','none',0)
    d.path('M0 893 Q110 762 210 838 Q305 744 400 839 Q505 762 612 853 Q748 744 829 838 Q944 742 1088 843 V1920 H0Z','#67bd50','none',0)
    d.rect(0,958,1088,962,'#a4d556',stroke='none',sw=0)
    d.add(tree(28,426,1.7)).add(tree(1108,578,1.35))
    for x,y in ((99,1053),(270,1010),(485,987),(721,1047),(990,1004),(141,1670),(803,1730),(518,1840),(948,1784),(404,1140),(66,1510),(997,1410)):
        d.path(f'M{x-14} {y} l-10-24 21 9 5-30 8 31 21-14-11 27Z','#4f9e3f','none',0)
    for x,y in ((48,1096),(927,1090),(391,1667),(765,1828),(1025,1704),(246,1784)):d.add(flower(x,y,.85))
    # Picnic cloth, clipped gingham pattern in its own quadrilateral.
    cloth='M-35 1198 L722 1013 1129 1455 266 1770Z'
    d.path(cloth,'#fff0d3',INK,7).add(f'<defs><clipPath id="cloth"><path d="{cloth}"/></clipPath></defs>')
    checks=''
    for i in range(-3,11):checks+=P(f'M{i*150} 910 L{i*150+130} 910 {i*150+940} 1820 {i*150+810} 1820Z','#f99a8e','none',0)
    for i in range(7):checks+=P(f'M-60 {1040+i*115} L1050 {760+i*115} 1155 {830+i*115} 45 {1110+i*115}Z','#f99a8e','none',0)
    d.add(f'<g clip-path="url(#cloth)" opacity=".72">{checks}</g>').path(cloth,'none',INK,7)
    # Basket, handle and folded napkin.
    d.path('M108 1106 L135 1316 Q310 1380 493 1291 L529 1104Z','#d6a253',INK,7)
    for x in range(144,500,34):d.path(f'M{x} 1128 l8 171','none','#ac7b37',3)
    for y in range(1144,1308,31):d.path(f'M126 {y} Q310 {y+57} 508 {y-5}','none','#ac7b37',3)
    d.path('M110 1105 L320 1049 528 1101 313 1172Z','#e7b877',INK,7).path('M231 1084 L235 1007 Q300 930 368 972 L372 1083','none',INK,25).path('M231 1084 L235 1007 Q300 930 368 972 L372 1083','none','#e7b877',14)
    d.path('M307 1122 L471 1080 505 1127 424 1228Z','#fff4db',INK,4)
    for i in range(5):d.path(f'M{327+i*28} 1118 l59 60','none','#eb8e89',12)
    d.add(bottle(848,1097,1.2,'#7ddcff')).add(sandwich(663,1304,1.12))
    # Fruit bowl and bright hand-drawn fruit.
    d.path('M107 1375 Q118 1495 260 1499 Q394 1496 405 1374Z',CREAM,INK,7).ellipse(256,1373,149,43,'#ece4e1',INK,7)
    for x,y,c in ((144,1349,'#6545a2'),(160,1304,'#6e4aa9'),(203,1282,'#62419d'),(196,1350,'#744cad'),(239,1324,'#663a9c')):d.ellipse(x,y,28,30,c,INK,4)
    d.path('M290 1314 Q303 1273 321 1301 Q366 1294 372 1331 Q383 1374 345 1392 Q304 1417 283 1375Z','#f7a532',INK,5).path('M310 1302 Q292 1274 319 1262 Q339 1280 325 1301Z','#70ad44',INK,4)
    d.path('M920 1272 Q958 1251 980 1191 Q985 1178 992 1194 Q1005 1284 956 1312 Q928 1325 916 1302Z','#ffe85a',INK,5).path('M921 1287 Q967 1284 984 1239','none','#ecb729',5)
    d.path('M919 1390 Q906 1332 945 1322 Q969 1307 989 1328 Q1032 1321 1024 1366 Q1018 1414 987 1433 Q966 1453 944 1426Z','#ed584a',INK,6).path('M970 1323 l8-27','none',INK,7).path('M975 1310 Q1008 1287 1020 1307 Q998 1324 975 1310Z','#54ab46',INK,4)
    # Watermelon plate and two overlapping wedges.
    d.ellipse(683,1570,146,53,'#e4f7fc',INK,6)
    for x,y,s in ((628,1536,1.1),(716,1550,1)):
        d.group(P('M-88 27 L0-95 88 27 Q0 94-88 27Z','#3fa849',INK,6)+P('M-73 22 L0-78 73 22 Q0 73-73 22Z','#a0dd77',INK,3)+P('M-63 15 L0-70 63 15 Q0 60-63 15Z','#fa6770',INK,3)+P('M-30 6 l-2 10 M0-34 v11 M25 4 l3 10 M-8 24 v9','none',INK,4),x,y,s)
    d.add(bush(-10,1875,1.5)).add(bush(1073,1852,1.6))
    return str(d)

def candy_piece(x,y,kind,color,s=1):
    if kind=='mint':
        b=E(0,0,18,18,CREAM,INK,2)+P('M-14-11 Q7-18 9-3 Q17 13 0 14 Q-16 12-10-2 Q-2-11 7-4','none',color,6)
    elif kind=='worm':b=P('M-13 12 Q-25-4-8-9 Q15-17 10-29','none',INK,12)+P('M-13 12 Q-25-4-8-9 Q15-17 10-29','none',color,8)
    elif kind=='heart':b=P('M0 18 Q-34-5-20-17 Q-10-26 0-13 Q14-28 23-13 Q32 1 0 18Z',color,INK,2)
    elif kind=='ring':b=E(0,0,18,18,color,INK,2)+E(0,0,7,7,CREAM,INK,1)
    else:b=R(-13,-13,26,27,color,6,INK,2)+P('M-8-7 H7','none','#fff1b9',3)
    return G(b,x,y,s)

def candy_jar(x,y,w=180,h=257,color='#62cfeb',kind='gum',key='jar'):
    shape=f'M12 47 Q12 33 35 29 H{w-35} Q{w-12} 34 {w-12} 47 V{h-20} Q{w-12} {h} {w-34} {h} H33 Q12 {h} 12 {h-20}Z'
    s=P(shape,'#d7f4ed',INK,5)+f'<defs><clipPath id="{key}"><path d="{shape}"/></clipPath></defs>'
    colors=['#f16b95','#ffd651','#63d1e8','#a6d859','#b77ad9','#f69964']
    content=''
    for row in range(max(3,int((h-65)/35))):
        for col in range(max(2,int((w-24)/33))):
            xx=30+col*33+(row%2)*9;yy=68+row*35
            content+=candy_piece(xx,yy,kind,colors[(row*2+col)%6],.82)
    s+=f'<g clip-path="url(#{key})">{content}</g>'+P(shape,'none',INK,5)
    s+=P(f'M25 60 V{h-28}','none','#fffdf1',7)+E(w/2,29,w*.45,14,color,INK,4)+E(w/2,11,16,13,color,INK,4)
    return G(s,x,y)

def lollipop(x,y,color=RED,s=1):
    return G(line(0,0,0,117,'#f9e5ac',7)+E(0,0,44,44,CREAM,INK,4)+P('M-18 28 C-50-6-2-51 27-20 C57 16 1 46-18 14 C-38-19 20-29 21 0 C19 20-12 22-11 3 C-10-8 7-10 9 1','none',color,9),x,y,s)

def candy_store():
    d=Drawing().rect(0,0,1088,1920,'#ffe9a5',stroke='none',sw=0)
    for x in range(0,1088,100):d.rect(x,0,40,1540,'#ffe29b',stroke='none',sw=0)
    d.add(awning(-5,0,1100,114,('#ff91bb',CREAM),10)).add(bunting(29,155,1010))
    # Three stocked shelves mirror the positions and kinds of the reference.
    for i,(x,k,c) in enumerate(((24,'gum','#69d5e2'),(233,'mint','#f68db7'),(446,'worm','#56bde4'),(659,'worm','#ae7cdd'))):d.add(candy_jar(x,253,194,284,c,k,'candy-top-'+str(i)))
    for i,c in enumerate((RED,YELLOW,TURQ)):
        d.add(lollipop(936+(i-1)*45,342+(i%2)*53,c,.75))
    d.rect(856,476,212,54,'#f69ac7',8,INK,5).rect(0,540,1088,36,'#f7b3c1',5,INK,6)
    # Gumball machine and four jars on the middle shelf.
    d.ellipse(129,719,99,111,'#c5f3f3',INK,6)
    for i in range(22):
        a=i*2.4;r=20+(i%4)*17;d.ellipse(129+math.cos(a)*r,716+math.sin(a)*r,17,17,['#f5749b','#ffda45','#62cde6','#8ad46a'][i%4],INK,2)
    d.path('M63 799 H194 L210 979 H50Z','#f27780',INK,6).ellipse(128,864,28,34,'#b6b9a4',INK,4).rect(101,919,55,35,'#5f6962',6,INK,4).rect(45,970,174,25,'#ef6b77',7,INK,5)
    for i,(x,k,c) in enumerate(((246,'gum',YELLOW),(443,'worm',RED),(638,'ring',TURQ),(835,'gum','#f4a754'))):d.add(candy_jar(x,656,194,335,c,k,'candy-mid-'+str(i)))
    d.rect(0,998,1088,36,'#f7b3c1',4,INK,6)
    # Lollipop crate, wrapped candy and two more jars.
    for i,c in enumerate((RED,TURQ,YELLOW,'#ab81da')):d.add(lollipop(83+i*80,1169+(i%2)*20,c,.73))
    d.rect(29,1272,373,133,'#dfb15c',5,INK,5)
    for y in (1289,1327,1366):d.path(f'M37 {y} H392','none','#f6cf7a',9)
    for x in (48,381):d.path(f'M{x} 1276 V1404','none','#9e7033',5)
    for i,c in enumerate((RED,YELLOW,'#98d881',TURQ)):
        d.rect(440,1168+i*57,151,49,c,17,INK,4).path(f'M461 {1192+i*57} H568','none',CREAM,5)
    d.add(candy_jar(626,1141,195,270,RED,'gum','candy-low-a')).add(candy_jar(838,1141,208,270,YELLOW,'heart','candy-low-b'))
    d.rect(0,1418,1088,37,'#ffabc2',4,INK,6).add(awning(0,1452,1088,65,('#ff94bc',CREAM),12))
    # Open display bins, with transparent vector clipping and separate sweets.
    for col,kind in enumerate(('gum','mint','worm','gum','heart')):
        x=20+col*211;d.path(f'M{x} 1581 L{x+18} 1518 H{x+193} L{x+205} 1651 H{x-4}Z','#c5eef1',INK,5)
        for row in range(3):
            for cc in range(5):d.add(candy_piece(x+22+cc*36,1562+row*30,kind,['#f47baa','#ffdc4c','#64d2e0','#9ed96c'][(row+cc)%4],.65))
        d.path(f'M{x-4} 1651 H{x+205}','none','#fff6e4',8)
    d.rect(0,1661,1088,102,TURQ,0,INK,6)
    for i in range(10):d.rect(i*110,1666,54,92,'#5fc6d9' if i%3 else '#ffa5ca',0,'#3996ac',2)
    checker_floor(d,1762,'#fff3dc','#f58fb6',160)
    return str(d)

def loaf(x,y,s=1,kind='baguette'):
    if kind=='baguette':
        b=P('M-29 73 Q-49-8-24-68 Q-9-96 9-82 Q38-36 30 56 Q22 98-3 99 Q-26 99-29 73Z','#edaf54',INK,5)
        b+=P('M-12-54 L13-31 M-20-12 L14 13 M-18 32 L9 55','none','#fff0bc',9)
    else:b=P('M-67 30 Q-76-4-56-25 Q-21-50 19-34 Q63-39 73-4 L73 32Z','#e3a14c',INK,5)+P('M-36-20 l-9 25 M0-29 l-10 34 M36-19 l-10 28','none','#fff0bb',7)
    return G(b,x,y,s)
def cake(x,y,s=1,c=RED):
    return G(R(-52,-10,104,70,'#efb77a',9,INK,4)+P('M-52-9 Q-49-38-27-30 Q-12-59 11-33 Q36-43 51-11 V5 Q33 17 22 4 Q6 18-10 5 Q-31 15-52 3Z',c,INK,4)+P('M-39 24 H40','none',CREAM,7)+E(0,-45,8,9,'#ec5b6f',INK,3),x,y,s)

def bakery_shop():
    d=Drawing().rect(0,0,1088,1920,'#fff0d4',stroke='none',sw=0)
    # Scattered masonry follows the cream bakery wall.
    for x,y in ((36,49),(121,87),(240,28),(415,67),(600,44),(861,34),(1014,70),(705,337),(312,423),(950,329),(544,535)):
        d.rect(x,y,64,23,'#f5ccaa',4,'none',0).rect(x+34,y+32,48,22,'#f6d4b2',4,'none',0)
    d.add(lamp(206,0,'#f58bbb',1.55)).add(lamp(929,0,'#64c2e3',1.55))
    d.rect(331,216,293,349,'#ae7a44',9,INK,7).rect(350,235,255,312,'#303e3d',3,INK,4)
    for i in range(5):
        yy=279+i*47;d.path(f'M372 {yy} l15-14 15 14 v16 h-30Z','none','#d5e1c9',3).path(f'M425 {yy-7} H581 M425 {yy+8} H561','none','#d5e1c9',3)
    # Hanging plant between the menu and the oven.
    d.path('M732 35 V126 M721 143 Q679 282 747 347 M749 143 Q811 259 760 329','none',INK,5)
    d.group(plant(0,0,1),749,170,.65)
    for x,y,a in ((711,209,-35),(752,246,30),(725,290,-30),(783,221,20),(774,312,30)):d.group(P('M0 0 Q-37-14-17-39 Q17-37 16-10Z','#5fa754',INK,4),x,y,.8,a)
    # Bread shelves left.
    d.rect(-25,331,306,589,'#ab7442',6,INK,7)
    for y in (365,560,738):
        d.rect(-10,y,279,162,'#704c31',0,INK,5)
        for i in range(4):d.add(loaf(31+i*69,y+86,.6,'baguette' if y==365 else 'loaf'))
        d.rect(-13,y+160,298,22,'#d6a35c',3,INK,4)
    # Brick oven and its flue on the right.
    d.rect(885,-20,80,471,'#9d9990',0,INK,6)
    d.path('M785 750 V593 Q785 422 956 422 Q1105 430 1122 584 V750Z','#d97950',INK,7)
    for row in range(5):
        yy=453+row*57;d.path(f'M811 {yy} H1104','none','#ad563b',4)
        for col in range(4):
            xx=805+col*88+(row%2)*44;d.path(f'M{xx} {yy} V{yy+55}','none','#ad563b',4)
    d.path('M848 746 V645 Q848 521 965 521 Q1073 527 1075 646 V746Z','#77503b',INK,6)
    d.path('M881 744 V656 Q882 572 965 572 Q1047 574 1049 656 V744Z','#3e342e',INK,5)
    d.path('M906 744 Q899 704 925 670 Q941 682 946 703 Q963 643 980 668 Q1007 702 1012 744Z','#f5af38',INK,0).path('M938 745 Q935 718 954 700 Q980 725 976 745Z',YELLOW,'none',0)
    # Rear worktop, till and small display cakes.
    d.rect(0,759,1088,46,'#e5b264',8,INK,6).rect(0,805,1088,122,'#62c8ac',0,INK,6)
    for x in range(0,1088,94):d.path(f'M{x} 807 V924','none','#449f88',3)
    d.add(cake(401,686,.84,'#f294b7')).add(cake(557,705,.75,'#83553b')).group(plant(0,0,.45),685,746,.85)
    d.rect(85,746,113,33,'#45534b',5,INK,5).rect(112,706,68,47,'#555d50',7,INK,5)
    # Main display case, with a shaped glass roof and three food shelves.
    d.path('M85 1559 V1057 Q88 904 222 904 H750 Q864 909 870 1063 V1559Z','#bd8c4d',INK,8)
    d.path('M105 1055 Q112 927 224 927 H746 Q843 930 848 1055 V1471 H105Z','#9ddce1',INK,6)
    d.path('M130 1062 H825 M120 1203 H840 M111 1352 H847','none','#fff5df',13)
    d.path('M129 1074 H828 M120 1215 H839 M111 1364 H847','none','#ad8a5b',7)
    # Donuts, cinnamon spirals and cupcakes on the upper shelf.
    for i,c in enumerate((RED,'#754b31','#fff1d6','#fff1d6')):d.add(donut(204+i*132,1128,.68,c))
    for i,c in enumerate(('#f2a3bd','#f2c763')):d.add(cake(737+i*61,1128,.37,c))
    # Fruit tart, chocolate slice and a row of cream cakes on middle shelf.
    d.ellipse(225,1282,83,27,'#dba052',INK,4)
    for i,c in enumerate(('#f37868','#edc943','#7eb546','#8152a6','#ed756a')):d.ellipse(178+i*23,1269-(i%2)*14,15,16,c,INK,2)
    d.path('M392 1309 V1256 L500 1228 540 1264 V1310Z','#6f442e',INK,5).path('M394 1256 L499 1232 535 1265 431 1289Z','#9b6a47',INK,4)
    for x in (629,707,787):d.add(cake(x,1283,.49,CREAM))
    for i in range(4):d.add(loaf(183+i*66,1427,.49,'loaf'))
    for i in range(4):d.add(donut(531+i*80,1435,.48,'#f1b658'))
    d.path('M131 1035 L176 949 M149 1174 L239 950','none','#d7f8f3',9)
    d.rect(78,1476,803,43,'#e9b66a',7,INK,6).rect(90,1519,776,132,'#5fc6ac',0,INK,6)
    for x in (135,326,517,708):d.rect(x,1543,144,82,'#7bd6bc',5,INK,4)
    # Baguette basket and heart jar on the side shelf.
    d.rect(913,1093,186,49,'#d6a260',5,INK,5)
    for x in (952,1002,1058):d.add(loaf(x,1001,.77))
    d.path('M929 1034 H1093 L1083 1129 H942Z','#d7a45c',INK,5)
    for x in range(947,1090,21):d.path(f'M{x} 1041 l-1 81','none','#a17135',3)
    for x in (979,1045):d.add(bottle(x,1252,.61,'#f1dec4')).path(f'M{x-14} 1311 q14-22 28 0 q3 14-14 25 q-17-12-14-25Z',RED,INK,2)
    checker_floor(d,1652,'#fff1db','#f6b7b8',235)
    d.ellipse(114,1745,174,67,'#d4a24e',INK,7).path('M60 1799 L36 1920 M163 1799 L189 1920','none',INK,15)
    d.ellipse(275,1850,100,36,'#f1b86a',INK,7).path('M220 1880 L211 1920 M322 1880 L334 1920','none',INK,12)
    d.add(plant(54,1710,.64)).add(bush(1080,1901,1.1))
    return str(d)

def arcade_machine(x,y,s=1,color='#bc53db',flip=False):
    art=P('M0 0 H190 L200 92 172 313 225 393 225 648 H-17 V397 L29 311 17 92Z',color,INK,7)
    art+=P('M19 43 H172 L157 293 H42Z','#283052',INK,6)+P('M33 70 H156 L143 262 H50Z','#14263a',INK,5)
    art+=star(88,148,26,YELLOW)+P('M67 207 Q88 181 110 207 M93 102 l15 15 M48 164 l12 8','none','#4be7d1',7)
    art+=P('M28 323 H171 L204 384 H-1Z','#63296e',INK,6)+E(59,351,10,10,YELLOW,INK,3)+E(106,357,9,9,RED,INK,3)+P('M145 349 V319','none',INK,6)+E(145,314,13,13,RED,INK,4)
    art+=P('M11 410 H193 V632 H11Z','#3d2e69',INK,5)+star(110,498,34,YELLOW)+P('M37 574 L70 539 99 584 76 607Z','#e860c0',INK,3)
    if flip:art=G(art,195,0,1)+'';art=f'<g transform="translate(212 0) scale(-1 1)">{art}</g>'
    return G(art,x,y,s)

def arcade():
    d=Drawing().rect(0,0,1088,1920,'#362546',stroke='none',sw=0)
    for x in range(0,1088,115):d.path(f'M{x} 0 V1400','none','#452b53',5)
    # Twin pink pendants, neon sign and wall drawings.
    d.add(lamp(210,0,'#ec60c6',.87)).add(lamp(895,0,'#ec60c6',.87))
    d.rect(302,122,481,202,'#282847',43,'#2d6586',16).rect(315,133,454,177,'#292945',35,'#50e1e5',7).rect(329,148,426,147,'#473054',24,'#e76be3',5).text(544,248,'SNACKS',75,'#f68be7')
    d.path('M48 254 L154 173 212 286 Q153 264 128 334Z','#4e2a68','#f3ba3f',7)
    d.path('M63 256 L160 193 M84 265 L147 309','none','#f4ba40',5).ellipse(132,245,13,13,RED,'#f6c943',4).ellipse(157,275,13,13,RED,'#f6c943',4)
    d.add(cup(953,246,.9,'#46d9e3')).path('M924 167 L994 188','none','#48e0ea',6)
    for x,y,c in ((148,60,YELLOW),(444,72,TURQ),(687,68,RED),(1043,83,YELLOW),(63,374,TURQ),(1002,377,YELLOW)):
        d.ellipse(x,y,6,6,c,'none',0)
    d.path('M382 56 l-19-17 4 31Z M661 48 l20 17-29 10Z','#fa73bf','none',0)
    # Back-wall stock display.
    d.rect(208,418,680,543,'#29bbca',6,INK,7).rect(227,463,643,476,'#173444',3,INK,6)
    d.add(awning(211,387,677,80,('#f260aa',YELLOW,'#73dcde'),8))
    for row in range(3):
        yy=505+row*144
        for col in range(6):
            xx=250+col*101;c=['#e963ad','#58d5d0','#f0d33d','#ff8d6b','#a979de','#42b0d8'][(col+row)%6]
            d.rect(xx,yy,82,117,c,4,INK,3)
            if row==0:d.add(popcorn(xx+42,yy+39,.32)) if col%2==0 else d.add(cup(xx+43,yy+32,.43,c))
            elif row==1:d.path(f'M{xx+17} {yy+87} l25-60 25 60Z',YELLOW,INK,3).ellipse(xx+43,yy+65,7,7,RED,INK,2)
            else:
                for i in range(3):d.rect(xx+10+i*22,yy+15,14,83,['#ffe26b','#e6a4ed','#86e8e2'][i],2,INK,2)
        d.rect(222,yy+118,652,18,'#43c8d3',2,INK,4)
    # Cropped arcade machines frame the play space.
    d.add(arcade_machine(-112,428,1.2,'#46b7db')).add(arcade_machine(956,438,1.13,'#e65dc0'))
    # Till and condiment jars on the broad, bright snack counter.
    d.rect(24,1011,1040,53,'#fff2e1',6,INK,7).rect(50,947,122,64,'#ec71b7',8,INK,5).rect(64,920,91,32,'#eee5e8',5,INK,4)
    for i,c in enumerate((RED,YELLOW,TURQ)):d.add(bottle(790+i*58,947,.47,c))
    d.rect(61,1065,968,317,YELLOW,0,INK,8)
    d.path('M70 1355 L322 1068 H417 L165 1380Z M665 1380 L931 1067 H1027 V1101 L795 1380Z',RED,'none',0)
    d.path('M75 1212 L199 1068 H278 L69 1313Z M568 1380 L835 1067 H908 L642 1380Z','#40cdd9','none',0)
    d.add(popcorn(550,1178,1.02))
    for x,y,c in ((383,1156,RED),(410,1303,TURQ),(721,1169,RED),(719,1290,TURQ)):d.add(star(x,y,24,c))
    d.rect(55,1381,980,42,'#f9b53f',0,INK,6)
    checker_floor(d,1425,'#fff3de','#2f3247',180)
    d.ellipse(273,1655,82,32,'#e860bd',INK,6).rect(259,1682,25,125,'#8c91a0',8,INK,5).ellipse(269,1812,65,19,'#6e7286',INK,5)
    d.add(arcade_machine(-119,1518,.95,'#2ca8dc')).add(arcade_machine(921,1487,1.05,'#b754d2'))
    return str(d)

def midnight_fridge():
    d=Drawing().rect(0,0,1088,1920,'#252b50',stroke='none',sw=0)
    # Cabinets and night window, with deliberate flat lighting shapes.
    d.rect(0,63,259,715,'#142443',6,'#111d39',8).rect(22,102,214,640,'#1c3362',3,'#101d36',6)
    d.path('M127 105 V738 M23 411 H233','none','#111b35',10).ellipse(116,229,54,55,'#fff0a7','none',0)
    for x,y in ((41,168),(210,312),(70,349),(195,169),(45,513)):d.ellipse(x,y,3,3,'#cad6f4','none',0)
    d.path('M25 720 V637 L63 616 78 651 114 638 132 674 173 652 186 703 233 672 V740Z','#172448','none',0)
    for x in (313,588,860):
        d.rect(x,0,265,280,'#2e345f',5,'#111a35',7).rect(x+20,19,222,240,'#323b6b',5,'#1c2548',4).ellipse(x+220,228,8,8,'#11192e','none',0)
    d.add(plant(155,735,.67)).rect(-10,773,311,61,'#38456d',5,'#141e3b',7).rect(-5,834,305,532,'#2b365a',0,'#111c37',7)
    d.rect(25,864,208,81,'#35466b',8,'#121f3d',5).rect(27,972,203,366,'#2c3c63',5,'#131f3d',5)
    d.path('M65 901 H129 M198 1092 V1188','none','#7381a1',9)
    # Main refrigerator: dark cabinet outside, cream interior and warm shelf light.
    d.rect(288,433,501,981,'#7279a5',32,'#111a38',10).rect(309,455,457,933,'#f9c6e2',21,'#1a2645',7).rect(327,473,420,897,'#fff1c9',15,'#8073a0',5)
    d.rect(344,492,386,21,'#ffffe6',8,'none',0)
    for x in (376,433,490,548):d.add(bottle(x,563,.65,['#ef8fc6','#7de5cb','#f5aa45','#8ed46e'][(x-376)//57]))
    d.path('M590 565 H707 L693 638 H606Z','#e77f87',INK,4)
    for i in range(4):d.ellipse(607+i*28,582,16,16,'#f17c7c',INK,2).path(f'M{603+i*28} 563 l9-9','none','#619f4b',3)
    for y in (651,795,969,1116,1230):d.rect(332,y,412,17,'#e4a8c3',5,'#87739a',4)
    # Covered dishes, milk and orange juice.
    d.rect(355,689,164,64,'#d8ba86',10,'#644d51',4).path('M355 694 H519','none','#8ab89b',13)
    d.add(bottle(583,708,.83,'#a2d6ec',True)).add(bottle(679,706,.83,'#f7b144',True))
    d.rect(354,820,160,48,'#e8b387',8,'#785464',4).rect(350,815,169,15,'#7db398',5,'#605f69',3)
    d.path('M391 936 Q364 890 388 866 Q410 885 427 914 Q445 865 475 882 Q492 912 461 936Z','#f4d564',INK,3)
    d.path('M356 921 Q439 890 514 921 L497 959 H370Z','#8e85b5',INK,4)
    for x,y,c in ((380,894,'#ef81a1'),(414,881,'#9762bb'),(447,897,'#8a78c2'),(471,880,'#f4af5f')):d.ellipse(x,y,15,16,c,INK,2)
    # Yogurt tubs, cheese and wrapped leftovers.
    for i,c in enumerate(('#a9d8e4','#cdb4dd','#f3b6d0')):
        d.rect(366+i*120,993,103,100,c,10,'#7d6993',4).rect(361+i*120,987,113,18,'#fce9d6',5,'#7d6993',3).ellipse(418+i*120,1046,23,23,'#f9d4df','#9987ac',3)
    d.rect(350,1141,111,67,'#f6d45c',7,'#9c7d62',4).rect(476,1142,106,66,'#d5ebc1',7,'#9c7d62',4).path('M600 1208 V1139 L710 1125 718 1206Z','#e2b295',INK,4)
    for y in (1163,1190):d.path(f'M614 {y} H695','none','#c18b72',3)
    d.rect(345,1250,386,104,'#d1eef0',11,'#8c82a0',4)
    for x in (376,420,462,504):d.path(f'M{x} 1333 Q{x-25} 1297 {x} 1268 Q{x+25} 1300 {x+15} 1332Z','#6fbaa2','#477f84',3)
    for x in (551,606,655):d.path(f'M{x} 1346 L{x+37} 1276  {x+54} 1285 {x+20} 1350Z','#e99569','#a96965',3)
    # Open door drawn as one static silhouette with complete door shelves.
    d.path('M777 457 L1014 324 Q1061 297 1078 339 V1511 L775 1396Z','#818bc0','#131c39',10)
    d.path('M796 480 L1024 358 Q1045 347 1049 375 V1470 L796 1371Z','#f9cee2','#b481bb',6)
    for yy in (596,816,1062,1282):
        d.path(f'M811 {yy} L1032 {yy-77} V{yy+84} L811 {yy+119}Z','#e8a8cc','#b67db0',4)
        d.path(f'M819 {yy+99} L1027 {yy+61}','none','#fff0df',7)
    for i,c in enumerate(('#f3bd46','#ed846a','#79bdd9')):d.add(bottle(855+i*68,570-i*20,.53,c))
    for i,c in enumerate(('#eaa15f','#9584ca','#71bf9f')):d.rect(822+i*67,828-i*20,51,119,c,5,'#8c6593',3)
    for i,c in enumerate(('#6dbab1','#f6b45b','#ee8fc1')):d.add(bottle(853+i*65,1138-i*21,.59,c))
    # Floor light and foreground edges are separate flat shapes, not bitmap glows.
    d.path('M308 1411 L781 1411 1052 1919 H27Z','#61538c','none',0).path('M391 1417 H666 L821 1920 H125Z','#9b6d9e','none',0).path('M461 1417 H589 L663 1920 H309Z','#dea384','none',0)
    for y in (1506,1630,1774):d.path(f'M0 {y} H1088','none','#2a2d51',5)
    d.path('M310 1417 L30 1920 M548 1417 L551 1920 M772 1417 L1088 1920','none','#363153',5)
    d.ellipse(44,1423,158,57,'#694a54','#151d36',8).path('M-22 1458 L-48 1920 M111 1458 L157 1920','none','#161e39',18)
    d.add(arcade_machine(929,1435,.83,'#3d3970'))
    for x,y in ((545,1797),(792,1658),(874,1742)):d.ellipse(x,y,17,9,'#d79c5c',INK,3)
    return str(d)

def palm(x,y,s=1,flip=False):
    body=P('M-11 443 Q27 241 6 58 L42 48 Q95 259 36 443Z','#bb8747',INK,7)
    for yy in (116,164,215,267,320,373):body+=P(f'M2 {yy} l57-9','none','#8b6036',5)
    leaves=[('M24 53 Q-164-112-267 49 Q-139-3-25 79 L-53 49 2 63Z','#56b95e'),('M22 48 Q-70-146-171-143 Q-157-38-28 71 L-49 12 5 64Z','#7bca64'),('M23 48 Q30-118 133-149 Q147-19 39 77 L66 22 39 48Z','#48b164'),('M33 49 Q165-94 271 18 Q155-12 74 84 L100 31 56 68Z','#56b55c'),('M32 55 Q192 31 219 187 Q135 100 49 91 L96 67 56 74Z','#49a95b')]
    for dd,c in leaves:body+=P(dd,c,INK,5)
    for xx,yy in ((10,65),(42,81),(63,57)):body+=E(xx,yy,28,30,'#9a6435',INK,5)
    if flip:body=f'<g transform="scale(-1 1)">{body}</g>'
    return G(body,x,y,s)
def banana_bowl(x,y,s=1):
    b=P('M-69 46 Q-78-5-20-24 Q-7-48 10-38 L5-17 Q-1 23-52 30 Q3 30 43-27 L58-30 Q74-10 61 18 Q43 53-18 61Z','#ffdf3f',INK,5)
    b+=P('M-44 31 Q12 35 48-12 M-35 46 Q17 47 54 15','none','#d8a82e',4)
    b+=P('M-94 50 H99 Q92 114 4 117 Q-84 114-94 50Z','#b78142',INK,5)+P('M-78 70 Q3 100 81 70','none','#dfb467',5)
    return G(b,x,y,s)

def beach_shack():
    d=Drawing().rect(0,0,1088,1920,'#8ae1ed',stroke='none',sw=0)
    d.add(cloud(735,48,.8)).ellipse(664,189,74,76,YELLOW,'none',0)
    d.path('M0 689 Q177 658 305 697 Q443 669 586 704 Q763 661 911 699 L1088 679 V1300 H0Z','#38c4d2','none',0)
    for yy,xx in ((751,0),(829,375),(916,57),(999,595)):
        d.path(f'M{xx} {yy} q72-23 132 0 t138 0 M{xx+248} {yy+39} q61-19 111 0','none','#c6f7e8',7)
    d.path('M0 1198 Q177 1131 306 1154 Q566 1100 739 1176 Q922 1155 1088 1107 V1920 H0Z','#ffe1a0','none',0)
    d.add(palm(104,91,1.52)).add(palm(1037,49,1.5,True))
    # Posts and thatched roof. Individual straw edges are drawn, not textured.
    d.rect(43,415,59,1180,'#bc8a48',10,INK,7).rect(949,415,57,1180,'#bc8a48',10,INK,7)
    d.path('M15 371 Q557 303 1065 371 L1116 570 H-35Z','#e9b65b',INK,8)
    d.path('M4 455 Q548 401 1086 457 L1098 559 1069 540 1051 580 1026 547 1006 578 979 543 959 581 932 548 912 582 885 550 866 583 837 550 815 580 789 550 766 582 740 552 716 581 689 549 666 581 640 552 618 581 589 550 569 580 543 549 520 580 491 551 468 579 442 549 420 579 391 549 368 577 339 545 316 576 288 543 267 574 237 545 215 574 187 544 166 574 140 541 116 574 88 542 65 573 37 541 15 570-10 540Z','#f4c874',INK,6)
    for i in range(37):
        x=8+i*30;d.path(f'M{x} 422 l-9 70','none','#d29948',3)
    d.path('M72 529 Q530 626 972 525','none',INK,6)
    for i,c in enumerate((RED,YELLOW,TURQ,'#cf91d2',YELLOW,RED)):
        x=146+i*131;y=546+math.sin((i+.5)*math.pi/6)*43;d.path(f'M{x} {y} l53 64 55-50Z',c,INK,4)
    d.path('M80 650 Q527 755 965 642','none',INK,5)
    for i in range(8):
        x=111+i*116;y=659+math.sin(i*math.pi/7)*50;d.path(f'M{x} {y} v23','none',INK,3).ellipse(x,y+30,13,15,['#f7d05b','#efafbd','#b2e589'][i%3],INK,3)
    # Surfboard outside the right-hand post.
    board='M1009 727 Q1054 603 1084 763 Q1111 1092 1072 1494 Q1021 1534 998 1485 Q967 1083 1009 727Z'
    d.path(board,'#fbe8af',INK,7).add(f'<defs><clipPath id="surf"><path d="{board}"/></clipPath></defs>')
    d.add('<g clip-path="url(#surf)">'+P('M1005 653 Q1032 1024 1006 1531 L1038 1531 Q1064 984 1033 653Z',RED,'none',0)+P('M1050 653 Q1080 1094 1052 1531 H1076 Q1112 1019 1073 653Z',TURQ,'none',0)+'</g>')
    # Menu boards hanging on the left post.
    for i,c in enumerate((RED,TURQ,'#f5b33d')):
        d.rect(16,675+i*103,166,89,c,10,INK,5)
        if i==0:d.add(flower(98,719,1.1))
        elif i==1:d.add(star(98,821,29,'#e9ffdf'))
        else:d.path('M75 934 L104 899 128 935 Q99 956 75 934Z',YELLOW,'#fff1ad',4)
    # Cups, coconuts and a bowl of bananas on the worktop.
    d.add(plant(90,1078,.82))
    for i,c in enumerate((YELLOW,RED,TURQ,'#8ed66b')):d.add(cup(241+i*92,1038,.67,c))
    d.add(banana_bowl(797,1049,1.1))
    for i in range(4):d.path(f'M{240+i*92} 1036 l20-92','none',CREAM,7)
    d.rect(-5,1109,997,52,'#dbab62',8,INK,7).path('M6 1120 H978','none','#f9d28b',5)
    d.rect(33,1161,922,475,'#50b5aa',0,INK,7)
    for x in range(62,953,96):d.path(f'M{x} 1170 V1623','none','#348f89',4)
    d.rect(539,1211,352,351,'#c49654',8,INK,6).rect(556,1229,318,316,'#344c4b',3,INK,4)
    for i,prop in enumerate((cup,fries,donut)):
        yy=1268+i*87;d.add(prop(609,yy,.31));d.path(f'M668 {yy+22} H834','none',[YELLOW,RED,TURQ][i],8)
    d.rect(89,1342,285,261,'#a87442',7,INK,6)
    for yy in (1373,1445,1519):d.rect(72,yy,319,31,'#d6a765',4,INK,4)
    for i,c in enumerate(('#f8cc39','#f0a32b','#b6d75b')):d.ellipse(133+i*76,1346,45,39,c,INK,4)
    d.group(plant(0,0,1),118,1279,.39)
    d.path('M262 1360 L306 1289 344 1357 Q305 1399 262 1360Z','#f56372',INK,5).path('M265 1359 Q306 1389 343 1357','none','#64b652',9)
    # Stool and planted barrel, left visible above the added serving counter.
    d.ellipse(350,1589,115,36,'#f481a3',INK,7).path('M278 1618 L242 1845 M414 1618 L452 1844 M258 1764 H436','none',INK,17).path('M278 1618 L242 1845 M414 1618 L452 1844','none','#c58a47',9)
    d.path('M974 1533 H1130 L1110 1764 H992Z','#b88248',INK,6)
    for x in (1009,1054,1094):d.path(f'M{x} 1545 V1753','none','#8f5e34',5)
    d.rect(978,1588,147,23,'#725c45',2,INK,4).add(plant(1040,1534,1.08))
    d.add(palm(-26,1900,.85)).add(palm(1091,1910,.85,True))
    for x,y in ((514,1671),(683,1748),(864,1652),(126,1866),(555,1882)):d.ellipse(x,y,11,5,'#e6b96e','none',0)
    return str(d)

def space_station():
    d=Drawing().rect(0,0,1088,1920,'#b4c9df',stroke='none',sw=0)
    for row in range(8):
        for col in range(5):
            x=col*240-(row%2)*120;y=80+row*175;d.rect(x,y,239,174,'#c1d2e3',4,'#829bb6',3)
            for xx,yy in ((x+15,y+15),(x+222,y+158)):d.ellipse(xx,yy,4,4,'#66829c','none',0)
    d.rect(0,0,1088,77,'#47bddb',0,INK,6)
    for x,w in ((76,337),(457,342),(850,195)):d.rect(x,23,w,17,'#d3fbff',8,'none',0)
    d.rect(66,131,406,194,'#b67fcc',34,INK,6).rect(82,149,373,160,'#4e3c89',22,'#f7b5e9',5).text(282,218,'SPACE',52).text(282,277,'CAFE',52)
    d.add(star(133,226,31,YELLOW)).ellipse(125,222,46,17,'none','#f0b4ef',4)
    # Porthole with a complete star field and hand-drawn planets.
    d.ellipse(785,478,253,265,'#8099b9',INK,7).ellipse(785,478,228,240,'#e3eef5',INK,5).ellipse(785,478,213,225,'#232d5b',INK,6)
    for a in range(12):
        aa=a*math.pi/6;d.ellipse(785+math.cos(aa)*240,478+math.sin(aa)*251,6,6,'#4c6384',INK,1)
    for x,y,r in ((650,345,5),(749,283,4),(872,319,4),(948,418,5),(882,591,4),(693,610,5),(778,580,3),(604,459,3)):
        d.path(f'M{x-r} {y} H{x+r} M{x} {y-r} V{y+r}','none','#c9dcf6',3)
    d.ellipse(659,430,38,29,'#59c5c1',INK,3).path('M629 428 Q655 416 686 438','none','#87e2a5',6)
    d.group(E(0,0,70,66,'#e6bd62',INK,4)+E(0,0,117,20,'none','#f5d687',13)+P('M-46-28 Q0-8 49-11 M-55 13 Q0 32 45 28','none','#f5d585',5),856,409,1,-22)
    d.ellipse(667,588,57,55,'#ac83c9',INK,4).path('M624 566 Q653 589 697 585','none','#c7a7e2',8)
    d.ellipse(898,584,26,23,'#f4ac6e',INK,3).path('M869 584 H926','none','#ffd18f',5)
    # Drinks dispenser, framed vending display and pastry case.
    d.rect(158,514,362,181,'#67c4e5',27,INK,6).rect(175,532,329,144,'#218dbd',18,'#d6f7f8',5)
    d.ellipse(232,591,30,23,YELLOW,INK,3).ellipse(232,591,45,9,'none',CREAM,3).add(cup(331,571,.48,RED)).add(bottle(435,561,.45,'#9ce2e5'))
    d.rect(126,704,401,454,'#d5e4ed',18,INK,7).rect(151,731,351,322,'#3b5c76',6,INK,5)
    for i,c in enumerate(('#f4c444','#f37fab','#8bdc7b','#6acde6')):
        d.rect(167+i*80,749,68,231,c,5,INK,4)
        for j in range(14):d.ellipse(179+i*80+(j%3)*17,767+(j//3)*43,4,8,CREAM,'none',0)
        d.rect(175+i*80,992,49,38,c,7,INK,3).rect(188+i*80,1034,21,33,'#7695af',3,INK,3)
    d.rect(165,1088,321,44,'#6e8ba5',8,INK,4)
    d.rect(553,802,461,358,'#859fb9',25,INK,7).path('M572 853 Q580 823 611 823 H961 Q993 825 994 855 V1118 H572Z','#9bd6e6',INK,5)
    d.rect(576,947,416,15,'#e9f2ee',3,INK,4)
    for x in (623,708,795,880):d.add(sandwich(x,872,.27))
    for x in (661,743,826,912):d.add(cake(x,1063,.39,CREAM)).add(donut(x,993,.34,RED))
    d.path('M602 881 L653 833 M609 933 L716 835','none','#d7f8f8',6)
    # Wall controls, air vents and plants.
    for x,y in ((7,527),(1005,711)):
        d.rect(x,y,68,190,'#5d849e',12,INK,5)
        for j in range(4):d.rect(x+14,y+21+j*37,39,19,'#5ce0df',4,INK,2)
    d.add(plant(53,1137,.64)).rect(0,1167,1088,55,'#ecf6f7',5,INK,6).rect(0,1222,1088,169,'#6cbcd7',0,INK,6)
    d.rect(0,1391,1088,36,'#dddfd1',0,INK,5)
    for x in range(0,1088,93):d.path(f'M{x} 1424 l28-30 h40 l-27 30Z',YELLOW,'none',0)
    d.rect(0,1430,1088,490,'#a7c0da',0,'none',0)
    for yy in (1538,1667,1814):d.path(f'M0 {yy} H1088','none','#7e9bb7',4)
    d.path('M225 1430 L-42 1920 M540 1430 V1920 M848 1430 L1135 1920','none','#7e9bb7',4)
    # Cafeteria tables and stools frame the foreground work area.
    for x in (175,1007):
        d.ellipse(x,1840,164,50,'#738daa',INK,7).rect(x-35,1575,70,258,'#7c9ab5',10,INK,6).ellipse(x,1559,278,104,'#e6f6ef',INK,7).path(f'M{x-253} 1584 Q{x} 1650 {x+253} 1584','none','#61cde1',13)
        d.add(bottle(x-52,1466,.67,'#75bfe6',True)).add(fries(x+36,1478,.56))
    for x in (394,789):d.ellipse(x,1837,79,23,'#839eb6',INK,5).rect(x-17,1710,34,123,'#94a9bc',8,INK,5).ellipse(x,1691,104,38,'#ffd353',INK,6)
    return str(d)

def candle(x,y,s=1):
    return G(P('M-16 3 Q-20-11-7-22 Q7-32 9-49 Q26-26 18-8 Q14 8-1 8Z','#ffb73f','#8d5231',3)+P('M-3-1 Q-10-12 1-23 Q11-10 7-1Z','#fff2a1','none',0)+P('M-21 5 H23 V79 H-22Z','#ffe2a0',INK,4)+P('M-21 9 Q-7 21-4 7 Q6 32 16 9 L23 22','none','#fff1c6',5),x,y,s)
def pumpkin(x,y,s=1):
    return G(P('M-41 8 Q-70-40-36-56 Q-12-69 3-48 Q29-68 48-50 Q78-23 43 12 Q7 39-28 23Z','#e28738',INK,5)+P('M3-51 Q-10-72 9-82 L18-68 11-47Z','#8f9a48',INK,4)+P('M-18-46 Q-39-2-13 23 M21-47 Q43-7 17 25','none','#bf6530',4),x,y,s)
def ghost(x,y,s=1,c='#fff1c3'):
    return G(P('M-31 31 V-9 Q-30-51 1-51 Q33-50 34-8 V33 L17 24 2 38-12 27-31 36Z',c,INK,4)+E(-10,-9,4,7,'#553657','none',0)+E(12,-9,4,7,'#553657','none',0)+E(0,9,5,7,'#553657','none',0),x,y,s)
def cobweb(x,y,s=1,flip=False):
    b=''
    for a in (.05,.28,.52,.76,1.03,1.27,1.55):b+=line(0,0,math.cos(a)*220,math.sin(a)*220,'#cbb6d5',3)
    for r in (46,93,149,208):
        pts=[(math.cos(a)*r,math.sin(a)*r) for a in (.05,.28,.52,.76,1.03,1.27,1.55)]
        dd=f'M{pts[0][0]:.1f} {pts[0][1]:.1f}'
        for xx,yy in pts[1:]:dd+=f' Q{xx*.72:.1f} {yy*.72:.1f} {xx:.1f} {yy:.1f}'
        b+=P(dd,'none','#cbb6d5',3)
    return G(b,x,y,s if not flip else -s)

def haunted_house():
    d=Drawing().rect(0,0,1088,1920,'#52345f',stroke='none',sw=0)
    for x in range(0,1088,91):d.path(f'M{x} 0 V1560','none','#402947',5)
    d.add(cobweb(0,0,1.15)).add(G(cobweb(0,0,.9),1088,0,1)).add(cobweb(1088,0,-.9))
    # Arched moonlit window and crooked castle silhouette.
    d.path('M708 968 V477 Q712 270 906 277 Q1105 286 1121 493 V970Z','#97647e',INK,9)
    d.path('M746 922 V482 Q748 316 906 318 Q1070 325 1082 487 V922Z','#34284f',INK,7)
    d.ellipse(929,486,100,111,'#fff0b9','none',0)
    d.path('M752 905 V701 L785 720 800 623 822 624 828 688 863 688 861 568 885 525 908 569 909 719 942 687 948 610 972 577 990 615 990 736 1030 701 1041 908Z','#49305d','none',0)
    d.path('M813 624 L802 560 785 622Z M871 568 L886 485 903 570Z M951 615 L973 527 990 615Z','#302443','none',0)
    for x,y in ((872,649),(958,692),(1004,822),(818,770)):d.rect(x,y,9,22,'#ad86be',3,'none',0)
    d.rect(704,921,405,44,'#aa7458',8,INK,6).add(candle(764,881,.68)).add(candle(822,900,.5)).add(candy_jar(977,865,105,100,'#9974c1','gum','haunt-window'))
    # Pendant lamp with an orange scalloped shade.
    d.path('M663 0 V161','none',INK,7).ellipse(663,160,19,20,'#5a3b68',INK,5)
    d.path('M592 235 Q599 170 663 175 Q725 171 736 235 L714 226 699 247 681 233 664 254 646 232 627 246 611 226Z','#8e5a9d',INK,6)
    d.path('M613 226 Q634 264 645 228 M657 237 Q675 271 687 237 M700 233 Q712 253 724 234','none','#f3ab54',10)
    # Three crooked shelves and their sweets.
    for x,y,w in ((43,326,565),(84,675,492),(42,1007,472)):
        d.rect(x,y,w,35,'#a2744f',5,INK,7).path(f'M{x+35} {y+34} V{y+83} H{x+62} M{x+w-45} {y+34} V{y+73}','none',INK,8)
    d.add(candy_jar(65,113,155,211,'#9478bd','gum','haunt-top'))
    for i,c in enumerate(('#b67bd0','#f18eb5','#e6a148')):d.add(lollipop(316+i*61,207-(i%2)*27,c,.44))
    d.add(pumpkin(374,312,.73)).add(candle(499,285,.7)).add(candle(554,292,.5))
    d.add(candy_jar(105,458,149,217,'#a87acb','worm','haunt-mid-a')).add(candy_jar(280,464,144,211,'#8b72bc','gum','haunt-mid-b')).add(candy_jar(447,504,102,171,'#ad85c8','heart','haunt-mid-c'))
    d.add(candle(87,956,.6)).add(cake(220,958,.55,'#a67ac5')).add(cake(337,956,.58,'#f5a2c5'))
    d.path('M351 938 Q421 924 470 944 L454 961 H365Z','#dfb949',INK,4).path('M372 936 L414 864 428 914 455 939Z','#594065',INK,4).path('M397 903 L434 916','none',RED,8)
    # Hanging ghost ornaments and the wood shop counter.
    d.path('M159 1050 V1113 M258 1050 V1116 M355 1050 V1113','none','#ad8eb3',3)
    d.add(ghost(159,1142,.48)).add(ghost(258,1148,.48,'#edb17d')).add(ghost(355,1145,.48,'#bd8bc2'))
    d.path('M60 1261 H1049 V1577 H61Z','#a06d50',INK,8)
    for yy in (1284,1374,1470):d.path(f'M71 {yy} H1040','none','#744632',6)
    for x in range(99,1049,110):d.path(f'M{x} 1285 l-6 285','none','#784b37',4)
    d.rect(34,1220,1043,61,'#b7835e',8,INK,8).path('M53 1231 H1062','none','#d6a377',6)
    d.add(candy_jar(124,1097,116,124,'#a783c0','gum','haunt-counter')).add(candle(984,1171,.75))
    d.rect(765,1142,164,77,'#5b405a',8,INK,5).rect(788,1114,124,42,'#7a5271',7,INK,4)
    d.path('M427 1278 H707 L697 1510 625 1470 569 1525 506 1480 437 1507Z','#80518d','#d79a5b',5).add(pumpkin(571,1413,.72))
    # Timber floor and the embroidered ghost rug.
    d.rect(0,1582,1088,338,'#68455b',0,INK,5)
    for yy in (1657,1743,1835):d.path(f'M0 {yy} H1088','none','#442b43',5)
    for x in range(-80,1200,183):d.path(f'M{x} 1583 l-74 337','none','#442b43',5)
    rug='M169 1661 H907 L1031 1895 H33Z'
    d.path(rug,'#925591',INK,8).path('M199 1690 H879 L976 1864 H94Z','none','#d58d64',7).add(ghost(539,1783,1.15,'#b16da8'))
    for x,y in ((217,1734),(830,1734),(163,1825),(897,1825)):d.add(star(x,y,18,'#c68e9e'))
    d.add(cobweb(193,1690,.42)).add(cobweb(873,1690,.42))
    return str(d)

DEFS='''<defs><linearGradient id="sky" x2="0" y2="1"><stop stop-color="#70cdf5"/><stop offset="1" stop-color="#87d6f6"/></linearGradient><linearGradient id="van" x2="0" y2="1"><stop stop-color="#ffe779"/><stop offset="1" stop-color="#ffcf3c"/></linearGradient></defs>'''

SCENES={'food_truck':food_truck,'movie_theater':movie_theater,'picnic_park':picnic_park,'candy_store':candy_store,'bakery_shop':bakery_shop,'arcade':arcade,'midnight_fridge':midnight_fridge,'beach_shack':beach_shack,'space_station':space_station,'haunted_house':haunted_house}

def serving_counter(theme):
    palettes={
        'food_truck':('#f2d49a','#e6b76c','#61cfc5'),
        'movie_theater':('#f4dfba','#c99855','#e25757'),
        'picnic_park':('#e8bc78','#bd7d3d','#b87538'),
        'candy_store':('#fff0d8','#e5b8c5','#60cbd4'),
        'bakery_shop':('#f1cc8a','#c59250','#67c4a7'),
        'arcade':('#fff0c7','#f6c93c','#ed5baa'),
        'midnight_fridge':('#5c618e','#3e426a','#313955'),
        'beach_shack':('#efcf8d','#cb9753','#50b9a4'),
        'space_station':('#e2eefa','#a6c1db','#7f9dbc'),
        'haunted_house':('#a87958','#70442e','#6b4634')
    }
    top,lip,front=palettes[theme]
    d=Drawing()
    d.path('M-20 1548 H1100 L1160 1742 H-80Z',top,INK,7)
    d.path('M-20 1562 H1101','none','#fff3d2' if theme!='midnight_fridge' else '#7e82a6',5)
    d.path('M-80 1742 H1160 V1781 H-80Z',lip,INK,7)
    d.rect(-20,1781,1120,150,front,0,INK,7)
    d.path('M30 1799 H1050 M50 1910 V1815 H1030 V1910','none',lip,5)
    if theme=='space_station':
        for x in range(30,1080,90):d.path(f'M{x} 1792 l-28 23 h35 l28-23Z',YELLOW,'none',0)
    elif theme in ('food_truck','bakery_shop','beach_shack','candy_store'):
        for x in (270,540,810):d.path(f'M{x} 1822 V1918','none',lip,4)
    elif theme=='arcade':
        for x in (180,450,720,990):d.add(star(x,1848,22,YELLOW))
    return f'<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920"><g id="serving-counter" stroke-linejoin="round">{d}</g></svg>'

def main():
    ap=argparse.ArgumentParser();ap.add_argument('--only');args=ap.parse_args()
    p=ROOT/'assets/reference-manifest.json';m=json.loads(p.read_text());out=ROOT/'assets/bg/gameplay';out.mkdir(parents=True,exist_ok=True)
    count=0
    counters=ROOT/'assets/bg/counters';counters.mkdir(parents=True,exist_ok=True)
    for a in m['backgrounds']:
        (counters/f'{a["id"]}.svg').write_text(serving_counter(a['id']))
        a['counter_svg']=f'assets/bg/counters/{a["id"]}.svg'
        if a['id'] not in SCENES or args.only and args.only!=a['id']:continue
        body=SCENES[a['id']]()
        svg=f'<svg xmlns="http://www.w3.org/2000/svg" width="1088" height="1920" viewBox="0 0 1088 1920">{DEFS}<g stroke-linejoin="round" stroke-linecap="round">{body}</g></svg>'
        (out/f'{a["id"]}.svg').write_text(svg)
        for key in ('png','native_fidelity','comparison','path_count','color_precision','fingerprint'):a.pop(key,None)
        a.update(svg=f'assets/bg/gameplay/{a["id"]}.svg',width=1088,height=1920,method='Handcrafted SVG composition and vector props')
        count+=1
    p.write_text(json.dumps(m,indent=2)+'\n');print(f'Drew {count} gameplay scenes as native SVG geometry.')

if __name__=='__main__':main()
