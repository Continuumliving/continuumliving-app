import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Continuum Living · The Residency",
    short_name: "Continuum",
    description:
      "A quietly held standard. Classes, events, and membership for residents of Almina Residence, Estepona.",
    display: "standalone",
    orientation: "portrait",
    start_url: "/today",
    scope: "/",
    background_color: "#F7F2EA",
    theme_color: "#F7F2EA",
    icons: [
      { src: "/icon", sizes: "any", type: "image/svg+xml" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}
