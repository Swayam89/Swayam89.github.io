# Swayam Jain — portfolio

A hand-built recreation of the Eric Cole Framer template, filled with Swayam's own work.
No framework, no build step: `index.html`, `styles.css`, `main.js` and `assets/`.

## Run it

```bash
cd swayam-portfolio
python3 -m http.server 8090
```

Open http://localhost:8090. (Open it through a server, not `file://`, so the videos and fonts load.)
To publish, upload the folder as-is to any static host (Cloudflare Pages, Netlify, GitHub Pages, Vercel).

## What is in here

- CRT loader: counter, switch-on flash, TV shrinks into the hero.
- Fixed nav with exclusion blending, hides once you scroll past the hero. Phone: hamburger menu.
- Wheel smooth-scroll, scramble/decode labels, letter-by-letter text fill, blurred letter reveals.
- Work: hover a project to switch the stacked images, cursor label ("VIEW LIVE" / "COMING SOON"),
  column / list toggle. On phones every project shows its own image.
- Approach: sticky heading with cards scrolling over it.
- Sections flip between light and dark as their top crosses the middle of the screen.
- Dithered portrait on a canvas (any image works, it is re-dithered live and follows the theme).
- Contact form validates and opens your mail app with everything filled in (no backend needed).
- Footer inside a TV, with a vertical ticker of project proof, links, clock (IST) and year.

## Things to fill in

1. **Portrait**: replace `assets/portrait.svg` with a real photo (any size, portrait crop works best)
   and point `#portraitSrc` in `index.html` at it. The canvas dithers it automatically.
2. **Links**: in `index.html` search for `data-todo` — GitHub, X/Twitter and LinkedIn point at the
   site roots until you add your handles.
3. **Project links**: Sidepot is live. Odinem, ClearCut, Abbina, Framely and the Cher site currently
   use `href="#"` with `data-live="false"` (the cursor says "COMING SOON"). Set a real `href`,
   remove `data-live`, and change `data-cursor` to `VIEW LIVE` when they are online.
4. **Project images**: `assets/work-*.jpg` are real screenshots (1440x1070). Swap any of them.
5. **Proof rows** in the footer are project facts, not client quotes. Replace with real testimonials
   when you have them (`.trow` blocks, duplicated once for the loop).
6. **Location**: the hero, menu and footer say GUJARAT with an IST clock. Change the text in
   `index.html`; the clock time zone is `Asia/Kolkata` in `main.js`.

## Credits

TV bezel images, plus-grid pattern, ruler and circle decorations and the static video are the
template's own assets. Fonts: Geist, Geist Mono, Inspiration (Google Fonts).
