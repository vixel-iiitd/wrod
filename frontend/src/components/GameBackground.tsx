import { motion, AnimatePresence } from "framer-motion";
import { Category } from "../types";

export default function GameBackground({ category }: { category: Category | null }) {
  return (
    <AnimatePresence>
      {category === "chess" && (
        <motion.div
          key="chess-bg"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.8, ease: "easeInOut" }}
          className="fixed inset-0 -z-10 pointer-events-none overflow-hidden"
        >
          {/* Chess board squares — warm amber tones, very subtle */}
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "repeating-conic-gradient(rgba(180, 136, 70, 0.08) 0% 25%, transparent 0% 50%)",
              backgroundSize: "84px 84px",
            }}
          />

          {/* Large king silhouette — centered watermark */}
          <div
            className="absolute inset-0 flex items-center justify-center select-none"
            style={{ opacity: 0.045 }}
          >
            <span
              style={{
                fontSize: "68vmin",
                lineHeight: 1,
                filter: "blur(2px)",
              }}
            >
              ♚
            </span>
          </div>

          {/* Radial vignette — darkens the edges heavily, keeps center breathable */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse 70% 65% at 50% 50%, transparent 10%, rgba(9,9,11,0.82) 100%)",
            }}
          />

          {/* Top strip fade — so ScoreBar area blends cleanly */}
          <div
            className="absolute inset-x-0 top-0 h-36"
            style={{
              background: "linear-gradient(to bottom, rgba(9,9,11,0.9), transparent)",
            }}
          />

          {/* Bottom strip fade */}
          <div
            className="absolute inset-x-0 bottom-0 h-36"
            style={{
              background: "linear-gradient(to top, rgba(9,9,11,0.9), transparent)",
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
