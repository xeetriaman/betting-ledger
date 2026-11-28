export default function manifest() {
  return {
    name: "Bet Ledger",
    short_name: "Bet Ledger",
    description: "Personal betting money ledger",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#0f5b3a",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
