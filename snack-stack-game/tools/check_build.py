"""Meaningful asset and offline browser checks for this SVG integration."""
from pathlib import Path
import asyncio,json,hashlib,zipfile,xml.etree.ElementTree as ET
from playwright.async_api import async_playwright
ROOT=Path(__file__).resolve().parents[1]
NS='{http://www.w3.org/2000/svg}'

def asset_checks():
    files=list((ROOT/'assets').rglob('*.svg'))
    for path in files:
        root=ET.parse(path).getroot()
        assert not root.findall('.//'+NS+'image'),f'Embedded image in {path}'
        assert '{d}' not in path.read_text(),f'Unexpanded geometry in {path}'
    manifest=json.loads((ROOT/'assets/reference-manifest.json').read_text())
    for asset in manifest['ui']+manifest['backgrounds']:
        path=ROOT/asset['svg'];asset['svg_bytes']=path.stat().st_size
        asset['elements']=len(list(ET.parse(path).getroot().iter()));asset['embedded_images']=0
    manifest['pending_reference_archive']='export (22).zip: exceeds the upload-transfer tool limit of 32 MiB; split archive or external download link required.'
    (ROOT/'assets/reference-manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
    # Verify preserved menu files against the supplied game ZIP, if available.
    candidates=list(Path('/workspace/attachments').glob('*/Snack Stack.zip'))
    menus={}
    for path in (ROOT/'assets/bg').glob('cafe_*.svg'):
        digest=hashlib.sha256(path.read_bytes()).hexdigest();menus[path.name]=digest
        if candidates:
            with zipfile.ZipFile(candidates[0]) as z:
                entry=next(n for n in z.namelist() if n.endswith('assets/bg/'+path.name))
                assert hashlib.sha256(z.read(entry)).hexdigest()==digest,'Menu scene changed: '+path.name
    return {'svg_files':len(files),'embedded_images':0,'preserved_menu_sha256':menus,'reference_scenes':len(manifest['backgrounds']),'reference_ui':len(manifest['ui'])}

ANIMATION_CHECK=r'''() => {
 const NS='http://www.w3.org/2000/svg',mk=(tag,parent)=>{const n=document.createElementNS(NS,tag);parent.appendChild(n);return n;};
 const host=mk('svg',document.body);host.style.cssText='position:absolute;left:-10000px;top:0;visibility:hidden';
 const root=mk('g',host),R={'#dishRoot':root,'#animDefs':mk('defs',host),'#fx':mk('g',host),'#falling':mk('g',host)};
 for(const id of ['baseBack','backContents','dish','fronts','baseFront'])R['#'+id]=mk('g',root);
 let scene=SS.DishScene(R,{reduced:false,liquidSplash:true,pressed:()=>scene.pressDone()});
 const checked=[];
 for(const recipe of SS.DATA.recipes) {
  scene.setDish({base:recipe.base,seq:recipe.ingredient_sequence.map((id,i)=>[id,recipe.cols[i]]),finish:recipe.finish});
  const base=R['#baseBack'].innerHTML,front=R['#baseFront'].innerHTML;
  for(let i=0;i<recipe.ingredient_sequence.length;i++) {
   scene.place(i,0,true,'perfect');
   for(let frame=0;frame<360;frame++) {if(scene.pressWaiting)scene.press();scene.tick(1/60,0,0);}
   if(scene.pressWaiting||scene.busy)throw Error('Animation remained pending: '+recipe.id+' step '+i);
  }
  if(R['#baseBack'].innerHTML!==base||R['#baseFront'].innerHTML!==front)throw Error('Container segments changed: '+recipe.id);
  for(const element of host.querySelectorAll('*'))for(const attr of ['d','transform','x','y','width','height']) {
   if(/NaN|Infinity/.test(element.getAttribute(attr)||''))throw Error('Nonfinite SVG geometry: '+recipe.id);
  }
  checked.push(recipe.id);
 }
 scene.reset();host.remove();return {recipes_animated:checked.length,containers_rigid:true,nonfinite_geometry:0};
}'''

async def browser_checks():
    report={}
    async with async_playwright() as p:
        browser=await p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
        for name in ['PLAY-OFFLINE','ART-CATALOG']:
            context=await browser.new_context(offline=True,viewport={'width':1200 if name=='ART-CATALOG' else 540,'height':900 if name=='ART-CATALOG' else 960})
            page=await context.new_page();errors=[];failed=[]
            page.on('pageerror',lambda e:errors.append(str(e)))
            page.on('requestfailed',lambda r:failed.append(r.url[:100]))
            await page.set_content((ROOT/(name+'.html')).read_text(),wait_until='load',timeout=60000)
            await page.wait_for_function('window.SS_CATALOG_READY===true' if name=='ART-CATALOG' else "window.SS&&SS.UI.current==='splash'",timeout=45000)
            assert await page.evaluate('SS.Reference.loaded')==92
            assert not await page.evaluate('SS.Reference.issues')
            if name=='PLAY-OFFLINE':
                await page.evaluate("SS.Save.d.tutorial_done=true;SS.Game.start({mode:'classic',difficulty:'normal'});SS.Game.countdown=0;SS.Game.s.start();SS.Game.s.spawnTimer=1000;")
                await page.keyboard.down('ArrowRight');await page.wait_for_timeout(120);await page.keyboard.up('ArrowRight')
                assert await page.evaluate('SS.Game.s.plate.x')>540
                placed=await page.evaluate("""()=>{const s=SS.Game.s;s.objects=[];s.plate.x=s.plate.targetX=540;const before=s.orderIdx,o=s.spawnIngredient(s.requiredId,'required');o.x=s.plate.x+s.stack.supportCenter;o.y=s.supportTopY;s.contact(o);return s.orderIdx===before+1;}""")
                assert placed,'Required ingredient did not stack'
                await page.evaluate('SS.Game.pause()');await page.wait_for_timeout(300)
                before=await page.evaluate('SS.Game.s.timeLeft');await page.wait_for_timeout(200)
                assert await page.evaluate('SS.Game.s.timeLeft')==before
                await page.locator('.pause-action.primary').click();assert not await page.evaluate('SS.Game.paused')
                await page.evaluate("SS.Game.stop();SS.UI.show('settings')");await page.wait_for_timeout(350)
                old=await page.evaluate('SS.Save.d.settings.sfx');await page.locator('[data-arg=sfx]').click()
                assert await page.evaluate('SS.Save.d.settings.sfx')!=old
                await page.evaluate("SS.UI.show('shop',{tab:'kitchens'})");await page.wait_for_timeout(350)
                coins=await page.evaluate('SS.Save.d.coins');await page.locator('[data-arg=kitchen_arcade]').click()
                assert await page.evaluate('SS.Save.d.cosmetics.kitchen')=='kitchen_arcade'
                assert await page.evaluate('SS.Save.d.coins')==coins
                report[name]={'offline':True,'loaded_svg_images':92,'keyboard_movement':True,'ingredient_catch':True,'pause_resume':True,'settings_toggle':True,'free_theme_equip':True}
            else:
                counts={}
                for tab,count in [('scenes',10),('controls',20),('rewards',20),('status',20),('panels',12),('recipes',117),('ingredients',512),('menus',5)]:
                    await page.locator('[data-tab='+tab+']').click();counts[tab]=await page.locator('.asset').count();assert counts[tab]==count,(tab,counts[tab])
                await page.locator('[data-tab=recipes]').click()
                await page.locator('[data-recipe]').first.click();await page.wait_for_timeout(1600)
                assert '2 /' in await page.locator('#build-state').inner_text() or '3 /' in await page.locator('#build-state').inner_text()
                assert await page.locator('#assembly .guide').count()==0
                await page.locator('[data-replay]').click();await page.wait_for_timeout(100)
                assert '1 /' in await page.locator('#build-state').inner_text()
                await page.locator('[data-close]').click()
                animation=await page.evaluate(ANIMATION_CHECK)
                report[name]={'offline':True,'tabs':counts,'replay':True,**animation}
            assert not errors,errors
            assert not failed,failed
            report[name]['page_errors']=errors;report[name]['failed_requests']=failed
            await context.close()
        await browser.close()
    return report

async def main():
    report={'assets':asset_checks(),'browser':await browser_checks()}
    (ROOT/'review/build-validation.json').write_text(json.dumps(report,indent=2)+'\n')
    print(json.dumps(report,indent=2))

if __name__=='__main__':asyncio.run(main())
