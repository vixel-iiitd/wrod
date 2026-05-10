import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChatMessage } from "../types";

interface Props {
  messages: ChatMessage[];
  playerId: string | null;
  onSend: (text: string) => void;
}

export default function Chat({ messages, playerId, onSend }: Props) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [unread, setUnread] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const prevLenRef = useRef(messages.length);

  useEffect(() => {
    if (open) {
      setUnread(0);
      prevLenRef.current = messages.length;
      setTimeout(() => inputRef.current?.focus(), 120);
    }
  }, [open]);

  useEffect(() => {
    if (open) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      setUnread(0);
      prevLenRef.current = messages.length;
    } else {
      const newCount = messages.length - prevLenRef.current;
      if (newCount > 0) setUnread((u) => u + newCount);
      prevLenRef.current = messages.length;
    }
  }, [messages]);

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setText("");
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-2">
      <AnimatePresence>
        {open && (
          <motion.div
            key="chat-panel"
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.95 }}
            transition={{ duration: 0.18 }}
            className="w-72 h-80 flex flex-col bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-gray-700 shrink-0">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Room Chat</span>
              <button
                onClick={() => setOpen(false)}
                className="text-gray-500 hover:text-gray-300 text-lg leading-none transition-colors"
              >
                ×
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2 min-h-0">
              {messages.length === 0 && (
                <p className="text-gray-600 text-xs text-center mt-4">No messages yet</p>
              )}
              {messages.map((msg) => {
                const isMe = msg.playerId === playerId;
                return (
                  <div key={msg.id} className={`flex flex-col gap-0.5 ${isMe ? "items-end" : "items-start"}`}>
                    {!isMe && (
                      <span className="text-xs text-gray-500 px-1">{msg.playerName}</span>
                    )}
                    <div
                      className={`max-w-[90%] px-3 py-1.5 rounded-2xl text-sm break-words ${
                        isMe
                          ? "bg-yellow-400 text-black rounded-br-sm"
                          : "bg-gray-700 text-white rounded-bl-sm"
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="px-2 py-2 border-t border-gray-700 flex gap-2 shrink-0">
              <input
                ref={inputRef}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Message…"
                maxLength={200}
                className="flex-1 bg-gray-800 border border-gray-600 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-yellow-400 min-w-0"
              />
              <button
                onClick={handleSend}
                disabled={!text.trim()}
                className="bg-yellow-400 hover:bg-yellow-300 text-black font-bold px-3 py-2 rounded-xl text-sm disabled:opacity-40 transition-colors shrink-0"
              >
                →
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle button */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={() => setOpen((o) => !o)}
        className="relative w-12 h-12 bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded-full shadow-lg flex items-center justify-center text-xl transition-colors"
      >
        {open ? "×" : "💬"}
        {!open && unread > 0 && (
          <span className="absolute -top-1 -right-1 bg-yellow-400 text-black text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </motion.button>
    </div>
  );
}
