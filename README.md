# Nywele Nzuri by Jaz — Ultra-Luxury Salon Website

Marketing website for **Nywele Nzuri by Jaz**, Nairobi's leading Afro-fusion salon, barbershop & spa — *where executive beauty meets every generation*.

## Tech stack

- **Vite** (Node.js) build tooling
- **Tailwind CSS** (custom gold / black / ivory theme)
- **GSAP + ScrollTrigger** for scroll-driven storytelling
- **Lenis** smooth scrolling
- **vite-plugin-handlebars** for shared `head` / `header` / `footer` partials

## Pages

Home · About · Services · Gallery · Locations · Products · Contact

## Scripts

```bash
npm install      # install dependencies
npm run dev      # start dev server
npm run build    # build to dist/
npm run preview  # preview the production build
```

## Deployment

Deployed on **Vercel**. The build command is `npm run build` and the output directory is `dist`.

## Notes

- Drop a real logo at `public/assets/img/logo.png` to replace the placeholder gold SVG.
- Swap the photos in `public/assets/img/` (keep the same filenames) to use real salon imagery.
