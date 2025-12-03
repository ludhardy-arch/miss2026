// src/components/FinalShow.jsx
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
  const [winnerPhase, setWinnerPhase] = useState(0);

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

  // INTRO
  useEffect(() => {
    if (phase !== "intro") return;
    let timer;

    if (introStep === 0) {
      timer = setTimeout(() => setIntroStep(1), 4000);
    } else if (introStep === 1) {
      timer = setTimeout(() => setIntroStep(2), 4000);
    } else if (introStep === 2 && countdown > 0) {
      timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    } else if (introStep === 2 && countdown === 0) {
      timer = setTimeout(() => setPhase("reveal"), 1800);
    }

    return () => clearTimeout(timer);
  }, [phase, introStep, countdown]);

  // RÉVÉLATION DU DERNIER AU 2ÈME
  useEffect(() => {
    if (phase !== "reveal" || step >= ranking.length - 1) return;

    setShowNameDelay(false);
    const timer = setTimeout(() => setShowNameDelay(true), 2500);
    const next = setTimeout(() => setStep((s) => s + 1), 5500);

    return () => {
      clearTimeout(timer);
      clearTimeout(next);
    };
  }, [phase, step, ranking.length]);

  // -------- FIX ANTI-BOUCLE --------
  useEffect(() => {
    if (
      phase === "reveal" &&
      step === ranking.length - 1 &&
      winnerPhase === 0
    ) {
      const t = setTimeout(() => setWinnerPhase(1), 3000);
      return () => clearTimeout(t);
    }
  }, [phase, step, ranking.length, winnerPhase]);

  useEffect(() => {
    let timer;
    let conf;

    if (winnerPhase === 1) {
      timer = setTimeout(() => setWinnerPhase(2), 3000);
    } else if (winnerPhase === 2) {
      timer = setTimeout(() => setWinnerPhase(3), 3000);
    } else if (winnerPhase === 3) {
      confetti({ particleCount: 300, spread: 100, origin: { y: 0.55 } });
      conf = setTimeout(() => {
        confetti({ particleCount: 200, spread: 120, origin: { y: 0.6 } });
      }, 400);
    }

    return () => {
      if (timer) clearTimeout(timer);
      if (conf) clearTimeout(conf);
    };
  }, [winnerPhase]);
  // ---------------------------------

  const quit = () =>
    confirm("Quitter le show ?") && updateFinaleStarted?.(false);

  const currentPlayer =
    step < ranking.length - 1 ? ranking[ranking.length - 1 - step] : null;

  return (
    <>
      {/* FOND */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(135deg, #0f0f3d 0%, #000428 50%, #000814 100%)",
          zIndex: 9998,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(circle at 20% 20%, rgba(100,150,255,0.4), transparent 50%),
                        radial-gradient(circle at 80% 80%, rgba(255,215,0,0.4), transparent 50%)`,
          pointerEvents: "none",
          zIndex: 9999,
        }}
      />

      {/* CONTENEUR PRINCIPAL MOBILE-FRIENDLY */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100dvh",
          overflowY: "auto",
          WebkitOverflowScrolling: "touch",
          zIndex: 10000,
          display: "flex",
          flexDirection: "column",
          fontFamily: "'Bebas Neue', Arial, sans-serif",
          color: "white",
          textAlign: "center",
        }}
      >
        {/* HEADER */}
        <div
          style={{
            padding: "15px 20px",
            background: "rgba(0,0,0,0.7)",
            fontSize: "1.8rem",
            letterSpacing: "4px",
            textShadow: "0 0 20px #ffd700",
            position: "relative",
          }}
        >
          MISS PRONO 2026
          {isAdmin && (
            <button
              onClick={quit}
              style={{
                position: "absolute",
                right: 15,
                top: 15,
                padding: "8px 16px",
                background: "#c00",
                border: "none",
                borderRadius: 20,
                fontSize: "0.9rem",
                cursor: "pointer",
              }}
            >
              Quitter
            </button>
          )}
        </div>

        {/* CONTENU CENTRAL */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: "20px",
            overflow: "visible", // important pour mobile
          }}
        >
          {/* INTRO */}
          {phase === "intro" && (
            <div>
              {introStep >= 0 && (
                <div style={{ fontSize: "3.2rem", marginBottom: "2rem" }}>
                  Miss France
                  <br />
                  est élue…
                </div>
              )}
              {introStep >= 1 && (
                <div
                  style={{
                    fontSize: "2.8rem",
                    margin: "2rem 0",
                    color: "#ffd700",
                  }}
                >
                  Mais pour nous
                  <br />
                  QUI A GAGNÉ ?
                </div>
              )}
              {introStep >= 2 && (
                <div
                  style={{
                    fontSize: countdown > 0 ? "12rem" : "5rem",
                    fontWeight: 900,
                    marginTop: "3rem",
                    textShadow: "0 0 40px #ffd700",
                  }}
                >
                  {countdown > 0 ? countdown : "GO !"}
                </div>
              )}
            </div>
          )}

          {/* REVEAL */}
          {phase === "reveal" && currentPlayer && (
            <div>
              <div style={{ fontSize: "3.2rem", marginBottom: "2rem" }}>
                À la {currentPlayer.rank}ème place :
              </div>
              {showNameDelay && (
                <div
                  style={{
                    fontSize: "6rem",
                    fontWeight: 900,
                    textShadow: "0 0 60px #ffd700",
                    animation: "zoomIn 1.8s ease-out",
                  }}
                >
                  {currentPlayer.pseudo}
                </div>
              )}
            </div>
          )}

          {/* GAGNANT */}
          {winnerPhase > 0 && winner && (
            <div
              style={{
                minHeight: "50vh",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
              }}
            >
              {winnerPhase >= 1 && (
                <div
                  style={{
                    fontSize: "5rem",
                    color: "#ffd700",
                    marginBottom: "2rem",
                    animation: "zoomIn 1.5s ease-out",
                  }}
                >
                  MISS PRONO 2026
                </div>
              )}
              {winnerPhase >= 2 && (
                <div
                  style={{
                    fontSize: "4.5rem",
                    margin: "2rem 0",
                    animation: "zoomIn 1.5s ease-out 0.5s both",
                  }}
                >
                  est ET restera...
                </div>
              )}
              {winnerPhase >= 3 && (
                <div
                  style={{
                    fontSize: "8rem",
                    fontWeight: 900,
                    textShadow:
                      "0 0 100px #ffd700, 0 0 160px #ff4500",
                    animation: "zoomIn 2s ease-out 1s both",
                  }}
                >
                  {winner.pseudo}
                </div>
              )}
            </div>
          )}
        </div>

        {/* CLASSEMENT FINAL MOBILE-FRIENDLY */}
        {winnerPhase === 3 && (
          <div
            style={{
              background: "rgba(0,0,0,0.85)",
              padding: "25px 20px",
              borderRadius: "20px 20px 0 0",
              maxHeight: "40dvh",
              overflowY: "auto",
            }}
          >
            <h3 style={{ fontSize: "2.2rem", marginBottom: "1.5rem" }}>
              Classement Final
            </h3>
            {ranking.map((p) => (
              <div
                key={p.pseudo}
                style={{
                  padding: "14px 0",
                  borderBottom: "1px solid #333",
                  fontSize: "1.6rem",
                  color: p.rank === 1 ? "#ffd700" : "white",
                  fontWeight: p.rank === 1 ? "bold" : "normal",
                }}
              >
                {p.rank === 1 ? "1er" : `${p.rank}ème`} → {p.pseudo} (
                {p.points} pts)
              </div>
            ))}
          </div>
        )}
      </div>

      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap');
        @keyframes zoomIn {
          0% {
            transform: scale(0.3);
            opacity: 0;
          }
          70% {
            transform: scale(1.15);
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </>
  );
}
