import type { Metadata, Viewport } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "VITRA: a watch atelier", description: "Configure a fictional automatic watch: exploded movement, materials, complications, engraving and a commission summary." };
export const viewport: Viewport = { themeColor: "#050505", width: "device-width", initialScale: 1 };
export default function Root({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}
