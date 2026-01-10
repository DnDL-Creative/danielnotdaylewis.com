import Navbar from "@/src/app/(marketing)/_components/Navbar";
import Footer from "@/src/app/(marketing)/_components/Footer";

export default function MarketingLayout({ children }) {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow w-full max-w-[100vw] overflow-x-hidden pt-20">
        {children}
      </main>
      <Footer />
    </div>
  );
}
