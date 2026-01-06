import "./globals.css";
import { Nunito_Sans } from "next/font/google";
import { ThemeProvider } from "next-themes";
import Navbar from "@/src/components/marketing/Navbar";
import Footer from "@/src/components/marketing/Footer";

const nunito = Nunito_Sans({ subsets: ["latin"], variable: "--font-nunito" });

export const metadata = {
  title: {
    template: "%s | Daniel Lewis",
    default: "Daniel Lewis | Creative",
  },
  description:
    "The creative portfolio and blog of Daniel Lewis, voice actor, writer, and entrepreneur.",
  openGraph: {
    title: "Daniel Lewis",
    description: "Voice Actor & Creative",
    type: "website",
    locale: "en_US",
    url: "https://danielnotdaylewis.com",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* 🚨 FIX: Explicit crossOrigin="anonymous" ensures the handshake works for Images */}
        <link
          rel="preconnect"
          href="https://gpjgvdpicjqrerqqzhyx.supabase.co"
          crossOrigin="anonymous"
        />
        <link
          rel="dns-prefetch"
          href="https://gpjgvdpicjqrerqqzhyx.supabase.co"
        />
      </head>
      <body
        suppressHydrationWarning={true}
        className={`${nunito.className} antialiased bg-[#fafaf9] md:bg-[linear-gradient(to_bottom_right,#fafaf9,#f0f9f9,#eef2ff)] text-slate-800 selection:bg-teal-200`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          <main>{children}</main>
        </ThemeProvider>
      </body>
    </html>
  );
}
