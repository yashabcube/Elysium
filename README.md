# The Elysium — Homepage

Hand-coded rebuild of the Framer homepage: HTML + CSS + GSAP (ScrollTrigger) + Lenis.
No build step, no CDN — every file the page needs is in this folder.

## Folder structure (53 files, max 15 in any one folder)
```
elysium-home/
├── index.html
├── README.md
├── .nojekyll                  ← tells GitHub Pages to serve files as-is
├── css/
│   ├── style.css
│   └── vendor/lenis.css
├── js/
│   ├── main.js
│   └── vendor/                gsap.min.js · ScrollTrigger.min.js · lenis.min.js
└── assets/
    ├── fonts/                 Addington CF Thin (+ italic), Aileron (regular, bold)
    ├── videos/                architecture.mp4 · lobby.mp4 · lucent.mp4
    └── images/
        ├── hero/              sketch + render, gold emblem, the 4 strip images
        ├── interiors/         5 strip images + lobby poster
        ├── floor-plans/       4 line plans + 4 coloured 3D plans
        ├── club-house/        9 desktop tiles + 6 tablet/mobile tiles
        └── lifestyle/         pool image (desktop) + aerial image (tablet/mobile)
```
All paths in `index.html` and `css/style.css` point to these folders, and are relative, so the site works from any URL, GitHub Pages included.

## Upload to GitHub
**Website (drag & drop):** create a repo → *Add file → Upload files* → drag the **contents** of `elysium-home` (not the folder itself) → Commit. Folders are kept when you drag them in.
Note: GitHub's uploader hides files starting with a dot on some systems — if `.nojekyll` doesn't appear, create it with *Add file → Create new file*, name `.nojekyll`, leave it empty.

**Git:**
```bash
cd elysium-home
git init && git add . && git commit -m "Elysium homepage"
git branch -M main
git remote add origin https://github.com/<your-user>/<repo>.git
git push -u origin main
```

**Make it live:** repo → Settings → Pages → Source: *Deploy from a branch* → `main` / `(root)` → Save. The site appears at `https://<your-user>.github.io/<repo>/` in a minute or two.

## Run locally
```bash
python3 -m http.server 8000     # then open http://localhost:8000
```
(Opening index.html by double-click blocks the videos and fonts in some browsers.)

## Changing animations
All scroll timings are in the `CFG` object in `js/main.js` — one block each for desktop, tablet and mobile. Each number is "design pixels scrolled since the top of that section".
