"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { mergeRegister } from "@lexical/utils";
import {
  $getSelection,
  $isRangeSelection,
  FORMAT_TEXT_COMMAND,
  FORMAT_ELEMENT_COMMAND,
  $createParagraphNode,
  KEY_MODIFIER_COMMAND,
  COMMAND_PRIORITY_NORMAL,
} from "lexical";
import { $createHeadingNode, $createQuoteNode } from "@lexical/rich-text";
import { $setBlocksType } from "@lexical/selection";
import {
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
  $isListNode,
} from "@lexical/list";
import { TOGGLE_LINK_COMMAND } from "@lexical/link";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Subscript,
  Superscript,
  Quote,
  Heading2,
  Heading3,
  Heading4,
  Code as CodeIcon,
  Type,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Link as LinkIcon,
  X,
  Pin,
  PinOff,
  MoreHorizontal,
  TypeIcon,
} from "lucide-react";

import VibeExportMenu from "./ExportMenu";

// -----------------------------------------------------------------------------
// VIBE MODAL
// -----------------------------------------------------------------------------
const VibeModal = ({ isOpen, onClose, onConfirm }) => {
  const [value, setValue] = useState("");
  const inputRef = useRef(null);
  useEffect(() => {
    if (isOpen) {
      setValue("");
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-[90%] max-w-[400px] bg-[var(--bg-toolbar)] border rounded-2xl p-6 transition-all duration-300 backdrop-blur-xl"
        style={{
          borderColor: "var(--theme-border)",
          boxShadow: "var(--theme-shadow)",
        }}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold uppercase tracking-widest text-sm theme-text-primary">
            Insert Hyperlink
          </h3>
          <button onClick={onClose} className="theme-text-dim hover:text-white">
            <X size={16} />
          </button>
        </div>
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onConfirm(value)}
          placeholder="https://..."
          className="w-full bg-black/10 border theme-border-dim rounded-lg p-3 theme-text-body outline-none focus:border-[var(--theme-color)] transition-colors mb-6 font-mono text-sm placeholder:opacity-50"
        />
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded text-xs font-bold uppercase theme-text-dim hover:text-white"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(value)}
            className="px-4 py-2 rounded bg-white/10 border text-xs font-bold uppercase hover:bg-white/20 transition-all theme-text-primary"
            style={{ borderColor: "var(--theme-border)" }}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

// -----------------------------------------------------------------------------
// TOOLBAR COMPONENT
// -----------------------------------------------------------------------------
export default function VibeToolbar({ onSqlExport, title }) {
  const [editor] = useLexicalComposerContext();
  const [activeBlock, setActiveBlock] = useState("paragraph");
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [isStrikethrough, setIsStrikethrough] = useState(false);
  const [isSubscript, setIsSubscript] = useState(false);
  const [isSuperscript, setIsSuperscript] = useState(false);
  const [isCode, setIsCode] = useState(false);
  const [isSticky, setIsSticky] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [blockMenuOpen, setBlockMenuOpen] = useState(false);

  // --- KEYBOARD SHORTCUTS LISTENER ---
  useEffect(() => {
    return mergeRegister(
      editor.registerCommand(
        KEY_MODIFIER_COMMAND,
        (event) => {
          const { code, shiftKey, metaKey, ctrlKey } = event;
          const isMac =
            typeof window !== "undefined" &&
            /Mac|iPod|iPhone|iPad/.test(window.navigator.platform);
          const isCtrl = isMac ? metaKey : ctrlKey;

          if (isCtrl) {
            if (code === "KeyK") {
              event.preventDefault();
              setModalOpen(true);
              return true;
            }
            if (shiftKey) {
              if (code === "Digit8") {
                event.preventDefault();
                editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND);
                return true;
              }
              if (code === "Digit7") {
                event.preventDefault();
                editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND);
                return true;
              }
              if (code === "KeyL") {
                event.preventDefault();
                editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "left");
                return true;
              }
              if (code === "KeyE") {
                event.preventDefault();
                editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "center");
                return true;
              }
              if (code === "KeyR") {
                event.preventDefault();
                editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "right");
                return true;
              }
            }
          }
          return false;
        },
        COMMAND_PRIORITY_NORMAL
      )
    );
  }, [editor]);

  const updateToolbar = useCallback(() => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      setIsBold(selection.hasFormat("bold"));
      setIsItalic(selection.hasFormat("italic"));
      setIsUnderline(selection.hasFormat("underline"));
      setIsStrikethrough(selection.hasFormat("strikethrough"));
      setIsSubscript(selection.hasFormat("subscript"));
      setIsSuperscript(selection.hasFormat("superscript"));
      setIsCode(selection.hasFormat("code"));
      const anchorNode = selection.anchor.getNode();
      const element =
        anchorNode.getKey() === "root"
          ? anchorNode
          : anchorNode.getTopLevelElementOrThrow();
      const elementDOM = editor.getElementByKey(element.getKey());
      if (elementDOM !== null) {
        if ($isListNode(element)) {
          const parentList = element.getParent();
          setActiveBlock(
            $isListNode(parentList)
              ? parentList.getTag() === "ul"
                ? "ul"
                : "ol"
              : element.getTag() === "ul"
                ? "ul"
                : "ol"
          );
        } else {
          setActiveBlock(
            element.getType() === "heading"
              ? element.getTag()
              : element.getType()
          );
        }
      }
    }
  }, [editor]);

  useEffect(() => {
    return mergeRegister(
      editor.registerUpdateListener(({ editorState }) => {
        editorState.read(() => updateToolbar());
      })
    );
  }, [editor, updateToolbar]);

  const toggleBlock = (format, headingLevel = null) => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        if (
          (activeBlock === format && !headingLevel) ||
          activeBlock === headingLevel
        ) {
          $setBlocksType(selection, () => $createParagraphNode());
        } else {
          if (format === "heading")
            $setBlocksType(selection, () => $createHeadingNode(headingLevel));
          if (format === "quote")
            $setBlocksType(selection, () => $createQuoteNode());
          if (format === "paragraph")
            $setBlocksType(selection, () => $createParagraphNode());
        }
      }
    });
    setBlockMenuOpen(false);
  };

  const handleModalConfirm = (val) => {
    setModalOpen(false);
    if (!val) return;
    setTimeout(() => {
      editor.focus();
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, val);
    }, 50);
  };

  const btnClass = (isActive) =>
    `p-2 rounded transition-all duration-200 shrink-0 ${isActive ? "bg-[var(--theme-color)] text-black shadow-[0_0_15px_var(--theme-shadow-color)]" : "theme-icon-base hover:bg-[var(--icon-hover-bg)] hover:text-[var(--icon-hover-text)]"}`;

  const formatAlign = (dir) => {
    editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, dir);
    setMoreMenuOpen(false);
  };

  return (
    <>
      <div
        className={`flex items-center justify-between p-3 border-b theme-border-dim bg-[var(--bg-toolbar)] backdrop-blur-md transition-all duration-300 z-50 rounded-t-[1.9rem] ${isSticky ? "sticky top-[60px] md:top-[80px]" : "relative"}`}
      >
        {/* --- LEFT SIDE: SCROLLABLE TOOLS --- */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar max-w-full flex-grow mask-fade-right">
          {/* --- MOBILE: TEXT STYLE DROPDOWN --- */}
          <div className="relative md:hidden shrink-0">
            <button
              onClick={() => setBlockMenuOpen(!blockMenuOpen)}
              className={btnClass(false)}
            >
              {activeBlock.startsWith("h") ? (
                <Heading2 size={18} />
              ) : activeBlock === "quote" ? (
                <Quote size={18} />
              ) : (
                <TypeIcon size={18} />
              )}
            </button>
            {blockMenuOpen && (
              <div className="fixed top-[120px] left-4 mt-2 bg-[#0f172a] border border-white/10 rounded-xl shadow-2xl p-1 flex flex-col gap-1 z-[9999] min-w-[120px]">
                <button
                  onClick={() => toggleBlock("paragraph")}
                  className="text-left px-3 py-2 text-xs text-slate-300 hover:bg-white/10 rounded"
                >
                  Paragraph
                </button>
                <button
                  onClick={() => toggleBlock("heading", "h2")}
                  className="text-left px-3 py-2 text-xs text-slate-300 hover:bg-white/10 rounded font-bold"
                >
                  Heading 2
                </button>
                <button
                  onClick={() => toggleBlock("heading", "h3")}
                  className="text-left px-3 py-2 text-xs text-slate-300 hover:bg-white/10 rounded font-semibold"
                >
                  Heading 3
                </button>
                <button
                  onClick={() => toggleBlock("heading", "h4")}
                  className="text-left px-3 py-2 text-xs text-slate-300 hover:bg-white/10 rounded font-medium"
                >
                  Heading 4
                </button>
                <button
                  onClick={() => toggleBlock("quote")}
                  className="text-left px-3 py-2 text-xs text-slate-300 hover:bg-white/10 rounded italic"
                >
                  Quote
                </button>
              </div>
            )}
            {/* INVISIBLE OVERLAY TO CLOSE MENU */}
            {blockMenuOpen && (
              <div
                className="fixed inset-0 z-[9998]"
                onClick={() => setBlockMenuOpen(false)}
              ></div>
            )}
          </div>

          {/* --- DESKTOP: FULL BLOCK CONTROLS --- */}
          <div className="hidden md:flex items-center gap-1 shrink-0">
            <button
              onMouseDown={(e) => {
                e.preventDefault();
                toggleBlock("paragraph");
              }}
              className={btnClass(activeBlock === "paragraph")}
              title="Normal Text"
            >
              <Type size={18} />
            </button>
            <div className="w-px h-5 bg-white/10 mx-1" />
            <button
              onMouseDown={(e) => {
                e.preventDefault();
                toggleBlock("heading", "h2");
              }}
              className={btnClass(activeBlock === "h2")}
              title="Heading 2"
            >
              <Heading2 size={18} />
            </button>
            <button
              onMouseDown={(e) => {
                e.preventDefault();
                toggleBlock("heading", "h3");
              }}
              className={btnClass(activeBlock === "h3")}
              title="Heading 3"
            >
              <Heading3 size={18} />
            </button>
            <button
              onMouseDown={(e) => {
                e.preventDefault();
                toggleBlock("heading", "h4");
              }}
              className={btnClass(activeBlock === "h4")}
              title="Heading 4"
            >
              <Heading4 size={18} />
            </button>
            <div className="w-px h-5 bg-white/10 mx-1" />
          </div>

          {/* --- COMMON TOOLS (Bold/Italic/Link) --- */}
          <button
            onMouseDown={(e) => {
              e.preventDefault();
              editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold");
            }}
            className={btnClass(isBold)}
            title="Bold"
          >
            <Bold size={18} />
          </button>
          <button
            onMouseDown={(e) => {
              e.preventDefault();
              editor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic");
            }}
            className={btnClass(isItalic)}
            title="Italic"
          >
            <Italic size={18} />
          </button>

          <button
            onMouseDown={(e) => {
              e.preventDefault();
              setModalOpen(true);
            }}
            className={btnClass(false)}
            title="Link"
          >
            <LinkIcon size={18} />
          </button>

          {/* --- DESKTOP: EXTENDED FORMATTING --- */}
          <div className="hidden md:flex items-center gap-1 shrink-0">
            <button
              onMouseDown={(e) => {
                e.preventDefault();
                editor.dispatchCommand(FORMAT_TEXT_COMMAND, "underline");
              }}
              className={btnClass(isUnderline)}
              title="Underline"
            >
              <Underline size={18} />
            </button>
            <button
              onMouseDown={(e) => {
                e.preventDefault();
                editor.dispatchCommand(FORMAT_TEXT_COMMAND, "strikethrough");
              }}
              className={btnClass(isStrikethrough)}
              title="Strikethrough"
            >
              <Strikethrough size={18} />
            </button>
            <div className="w-px h-5 bg-white/10 mx-1" />
            <button
              onMouseDown={(e) => {
                e.preventDefault();
                editor.dispatchCommand(FORMAT_TEXT_COMMAND, "subscript");
              }}
              className={btnClass(isSubscript)}
              title="Subscript"
            >
              <Subscript size={18} />
            </button>
            <button
              onMouseDown={(e) => {
                e.preventDefault();
                editor.dispatchCommand(FORMAT_TEXT_COMMAND, "superscript");
              }}
              className={btnClass(isSuperscript)}
              title="Superscript"
            >
              <Superscript size={18} />
            </button>
            <button
              onMouseDown={(e) => {
                e.preventDefault();
                editor.dispatchCommand(FORMAT_TEXT_COMMAND, "code");
              }}
              className={btnClass(isCode)}
              title="Inline Code"
            >
              <CodeIcon size={18} />
            </button>
            <div className="w-px h-5 bg-white/10 mx-1" />
            <button
              onMouseDown={(e) => {
                e.preventDefault();
                editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND);
              }}
              className={btnClass(activeBlock === "ul")}
              title="Bullet List"
            >
              <List size={18} />
            </button>
            <button
              onMouseDown={(e) => {
                e.preventDefault();
                editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND);
              }}
              className={btnClass(activeBlock === "ol")}
              title="Numbered List"
            >
              <ListOrdered size={18} />
            </button>
            <button
              onMouseDown={(e) => {
                e.preventDefault();
                toggleBlock("quote");
              }}
              className={btnClass(activeBlock === "quote")}
              title="Quote"
            >
              <Quote size={18} />
            </button>
            <div className="w-px h-5 bg-white/10 mx-1" />
            <button
              onMouseDown={(e) => {
                e.preventDefault();
                editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "left");
              }}
              className={btnClass(false)}
              title="Align Left"
            >
              <AlignLeft size={18} />
            </button>
            <button
              onMouseDown={(e) => {
                e.preventDefault();
                editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "center");
              }}
              className={btnClass(false)}
              title="Align Center"
            >
              <AlignCenter size={18} />
            </button>
            <button
              onMouseDown={(e) => {
                e.preventDefault();
                editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "right");
              }}
              className={btnClass(false)}
              title="Align Right"
            >
              <AlignRight size={18} />
            </button>

            <div className="ml-2 pl-2 border-l border-white/10">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  setIsSticky(!isSticky);
                }}
                className={btnClass(isSticky)}
                title={isSticky ? "Unpin Toolbar" : "Pin Toolbar"}
              >
                {isSticky ? <Pin size={18} /> : <PinOff size={18} />}
              </button>
            </div>
          </div>
        </div>

        {/* --- RIGHT SIDE: STATIC TOOLS (Mobile Menu + Export) --- */}
        <div className="flex items-center gap-1 pl-2 ml-1 shrink-0 bg-[var(--bg-toolbar)] z-[60]">
          {/* --- MOBILE: MORE MENU (FIXED: OUTSIDE SCROLL) --- */}
          <div className="relative md:hidden">
            <button
              onClick={() => setMoreMenuOpen(!moreMenuOpen)}
              className={btnClass(moreMenuOpen)}
            >
              <MoreHorizontal size={18} />
            </button>
            {moreMenuOpen && (
              <div className="fixed top-[120px] right-4 mt-2 bg-[#0f172a] border border-white/10 rounded-xl shadow-2xl p-2 grid grid-cols-4 gap-1 z-[9999] w-[200px]">
                <button
                  onClick={() =>
                    editor.dispatchCommand(FORMAT_TEXT_COMMAND, "underline")
                  }
                  className={btnClass(isUnderline)}
                >
                  <Underline size={16} />
                </button>
                <button
                  onClick={() =>
                    editor.dispatchCommand(FORMAT_TEXT_COMMAND, "strikethrough")
                  }
                  className={btnClass(isStrikethrough)}
                >
                  <Strikethrough size={16} />
                </button>
                <button
                  onClick={() =>
                    editor.dispatchCommand(FORMAT_TEXT_COMMAND, "code")
                  }
                  className={btnClass(isCode)}
                >
                  <CodeIcon size={16} />
                </button>
                <button
                  onClick={() => toggleBlock("quote")}
                  className={btnClass(activeBlock === "quote")}
                >
                  <Quote size={16} />
                </button>
                <div className="col-span-4 h-px bg-white/10 my-1" />
                <button
                  onClick={() =>
                    editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND)
                  }
                  className={btnClass(activeBlock === "ul")}
                >
                  <List size={16} />
                </button>
                <button
                  onClick={() =>
                    editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND)
                  }
                  className={btnClass(activeBlock === "ol")}
                >
                  <ListOrdered size={16} />
                </button>
                <div className="col-span-2"></div>
                <div className="col-span-4 h-px bg-white/10 my-1" />
                <button
                  onClick={() => formatAlign("left")}
                  className={btnClass(false)}
                >
                  <AlignLeft size={16} />
                </button>
                <button
                  onClick={() => formatAlign("center")}
                  className={btnClass(false)}
                >
                  <AlignCenter size={16} />
                </button>
                <button
                  onClick={() => formatAlign("right")}
                  className={btnClass(false)}
                >
                  <AlignRight size={16} />
                </button>
                <button
                  onClick={() => setIsSticky(!isSticky)}
                  className={btnClass(isSticky)}
                >
                  {isSticky ? <Pin size={16} /> : <PinOff size={16} />}
                </button>
              </div>
            )}
            {/* INVISIBLE OVERLAY TO CLOSE MENU */}
            {moreMenuOpen && (
              <div
                className="fixed inset-0 z-[9998]"
                onClick={() => setMoreMenuOpen(false)}
              ></div>
            )}
          </div>

          {/* --- EXPORT (ALWAYS VISIBLE) --- */}
          <VibeExportMenu onSqlExport={onSqlExport} title={title} />
        </div>
      </div>

      <VibeModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onConfirm={handleModalConfirm}
      />
    </>
  );
}
