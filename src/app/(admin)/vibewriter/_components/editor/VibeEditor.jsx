"use client";

import React, {
  useEffect,
  useState,
  forwardRef,
  useImperativeHandle,
  useRef,
} from "react";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import { MarkdownShortcutPlugin } from "@lexical/react/LexicalMarkdownShortcutPlugin";
import { TRANSFORMERS } from "@lexical/markdown";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { ListNode, ListItemNode } from "@lexical/list";
import { CodeNode } from "@lexical/code";
import { LinkNode } from "@lexical/link";
import { $generateHtmlFromNodes } from "@lexical/html";
import { Clock, Type as TypeIcon } from "lucide-react";

// --- IMPORTS FROM SPLIT FILES ---
import VibeToolbar from "./Toolbar";
import { LoadHtmlPlugin, EditorStatsPlugin } from "./Plugins";

// -----------------------------------------------------------------------------
// THEME CONFIGURATION
// -----------------------------------------------------------------------------
const vibeTheme = {
  paragraph: "mb-4 text-lg leading-relaxed font-light theme-text-body",
  heading: {
    h1: "text-4xl md:text-5xl font-black mt-12 mb-6 tracking-tighter border-b theme-border-dim pb-4 theme-text-heading",
    h2: "text-2xl md:text-3xl font-bold mt-10 mb-4 tracking-widest theme-text-primary",
    h3: "text-xl md:text-2xl font-bold mt-8 mb-3 tracking-wide theme-text-secondary",
    h4: "text-lg md:text-xl font-bold mt-6 mb-2 theme-text-dim",
  },
  text: {
    bold: "font-bold",
    italic: "italic",
    underline: "underline decoration-2 underline-offset-4 theme-decoration",
    strikethrough: "line-through decoration-slate-500 opacity-70",
    subscript: "align-sub text-xs theme-text-dim",
    superscript: "align-super text-xs theme-text-dim",
    code: "bg-black/10 border theme-border-dim theme-text-primary font-mono px-1 rounded text-sm",
  },
  list: {
    ul: "list-disc list-inside mb-6 space-y-2 theme-text-body",
    ol: "list-decimal list-inside mb-6 space-y-2 theme-text-body",
  },
  quote:
    "border-l-4 pl-6 py-2 my-8 italic bg-white/5 rounded-r-lg theme-border-left theme-text-dim",
  code: "block bg-black/80 border theme-border-dim p-4 rounded-lg font-mono text-sm theme-text-primary overflow-x-auto my-6 shadow-inner",
  link: "underline decoration-2 underline-offset-2 cursor-pointer theme-text-primary theme-decoration",
};

// -----------------------------------------------------------------------------
// MAIN COMPONENT
// -----------------------------------------------------------------------------
const VibeEditor = forwardRef(
  (
    {
      onChange = () => {},
      initialContent = null,
      theme = "teal",
      bgOpacity = 80,
      onSqlExport,
      title,
    },
    ref
  ) => {
    const [stats, setStats] = useState({ words: 0, minutes: 0 });

    const initialConfig = {
      namespace: "VibeWriter",
      theme: vibeTheme,
      onError: (e) => console.error("Lexical Error:", e),
      nodes: [
        HeadingNode,
        QuoteNode,
        ListNode,
        ListItemNode,
        CodeNode,
        LinkNode,
      ],
      editorState: null,
    };

    const onChangeRef = useRef(onChange);
    useEffect(() => {
      onChangeRef.current = onChange;
    }, [onChange]);

    // --- UPDATED HTML OUTPUT PLUGIN (SAFE MODE) ---
    // NO STRIPPING OF STYLES. SAVES EXACTLY WHAT IS IN THE EDITOR.
    const HtmlOutputPlugin = () => {
      const [editor] = useLexicalComposerContext();
      useEffect(() => {
        return editor.registerUpdateListener(({ editorState }) => {
          editorState.read(() => {
            let htmlString = $generateHtmlFromNodes(editor, null);

            // 1. Remove all class attributes
            htmlString = htmlString.replace(/ class="[^"]*"/g, "");

            // 2. Remove all style attributes (fixes the white-space: pre-wrap issue)
            htmlString = htmlString.replace(/ style="[^"]*"/g, "");

            // 3. Clean up empty spans that Lexical sometimes leaves behind
            htmlString = htmlString.replace(/<span>(.*?)<\/span>/g, "$1");

            // 4. (Optional) Fix empty paragraphs if needed
            // htmlString = htmlString.replace(/<p><br><\/p>/g, "");

            if (onChangeRef.current) {
              onChangeRef.current(htmlString);
            }
          });
        });
      }, [editor]);
      return null;
    };

    const EditorRefPlugin = () => {
      useImperativeHandle(ref, () => ({}));
      return null;
    };

    const getThemeVars = () => {
      const isLight = theme === "light";
      const isYellow = theme === "yellow";
      return {
        "--theme-color": isLight ? "#2563eb" : isYellow ? "#facc15" : "#2dd4bf",
        "--theme-border": isLight
          ? "#cbd5e1"
          : isYellow
            ? "#eab308"
            : "#14b8a6",
        "--theme-shadow-color": isLight
          ? "rgba(37, 99, 235, 0.3)"
          : isYellow
            ? "rgba(250, 204, 21, 0.5)"
            : "rgba(45, 212, 191, 0.5)",
        "--theme-shadow": isLight
          ? "0 10px 15px -3px rgba(0, 0, 0, 0.1)"
          : "0 0 30px -10px rgba(var(--theme-color-rgb), 0.3)",
        "--text-body": isLight ? "#0f172a" : "#cbd5e1",
        "--text-heading": isLight ? "#0f172a" : "#ffffff",
        "--text-placeholder": isLight ? "#94a3b8" : "#475569",
        "--bg-toolbar": isLight
          ? "rgba(255, 255, 255, 0.8)"
          : "rgba(0, 0, 0, 0.4)",
        "--border-dim": isLight
          ? "1px solid #e2e8f0"
          : "1px solid rgba(255, 255, 255, 0.1)",
        "--icon-base": isLight ? "#64748b" : "#94a3b8",
        "--icon-hover-bg": isLight
          ? "rgba(0, 0, 0, 0.05)"
          : "rgba(255, 255, 255, 0.1)",
        "--icon-hover-text": isLight ? "#0f172a" : "#ffffff",
      };
    };

    return (
      <div
        className="flex flex-col flex-grow relative rounded-[2rem] border border-teal-500/20 shadow-[0_0_50px_-20px_rgba(20,184,166,0.2)] transition-all duration-500 vibe-editor-wrapper"
        style={{
          // --- UPDATED BACKGROUND LOGIC ---
          backgroundColor:
            theme === "light"
              ? "rgba(255, 255, 255, 0.95)"
              : `rgba(5, 10, 16, ${bgOpacity / 100})`,
          backdropFilter: `blur(${bgOpacity * 0.2}px)`,
          borderColor: "var(--theme-border)",
          boxShadow: "var(--theme-shadow)",
          overflow: "visible",
          ...getThemeVars(),
        }}
      >
        <LexicalComposer initialConfig={initialConfig}>
          <VibeToolbar onSqlExport={onSqlExport} title={title} />
          <LoadHtmlPlugin initialContent={initialContent} />
          <EditorRefPlugin />
          <HtmlOutputPlugin />
          <EditorStatsPlugin onChange={setStats} />
          <ListPlugin />
          <LinkPlugin />
          <HistoryPlugin />
          <MarkdownShortcutPlugin transformers={TRANSFORMERS} />

          {/* --- EDITOR CONTENT AREA --- */}
          <div className="relative p-8 md:p-12 flex-grow min-h-[50vh]">
            <RichTextPlugin
              contentEditable={
                <ContentEditable className="outline-none min-h-[40vh] theme-text-body relative z-10" />
              }
              placeholder={
                <div
                  className="absolute top-8 md:top-12 left-8 md:left-12 text-lg font-light italic z-0"
                  style={{ color: "var(--text-placeholder)" }}
                >
                  The canvas is yours...
                </div>
              }
              ErrorBoundary={({ error }) => (
                <div className="p-4 border border-red-500 bg-red-900/50 text-white rounded font-mono text-xs">
                  <strong>CRASH REPORT:</strong>
                  <br />
                  {error ? error.message : "Unknown Error"}
                </div>
              )}
            />
          </div>

          {/* --- FOOTER: STATS --- */}
          <div className="flex items-center justify-between px-6 py-3 border-t theme-border-dim rounded-b-[1.9rem] bg-[var(--bg-toolbar)] text-xs font-bold uppercase tracking-widest theme-text-dim">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5" title="Word Count">
                <TypeIcon size={12} className="opacity-70" />
                <span>{stats.words.toLocaleString()} words</span>
              </div>
              <div className="w-px h-3 bg-white/10" />
              <div
                className="flex items-center gap-1.5"
                title="Blogcast Reading Time (9,500 words/hr)"
              >
                <Clock size={12} className="opacity-70" />
                <span>~{stats.minutes} min cast</span>
              </div>
            </div>
            <div className="opacity-50 hidden sm:block">VibeWriter 2.0</div>
          </div>
        </LexicalComposer>
        <style jsx global>{`
          .vibe-editor-wrapper .theme-text-body {
            color: var(--text-body) !important;
          }
          .vibe-editor-wrapper .theme-text-heading {
            color: var(--text-heading) !important;
          }
          .vibe-editor-wrapper .theme-text-primary {
            color: var(--theme-color) !important;
          }
          .vibe-editor-wrapper .theme-text-secondary {
            color: var(--theme-border) !important;
          }
          .vibe-editor-wrapper .theme-text-dim {
            color: var(--theme-border) !important;
            opacity: 0.7;
          }
          .vibe-editor-wrapper .theme-border-dim {
            border: var(--border-dim) !important;
          }
          .vibe-editor-wrapper .theme-border-left {
            border-left-color: var(--theme-border) !important;
          }
          .vibe-editor-wrapper .theme-decoration {
            text-decoration-color: var(--theme-border) !important;
          }
          .vibe-editor-wrapper .theme-icon-base {
            color: var(--icon-base) !important;
          }
          .vibe-editor-wrapper input[type="range"] {
            accent-color: var(--theme-color);
          }
          .vibe-editor-wrapper ul {
            list-style-type: disc;
            padding-left: 1.5em;
          }
          .vibe-editor-wrapper ol {
            list-style-type: decimal;
            padding-left: 1.5em;
          }
          .no-scrollbar::-webkit-scrollbar {
            display: none;
          }
          .no-scrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
        `}</style>
      </div>
    );
  }
);

VibeEditor.displayName = "VibeEditor";
export default VibeEditor;
