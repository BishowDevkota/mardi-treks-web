import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SessionProvider } from "@/components/layout/SessionProvider";

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
    default: "Mardi Treks | Premier Trekking & Tour Agency in Nepal",
    template: "%s | Mardi Treks",
  },
  description:
    "Experience the Himalayas with Mardi Treks. Expert-guided trekking and tour packages in Nepal, from Everest Base Camp to Annapurna Circuit.",
  keywords: [
    "trekking Nepal",
    "Nepal trekking",
    "Everest Base Camp",
    "Annapurna trek",
    "Himalaya tours",
    "Nepal travel",
    "trekking agency Nepal",
  ],
  openGraph: {
    title: "Mardi Treks | Premier Trekking & Tour Agency in Nepal",
    description:
      "Experience the Himalayas with Mardi Treks. Expert-guided trekking and tour packages in Nepal.",
    url: "https://marditreks.com",
    siteName: "Mardi Treks",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Mardi Treks | Premier Trekking & Tour Agency in Nepal",
    description:
      "Experience the Himalayas with Mardi Treks. Expert-guided trekking and tour packages in Nepal.",
  },
  robots: {
    index: true,
    follow: true,
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
      className={`${geistSans.variable} ${geistMono.variable} h-full scroll-smooth antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <SessionProvider>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </SessionProvider>
      </body>
    </html>
  );
}
