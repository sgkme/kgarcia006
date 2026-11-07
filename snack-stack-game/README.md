# Snack Stack — SVG game and review catalog

Open **PLAY-OFFLINE.html** to play, or **ART-CATALOG.html** to inspect the artwork and preview all 117 recipe assemblies. Both files include their assets and work without a web server in Chrome and Edge.

For development, run `python3 -m http.server 8002` in this directory and open `http://localhost:8002/`. The editable project starts at `index.html`.

The ten gameplay scenes, their foreground serving counters, the 72 reference-inspired UI components, and the character/icon replacements are native SVG shapes and paths. The game loads the SVG sources directly. The five existing cafe menu SVGs are preserved. Scene compositions follow the supplied references; the serving counters are the requested gameplay addition. The counters support the plate at design Y=1668 and stay fixed while the player moves the plate horizontally.

The current game's ingredient sprites and its catch, fill, wrap, press and stacking mechanics are retained. Container artwork stays rigid. `ASSET_IMPORT_REPAIRS.json` records the malformed SVG attributes repaired during import. Artwork contains no baked menu-item captions.

The additional ingredient reference archive **export (22).zip** has not transferred: it exceeds the upload-transfer tool's 32 MiB limit. Its remaining assets cannot be audited or redrawn until a split archive or download link is supplied.

Edit the SVGs directly or regenerate the new artwork and offline files:

```sh
python3 tools/draw_ui_assets.py
python3 tools/draw_gameplay_scenes.py
python3 tools/prepare_runtime_assets.py
python3 tools/build_offline.py
```

`python3 tools/check_build.py` checks native SVG validity, preserved menu files when the original ZIP is available, offline loading, controls, pause/resume, theme selection, catalog tabs and all 117 assembly animations. The browser check requires Python Playwright and Chromium; the game itself has no package dependencies.
