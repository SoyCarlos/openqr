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
        {/* Umami Analytics — uncomment and set data-website-id to enable:
        <script
          defer
          src="https://your-umami-instance.com/script.js"
          data-website-id="YOUR_WEBSITE_ID"
        />
        */}
      </body>
    </html>
  );
}
