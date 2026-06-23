import { resolve } from "path";
import { defineConfig } from "vite";
import handlebars from "vite-plugin-handlebars";

const pages = {
  "/": "Home",
  "/index.html": "Home",
  "/about.html": "About",
  "/services.html": "Services",
  "/gallery.html": "Gallery",
  "/locations.html": "Locations",
  "/products.html": "Products",
  "/contact.html": "Contact",
};

export default defineConfig({
  base: "./",
  plugins: [
    handlebars({
      partialDirectory: resolve(__dirname, "src/partials"),
      context(pagePath) {
        const active = pages[pagePath] || "";
        return {
          active,
          isHome: active === "Home",
          isAbout: active === "About",
          isServices: active === "Services",
          isGallery: active === "Gallery",
          isLocations: active === "Locations",
          isProducts: active === "Products",
          isContact: active === "Contact",
        };
      },
    }),
  ],
  build: {
    rollupOptions: {
      input: {
        index: resolve(__dirname, "index.html"),
        about: resolve(__dirname, "about.html"),
        services: resolve(__dirname, "services.html"),
        gallery: resolve(__dirname, "gallery.html"),
        locations: resolve(__dirname, "locations.html"),
        products: resolve(__dirname, "products.html"),
        contact: resolve(__dirname, "contact.html"),
      },
    },
  },
});
