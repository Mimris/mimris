# Verified cleanup ledger

| Item | Evidence | Replacement / retained behavior | Verification |
| --- | --- | --- | --- |
| Modelling Page/connect imports and historical export comment | No active references; component already returns fragments | Standalone page composition unchanged | 263 tests, typecheck, build, diff check |
| Modelling project form dialog and state | Open handler has no callers; initial show=false; unused secondary setter/ref | Active Project and ProjectMenuBar form uses retained | Same checks; reference audit |
| Modelling os/schema-generator imports | No uses outside imports | No replacement needed | Increment 33 checks |
| Modeller SVG writer imports | Imported names never used | Incomplete serialize-only SVG handler retained for separate decision | Increment 33 checks |
| Modeller direct user-settings save | Active storage side effect inside reusable editor | Optional host callback; standalone retains writer/key/delay/cancellation | Scheduler/authority tests and increment 33 checks |
| Catalog data mixed with selectIcons JSX | Pure data functions; Diagram used catalogs, not the selector | Data moved to package; form JSX retained | 265 tests, build/typecheck, installed tarball export check |
| Referenced local asset paths | 44 unique identifiers, 43 existing files | Package owns copies; public URLs retained with byte checks; missing property.png recorded | Archive count and byte equality |

| SelectionInspector private cheerio import | Imported is symbol has no uses | Removed while extracting inspector; active runtime dependencies supplied by adapter | 275 tests and standalone dialog render/edit/reopen |

| Palette duplicate boolean/category normalization | Same normalization behavior as packaged paletteData helpers | Replaced duplicate code with shared package imports | 277 tests, saved-field checks and visual Information drop |

| Repeated boolean normalization in GoJSApp, Diagram and target palette | Same helper body as packaged paletteData | Reuse emitted package helper; retain local category/link policies | 280 tests and unchanged-source comparison |

Runtime/reducer retirements and transitional package paths are documented in action-inventory.md and progress.md. A missing import alone does not establish that a route, asset, saved identifier or externally used API can be deleted.
