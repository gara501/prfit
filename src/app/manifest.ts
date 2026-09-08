import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "PRFit",
    short_name: "PRFit",
    description: "Gestión de rutinas, clientes y sesiones de entrenamiento.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#f4f6f1",
    theme_color: "#c2410c",
    icons: [
      {
        src: "/pwa-icon?size=192",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/pwa-icon?size=512",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/pwa-icon?size=512",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
