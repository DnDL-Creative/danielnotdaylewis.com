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
  Layout, // NEW
  AlignLeft, // NEW
  Maximize, // NEW
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

// --- CUSTOM TOOLBAR ---
const CustomToolbar = () => (
  <div id="toolbar" className="flex flex-wrap items-center gap-4">
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
      <button className="ql-bold" />
      <button className="ql-italic" />
      <button className="ql-underline" />
      <button className="ql-strike" />
    </span>
    <span className="ql-formats">
      <button className="ql-list" value="ordered" />
      <button className="ql-list" value="bullet" />
      <button className="ql-blockquote" />
      <button className="ql-code-block" />
    </span>
    <span className="ql-formats">
      <button className="ql-link" />
      <button className="ql-image" />
    </span>
    <span className="ql-formats">
      <button className="ql-clean" />
    </span>
  </div>
);

export default function MasterEditorPage() {
  const [postId, setPostId] = useState(null);
  const [isPublished, setIsPublished] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [urlPath, setUrlPath] = useState("");
  const [tag, setTag] = useState("Life");
  const [date, setDate] = useState("");
  const [images, setImages] = useState({
    main: "",
    img2: "",
    img3: "",
    img4: "",
    img5: "",
  });

  // NEW: Image Settings State
  const [imgSettings, setImgSettings] = useState({
    img2: { size: "lg", align: "center", display: "block" },
    img3: { size: "lg", align: "center", display: "block" },
    img4: { size: "lg", align: "center", display: "block" },
    img5: { size: "lg", align: "center", display: "block" },
  });

  const [copied, setCopied] = useState(false);
  const [copiedTag, setCopiedTag] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showLoadModal, setShowLoadModal] = useState(false);
  const [availableDrafts, setAvailableDrafts] = useState([]);
  const [uploadingSlot, setUploadingSlot] = useState(null);

  const [theme, setTheme] = useState("teal");
  const isDark = theme !== "light";

  const fileInputRefs = {
    main: useRef(null),
    img2: useRef(null),
    img3: useRef(null),
    img4: useRef(null),
    img5: useRef(null),
  };

  useEffect(() => {
    setDate(new Date().toISOString().split("T")[0]);
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

  // --- NEW: Update Settings Helper ---
  const updateImgSetting = (key, field, value) => {
    setImgSettings((prev) => ({
      ...prev,
      [key]: { ...prev[key], [field]: value },
    }));
  };

  // --- NEW: Generate Smart Tag ---
  const copyImageTag = (key, url) => {
    if (!url) return;
    const s = imgSettings[key];

    // Construct classes based on settings
    const sizeClass = `blog-size-${s.size}`; // blog-size-sm, blog-size-md, blog-size-lg
    const alignClass = `blog-align-${s.align}`; // blog-align-left, blog-align-center
    const displayClass = s.display === "inline" ? "blog-display-inline" : "";

    const tag = `<img src="${url}" alt="image-${key}" class="${sizeClass} ${alignClass} ${displayClass}" />`;

    navigator.clipboard.writeText(tag);
    setCopiedTag(key);
    setTimeout(() => setCopiedTag(null), 2000);
  };

  // --- NEW: HANDLE IMAGE UPLOAD (ORGANIZED) ---
  const handleFileUpload = async (e, slotKey) => {
    const file = e.target.files[0];
    if (!file) return;

    // 1. Safety Check: We need a slug to create the folder
    if (!urlPath) {
      alert(
        "Please enter a Title to generate a slug first (needed for folder organization)."
      );
      return;
    }

    setUploadingSlot(slotKey);

    try {
      const fileExt = file.name.split(".").pop();

      // 2. Determine Subfolder (Hero vs Content)
      // If slotKey is 'main', go to 'hero' folder. Otherwise 'content-images'
      const subFolder = slotKey === "main" ? "hero" : "content-images";

      // 3. Create Clean Filename (timestamp prevents overwriting)
      const fileName = `${slotKey}-${Date.now()}.${fileExt}`;

      // 4. Construct Full Path: slug / subfolder / filename
      const filePath = `${urlPath}/${subFolder}/${fileName}`;

      // 5. Upload
      const { error: uploadError } = await supabase.storage
        .from("blog-images")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // 6. Get Public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("blog-images").getPublicUrl(filePath);

      // 7. Update State
      setImages((prev) => ({ ...prev, [slotKey]: publicUrl }));
    } catch (error) {
      console.error("Upload failed:", error);
      alert("Upload failed: " + error.message);
    } finally {
      setUploadingSlot(null);
      if (fileInputRefs[slotKey].current) {
        fileInputRefs[slotKey].current.value = "";
      }
    }
  };

  // ... (Keep handleClear, handleDatabaseAction, fetchDrafts, loadDraft, toggleVisibility, toggleTheme as they were) ...
  // [I am omitting the middle functions to save space, paste them back from previous code if needed,
  // but for a clean copy-paste I will include the critical UI render part below]

  const handleClear = () => {
    /* ... same ... */ if (confirm("Clear?")) {
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
    /* ... same ... */ if (!isReady) return;
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
      alert(actionType === "PUBLISH" ? "POSTED!" : "Saved.");
    } catch (err) {
      alert(err.message);
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
      setImages({
        main: data.image || "",
        img2: data.image_2 || "",
        img3: data.image_3 || "",
        img4: data.image_4 || "",
        img5: data.image_5 || "",
      });
      setIsPublished(data.published || false);
      setShowLoadModal(false);
    }
  };

  const toggleVisibility = async (e, draftId, currentStatus) => {
    e.stopPropagation();
    const newStatus = !currentStatus;
    await supabase
      .from("posts")
      .update({ published: newStatus })
      .eq("id", draftId);
    setAvailableDrafts((prev) =>
      prev.map((p) => (p.id === draftId ? { ...p, published: newStatus } : p))
    );
  };

  const toggleTheme = () => {
    if (theme === "light") setTheme("teal");
    else if (theme === "teal") setTheme("yellow");
    else setTheme("light");
  };
  const getThemeColor = (opacity = 1) =>
    theme === "yellow"
      ? `rgba(250, 204, 21, ${opacity})`
      : `rgba(45, 212, 191, ${opacity})`;
  const themeHex = theme === "yellow" ? "#facc15" : "#2dd4bf";
  const themeTextClass =
    theme === "yellow" ? "text-yellow-400" : "text-teal-400";
  const themeBorderClass =
    theme === "yellow" ? "border-yellow-500" : "border-teal-500";
  const sceneBgColor = theme === "yellow" ? "#1a0500" : "#02020a";
  const modules = useMemo(() => ({ toolbar: { container: "#toolbar" } }), []);

  return (
    <div
      className={`transition-all duration-1000 min-h-screen relative font-sans ${isDark ? "bg-[#02020a] text-slate-100" : "bg-slate-50 text-slate-900"}`}
      style={{ backgroundColor: isDark ? sceneBgColor : "#f8fafc" }}
    >
      {isDark && (
        <div className="fixed inset-0 z-0 opacity-100 transition-opacity duration-1000">
          <Suspense fallback={null}>
            <Canvas camera={{ position: [0, 0, 10], fov: 60, far: 100 }}>
              <color attach="background" args={[sceneBgColor]} />
              <fog attach="fog" args={[sceneBgColor, 10, 80]} />
              <DystopianSnow theme={theme} />
            </Canvas>
          </Suspense>
        </div>
      )}

      {/* MODAL */}
      {showLoadModal && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div
            className={`w-full max-w-2xl max-h-[80vh] overflow-y-auto bg-[#0a0a0a] border-2 ${themeBorderClass} rounded-2xl p-6 shadow-2xl`}
          >
            <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
              <h2
                className={`text-xl font-black uppercase tracking-widest ${themeTextClass}`}
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
                  className="w-full relative p-4 border border-white/10 rounded-lg flex justify-between items-center group transition-all hover:bg-white/5"
                >
                  <button
                    onClick={() => loadDraft(draft.id)}
                    className="flex-1 flex justify-between items-center text-left"
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
                        <span className="font-bold text-slate-200 group-hover:text-white transition-colors">
                          {draft.title || "Untitled"}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono uppercase mt-1 pl-1">
                        {draft.date} • {draft.slug}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 pr-4">
                      <span className="text-[10px] uppercase font-bold text-slate-600 group-hover:text-slate-400">
                        Load
                      </span>
                      <CloudDownload
                        size={20}
                        className={`opacity-50 group-hover:opacity-100 transition-opacity ${themeTextClass}`}
                      />
                    </div>
                  </button>
                  <button
                    onClick={(e) =>
                      toggleVisibility(e, draft.id, draft.published)
                    }
                    className={`ml-4 p-2 rounded-lg border transition-all z-10 ${draft.published ? "bg-emerald-900/20 border-emerald-500/50 text-emerald-400 hover:bg-emerald-500 hover:text-white" : "bg-slate-800/50 border-slate-700 text-slate-500 hover:bg-slate-700 hover:text-slate-300"}`}
                  >
                    {draft.published ? <Eye size={16} /> : <EyeOff size={16} />}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* NAVBAR (Simplified for brevity) */}
      <div className="relative z-10 pt-24 pb-20 px-6 lg:px-16 max-w-[1600px] mx-auto">
        <header
          className={`flex items-center justify-between mb-16 pb-10 relative transition-colors duration-500`}
        >
          <div
            className="absolute bottom-[-1px] left-2 right-2 h-[2px] transition-all duration-500"
            style={{
              backgroundColor: isDark ? themeHex : "#e2e8f0",
              boxShadow: isDark ? `0 0 25px ${getThemeColor(1)}` : "none",
            }}
          />
          <h1
            className={`text-3xl font-black uppercase tracking-[0.4em] transition-all cursor-default ${isDark ? `${themeTextClass} glitch-title` : "text-slate-900"}`}
          >
            VibeWriter™
          </h1>
          <div className="flex items-center gap-3 mr-4 lg:mr-12">
            <button
              onClick={handleClear}
              className="p-4 rounded-full bg-white/5 border border-transparent hover:border-red-900 text-slate-500 hover:text-red-500"
            >
              <FilePlus size={20} />
            </button>
            <button
              onClick={fetchDrafts}
              className={`flex items-center gap-3 px-6 py-4 rounded-full font-bold text-xs tracking-widest bg-white/5 text-slate-300 hover:text-white border-2 border-transparent hover:border-white/20`}
            >
              {" "}
              <Archive size={16} /> Open Archive
            </button>
            <button
              onClick={() => handleDatabaseAction("DRAFT")}
              disabled={isSaving || !isReady}
              className={`p-4 rounded-full ${isDark ? `bg-white/5 ${themeTextClass} border-2 border-white/10` : "bg-white text-teal-600"}`}
            >
              {" "}
              {isSaving ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <Save size={20} />
              )}{" "}
            </button>
            <button
              onClick={() => handleDatabaseAction("PUBLISH")}
              disabled={isSaving || !isReady}
              className={`flex items-center gap-2 px-6 py-4 rounded-full font-black uppercase text-xs tracking-widest ${isPublished ? "bg-emerald-500/10 text-emerald-500 border-2 border-emerald-500" : `bg-black/40 ${themeBorderClass} ${themeTextClass}`}`}
            >
              {" "}
              {isPublished ? <Check size={16} /> : <Send size={16} />}{" "}
            </button>
            <button
              onClick={toggleTheme}
              className={`ml-2 p-4 rounded-full ${isDark ? `bg-white/5 ${themeTextClass}` : "bg-white text-amber-500"}`}
            >
              {" "}
              {theme === "light" ? <Sun size={20} /> : <Cpu size={20} />}{" "}
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Metadata Sidebar */}
          <div className="lg:col-span-4 space-y-8">
            <div
              className={`p-8 rounded-[2.5rem] border-2 transition-all duration-500 ${isDark ? `bg-black/20 backdrop-blur-md ${themeBorderClass} border-opacity-60 shadow-neon-box-ultra` : "bg-white border-slate-200 shadow-sm"}`}
            >
              {/* URL & TAG & MAIN IMAGE */}
              <div className="space-y-6">
                {/* ... (URL and Tag inputs - kept same) ... */}
                <div className="group relative">
                  <Globe
                    size={16}
                    className={`absolute left-5 top-5 ${themeTextClass}`}
                  />
                  <input
                    value={urlPath}
                    onChange={(e) => setUrlPath(e.target.value)}
                    placeholder="URL slug"
                    className={`w-full p-4 pl-12 rounded-xl text-sm font-bold border-2 bg-black/40 border-white/10 ${themeTextClass}`}
                  />
                </div>
                <select
                  value={tag}
                  onChange={(e) => setTag(e.target.value)}
                  className={`w-full p-4 rounded-xl text-sm font-black border-2 bg-black/40 border-white/10 ${themeTextClass}`}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c} className="bg-black text-white">
                      {c}
                    </option>
                  ))}
                </select>

                {/* Main Image */}
                <div className="group relative flex items-center gap-2">
                  <div className="relative flex-grow">
                    <ImageIcon
                      size={16}
                      className={`absolute left-5 top-5 ${themeTextClass}`}
                    />
                    <input
                      value={images.main}
                      onChange={(e) =>
                        setImages({ ...images, main: e.target.value })
                      }
                      placeholder="Hero Image URL (Always Full Width)"
                      className={`w-full p-4 pl-12 rounded-xl text-[10px] font-mono border-2 bg-black/40 border-white/10 ${themeTextClass}`}
                    />
                  </div>
                  <input
                    type="file"
                    ref={fileInputRefs.main}
                    onChange={(e) => handleFileUpload(e, "main")}
                    className="hidden"
                    accept="image/*"
                  />
                  <button
                    onClick={() => fileInputRefs.main.current.click()}
                    className="p-4 rounded-xl border-2 bg-white/5 border-white/10 text-slate-400 hover:text-white"
                  >
                    {uploadingSlot === "main" ? (
                      <Loader2 size={20} className="animate-spin" />
                    ) : (
                      <Upload size={20} />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* --- CONFIGURABLE IMAGES SECTION --- */}
            <div
              className={`p-8 rounded-[2.5rem] border-2 transition-all duration-500 ${isDark ? `bg-black/20 backdrop-blur-md ${themeBorderClass} border-opacity-40 shadow-neon-box-intense` : "bg-white border-slate-200"}`}
            >
              <h3
                className={`font-black uppercase tracking-[0.2em] text-[10px] mb-4 ${isDark ? "text-white/50" : "text-slate-400"}`}
              >
                Configurable Assets
              </h3>
              <div className="space-y-6">
                {["img2", "img3", "img4", "img5"].map((key, index) => (
                  <div
                    key={key}
                    className="flex flex-col gap-2 p-3 rounded-xl border border-white/5 bg-black/20"
                  >
                    {/* Top Row: Input + Upload + Copy */}
                    <div className="flex items-center gap-2">
                      <div className="relative flex-grow">
                        <input
                          value={images[key]}
                          onChange={(e) =>
                            setImages({ ...images, [key]: e.target.value })
                          }
                          placeholder={`Image ${index + 2} URL`}
                          className={`w-full p-2 pr-2 rounded-lg text-[10px] font-mono border-2 bg-black/30 border-white/5 focus:${themeBorderClass} ${themeTextClass}`}
                        />
                      </div>
                      <input
                        type="file"
                        ref={fileInputRefs[key]}
                        onChange={(e) => handleFileUpload(e, key)}
                        className="hidden"
                        accept="image/*"
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
                      {images[key].length > 5 && (
                        <button
                          onClick={() => copyImageTag(key, images[key])}
                          className={`p-2 rounded-lg border ${copiedTag === key ? "bg-emerald-500 text-black border-emerald-500" : "bg-white/10 text-white border-white/20"}`}
                        >
                          {copiedTag === key ? (
                            <Check size={14} />
                          ) : (
                            <Copy size={14} />
                          )}
                        </button>
                      )}
                    </div>

                    {/* Bottom Row: Controls (Size, Align, Display) */}
                    <div className="grid grid-cols-3 gap-2">
                      {/* 1. SIZE */}
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
                            Small (33%)
                          </option>
                          <option value="md" className="bg-black">
                            Medium (50%)
                          </option>
                          <option value="lg" className="bg-black">
                            Large (100%)
                          </option>
                        </select>
                      </div>

                      {/* 2. ALIGN */}
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
                            Left
                          </option>
                          <option value="center" className="bg-black">
                            Center
                          </option>
                          <option value="right" className="bg-black">
                            Right
                          </option>
                        </select>
                      </div>

                      {/* 3. DISPLAY */}
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
                            Block
                          </option>
                          <option value="inline" className="bg-black">
                            Inline
                          </option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Editor Workspace */}
          <div className="lg:col-span-8 space-y-8">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="POST TITLE"
              className={`w-[98%] p-4 text-4xl lg:text-6xl font-black outline-none bg-transparent transition-all tracking-tighter border-b-2 ${isDark ? `${themeBorderClass} focus:neon-text-ultra theme-input` : "text-slate-900 placeholder:text-slate-300 border-slate-200 focus:border-slate-400"}`}
            />
            <div
              className={`relative z-50 p-4 rounded-[2rem] border-2 transition-all duration-500 ${isDark ? `bg-black/40 backdrop-blur-xl ${themeBorderClass} border-opacity-50` : "bg-white border-slate-200 shadow-sm"}`}
            >
              <CustomToolbar />
            </div>
            <div
              className={`relative z-0 rounded-[2.5rem] border-2 transition-all duration-700 overflow-hidden ${isDark ? `bg-black/30 backdrop-blur-xl ${themeBorderClass} border-opacity-40 shadow-neon-box-ultra` : "bg-white border-slate-200 shadow-xl"}`}
            >
              <ReactQuill
                theme="snow"
                value={content}
                onChange={setContent}
                modules={modules}
                className={`h-[500px] border-none px-8 py-8 ${isDark ? "dark-quill" : "light-quill"}`}
              />
            </div>
            <div
              className={`p-4 rounded-xl flex items-center justify-between text-[10px] font-mono uppercase tracking-widest ${isDark ? "bg-white/5 text-slate-400" : "bg-slate-100 text-slate-500"}`}
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
        /* ... (Your existing Editor CSS) ... */
      `}</style>
    </div>
  );
}
