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


export const metadata = {
  title: {
    default: "Fairway",
    template: "%s | Fairway",
  },
  description:
    "Fairway is a golf swing video capture app designed to help golfers record and review their swings.",
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
