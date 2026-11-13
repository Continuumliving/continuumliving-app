import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Continuum Living · The Residency",
    short_name: "Continuum",
    description:
      "Classes, events, your coach and your personal health brief, for residents of Continuum Living residences.",
    display: "standalone",
    orientation: "portrait",
    start_url: "/today",
    scope: "/",
    background_color: "#f6f2ea",
    theme_color: "#f6f2ea",
    icons: [
      { src: "/icon", sizes: "any", type: "image/svg+xml" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}
