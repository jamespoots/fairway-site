
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});


export const metadata: Metadata = {
  title: {
    default: "Fairway",
    template: "%s | Fairway",
  },
  description: "Capture, replay, and share your golf swing instantly.",
  metadataBase: new URL("https://fairway.cam"),
  openGraph: {
    title: "Fairway — Instant Golf Swing Replay",
    description: "Capture, replay, and share your golf swing instantly.",
    url: "https://fairway.cam",
    siteName: "Fairway",
    images: [
      {
        url: "/fairway-preview-meta.jpg",
        alt: "Fairway golf swing replay preview",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Fairway — Instant Golf Swing Replay",
    description: "Capture, replay, and share your golf swing instantly.",
    images: ["/fairway-preview-meta.jpg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[radial-gradient(circle_at_top,rgba(20,20,20,1)_0%,rgba(0,0,0,1)_60%)] text-white`}
      >
        {children}
          <footer className="border-t border-white/10 mt-16 py-8 text-center text-sm text-white/60">
            <nav className="space-x-6">
              <a href="/" className="hover:text-white transition">Home</a>
              <a href="/support" className="hover:text-white transition">Support</a>
              <a href="/privacy" className="hover:text-white transition">Privacy</a>
            </nav>
          </footer>
      </body>
    </html>
  );
}
