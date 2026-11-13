import type { Metadata } from "next";
import "@fontsource/space-grotesk/400.css";
import "@fontsource/space-grotesk/500.css";
import "@fontsource/space-grotesk/700.css";
import "@fontsource/dm-sans/400.css";
import "@fontsource/dm-sans/500.css";
import "@fontsource/dm-sans/600.css";
import "@fontsource/barlow-condensed/600.css";
import "@fontsource/yellowtail/400.css";
import "./globals.css";
import "./public-theme.css";
import "./pov-theme.css";
import "./photo-layout.css";
// A fresh request nonce is required for public pages and the admin UI alike.
export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  metadataBase: new URL(process.env.SITE_URL || "http://localhost:3000"),
  title: "Pixelated Records | Vinyl, Bar & Events in Ridgewood",
  description:
    "A record shop, bar, and event space at 792 Onderdonk Avenue in Ridgewood, Queens.",
  icons: { icon: "/assets/favicon.png", apple: "/assets/mark.png" },
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
