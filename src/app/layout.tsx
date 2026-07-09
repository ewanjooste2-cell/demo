import type { Metadata } from "next";
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
  title: "Estate Portal",
  description: "Listings, leads and deals — one hub for your portal data",
};

// Runs before paint: applies the saved theme (or the OS preference) so there is
// no flash of the wrong theme on load.
const themeInit = `(function(){try{var t=localStorage.getItem("theme");var d=t==="dark"||(t!=="light"&&matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.classList.toggle("dark",d)}catch(e){}})()`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${nextArt.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
        {children}
      </body>
    </html>
  );
}
