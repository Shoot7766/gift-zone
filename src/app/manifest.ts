import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Gift Zone",
    short_name: "GiftZone",
    description:
      "O'zbekistondagi sovg'alar platformasi — minglab sovg'alar, tez va xavfsiz yetkazib berish.",
    start_url: "/uz",
    display: "standalone",
    background_color: "#FEFCF8",
    theme_color: "#1B4332",
    icons: [
      {
        src: "/api/site-logo?v=3",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
