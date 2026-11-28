import { IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const plex = IBM_Plex_Sans({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-plex", display: "swap" });
const mono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-plex-mono", display: "swap" });

export const metadata = {
  title: "Ledger",
  description: "Personal betting money ledger",
  appleWebApp: { capable: true, title: "Bet Ledger", statusBarStyle: "default" },
  icons: {
    icon: [{ url: "/icons/icon-32.png", sizes: "32x32", type: "image/png" }, { url: "/icons/icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/icons/icon-180.png", sizes: "180x180" }],
  },
  robots: { index: false, follow: false },
};
export const viewport = { themeColor: "#ffffff", width: "device-width", initialScale: 1, viewportFit: "cover" };

export default function RootLayout({ children }) {
  return (
    <html lang="en-AU" className={`${plex.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
