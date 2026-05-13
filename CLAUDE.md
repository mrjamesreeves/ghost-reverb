# Working on this project

## SLOW THE FUCK DOWN

James would rather a task take 3x as long if it means getting it right. Do not optimize for speed or for the fewest tool calls. Optimize for the result being correct on the first delivery.

If you find yourself rushing through a sequence of edits to "ship" a change, stop. Verify each step. The fastest path is almost never the right one when design work is involved.

## Inspect, don't theorize

When something renders wrong in the browser, **inspect the actual computed state before reasoning about it.**

- Run `getComputedStyle(el)` on the affected element and compare to expected values.
- Check `getBoundingClientRect()`, computed font-size, computed display, computed width — whatever's relevant.
- Look at the cascade. Global rules in `style.css` (especially link rules) often override inherited values inside new components.

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

- Ghost CMS theme called `reverb` at `/Users/jamesreeves/Desktop/reverb/`.
- Local dev server runs at `http://localhost:2371/`.
- The homepage uses `home.hbs` (NOT `index.hbs`) because a static page is configured as the home route in Ghost.
- The theme is single-mode (light only) — all `[data-theme]` rules and dark-mode CSS have been removed. Do not reintroduce them.
