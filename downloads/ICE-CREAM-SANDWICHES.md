# Ice cream sandwiches — catalog extension

The two supplied Set 1 / Set 2 finished-item rows define these 20 additions. The
compact recipe sheet contains some different cookie colors and filling examples;
the finished-item artwork in the two-set reference takes precedence here. Visible
applied coatings are separate catches in addition to the three core sandwich layers.

The catalog now contains 125 menu items across 13 collections. Both new sets have
their own Artwork and game collection filters. The delivered HTML starts with
Classic Chocolate Chip, runs through the 20 new sandwiches, then continues through
the previous 105 menu items. The original four kit recipes remain separate.

## Ingredients and assembly

Each lower cookie, filling portion, upper cookie, and applied coating has a separate
SVG group and catch. The two cookies have different physical layer IDs even when
their ingredient names match. A caught scoop settles and widens into the filling
before the upper cookie can arrive. Embedded chocolate chips, oats, nuts, and baked
sprinkles travel with their cookie; there are no floating baked details.

The standalone ingredient library contains 35 transparent SVGs: 14 cookies and
wafers, two special layers, 11 ice cream flavors, and eight toppings/coatings.
The Ingredients tab has a dedicated library with category controls and individual
SVG downloads. The complete 20 finished artworks and 35 ingredients are also in
`Ice-Cream-Sandwich-SVGs.zip`, alongside both label-free SVG sheets and recipe JSON.

S’mores receives its chocolate coating before the upper graham cracker. Strawberry
Sugar Cookie receives drizzle after its upper cookie. Rainbow Sprinkle receives
its edge sprinkles after the filling and before the upper cookie. Coconut Chocolate
uses a chocolate base, vanilla filling, and coconut upper cookie as shown in the
finished artwork. Each dessert uses the single intact game plate.

## Recipe sequences

| Set | Sandwich | Catch order |
| --- | --- | --- |
| 1 | Classic Chocolate Chip | chocolate chip cookie → vanilla ice cream → chocolate chip cookie |
| 1 | Chocolate Wafer Sandwich | chocolate wafer → chocolate ice cream → chocolate wafer |
| 1 | Strawberry Shortcake | sugar cookie → strawberry ice cream → shortcake crumbs → sprinkle cookie |
| 1 | Cookies & Cream Sandwich | embossed chocolate cookie → cookies and cream ice cream → embossed chocolate cookie |
| 1 | Mint Chocolate Chip | chocolate cookie → mint chip ice cream → chocolate cookie |
| 1 | Birthday Cake Sandwich | sprinkle cookie → birthday cake ice cream → sprinkle cookie |
| 1 | S’mores Sandwich | graham cracker → vanilla ice cream → chocolate drizzle → graham cracker |
| 1 | Peanut Butter Chocolate | peanut butter cookie → chocolate ice cream → peanut butter cookie |
| 1 | Salted Caramel Brownie | brownie → salted caramel ice cream → brownie → sea salt |
| 1 | Coffee Chocolate | coffee chocolate cookie → coffee ice cream → coffee chocolate cookie → caramel drizzle |
| 2 | Strawberry Sugar Cookie | sugar cookie → strawberry ice cream → sugar cookie → strawberry drizzle |
| 2 | Oatmeal Vanilla | oatmeal cookie → vanilla ice cream → oatmeal cookie |
| 2 | Red Velvet Cream | red velvet cookie → vanilla ice cream → red velvet cookie |
| 2 | Snickerdoodle Caramel | snickerdoodle cookie → salted caramel ice cream → caramel drizzle → snickerdoodle cookie |
| 2 | Graham Strawberry | graham cracker → strawberry ice cream → graham cracker |
| 2 | Lemon Blueberry | lemon blueberry cookie → blueberry ice cream → lemon blueberry cookie |
| 2 | Rocky Road Sandwich | rocky road cookie → rocky road ice cream → rocky road cookie |
| 2 | Coconut Chocolate | chocolate cookie → vanilla ice cream → toasted coconut cookie → coconut flakes |
| 2 | Cookie Dough Sandwich | chocolate chip cookie → cookie dough ice cream → chocolate chip cookie |
| 2 | Rainbow Sprinkle | sprinkle cookie → vanilla ice cream → sprinkles → sprinkle cookie |

## Verification

- All 20 additions complete with separate lower/upper cookies and a settling scoop.
- Both new collection selectors, all library categories, independent cookie exports,
  ingredient SVG downloads, offline operation, and a 390-pixel layout were checked.
- All 125 menu recipes complete at three difficulty levels: 375 successful runs.
- Actual downloadable HTML rendered 9,360 intermediate frames across all 129
  menu and kit recipes, with no JavaScript or console errors.
- All 125 main SVGs fit their canvases; the original 105 artwork files remain
  byte-for-byte unchanged. The artwork contains no visible text or raster images.
- Results are saved in `gameplay/ice-cream-sandwich-validation.json`,
  `gameplay/download-playback-validation.json`, and the other validation reports.

All geometry is handcrafted, editable SVG. The illustrations are recreations of
the supplied references, rather than pixel-exact raster traces.
