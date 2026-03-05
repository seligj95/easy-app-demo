import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { EjectBanner } from "@/components/admin/eject-banner";
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
  title: "Foundry Agent Chat",
  description: "Azure AI Foundry Agent - Powered by App Service",
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
        <EjectBanner />
        {children}
      </body>
    </html>
  );
}
