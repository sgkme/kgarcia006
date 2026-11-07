"""Package the editable SVG game plus the two standalone offline HTML files."""
from pathlib import Path
import hashlib, json, shutil, zipfile
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT.parent/'downloads'

def main():
    OUT.mkdir(exist_ok=True)
    target=OUT/'Snack-Stack-SVG-Game-Review.zip'
    files=[]
    for directory in ['assets','css','js','tools']:
        files.extend(p for p in (ROOT/directory).rglob('*') if p.is_file() and '__pycache__' not in p.parts)
    files.extend(ROOT/name for name in ['index.html','PLAY-OFFLINE.html','ART-CATALOG.html','README.md','ASSET_IMPORT_REPAIRS.json'])
    files.extend(ROOT/'review'/name for name in ['catalog.css','catalog.js','build-validation.json','All-Ten-SVG-Scenes.png','Hand-Drawn-SVG-Progress.png','catalog-svg-controls.png','catalog-recipe-build.png'])
    with zipfile.ZipFile(target,'w',zipfile.ZIP_DEFLATED,compresslevel=9) as z:
        for path in sorted(set(files)):z.write(path,'Snack-Stack/'+str(path.relative_to(ROOT)))
    for name in ['PLAY-OFFLINE.html','ART-CATALOG.html']:
        shutil.copyfile(ROOT/name,OUT/('Snack-Stack-'+name))
    for src,dst in [('Hand-Drawn-SVG-Progress.png','Snack-Stack-SVG-Redraw-Progress.png'),('All-Ten-SVG-Scenes.png','Snack-Stack-Ten-SVG-Scenes.png')]:
        shutil.copyfile(ROOT/'review'/src,OUT/dst)
    report={p.name:{'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()} for p in [target,OUT/'Snack-Stack-PLAY-OFFLINE.html',OUT/'Snack-Stack-ART-CATALOG.html',OUT/'Snack-Stack-SVG-Redraw-Progress.png',OUT/'Snack-Stack-Ten-SVG-Scenes.png']}
    (OUT/'Snack-Stack-SVG-Game-Review.sha256.json').write_text(json.dumps(report,indent=2)+'\n')
    print(json.dumps(report,indent=2))

if __name__=='__main__':main()
