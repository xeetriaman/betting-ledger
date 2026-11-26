import { ImageResponse } from "next/og";
export const size = { width: 180, height: 180 };
export const contentType = "image/png";
export default function AppleIcon() {
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#c6f432" }}>
      <svg width="110" height="110" viewBox="0 0 16 16" fill="none"><path d="M2 12.5 6 8l3 3 5-6.5" stroke="#101400" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
    </div>, size);
}
