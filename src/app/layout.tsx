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
  title: "OpenQR — Free QR Code Generator",
  description:
    "Create beautiful, customizable QR codes for free. No account required. Choose colors, shapes, styles, and download in PNG or SVG.",
  keywords: ["QR code", "generator", "free", "custom", "design"],
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    apple: "/favicon.svg",
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
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <script
          defer
          src="https://cloud.umami.is/script.js"
          data-website-id="80c9f4bf-456c-48b7-a2ad-63fec50ec9b0"
        />
      </body>
    </html>
  );
}
