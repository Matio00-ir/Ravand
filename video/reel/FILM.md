# RAVAND — brand film · "Business, in flow."

16:9 · 1920×1080 · 30 fps · 66 s · no audio track (sound map in `src/film/cues.ts`).

```
npm run film           # Remotion Studio — pick "RavandFilm" in the sidebar
npm run film:render    # → out/ravand-film.mp4  (h264, crf 17, from remotion.config.ts)
node film-stills.mjs 12 30 46.2    # quick stills at those seconds → out/film/
```

## Concept

One system, driven by one clock, becoming organised. Fragmentation → Connection → Flow → Control → Clarity.

The eight real RAVAND modules (ERP, FIN, CRM, SLS, INV, WFL, HR, ANL — names, codes and capability
lines are the site's own) begin as skewed, drifting planes with connectors that stop short. They
**register** onto the site's rail grid (the brand's plane-stack motif, scattered → aligned). A core on
the centre rail extends a bus to every module. Business events — the "trading" workflow preset from
the product's own builder — travel the bus as lit slits, and the five workflow stages light along the
rails as each owner receives the work. The modules then *become* the sidebar of the product surface;
"only the modules you choose" is shown with the product's own toggles. Finally the rails converge into
one line, the symbol assembles from its two segments (the brand's logo-animation sheet: segments →
connection → unified), and the bilingual lockup and tagline resolve.

The connecting device across every scene is the nodes + rails themselves — nothing is cut, only
re-staged.

## Structure (`src/film/`)

| File | Role |
|---|---|
| `RavandFilm.tsx` | Assembles the persistent world (rails, planes, connectors, product, nodes) and the scene type layers |
| `timeline.ts` | Scene boundaries — everything keys off this table |
| `layout.ts` | Rails, node grid, bus, product-frame and sidebar geometry (all positions derive from here) |
| `modules.ts` | The 8 modules: name/code/capability from `messages/en.json`, icon paths from `ModuleIcon.tsx`, scatter state |
| `geometry.ts` | One module's rect at time *t*: scattered → registered → sidebar row |
| `flow.ts` | Business events, node activity, nav-marker steps, route geometry |
| `Backdrop.tsx` | Rails (converging), ordered grid, grain/vignette, the plane field |
| `NodeField.tsx` | Module nodes: card face ↔ sidebar-row face, toggles |
| `Connectors.tsx` | Dangling connectors, core, bus, stubs, travelling pulses |
| `Dashboard.tsx` | The product surface, redrawn from `components/product/Dashboard.tsx` |
| `Scenes.tsx` | Type layers for scenes 01–06 |
| `BrandReveal.tsx` | Scene 07: segments → unified symbol → lockup → tagline |
| `primitives.tsx` | Masked headline, marker, page index, rounded-plane path |
| `cues.ts` | Sound-design map |

## Brand fidelity

Colours, radii, hairlines, type (Manrope 800 display / Vazirmatn) and the traced symbol/wordmark are
the site's. The accent `#71859E` family is the only "signal" colour, used only for activity. Semantic
colours appear only on status dots in the product. Easing is `--ease-flow`; no bounce anywhere.
Persian appears only where the brand puts it: the `روند` wordmark and the tagline.

## Not invented

No statistics, customers, integrations or capabilities beyond the site. Dashboard figures are the
site's own sample data and the film says so on screen ("Figures shown are sample data.").
