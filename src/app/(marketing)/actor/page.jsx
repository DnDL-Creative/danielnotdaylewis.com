import Image from "next/image";
import {
  BookOpen,
  Users,
  Mic2,
  FileSignature,
  Zap,
  CheckCircle2,
  Gem,
  Handshake,
  Smartphone,
  Quote,
  Video as VideoIcon,
  ArrowRight,
} from "lucide-react";

// NEW IMPORTS FROM SPLIT FILES
// Make sure these match your folder structure exactly
import StatCard from "./_components/StatCard";
import VideoFacade from "./_components/VideoFacade";
import BookCarousel from "./_components/BookCarousel";
import AudioPlayer from "./_components/AudioPlayer";

// --- DATA DEFINITION (THE "FRIDGE") ---
const BOOK_SLIDES = [
  {
    img: "https://gpjgvdpicjqrerqqzhyx.supabase.co/storage/v1/object/public/site-images/(marketing)/actor/like-teammates-sweat-jonah-yorke-audiobook.gif",
    title: "Sweat",
    subtitle: "by Jonah Yorke",
    link: "https://www.audible.com/pd/Sweat-Audiobook/B0FT56G216?eac_link=MDKnQB8oKyRe&ref=web_search_eac_asin_1&eac_selected_type=asin&eac_selected=B0FT56G216&qid=LSamalDvRD&eac_id=140-7532788-6617463_LSamalDvRD&sr=1-1",
  },
  {
    img: "https://gpjgvdpicjqrerqqzhyx.supabase.co/storage/v1/object/public/site-images/(marketing)/actor/a-little-crush.webp",
    title: "A Little Crush",
    subtitle: "by Kelsie Rae",
    link: "https://www.audible.com/pd/A-Little-Crush-Audiobook/B0FH5JTBXF",
  },
  {
    img: "https://gpjgvdpicjqrerqqzhyx.supabase.co/storage/v1/object/public/site-images/(marketing)/actor/never-far.webp",
    title: "Never Far",
    subtitle: "by A.A. Dark",
    link: "https://www.audible.com/pd/Never-Far-The-Foundation-of-Boston-Marks-Audiobook/B0F6GV9HLR",
  },
  {
    img: "https://gpjgvdpicjqrerqqzhyx.supabase.co/storage/v1/object/public/site-images/(marketing)/actor/dndl-website-rtibw.webp",
    title: "Right There in Black and White",
    subtitle: "by Jim Christ",
    link: "https://www.audible.com/pd/Right-There-in-Black-and-White-Audiobook/B0FXMY6NMK",
  },
];

// UPDATED AUDIO TRACKS (With Explicit Flags)
const AUDIO_TRACKS = [
  {
    title: "Romcom",
    src: "https://gpjgvdpicjqrerqqzhyx.supabase.co/storage/v1/object/public/audio/demos/audiobook-demo-sweat-like-teammates-daniel-lewis.mp3",
    explicit: true,
  },
  {
    title: "Emotionally-driven",
    src: "https://gpjgvdpicjqrerqqzhyx.supabase.co/storage/v1/object/public/audio/demos/demo_neverfar.mp3",
    explicit: true,
  },
  {
    title: "M/F Dialogue",
    src: "https://gpjgvdpicjqrerqqzhyx.supabase.co/storage/v1/object/public/audio/demos/demo_filthy_rich_santas_female_dialogue.mp3",
    explicit: false,
  },
  {
    title: "Character-driven",
    src: "https://gpjgvdpicjqrerqqzhyx.supabase.co/storage/v1/object/public/audio/demos/demo-rtibw-amos-intro.mp3",
    explicit: false,
  },
];

// Static Component
function WhyCard({ icon, title, desc }) {
  return (
    <div className="group relative bg-white/40 backdrop-blur-sm border border-white/60 p-8 rounded-3xl text-left transition-all duration-500 hover:-translate-y-2 hover:bg-white/80 hover:shadow-2xl hover:shadow-teal-900/5">
      <div className="absolute inset-0 bg-gradient-to-br from-teal-100/30 via-indigo-100/30 to-pink-100/30 opacity-0 group-hover:opacity-100 transition-opacity duration-700 rounded-3xl -z-10" />
      <div className="w-14 h-14 mb-6 bg-white rounded-2xl flex items-center justify-center text-teal-600 shadow-sm group-hover:scale-110 group-hover:text-indigo-600 transition-all duration-300 border border-slate-100">
        {icon}
      </div>
      <h3 className="font-bold text-xl mb-3 text-slate-900 group-hover:text-teal-900 transition-colors">
        {title}
      </h3>
      <p className="text-slate-600 text-lg leading-relaxed font-medium">
        {desc}
      </p>
    </div>
  );
}

export default function ActorPage() {
  return (
    <div className="w-full min-h-screen max-w-[100vw] overflow-x-hidden flex flex-col items-center pb-24 bg-gradient-to-br from-teal-50/50 via-indigo-50/50 to-slate-50">
      {/* =========================================
          1. HERO & ORIGIN STORY
      ========================================= */}
      <section
        id="training"
        className="w-full max-w-[1400px] px-4 md:px-6 xl:px-40 pt-16 md:pt-32"
      >
        <div className="relative group rounded-[2.5rem] bg-white/40 backdrop-blur-md border border-white/60 shadow-xl overflow-hidden p-6 md:p-16 flex flex-col lg:flex-row items-center gap-12">
          {/* Ambient Background Orbs */}
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-teal-200/20 rounded-full blur-[100px] -z-10 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-200/20 rounded-full blur-[100px] -z-10 pointer-events-none" />

          {/* HEADSHOT - LCP OPTIMIZED */}
          <div className="relative flex-shrink-0 w-72 h-72 md:w-[450px] md:h-[450px] mt-6 md:mt-0">
            <div className="absolute inset-0 rounded-full border border-teal-500/20 md:border-teal-500/10 scale-110 animate-[spin_10s_linear_infinite]" />
            <div className="absolute inset-0 rounded-full border border-indigo-500/20 md:border-indigo-500/10 scale-105 animate-[spin_15s_linear_infinite_reverse]" />

            <div className="relative w-full h-full rounded-full overflow-hidden shadow-2xl border-[6px] border-white">
              <Image
                src="https://gpjgvdpicjqrerqqzhyx.supabase.co/storage/v1/object/public/site-images/(marketing)/actor/dndl-headshot-more-serious.webp"
                alt="Daniel Lewis Headshot"
                fill
                priority
                sizes="(max-width: 768px) 300px, 500px"
                className="object-cover object-top scale-105 group-hover:scale-100 transition-transform duration-700"
              />
            </div>
          </div>

          {/* TEXT CONTENT */}
          <div className="flex-1 text-left space-y-8 z-10">
            <h1 className="text-4xl md:text-7xl font-black uppercase leading-[0.9] tracking-tighter">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-500 via-indigo-500 to-purple-500 animate-gradient-x drop-shadow-sm block">
                Acting
              </span>
              <span className="text-slate-900 block">Career</span>
            </h1>

            <div className="space-y-6 text-lg text-slate-600 font-medium leading-relaxed max-w-2xl">
              <p>
                I earned a BFA in Acting from The Theatre School at DePaul a
                year after The Hollywood Reporter ranked us the{" "}
                <a
                  href="https://www.hollywoodreporter.com/news/general-news/top-25-drama-schools-world-558898/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-teal-700 transition-colors"
                >
                  <span className="inline-block border-b-2 border-teal-200 text-teal-900 font-bold">
                    17th best acting school
                  </span>
                </a>{" "}
                in the world. But once I hit the{" "}
                <em>
                  <strong>real world</strong>
                </em>
                , everything changed...
              </p>

              <div className="relative p-8 bg-white/50 rounded-2xl border-l-4 border-teal-400 shadow-sm">
                <p className="italic text-slate-800 text-lg">
                  "You know acting school doesn’t mean anything, right?"
                </p>
                <div className="mt-2 text-xs font-black uppercase tracking-widest text-teal-400">
                  — Some jaded and usually pissed off semi-unknown actor who I
                  met at my West Hollywood gym one time (He was 70% right, tho)
                </div>
              </div>

              <p>
                Regardless, I hit the professional scene hard. Signed with
                Chicago’s leading talent agency. And earned my SAG card doing
                national theatrical tours, some primetime recurring roles, and
                delivering the "hahas" ala a KFC spot. But the industry had
                other plans.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================
          2. THE PIVOT
      ========================================= */}
      <section
        id="career"
        className="w-full max-w-[1100px] pt-10 px-6 xl:px-40 mx-auto mb-12"
      >
        <div className="flex flex-col-reverse md:flex-row items-center gap-12 md:gap-24">
          <div className="flex-1 space-y-6 text-left">
            <div className="inline-block px-4 py-1.5 bg-indigo-50 text-indigo-900 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border border-indigo-100">
              The Pivot
            </div>
            <h2 className="text-3xl md:text-5xl font-black text-slate-900 uppercase leading-none">
              From Screen <br /> to (mostly){" "}
              <span className="text-teal-600">Mic</span>
            </h2>
            <p className="text-slate-600 text-lg leading-relaxed">
              In 2018, everything changed during a Groundlings improv class when
              my instructor (Flo from Progressive's brother-in-law, fun fact)
              told me during a feedback session:
            </p>
            <p className="text-2xl font-serif italic text-slate-800 bg-gradient-to-r from-teal-50 to-transparent p-6 border-l-4 border-teal-400 rounded-r-xl">
              “You got a really great voice, man.”
            </p>
            <p className="text-slate-500 text-lg font-medium">
              So I pivoted. Since then, I’ve recorded over{" "}
              <strong className="text-slate-900">100 audiobooks</strong> to
              thousands of outstanding reviews (minus the unhinged negative
              ones, which almost all authors and narrators have to put up with,
              btw).
            </p>
          </div>

          <div className="relative group cursor-pointer perspective-1000 mt-12 md:mt-0">
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-32 h-10 bg-white/30 backdrop-blur-[2px] border-l border-r border-white/40 rotate-[-3deg] shadow-sm z-30 pointer-events-none opacity-80 mix-blend-hard-light"></div>
            <div className="relative bg-white p-3 pb-16 rounded shadow-[0_20px_50px_rgba(0,0,0,0.15)] rotate-3 group-hover:rotate-0 transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] w-72 md:w-[320px] mx-auto border border-slate-100">
              <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden filter contrast-110">
                <Image
                  src="https://gpjgvdpicjqrerqqzhyx.supabase.co/storage/v1/object/public/site-images/(marketing)/actor/dndl-website-pd.webp"
                  alt="Chicago PD Role"
                  fill
                  sizes="(max-width: 768px) 288px, 320px"
                  className="object-cover grayscale group-hover:grayscale-0 transition-all duration-700"
                />
              </div>
              <div className="absolute bottom-4 left-0 right-0 text-center font-handwriting text-slate-800 opacity-90 font-bold rotate-[-1deg]">
                First TV Appearance
                <br />
                <span className="text-xs font-normal text-slate-500">
                  Chicago P.D.
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================
          HEADER (Teal/Indigo Gradient)
      ========================================= */}
      <section className="w-full max-w-[1200px] px-4 xl:px-40 pt-12 md:pt-20 pb-8 text-center animate-fade-in-up">
        <h2 className="text-xl sm:text-4xl md:text-6xl font-black uppercase leading-none tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-teal-600 via-blue-600 to-indigo-600 mb-2 drop-shadow-sm whitespace-nowrap">
          Daniel (not Day) Lewis
        </h2>

        <h3 className="text-[10px] md:text-base font-bold uppercase tracking-[0.2em] md:tracking-[0.4em] text-slate-500">
          Audiobook Actor
        </h3>
      </section>

      {/* =========================================
          3. STATS BAR (Using Atomic Component)
      ========================================= */}
      <section className="w-full max-w-[1200px] px-4 xl:px-40 pb-12 md:pb-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
          <StatCard
            number={100}
            label="Audiobooks"
            suffix="+"
            icon={<BookOpen size={20} />}
          />
          <StatCard
            number={2000}
            label="Positive Reviews"
            suffix="+"
            icon={<Users size={20} />}
          />
          <StatCard
            number={100000}
            label="Listeners"
            suffix="+"
            icon={<Mic2 size={20} />}
          />
          <StatCard
            number={300}
            label="Generated (k)"
            suffix="k+"
            icon={<Gem size={20} />}
          />
        </div>
      </section>

      {/* =========================================
          4. MEDIA GALLERY
      ========================================= */}
      <section
        id="feedback"
        className="w-full max-w-[1400px] px-4 md:px-6 xl:px-40 mb-24"
      >
        <div className="flex flex-col gap-8">
          {/* --- TOP ROW: VISUALS (Video + Books) --- */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
            {/* 1. LEFT: Video (Using Atomic Component) */}
            <div className="relative rounded-[2.5rem] bg-white/40 backdrop-blur-md border border-white/60 shadow-xl p-8 flex flex-col items-center overflow-hidden">
              <h3 className="text-xs font-black uppercase tracking-[0.3em] text-slate-400 z-10 w-full text-center mb-8">
                Author Praise
              </h3>
              <div className="w-full max-w-sm mx-auto my-auto">
                <VideoFacade
                  src="https://gpjgvdpicjqrerqqzhyx.supabase.co/storage/v1/object/public/videos/never-far-author-testimonial.mp4"
                  poster="/images/dndl-praise-poster.webp"
                />
              </div>
            </div>

            {/* 2. RIGHT: Book Carousel (Using Atomic Component) */}
            <div className="relative rounded-[2.5rem] bg-gradient-to-br from-stone-100 to-gray-100 border border-white p-8 flex flex-col justify-between items-center shadow-lg min-h-[500px] overflow-hidden">
              <h3 className="text-xs font-black uppercase tracking-[0.3em] text-slate-400 z-10 w-full text-center">
                Featured Releases
              </h3>
              <div className="flex-grow flex items-center justify-center w-full py-4">
                <BookCarousel slides={BOOK_SLIDES} />
              </div>
              <div className="absolute bottom-0 w-full h-32 bg-gradient-to-t from-white/50 to-transparent pointer-events-none" />
            </div>
          </div>

          {/* --- BOTTOM ROW: TEXT TESTIMONIALS (STACKED) --- */}
          <div className="flex flex-col gap-6">
            {/* Jim Christ Quote (Full) */}
            <div className="relative p-8 md:p-10 bg-white/60 backdrop-blur-md rounded-[2.5rem] border border-white/60 shadow-lg flex flex-col justify-between hover:shadow-xl hover:bg-white/80 transition-all duration-500">
              <div className="absolute top-0 right-0 w-32 h-32 bg-teal-100/30 rounded-bl-[100px] -z-10" />
              <Quote className="text-teal-200 rotate-180 mb-6" size={40} />

              <p className="text-slate-700 font-serif italic text-base md:text-lg leading-relaxed mb-8">
                “Fellow authors, If you’re looking for a professional narrator
                to create your audiobook, you should give strong consideration
                to working with Daniel Lewis (no, not Daniel Day Lewis). Dan did
                an outstanding job narrating my last novel{" "}
                <em>Right There in Black and White</em>. It was a true
                performance, with Dan acting out over 20 distinct characters,
                many of them with strong accents. He prepared thoroughly and
                immersed himself in the story so completely that it felt like he
                was living each scene. His attention to detail, emotional range,
                and ability to shift seamlessly between voices brought the book
                to life in a way I hadn’t imagined possible. Dan was also a joy
                to collaborate with—professional, communicative, and genuinely
                passionate about the craft. If you want your audiobook to
                resonate with listeners and stand out from the crowd, Dan Lewis
                is the narrator to trust.”
              </p>

              <div className="flex items-center gap-4 border-t border-slate-200 pt-6">
                <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center text-teal-600 font-black text-sm">
                  JC
                </div>
                <div>
                  <div className="text-sm font-black text-slate-900 uppercase tracking-widest">
                    Jim Christ
                  </div>
                  <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">
                    Author
                  </div>
                </div>
              </div>
            </div>

            {/* Eva Ashwood Quote */}
            <div className="relative p-8 md:p-10 bg-white/60 backdrop-blur-md rounded-[2.5rem] border border-white/60 shadow-lg flex flex-col justify-between hover:shadow-xl hover:bg-white/80 transition-all duration-500">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-100/30 rounded-bl-[100px] -z-10" />
              <Quote className="text-indigo-200 rotate-180 mb-6" size={40} />

              <p className="text-slate-700 font-serif italic text-base md:text-lg leading-relaxed mb-8">
                “Daniel did a fantastic job bringing my books to life in audio.
                He handled multiple voices seamlessly and delivered a strong,
                engaging performance. A pleasure to work with from start to
                finish!”
              </p>

              <div className="flex items-center gap-4 border-t border-slate-200 pt-6">
                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-black text-sm">
                  EA
                </div>
                <div>
                  <div className="text-sm font-black text-slate-900 uppercase tracking-widest">
                    Eva Ashwood
                  </div>
                  <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">
                    Author
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================
          5. WHY ME GRID
      ========================================= */}
      <section id="whyme" className="w-full max-w-[1200px] px-6 xl:px-40 mb-24">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-4xl md:text-5xl font-black uppercase text-slate-900 mb-4 tracking-tight">
            Why work with me?
          </h2>
          <p className="text-slate-500 text-xl">
            It's about the business of getting <em>YOUR</em> book done right, on
            time, and without headache.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <WhyCard
            icon={<FileSignature size={28} />}
            title="Clear Contract"
            desc="Streamlined process. No ambiguity. Keeps production perfectly on schedule."
          />
          <WhyCard
            icon={<Zap size={28} />}
            title="Smooth Onboarding"
            desc="My 15-minute sample covers tone and character voices others ignore."
          />
          <WhyCard
            icon={<CheckCircle2 size={28} />}
            title="Market-Ready"
            desc="No ACX QC rejections. Files ready for upload on or before schedule."
          />
          <WhyCard
            icon={<Mic2 size={28} />}
            title="Pro Studio"
            desc="Quiet environment, iPad Pro M2, Stellar X2 mic, Izotope RX 11."
          />
          <WhyCard
            icon={<Gem size={28} />}
            title="Fair Rate"
            desc="Refined production process allows for very competitive PFH rates."
          />
          <WhyCard
            icon={<Handshake size={28} />}
            title="Partnerships"
            desc="Long-term deals for series and bundles with bigger savings."
          />
        </div>
      </section>

      {/* =========================================
          6. BOOKING 2.0 / APP TEASER
      ========================================= */}
      <section className="w-full max-w-[1000px] px-6 xl:px-40 mb-32">
        <div className="relative overflow-hidden rounded-[3rem] p-1 bg-gradient-to-br from-teal-300 via-indigo-300 to-pink-300 shadow-2xl shadow-indigo-100">
          <div className="bg-white/95 rounded-[2.8rem] p-12 md:p-20 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-transparent to-white z-10" />
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-teal-200/30 rounded-full blur-3xl z-0" />

            <div className="relative z-20 flex flex-col items-center">
              <div className="w-20 h-20 bg-gradient-to-br from-slate-900 to-slate-700 text-white rounded-3xl flex items-center justify-center mb-8 shadow-xl transform -rotate-6 transition-transform hover:rotate-0 duration-500">
                <Smartphone size={36} />
              </div>

              <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter text-slate-900 mb-4">
                Booking 2.0 <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-500 to-indigo-500">
                  Smart Calendar
                </span>
              </h2>

              <p className="text-slate-500 text-lg max-w-xl mx-auto mb-10 leading-relaxed font-medium">
                I’ve built a <strong>comprehensive smart scheduler</strong>{" "}
                designed specifically for audio production.
              </p>

              <a
                href="/scheduler"
                target="_blank"
                className="w-full md:w-auto inline-flex items-center justify-center gap-3 px-6 py-3 md:px-8 md:py-4 bg-slate-900 text-white text-sm md:text-base font-black uppercase tracking-widest rounded-full hover:bg-teal-600 hover:scale-105 hover:shadow-teal-500/20 transition-all shadow-xl"
              >
                Enter Project Details Now <ArrowRight size={18} />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================
          7. FLOATING AUDIO PLAYER
      ========================================= */}
      <div className="fixed bottom-0 left-0 w-full md:w-auto md:left-auto md:bottom-8 md:right-8 z-50 px-2 pb-2 md:p-0">
        <AudioPlayer tracks={AUDIO_TRACKS} />
      </div>
    </div>
  );
}
