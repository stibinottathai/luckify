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
};

export const metadata: Metadata = {
  title: "Luck ഉണ്ടോ ? | Try Your Luck. Find Your Fortune.",
  description: "An engaging, interactive lucky garden! Spin the fortune wheel, release the divination pendulum, hunt for daily gifts, and test your vibes score today.",
  metadataBase: new URL("https://luckify.vercel.app"),
  openGraph: {
    title: "Luck ഉണ്ടോ ? | Try Your Luck. Find Your Fortune.",
    description: "An engaging, interactive lucky garden! Spin the fortune wheel, release the divination pendulum, hunt for daily gifts, and test your vibes score today.",
    url: "https://luckify.vercel.app",
    siteName: "Luck ഉണ്ടോ ?",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Luck ഉണ്ടോ ? - Virtual Lucky Garden and Fortune Oracle",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Luck ഉണ്ടോ ? | Try Your Luck. Find Your Fortune.",
    description: "An engaging, interactive lucky garden! Spin the fortune wheel, release the divination pendulum, hunt for daily gifts, and test your vibes score today.",
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
      suppressHydrationWarning
    >
      <head>
        <link rel="preconnect" href="https://www.affirmations.dev" />
      </head>
      <body className="min-h-full flex flex-col">
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}
