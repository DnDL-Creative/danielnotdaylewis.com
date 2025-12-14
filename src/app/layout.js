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

/* ... imports */

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`
          ${nunito.className} 
          antialiased 
          min-h-screen 
          flex flex-col 
          
          /* --- EYE SAVER GRADIENT --- */
          /* Changed from white/stone to cool slate greys */
          bg-gradient-to-b from-slate-200 via-slate-300 to-slate-400
          
          bg-fixed
          
          /* Dark Slate Text for Contrast */
          text-slate-900
          
          /* Teal Selection Highlight */
          selection:bg-teal-600 selection:text-white
        `}
        suppressHydrationWarning
      >
        {/* ... Rest of file ... */}
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
        >
          <div className="flex flex-col min-h-screen relative z-10">
            <Navbar />

            {/* FIXED: Removed 'pt-32 md:pt-40' 
                Now the pages (children) will go all the way to the top.
                The pages themselves (ActorPage, etc.) must handle the top padding
                to clear the Navbar.
            */}
            <main className="flex-grow">{children}</main>

            <Footer />
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
