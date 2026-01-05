"use client";

import React, { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { createClient } from "@/src/utils/supabase/client";
import {
  Globe,
  Copy,
  Check,
  Sun,
  Save,
  Ban,
  CloudDownload,
  X,
  FilePlus,
  Archive,
  Eye,
  EyeOff,
  Upload,
  Loader2,
  Cpu,
  Zap,
  Flame,
  Calendar,
  User,
  Type,
  Database,
  Terminal,
} from "lucide-react";
import { FaHotdog } from "react-icons/fa6";
import { Canvas } from "@react-three/fiber";

// --- IMPORTS ---
import VibeEditor from "@/src/components/vibe-writer/VibeEditor";
import VibeImageStudio from "@/src/components/vibe-writer/VibeImageStudio";
import AssetSidebar from "@/src/components/vibe-writer/AssetSidebar";

const DystopianSnow = dynamic(
  () => import("@/src/components/vibe-writer/DystopianSnow"),
  { ssr: false }
);

const supabase = createClient();

const CATEGORIES = [
  "Life",
  "Esotericism",
  "Acting",
  "Audiobook Acting",
  "Entrepreneurship",
  "Production",
];

const sanitize = (name) => name.replace(/[^a-z0-9.]/gi, "-").toLowerCase();

export default function MasterEditorPage() {
  const [postId, setPostId] = useState(null);
  const [isPublished, setIsPublished] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState(null);

  const [urlPath, setUrlPath] = useState("");
  const [tag, setTag] = useState("Life");
  const [date, setDate] = useState("");
  const [author, setAuthor] = useState("");
  const [imageCaption, setImageCaption] = useState("");

  const [images, setImages] = useState({
    main: "",
    img2: "",
    img3: "",
    img4: "",
    img5: "",
    img6: "",
  });

  const [isSaving, setIsSaving] = useState(false);
  const [showLoadModal, setShowLoadModal] = useState(false);
  const [showSqlModal, setShowSqlModal] = useState(false);
  const [generatedSql, setGeneratedSql] = useState("");

  // --- STUDIO STATE ---
  const [showStudio, setShowStudio] = useState(false);
  const [studioImage, setStudioImage] = useState("");
  const [studioInitialTab, setStudioInitialTab] = useState("layout");

  const [availableDrafts, setAvailableDrafts] = useState([]);
  const [recentAssets, setRecentAssets] = useState([]);
  const [uploadingSlot, setUploadingSlot] = useState(null);

  const [theme, setTheme] = useState("teal");
  const isDark = theme !== "light";
  const [vibeMode, setVibeMode] = useState("glitch");

  const themeHex = theme === "yellow" ? "#facc15" : "#2dd4bf";
  const themeTextClass =
    theme === "yellow" ? "text-yellow-400" : "text-teal-400";
  const themeBorderClass =
    theme === "yellow" ? "border-yellow-500" : "border-teal-500";
  const sceneBgColor = theme === "yellow" ? "#1a0500" : "#02020a";

  const fetchRecentAssets = async () => {
    const { data } = await supabase.storage.from("blog-images").list("", {
      limit: 12,
      sortBy: { column: "created_at", order: "desc" },
    });
    if (data) setRecentAssets(data);
  };

  useEffect(() => {
    if (!date) setDate(new Date().toISOString().split("T")[0]);
    fetchRecentAssets();
  }, []);

  useEffect(() => {
    if (!postId && title) {
      setUrlPath(
        title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)+/g, "")
      );
    }
  }, [title, postId]);

  const isReady = title.length > 2;

  const handleClear = () => {
    if (confirm("Are you sure? This will clear everything.")) {
      setPostId(null);
      setTitle("");
      setContent(null);
      setUrlPath("");
      setTag("Life");
      setAuthor("");
      setImageCaption("");
      setImages({ main: "", img2: "", img3: "", img4: "", img5: "", img6: "" });
      setIsPublished(false);
      setDate(new Date().toISOString().split("T")[0]);
    }
  };

  const copyToClipboard = (text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    alert("Copied!");
  };

  // --- STUDIO HANDLERS ---
  const openStudio = (url, initialMode = "layout") => {
    // Allow opening audio/video modes without an image
    if (!url && initialMode === "layout")
      return alert("Upload an image first!");

    setStudioImage(url || "");
    setStudioInitialTab(initialMode);
    setShowStudio(true);
  };

  const handleStudioGenerate = (code) => {
    navigator.clipboard.writeText(code);
    setShowStudio(false);
    alert("Code Copied! Paste into editor.");
  };

  const generateAndShowSql = () => {
    const escape = (str) => (str ? str.replace(/'/g, "''") : "");
    const sql = `
INSERT INTO posts (title, slug, date, author, tag, image, image_2, image_3, image_4, image_5, image_6, image_caption, content, published) 
VALUES ('${escape(title)}', '${escape(urlPath)}', '${date}', '${escape(author)}', '${escape(tag)}', '${images.main}', '${images.img2}', '${images.img3}', '${images.img4}', '${images.img5}', '${images.img6}', '${escape(imageCaption)}', '${escape(content)}', ${isPublished})
ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title, content = EXCLUDED.content, image = EXCLUDED.image, image_2 = EXCLUDED.image_2, image_3 = EXCLUDED.image_3, image_4 = EXCLUDED.image_4, image_5 = EXCLUDED.image_5, image_6 = EXCLUDED.image_6, image_caption = EXCLUDED.image_caption, author = EXCLUDED.author, tag = EXCLUDED.tag, published = EXCLUDED.published;`.trim();
    setGeneratedSql(sql);
    setShowSqlModal(true);
  };

  const handleDatabaseAction = async (actionType) => {
    if (!isReady) return;
    setIsSaving(true);
    let finalPublishedStatus = isPublished;
    if (actionType === "PUBLISH") finalPublishedStatus = true;
    if (actionType === "UNPUBLISH") finalPublishedStatus = false;

    const payload = {
      title,
      slug: urlPath,
      date,
      author,
      tag,
      content,
      image: images.main,
      image_2: images.img2,
      image_3: images.img3,
      image_4: images.img4,
      image_5: images.img5,
      image_6: images.img6,
      image_caption: imageCaption,
      published: finalPublishedStatus,
    };

    try {
      let query = supabase.from("posts");
      if (postId) {
        const { error } = await query.update(payload).eq("id", postId);
        if (error) throw error;
      } else {
        const { data, error } = await query.insert([payload]).select();
        if (error) throw error;
        if (data && data[0]) setPostId(data[0].id);
      }
      setIsPublished(finalPublishedStatus);
      alert(finalPublishedStatus ? "LIVE!" : "SAVED");
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const fetchDrafts = async () => {
    setShowLoadModal(true);
    const { data } = await supabase
      .from("posts")
      .select("id, title, date, slug, tag, published")
      .order("date", { ascending: false });
    if (data) setAvailableDrafts(data);
  };

  const loadDraft = async (id) => {
    const { data } = await supabase
      .from("posts")
      .select("*")
      .eq("id", id)
      .single();
    if (data) {
      setPostId(data.id);
      setTitle(data.title);
      setUrlPath(data.slug);
      setTag(data.tag);
      setDate(data.date);
      setAuthor(data.author || "");
      setIsPublished(data.published || false);
      setImageCaption(data.image_caption || "");
      setImages({
        main: data.image || "",
        img2: data.image_2 || "",
        img3: data.image_3 || "",
        img4: data.image_4 || "",
        img5: data.image_5 || "",
        img6: data.image_6 || "",
      });
      if (data.content) setContent(data.content);
      setShowLoadModal(false);
    }
  };

  const toggleVisibility = async (e, draftId, currentStatus) => {
    e.stopPropagation();
    const newStatus = !currentStatus;
    setAvailableDrafts((prev) =>
      prev.map((p) => (p.id === draftId ? { ...p, published: newStatus } : p))
    );
    const { error } = await supabase
      .from("posts")
      .update({ published: newStatus })
      .eq("id", draftId);
    if (error) {
      alert("Error updating status");
      setAvailableDrafts((prev) =>
        prev.map((p) =>
          p.id === draftId ? { ...p, published: currentStatus } : p
        )
      );
    }
  };

  const handleFileUpload = async (e, slotKey) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!urlPath)
      return alert("Please enter a Title to generate a slug first.");
    setUploadingSlot(slotKey);
    try {
      const cleanName = sanitize(file.name);
      let filePath =
        slotKey === "main"
          ? `${urlPath}/hero/${cleanName}`
          : `${urlPath}/content-images/${cleanName}`;
      const { error } = await supabase.storage
        .from("blog-images")
        .upload(filePath, file, { upsert: true });
      if (error) throw error;
      const {
        data: { publicUrl },
      } = supabase.storage.from("blog-images").getPublicUrl(filePath);
      setImages((prev) => ({ ...prev, [slotKey]: publicUrl }));
      fetchRecentAssets();
    } catch (error) {
      alert("Upload failed: " + error.message);
    } finally {
      setUploadingSlot(null);
    }
  };

  const toggleTheme = () =>
    setTheme((prev) =>
      prev === "light" ? "teal" : prev === "teal" ? "yellow" : "light"
    );
  const toggleVibeMode = () =>
    setVibeMode((prev) => (prev === "glitch" ? "sexy" : "glitch"));
  const handleLexicalChange = (htmlString) => setContent(htmlString);

  const getTitleClass = () =>
    theme === "yellow"
      ? "text-yellow-400 border-yellow-500 placeholder:text-yellow-400/50"
      : theme === "light"
        ? "text-blue-600 border-slate-300 placeholder:text-blue-600/50"
        : "text-teal-400 border-teal-500 placeholder:text-teal-400/50";
  const getBtnBase = () =>
    !isDark
      ? "bg-white border border-slate-200 text-slate-500 hover:bg-slate-50"
      : "bg-white/5 border border-transparent hover:bg-white/10 text-slate-300 hover:text-white";
  const getHeaderTitleClass = () =>
    !isDark
      ? "text-slate-900"
      : vibeMode === "sexy"
        ? "sexy-text"
        : "glitch-text";

  return (
    <div
      className={`transition-all duration-1000 min-h-screen relative font-sans ${isDark ? "bg-[#02020a] text-slate-100" : "bg-slate-50 text-slate-900"}`}
      style={{ backgroundColor: isDark ? sceneBgColor : "#f8fafc" }}
    >
      {isDark && (
        <div className="fixed inset-0 z-0 opacity-100 pointer-events-none">
          <Suspense fallback={null}>
            <Canvas camera={{ position: [0, 0, 10], fov: 60 }}>
              <color attach="background" args={[sceneBgColor]} />
              <fog attach="fog" args={[sceneBgColor, 10, 80]} />
              <DystopianSnow theme={theme} />
            </Canvas>
          </Suspense>
        </div>
      )}

      {/* --- VIBE IMAGE STUDIO OVERLAY --- */}
      <VibeImageStudio
        isOpen={showStudio}
        onClose={() => setShowStudio(false)}
        imageUrl={studioImage}
        availableImages={[
          images.main,
          images.img2,
          images.img3,
          images.img4,
          images.img5,
          images.img6,
        ].filter(Boolean)}
        onGenerateCode={handleStudioGenerate}
        initialTab={studioInitialTab}
      />

      {/* --- SQL MODAL --- */}
      {showSqlModal && (
        <div className="fixed inset-0 z-[150] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div
            className={`w-full max-w-4xl bg-[#0a0a0a] border-2 ${themeBorderClass} rounded-2xl p-6 shadow-2xl flex flex-col max-h-[90vh]`}
          >
            <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <Terminal size={20} className={themeTextClass} />
                <h2
                  className={`text-xl font-black uppercase ${themeTextClass}`}
                >
                  SQL Generator
                </h2>
              </div>
              <button
                onClick={() => setShowSqlModal(false)}
                className="hover:text-white text-slate-500"
              >
                <X />
              </button>
            </div>
            <div className="flex-grow overflow-hidden relative rounded-lg border border-white/10 bg-black/50">
              <textarea
                value={generatedSql}
                readOnly
                className="w-full h-[50vh] p-4 bg-transparent text-xs font-mono text-green-400 outline-none resize-none"
              />
              <div className="absolute top-2 right-2">
                <button
                  onClick={() => copyToClipboard(generatedSql)}
                  className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded text-xs uppercase font-bold backdrop-blur flex items-center gap-2"
                >
                  <Copy size={14} /> Copy SQL
                </button>
              </div>
            </div>
            <p className="mt-4 text-[10px] text-slate-500 font-mono text-center">
              WARNING: This executes a raw INSERT/UPDATE.
            </p>
          </div>
        </div>
      )}

      {/* --- LOAD DRAFT MODAL --- */}
      {showLoadModal && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div
            className={`w-full max-w-2xl bg-[#0a0a0a] border-2 ${themeBorderClass} rounded-2xl p-6 shadow-2xl`}
          >
            <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
              <h2 className={`text-xl font-black uppercase ${themeTextClass}`}>
                Load Transmission
              </h2>
              <button onClick={() => setShowLoadModal(false)}>
                <X />
              </button>
            </div>
            <div className="space-y-2 max-h-[60vh] overflow-y-auto custom-scrollbar">
              {availableDrafts.map((draft) => (
                <div
                  key={draft.id}
                  className="w-full p-3 border border-white/10 rounded-lg flex justify-between items-center hover:bg-white/5 group"
                >
                  <button
                    onClick={() => loadDraft(draft.id)}
                    className="flex-1 text-left"
                  >
                    <div className="flex items-center gap-2">
                      {draft.published ? (
                        <span className="bg-emerald-500/20 text-emerald-400 text-[9px] px-2 py-0.5 rounded uppercase font-bold border border-emerald-500/30">
                          Live
                        </span>
                      ) : (
                        <span className="bg-slate-700/50 text-slate-400 text-[9px] px-2 py-0.5 rounded uppercase font-bold border border-slate-600">
                          Hidden
                        </span>
                      )}
                      <span className="font-bold text-slate-200 group-hover:text-white transition-colors">
                        {draft.title || "Untitled"}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono mt-1">
                      {draft.date} • {draft.slug}
                    </div>
                  </button>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={(e) =>
                        toggleVisibility(e, draft.id, draft.published)
                      }
                      className={`p-2 rounded border transition-all ${draft.published ? "bg-emerald-900/20 border-emerald-500/50 text-emerald-400 hover:bg-emerald-500 hover:text-white" : "bg-slate-800/50 border-slate-700 text-slate-500 hover:bg-slate-700 hover:text-slate-300"}`}
                    >
                      {draft.published ? (
                        <Eye size={16} />
                      ) : (
                        <EyeOff size={16} />
                      )}
                    </button>
                    <button
                      onClick={() => loadDraft(draft.id)}
                      className={`p-2 hover:text-white ${themeTextClass}`}
                    >
                      <CloudDownload size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="relative z-10 pt-24 pb-20 px-4 md:px-16 max-w-[1600px] mx-auto">
        <header className="flex flex-col xl:flex-row items-center justify-between mb-16 gap-6 relative">
          <h1
            className={`text-3xl font-black uppercase tracking-[0.4em] cursor-default transition-all duration-300 ${getHeaderTitleClass()}`}
          >
            VibeWriter™
          </h1>
          <div className="flex gap-3">
            {isDark && (
              <button
                onClick={toggleVibeMode}
                className={`p-4 rounded-full transition-all border ${vibeMode === "sexy" ? "bg-pink-500/20 text-pink-500 border-pink-500 shadow-[0_0_15px_rgba(236,72,153,0.5)]" : "bg-white/5 border-transparent text-slate-400 hover:text-white"}`}
                title={vibeMode === "sexy" ? "Turn off the heat" : "Get Some"}
              >
                {vibeMode === "sexy" ? (
                  <Flame size={18} className="animate-pulse" />
                ) : (
                  <Zap size={18} />
                )}
              </button>
            )}
            <button
              onClick={handleClear}
              className={`p-4 rounded-full transition-all ${getBtnBase()} hover:text-red-500 hover:border-red-500`}
              title="Clear All"
            >
              <FilePlus size={18} />
            </button>
            <button
              onClick={fetchDrafts}
              className={`px-6 py-4 rounded-full uppercase font-bold text-xs tracking-widest transition-all ${getBtnBase()}`}
              title="Load Archive"
            >
              <Archive size={14} />
            </button>
            <button
              onClick={generateAndShowSql}
              className={`px-4 py-4 rounded-full font-bold uppercase text-xs tracking-widest transition-all border border-blue-500/30 text-blue-400 bg-blue-900/10 hover:bg-blue-500 hover:text-white flex items-center gap-2`}
              title="Generate SQL"
            >
              <Database size={14} /> SQL
            </button>
            <button
              onClick={() => handleDatabaseAction("DRAFT")}
              className={`p-4 rounded-full transition-all ${getBtnBase()}`}
              title="Save Draft"
            >
              {isSaving ? <Loader2 className="animate-spin" /> : <Save />}
            </button>
            {isPublished && (
              <button
                onClick={() => handleDatabaseAction("UNPUBLISH")}
                className="p-4 rounded-full bg-red-900/20 text-red-500 border border-red-500 hover:bg-red-600 hover:text-white transition-all"
                title="Unpublish"
              >
                <Ban size={18} />
              </button>
            )}
            <button
              onClick={() => handleDatabaseAction("PUBLISH")}
              className={`px-6 py-4 rounded-full font-bold uppercase text-xs hover:bg-emerald-600 hover:text-white transition-all ${isPublished ? "bg-emerald-500 text-white shadow-lg" : "bg-emerald-900/20 text-emerald-500 border border-emerald-500"}`}
            >
              {isPublished ? "Live" : "Post"}
            </button>
            <button
              onClick={toggleTheme}
              className={`p-4 rounded-full transition-all ${getBtnBase()}`}
            >
              {theme === "light" ? (
                <Sun size={18} className="text-amber-500" />
              ) : theme === "teal" ? (
                <Cpu size={18} className="text-teal-400" />
              ) : (
                <FaHotdog size={18} className="text-yellow-400" />
              )}
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* SIDEBAR METADATA BOX - NEW COMPONENT */}
          <div className="lg:col-span-4 space-y-8 order-2 lg:order-1">
            <div
              className={`p-8 rounded-[2.5rem] border-2 ${isDark ? `bg-black/20 backdrop-blur-md ${themeBorderClass} border-opacity-60` : "bg-white border-slate-200"}`}
            >
              <div className="space-y-6">
                {/* Basic Metadata Inputs (Date, Author, Slug, Tag) */}
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Calendar
                      size={14}
                      className={`absolute left-4 top-4 ${isDark ? "text-slate-500" : "text-slate-400"}`}
                    />
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className={`w-full p-3 pl-10 rounded-xl text-xs font-bold uppercase bg-transparent border-2 outline-none ${isDark ? "border-white/10 text-slate-300" : "border-slate-200 text-slate-700"}`}
                    />
                  </div>
                  <div className="relative flex-1">
                    <User
                      size={14}
                      className={`absolute left-4 top-4 ${isDark ? "text-slate-500" : "text-slate-400"}`}
                    />
                    <input
                      type="text"
                      value={author}
                      onChange={(e) => setAuthor(e.target.value)}
                      placeholder="Author"
                      className={`w-full p-3 pl-10 rounded-xl text-xs font-bold uppercase bg-transparent border-2 outline-none ${isDark ? "border-white/10 text-slate-300 placeholder-slate-600" : "border-slate-200 text-slate-700 placeholder-slate-400"}`}
                    />
                  </div>
                </div>
                <div className="relative">
                  <Globe
                    size={14}
                    className={`absolute left-4 top-4 ${isDark ? "text-slate-500" : "text-slate-400"}`}
                  />
                  <input
                    value={urlPath}
                    onChange={(e) => setUrlPath(e.target.value)}
                    placeholder="URL Slug"
                    className={`w-full p-3 pl-10 rounded-xl text-xs font-bold bg-transparent border-2 outline-none ${isDark ? "border-white/10 focus:border-teal-500 text-white placeholder-slate-600" : "border-slate-200 text-slate-800 placeholder-slate-400"}`}
                  />
                </div>
                <select
                  value={tag}
                  onChange={(e) => setTag(e.target.value)}
                  className={`w-full p-3 rounded-xl bg-transparent border-2 outline-none text-xs font-bold ${isDark ? "border-white/10 text-white" : "border-slate-200 text-slate-800"}`}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c} className="bg-black text-white">
                      {c}
                    </option>
                  ))}
                </select>
                {/* Caption for Hero */}
                <div className="relative">
                  <Type
                    size={14}
                    className={`absolute left-4 top-4 ${isDark ? "text-slate-500" : "text-slate-400"}`}
                  />
                  <input
                    value={imageCaption}
                    onChange={(e) => setImageCaption(e.target.value)}
                    placeholder="Main Image Caption"
                    className={`w-full p-3 pl-10 bg-transparent border-2 rounded-xl outline-none text-xs font-bold ${isDark ? "border-white/10 text-white placeholder-slate-600" : "border-slate-200 text-slate-800 placeholder-slate-400"}`}
                  />
                </div>
              </div>
            </div>

            {/* ASSET SIDEBAR COMPONENT */}
            <AssetSidebar
              images={images}
              onUpload={handleFileUpload}
              onOpenStudio={openStudio}
              uploadingSlot={uploadingSlot}
              isDark={isDark}
            />
          </div>

          <div className="lg:col-span-8 space-y-8 order-1 lg:order-2">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="TRANSMISSION TITLE"
              className={`w-full p-4 text-5xl font-black outline-none bg-transparent border-b-2 transition-colors duration-300 ${getTitleClass()}`}
            />
            <VibeEditor
              initialContent={content}
              onChange={handleLexicalChange}
              theme={theme}
            />
            <div
              className={`flex justify-between text-[10px] font-mono opacity-50 uppercase tracking-widest ${isDark ? "text-white" : "text-slate-500"}`}
            >
              <span>VibeLexical Engine Active</span>
              <span>ID: {postId || "UNSAVED"}</span>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .glitch-text {
          color: ${themeHex};
          text-shadow:
            2px 0 rgba(255, 0, 0, 0.5),
            -2px 0 rgba(0, 255, 255, 0.5);
        }
        .sexy-text {
          background: linear-gradient(
            90deg,
            #ff00ff 0%,
            #00ffff 50%,
            #ff00ff 100%
          );
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation:
            liquid-flow 3s linear infinite,
            deep-throb 0.4s ease-in-out infinite alternate;
          filter: drop-shadow(0 0 5px rgba(255, 0, 255, 0.6));
        }
        @keyframes liquid-flow {
          0% {
            background-position: 0% center;
          }
          100% {
            background-position: 200% center;
          }
        }
        @keyframes deep-throb {
          0% {
            transform: scale(1);
            filter: drop-shadow(0 0 8px rgba(255, 0, 255, 0.6));
          }
          100% {
            transform: scale(1.02);
            filter: drop-shadow(0 0 15px rgba(0, 255, 255, 0.8));
          }
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #333;
          border-radius: 4px;
        }
        input[type="date"]::-webkit-calendar-picker-indicator {
          filter: invert(1);
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}
