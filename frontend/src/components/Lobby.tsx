import { useState } from "react";
import { motion } from "framer-motion";
import { RoomState, Player, Category, CATEGORIES, CATEGORY_CONFIG, RoomSettings } from "../types";

interface Props {
  roomState: RoomState | null;
  playerId: string | null;
  error: string | null;
  onCreateRoom: (name: string, category: Category, settings: Partial<RoomSettings>) => void;
  onJoinRoom: (code: string, name: string) => void;
  onStartGame: () => void;
  onClearError: () => void;
}

const ROUND_OPTIONS = [3, 5, 8, 10, 15];
const DURATION_OPTIONS = [10, 15, 20, 30];
const WORD_LENGTH_OPTIONS: { value: RoomSettings["wordLength"]; label: string }[] = [
  { value: "any", label: "Any length" },
  { value: "short", label: "Short (3–5)" },
  { value: "medium", label: "Medium (5–8)" },
  { value: "long", label: "Long (8+)" },
];

export default function Lobby({ roomState, playerId, error, onCreateRoom, onJoinRoom, onStartGame, onClearError }: Props) {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [mode, setMode] = useState<"home" | "create" | "join">("home");
  const [selectedCategory, setSelectedCategory] = useState<Category>("general");
  const [totalRounds, setTotalRounds] = useState(8);
  const [roundDurationSec, setRoundDurationSec] = useState(15);
  const [wordLength, setWordLength] = useState<RoomSettings["wordLength"]>("any");

  const me = roomState?.players.find((p) => p.id === playerId);
  const isHost = me?.isHost ?? false;

  if (roomState) {
    const catConfig = CATEGORY_CONFIG[roomState.category];
    const settings = roomState.settings;
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-8 p-6">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <p className="text-gray-400 text-sm mb-1">Room Code</p>
          <h2 className="text-5xl font-extrabold tracking-widest text-yellow-400">
            {roomState.roomCode}
          </h2>
          <p className="text-gray-500 text-xs mt-2">Share this with friends</p>
          <div className="mt-3 inline-flex items-center gap-2 bg-gray-800 border border-gray-700 rounded-full px-4 py-1.5">
            <span className="text-yellow-400 font-bold text-sm">{catConfig.label}</span>
            <span className="text-gray-500 text-xs">·</span>
            <span className="text-gray-400 text-xs">{catConfig.description}</span>
          </div>
          {settings && (
            <div className="mt-2 flex items-center justify-center gap-3 text-xs text-gray-500">
              <span>{settings.totalRounds} rounds</span>
              <span>·</span>
              <span>{settings.roundDurationSec}s each</span>
              <span>·</span>
              <span>{WORD_LENGTH_OPTIONS.find(o => o.value === settings.wordLength)?.label ?? "Any length"}</span>
            </div>
          )}
        </motion.div>

        <div className="w-full max-w-sm space-y-2">
          <p className="text-gray-400 text-sm mb-3">{roomState.players.length} player{roomState.players.length !== 1 ? "s" : ""} in lobby</p>
          {roomState.players.map((p: Player) => (
            <motion.div
              key={p.id}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className="flex items-center gap-3 bg-gray-800 rounded-lg px-4 py-3"
            >
              <div className="w-2 h-2 rounded-full bg-green-400" />
              <span className="font-bold">{p.name}</span>
              {p.isHost && <span className="ml-auto text-xs text-yellow-400 font-bold">HOST</span>}
              {p.id === playerId && !p.isHost && <span className="ml-auto text-xs text-gray-500">you</span>}
            </motion.div>
          ))}
        </div>

        {isHost && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onStartGame}
            disabled={roomState.players.length < 1}
            className="bg-green-500 hover:bg-green-400 text-black font-extrabold px-10 py-4 rounded-2xl text-xl disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Start Game →
          </motion.button>
        )}
        {!isHost && (
          <p className="text-gray-500 text-sm animate-pulse">Waiting for host to start…</p>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-6">
      <motion.div
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="text-center mb-4"
      >
        <h1 className="text-6xl font-extrabold tracking-tight">
          <span className="text-yellow-400">WROD</span>
          <span className="text-white"> THREE</span>
        </h1>
        <p className="text-gray-400 mt-2">Fill the blanks. Beat the clock. Win.</p>
      </motion.div>

      {error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-red-900/50 border border-red-500 rounded-lg px-4 py-3 text-red-300 text-sm flex items-center gap-3"
        >
          {error}
          <button onClick={onClearError} className="ml-auto text-red-400 hover:text-red-200">✕</button>
        </motion.div>
      )}

      {mode === "home" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-4 w-full max-w-xs">
          <button
            onClick={() => setMode("create")}
            className="bg-yellow-400 hover:bg-yellow-300 text-black font-extrabold py-4 rounded-2xl text-lg transition-colors"
          >
            Create Room
          </button>
          <button
            onClick={() => setMode("join")}
            className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-4 rounded-2xl text-lg transition-colors"
          >
            Join Room
          </button>
        </motion.div>
      )}

      {mode === "create" && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-4 w-full max-w-xs">
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && name.trim() && onCreateRoom(name.trim(), selectedCategory, { totalRounds, roundDurationSec, wordLength })}
            placeholder="Your name"
            maxLength={20}
            className="bg-gray-800 border border-gray-600 rounded-xl px-4 py-3 text-white text-lg focus:outline-none focus:border-yellow-400"
          />

          {/* Category */}
          <div className="flex flex-col gap-2">
            <p className="text-gray-400 text-sm font-semibold">Category</p>
            <div className="grid grid-cols-2 gap-2">
              {CATEGORIES.map((cat) => {
                const cfg = CATEGORY_CONFIG[cat];
                const active = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`flex flex-col items-start px-3 py-2.5 rounded-xl border text-left transition-colors ${
                      active
                        ? "border-yellow-400 bg-yellow-400/10 text-yellow-400"
                        : "border-gray-600 bg-gray-800 text-gray-300 hover:border-gray-400"
                    }`}
                  >
                    <span className="font-bold text-sm">{cfg.label}</span>
                    <span className="text-xs text-gray-500 leading-tight">{cfg.description}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Room Settings */}
          <div className="flex flex-col gap-3 bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-3">
            <p className="text-gray-400 text-sm font-semibold">Room Settings</p>

            <div className="flex flex-col gap-1">
              <p className="text-gray-500 text-xs">Rounds</p>
              <div className="flex gap-2 flex-wrap">
                {ROUND_OPTIONS.map((r) => (
                  <button
                    key={r}
                    onClick={() => setTotalRounds(r)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-colors ${
                      totalRounds === r
                        ? "bg-yellow-400 text-black"
                        : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <p className="text-gray-500 text-xs">Time per round</p>
              <div className="flex gap-2 flex-wrap">
                {DURATION_OPTIONS.map((d) => (
                  <button
                    key={d}
                    onClick={() => setRoundDurationSec(d)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-colors ${
                      roundDurationSec === d
                        ? "bg-yellow-400 text-black"
                        : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                    }`}
                  >
                    {d}s
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <p className="text-gray-500 text-xs">Word length</p>
              <div className="flex gap-2 flex-wrap">
                {WORD_LENGTH_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setWordLength(opt.value)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-colors ${
                      wordLength === opt.value
                        ? "bg-yellow-400 text-black"
                        : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={() => name.trim() && onCreateRoom(name.trim(), selectedCategory, { totalRounds, roundDurationSec, wordLength })}
            className="bg-yellow-400 hover:bg-yellow-300 text-black font-extrabold py-4 rounded-2xl text-lg transition-colors"
          >
            Create Room
          </button>
          <button onClick={() => setMode("home")} className="text-gray-500 hover:text-gray-300 text-sm">← Back</button>
        </motion.div>
      )}

      {mode === "join" && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-4 w-full max-w-xs">
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            maxLength={20}
            className="bg-gray-800 border border-gray-600 rounded-xl px-4 py-3 text-white text-lg focus:outline-none focus:border-yellow-400"
          />
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === "Enter" && name.trim() && code.trim() && onJoinRoom(code.trim(), name.trim())}
            placeholder="Room code"
            maxLength={4}
            className="bg-gray-800 border border-gray-600 rounded-xl px-4 py-3 text-white text-lg tracking-widest uppercase focus:outline-none focus:border-yellow-400"
          />
          <button
            onClick={() => name.trim() && code.trim() && onJoinRoom(code.trim(), name.trim())}
            className="bg-yellow-400 hover:bg-yellow-300 text-black font-extrabold py-4 rounded-2xl text-lg transition-colors"
          >
            Join Room
          </button>
          <button onClick={() => setMode("home")} className="text-gray-500 hover:text-gray-300 text-sm">← Back</button>
        </motion.div>
      )}
    </div>
  );
}
