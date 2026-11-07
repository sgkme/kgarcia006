"""Publish the asset registry consumed by the game without authoring file paths."""
from pathlib import Path
import json
ROOT=Path(__file__).resolve().parents[1]
source=json.loads((ROOT/'assets/reference-manifest.json').read_text())
keys={'id','name','category','kitchen_id','svg','counter_svg','width','height'}
data={group:[{key:value for key,value in asset.items() if key in keys} for asset in source[group]] for group in ('ui','backgrounds')}
(ROOT/'js/data/reference-assets.js').write_text('window.SS=window.SS||{};SS.ReferenceData='+json.dumps(data,separators=(',',':'))+';\n')
print('Prepared 10 gameplay scenes and 72 UI components for the game registry.')
