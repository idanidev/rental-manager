import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig, loadEnv } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { VitePWA } from "vite-plugin-pwa";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => {
  // Cargar variables de entorno manualmente
  const env = loadEnv(mode, __dirname, "");

  return {
    plugins: [
      sveltekit(),
      VitePWA({
        registerType: "autoUpdate",
        includeAssets: [
          "favicon.png",
          "icon-180.png",
          "icon-192.png",
          "icon-512.png",
        ],
        manifest: {
          name: "Rental Manager",
          short_name: "RentalMgr",
          description:
            "Gestiona tus propiedades de alquiler de forma profesional",
          theme_color: "#f97316",
          background_color: "#ffffff",
          display: "standalone",
          orientation: "portrait-primary",
          categories: ["business", "productivity", "finance"],
          start_url: "/",
          scope: "/",
          lang: "es",
          dir: "ltr",
          icons: [
            {
              src: "pwa-192x192.png",
              sizes: "192x192",
              type: "image/png",
            },
            {
              src: "pwa-512x512.png",
              sizes: "512x512",
              type: "image/png",
            },
          ],
          shortcuts: [
            {
              name: "Dashboard",
              short_name: "Home",
              description: "Ver el dashboard principal",
              url: "/",
              icons: [
                {
                  src: "/pwa-192x192.png",
                  sizes: "192x192",
                  type: "image/png",
                },
              ],
            },
            {
              name: "Propiedades",
              short_name: "Props",
              description: "Gestionar propiedades",
              url: "/properties",
              icons: [
                {
                  src: "/pwa-192x192.png",
                  sizes: "192x192",
                  type: "image/png",
                },
              ],
            },
          ],
        },
      }),
    ],
    define: {
      "import.meta.env.PUBLIC_SUPABASE_URL": JSON.stringify(
        env.PUBLIC_SUPABASE_URL,
      ),
      "import.meta.env.PUBLIC_SUPABASE_ANON_KEY": JSON.stringify(
        env.PUBLIC_SUPABASE_ANON_KEY,
      ),
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            // Separar librerías pesadas de PDF/documentos en su propio chunk
            if (id.includes("node_modules/jspdf")) {
              return "pdf-lib";
            }
            if (
              id.includes("node_modules/docxtemplater") ||
              id.includes("node_modules/pizzip")
            ) {
              return "docx-lib";
            }
            // Separar Supabase
            if (id.includes("node_modules/@supabase")) {
              return "supabase";
            }
          },
        },
      },
    },
  };
});
