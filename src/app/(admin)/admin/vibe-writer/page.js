"use client";

import React, { useState, useMemo, useEffect, Suspense, useRef } from "react";
import dynamic from "next/dynamic";
import { createClient } from "@supabase/supabase-js";
import {
  Image as ImageIcon,
  Globe,
  Cpu,
  Copy,
  Check,
  Sun,
  Code,
  Save,
  Send,
  Ban,
  RefreshCw,
  CloudDownload,
  X,
  FilePlus,
  Archive,
  Eye,
  EyeOff,
  Upload,
  Loader2,
  Layout,
  AlignLeft,
  Maximize,
  ArrowRightCircle,
  Film,
  Trash2,
} from "lucide-react";
import { FaHotdog } from "react-icons/fa6";

import { Canvas } from "@react-three/fiber";
import "react-quill-new/dist/quill.snow.css";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const ReactQuill = dynamic(() => import("react-quill-new"), {
  ssr: false,
  loading: () => (
    <div className="h-64 bg-slate-900/50 animate-pulse rounded-[2rem]" />
  ),
});

const DystopianSnow = dynamic(
  () => import("@/src/components/write/DystopianSnow"),
  { ssr: false }
);

const CATEGORIES = [
  "Life",
  "Esotericism",
  "Acting",
  "Audiobook Acting",
  "Entrepreneurship",
  "Production",
];

// --- UTILITIES ---
const getStoragePathFromUrl = (url) => {
  if (!url || !url.includes("blog-images/")) return null;
  return url.split("blog-images/")[1];
};

const deleteOldAsset = async (url) => {
  const path = getStoragePathFromUrl(url);
  if (path) {
    await supabase.storage.from("blog-images").remove([path]);
  }
};

// --- TOOLBAR (Aggressive Event Handling) ---
const CustomToolbar = () => (
  <div
    id="toolbar"
    onMouseDown={(e) => {
      e.preventDefault(); // Stop focus loss
      e.stopPropagation(); // Stop event bubbling
    }}
    className="flex flex-wrap items-center gap-2 sm:gap-4 border-none justify-center sm:justify-start"
  >
    <span className="ql-formats">
      <select className="ql-header" defaultValue="">
        <option value="1">Heading 1</option>
        <option value="2">Heading 2</option>
        <option value="3">Heading 3</option>
        <option value="4">Heading 4</option>
        <option value="">Normal</option>
      </select>
    </span>
    <span className="ql-formats">
      <button className="ql-bold" type="button" />
      <button className="ql-italic" type="button" />
      <button className="ql-underline" type="button" />
      <button className="ql-strike" type="button" />
    </span>
    <span className="ql-formats">
      <button className="ql-list" value="ordered" type="button" />
      <button className="ql-list" value="bullet" type="button" />
      <button className="ql-blockquote" type="button" />
      <button className="ql-code-block" type="button" />
    </span>
    <span className="ql-formats">
      <button className="ql-link" type="button" />
      <button className="ql-image" type="button" />
    </span>
    <span className="ql-formats">
      <button className="ql-clean" type="button" />
    </span>
  </div>
);

// Memoizing to prevent re-renders that detach the toolbar
const MemoizedToolbar = React.memo(CustomToolbar);

export default function MasterEditorPage() {
  // --- STATE ---
  const [postId, setPostId] = useState(null);
  const [isPublished, setIsPublished] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [urlPath, setUrlPath] = useState("");
  const [tag, setTag] = useState("Life");
  const [date, setDate] = useState("");
  const [imageCaption, setImageCaption] = useState("");

  const [images, setImages] = useState({
    main: "",
    img2: "",
    img3: "",
    img4: "",
    img5: "",
  });

  const [imgSettings, setImgSettings] = useState({
    img2: { size: "lg", align: "center", display: "block" },
    img3: { size: "lg", align: "center", display: "block" },
    img4: { size: "lg", align: "center", display: "block" },
    img5: { size: "lg", align: "center", display: "block" },
  });

  const [copiedTag, setCopiedTag] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showLoadModal, setShowLoadModal] = useState(false);
  const [availableDrafts, setAvailableDrafts] = useState([]);
  const [recentAssets, setRecentAssets] = useState([]);
  const [uploadingSlot, setUploadingSlot] = useState(null);

  const [theme, setTheme] = useState("teal");
  const isDark = theme !== "light";

  const quillRef = useRef(null);
  const fileInputRefs = {
    main: useRef(null),
    img2: useRef(null),
    img3: useRef(null),
    img4: useRef(null),
    img5: useRef(null),
  };

  // --- THEME HELPERS ---
  const getThemeColor = (opacity = 1) => {
    if (theme === "yellow") return `rgba(250, 204, 21, ${opacity})`;
    return `rgba(45, 212, 191, ${opacity})`;
  };
  const themeHex = theme === "yellow" ? "#facc15" : "#2dd4bf";
  const themeTextClass =
    theme === "yellow" ? "text-yellow-400" : "text-teal-400";
  const themeBorderClass =
    theme === "yellow" ? "border-yellow-500" : "border-teal-500";
  const sceneBgColor = theme === "yellow" ? "#1a0500" : "#02020a";

  // --- INIT & ASSETS ---
  const fetchRecentAssets = async () => {
    const { data } = await supabase.storage.from("blog-images").list("", {
      limit: 12,
      sortBy: { column: "created_at", order: "desc" },
    });
    if (data) setRecentAssets(data);
  };

  useEffect(() => {
    setDate(new Date().toISOString().split("T")[0]);
    fetchRecentAssets();
    const saved = localStorage.getItem("vibewriter-autosave");
    if (saved && !postId) {
      try {
        const parsed = JSON.parse(saved);
        setTitle(parsed.title || "");
        setContent(parsed.content || "");
        setTag(parsed.tag || "Life");
        setImages(
          parsed.images || { main: "", img2: "", img3: "", img4: "", img5: "" }
        );
        setUrlPath(parsed.urlPath || "");
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  useEffect(() => {
    const payload = { title, content, tag, images, urlPath };
    localStorage.setItem("vibewriter-autosave", JSON.stringify(payload));
  }, [title, content, tag, images, urlPath]);

  useEffect(() => {
    if (!postId) {
      setUrlPath(
        title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)+/g, "")
      );
    }
  }, [title, postId]);

  const isReady = title.length > 2 && urlPath.length > 2 && content.length > 10;

  // --- ACTIONS ---
  const handleClear = () => {
    if (confirm("Are you sure? This will clear everything.")) {
      setPostId(null);
      setTitle("");
      setContent("");
      setUrlPath("");
      setTag("Life");
      setImages({ main: "", img2: "", img3: "", img4: "", img5: "" });
      setIsPublished(false);
      setDate(new Date().toISOString().split("T")[0]);
      localStorage.removeItem("vibewriter-autosave");
    }
  };

  const handleDatabaseAction = async (actionType) => {
    if (!isReady) return;
    setIsSaving(true);
    const targetStatus = actionType === "PUBLISH";
    const payload = {
      title,
      slug: urlPath,
      date,
      tag,
      content,
      image: images.main,
      image_2: images.img2,
      image_3: images.img3,
      image_4: images.img4,
      image_5: images.img5,
      image_caption: imageCaption,
      published: targetStatus,
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
      setIsPublished(targetStatus);
      alert(targetStatus ? "LIVE!" : "SAVED");
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
      setContent(data.content);
      setDate(data.date);
      setIsPublished(data.published || false);
      setImageCaption(data.image_caption || "");
      setImages({
        main: data.image || "",
        img2: data.image_2 || "",
        img3: data.image_3 || "",
        img4: data.image_4 || "",
        img5: data.image_5 || "",
      });
      setShowLoadModal(false);
    }
  };

  const toggleVisibility = async (e, draftId, currentStatus) => {
    e.stopPropagation();
    const newStatus = !currentStatus;
    const { error } = await supabase
      .from("posts")
      .update({ published: newStatus })
      .eq("id", draftId);
    if (error) return alert("Error updating status");
    setAvailableDrafts((prev) =>
      prev.map((p) => (p.id === draftId ? { ...p, published: newStatus } : p))
    );
  };

  const handleFileUpload = async (e, slotKey) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!urlPath)
      return alert("Please enter a Title to generate a slug first.");

    setUploadingSlot(slotKey);
    try {
      if (images[slotKey]) await deleteOldAsset(images[slotKey]);
      const fileExt = file.name.split(".").pop();
      const subFolder = slotKey === "main" ? "hero" : "content-images";
      const uniqueId = Math.random().toString(36).substring(2, 8);
      const fileName = `${slotKey}-${uniqueId}.${fileExt}`;
      const filePath = `${urlPath}/${subFolder}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("blog-images")
        .upload(filePath, file, { cacheControl: "3600", upsert: true });
      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("blog-images").getPublicUrl(filePath);
      setImages((prev) => ({ ...prev, [slotKey]: publicUrl }));
      fetchRecentAssets();
    } catch (error) {
      alert("Upload failed: " + error.message);
    } finally {
      setUploadingSlot(null);
      if (fileInputRefs[slotKey].current)
        fileInputRefs[slotKey].current.value = "";
    }
  };

  const updateImgSetting = (key, field, value) => {
    setImgSettings((prev) => ({
      ...prev,
      [key]: { ...prev[key], [field]: value },
    }));
  };

  const generateImageHtml = (key, url) => {
    const s = imgSettings[key];
    let style =
      "border-radius: 1.5rem; box-shadow: 0 20px 40px -10px rgba(0,0,0,0.3); transition: all 0.3s ease; ";
    if (s.size === "sm") style += "width: 30%; min-width: 250px; ";
    if (s.size === "md") style += "width: 55%; min-width: 300px; ";
    if (s.size === "lg") style += "width: 100%; ";

    if (s.display === "inline") {
      style += "display: inline-block; vertical-align: top; margin: 1%; ";
    } else {
      style += "display: block; ";
      if (s.align === "left")
        style += "float: left; margin-right: 2.5rem; margin-bottom: 1.5rem; ";
      if (s.align === "right")
        style += "float: right; margin-left: 2.5rem; margin-bottom: 1.5rem; ";
      if (s.align === "center")
        style +=
          "margin-left: auto; margin-right: auto; float: none; margin-top: 2rem; margin-bottom: 2rem; ";
    }
    return `<img src="${url}" alt="vibe-asset-${key}" style="${style}" data-asset-slot="${key}" />`;
  };

  const insertImageToEditor = (key, urlOverride = null) => {
    const url = urlOverride || images[key];
    if (!url || !quillRef.current) return;
    const html = generateImageHtml(key, url);
    const editor = quillRef.current.getEditor();
    const range = editor.getSelection();
    const index = range ? range.index : editor.getLength();
    editor.clipboard.dangerouslyPasteHTML(index, html);
  };

  const copyImageTag = (key, url) => {
    if (!url) return;
    navigator.clipboard.writeText(generateImageHtml(key, url));
    setCopiedTag(key);
    setTimeout(() => setCopiedTag(null), 2000);
  };

  const toggleTheme = () => {
    if (theme === "light") setTheme("teal");
    else if (theme === "teal") setTheme("yellow");
    else setTheme("light");
  };

  const modules = useMemo(() => ({ toolbar: { container: "#toolbar" } }), []);

  return (
    <div
      className={`transition-all duration-1000 min-h-screen relative font-sans ${isDark ? "bg-[#02020a] text-slate-100" : "bg-slate-50 text-slate-900"}`}
      style={{ backgroundColor: isDark ? sceneBgColor : "#f8fafc" }}
    >
      {/* 🌌 3D SCENE */}
      {isDark && (
        <div className="fixed inset-0 z-0 opacity-100 transition-opacity duration-1000 pointer-events-none">
          <Suspense fallback={null}>
            <Canvas camera={{ position: [0, 0, 10], fov: 60, far: 100 }}>
              <color attach="background" args={[sceneBgColor]} />
              <fog attach="fog" args={[sceneBgColor, 10, 80]} />
              <DystopianSnow theme={theme} />
            </Canvas>
          </Suspense>
        </div>
      )}

      {/* 📥 LOAD MODAL */}
      {showLoadModal && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div
            className={`w-full md:w-[90%] max-w-2xl max-h-[80vh] overflow-y-auto bg-[#0a0a0a] border-2 ${themeBorderClass} rounded-2xl p-4 md:p-6 shadow-2xl`}
          >
            <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
              <h2
                className={`text-lg md:text-xl font-black uppercase tracking-widest ${themeTextClass}`}
              >
                Load Transmission
              </h2>
              <button
                onClick={() => setShowLoadModal(false)}
                className="hover:text-red-500 transition-colors"
              >
                <X />
              </button>
            </div>
            <div className="space-y-2">
              {availableDrafts.map((draft) => (
                <div
                  key={draft.id}
                  className="w-full relative p-3 md:p-4 border border-white/10 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center group transition-all hover:bg-white/5 gap-3"
                >
                  <button
                    onClick={() => loadDraft(draft.id)}
                    className="flex-1 flex justify-between items-center text-left w-full"
                  >
                    <div>
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
                        <span className="font-bold text-slate-200 group-hover:text-white transition-colors text-sm truncate max-w-[150px] sm:max-w-xs">
                          {draft.title || "Untitled"}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono uppercase mt-1 pl-1">
                        {draft.date} • {draft.slug}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 md:gap-4 pr-2">
                      <span className="hidden sm:inline text-[10px] uppercase font-bold text-slate-600 group-hover:text-slate-400">
                        Load
                      </span>
                      <CloudDownload
                        size={18}
                        className={`opacity-50 group-hover:opacity-100 transition-opacity ${themeTextClass}`}
                      />
                    </div>
                  </button>
                  <button
                    onClick={(e) =>
                      toggleVisibility(e, draft.id, draft.published)
                    }
                    className={`w-full sm:w-auto p-2 rounded-lg border transition-all z-10 flex justify-center ${draft.published ? "bg-emerald-900/20 border-emerald-500/50 text-emerald-400 hover:bg-emerald-500 hover:text-white" : "bg-slate-800/50 border-slate-700 text-slate-500 hover:bg-slate-700 hover:text-slate-300"}`}
                  >
                    {draft.published ? <Eye size={16} /> : <EyeOff size={16} />}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* --- UI WRAPPER --- */}
      <div className="relative z-10 pt-8 md:pt-16 lg:pt-24 pb-20 px-4 md:px-8 lg:px-16 max-w-[1600px] mx-auto">
        {/* RESPONSIVE HEADER */}
        <header className="flex flex-col xl:flex-row items-center justify-between mb-8 lg:mb-16 gap-6 relative transition-colors duration-500">
          <div
            className="absolute bottom-[-20px] xl:bottom-[-40px] left-0 right-0 h-[2px] transition-all duration-500"
            style={{
              backgroundColor: isDark ? themeHex : "#e2e8f0",
              boxShadow: isDark ? `0 0 25px ${getThemeColor(1)}` : "none",
            }}
          />
          <h1
            className={`text-2xl md:text-3xl font-black uppercase tracking-[0.2em] md:tracking-[0.4em] transition-all cursor-default text-center xl:text-left ${isDark ? `${themeTextClass} glitch-title` : "text-slate-900"}`}
            data-text="VibeWriter™"
          >
            VibeWriter™
          </h1>

          <div className="flex flex-wrap justify-center gap-2 md:gap-3 w-full xl:w-auto">
            <button
              onClick={handleClear}
              className={`p-3 md:p-4 rounded-full transition-all ${isDark ? `bg-white/5 text-slate-500 hover:text-red-500 border border-transparent hover:border-red-900` : "bg-white border text-slate-400 hover:text-red-600"}`}
            >
              <FilePlus size={18} />
            </button>
            <button
              onClick={fetchDrafts}
              className={`flex items-center gap-2 px-4 py-3 md:px-6 md:py-4 rounded-full transition-all uppercase font-bold text-[10px] md:text-xs tracking-widest ${isDark ? `bg-white/5 text-slate-300 hover:text-white border-2 border-transparent hover:border-white/20` : "bg-white border border-slate-200 text-slate-600 hover:text-teal-600"}`}
            >
              <Archive size={14} />{" "}
              <span className="hidden sm:inline">Archive</span>
            </button>
            <button
              onClick={() => handleDatabaseAction("DRAFT")}
              disabled={isSaving || !isReady}
              className={`p-3 md:p-4 rounded-full transition-all ${isDark ? `bg-white/5 ${themeTextClass} border-2 border-white/10 hover:${themeBorderClass}` : "bg-white border border-slate-200 shadow-sm text-slate-500 hover:text-teal-600"}`}
            >
              {isSaving ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Save size={18} />
              )}
            </button>
            {isPublished && (
              <button
                onClick={() => handleDatabaseAction("UNPUBLISH")}
                className="p-3 md:p-4 rounded-full transition-all bg-red-900/20 text-red-500 border-2 border-red-900 hover:bg-red-500 hover:text-white"
              >
                <Ban size={18} />
              </button>
            )}
            <button
              onClick={() => handleDatabaseAction("PUBLISH")}
              disabled={isSaving || !isReady}
              className={`flex items-center gap-2 px-6 py-3 md:px-6 md:py-4 rounded-full transition-all font-black uppercase text-[10px] md:text-xs tracking-widest ${isPublished ? "bg-emerald-500/10 text-emerald-500 border-2 border-emerald-500" : isDark ? `bg-black/40 backdrop-blur-md ${themeBorderClass} ${themeTextClass} border-2 hover:bg-white/10 hover:scale-105` : "bg-slate-900 text-white border-transparent hover:bg-black hover:scale-105 shadow-xl"}`}
            >
              {isPublished ? (
                <>
                  <span className="hidden sm:inline">Posted</span>{" "}
                  <Check size={14} />
                </>
              ) : (
                <>
                  <span className="hidden sm:inline">Post</span>{" "}
                  <Send size={14} />
                </>
              )}
            </button>
            <button
              onClick={toggleTheme}
              className={`p-3 md:p-4 rounded-full transition-all ${isDark ? `bg-white/5 ${themeTextClass} border-2 ${themeBorderClass}` : "bg-white border border-slate-200 text-amber-500 hover:bg-amber-50"}`}
            >
              {theme === "light" ? (
                <Sun size={18} />
              ) : theme === "teal" ? (
                <Cpu size={18} />
              ) : (
                <FaHotdog size={18} />
              )}
            </button>
          </div>
        </header>

        {/* MAIN GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          {/* SIDEBAR */}
          <div className="lg:col-span-4 space-y-6 md:space-y-8 order-2 lg:order-1">
            <div
              className={`p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border-2 transition-all duration-500 ${isDark ? `bg-black/20 backdrop-blur-md ${themeBorderClass} border-opacity-60 shadow-neon-box-ultra` : "bg-white border-slate-200 shadow-sm"}`}
            >
              <div className="space-y-6">
                <div className="relative group">
                  <Globe
                    size={16}
                    className={`absolute left-5 top-5 transition-colors ${isDark ? `${themeTextClass} neon-text-glow` : "text-slate-400"}`}
                  />
                  <input
                    value={urlPath}
                    onChange={(e) => setUrlPath(e.target.value)}
                    placeholder="URL slug"
                    className={`w-full p-4 pl-12 rounded-xl text-sm font-bold outline-none border-2 transition-all ${isDark ? `bg-transparent border-white/10 focus:${themeBorderClass} theme-input` : "bg-slate-50 border-slate-200"}`}
                  />
                </div>
                <select
                  value={tag}
                  onChange={(e) => setTag(e.target.value)}
                  className={`w-full p-4 rounded-xl text-sm font-black outline-none border-2 transition-all ${isDark ? `bg-transparent border-white/10 focus:${themeBorderClass} theme-input` : "bg-slate-50 border-slate-200"}`}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c} className="bg-black text-white">
                      {c}
                    </option>
                  ))}
                </select>
                <div className="flex items-center gap-2">
                  <div className="relative flex-grow">
                    <ImageIcon
                      size={16}
                      className={`absolute left-5 top-5 ${isDark ? themeTextClass : "text-slate-400"}`}
                    />
                    <input
                      value={images.main}
                      onChange={(e) =>
                        setImages({ ...images, main: e.target.value })
                      }
                      placeholder="Hero URL"
                      className={`w-full p-4 pl-12 rounded-xl text-[10px] font-mono outline-none border-2 transition-all ${isDark ? `bg-transparent border-white/10 focus:${themeBorderClass} theme-input` : "bg-slate-50 border-slate-200"}`}
                    />
                  </div>
                  <button
                    onClick={() => fileInputRefs.main.current.click()}
                    className={`p-4 rounded-xl border-2 ${isDark ? `bg-transparent border-white/10 hover:${themeBorderClass} text-slate-400 hover:text-white` : "bg-slate-100 border-slate-200"}`}
                  >
                    {uploadingSlot === "main" ? (
                      <Loader2 size={20} className="animate-spin" />
                    ) : (
                      <Upload size={20} />
                    )}
                  </button>
                  <input
                    type="file"
                    ref={fileInputRefs.main}
                    onChange={(e) => handleFileUpload(e, "main")}
                    className="hidden"
                    accept="image/*"
                  />
                </div>
              </div>
            </div>

            {/* 🗄️ RECENT ASSETS LIBRARY */}
            <div className="p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border-2 border-white/5 bg-white/5 backdrop-blur-md">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">
                  Recent Assets
                </h3>
                <button
                  onClick={fetchRecentAssets}
                  className="text-white/20 hover:text-teal-400 transition-colors"
                >
                  <RefreshCw
                    size={12}
                    className={uploadingSlot ? "animate-spin" : ""}
                  />
                </button>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 md:gap-3">
                {recentAssets.length > 0 ? (
                  recentAssets.map((asset) => {
                    const publicUrl = supabase.storage
                      .from("blog-images")
                      .getPublicUrl(asset.name).data.publicUrl;
                    return (
                      <button
                        key={asset.name}
                        onClick={() => insertImageToEditor("img2", publicUrl)}
                        className="aspect-square rounded-lg border border-white/10 overflow-hidden hover:border-teal-400 transition-all group relative bg-black/40"
                      >
                        <img
                          src={publicUrl}
                          className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity"
                          alt="asset"
                        />
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-teal-500/20">
                          <FilePlus size={16} className="text-white" />
                        </div>
                      </button>
                    );
                  })
                ) : (
                  <div className="col-span-4 py-8 text-center border border-dashed border-white/10 rounded-xl">
                    <p className="text-[9px] uppercase tracking-widest opacity-20 font-bold">
                      No Assets Found
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* ASSET ENGINE */}
            <div
              className={`p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border-2 transition-all duration-500 ${isDark ? `bg-black/20 backdrop-blur-md ${themeBorderClass} border-opacity-40 shadow-neon-box-intense` : "bg-white border-slate-200"}`}
            >
              <h3
                className={`font-black uppercase tracking-[0.2em] text-[10px] mb-4 ${isDark ? "text-white/50" : "text-slate-400"}`}
              >
                Config Assets
              </h3>
              <div className="space-y-6">
                {["img2", "img3", "img4", "img5"].map((key, index) => (
                  <div
                    key={key}
                    className="flex flex-col gap-2 p-3 rounded-xl border border-white/5 bg-black/10"
                  >
                    <div className="flex items-center gap-2">
                      <input
                        value={images[key]}
                        onChange={(e) =>
                          setImages({ ...images, [key]: e.target.value })
                        }
                        placeholder={`Img ${index + 2}`}
                        className={`flex-grow p-2 rounded-lg text-[10px] font-mono outline-none border-2 ${isDark ? `bg-transparent border-white/5 focus:${themeBorderClass} theme-input` : "bg-slate-50 border-slate-200"}`}
                      />
                      <button
                        onClick={() => fileInputRefs[key].current.click()}
                        className="p-2 rounded-lg border bg-white/5 border-white/10 text-slate-400 hover:text-white"
                      >
                        {uploadingSlot === key ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <Upload size={14} />
                        )}
                      </button>
                      <input
                        type="file"
                        ref={fileInputRefs[key]}
                        onChange={(e) => handleFileUpload(e, key)}
                        className="hidden"
                        accept="image/*"
                      />
                      {images[key].length > 5 && (
                        <>
                          <button
                            onClick={() => insertImageToEditor(key)}
                            className={`p-2 rounded-lg border ${isDark ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-400" : "bg-emerald-50"}`}
                          >
                            <ArrowRightCircle size={14} />
                          </button>
                          <button
                            onClick={() => copyImageTag(key, images[key])}
                            className="p-2 rounded-lg border bg-white/5 border-white/20 text-slate-500 hover:text-white"
                          >
                            {copiedTag === key ? (
                              <Check size={14} />
                            ) : (
                              <Copy size={14} />
                            )}
                          </button>
                        </>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="flex items-center gap-1 bg-white/5 rounded px-2 py-1">
                        <Maximize size={10} className="text-slate-500" />
                        <select
                          value={imgSettings[key].size}
                          onChange={(e) =>
                            updateImgSetting(key, "size", e.target.value)
                          }
                          className="bg-transparent text-[9px] uppercase font-bold text-slate-300 outline-none w-full"
                        >
                          <option value="sm" className="bg-black">
                            Sm
                          </option>
                          <option value="md" className="bg-black">
                            Md
                          </option>
                          <option value="lg" className="bg-black">
                            Lg
                          </option>
                        </select>
                      </div>
                      <div className="flex items-center gap-1 bg-white/5 rounded px-2 py-1">
                        <AlignLeft size={10} className="text-slate-500" />
                        <select
                          value={imgSettings[key].align}
                          onChange={(e) =>
                            updateImgSetting(key, "align", e.target.value)
                          }
                          className="bg-transparent text-[9px] uppercase font-bold text-slate-300 outline-none w-full"
                        >
                          <option value="left" className="bg-black">
                            L
                          </option>
                          <option value="center" className="bg-black">
                            C
                          </option>
                          <option value="right" className="bg-black">
                            R
                          </option>
                        </select>
                      </div>
                      <div className="flex items-center gap-1 bg-white/5 rounded px-2 py-1">
                        <Layout size={10} className="text-slate-500" />
                        <select
                          value={imgSettings[key].display}
                          onChange={(e) =>
                            updateImgSetting(key, "display", e.target.value)
                          }
                          className="bg-transparent text-[9px] uppercase font-bold text-slate-300 outline-none w-full"
                        >
                          <option value="block" className="bg-black">
                            Blk
                          </option>
                          <option value="inline" className="bg-black">
                            Inl
                          </option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* EDITOR AREA */}
          <div className="lg:col-span-8 space-y-8 order-1 lg:order-2">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="POST TITLE"
              className={`w-[98%] p-4 text-4xl md:text-5xl lg:text-6xl font-black outline-none bg-transparent transition-all tracking-tighter border-b-2 ${isDark ? `${themeBorderClass} focus:neon-text-ultra theme-input` : "text-slate-900 border-slate-200"}`}
            />

            <div
              className={`p-3 md:p-4 rounded-[2rem] border-2 transition-all duration-500 relative z-20 ${isDark ? `bg-black/60 backdrop-blur-md ${themeBorderClass} border-opacity-40` : "bg-white border-slate-200"}`}
            >
              <MemoizedToolbar />
            </div>

            <div
              className={`relative z-10 rounded-[2rem] md:rounded-[2.5rem] border-2 transition-all duration-700 overflow-hidden ${isDark ? `bg-black/60 backdrop-blur-xl ${themeBorderClass} border-opacity-40 shadow-neon-box-ultra dark-quill` : "bg-white border-slate-200 shadow-xl light-quill"}`}
            >
              <ReactQuill
                ref={quillRef}
                theme="snow"
                value={content}
                onChange={setContent}
                modules={modules}
                className="h-[500px] border-none px-4 md:px-8 py-6 md:py-8"
              />
            </div>

            <div
              className={`p-4 rounded-xl flex items-center justify-between text-[9px] md:text-[10px] font-mono uppercase tracking-widest ${isDark ? "bg-white/5 text-slate-400" : "bg-slate-100 text-slate-500"}`}
            >
              <span>
                Status:{" "}
                <strong
                  className={
                    isPublished ? "text-emerald-500" : "text-amber-500"
                  }
                >
                  {isPublished ? "LIVE" : "DRAFT"}
                </strong>
              </span>
              <span>ID: {postId || "NEW"}</span>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        :root {
          --theme-rgb: ${theme === "yellow" ? "250, 204, 21" : "45, 212, 191"};
          --theme-hex: ${themeHex};
        }
        #toolbar {
          display: flex;
          flex-wrap: wrap;
          border: none !important;
        }
        /* FIXED BUTTON COLORS */
        #toolbar button,
        #toolbar .ql-picker-label {
          color: ${isDark ? "var(--theme-hex)" : "#475569"} !important;
          margin-right: 0.5rem;
          transition: all 0.2s;
        }
        #toolbar button:hover {
          transform: scale(1.1);
        }
        /* FIXED SVG STROKE/FILL FOR ICONS */
        #toolbar .ql-stroke {
          stroke: ${isDark ? "var(--theme-hex)" : "#475569"} !important;
        }
        #toolbar .ql-fill {
          fill: ${isDark ? "var(--theme-hex)" : "#475569"} !important;
        }
        /* DROPDOWN FIX - High Contrast */
        .ql-picker-options {
          z-index: 9999 !important;
          background-color: ${isDark ? "#050505" : "#fff"} !important;
          border: 1px solid var(--theme-hex) !important;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
          padding: 10px !important;
        }
        .ql-picker-label {
          color: ${isDark ? "var(--theme-hex)" : "#000"} !important;
        }
        .ql-picker-item {
          color: ${isDark
            ? "#a1a1aa"
            : "#333"} !important; /* Visible Text Color */
          transition: all 0.2s ease;
        }
        .ql-picker-item:hover {
          color: var(--theme-hex) !important;
          font-weight: bold !important;
        }
        .ql-picker-item.ql-selected {
          color: var(--theme-hex) !important;
          font-weight: bold;
        }
        /* ACTIVE BUTTON STATE */
        .ql-active .ql-stroke {
          stroke: #fff !important;
        }
        .ql-active .ql-fill {
          fill: #fff !important;
        }

        .ql-container {
          border: none !important;
          height: 100% !important;
        }
        .ql-editor {
          font-size: 1.15rem !important;
          line-height: 1.8 !important;
          padding-bottom: 5rem !important;
        }
        .ql-editor h1 {
          font-size: 2.5em !important;
          font-weight: 900 !important;
        }
        .dark-quill .ql-editor {
          color: rgba(var(--theme-rgb), 0.9) !important;
          text-shadow: 0 0 10px rgba(var(--theme-rgb), 0.2);
        }
        .theme-input {
          color: rgba(var(--theme-rgb), 0.9) !important;
          text-shadow: 0 0 10px rgba(var(--theme-rgb), 0.4);
        }
        .neon-text-ultra {
          text-shadow:
            0 0 30px rgba(var(--theme-rgb), 1),
            0 0 60px rgba(var(--theme-rgb), 0.6);
        }
        .shadow-neon-box-ultra {
          box-shadow:
            0 0 130px rgba(var(--theme-rgb), 0.25),
            inset 0 0 40px rgba(var(--theme-rgb), 0.1);
        }
        .glitch-title {
          position: relative;
          text-shadow:
            0.05em 0 0 rgba(255, 0, 81, 0.8),
            -0.025em -0.05em 0 rgba(0, 255, 225, 0.8);
          animation: glitch 4s infinite;
        }
        @keyframes glitch {
          0%,
          100% {
            text-shadow:
              0.05em 0 0 rgba(255, 0, 81, 0.8),
              -0.05em -0.025em 0 rgba(0, 255, 225, 0.8);
          }
          50% {
            text-shadow:
              0.025em 0.05em 0 rgba(255, 0, 81, 0.8),
              0.05em 0 0 rgba(0, 255, 225, 0.8);
          }
        }
      `}</style>
    </div>
  );
}
