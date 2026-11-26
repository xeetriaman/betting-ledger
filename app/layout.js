import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist", display: "swap" });
const mono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono", display: "swap" });

export const metadata = {
  title: "Ledger",
  description: "Personal betting money ledger",
  appleWebApp: { capable: true, title: "Ledger", statusBarStyle: "black-translucent" },
  robots: { index: false, follow: false },
};
export const viewport = { themeColor: "#07090a", width: "device-width", initialScale: 1, viewportFit: "cover" };

export default function RootLayout({ children }) {
  return (
    <html lang="en-AU" className={`${geist.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
