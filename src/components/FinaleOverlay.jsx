// src/components/FinalShow.jsx  →  VERSION FINALE 100% VALIDÉE PAR TOI

import React, { useState, useEffect, useContext } from "react";
import confetti from "canvas-confetti";
import { calculatePoints } from "../services/points";
import { AppContext } from "../context/AppContext";

export default function FinalShow({ players, adminSelections, isAdmin }) {
  const { updateFinaleStarted } = useContext(AppContext) || {};

  const [phase, setPhase] = useState("intro");
  const [introStep, setIntroStep] = useState(0);
  const [countdown, setCountdown] = useState(5);
  const [step, setStep] = useState(0);
  const [showNameDelay, setShowNameDelay] = useState(false);

  // NOUVEAU : étapes précises du couronnement final
  const [crowningStep, setCrowningStep] = useState(0); // 0 = rien, 1 = "MISS PRONO 2026", 2 = "est ET restera…", 3 = prénom + confettis

  const ranking = React.useMemo(() => {
    return Object.entries(players || {})
      .map(([pseudo, votes]) => ({
        pseudo,
        points: calculatePoints(votes, adminSelections),
      }))
      .sort((a, b) => b.points - a.points)
      .map((p, i) => ({ ...p, rank: i + 1 }));
  }, [players, adminSelections]);

  const winner = ranking[0];
  const top5 = ranking.slice(0, 5);
  const currentPlayer = step < ranking.length ? ranking[ranking.length - 1 - step] : null;

  // INTRO
  useEffect(() => {
    if (phase !== "intro") return;

    if (introStep === 0) {
      const t = setTimeout(() => setIntroStep(1), 4000);
      return () => clearTimeout(t);
    }
    if (introStep === 1) {
      const t = setTimeout(() => setIntroStep(2), 4000);
      return () => clearTimeout(t);
    }
    if (introStep === 2 && countdown > 0) {
      const t = setTimeout(() => setCountdown(c => c - 1), 1000);
      return () => clearTimeout(t);
    }
    if (introStep === 2 && countdown === 0) {
      setTimeout(() => setPhase("reveal"), 2000);
    }
  }, [phase, introStep, countdown]);

  // RÉVÉLATIONS
  useEffect(() => {
    if (phase !== "reveal") return;
    if (step >= ranking.length + 10) return;

    setShowNameDelay(false);

    // Quand on arrive au gagnant → on déclenche le couronnement spécial
    if (step === ranking.length - 1) {
      setCrowningStep(1);
      const t1 = setTimeout(() => setCrowningStep(2), 2000);
      const t2 = setTimeout(() => {
        setCrowningStep(3);
        // Confettis au moment du prénom
        confetti({
          particleCount: 300,
          spread: 100,
          origin: { y: 0.55 },
          colors: ['#ffd700', '#ff6b6b', '#4ecdc4', '#ffeaa7', '#fab1a0']
        });
      }, 4000);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }

    const delayTimer = setTimeout(() => setShowNameDelay(true), 2500);

    const nextTimer = setTimeout(() => {
      setStep(s => s + 1);
    }, step < ranking.length - 5 ? 5000 : step < ranking.length - 1 ? 8000 : 6000);

    return () => {
      clearTimeout(delayTimer);
      clearTimeout(nextTimer);
    };
  }, [phase, step, ranking.length]);

  const quit = () => {
    if (confirm("Quitter le show ?")) updateFinaleStarted?.(false);
  };

  return (
    <>
      {/* FOND + LUMIÈRES */}
      <div style={{ position: "fixed", inset: 0, background: "linear-gradient(135deg, #0f0f3d 0%, #000428 50%, #000814 100%)", zIndex: 9998 }} />
      <div style={{
        position: "fixed", inset: 0,
        background: `radial-gradient(circle at 20% 20%, rgba(100,150,255,0.4), transparent 50%), radial-gradient(circle at 80% 80%, rgba(255,215,0,0.4), transparent 50%)`,
        pointerEvents: "none", zIndex: 9999,
      }} />

      <div style={{
        position: "fixed", inset: 0, zIndex: 10000,
        display: "flex", flexDirection: "column",
        fontFamily: "'Bebas Neue', Arial, sans-serif", color: "white", textAlign: "center",
      }}>

        {/* HEADER */}
        <div style={{
          padding: "15px 20px", background: "rgba(0,0,0,0.7)", fontSize: "1.8rem", letterSpacing: "4px",
          textShadow: "0 0 20px #ffd700", position: "relative",
        }}>
          MISS PRONO 2026
          {isAdmin && (
            <button onClick={quit} style={{
              position: "absolute", right: 15, top: 15, padding: "8px 16px", background: "#c00",
              border: "none", borderRadius: 20, fontSize: "0.9rem", cursor: "pointer",
            }}>
              Quitter
            </button>
          )}
        </div>

        {/* CONTENU */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "20px" }}>

          {/* INTRO */}
          {phase === "intro" && (
            <div>
              {introStep >= 0 && <div style={{ fontSize: "3.2rem", marginBottom: "2rem", lineHeight: 1.2 }}>Miss France<br />est élue…</div>}
              {introStep >= 1 && <div style={{ fontSize: "2.8rem", margin: "2rem 0", color: "#ffd700" }}>Mais pour nous<br />QUI A GAGNÉ ?</div>}
              {introStep >= 2 && (
                <div style={{
                  fontSize: countdown > 0 ? "12rem" : "5rem", fontWeight: 900, marginTop: "3rem",
                  textShadow: "0 0 40px #ffd700",
                }}>
                  {countdown > 0 ? countdown : "GO !"}
                </div>
              )}
            </div>
          )}

          {/* BOTTOM PLACES */}
          {phase === "reveal" && currentPlayer && step < ranking.length - 5 && (
            <div style={{ animation: "zoomIn 1.5s ease-out" }}>
              <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>
                À la {currentPlayer.rank}ème place :
              </div>
              {showNameDelay && <div style={{ fontSize: "5.5rem", fontWeight: 900 }}>{currentPlayer.pseudo}</div>}
            </div>
          )}

          {/* DAUPHINES */}
          {phase === "reveal" && step >= ranking.length - 5 && step < ranking.length - 1 && (
            <div>
              <div style={{ fontSize: "3.5rem", marginBottom: "3rem", color: "#ffd700" }}>
                {5 - (step - (ranking.length - 5))}ème dauphine :
              </div>
              {showNameDelay && top5[step - (ranking.length - 5)] && (
                <div style={{ fontSize: "6rem", fontWeight: 900, textShadow: "0 0 60px #ffd700" }}>
                  {top5[step - (ranking.length - 5)].pseudo}
                </div>
              )}
            </div>
          )}

          {/* COURONNEMENT FINAL – LA MAGIE */}
          {phase === "reveal" && step >= ranking.length - 1 && winner && (
            <div style={{ minHeight: "60vh", display: "flex", flexDirection: "column", justifyContent: "center" }}>
              {crowningStep >= 1 && (
                <div style={{ fontSize: "5rem", color: "#ffd700", marginBottom: "2rem", animation: "zoomIn 1.5s" }}>
                  MISS PRONO 2026
                </div>
              )}
              {crowningStep >= 2 && (
                <div style={{ fontSize: "4rem", margin: "2rem 0", animation: "zoomIn 1.5s 0.5s both" }}>
                  est ET restera…
                </div>
              )}
              {crowningStep >= 3 && (
                <div style={{
                  fontSize: "8rem", fontWeight: 900,
                  textShadow: "0 0 100px #ffd700, 0 0 160px #ff4500",
                  animation: "zoomIn 2s 1s both",
                }}>
                  {winner.pseudo}
                </div>
              )}
            </div>
          )}

        </div>

        {/* CLASSEMENT FINAL SCROLLABLE */}
        {phase === "reveal" && step >= ranking.length && crowningStep === 3 && (
          <div style={{
            background: "rgba(0,0,0,0.8)", padding: "20px", borderRadius: "20px 20px 0 0",
            fontSize: "1.5rem", overflowY: "auto", maxHeight: "50vh",
          }}>
            <h3 style={{ fontSize: "2rem", marginBottom: "1rem" }}>Classement Final</h3>
            {ranking.map((p, i) => (
              <div key={p.pseudo} style={{
                padding: "12px 0",
                borderBottom: i < ranking.length - 1 ? "1px solid #333" : "none",
                fontWeight: p.rank === 1 ? "bold" : "normal",
                color: p.rank === 1 ? "#ffd700" : "white",
              }}>
                {p.rank === 1 ? "1er" : `${p.rank}ème`} → {p.pseudo} ({p.points} pts)
              </div>
            ))}
          </div>
        )}
      </div>

      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap');
        @keyframes zoomIn {
          0% { transform: scale(0.3); opacity: 0; }
          70% { transform: scale(1.1); }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </>
  );
}
