// src/app/(scheduler)/layout.jsx
import Navbar from "@/src/app/(marketing)/_components/Navbar";
import Footer from "@/src/app/(marketing)/_components/Footer";

export default function SchedulerLayout({ children }) {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      {/* Adding pt-32 to account for the fixed navbar 
          so the scheduler content isn't hidden behind it.
      */}
      <main className="flex-grow w-full max-w-[100vw] overflow-x-hidden pt-10 md:pt-40">
        {children}
      </main>
      <Footer />
    </div>
  );
}
