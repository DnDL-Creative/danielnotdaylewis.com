"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Copy,
  Check,
  Database,
  Lock,
  Key,
  Terminal,
  Image as ImageIcon,
  Tag,
  Calendar,
  ChevronRight,
  Sparkles,
  Unlock,
  AlertCircle,
  ArrowLeft,
  Layout,
  Type,
  Bold,
  Italic,
  List,
  Quote,
  Languages,
} from "lucide-react";

const SECRET_CODE = "1425";

export default function WritePage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const isLogged = sessionStorage.getItem("admin_logged_in");
    if (isLogged === "true") setIsAuthenticated(true);
  }, []);

  const handleLogin = (password) => {
    if (password === SECRET_CODE) {
      sessionStorage.setItem("admin_logged_in", "true");
      setIsAuthenticated(true);
      return true;
    }
    return false;
  };

  if (!isClient) return null;

  return (
    <div className="min-h-screen bg-slate-50 relative overflow-x-hidden font-sans text-slate-900 selection:bg-teal-200 selection:text-teal-900">
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-0">
        <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-teal-400/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-indigo-400/20 rounded-full blur-[120px]" />
      </div>
      <div className="relative z-10 pt-24 pb-20 px-4 md:px-8 max-w-7xl mx-auto">
        {!isAuthenticated ? (
          <LoginGate onLogin={handleLogin} />
        ) : (
          <StudioContent />
        )}
      </div>
    </div>
  );
}

function LoginGate({ onLogin }) {
  const [input, setInput] = useState("");
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onLogin(input)) return;
    setError(true);
    setShake(true);
    setInput("");
    setTimeout(() => setShake(false), 500);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] w-full">
      <div
        className={`w-full max-w-sm bg-white/80 backdrop-blur-2xl border border-white/60 rounded-3xl p-12 shadow-xl ${
          shake ? "translate-x-[-10px]" : ""
        }`}
      >
        <div className="flex flex-col items-center text-center space-y-6">
          <div
            className={`w-20 h-20 rounded-2xl flex items-center justify-center ${
              error ? "bg-red-50 text-red-500" : "bg-teal-50 text-teal-600"
            }`}
          >
            {error ? <AlertCircle size={40} /> : <Lock size={40} />}
          </div>
          <h1 className="text-2xl font-black uppercase tracking-tight text-slate-800">
            Restricted Area
          </h1>
          <form onSubmit={handleSubmit} className="w-full space-y-4">
            <input
              type="password"
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                setError(false);
              }}
              placeholder="Passcode"
              className="w-full bg-slate-50 border-2 rounded-xl py-4 px-6 text-center font-bold tracking-widest outline-none focus:border-teal-500"
              autoFocus
            />
            <button
              type="submit"
              className="w-full py-4 bg-slate-900 text-white font-black uppercase rounded-xl hover:bg-teal-600 transition-all"
            >
              Unlock Studio
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function StudioContent() {
  const editorRef = useRef(null);
  const [copied, setCopied] = useState(false);
  const [spellCheckEnabled, setSpellCheckEnabled] = useState(true);
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    date: new Date().toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    }),
    tag: "Life",
    image: "/images/blog-placeholder.webp",
    image_caption: "",
    content: "",
  });

  // FIX: Capture innerHTML safely BEFORE state update
  const handleEditorInput = (e) => {
    const html = e.currentTarget.innerHTML;
    setFormData((prev) => ({ ...prev, content: html }));
  };

  const execCommand = (command, value = null) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      setFormData((prev) => ({
        ...prev,
        content: editorRef.current.innerHTML,
      }));
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "title") {
      setFormData((prev) => ({
        ...prev,
        title: value,
        slug: value
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, ""),
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const generateSQL = () => {
    const safeTitle = formData.title.replace(/'/g, "''");
    const safeCaption = formData.image_caption.replace(/'/g, "''");
    const safeContent = formData.content.replace(/'/g, "''");

    return `INSERT INTO public.posts (slug, title, date, tag, image, image_caption, content)
VALUES (
  '${formData.slug}', '${safeTitle}', '${formData.date}', '${formData.tag}',
  '${formData.image}', '${safeCaption}', 
  $$<div class="content-flow">${safeContent}</div>$$
);`;
  };

  return (
    <>
      <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6 border-b pb-6">
        <div className="space-y-2">
          <h2 className="text-5xl font-black text-slate-900 tracking-tighter uppercase">
            The Studio
          </h2>
          <div className="flex items-center gap-2 text-slate-500 font-bold text-xs uppercase tracking-widest">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span>Database Connection Active</span>
          </div>
        </div>
        <div className="flex gap-3">
          <Link
            href="/blog"
            target="_blank"
            className="px-4 py-3 rounded-lg border font-bold text-xs uppercase tracking-wider bg-white/50 hover:bg-white transition-all"
          >
            <Layout size={16} className="inline mr-2" /> View Blog
          </Link>
          <a
            href="https://supabase.com/dashboard"
            target="_blank"
            className="bg-teal-100 text-teal-700 px-4 py-3 rounded-lg font-bold text-xs uppercase"
          >
            Supabase <ChevronRight size={16} className="inline" />
          </a>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
        <div className="space-y-8">
          <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100 space-y-6">
            <h3 className="font-black text-slate-400 text-[10px] uppercase tracking-widest border-b border-slate-50 pb-2">
              <Sparkles size={14} className="inline text-teal-500 mr-1" /> Meta
              Data
            </h3>
            <input
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Blog Title..."
              className="w-full text-2xl font-bold border-b-2 outline-none focus:border-teal-500 py-2 transition-all"
            />
            <div className="grid grid-cols-2 gap-4">
              <select
                name="tag"
                value={formData.tag}
                onChange={handleChange}
                className="bg-slate-50 border p-3 rounded-xl font-bold text-sm outline-none focus:border-teal-500"
              >
                <option>Life</option>
                <option>Acting</option>
                <option>Travel & Language</option>
                <option>Tech</option>
              </select>
              <input
                name="date"
                value={formData.date}
                onChange={handleChange}
                className="bg-slate-50 border p-3 rounded-xl font-bold text-sm outline-none focus:border-teal-500"
              />
            </div>
            <input
              name="image"
              value={formData.image}
              onChange={handleChange}
              className="w-full bg-slate-50 border p-3 rounded-xl font-mono text-xs outline-none focus:border-teal-500"
            />
            <input
              name="image_caption"
              value={formData.image_caption}
              onChange={handleChange}
              placeholder="Image Caption..."
              className="w-full bg-slate-50 border p-3 rounded-xl font-medium text-sm outline-none focus:border-teal-500"
            />
          </div>

          <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden flex flex-col min-h-[600px]">
            <div className="bg-slate-50 border-b p-3 flex flex-wrap items-center gap-1">
              <select
                onChange={(e) => execCommand("formatBlock", e.target.value)}
                className="bg-white border rounded-lg text-[10px] font-black uppercase px-2 py-1.5 outline-none cursor-pointer"
              >
                <option value="p">Normal</option>
                <option value="h1">Heading 1</option>
                <option value="h2">Heading 2</option>
                <option value="h3">Heading 3</option>
              </select>
              <ToolbarButton
                icon={<Bold size={14} />}
                onClick={() => execCommand("bold")}
              />
              <ToolbarButton
                icon={<Italic size={14} />}
                onClick={() => execCommand("italic")}
              />
              <ToolbarButton
                icon={<List size={14} />}
                onClick={() => execCommand("insertUnorderedList")}
              />
              <ToolbarButton
                icon={<Quote size={14} />}
                onClick={() => execCommand("formatBlock", "blockquote")}
              />
              <div className="flex-grow" />
              <button
                onClick={() => setSpellCheckEnabled(!spellCheckEnabled)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider border transition-all ${
                  spellCheckEnabled
                    ? "bg-teal-50 border-teal-200 text-teal-600 shadow-sm"
                    : "bg-white text-slate-400"
                }`}
              >
                <Languages size={14} />{" "}
                {spellCheckEnabled ? "Spell Check On" : "Spell Check Off"}
              </button>
            </div>
            <div className="p-8 md:p-12 flex-grow overflow-y-auto">
              <div
                ref={editorRef}
                contentEditable
                suppressContentEditableWarning={true}
                spellCheck={spellCheckEnabled}
                onInput={handleEditorInput}
                className="editor-canvas w-full h-full outline-none text-slate-800 text-lg leading-relaxed font-serif"
                data-placeholder="Start your story..."
              />
            </div>
          </div>
        </div>

        <div className="lg:sticky lg:top-32 h-fit space-y-6">
          <div className="bg-[#1e1e1e] rounded-3xl overflow-hidden shadow-2xl border border-slate-800">
            <div className="bg-[#2d2d2d] px-4 py-3 flex items-center justify-between border-b border-white/5">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
                <div className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
              </div>
              <div className="text-[10px] font-mono text-slate-400 font-bold tracking-widest uppercase flex items-center gap-2">
                <Terminal size={12} /> SQL_GEN.exe
              </div>
            </div>
            <div className="p-6">
              <pre className="font-mono text-[11px] md:text-xs leading-relaxed text-teal-300 overflow-x-auto whitespace-pre-wrap max-h-[50vh] overflow-y-auto">
                <code>{generateSQL()}</code>
              </pre>
            </div>
            <div className="p-4 bg-[#252525] border-t border-white/5">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(generateSQL());
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className={`w-full py-4 rounded-xl font-black uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-2 ${
                  copied
                    ? "bg-green-500 text-white shadow-lg shadow-green-500/20"
                    : "bg-white text-black hover:bg-teal-400"
                }`}
              >
                {copied ? (
                  <>
                    <Check size={18} /> Copied to Clipboard
                  </>
                ) : (
                  <>
                    <Database size={18} /> Copy SQL Command
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .editor-canvas:empty:before {
          content: attr(data-placeholder);
          color: #cbd5e1;
          font-style: italic;
        }
        .editor-canvas h1 {
          font-size: 2.5rem;
          font-weight: 900;
          line-height: 1.2;
          margin-bottom: 1.5rem;
          color: #0f172a;
          text-transform: uppercase;
        }
        .editor-canvas h2 {
          font-size: 1.8rem;
          font-weight: 800;
          margin-top: 2rem;
          margin-bottom: 1rem;
          color: #1e293b;
        }
        .editor-canvas h3 {
          font-size: 1.4rem;
          font-weight: 700;
          margin-top: 1.5rem;
          color: #334155;
        }
        .editor-canvas blockquote {
          border-left: 4px solid #2dd4bf;
          padding-left: 1.5rem;
          font-style: italic;
          color: #475569;
          margin: 2rem 0;
        }
        .editor-canvas ul {
          list-style-type: disc;
          padding-left: 2rem;
          margin-bottom: 1.25rem;
        }
      `}</style>
    </>
  );
}

function ToolbarButton({ icon, onClick, title }) {
  return (
    <button
      onMouseDown={(e) => {
        e.preventDefault();
        onClick();
      }}
      className="p-2 text-slate-500 hover:text-teal-600 hover:bg-white hover:shadow-sm rounded-lg transition-all"
      title={title}
    >
      {icon}
    </button>
  );
}
