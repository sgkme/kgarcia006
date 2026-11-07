"""Bundle the SVG game and review catalog for direct offline browser use."""
from pathlib import Path
import base64,json,mimetypes,re
ROOT=Path(__file__).resolve().parents[1]

def data_uri(path):
    mime={'.svg':'image/svg+xml','.woff2':'font/woff2'}.get(path.suffix,mimetypes.guess_type(path.name)[0] or 'application/octet-stream')
    return 'data:'+mime+';base64,'+base64.b64encode(path.read_bytes()).decode()

def css_text(path):
    def inline(match):
        value=match.group(1).strip().strip('\"\'')
        if value.startswith(('data:','http:','https:','#')):return match.group(0)
        return 'url("'+data_uri((path.parent/value).resolve())+'")'
    return re.sub(r'url\(([^)]+)\)',inline,path.read_text())

def script(src):return '<script>\n'+src.replace('</script','<\\/script')+'\n</script>'

def main():
    index=(ROOT/'index.html').read_text()
    # Use native SVG sources throughout. No original raster sheets are bundled.
    assets={str(p.relative_to(ROOT)):data_uri(p) for p in (ROOT/'assets').rglob('*.svg') if 'dish/' not in str(p.relative_to(ROOT)) and 'vector/' not in str(p.relative_to(ROOT))}
    text={'assets/dish/sprites.svg':(ROOT/'assets/dish/sprites.svg').read_text()}
    inline=script('window.SS_EMBEDDED_ASSETS='+json.dumps(assets,separators=(',',':'))+';window.SS_EMBEDDED_TEXT='+json.dumps(text,separators=(',',':'))+';')
    def replace_css(m):return '<style>\n'+css_text(ROOT/m.group(1))+'\n</style>'
    bundled=re.sub(r'<link rel="stylesheet" href="([^"]+)">',replace_css,index)
    bundled=bundled.replace('<script src="js/core/util.js"></script>',inline+'\n<script src="js/core/util.js"></script>')
    bundled=re.sub(r'<script src="([^"]+)"></script>',lambda m:script((ROOT/m.group(1)).read_text()),bundled)
    (ROOT/'PLAY-OFFLINE.html').write_text(bundled)
    includes=re.findall(r'<script src="([^"]+)"></script>',index)
    modules='\n'.join(script((ROOT/src).read_text()) for src in includes if src!='js/main.js')
    catalog='''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Snack Stack · SVG Review Catalog</title>'''
    catalog+='<style>'+css_text(ROOT/'assets/fonts/fonts.css')+'\n'+(ROOT/'review/catalog.css').read_text()+'</style></head><body>'
    catalog+='''<header><h1>Snack Stack · SVG Review Catalog</h1><p>Gameplay scenes, UI components, recipe builds and ingredient artwork. Select a tab to inspect the current SVG build.</p></header><nav role="tablist" aria-label="Asset categories"></nav><main><div class="tools"></div><p class="note"></p><p id="count"></p><div class="grid"></div></main><dialog id="detail"><div id="detail-body"></div></dialog>'''
    catalog+=inline+modules+script((ROOT/'review/catalog.js').read_text())+'</body></html>'
    (ROOT/'ART-CATALOG.html').write_text(catalog)
    print(f'Offline game: {len(bundled.encode()):,} bytes; offline catalog: {len(catalog.encode()):,} bytes.')

if __name__=='__main__':main()
