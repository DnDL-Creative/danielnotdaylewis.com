"use client";

import { useState, useEffect } from "react";
import { Lightbulb, Zap, RefreshCw } from "lucide-react";

const VO_TIPS = [
  "Hydrate 2 hours before the session, not just during. (Voice123)",
  "Your slate is the first 3 seconds of your audition. Smile while you say it. (Casting Director Tip)",
  "If the direction says 'conversational', imagine you're talking to one specific person. (Backstage)",
  "Stand up. Your diaphragm works better when you aren't crunched in a chair. (Sweetwater)",
  "Silence is a valid acting choice. Don't rush the pauses. (ACX)",
  "Read the specs 3 times. The client usually tells you exactly how to book the job. (Voice123)",
  "For 'ASP' auditions: They value speed and technical precision. Don't over-act.",
  "For 'IDIOM' auditions: Character consistency is key. Check your previous files if returning.",
  "Apple slices (pectin) clear mouth clicks better than water. (Industry Standard)",
  "Don't audition for everything. Focus your energy on the jobs you are right for. (Gravy For The Brain)",
  "Listen to the reference tracks, then stop. Do not mimic. Emulate the vibe, not the voice. (Reddit r/VoiceActing)",
  "Slate your name like you are introducing yourself to a friend, not a robot.",
  "Physicality affects vocal quality. If the character is running, jog in place. (Backstage)",
  "Use your hands! Even if no one sees you, gesturing adds energy to your voice. (Sweetwater)",
  "The microphone is an ear. Don't shout into it; whisper into it if the scene calls for intimacy.",
  "Eyebrows up! Raising your eyebrows actually lifts your soft palate and brightens your tone.",
  "If you stumble, pause, take a breath, and start the sentence again. Don't just pick up mid-word.",
  "Pre-read the script aloud at least twice to find the 'stumble words' before you hit record.",
  "Smile. You can hear a smile. It changes the shape of your mouth and brightens the sound. (Voice123)",
  "Anchor yourself. Plant your feet shoulder-width apart to avoid swaying and mic drift.",
  "For audiobooks: You are not just reading; you are the director, the cinematographer, and the cast. (ACX)",
  "Distinguish characters by placement (throat, nose, chest) rather than just pitch.",
  "If a sentence is long, find the operative word. Don't emphasize everything, or you emphasize nothing.",
  "End sentences with 'downward inflection' to sound authoritative. Upward inflection sounds unsure.",
  "Breathing is part of the performance. Don't edit out *every* breath if it adds emotion. (ACX)",
  "Lead with your eyes. Look at the next line before you finish speaking the current one.",
  "Don't pop your P's. Aim the air slightly off-axis from the capsule if you don't have a good pop filter.",
  "Vocal fry is a habit, not a style. Unless requested, support your breath to eliminate it.",
  "Whispering is hard on the cords. Use 'stage whispers' (fully voiced but quiet) for long sessions.",
  "Warm up your articulators with tongue twisters: 'Red leather, yellow leather'.",
  "Lip trills loosen the face. Do them for 2 minutes before every session.",
  "Humming scales gently wakes up the cords without strain.",
  "If your mouth is clicky, eat a green apple. The acid cuts the mucus.",
  "Avoid dairy and chocolate before recording. They coat the throat.",
  "Room tone is your friend. Record 30 seconds of silence at the end of every session.",
  "Don't guess the pronunciation. Use Forvo.com or Merriam-Webster audio. (ACX)",
  "If the script is funny, laugh *silently* with your eyes, or it will distort the audio.",
  "For commercials: You are solving a problem. Be the helpful friend, not the salesman.",
  "For narration: You are the expert. Sound confident, but not arrogant.",
  "For e-learning: You are a patient teacher. Slow down more than you think you need to.",
  "Connect to the copy. Who are you? Who are you talking to? Why are you saying this *now*?",
  "The 'moment before' technique: Invent a sentence that happens right before the first line to get in character.",
  "Don't be afraid to ask for context. 'Where is this playing?' changes the read entirely.",
  "Your demo reel is your business card. Keep it under 60 seconds. (Gravy For The Brain)",
  "Put your best spot *first* on your demo. Casting directors rarely listen past 10 seconds.",
  "Don't use famous music on your demo unless you paid for the rights.",
  "Update your demos every year. Styles change.",
  "Label your files exactly how the client asked. 'Audition_Final.mp3' gets lost. 'Name_Role.mp3' gets booked.",
  "Always audition with the same gear you will record the job with.",
  "Don't edit your auditions to perfection. If you can't replicate it live, don't submit it.",
  "Consistency is better than perfection. Clients want to know they can rely on you.",
  "If you make a mistake in a directed session, say 'Picking it up from...' and move on. Don't apologize profusely.",
  "Time is money. In a directed session, talk less, record more.",
  "Leave your ego at the door. If the director wants it 'flatter', give it to them flatter.",
  "Take direction gracefully. 'I love that, let's try it this way too' is a test of your flexibility.",
  "Don't perform in a vacuum. Listen to current commercials to hear what 'current' sounds like.",
  "Acting classes are more valuable than voice classes. Voiceover is ACTING.",
  "Improv classes help you think on your feet and sound natural.",
  "Read out loud every day. Newspaper, cereal boxes, anything. Cold reading is a muscle.",
  "Listen to your old auditions. You will hear how much you've grown.",
  "Comparison is the thief of joy. Don't worry about what other VAs are booking.",
  "Your unique voice is your selling point. Don't try to be the 'Movie Trailer Guy' if you aren't.",
  "Rejection is normal. You will book 1 in 50. That is a success rate. (Backstage)",
  "Send the audition and forget it. Moving on immediately prevents obsession.",
  "Follow up, but don't pester. A friendly nudge after 2 weeks is professional.",
  "Get a website. Social media is rented land; your website is your home base.",
  "SEO matters. Use keywords like 'British Male Voiceover' on your site. (Gravy For The Brain)",
  "Testimonials are gold. Ask happy clients for a 1-sentence review.",
  "Set your rates based on usage, not just time. 'Perpetuity' costs extra. (GVAA Rate Guide)",
  "Don't undervalue yourself. Low rates hurt the entire industry.",
  "Contracts protect you. Never work without an agreement on revisions.",
  "Watermark your auditions if you are worried about AI theft (but be subtle).",
  "Back up your files. Hard drives fail. Cloud storage is mandatory.",
  "Treat your booth like a sanctuary. No phones, no distractions.",
  "Good lighting in the booth reduces eye strain and fatigue.",
  "Print your scripts or use a silent tablet. Paper rustle ruins takes.",
  "Wear quiet clothes. Nylon swishes; cotton is silent.",
  "Take your jewelry off. Jangling bracelets are the enemy.",
  "Sit on a non-squeaky stool. Or stand.",
  "Monitor with headphones, but check playback on speakers.",
  "Learn your DAW. You don't need to be an engineer, but you need to know how to edit.",
  "Spectral editing is magic for removing mouth clicks without degrading audio.",
  "Compression is like salt. A little enhances; too much ruins.",
  "Normalization is not the same as mastering. Know the difference.",
  "Noise floors matter. If your room is loud, no mic will save you.",
  "Blankets are the cheapest acoustic treatment. Build a pillow fort if you have to.",
  "Mic position: 6-8 inches away, slightly off-axis to reduce sibilance.",
  "The Proximity Effect: Get closer to the mic for a deeper, warmer sound.",
  "Don't touch the mic stand while recording. Rumbling travels.",
  "Silence your phone. Airplane mode isn't enough; turn it off.",
  "Mark your best takes as you go to save editing time later.",
  "Listen with fresh ears. Take a break before mastering your audio.",
  "Quality Control (QC) is vital. Listen to the whole file before sending.",
  "Drink room temperature water. Cold water constricts the cords.",
  "Steam your voice. It hydrates the cords directly. ( ENT Advice )",
  "Vocal rest is real. If you are hoarse, stop speaking. Whispering makes it worse.",
  "Sleep is the best vocal recovery tool.",
  "Your body is your instrument. Exercise helps breath control.",
  "Yoga helps posture and breathing. A slouching actor sounds like a slouching character.",
  "Confidence is audible. Believe you are the right choice for the role.",
  "Have fun. If you are having fun, the listener will too.",
  "Be easy to work with. Talent gets you in the door; personality keeps you there.",
  "Deadlines are sacred. Early is on time; on time is late.",
  "Read the invoice instructions. Make it easy for them to pay you.",
  "Thank the casting director. Manners matter.",
  "Keep learning. Trends change. Take a workshop once a year.",
  "Network with peers, not just clients. Other VAs refer work they can't do.",
  "Join a workout group. Practice with others keeps you sharp.",
  "Know your 'brand'. Are you the 'Girl Next Door' or the 'Trusted Doctor'?",
  "Don't mimic the demo. Bring *your* interpretation unless told otherwise.",
  "The 'Audition Slate' technique: Slate in character to bridge the gap.",
  "Don't over-process your audition. Casting directors want to hear your raw potential.",
  "If you hear a noise (stomach rumble, truck outside), stop and redo. Don't hope they won't notice.",
];

export default function VoiceoverTip({ className = "" }) {
  const [tip, setTip] = useState("");
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    // Pick random on mount
    refreshTip();
  }, []);

  const refreshTip = () => {
    setAnimating(true);
    // Tiny timeout to allow animation out before changing text
    setTimeout(() => {
      const randomTip = VO_TIPS[Math.floor(Math.random() * VO_TIPS.length)];
      setTip(randomTip);
      setAnimating(false);
    }, 200);
  };

  return (
    <div
      className={`group relative overflow-hidden bg-gradient-to-br from-indigo-900/40 to-blue-900/40 border border-indigo-500/20 rounded-3xl p-6 flex flex-col justify-between shadow-lg hover:shadow-indigo-900/20 transition-all ${className}`}
    >
      {/* Background Icon Decoration */}
      <div className="absolute top-[-10%] right-[-10%] opacity-10 transform rotate-12 group-hover:rotate-6 transition-transform duration-700">
        <Lightbulb size={120} className="text-yellow-400" />
      </div>

      <div>
        <h3 className="text-xs font-black uppercase text-indigo-300 mb-3 flex items-center gap-2 tracking-widest">
          <Zap size={14} className="text-yellow-400 fill-yellow-400" />
          Pro Tip
        </h3>

        <div
          className={`min-h-[80px] transition-opacity duration-200 ${animating ? "opacity-0" : "opacity-100"}`}
        >
          <p className="text-sm md:text-base font-bold text-white leading-relaxed italic">
            "{tip}"
          </p>
        </div>
      </div>

      <div className="flex justify-end mt-4">
        <button
          onClick={refreshTip}
          className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all hover:rotate-180 active:scale-95"
          title="New Tip"
        >
          <RefreshCw size={16} />
        </button>
      </div>
    </div>
  );
}
