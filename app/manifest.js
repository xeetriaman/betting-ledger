export default function manifest() {
  return {
    name: "Ledger",
    short_name: "Ledger",
    description: "Personal betting money ledger",
    start_url: "/",
    display: "standalone",
    background_color: "#07090a",
    theme_color: "#07090a",
    icons: [
      { src: "/icon", sizes: "512x512", type: "image/png" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}
