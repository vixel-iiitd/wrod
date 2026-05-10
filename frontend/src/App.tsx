import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useSocket } from "./hooks/useSocket";
import Lobby from "./components/Lobby";
import PatternDisplay from "./components/PatternDisplay";
import AnswerInput from "./components/AnswerInput";
import PlayerFeed from "./components/PlayerFeed";
import RoundReveal from "./components/RoundReveal";
import Leaderboard from "./components/Leaderboard";
import SolveToast from "./components/SolveToast";
import ScoreBar from "./components/ScoreBar";
import GameBackground from "./components/GameBackground";
import Chat from "./components/Chat";

export default function App() {
  const {
    connected,
    roomState,
    playerId,
    error,
    lastSubmit,
    submissionCount,
    toasts,
    chatMessages,
    createRoom,
    joinRoom,
    startGame,
    restartGame,
    submitAnswer,
    sendChatMessage,
    clearError,
    clearSubmit,
  } = useSocket();

  const [timeLeft, setTimeLeft] = useState(15_000);
  const [countdownNum, setCountdownNum] = useState(3);

  const roundDurationMs = (roomState?.settings?.roundDurationSec ?? 15) * 1000;

  useEffect(() => {
    if (roomState?.phase !== "countdown") {
      setCountdownNum(3);
      return;
    }
    setCountdownNum(3);
    const t1 = setTimeout(() => setCountdownNum(2), 1000);
    const t2 = setTimeout(() => setCountdownNum(1), 2000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [roomState?.phase]);

  useEffect(() => {
    if (roomState?.phase !== "active" || !roomState.currentRound) return;
    const start = roomState.currentRound.startTime;
    const tick = () => {
      const elapsed = Date.now() - start;
      setTimeLeft(Math.max(0, roundDurationMs - elapsed));
    };
    tick();
    const id = setInterval(tick, 100);
    return () => clearInterval(id);
  }, [roomState?.phase, roomState?.currentRound?.startTime, roundDurationMs]);

  const phase = roomState?.phase;
  const round = roomState?.currentRound;
  const submitted = submissionCount ?? { count: round?.submittedCount ?? 0, total: roomState?.players.length ?? 0 };
  const timerFraction = timeLeft / roundDurationMs;

  const me = roomState?.players.find((p) => p.id === playerId);
  const isHost = me?.isHost ?? false;

  const inRoom = !!roomState;
  const showChat = inRoom;

  return (
    <>
    <GameBackground category={roomState?.category ?? null} />
    <div className="min-h-screen flex">
      <div className={`flex-1 flex flex-col items-center justify-center p-4 ${phase && phase !== "lobby" ? "pt-16" : ""}`}>
        {!connected && (
          <div className="fixed top-3 right-3 bg-red-900 text-red-300 text-xs px-3 py-1 rounded-full z-50">
            connecting…
          </div>
        )}

        <SolveToast toasts={toasts} />

        {phase && phase !== "lobby" && roomState && (
          <ScoreBar
            roomCode={roomState.roomCode}
            players={roomState.players}
            leaderboard={roomState.leaderboard}
            playerId={playerId}
          />
        )}

        <AnimatePresence mode="wait">
          {/* Lobby / no room */}
          {(!phase || phase === "lobby") && (
            <motion.div key="lobby" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full">
              <Lobby
                roomState={roomState}
                playerId={playerId}
                error={error}
                onCreateRoom={createRoom}
                onJoinRoom={joinRoom}
                onStartGame={startGame}
                onClearError={clearError}
              />
            </motion.div>
          )}

          {/* Countdown */}
          {phase === "countdown" && (
            <motion.div key="countdown" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center">
              <p className="text-gray-400 mb-6">Round {(roomState?.roundNumber ?? 0) + 1} of {roomState?.totalRounds}</p>
              <div className="relative flex items-center justify-center h-36">
                <AnimatePresence mode="popLayout">
                  <motion.div
                    key={countdownNum}
                    initial={{ scale: 1.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.4, opacity: 0 }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                    className="absolute text-9xl font-extrabold text-yellow-400 tabular-nums"
                  >
                    {countdownNum}
                  </motion.div>
                </AnimatePresence>
              </div>
              <p className="text-gray-400 mt-4 animate-pulse">Get ready…</p>
            </motion.div>
          )}

          {/* Active round */}
          {phase === "active" && round && (
            <motion.div key="active" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-8 w-full max-w-lg">
              <div className="w-full flex items-center justify-between text-sm text-gray-400">
                <span>Round {round.roundNumber} / {roomState?.totalRounds}</span>
                <span className={`font-bold tabular-nums ${timeLeft < 5000 ? "text-red-400 animate-pulse-fast" : "text-white"}`}>
                  {(timeLeft / 1000).toFixed(1)}s
                </span>
              </div>

              {/* Timer bar */}
              <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                <motion.div
                  className={`h-full rounded-full ${timerFraction > 0.4 ? "bg-yellow-400" : timerFraction > 0.2 ? "bg-orange-400" : "bg-red-500"}`}
                  style={{ width: `${timerFraction * 100}%` }}
                  transition={{ ease: "linear" }}
                />
              </div>

              <PatternDisplay pattern={round.pattern} />

              <AnswerInput
                pattern={round.pattern}
                onSubmit={submitAnswer}
                lastSubmit={lastSubmit}
                onClearSubmit={clearSubmit}
                disabled={false}
              />

              <PlayerFeed submittedCount={submitted.count} totalPlayers={submitted.total} />
            </motion.div>
          )}

          {/* Reveal */}
          {phase === "reveal" && round && (
            <motion.div key="reveal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-6 w-full max-w-lg">
              <h2 className="text-2xl font-extrabold text-yellow-400">Round Over!</h2>
              <RoundReveal
                pattern={round.pattern}
                answer={round.answer}
                description={round.description}
                submissions={round.submissions}
                totalPlayers={roomState?.players.length ?? 0}
              />
            </motion.div>
          )}

          {/* Between-round leaderboard */}
          {phase === "leaderboard" && (
            <motion.div key="leaderboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full max-w-sm">
              <Leaderboard entries={roomState?.leaderboard ?? []} playerId={playerId} />
            </motion.div>
          )}

          {/* Final */}
          {phase === "finished" && (
            <motion.div key="finished" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-8 w-full max-w-sm">
              <Leaderboard entries={roomState?.leaderboard ?? []} playerId={playerId} isFinal />
              {isHost ? (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={restartGame}
                  className="bg-yellow-400 hover:bg-yellow-300 text-black font-extrabold px-8 py-4 rounded-2xl text-lg"
                >
                  Play Again
                </motion.button>
              ) : (
                <p className="text-gray-500 text-sm animate-pulse">Waiting for host to start again…</p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {showChat && (
        <Chat
          messages={chatMessages}
          playerId={playerId}
          onSend={sendChatMessage}
        />
      )}
    </div>
    </>
  );
}
