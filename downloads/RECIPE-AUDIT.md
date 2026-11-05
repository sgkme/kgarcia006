# Snack Stack recipe and artwork audit

This revision covers all 105 menu illustrations and their game recipes. The
review follows the user's rule: catch the next physical ingredient, build from
the supported base upward, finish preparation, then serve the whole order.
The uploaded build kit supplies game references; its agent and implementation
documents are not additional user instructions.

## Findings and corrections

| Area | Finding | Correction |
| --- | --- | --- |
| Repeated layers | Matching names pooled separated lettuce rows, yogurt bands, patties, and other repeated food. | Every physical layer has its own catch ID and landing position. A lower layer cannot reveal an upper layer. |
| Recipe order | A structural SVG wrapper could make a topping a dependency of its own bread. | Structural wrappers no longer imply food support. For example, Reuben now begins with toast and ends with toast. |
| Drinks | Root beer arrived as a complete glass-shaped silhouette. | A droplet triggers a visible stream and a rising fill inside the intact glass. Foam forms near the end; ice cream follows the completed fill. Other drinks and yogurt use the same timed fill system. |
| Syrup and cheese | Coatings could appear without spreading, or the next food arrived while the pour was unfinished. | Coatings spread over their supported surface and then extend into drips. Subsequent food waits for preparation to finish. Pause freezes the preparation. |
| Waffles | The viewing angle differed from pancakes, and the syrup hid the waffle grid. | The waffle now has a shallow elliptical surface and thin front edge. Translucent syrup spreads with the pancake coating process while preserving visible pockets. |
| Bread | Thick angular slabs and spiral marks resembled stone. | Club, BLT, Reuben, grilled cheese, and French toast use rounded bread, a thin warm crust, pale porous crumb, and small texture marks. French toast has two complete slices rather than extra catches for exposed edges. |
| Burritos | The breakfast burrito had 21 tiny components and started already wrapped. | A flat tortilla receives six useful portions in total: tortilla, eggs, sausage, vegetables, cheese, and cream. It wraps only after filling. The regular burrito uses five portions. Preparation SVGs are available in Ingredients. |
| Quesadilla and omelette | The final folded shape appeared before filling, with no sensible closure. | Both start open, receive their filling, and fold before the final plated view appears. Their outside finishing garnish comes afterward. |
| Enchiladas | Cheese did not follow the rolls, and a single preparation could create two complete rolls. | Each enchilada has a separate tortilla, chicken filling, and cheese catch. Both wrap before toppings. Cheese is authored in each roll's own coordinates and stays on it. |
| Chimichanga | Filled roll and exterior toppings were not separated into preparation stages. | Fill the open tortilla, wrap it, then add exterior cheese, cream, and garnish. |
| Breakfast sandwiches | Scrambled egg clumps appeared in the sandwich and bagel. | Both use a single folded omelet layer. |
| Macaroni and nachos | Sparse food and an opaque mouth left gaps or put food outside the bowl. | Continuous macaroni and chip beds fill the bowl. One intact front vessel, with an open mouth, contains the lower food and preserves the visible mound above the rim. |
| Fries | The portion looked sparse. | Each authored portion now contains 43 overlapping fries, including extra sticks between the taller fries and a denser front row. |
| Cone and garnishes | A topping could appear detached from the assembly. | Cone, lower scoop, upper scoop, fudge, and sprinkles are separate ordered steps. The club serving pick appears only when the food is complete. |
| Prepared food details | Cut faces, exposed filling, and texture marks could fall as new ingredients. | These stay attached to their tender, nugget, popper, or split mozzarella stick. Separate fried chicken pieces, wings, and meatballs have their own catches. |
| Containers | Breaking rims, bowls, cups, plates, or reflections apart would violate the requested container behavior. | All 56 authored vessels remain single rigid groups. Player movement and serving translate each whole vessel with its food. |
| Playback | Order changes, hidden tabs, and browser matrix errors could stop playback. | Native transform composition works in hidden layouts; requested playback continues across order and tab changes; explicit Pause stays paused; Restart remains usable after a rendering error. |

One prepared filling or topping portion can contain several small pieces in the
same food layer. This does not pool separate upper and lower layers. Two yogurt
bands, two lettuce rows, two bread slices, and two cheese slices remain distinct.
The front and back faces of one bun, tortilla, or folded egg sheet are parts of
the same physical ingredient.

## Verification

- 105 menu recipes completed at Normal, Hard, and Extreme: **315 successful runs**.
- The actual browser queue served all **105 orders**, with every finished SVG
  matching its authored SVG at the native view and every container unchanged.
- The downloadable offline HTML exercised **8,680 intermediate landing, filling,
  and settling frames across 109 recipes**: all 105 menu items plus the four kit
  recipes. Live animation frames also served successive orders without manual
  simulation calls.
- **14 recipe-logic checks** cover layer separation, dependencies, fill gating,
  wrapping, omelet folding, and prepared-food details. The original **27 engine
  checks** continue to pass.
- Browser checks cover partial root-beer fill, hidden upper lettuce and yogurt,
  all six open/fold/wrap recipes, pause/resume, 30 arbitrary order changes, and
  rebuilding a recipe while its tab is hidden.
- All **105 SVG canvases** were rendered and checked for clipping; none are out
  of bounds. SVG structure checks verify no visible text or raster images,
  unique IDs, resolved local references, and no exposed container subparts.

Detailed results are in `gameplay/*validation.json`, `validation.json`,
`catalog-validation.json`, and `review.json`. Review captures are under
`previews/audit-*`. Tests and editable SVG sources accompany the full source
bundle.

These 105 menu recipes are catalog-derived previews. The four recipes supplied
by the game kit remain in their own collection. The illustrations are handcrafted
vector recreations of the references; the game tuning remains provisional.
