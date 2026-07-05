# Working on this project

## SLOW THE FUCK DOWN

James would rather a task take 3x as long if it means getting it right. Do not optimize for speed or for the fewest tool calls. Optimize for the result being correct on the first delivery.

If you find yourself rushing through a sequence of edits to "ship" a change, stop. Verify each step. The fastest path is almost never the right one when design work is involved.

## Inspect, don't theorize

When something renders wrong in the browser, **inspect the actual computed state before reasoning about it.**

- Run `getComputedStyle(el)` on the affected element and compare to expected values.
- Check `getBoundingClientRect()`, computed font-size, computed display, computed width — whatever's relevant.
- Look at the cascade. Check the cascade in `assets/css/zen.css` before adding overrides.

Do not reason from screenshots about pixel math, character widths, font metrics, or viewport sizes. Query the DOM. One `getComputedStyle` call beats five paragraphs of estimation.

## Verify against the design before declaring done

Before saying a feature is finished, **open the page in the browser and compare it side-by-side to the Figma file** (or whatever design source was provided).

- Take a screenshot of the rendered page.
- Pull up the Figma node referenced in the original request.
- Visually compare: proportions, spacing, type size, colors, alignment.
- If there's a discrepancy, fix it before reporting. Do not surface "it's done" and let James catch the mismatch.

If no design file was referenced, still take a screenshot and re-read the user's description against what's on screen. Catch your own gaps before James has to.

## No overlays, no drop shadows

Do not add gradient overlays, dark scrims, shadow layers on top of images, or **box-shadow drop shadows on any element**. The framework should be crisp — any shadows, gradients, or vignettes are handled inside the source image itself. If text needs to be readable on top of an image, that's a content problem (use a different image or move the text), not a CSS problem (don't add a `linear-gradient` div on top).

`box-shadow: none` (resetting a shadow) and `box-shadow: inset ...` (used as a 1-pixel border substitute) are fine. Outset/drop shadows like `box-shadow: 0 4px 4px rgba(0,0,0,0.15)` are not — strip them when you encounter them.

## Project context

- Ghost CMS theme called `zen` at `/Users/jamesreeves/Dev/Zen/` (repo: ghost-reverb — main is now zen; the old reverb theme is archived at the `reverb` branch and `reverb-final` tag, and stays installed in Ghost admin as rollback).
- Local dev: Ghost install at `/Users/jamesreeves/Desktop/fresh`, serving `http://localhost:2371/`. This folder is symlinked in as a theme named `zen`.
- Design source: the "Zen" page of the jamesreeves.co-2026 Figma file.
- One centered column, typography-led: Bebas Neue Pro (display), IBM Plex Serif (19px/1.6 body), IBM Plex Sans (12px labels). All via Typekit (`use.typekit.net/eer6kbs.css`).
- No landing pages: section URLs (/radio/, /dreams/, /art-diary/, /favorites/, /public-works/) are routes.yaml routes rendering channel-*.hbs — the latest post of the tag, full-post style, with the left dial nav for siblings.
- Ghost gotchas learned the hard way: `{{#get}}` does NOT interpolate route-level context in filters (post-scope attributes like `{{primary_tag.slug}}` DO work — documented related-posts pattern); `kg-*` classes are emitted at runtime by the Ghost editor and must stay styled; routes.yaml + redirects.json are NOT auto-deployed (upload via Settings → Labs); MR episode numbers resolve client-side from internal `#mr-N` tags.
- Legacy product pages (custom-spite.hbs, custom-metal.hbs) carry a scoped "Zen compatibility layer" at the top of their inline <style> — reverb's tokens (--font-big, --color-hover, etc.) and layout wrappers (.content.outer, .inner-wide, .radio-content-wrapper), lifted from the archived reverb branch. They render under Zen's nav/footer. page-static.hbs is still unpolished.
- The theme is single-mode (light only). Do not add dark-mode CSS.
