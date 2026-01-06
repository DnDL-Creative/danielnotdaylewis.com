"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/src/utils/supabase/client";
import {
  Keyboard,
  Sliders,
  StickyNote,
  Save,
  Loader2,
  RefreshCw,
  Zap,
  Plus,
  Trash2,
  Command,
  ArrowUp,
  ArrowDown,
  ArrowDownAZ,
  GripVertical,
} from "lucide-react";

const supabase = createClient();

// Default Chain Data (Matched to your specs)
const DEFAULT_CHAIN = [
  { tool: "Master Chain EQ", settings: "-100hz rumble" },
  {
    tool: "De-ess",
    settings: "classic, thresh -5, cutoff 2500, slow, spectral 50%",
  },
  { tool: "Mouth De-click", settings: "sensitivity 4 (others 0)" },
  {
    tool: "Voice De-noise",
    settings: "adaptive, dialogue, surgical, reduc 12db, thresh 0",
  },
  {
    tool: "Voice De-crackle",
    settings: "quality high, strength 4, amp skew -5",
  },
];

export default function NotePad() {
  const [activeTab, setActiveTab] = useState("hotkeys");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // --- DATA STATES ---
  const [scratchpad, setScratchpad] = useState("");
  const [hotkeys, setHotkeys] = useState([]);
  const [chain, setChain] = useState(DEFAULT_CHAIN);

  // --- DB IDs ---
  const [ids, setIds] = useState({
    scratchpad: null,
    hotkeys: null,
    chain: null,
  });

  // --- FETCH DATA ---
  const fetchData = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("12_voiceover_notes")
      .select("*");

    if (error) {
      console.error("Error fetching notes:", error);
    } else if (data) {
      const scratchData = data.find((d) => d.category === "scratchpad");
      const hotkeyData = data.find((d) => d.category === "hotkeys");
      const chainData = data.find((d) => d.category === "chain_settings");

      if (scratchData) {
        setScratchpad(scratchData.content?.text || "");
        setIds((prev) => ({ ...prev, scratchpad: scratchData.id }));
      }

      if (hotkeyData) {
        setHotkeys(Array.isArray(hotkeyData.content) ? hotkeyData.content : []);
        setIds((prev) => ({ ...prev, hotkeys: hotkeyData.id }));
      }

      if (chainData) {
        if (Array.isArray(chainData.content)) {
          setChain(chainData.content);
        }
        setIds((prev) => ({ ...prev, chain: chainData.id }));
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- ACTIONS ---

  const handleSave = async () => {
    setSaving(true);
    const updates = [];

    const saveCategory = (category, id, content) => {
      if (id) {
        return supabase
          .from("12_voiceover_notes")
          .update({ content })
          .eq("id", id);
      } else {
        return supabase
          .from("12_voiceover_notes")
          .insert([{ category, title: category, content }]);
      }
    };

    updates.push(
      saveCategory("scratchpad", ids.scratchpad, { text: scratchpad })
    );
    updates.push(saveCategory("hotkeys", ids.hotkeys, hotkeys));
    updates.push(saveCategory("chain_settings", ids.chain, chain));

    await Promise.all(updates);

    if (!ids.scratchpad || !ids.hotkeys || !ids.chain) fetchData();

    setTimeout(() => setSaving(false), 500);
  };

  // Reordering Logic
  const moveItem = (index, direction, list, setList) => {
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === list.length - 1) return;

    const newList = [...list];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    [newList[index], newList[targetIndex]] = [
      newList[targetIndex],
      newList[index],
    ];
    setList(newList);
  };

  // Sorting Logic
  const sortList = (list, setList, key) => {
    const sorted = [...list].sort((a, b) =>
      (a[key] || "").localeCompare(b[key] || "")
    );
    setList(sorted);
  };

  // --- SMART HOTKEY CAPTURE ---
  const handleKeyDown = (e, index) => {
    e.preventDefault();
    e.stopPropagation();

    // Allow Tab to navigate away if needed, or prevent it to keep focus.
    // Here we prevent to stop jumping fields while recording.
    // if (e.key === 'Tab') return;

    // Don't record if only a modifier is held down
    if (["Meta", "Control", "Alt", "Shift"].includes(e.key)) return;

    const modifiers = [];
    if (e.metaKey) modifiers.push("Cmd");
    if (e.ctrlKey) modifiers.push("Ctrl");
    if (e.altKey) modifiers.push("Opt");
    if (e.shiftKey) modifiers.push("Shift");

    let char = e.code; // Use physical key code (KeyA) instead of produced char (å)

    // Clean up key codes to readable strings
    if (char.startsWith("Key")) {
      char = char.replace("Key", "");
    } else if (char.startsWith("Digit")) {
      char = char.replace("Digit", "");
    } else {
      // Manual map for common keys
      const codeMap = {
        Space: "Space",
        ArrowUp: "Up",
        ArrowDown: "Down",
        ArrowLeft: "Left",
        ArrowRight: "Right",
        Enter: "Enter",
        Escape: "Esc",
        Backspace: "Backspace",
        Delete: "Del",
        Tab: "Tab",
        Minus: "-",
        Equal: "=",
        BracketLeft: "[",
        BracketRight: "]",
        Backslash: "\\",
        Semicolon: ";",
        Quote: "'",
        Comma: ",",
        Period: ".",
        Slash: "/",
        Backquote: "`",
        F1: "F1",
        F2: "F2",
        F3: "F3",
        F4: "F4",
        F5: "F5",
        F6: "F6",
        F7: "F7",
        F8: "F8",
        F9: "F9",
        F10: "F10",
        F11: "F11",
        F12: "F12",
      };
      char = codeMap[char] || e.key.toUpperCase();
    }

    const shortcutString = [...modifiers, char].join(" + ");

    const newKeys = [...hotkeys];
    newKeys[index].key = shortcutString;
    setHotkeys(newKeys);
  };

  // --- TAB CONTENT RENDERERS ---

  // 1. HOTKEYS TAB
  const renderHotkeys = () => (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center mb-4 shrink-0">
        <h3 className="text-[10px] font-black uppercase text-slate-500 tracking-widest flex items-center gap-2">
          <Command size={12} /> Audacity Shortcuts
        </h3>
        <div className="flex gap-2">
          <button
            onClick={() => sortList(hotkeys, setHotkeys, "action")}
            className="text-[10px] font-bold bg-slate-800 text-slate-400 px-3 py-1.5 rounded hover:bg-slate-700 transition-colors flex items-center gap-1"
            title="Sort Alphabetically"
          >
            <ArrowDownAZ size={12} />
          </button>
          <button
            onClick={() => setHotkeys([...hotkeys, { action: "", key: "" }])}
            className="text-[10px] font-bold bg-indigo-500/10 text-indigo-400 px-3 py-1.5 rounded hover:bg-indigo-500/20 transition-colors flex items-center gap-1"
          >
            <Plus size={12} /> Add
          </button>
        </div>
      </div>
      <div className="flex-grow overflow-y-auto pr-2 custom-scrollbar space-y-2">
        {hotkeys.map((item, idx) => (
          <div key={idx} className="flex gap-2 group items-center">
            <div className="flex flex-col gap-0.5 opacity-0 group-hover:opacity-50 hover:!opacity-100 transition-opacity">
              <button
                onClick={() => moveItem(idx, "up", hotkeys, setHotkeys)}
                disabled={idx === 0}
                className="hover:text-white disabled:opacity-20"
              >
                <ArrowUp size={10} />
              </button>
              <button
                onClick={() => moveItem(idx, "down", hotkeys, setHotkeys)}
                disabled={idx === hotkeys.length - 1}
                className="hover:text-white disabled:opacity-20"
              >
                <ArrowDown size={10} />
              </button>
            </div>
            <input
              className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-3 text-xs font-bold text-slate-300 focus:border-indigo-500 outline-none transition-colors placeholder:text-slate-600 placeholder:font-normal"
              placeholder="Action name..."
              value={item.action}
              onChange={(e) => {
                const newKeys = [...hotkeys];
                newKeys[idx].action = e.target.value;
                setHotkeys(newKeys);
              }}
            />
            <input
              className="w-48 bg-slate-950 border border-slate-700 rounded-lg px-3 py-3 text-xs font-black text-indigo-300 text-center font-mono focus:border-indigo-500 focus:text-white outline-none transition-colors cursor-pointer"
              placeholder="Press Keys..."
              value={item.key}
              onKeyDown={(e) => handleKeyDown(e, idx)}
              readOnly
            />
            <button
              onClick={() => {
                const newKeys = hotkeys.filter((_, i) => i !== idx);
                setHotkeys(newKeys);
              }}
              className="p-2 text-slate-600 hover:text-red-400 hover:bg-red-900/10 rounded transition-all opacity-50 group-hover:opacity-100"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
        {hotkeys.length === 0 && (
          <div className="text-center py-10 text-slate-600 text-xs italic">
            No shortcuts saved yet.
          </div>
        )}
      </div>
    </div>
  );

  // 2. CHAIN SETTINGS TAB
  const renderChain = () => (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center mb-4 shrink-0 p-3 bg-green-500/10 border border-green-500/20 rounded-xl">
        <div className="flex items-center gap-2">
          <Zap size={14} className="text-green-500" />
          <span className="text-[10px] font-black uppercase text-green-200 tracking-wider">
            RX Master Chain
          </span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => sortList(chain, setChain, "tool")}
            className="text-[10px] font-bold bg-green-900/40 text-green-400 px-2 py-1 rounded hover:bg-green-900/60 transition-colors"
            title="Sort Alphabetically"
          >
            <ArrowDownAZ size={14} />
          </button>
          <button
            onClick={() => setChain([...chain, { tool: "", settings: "" }])}
            className="text-[10px] font-bold bg-green-500/20 text-green-400 px-2 py-1 rounded hover:bg-green-500/30 transition-colors flex items-center gap-1"
          >
            <Plus size={12} /> Add Step
          </button>
        </div>
      </div>

      <div className="flex-grow overflow-y-auto pr-2 custom-scrollbar space-y-2">
        {chain.map((item, idx) => (
          <div
            key={idx}
            className="flex gap-2 group items-start bg-slate-900/50 p-3 rounded-xl border border-transparent hover:border-slate-700 transition-all"
          >
            <div className="flex flex-col gap-1 pt-1 opacity-0 group-hover:opacity-50 hover:!opacity-100 transition-opacity text-slate-500">
              <button
                onClick={() => moveItem(idx, "up", chain, setChain)}
                disabled={idx === 0}
                className="hover:text-white disabled:opacity-20"
              >
                <ArrowUp size={12} />
              </button>
              <button
                onClick={() => moveItem(idx, "down", chain, setChain)}
                disabled={idx === chain.length - 1}
                className="hover:text-white disabled:opacity-20"
              >
                <ArrowDown size={12} />
              </button>
            </div>

            <div className="flex-grow space-y-1">
              <input
                className="w-full bg-transparent border-none p-0 text-xs font-black text-green-400 focus:text-white outline-none placeholder:text-slate-600"
                placeholder="Tool Name (e.g. De-Ess)"
                value={item.tool}
                onChange={(e) => {
                  const newChain = [...chain];
                  newChain[idx].tool = e.target.value;
                  setChain(newChain);
                }}
              />
              <input
                className="w-full bg-transparent border-none p-0 text-[11px] font-mono text-slate-400 focus:text-slate-200 outline-none placeholder:text-slate-700"
                placeholder="Settings parameters..."
                value={item.settings}
                onChange={(e) => {
                  const newChain = [...chain];
                  newChain[idx].settings = e.target.value;
                  setChain(newChain);
                }}
              />
            </div>

            <button
              onClick={() => {
                const newChain = chain.filter((_, i) => i !== idx);
                setChain(newChain);
              }}
              className="p-1 text-slate-600 hover:text-red-400 hover:bg-red-900/10 rounded transition-all opacity-0 group-hover:opacity-100"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  // 3. SCRATCHPAD TAB
  const renderScratchpad = () => (
    <div className="h-full flex flex-col">
      <textarea
        className="flex-grow w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-xs md:text-sm font-mono text-slate-300 focus:border-indigo-500 outline-none resize-none placeholder:text-slate-600 leading-relaxed custom-scrollbar"
        placeholder="Session codes, reminders, or quick thoughts..."
        value={scratchpad}
        onChange={(e) => setScratchpad(e.target.value)}
      />
    </div>
  );

  return (
    <div className="bg-[#0f172a] flex flex-col h-full overflow-hidden">
      {/* HEADER TABS */}
      <div className="flex border-b border-slate-800 bg-[#0f172a] shrink-0">
        <button
          onClick={() => setActiveTab("hotkeys")}
          className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${
            activeTab === "hotkeys"
              ? "text-white bg-slate-800 border-b-2 border-indigo-500"
              : "text-slate-500 hover:text-slate-300"
          }`}
        >
          <Keyboard size={14} /> Keys
        </button>
        <button
          onClick={() => setActiveTab("chain")}
          className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${
            activeTab === "chain"
              ? "text-white bg-slate-800 border-b-2 border-green-500"
              : "text-slate-500 hover:text-slate-300"
          }`}
        >
          <Sliders size={14} /> Chain
        </button>
        <button
          onClick={() => setActiveTab("scratchpad")}
          className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${
            activeTab === "scratchpad"
              ? "text-white bg-slate-800 border-b-2 border-yellow-500"
              : "text-slate-500 hover:text-slate-300"
          }`}
        >
          <StickyNote size={14} /> Notes
        </button>
      </div>

      {/* BODY */}
      <div className="p-4 flex-grow relative overflow-hidden">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center text-slate-600">
            <Loader2 className="animate-spin" size={24} />
          </div>
        ) : (
          <div className="h-full animate-in fade-in duration-300">
            {activeTab === "hotkeys" && renderHotkeys()}
            {activeTab === "chain" && renderChain()}
            {activeTab === "scratchpad" && renderScratchpad()}
          </div>
        )}
      </div>

      {/* FOOTER ACTION */}
      <div className="p-3 border-t border-slate-800 bg-slate-900/50 flex justify-end shrink-0">
        <button
          onClick={handleSave}
          disabled={saving || loading}
          className="flex items-center gap-2 px-6 py-2.5 bg-white hover:bg-indigo-50 text-slate-900 rounded-lg text-xs font-black uppercase tracking-widest shadow-lg transition-all active:scale-95 disabled:opacity-50"
        >
          {saving ? (
            <RefreshCw className="animate-spin" size={14} />
          ) : (
            <Save size={14} />
          )}
          {saving ? "Saving..." : "Save Notes"}
        </button>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #334155;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #475569;
        }
      `}</style>
    </div>
  );
}
