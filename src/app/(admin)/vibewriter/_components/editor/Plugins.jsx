"use client";

import { useEffect, useState } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $generateNodesFromDOM } from "@lexical/html";
import { $getRoot, $insertNodes } from "lexical";

// -----------------------------------------------------------------------------
// LOAD HTML PLUGIN
// -----------------------------------------------------------------------------
export const LoadHtmlPlugin = ({ initialContent }) => {
  const [editor] = useLexicalComposerContext();
  const [isLoaded, setIsLoaded] = useState(false);
  useEffect(() => {
    if (!initialContent || isLoaded) return;
    editor.update(() => {
      const parser = new DOMParser();
      const dom = parser.parseFromString(initialContent, "text/html");
      const nodes = $generateNodesFromDOM(editor, dom);
      const root = $getRoot();
      root.clear();
      $insertNodes(nodes);
    });
    setIsLoaded(true);
  }, [editor, initialContent, isLoaded]);
  return null;
};

// -----------------------------------------------------------------------------
// WORD COUNT & STATS PLUGIN
// -----------------------------------------------------------------------------
export const EditorStatsPlugin = ({ onChange }) => {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const root = $getRoot();
        const textContent = root.getTextContent();
        // Simple word count regex
        const words = textContent
          .trim()
          .split(/\s+/)
          .filter((w) => w !== "").length;

        // Blogcast Rule: 9,500 words per hour
        // 9500 words / 60 mins = ~158.33 words per minute
        const wordsPerMinute = 9500 / 60;
        const minutes = Math.ceil(words / wordsPerMinute);

        onChange({ words, minutes });
      });
    });
  }, [editor, onChange]);
  return null;
};
