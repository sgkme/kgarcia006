"""Capture the actual running game; no artwork is composited into gameplay."""
import asyncio
from pathlib import Path
from playwright.async_api import async_playwright
from PIL import Image, ImageDraw, ImageFont
ROOT=Path(__file__).resolve().parents[1]

async def main():
    async with async_playwright() as p:
        browser=await p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
        page=await browser.new_page(viewport={'width':540,'height':960})
        await page.goto('http://127.0.0.1:8002/',wait_until='networkidle')
        await page.wait_for_function("SS.UI.current==='splash'")
        await page.evaluate("SS.Save.d.tutorial_done=true;SS.Game.start({mode:'classic',difficulty:'normal'});SS.Game.countdown=0;SS.Game.s.start();")
        await page.wait_for_timeout(2200)
        await page.screenshot(path=str(ROOT/'review/handdrawn-gameplay-food-truck.png'))
        await page.evaluate('SS.Game.pause()')
        await page.wait_for_timeout(450)
        await page.screenshot(path=str(ROOT/'review/handdrawn-pause.png'))
        await browser.close()
    canvas=Image.new('RGB',(1080,1004),'#fff3df');draw=ImageDraw.Draw(canvas)
    font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',20)
    draw.text((18,12),'SVG redraw — plate on serving counter',font=font,fill='#513019')
    draw.text((558,12),'Rebuilt pause menu',font=font,fill='#513019')
    for i,name in enumerate(('handdrawn-gameplay-food-truck','handdrawn-pause')):
        canvas.paste(Image.open(ROOT/f'review/{name}.png').convert('RGB'),(540*i,44))
    canvas.save(ROOT/'review/Hand-Drawn-SVG-Progress.png')
    print('Captured game and pause menu with the foreground serving counter.')

if __name__=='__main__':asyncio.run(main())
