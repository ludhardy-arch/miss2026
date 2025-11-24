// src/components/FinaleOverlay.jsx

import React, { useEffect, useMemo, useState, useContext } from "react";
import confetti from "canvas-confetti";
import { calculatePoints } from "../services/points";
import { AppContext } from "../context/AppContext";

const styles = {
  overlay: {
    position: "fixed",
    inset: 0,
    zIndex: 9999,
    background:
      "radial-gradient(circle at top, #24163b 0, #05030a 40%, #000 100%)",
    color: "white",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  inner: {
    maxWidth: 900,
    width: "100%",
    textAlign: "center",
    position: "relative",
  },
  title: {
    fontSize: 32,
    marginBottom: 16,
    textTransform: "uppercase",
    letterSpacing: 4,
  },
  subtitle: {
    fontSize: 18,
    opacity: 0.8,
    marginBottom: 20,
  },
  countdown: {
    fontSize: 80,
    fontWeight: "bold",
  },
  countResult: {
    fontSize: 40,
    marginTop: 10,
  },
  listContainer: {
    marginTop: 20,
    maxHeight: 400,
    overflowY: "auto",
    padding: "0 10px",
  },
  row: {
    padding: "8px 12px",
    marginBottom: 6,
    borderRadius: 8,
    background: "rgba(0,0,0,0.5)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: 18,
  },
  rowRank: {
    fontWeight: "bold",
    marginRight: 8,
  },
  rowName: {
    flex: 1,
    textAlign: "left",
  },
  rowPoints: {
    fontWeight: "bold",
    minWidth: 80,
    textAlign: "right",
  },
  podiumWrapper: {
    marginTop: 30,
  },
  podiumTitle: {
    fontSize: 28,
    marginBottom: 16,
  },
  podium: {
    display: "flex",
    justifyContent: "center",
    alignItems: "flex-end",
    gap: 16,
    marginTop: 20,
  },
  podiumCol: (height, isWinner) => ({
    width: 120,
    height,
    borderRadius: "18px 18px 0 0",
    background: isWinner
      ? "linear-gradient(180deg, #ffd700, #b8860b)"
      : "linear-gradient(180deg, #c0c0c0, #666)",
    display: "flex",
    flexDirection: "column",
    justifyContent: "flex-end",
    alignItems: "center",
    padding: "12px 8px",
    boxShadow: isWinner
      ? "0 0 25px rgba(255,215,0,0.8)"
      : "0 0 15px rgba(0,0,0,0.6)",
    position: "relative",
  }),
  podiumName: {
    fontWeight: "bold",
    marginBottom: 4,
  },
  podiumPoints: {
    fontSize: 14,
    opacity: 0.9,
  },
  crown: {
    position: "absolute",
    top: -40,
    fontSize: 32,
    filter: "drop-shadow(0 0 8px rgba(255,215,0,0.9))",
  },
  quitButton: {
    position: "absolute",
    top: 10,
    right: 10,
    padding: "6px 12px",
    fontSize: 14,
    borderRadius: 999,
    border: "none",
    cursor: "pointer",
    background: "rgba(0,0,0,0.7)",
    color: "white",
  },
};

const introKeyframes = `
@keyframes sponsorFadeIn {
  0% { opacity: 0; transform: translateY(20px); }
  100% { opacity: 1; transform: translateY(0); }
}
@keyframes logoPop {
  0% { transform: scale(0.3) rotate(-10deg); opacity: 0; }
  60% { transform: scale(1.08) rotate(2deg); opacity: 1; }
  100% { transform: scale(1) rotate(0); }
}
@keyframes haloGlow {
  0% { box-shadow: 0 0 6px rgba(255,215,0,0.4); }
  50% { box-shadow: 0 0 22px rgba(255,215,0,1); }
  100% { box-shadow: 0 0 6px rgba(255,215,0,0.4); }
}
@keyframes winnerPulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.03); }
  100% { transform: scale(1); }
}
`;

export default function FinaleOverlay({ players, adminSelections, isAdmin }) {
  const { updateFinaleStarted } = useContext(AppContext) || {};
  const [phase, setPhase] = useState("sponsor"); // sponsor → countdown → reveal → podium
  const [countdown, setCountdown] = useState(5);
  const [revealedCount, setRevealedCount] = useState(0);

  // Calcul du classement global (du 1er au dernier)
  const rankingDesc = useMemo(() => {
    return Object.entries(players)
      .map(([pseudo, votes]) => ({
        pseudo,
        points: calculatePoints(votes, adminSelections),
      }))
      .sort((a, b) => b.points - a.points);
  }, [players, adminSelections]);

  // Ordre de révélation : du dernier au premier
  const rankingAsc = useMemo(
    () => [...rankingDesc].reverse(),
    [rankingDesc]
  );

  const totalPlayers = rankingDesc.length;

  // 🎬 Phase sponsor Malounette avant le compte à rebours
  useEffect(() => {
    if (phase !== "sponsor") return;
    const timer = setTimeout(() => {
      setPhase("countdown");
    }, 4000); // 4 secondes d'écran sponsor
    return () => clearTimeout(timer);
  }, [phase]);

  // ⏱️ Compte à rebours 5 → 4 → … → 1 → Résultat !!!
  useEffect(() => {
    if (phase !== "countdown") return;
    if (countdown < -1) return;

    const timer = setTimeout(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    if (countdown === -1) {
      // passage automatique à la phase reveal
      setPhase("reveal");
    }

    return () => clearTimeout(timer);
  }, [phase, countdown]);

  // 📜 Révélation du dernier au premier toutes les 4 secondes
  useEffect(() => {
    if (phase !== "reveal") return;
    if (revealedCount >= totalPlayers) {
      // une fois tout le monde révélé → podium
      const t = setTimeout(() => setPhase("podium"), 1500);
      return () => clearTimeout(t);
    }

    const interval = setInterval(() => {
      setRevealedCount((prev) => {
        if (prev >= totalPlayers) {
          clearInterval(interval);
          return prev;
        }
        return prev + 1;
      });
    }, 4000); // 4 secondes entre chaque joueur

    return () => clearInterval(interval);
  }, [phase, revealedCount, totalPlayers]);

  // 🎇 Feux d’artifice + confettis sur le podium
  useEffect(() => {
    if (phase !== "podium") return;

    // petit burst de confettis
    const duration = 3000;
    const end = Date.now() + duration;

    (function frame() {
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
      });
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    })();
  }, [phase]);

  const handleQuit = () => {
    if (
      !window.confirm(
        "Quitter le show final ? Les joueurs ne verront plus le classement animé."
      )
    )
      return;

    if (updateFinaleStarted) {
      updateFinaleStarted(false);
    }
  };

  // Top 3 pour le podium
  const top3 = rankingDesc.slice(0, 3);

  // ------------------------------------------------
  // RENDU DES DIFFÉRENTES PHASES
  // ------------------------------------------------

  const renderSponsor = () => (
    <div style={{ animation: "sponsorFadeIn 0.7s ease-out" }}>
      <h2 style={{ fontSize: 26, marginBottom: 10 }}>
        Cette finale Miss 2026 vous est présentée par…
      </h2>

      <div
        style={{
          marginTop: 20,
          display: "flex",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            padding: "12px 26px",
            borderRadius: 999,
            background:
              "radial-gradient(circle at top, #ffe066, #ffb300, #ff8800)",
            color: "#3b1600",
            fontWeight: "bold",
            fontSize: 26,
            display: "inline-flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 4,
            animation: "logoPop 0.9s ease-out",
          }}
        >
          <span>🍺 Malounette</span>
          <span
            style={{
              fontSize: 12,
              textTransform: "uppercase",
              letterSpacing: 2,
            }}
          >
            La bière qui mérite sa couronne
          </span>
        </div>
      </div>
    </div>
  );

  const renderCountdown = () => (
    <>
      <h2 style={styles.subtitle}>Préparez-vous au classement final…</h2>
      <div style={styles.countdown}>
        {countdown > 0 ? countdown : "RÉSULTAT !!!"}
      </div>
    </>
  );

  const renderReveal = () => {
    const revealedPlayers = rankingAsc.slice(0, revealedCount);

    return (
      <>
        <h2 style={styles.subtitle}>Du dernier au premier…</h2>
        <div style={styles.listContainer}>
          {revealedPlayers.map((p, index) => {
            const globalIndex = index; // index dans la liste ascendante
            const position = totalPlayers - globalIndex; // 1 = meilleur

            const isBottom = position > 3;
            const isTop3 = position <= 3;

            const label =
              position === 1
                ? "1er"
                : position === 2
                ? "2ème"
                : position === 3
                ? "3ème"
                : `${position}ème`;

            return (
              <div
                key={p.pseudo}
                style={{
                  ...styles.row,
                  background: isTop3
                    ? "linear-gradient(90deg, rgba(255,215,0,0.2), rgba(0,0,0,0.7))"
                    : "rgba(0,0,0,0.6)",
                  transform: isTop3 ? "scale(1.02)" : "scale(1)",
                  border:
                    position === 1
                      ? "1px solid rgba(255,215,0,0.8)"
                      : "1px solid transparent",
                }}
              >
                <span style={styles.rowRank}>{label}</span>
                <span style={styles.rowName}>{p.pseudo}</span>
                <span style={styles.rowPoints}>{p.points} pts</span>
              </div>
            );
          })}
        </div>
      </>
    );
  };

  const renderPodium = () => {
    if (top3.length === 0) return null;

    const [first, second, third] = top3;

    return (
      <div style={styles.podiumWrapper}>
        <h2 style={styles.podiumTitle}>Podium final</h2>

        <div style={{ fontSize: 18, opacity: 0.85 }}>
          Bravo à tous, et félicitations à{" "}
          <strong>{first?.pseudo}</strong> 🏆
        </div>

        <div style={styles.podium}>
          {/* 2ème */}
          {second && (
            <div style={styles.podiumCol(130, false)}>
              <div style={{ fontSize: 18, marginBottom: 6 }}>2ème</div>
              <div style={styles.podiumName}>{second.pseudo}</div>
              <div style={styles.podiumPoints}>{second.points} pts</div>
            </div>
          )}

          {/* 1er */}
          {first && (
            <div
              style={{
                ...styles.podiumCol(170, true),
                animation: "winnerPulse 1.7s ease-in-out infinite",
              }}
            >
              <div style={styles.crown}>👑</div>
              <div style={{ fontSize: 20, marginBottom: 6 }}>1er</div>
              <div style={styles.podiumName}>{first.pseudo}</div>
              <div style={styles.podiumPoints}>{first.points} pts</div>
            </div>
          )}

          {/* 3ème */}
          {third && (
            <div style={styles.podiumCol(110, false)}>
              <div style={{ fontSize: 18, marginBottom: 6 }}>3ème</div>
              <div style={styles.podiumName}>{third.pseudo}</div>
              <div style={styles.podiumPoints}>{third.points} pts</div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div style={styles.overlay}>
      <style>{introKeyframes}</style>

      <div style={styles.inner}>
        {isAdmin && (
          <button style={styles.quitButton} onClick={handleQuit}>
            Quitter le show
          </button>
        )}

        <h1 style={styles.title}>Classement officiel des joueurs</h1>

        {phase === "sponsor" && renderSponsor()}
        {phase === "countdown" && renderCountdown()}
        {phase === "reveal" && renderReveal()}
        {phase === "podium" && renderPodium()}
      </div>
    </div>
  );
}
