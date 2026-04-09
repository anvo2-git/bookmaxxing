import type { Metadata } from "next";
import { Bungee_Shade, Fredoka, Space_Grotesk } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import Nav from "@/components/nav";
import "./globals.css";

const bungeeShade = Bungee_Shade({
  variable: "--font-bungee-shade",
  subsets: ["latin"],
  weight: ["400"],
  display: "swap",
});

const fredoka = Fredoka({
  variable: "--font-fredoka",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Fixing Your Brainrot: Bookmaxxing 101",
  description: "touch grass? no. touch pages.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html
        lang="en"
        className={`${bungeeShade.variable} ${fredoka.variable} ${spaceGrotesk.variable} h-full antialiased`}
      >
        <body className="min-h-full flex flex-col">
          <div className="rainbow-bar" />
          <Nav />
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
