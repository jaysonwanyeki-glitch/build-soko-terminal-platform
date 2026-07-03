import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Soko Terminal — Kenya NSE Advanced Trading Terminal",
  description:
    "Advanced Bloomberg-style terminal for Nairobi Securities Exchange — stocks, treasury bonds, portfolio management.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-black text-green-400 antialiased font-mono">
        {children}
      </body>
    </html>
  );
}
