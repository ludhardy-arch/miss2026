// src/components/FinalShow.jsx
import React, { useState, useEffect, useRef, useContext } from "react";
import confetti from "canvas-confetti";
import { calculatePoints } from "../services/points";
import { AppContext } from "../context/AppContext";

const FinalShow = ({ players, adminSelections, isAdmin }) => {
  const { updateFinaleStarted } = useContext(AppContext) || {};

  const [phase, setPhase] = useState("intro"); // intro → bottom → top5 → dauphines → duel → winner
  const [countdown, setCountdown] = useState(5);
  const [currentRevealIndex, setCurrentRevealIndex] = useState(0);
  const [currentDauphine, setCurrentDauphine] = useState(4); // 4 → 1
  const [revealedRanks, setRevealedRanks] = useState({});

  const confettiRef = useRef(false);

  // Classement complet
  const ranking = React.useMemo(() => {
    return Object.entries(players || {})
      .map(([pseudo, votes]) => ({
        pseudo,
        points: calculatePoints(votes, adminSelections),
      }))
      .sort((a, b) => b.points - a.points)
      .map((p, i) => ({ ...p, rank: i + 1 }));
  }, [players, adminSelections]);

  const total = ranking.length;
  const winner = ranking[0];
  const top5 = ranking.slice(0, 5);

  // =============== PHASES AUTOMATIQUES ===============
  // Intro → compte à rebours
  useEffect(() => {
    if (phase !== "intro" || countdown <= 0) return;
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, countdown]);

  useEffect(() => {
    if (phase === "intro" && countdown === 0) {
      setTimeout(() => {
        setPhase(total > 5 ? "bottom" : "top5");
      }, 1200);
    }
  }, [phase, countdown, total]);

  // Révélation du bas vers le 6e
  useEffect(() => {
    if (phase !== "bottom") return;
    if (currentRevealIndex >= Math.max(0, total - 5)) {
      setTimeout(() => setPhase("top5"), 2000);
      return;
    }
    const player = ranking[total - 1 - currentRevealIndex];
    if (player) {
      setRevealedRanks(prev => ({ ...prev, [player.rank]: true }));
    }
    const t = setTimeout(() => setCurrentRevealIndex(i => i + 1), 3000);
    return () => clearTimeout(t);
  }, [phase, currentRevealIndex, ranking, total]);

  // Dauphines
  useEffect(() => {
    if (phase !== "dauphines") return;
    if (currentDauphine < 1) {
      setTimeout(() => setPhase("duel"), 3000);
      return;
    }
    const rankToReveal = currentDauphine + 1; // 5,4,3,2
    const player = ranking.find(p => p.rank === rankToReveal);
    if (player) {
      setTimeout(() => {
        setRevealedRanks(prev => ({ ...prev, [rankToReveal]: true }));
      }, 4000);
    }
    const t = setTimeout(() => setCurrentDauphine(c => c - 1), 8000);
    return () => clearTimeout(t);
  }, [phase, currentDauphine, ranking]);

  // Duel → Winner
  useEffect(() => {
    if (phase === "duel") {
      setTimeout(() => setPhase("winner"), 7000);
    }
    if (phase === "winner" && winner && !confettiRef.current) {
      confettiRef.current = true;
      const duration = 4 * 1000;
      const end = Date.now() + duration;
      (function frame() {
        confetti({ particleCount: 8, angle: 60, spread: 55, origin: { x: 0 } });
        confetti({ particleCount: 8, angle: 120, spread: 55, origin: { x: 1 } });
        if (Date.now() < end) requestAnimationFrame(frame);
      })();
    }
  }, [phase, winner]);

  const quitShow = () => {
    if (window.confirm("Quitter le show final ?")) {
      updateFinaleStarted?.(false);
    }
  };

  return (
    <>
      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Montserrat:wght@700;900&display=swap');

        @keyframes slowPulse { 0%,100% { opacity: 0.9; } 50% { opacity: 1; } }
        @keyframes spotlight { 0% { transform: translateX(-50%) rotate(2deg); } 100% { transform: translateX(-50%) rotate(-2deg); } }
        @keyframes flyIn { from { transform: translateY(200px) scale(0.3); opacity: 0; } to { transform: translateY(0) scale(1); opacity: 1; } }
        @keyframes nameZoom { 0% { transform: scale(0) translateY(300px); opacity: 0; } 60% { transform: scale(1.15); } 100% { transform: scale(1); opacity: 1; } }
        @keyframes pulse { 0% { transform: scale(0.8); } 50% { transform: scale(1.4); } 100% { transform: scale(1); } }
        @keyframes glow { 0%,100% { text-shadow: 0 0 20px #ffd700; } 50% { text-shadow: 0 0 80px #ff4500; } }
      `}</style>

      {/* FOND PLATEAU MISS FRANCE */}
      <div style={{
        position: "fixed", inset: 0, zIndex: 9998,
        background: `
          radial-gradient(circle at 20% 10%, rgba(100,150,255,0.35), transparent 50%),
          radial-gradient(circle at 80% 90%, rgba(255,200,100,0.3), transparent 50%),
          linear-gradient(135deg, #0a001f 0%, #000428 50%, #000814 100%)
        `,
        animation: "slowPulse 30s ease-in-out infinite",
      }} />

      {/* PROJECTEURS */}
      <div style={{
        position: "absolute", width: "1000px", height: "1000px", top: "-300px", left: "50%", transform: "translateX(-50%)",
        background: "radial-gradient(circle, rgba(255,255,255,0.18), transparent 65%)",
        animation: "spotlight 15s ease-in-out infinite alternate",
        pointerEvents: "none",
      }} />

      <div style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", flexDirection: "column", fontFamily: "'Bebas Neue', sans-serif", color: "white" }}>

        {/* HEADER */}
        <div style={{ padding: "15px 30px", background: "rgba(0,0,0,0.6)", textAlign: "center", position: "relative" }}>
          <h1 style={{ fontSize: "2.8rem", letterSpacing: "8px", textShadow: "0 0 30px #ffd700" }}>
            MISS PRONO 2026 – RÉSULTATS OFFICIELS
          </h1>
          {isAdmin && (
            <button onClick={quitShow} style={{
              position: "absolute", right: 20, top: 20, padding: "10px 20px", background: "rgba(255,255,255,0.2)",
              border: "1px solid rgba(255,215,0,0.6)", borderRadius: 30, color: "white", cursor: "pointer"
            }}>
              Quitter le show
            </button>
          )}
        </div>

        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>

          {/* CLASSEMENT À GAUCHE */}
          <div style={{
            position: "absolute", left: 30, top: 100, bottom: 100, width: 400, background: "rgba(0,0,0,0.7)",
            borderRadius: 24, padding: 25, border: "2px solid rgba(255,215,0,0.4)", overflowY: "auto"
          }}>
            <h2 style={{ textAlign: "center", marginBottom: 20, fontSize: "1.8rem" }}>CLASSEMENT</h2>
            {ranking.map(p => (
              <div key={p.pseudo} style={{
                padding: "14px 20px", margin: "8px 0", borderRadius: 16, fontSize: "1.4rem",
                background: revealedRanks[p.rank]
                  ? p.rank === 1 ? "linear-gradient(90deg, #ffd700, #ff8c00)" : "rgba(255,255,255,0.15)"
                  : "rgba(255,255,255,0.05)",
                color: revealedRanks[p.rank] && p.rank === 1 ? "black" : "white",
                fontWeight: revealedRanks[p.rank] ? "bold" : "normal",
                transition: "all 0.6s"
              }}>
                <strong>{p.rank === 1 ? "1er" : `${p.rank}ème`}</strong> – {revealedRanks[p.rank] ? p.pseudo : "???"}
                {revealedRanks[p.rank] && <span style={{ float: "right" }}>{p.points} pts</span>}
              </div>
            ))}
          </div>

          {/* CENTRE SCÈNE */}
          <div style={{ textAlign: "center", zIndex: 10 }}>

            {/* INTRO */}
            {phase === "intro" && (
              <>
                <div style={{ fontSize: "5rem", animation: "flyIn 1.8s ease-out" }}>
                  Miss France est élue…
                </div>
                <div style={{ fontSize: "4rem", marginTop: 30, animation: "flyIn 2s ease-out 0.6s both" }}>
                  Mais pour nous…<br />QUI a gagné ?
                </div>
                <div style={{ fontSize: countdown > 0 ? "14rem" : "7rem", marginTop: 60, animation: countdown > 0 ? "pulse 0.8s" : "" }}>
                  {countdown > 0 ? countdown : "RÉSULTATS !"}
                </div>
              </>
            )}

            {/* RÉVÉLATION BOTTOM */}
            {phase === "bottom" && ranking[total - 1 - currentRevealIndex] && (
              <div style={{ animation: "nameZoom 2s ease-out" }}>
                <div style={{ fontSize: "7rem", animation: "glow 3s infinite" }}>
                  {ranking[total - 1 - currentRevealIndex].pseudo}
                </div>
                <div style={{ fontSize: "3rem", marginTop: 20 }}>
                  {ranking[total - 1 - currentRevealIndex].rank}ème place
                </div>
              </div>
            )}

            {/* TOP 5 */}
            {phase === "top5" && (
              <div style={{ maxWidth: 1200, margin: "0 auto" }}>
                <h2 style={{ fontSize: "4rem", marginBottom: 40 }}>LES 5 FINALISTES</h2>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 30 }}>
                  {top5.map((p, i) => (
                    <div key={p.pseudo} style={{
                      padding: "30px 10px", borderRadius: 30, fontSize: "2.2rem", fontWeight: 900,
                      background: i === 0 ? "linear-gradient(135deg, #ffd700, #ff8c00)" : "rgba(255,255,255,0.15)",
                      color: i === 0 ? "black" : "white",
                      boxShadow: i === 0 ? "0 0 80px #ffd700" : "0 0 30px rgba(255,215,0,0.4)",
                      transform: i === 0 ? "scale(1.2)" : "scale(1)",
                    }}>
                      {i === 0 && "Crown"}
                      {p.pseudo}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* DAUPHINES */}
            {phase === "dauphines" && (
              <>
                <div style={{ fontSize: "5rem" }}>
                  {currentDauphine === 4 ? "4ème" : currentDauphine === 3 ? "3ème" : currentDauphine === 2 ? "2ème" : "1ère"} dauphine…
                </div>
                {revealedRanks[currentDauphine + 1] && (
                  <div style={{ fontSize: "8rem", marginTop: 50, animation: "nameZoom 2s ease-out" }}>
                    {ranking.find(p => p.rank === currentDauphine + 1)?.pseudo}
                  </div>
                )}
              </>
            )}

            {/* DUEL FINAL */}
            {phase === "duel" && (
              <div style={{ animation: "pulse 2s infinite" }}>
                <div style={{ fontSize: "5rem" }}>
                  MISS PRONO 2026 est… et restera…
                </div>
              </div>
            )}

            {/* GAGNANT */}
            {phase === "winner" && winner && (
              <div style={{ textAlign: "center" }}>
                <div style={{
                  width: 420, height: 420, borderRadius: "50%", margin: "0 auto 40px",
                  background: "radial-gradient(circle, #fffbe6, #ffd700, #b8860b)",
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                  boxShadow: "0 0 120px #ffd700, 0 0 200px #ff4500",
                  animation: "pulse 3s infinite"
                }}>
                  <div style={{ fontSize: "5rem", marginBottom: 20 }}>Crown</div>
                  <div style={{ fontSize: "4.5rem", fontWeight: 900, color: "#000" }}>
                    {winner.pseudo}
                  </div>
                  <div style={{ marginTop: 20, fontSize: "2rem", color: "#000", fontWeight: "bold" }}>
                    MISS PRONO 2026
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </>
  );
};

export default FinalShow;
