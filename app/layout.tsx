import type { Metadata, Viewport } from "next";
import { Fredoka, Nunito } from "next/font/google";
import Shell from "@/components/ui/Shell";
import "./globals.css";

const fredoka = Fredoka({
  subsets: ["latin"],
  variable: "--font-fredoka",
  weight: ["300", "400", "500", "600", "700"],
});

const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-nunito",
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: "Lucky Vibes | Try Your Luck. Find Your Fortune.",
  description: "An engaging, interactive lucky garden! Roll 3D dice, spin the wheel, shake the SVG tree, select lottery numbers, scratch a card, and test your vibes score today.",
  metadataBase: new URL("https://luckify.vercel.app"),
  openGraph: {
    title: "Lucky Vibes | Try Your Luck. Find Your Fortune.",
    description: "An engaging, interactive lucky garden! Roll 3D dice, spin the wheel, shake the SVG tree, select lottery numbers, scratch a card, and test your vibes score today.",
    url: "https://luckify.vercel.app",
    siteName: "Lucky Vibes",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Lucky Vibes - Virtual Lucky Garden and Fortune Oracle",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Lucky Vibes | Try Your Luck. Find Your Fortune.",
    description: "An engaging, interactive lucky garden! Roll 3D dice, spin the wheel, shake the SVG tree, select lottery numbers, scratch a card, and test your vibes score today.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${fredoka.variable} ${nunito.variable} h-full antialiased`}
      style={{ colorScheme: "light" }}
    >
      <body className="min-h-full flex flex-col">
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}
