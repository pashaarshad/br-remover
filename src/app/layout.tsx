import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "BG Remover — AI Background Removal Tool",
  description:
    "Remove image backgrounds instantly with AI. Upload your photo and get a clean, transparent background in seconds. Free, fast, and runs entirely in your browser.",
  keywords: ["background removal", "remove background", "AI", "image editing", "transparent background"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
