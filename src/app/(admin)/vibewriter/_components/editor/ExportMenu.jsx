"use client";

import React, { useState } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $generateHtmlFromNodes } from "@lexical/html";
import {
  Download,
  FileText,
  File,
  ChevronDown,
  Loader2,
  Database,
} from "lucide-react";

// --- EXPORT DEPENDENCIES ---
import {
  pdf,
  Document,
  Page,
  Text as PdfText,
  View as PdfView,
  StyleSheet,
} from "@react-pdf/renderer";
import {
  Document as DocxDocument,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
} from "docx";
import { saveAs } from "file-saver";

// -----------------------------------------------------------------------------
// RICH TEXT PARSING LOGIC & EXPORT MENU
// -----------------------------------------------------------------------------
const parseHtmlToRichSegments = (html) => {
  if (typeof window === "undefined") return [];
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const blocks = [];

  const parseInline = (node, style = {}) => {
    if (node.nodeType === 3) return [{ text: node.textContent, ...style }];
    if (node.nodeType === 1) {
      const newStyle = { ...style };
      const tag = node.tagName.toLowerCase();
      if (tag === "strong" || tag === "b") newStyle.bold = true;
      if (tag === "em" || tag === "i") newStyle.italic = true;
      if (tag === "u") newStyle.underline = true;
      if (tag === "s" || tag === "strike" || tag === "del")
        newStyle.strike = true;
      if (tag === "sup") newStyle.superScript = true;
      if (tag === "sub") newStyle.subScript = true;
      if (tag === "code") newStyle.code = true;
      let runs = [];
      node.childNodes.forEach((child) => {
        runs = runs.concat(parseInline(child, newStyle));
      });
      return runs;
    }
    return [];
  };

  const getAlignment = (node) => {
    const align = node.style.textAlign;
    if (align === "center") return "center";
    if (align === "right") return "right";
    if (align === "justify") return "justify";
    return "left";
  };

  Array.from(doc.body.children).forEach((node) => {
    const tag = node.tagName.toLowerCase();
    const align = getAlignment(node);
    if (["p", "h1", "h2", "h3", "h4", "blockquote"].includes(tag)) {
      blocks.push({ type: tag, align: align, children: parseInline(node) });
    } else if (tag === "ul" || tag === "ol") {
      Array.from(node.children).forEach((li) => {
        if (li.tagName.toLowerCase() === "li") {
          blocks.push({
            type: "li",
            listType: tag,
            align: getAlignment(li) || align,
            children: parseInline(li),
          });
        }
      });
    }
  });
  return blocks;
};

// ... PDF Styles ...
const pdfStyles = StyleSheet.create({
  page: { padding: 40, fontFamily: "Helvetica" },
  title: {
    fontSize: 24,
    marginBottom: 10,
    fontWeight: "bold",
    color: "#14b8a6",
  },
  block: { marginBottom: 6, lineHeight: 1.5 },
  h1: { fontSize: 18, marginTop: 12, marginBottom: 4, fontWeight: "bold" },
  h2: {
    fontSize: 16,
    marginTop: 10,
    marginBottom: 4,
    fontWeight: "bold",
    color: "#444",
  },
  h3: {
    fontSize: 14,
    marginTop: 8,
    marginBottom: 4,
    fontWeight: "bold",
    color: "#666",
  },
  h4: { fontSize: 12, marginTop: 6, marginBottom: 4, fontWeight: "bold" },
  body: { fontSize: 11, color: "#222" },
  blockquote: {
    fontSize: 11,
    fontStyle: "italic",
    color: "#555",
    borderLeft: "2px solid #ccc",
    paddingLeft: 10,
    marginVertical: 5,
  },
  li: { fontSize: 11, marginBottom: 2, flexDirection: "row" },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    fontSize: 8,
    textAlign: "center",
    color: "#aaa",
  },
});

const PdfTemplate = ({ blocks, title }) => (
  <Document>
    <Page size="A4" style={pdfStyles.page}>
      <PdfText style={pdfStyles.title}>{title || "Untitled Draft"}</PdfText>
      {blocks.map((block, i) => {
        const renderRuns = (runs) =>
          runs.map((run, rI) => (
            <PdfText
              key={rI}
              style={{
                fontFamily: run.bold
                  ? "Helvetica-Bold"
                  : run.italic
                    ? "Helvetica-Oblique"
                    : "Helvetica",
                textDecoration: run.underline
                  ? "underline"
                  : run.strike
                    ? "line-through"
                    : "none",
                fontSize: run.subScript || run.superScript ? 8 : undefined,
                verticalAlign: run.superScript
                  ? "super"
                  : run.subScript
                    ? "sub"
                    : "baseline",
                backgroundColor: run.code ? "#eee" : undefined,
              }}
            >
              {run.text}
            </PdfText>
          ));
        const alignStyle = { textAlign: block.align };
        if (block.type === "li") {
          return (
            <PdfView key={i} style={[pdfStyles.li, alignStyle]}>
              <PdfText style={{ width: 15 }}>
                {block.listType === "ol" ? `${i + 1}.` : "•"}
              </PdfText>
              <PdfText style={{ flex: 1 }}>
                {renderRuns(block.children)}
              </PdfText>
            </PdfView>
          );
        }
        return (
          <PdfText
            key={i}
            style={[pdfStyles.block, pdfStyles.body, alignStyle]}
          >
            {renderRuns(block.children)}
          </PdfText>
        );
      })}
      <PdfText style={pdfStyles.footer}>Generated with VibeWriter</PdfText>
    </Page>
  </Document>
);

export default function VibeExportMenu({ onSqlExport, title }) {
  const [editor] = useLexicalComposerContext();
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const getRichContent = () => {
    let htmlString = "";
    editor.update(() => {
      htmlString = $generateHtmlFromNodes(editor, null);
    });
    return parseHtmlToRichSegments(htmlString);
  };

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      const blocks = getRichContent();
      const blob = await pdf(
        <PdfTemplate blocks={blocks} title={title} />
      ).toBlob();
      saveAs(blob, `${title || "vibe-draft"}.pdf`);
    } catch (e) {
      console.error("PDF Error", e);
    }
    setIsExporting(false);
    setIsOpen(false);
  };

  const handleExportDOCX = async () => {
    setIsExporting(true);
    try {
      const blocks = getRichContent();
      const docChildren = blocks.map((block) => {
        const runs = block.children.map(
          (child) =>
            new TextRun({
              text: child.text,
              bold: child.bold,
              italics: child.italic,
              underline: child.underline ? {} : undefined,
              strike: child.strike,
              superScript: child.superScript,
              subScript: child.subScript,
              font: child.code ? "Courier New" : undefined,
              size: 24,
            })
        );
        let alignment = AlignmentType.LEFT;
        if (block.align === "center") alignment = AlignmentType.CENTER;
        if (block.align === "right") alignment = AlignmentType.RIGHT;
        if (block.align === "justify") alignment = AlignmentType.JUSTIFIED;
        const paragraphConfig = {
          children: runs,
          alignment: alignment,
          spacing: { after: 120 },
        };
        switch (block.type) {
          case "h1":
            return new Paragraph({
              ...paragraphConfig,
              heading: HeadingLevel.HEADING_1,
            });
          case "h2":
            return new Paragraph({
              ...paragraphConfig,
              heading: HeadingLevel.HEADING_2,
            });
          case "h3":
            return new Paragraph({
              ...paragraphConfig,
              heading: HeadingLevel.HEADING_3,
            });
          case "h4":
            return new Paragraph({
              ...paragraphConfig,
              heading: HeadingLevel.HEADING_4,
            });
          case "li":
            return new Paragraph({ ...paragraphConfig, bullet: { level: 0 } });
          case "blockquote":
            return new Paragraph({
              ...paragraphConfig,
              indent: { left: 720 },
              style: "Quote",
            });
          default:
            return new Paragraph(paragraphConfig);
        }
      });
      const doc = new DocxDocument({
        sections: [
          {
            properties: {},
            children: [
              new Paragraph({
                text: title || "Untitled Transmission",
                heading: HeadingLevel.TITLE,
              }),
              ...docChildren,
            ],
          },
        ],
      });
      const blob = await Packer.toBlob(doc);
      saveAs(blob, `${title || "vibe-draft"}.docx`);
    } catch (e) {
      console.error("DOCX Error", e);
    }
    setIsExporting(false);
    setIsOpen(false);
  };

  const handleSqlClick = () => {
    setIsOpen(false);
    if (onSqlExport) onSqlExport();
  };

  return (
    <div className="relative inline-block border-l border-white/10 pl-2">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isExporting}
        className="flex items-center gap-2 px-3 py-2 md:py-1.5 rounded bg-teal-500/10 border border-teal-500/30 text-teal-400 hover:bg-teal-500/20 hover:text-teal-300 transition-all text-xs font-bold uppercase tracking-wider"
      >
        {isExporting ? (
          <Loader2 size={14} className="animate-spin" />
        ) : (
          <Download size={14} />
        )}
        <span className="hidden sm:inline">Export</span>
        <ChevronDown
          size={12}
          className={`transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>
      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-48 bg-[#0f172a] border border-white/10 rounded-xl shadow-2xl z-[60] overflow-hidden animate-in fade-in zoom-in-95">
          <div className="px-3 py-2 text-[10px] font-bold uppercase text-slate-500 tracking-widest border-b border-white/5">
            Download As...
          </div>
          <button
            onClick={handleExportPDF}
            className="w-full text-left px-4 py-3 hover:bg-white/5 flex items-center gap-3 transition-colors border-b border-white/5 group"
          >
            <div className="p-2 bg-red-500/10 text-red-400 rounded-lg group-hover:bg-red-500/20 transition-colors">
              <File size={16} />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-200">PDF</div>
              <div className="text-[10px] text-slate-500">Rich Formatting</div>
            </div>
          </button>
          <button
            onClick={handleExportDOCX}
            className="w-full text-left px-4 py-3 hover:bg-white/5 flex items-center gap-3 transition-colors border-b border-white/5 group"
          >
            <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg group-hover:bg-blue-500/20 transition-colors">
              <FileText size={16} />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-200">Word Doc</div>
              <div className="text-[10px] text-slate-500">Full Edit Mode</div>
            </div>
          </button>
          <button
            onClick={handleSqlClick}
            className="w-full text-left px-4 py-3 hover:bg-white/5 flex items-center gap-3 transition-colors group"
          >
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg group-hover:bg-emerald-500/20 transition-colors">
              <Database size={16} />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-200">SQL Insert</div>
              <div className="text-[10px] text-slate-500">Database Query</div>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}
