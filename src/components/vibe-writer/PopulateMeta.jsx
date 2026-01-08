"use client";

import React, { useRef } from "react";
import {
  Calendar,
  User,
  Globe,
  Type,
  Image as ImageIcon,
  Upload,
  Loader2,
  Settings2,
  Music,
  Mic, // Imported Mic Icon
} from "lucide-react";

const CATEGORIES = [
  "Life",
  "Esotericism",
  "Acting",
  "Audiobook Acting",
  "Entrepreneurship",
  "Production",
];

export default function PopulateMeta({
  date,
  setDate,
  author,
  setAuthor,
  urlPath,
  setUrlPath,
  tag,
  setTag,
  imageCaption,
  setImageCaption,
  heroImage,
  onUpload,
  onOpenStudio,
  uploadingSlot,
  isDark,
  themeBorderClass,
  bgOpacity = 20,
  musicEmbed,
  setMusicEmbed,
  blogcastUrl, // New Prop
  setBlogcastUrl, // New Prop
}) {
  const heroInputRef = useRef(null);

  return (
    <div
      className={`p-5 md:p-8 rounded-[2.5rem] border-2 mb-8 ${
        isDark
          ? `${themeBorderClass} border-opacity-60`
          : "bg-white border-slate-200"
      }`}
      style={
        isDark
          ? {
              // Dynamic Background & Blur based on slider
              backgroundColor: `rgba(0, 0, 0, ${bgOpacity / 100})`,
              backdropFilter: `blur(${bgOpacity * 0.2}px)`,
              transition: "all 0.3s ease",
            }
          : {}
      }
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-2 w-full">
          <div className="relative w-full">
            <Calendar
              size={14}
              className={`absolute left-4 top-4 ${isDark ? "text-slate-500" : "text-slate-400"}`}
            />
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={`w-full appearance-none p-3 pl-10 rounded-xl text-xs font-bold uppercase bg-transparent border-2 outline-none ${
                isDark
                  ? "border-white/10 text-slate-300"
                  : "border-slate-200 text-slate-700"
              }`}
            />
          </div>

          <div className="relative w-full">
            <User
              size={14}
              className={`absolute left-4 top-4 ${isDark ? "text-slate-500" : "text-slate-400"}`}
            />
            <input
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="Author"
              className={`w-full p-3 pl-10 rounded-xl text-xs font-bold uppercase bg-transparent border-2 outline-none ${
                isDark
                  ? "border-white/10 text-slate-300 placeholder-slate-600"
                  : "border-slate-200 text-slate-700 placeholder-slate-400"
              }`}
            />
          </div>
        </div>

        <div className="relative w-full">
          <Globe
            size={14}
            className={`absolute left-4 top-4 ${isDark ? "text-slate-500" : "text-slate-400"}`}
          />
          <input
            value={urlPath}
            onChange={(e) => setUrlPath(e.target.value)}
            placeholder="URL Slug"
            className={`w-full p-3 pl-10 rounded-xl text-xs font-bold bg-transparent border-2 outline-none ${
              isDark
                ? "border-white/10 focus:border-teal-500 text-white placeholder-slate-600"
                : "border-slate-200 text-slate-800 placeholder-slate-400"
            }`}
          />
        </div>

        {/* --- MUSIC EMBED --- */}
        <div className="relative w-full">
          <Music
            size={14}
            className={`absolute left-4 top-4 ${isDark ? "text-slate-500" : "text-slate-400"}`}
          />
          <input
            value={musicEmbed || ""}
            onChange={(e) => setMusicEmbed(e.target.value)}
            placeholder="Paste Spotify/SoundCloud iFrame"
            className={`w-full p-3 pl-10 rounded-xl text-xs font-bold bg-transparent border-2 outline-none ${
              isDark
                ? "border-white/10 focus:border-teal-500 text-teal-300 placeholder-slate-600"
                : "border-slate-200 text-slate-800 placeholder-slate-400"
            }`}
          />
        </div>

        {/* --- NEW: BLOGCAST URL --- */}
        <div className="relative w-full">
          <Mic
            size={14}
            className={`absolute left-4 top-4 ${isDark ? "text-slate-500" : "text-slate-400"}`}
          />
          <input
            value={blogcastUrl || ""}
            onChange={(e) => setBlogcastUrl(e.target.value)}
            placeholder="Paste Blogcast URL (Supabase or Soundcloud)"
            className={`w-full p-3 pl-10 rounded-xl text-xs font-bold bg-transparent border-2 outline-none ${
              isDark
                ? "border-white/10 focus:border-rose-500 text-rose-300 placeholder-slate-600"
                : "border-slate-200 text-slate-800 placeholder-slate-400"
            }`}
          />
        </div>

        <select
          value={tag}
          onChange={(e) => setTag(e.target.value)}
          className={`w-full p-3 rounded-xl bg-transparent border-2 outline-none text-xs font-bold ${
            isDark
              ? "border-white/10 text-white"
              : "border-slate-200 text-slate-800"
          }`}
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c} className="bg-black text-white">
              {c}
            </option>
          ))}
        </select>

        <div className="space-y-2 pt-4 border-t border-dashed border-white/10">
          <label
            className={`text-[10px] font-black uppercase tracking-widest ${isDark ? "text-slate-500" : "text-slate-400"}`}
          >
            Hero Image
          </label>

          <div className="relative w-full">
            <ImageIcon
              size={14}
              className={`absolute left-4 top-3.5 ${isDark ? "text-slate-500" : "text-slate-400"}`}
            />
            <input
              value={heroImage || ""}
              readOnly
              placeholder="No Hero Image Uploaded"
              className={`w-full p-3 pl-10 bg-transparent border-2 rounded-xl outline-none text-[10px] font-mono ${
                isDark
                  ? "border-white/10 text-white placeholder-slate-600"
                  : "border-slate-200 text-slate-800 placeholder-slate-400"
              }`}
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={() => onOpenStudio(heroImage)}
              disabled={!heroImage}
              className={`flex-1 p-3 rounded-xl border-2 text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                !heroImage
                  ? "opacity-50 cursor-not-allowed"
                  : isDark
                    ? "border-white/10 hover:bg-white/5 text-teal-400"
                    : "border-slate-200 hover:bg-slate-50 text-teal-600"
              }`}
            >
              <Settings2 size={14} /> Studio
            </button>

            <button
              onClick={() => heroInputRef.current.click()}
              className={`flex-1 p-3 rounded-xl border-2 text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                isDark
                  ? "border-white/10 hover:bg-white/5 text-slate-400 hover:text-white"
                  : "border-slate-200 hover:bg-slate-50 text-slate-600"
              }`}
            >
              {uploadingSlot === "main" ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Upload size={14} />
              )}
              {heroImage ? "Replace" : "Upload"}
            </button>

            <input
              type="file"
              ref={heroInputRef}
              onChange={(e) => onUpload(e, "main")}
              className="hidden"
            />
          </div>
        </div>

        <div className="relative w-full">
          <Type
            size={14}
            className={`absolute left-4 top-4 ${isDark ? "text-slate-500" : "text-slate-400"}`}
          />
          <input
            value={imageCaption}
            onChange={(e) => setImageCaption(e.target.value)}
            placeholder="Hero Image Caption"
            className={`w-full p-3 pl-10 bg-transparent border-2 rounded-xl outline-none text-xs font-bold ${
              isDark
                ? "border-white/10 text-white placeholder-slate-600"
                : "border-slate-200 text-slate-800 placeholder-slate-400"
            }`}
          />
        </div>
      </div>
    </div>
  );
}
