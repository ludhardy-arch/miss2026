// src/components/FinalShow.jsx
import React, { useState, useEffect, useContext } from "react";
import confetti from "canvas-confetti";
import { calculatePoints } from "../services/points";
import { AppContext } from "../context/AppContext";

export default function FinalShow({ players, adminSelections, isAdmin }) {
  const { updateFinaleStarted } = useContext(AppContext) || {};

  const [phase, setPhase] = useState("intro");
  const [countdown, setCountdown] = useState(5);
  const [step, setStep] = useState(0); // pour les révélations progressives

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

  // Compte à rebours intro
  useEffect(() => {
    if (phase !== "intro" || countdown <= 0) return;
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, countdown]);

  useEffect(() => {
    if (countdown === 0 && phase === "intro") {
      setTimeout(() => setPhase("reveal"), 1000);
    }
  }, [countdown, phase]);

  // Avancer automatiquement dans les révélations
  useEffect(() => {
    if (phase !== "reveal") return;
    if (step >= ranking.length + 5) return; // un peu d'attente après le gagnant

    const timer = setTimeout(() => setStep(s => s + 1), step < ranking.length - 5 ? 3200 : step < ranking.length - 1 ? 6000 : 4000);
    return () => clearTimeout(timer);
  }, [phase, step, ranking.length]);

  // Confettis uniquement à la fin
  useEffect(() => {
    if (step === ranking.length + 2 && winner) {
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#ffd700', '#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24']
      });
    }
  }, [step, winner]);

  const quit = () => {
    if (confirm("Quitter le show ?")) updateFinaleStarted?.(false);
  };

  const currentPlayer = step < ranking.length ? ranking[ranking.length - 1 - step] : null;

  return (
    <>
      {/* FOND MISS FRANCE 100% MOBILE */}
      <div style={{
        position: "fixed",
        inset: 0,
        background: "linear-gradient(135deg, #0f0f3d 0%, #000428 50%, #000814 100%)",
        zIndex: 9998,
      }} />

      {/* LUMIÈRES BLEUES + DORÉES */}
      <div style={{
        position: "fixed",
        inset: 0,
        background: `
          radial-gradient(circle at 20% 20%, rgba(100,150,255,0.4), transparent 50%),
          radial-gradient(circle at 80% 80%, rgba(255,215,0,0.4), transparent 50%)
        `,
        pointerEvents: "none",
        zIndex: 9999,
      }} />

      <div style={{
        position: "fixed",
        inset: 0,
        zIndex: 10000,
        display: "flex",
        flexDirection: "column",
        fontFamily: "'Bebas Neue', Arial, sans-serif",
        color: "white",
        textAlign: "center",
      }}>

        {/* HEADER */}
        <div style={{
          padding: "15px 20px",
          background: "rgba(0,0,0,0.7)",
          fontSize: "1.8rem",
          letterSpacing: "4px",
          textShadow: "0 0 20px #ffd700",
        }}>
          MISS PRONO 2026
          {isAdmin && (
            <button onClick={quit} style={{
              position: "absolute",
              right: 15,
              top: 15,
              padding: "8px 16px",
              background: "#c00",
              border: "none",
              borderRadius: 20,
              fontSize: "0.9rem",
            }}>
              Quitter
            </button>
          )}
        </div>

        {/* CONTENU CENTRAL */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "20px" }}>

          {/* INTRO */}
          {phase === "intro" && (
            <div>
              <div style={{ fontSize: "3.2rem", marginBottom: "2rem", lineHeight: 1.2 }}>
                Miss France<br />est élue…
              </div>
              <div style={{ fontSize: "2.8rem", margin: "2rem 0", color: "#ffd700" }}>
                Mais pour nous<br />QUI A GAGNÉ ?
              </div>
              <div style={{
                fontSize: countdown > 0 ? "12rem" : "5rem",
                fontWeight: 900,
                marginTop: "3rem",
                textShadow: "0 0 40px #ffd700",
              }}>
                {countdown > 0 ? countdown : "GO !"}
              </div>
            </div>
          )}

          {/* RÉVÉLATIONS EN COURS */}
          {phase === "reveal" && currentPlayer && step < ranking.length - 5 && (
            <div style={{ animation: "zoomIn 1.5s ease-out" }}>
              <div style={{ fontSize: "5.5rem", fontWeight: 900, marginBottom: "1rem" }}>
                {currentPlayer.pseudo}
              </div>
              <div style={{ fontSize: "3rem", color: "#aaa" }}>
                {currentPlayer.rank}ème place
              </div>
            </div>
          )}

          {/* TOP 5 */}
          {phase === "reveal" && step >= ranking.length - 5 && step < ranking.length - 1 && (
            <div>
              <div style={{ fontSize: "3.5rem", marginBottom: "3rem", color: "#ffd700" }}>
                {step === ranking.length - 5 ? "LES 5 FINALISTES" : `${5 - (step - (ranking.length - 5))}ème dauphine`}
              </div>
              {top5[step - (ranking.length - 5)] && (
                <div style={{ fontSize: "6rem", fontWeight: 900, textShadow: "0 0 60px #ffd700" }}>
                  {top5[step - (ranking.length - 5)].pseudo}
                </div>
              )}
            </div>
          )}

          {/* LE GRAND FINAL */}
          {phase === "reveal" && step >= ranking.length - 1 && winner && (
            <div>
              <div style={{ fontSize: "4rem", marginBottom: "2rem", color: "#ffd700" }}>
                MISS PRONO 2026
              </div>
              <div style={{
                fontSize: "7rem",
                fontWeight: 900,
                textShadow: "0 0 80px #ffd700, 0 0 120px #ff4500",
                margin: "2rem 0",
              }}>
                {winner.pseudo}
              </div>
              <div style={{ fontSize: "3rem", color: "#ffd700" }}>
                Championne incontestée !
              </div>
            </div>
          )}

        </div>

        {/* CLASSEMENT FINAL EN BAS */}
        {phase === "reveal" && step >= ranking.length && (
          <div style={{
            background: "rgba(0,0,0,0.8)",
            padding: "20px",
            borderRadius: "20px 20px 0 0",
            fontSize: "1.5rem",
          }}>
            {top5.map((p, i) => (
              <div key={p.pseudo} style={{
                padding: "12px 0",
                borderBottom: i < 4 ? "1px solid #333" : "none",
                fontWeight: p.rank === 1 ? "bold" : "normal",
                color: p.rank === 1 ? "#ffd700" : "white",
              }}>
                {i === 0 ? "1er" : `${i + 1}ème`} → {p.pseudo} ({p.points} pts)
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
