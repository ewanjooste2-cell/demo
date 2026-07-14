import type { Metadata } from "next";
import { cookies } from "next/headers";
import localFont from "next/font/local";
import { Geist_Mono } from "next/font/google";
import "./globals.css";

const nextArt = localFont({
  src: [
    { path: "./fonts/NEXT ART_Light.otf", weight: "300", style: "normal" },
    { path: "./fonts/NEXT ART_Regular.otf", weight: "400", style: "normal" },
    { path: "./fonts/NEXT ART_SemiBold.otf", weight: "600", style: "normal" },
    { path: "./fonts/NEXT ART_Bold.otf", weight: "700", style: "normal" },
    { path: "./fonts/NEXT ART_Heavy.otf", weight: "800", style: "normal" },
  ],
  variable: "--font-next-art",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: { default: "Estate Portal", template: "%s · Estate Portal" },
  description: "Listings, leads and deals — one hub for your portal data",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // The theme lives in a cookie so the server renders the right class up
  // front — no inline bootstrap script, no flash, nothing for React to warn
  // about when extensions force a client re-render.
  const theme = (await cookies()).get("theme")?.value;
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${nextArt.variable} ${geistMono.variable} h-full antialiased${
        theme === "dark" ? " dark" : ""
      }`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
