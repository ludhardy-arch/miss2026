// src/components/FinalShow.jsx → VERSION FINALE CORRIGÉE
import React, { useState, useEffect, useContext } from "react";
import confetti from "canvas-confetti";
import { calculatePoints } from "../services/points";
import { AppContext } from "../context/AppContext";

export default function FinalShow({ players, adminSelections, isAdmin }) {
  const { updateFinaleStarted } = useContext(AppContext) || {};

  const [phase, setPhase] = useState("intro");
  const [introStep, setIntroStep] = useState(0);
  const [countdown, setCountdown] = useState(5);
  const [revealIndex, setRevealIndex] = useState(0); // 0 = dernier, augmente jusqu’au gagnant
  const [showName, setShowName] = useState(false);
  const [winnerStep, setWinnerStep] = useState(0); // 0-1-2-3 pour le couronnement

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

  // INTRO
  useEffect(() => {
    if (phase !== "intro") return;
    if (introStep === 0) setTimeout(() => setIntroStep(1), 4000);
    else if (introStep === 1) setTimeout(() => setIntroStep(2), 4000);
    else if (introStep === 2 && countdown > 0) {
      const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
      return () => clearTimeout(t);
    } else if (countdown === 0)
      setTimeout(() => setPhase("reveal"), 1500);
  }, [phase, introStep, countdown]);

  // RÉVÉLATIONS AUTOMATIQUES
  useEffect(() => {
    if (phase !== "reveal") return;
    setShowName(false);
    setWinnerStep(0);

    // 1. Du dernier jusqu’au 6ème (si existe)
    if (revealIndex < Math.max(0, total - 6)) {
      setTimeout(() => setShowName(true), 2500);
      const next = setTimeout(() => setRevealIndex((i) => i + 1), 5500);
      return () => clearTimeout(next);
    }

    // 2. 5ème → 4ème → 3ème → 2ème place = les 4 dauphines
    else if (revealIndex < total - 1) {
      setTimeout(() => setShowName(true), 2500);
      const next = setTimeout(() => setRevealIndex((i) => i + 1), 7000);
      return () => clearTimeout(next);
    }

    // 3. Gagnante – séquence épique
    else if (revealIndex === total - 1) {
      const t1 = setTimeout(() => setWinnerStep(1), 2000);
      const t2 = setTimeout(() => setWinnerStep(2), 4500);
      const t3 = setTimeout(() => {
        setWinnerStep(3);
        confetti({ particleCount: 300, spread: 100, origin: { y: 0.55 } });
        setTimeout(() => confetti({ particleCount: 200, spread: 120 }), 500);

        // 🔥 AJOUT : afficher automatiquement le CLASSEMENT FINAL
        setTimeout(() => setRevealIndex(total), 4000);

      }, 7000);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
      };
    }
  }, [phase, revealIndex, total]);

  const quit = () =>
    confirm("Quitter le show ?") && updateFinaleStarted?.(false);

  // Joueur actuellement révélé (sauf la gagnante)
  const current =
    revealIndex < total - 1
      ? ranking[total - 1 - revealIndex]
      : null;

  return (
    <>
      {/* FOND + LUMIÈRES */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          background:
            "linear-gradient(135deg, #0f0f3d 0%, #000428 50%, #000814 100%)",
          zIndex: 9998,
        }}
      />
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: `radial-gradient(circle at 20% 20%, rgba(100,150,255,0.4), transparent 50%), radial-gradient(circle at 80% 80%, rgba(255,215,0,0.4), transparent 50%)`,
          pointerEvents: "none",
          zIndex: 9999,
        }}
      />

      <div
        style={{
          position: "fixed",
          inset: 0,
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
          }}
        >

          {/* INTRO */}
          {phase === "intro" && (
            <div>
              {introStep >= 0 && (
                <div
                  style={{
                    fontSize: "3.2rem",
                    marginBottom: "2rem",
                    lineHeight: 1.2,
                  }}
                >
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

          {/* BAS DU CLASSEMENT (dernier → 6ème) */}
          {phase === "reveal" &&
            revealIndex < Math.max(0, total - 6) &&
            current && (
              <div>
                <div style={{ fontSize: "3rem" }}>
                  À la {current.rank}ème place :
                </div>
                {showName && (
                  <div
                    style={{
                      fontSize: "5.5rem",
                      fontWeight: 900,
                      marginTop: "2rem",
                      animation: "zoomIn 1.8s ease-out",
                    }}
                  >
                    {current.pseudo}
                  </div>
                )}
              </div>
            )}

          {/* LES 4 DAUPHINES (5ème → 2ème) */}
          {phase === "reveal" &&
            revealIndex >= Math.max(0, total - 6) &&
            revealIndex < total - 1 &&
            current && (
              <div>
                <div
                  style={{
                    fontSize: "3.8rem",
                    color: "#ffd700",
                  }}
                >
                  {
                    Math.min(
                      4,
                      Math.max(
                        1,
                        5 -
                          (revealIndex -
                            Math.max(0, total - 6))
                      )
                    )
                  }
                  ème dauphine :
                </div>

                {showName && (
                  <div
                    style={{
                      fontSize: "6.5rem",
                      fontWeight: 900,
                      textShadow: "0 0 70px #ffd700",
                      marginTop: "2rem",
                      animation: "zoomIn 1.8s ease-out",
                    }}
                  >
                    {current.pseudo}
                  </div>
                )}
              </div>
            )}

          {/* GAGNANTE – SÉQUENCE DE FOU */}
          {phase === "reveal" &&
            revealIndex === total - 1 &&
            winner && (
              <div>
                {winnerStep >= 1 && (
                  <div
                    style={{
                      fontSize: "5rem",
                      color: "#ffd700",
                    }}
                  >
                    MISS PRONO 2026
                  </div>
                )}
                {winnerStep >= 2 && (
                  <div
                    style={{
                      fontSize: "4.5rem",
                      margin: "2rem 0",
                    }}
                  >
                    est ET restera...
                  </div>
                )}
                {winnerStep >= 3 && (
                  <div
                    style={{
                      fontSize: "8rem",
                      fontWeight: 900,
                      textShadow:
                        "0 0 120px #ffd700, 0 0 200px #ff4500",
                      animation: "zoomIn 2s ease-out",
                    }}
                  >
                    {winner.pseudo}
                  </div>
                )}
              </div>
            )}
        </div>

        {/* CLASSEMENT FINAL SCROLLABLE */}
        {phase === "reveal" && revealIndex >= total && (
          <div
            style={{
              background: "rgba(0,0,0,0.85)",
              padding: "25px 20px",
              borderRadius: "20px 20px 0 0",
              maxHeight: "50vh",
              overflowY: "auto",
            }}
          >
            <h3
              style={{
                fontSize: "2.2rem",
                marginBottom: "20px",
                color: "#ffd700",
              }}
            >
              CLASSEMENT FINAL
            </h3>

            {ranking.map((p, i) => (
              <div
                key={p.pseudo}
                style={{
                  padding: "14px 0", 
                  borderBottom:
                    i < total - 1
                      ? "1px solid #444"
                      : "none",
                  fontSize: "1.6rem",
                  fontWeight:
                    p.rank === 1 ? "bold" : "normal",
                  color:
                    p.rank === 1 ? "#ffd700" : "white",
                }}
              >
                {p.rank === 1 ? "1er" : `${p.rank}ème`} →{" "}
                {p.pseudo} ({p.points} pts)
              </div>
            ))}
          </div>
        )}
      </div>

      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap');

        @keyframes zoomIn {
          0% {
            transform: scale(0.2);
            opacity: 0;
          }
          70% {
            transform: scale(1.1);
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
