import "./globals.css";
import { Nunito_Sans } from "next/font/google";
import { ThemeProvider } from "next-themes";
import Navbar from "../components/marketing/Navbar";
import Footer from "../components/marketing/Footer";

const nunito = Nunito_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-nunito",
});

export const metadata = {
  title: {
    template: "%s | Daniel Lewis",
    default: "Daniel (not Day) Lewis",
  },
  description: "A quasi-portfolio.",
  icons: {
    icon: "/icon.png",
    apple: "/icon.png",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`
          ${nunito.className} 
          antialiased 
          min-h-screen 
          flex flex-col 
          
          /* --- STAGNANT MUTED GRADIENT --- */
          /* Muted theme colors: Stone (base) -> Teal (hint) -> Indigo (hint) */
          bg-[linear-gradient(to_bottom_right,#fafaf9,#f0f9f9,#eef2ff)]
          
          text-slate-800
          selection:bg-teal-200 selection:text-teal-900
        `}
        suppressHydrationWarning
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
        >
          <div className="flex flex-col min-h-screen relative z-10">
            <Navbar />
            <main className="flex-grow w-full max-w-[100vw] overflow-x-hidden">
              {children}
            </main>
            <Footer />
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
